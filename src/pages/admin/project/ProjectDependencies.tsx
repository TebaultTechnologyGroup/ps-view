import { useCallback, useMemo, useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { zodResolver } from "mantine-form-zod-resolver";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as z from "zod";
import { supabase } from "@/lib/supabase-client";
import RichTextField, { RichTextPreview } from "@/components/RichTextField";
import { useAuth } from "@/guards/AppContext";
import type { Database } from "@/lib/database.types";

type InlineField = "priority" | "status" | "owner_id" | "due_date";
type Dependency = Database["public"]["Tables"]["project_dependencies"]["Row"];
type Option = { value: string; label: string };

const LEVELS = ["low", "medium", "high"] as const;
const TYPES = ["internal", "external"] as const;
const DIRECTIONS = ["inbound", "outbound"] as const;
const STATUSES = ["open", "at_risk", "resolved", "cancelled"] as const;

const today = () => new Date().toISOString().slice(0, 10);

const makeSchema = (titleRequired: string) =>
  z.object({
    title: z.string().trim().min(1, titleRequired),
    description: z.string(),
    impact: z.string(),
    resolution: z.string(),
    dependency_type: z.enum(TYPES),
    direction: z.enum(DIRECTIONS),
    related_party: z.string(),
    priority: z.enum(LEVELS),
    status: z.enum(STATUSES),
    owner_id: z.string(),
    raised_by: z.string(),
    raised_date: z.string(),
    due_date: z.string(),
    resolved_date: z.string(),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;

const empty: Values = {
  title: "",
  description: "",
  impact: "",
  resolution: "",
  dependency_type: "external",
  direction: "inbound",
  related_party: "",
  priority: "medium",
  status: "open",
  owner_id: "",
  raised_by: "",
  raised_date: today(),
  due_date: "",
  resolved_date: "",
};

export default function ProjectDependencies() {
  const { t } = useTranslation();
  const levelOptions = LEVELS.map((v) => ({
    value: v,
    label: t(`dependency.level.${v}`),
  }));
  const typeOptions = TYPES.map((v) => ({
    value: v,
    label: t(`dependency.types.${v}`),
  }));
  const directionOptions = DIRECTIONS.map((v) => ({
    value: v,
    label: t(`dependency.directions.${v}`),
  }));
  const statusOptions = STATUSES.map((v) => ({
    value: v,
    label: t(`dependency.statuses.${v}`),
  }));
  const schema = useMemo(
    () =>
      makeSchema(t("validation.required", { field: t("dependency.fields.title") })),
    [t],
  );
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [editing, setEditing] = useState<Dependency | null>(null);
  const [deleting, setDeleting] = useState<Dependency | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, handlers] = useDisclosure(false);

  const form = useForm<Values>({
    initialValues: empty,
    validate: zodResolver(schema),
  });

  const load = useCallback(async () => {
    const [a, u] = await Promise.all([
      supabase
        .from("project_dependencies")
        .select("*")
        .eq("project_id", projectId!)
        .eq("deleted", false)
        .order("dependency_number", { ascending: true }),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "CAMUNDA")
        .eq("deleted", false),
    ]);
    const err = a.error ?? u.error;
    setError(err ? err.message : null);
    setDependencies(a.data ?? []);
    setUsers(
      (u.data ?? []).map((x) => ({
        value: x.id,
        label: x.full_name || x.email || x.id,
      })),
    );
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (r: Dependency | null) => {
    setEditing(r);
    form.setValues(
      r
        ? {
            title: r.title,
            description: r.description ?? "",
            impact: r.impact ?? "",
            resolution: r.resolution ?? "",
            dependency_type: r.dependency_type as Values["dependency_type"],
            direction: r.direction as Values["direction"],
            related_party: r.related_party ?? "",
            priority: r.priority as Values["priority"],
            status: r.status as Values["status"],
            owner_id: r.owner_id ?? "",
            raised_by: r.raised_by ?? "",
            raised_date: r.raised_date,
            due_date: r.due_date ?? "",
            resolved_date: r.resolved_date ?? "",
          }
        : { ...empty, raised_date: today(), raised_by: me?.userId ?? "" },
    );
    form.resetDirty();
    form.clearErrors();
    setFormError(null);
    handlers.open();
  };

  const submit = async (v: Values) => {
    setSaving(true);
    setFormError(null);
    const fields = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      impact: v.impact.trim() || null,
      resolution: v.resolution.trim() || null,
      dependency_type: v.dependency_type,
      direction: v.direction,
      related_party: v.related_party.trim() || null,
      priority: v.priority,
      status: v.status,
      owner_id: v.owner_id || null,
      raised_by: v.raised_by || null,
      raised_date: v.raised_date || today(),
      due_date: v.due_date || null,
      resolved_date: v.resolved_date || null,
      updated_by: me?.userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase
          .from("project_dependencies")
          .update(fields)
          .eq("id", editing.id)
      : await supabase.from("project_dependencies").insert({
          id: crypto.randomUUID(),
          project_id: projectId!,
          created_by: me?.userId,
          // assigned by the project_dependencies_assign_number trigger
          dependency_number: undefined as unknown as number,
          ...fields,
        });
    setSaving(false);
    if (error) return setFormError(error.message);
    handlers.close();
    await load();
  };

  // Inline edit: update the row optimistically, roll back if the save fails.
  const saveField = async (
    dependency: Dependency,
    field: InlineField,
    value: string | null,
  ) => {
    const previous = dependency[field];
    const patch = (v: string | null) =>
      setDependencies((rs) =>
        rs.map((x) => (x.id === dependency.id ? { ...x, [field]: v } : x)),
      );
    patch(value);
    const { error } = await supabase
      .from("project_dependencies")
      .update({
        [field]: value,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["project_dependencies"]["Update"])
      .eq("id", dependency.id);
    if (error) {
      patch(previous);
      setError(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("project_dependencies")
      .update({
        deleted: true,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deleting.id);
    setDeleting(null);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={500}>{t("dependency.title")}</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => open(null)}
        >
          {t("dependency.add")}
        </Button>
      </Group>
      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Table withTableBorder highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={80}>{t("dependency.fields.dependencyId")}</Table.Th>
            <Table.Th>{t("dependency.fields.title")}</Table.Th>
            <Table.Th>{t("dependency.fields.description")}</Table.Th>
            <Table.Th>{t("dependency.fields.type")}</Table.Th>
            <Table.Th>{t("dependency.fields.relatedParty")}</Table.Th>
            <Table.Th>{t("dependency.fields.priority")}</Table.Th>
            <Table.Th>{t("dependency.fields.status")}</Table.Th>
            <Table.Th>{t("dependency.fields.owner")}</Table.Th>
            <Table.Th>{t("dependency.fields.dueShort")}</Table.Th>
            <Table.Th w={60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {dependencies.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={10}>
                <Text c="dimmed" ta="center" py="md">
                  {t("dependency.none")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            dependencies.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(r)}
                  >
                    {r.dependency_id}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{r.title}</Text>
                </Table.Td>
                <Table.Td maw={240}>
                  <RichTextPreview html={r.description} />
                </Table.Td>
                <Table.Td>
                  <Text size="sm">
                    {t(`dependency.types.${r.dependency_type}`)}
                    {" · "}
                    {t(`dependency.directions.${r.direction}`).split(" (")[0]}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{r.related_party ?? "—"}</Text>
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={110}
                    aria-label={t("dependency.fields.priority")}
                    data={levelOptions}
                    allowDeselect={false}
                    value={r.priority}
                    onChange={(v) => v && saveField(r, "priority", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={130}
                    aria-label={t("dependency.fields.status")}
                    data={statusOptions}
                    allowDeselect={false}
                    value={r.status}
                    onChange={(v) => v && saveField(r, "status", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={160}
                    aria-label={t("dependency.fields.owner")}
                    searchable
                    clearable
                    data={users}
                    value={r.owner_id}
                    onChange={(v) => saveField(r, "owner_id", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    size="xs"
                    w={140}
                    type="date"
                    aria-label={t("dependency.fields.dueDate")}
                    // keyed on the saved value so a rollback resets the input
                    key={`${r.id}-${r.due_date ?? ""}`}
                    defaultValue={r.due_date ?? ""}
                    onBlur={(e) => {
                      const v = e.currentTarget.value || null;
                      if (v !== r.due_date) saveField(r, "due_date", v);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Tooltip label={t("common.delete")}>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={t("common.deleteItem", { name: r.title })}
                        onClick={() => setDeleting(r)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={opened}
        onClose={handlers.close}
        title={editing ? t("dependency.edit") : t("dependency.add")}
        size="xl"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label={t("dependency.fields.title")}
              data-autofocus
              {...form.getInputProps("title")}
            />
            <RichTextField
              label={t("dependency.fields.description")}
              value={form.values.description}
              onChange={(html) => form.setFieldValue("description", html)}
              error={form.errors.description}
            />
            <Group grow align="flex-start">
              <Select
                label={t("dependency.fields.type")}
                data={typeOptions}
                allowDeselect={false}
                {...form.getInputProps("dependency_type")}
              />
              <Select
                label={t("dependency.fields.direction")}
                data={directionOptions}
                allowDeselect={false}
                {...form.getInputProps("direction")}
              />
              <TextInput
                label={t("dependency.fields.relatedParty")}
                {...form.getInputProps("related_party")}
              />
            </Group>
            <Group grow align="flex-start">
              <Select
                label={t("dependency.fields.priority")}
                data={levelOptions}
                allowDeselect={false}
                {...form.getInputProps("priority")}
              />
              <Select
                label={t("dependency.fields.status")}
                data={statusOptions}
                allowDeselect={false}
                {...form.getInputProps("status")}
              />
            </Group>
            <Group grow align="flex-start">
              <Select
                label={t("dependency.fields.owner")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("owner_id")}
              />
              <Select
                label={t("dependency.fields.raisedBy")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("raised_by")}
              />
              <TextInput
                type="date"
                label={t("dependency.fields.raisedDate")}
                {...form.getInputProps("raised_date")}
              />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                type="date"
                label={t("dependency.fields.dueDate")}
                {...form.getInputProps("due_date")}
              />
              <TextInput
                type="date"
                label={t("dependency.fields.resolvedDate")}
                {...form.getInputProps("resolved_date")}
              />
            </Group>
            <RichTextField
              label={t("dependency.fields.impact")}
              value={form.values.impact}
              onChange={(html) => form.setFieldValue("impact", html)}
              error={form.errors.impact}
            />
            <RichTextField
              label={t("dependency.fields.resolution")}
              value={form.values.resolution}
              onChange={(html) => form.setFieldValue("resolution", html)}
              error={form.errors.resolution}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handlers.close}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={saving}>
                {t("common.save")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("dependency.deleteTitle")}
      >
        <Stack>
          <Text>
            <Trans
              i18nKey="dependency.deleteConfirm"
              values={{ title: deleting?.title }}
              components={{ b: <b /> }}
            />
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button color="red" onClick={confirmDelete}>
              {t("common.delete")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
