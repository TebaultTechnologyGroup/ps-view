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

type InlineField =
  | "status"
  | "owner_id"
  | "planned_date"
  | "forecast_date";
type Milestone = Database["public"]["Tables"]["project_milestones"]["Row"];
type Option = { value: string; label: string };

const STATUSES = ["not_started", "on_track", "at_risk", "delayed", "completed"] as const;

const makeSchema = (titleRequired: string) =>
  z.object({
    title: z.string().trim().min(1, titleRequired),
    description: z.string(),
    notes: z.string(),
    status: z.enum(STATUSES),
    owner_id: z.string(),
    planned_date: z.string(),
    forecast_date: z.string(),
    actual_date: z.string(),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;

const empty: Values = {
  title: "",
  description: "",
  notes: "",
  status: "not_started",
  owner_id: "",
  planned_date: "",
  forecast_date: "",
  actual_date: "",
};

export default function ProjectMilestones() {
  const { t } = useTranslation();
  const statusOptions = STATUSES.map((v) => ({
    value: v,
    label: t(`milestone.statuses.${v}`),
  }));
  const schema = useMemo(
    () =>
      makeSchema(t("validation.required", { field: t("milestone.fields.title") })),
    [t],
  );
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);
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
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId!)
        .eq("deleted", false)
        .order("milestone_number", { ascending: true }),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "CAMUNDA")
        .eq("deleted", false),
    ]);
    const err = a.error ?? u.error;
    setError(err ? err.message : null);
    setMilestones(a.data ?? []);
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

  const open = (r: Milestone | null) => {
    setEditing(r);
    form.setValues(
      r
        ? {
            title: r.title,
            description: r.description ?? "",
            notes: r.notes ?? "",
            status: r.status as Values["status"],
            owner_id: r.owner_id ?? "",
            planned_date: r.planned_date ?? "",
            forecast_date: r.forecast_date ?? "",
            actual_date: r.actual_date ?? "",
          }
        : empty,
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
      notes: v.notes.trim() || null,
      status: v.status,
      owner_id: v.owner_id || null,
      planned_date: v.planned_date || null,
      forecast_date: v.forecast_date || null,
      actual_date: v.actual_date || null,
      updated_by: me?.userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase
          .from("project_milestones")
          .update(fields)
          .eq("id", editing.id)
      : await supabase.from("project_milestones").insert({
          id: crypto.randomUUID(),
          project_id: projectId!,
          created_by: me?.userId,
          // assigned by the project_milestones_assign_number trigger
          milestone_number: undefined as unknown as number,
          ...fields,
        });
    setSaving(false);
    if (error) return setFormError(error.message);
    handlers.close();
    await load();
  };

  // Inline edit: update the row optimistically, roll back if the save fails.
  const saveField = async (
    milestone: Milestone,
    field: InlineField,
    value: string | null,
  ) => {
    const previous = milestone[field];
    const patch = (v: string | null) =>
      setMilestones((rs) =>
        rs.map((x) => (x.id === milestone.id ? { ...x, [field]: v } : x)),
      );
    patch(value);
    const { error } = await supabase
      .from("project_milestones")
      .update({
        [field]: value,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["project_milestones"]["Update"])
      .eq("id", milestone.id);
    if (error) {
      patch(previous);
      setError(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("project_milestones")
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
        <Text fw={500}>{t("milestone.title")}</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => open(null)}
        >
          {t("milestone.add")}
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
            <Table.Th w={80}>{t("milestone.fields.milestoneId")}</Table.Th>
            <Table.Th>{t("milestone.fields.title")}</Table.Th>
            <Table.Th>{t("milestone.fields.description")}</Table.Th>
            <Table.Th>{t("milestone.fields.status")}</Table.Th>
            <Table.Th>{t("milestone.fields.owner")}</Table.Th>
            <Table.Th>{t("milestone.fields.plannedShort")}</Table.Th>
            <Table.Th>{t("milestone.fields.forecastShort")}</Table.Th>
            <Table.Th w={60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {milestones.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={8}>
                <Text c="dimmed" ta="center" py="md">
                  {t("milestone.none")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            milestones.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(r)}
                  >
                    {r.milestone_id}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{r.title}</Text>
                </Table.Td>
                <Table.Td maw={240}>
                  <RichTextPreview html={r.description} />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={130}
                    aria-label={t("milestone.fields.status")}
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
                    aria-label={t("milestone.fields.owner")}
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
                    aria-label={t("milestone.fields.plannedDate")}
                    // keyed on the saved value so a rollback resets the input
                    key={`${r.id}-${r.planned_date ?? ""}`}
                    defaultValue={r.planned_date ?? ""}
                    onBlur={(e) => {
                      const v = e.currentTarget.value || null;
                      if (v !== r.planned_date) saveField(r, "planned_date", v);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    size="xs"
                    w={140}
                    type="date"
                    aria-label={t("milestone.fields.forecastDate")}
                    // keyed on the saved value so a rollback resets the input
                    key={`${r.id}-${r.forecast_date ?? ""}`}
                    defaultValue={r.forecast_date ?? ""}
                    onBlur={(e) => {
                      const v = e.currentTarget.value || null;
                      if (v !== r.forecast_date) saveField(r, "forecast_date", v);
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
        title={editing ? t("milestone.edit") : t("milestone.add")}
        size="xl"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label={t("milestone.fields.title")}
              data-autofocus
              {...form.getInputProps("title")}
            />
            <RichTextField
              label={t("milestone.fields.description")}
              value={form.values.description}
              onChange={(html) => form.setFieldValue("description", html)}
              error={form.errors.description}
            />
            <Group grow align="flex-start">
              <Select
                label={t("milestone.fields.status")}
                data={statusOptions}
                allowDeselect={false}
                {...form.getInputProps("status")}
              />
              <Select
                label={t("milestone.fields.owner")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("owner_id")}
              />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                type="date"
                label={t("milestone.fields.plannedDate")}
                {...form.getInputProps("planned_date")}
              />
              <TextInput
                type="date"
                label={t("milestone.fields.forecastDate")}
                {...form.getInputProps("forecast_date")}
              />
              <TextInput
                type="date"
                label={t("milestone.fields.actualDate")}
                {...form.getInputProps("actual_date")}
              />
            </Group>
            <RichTextField
              label={t("milestone.fields.notes")}
              value={form.values.notes}
              onChange={(html) => form.setFieldValue("notes", html)}
              error={form.errors.notes}
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
        title={t("milestone.deleteTitle")}
      >
        <Stack>
          <Text>
            <Trans
              i18nKey="milestone.deleteConfirm"
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
