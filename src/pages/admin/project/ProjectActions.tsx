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
type Action = Database["public"]["Tables"]["project_actions"]["Row"];
type Option = { value: string; label: string };

const LEVELS = ["low", "medium", "high"] as const;
const STATUSES = ["open", "in_progress", "completed", "cancelled"] as const;

const today = () => new Date().toISOString().slice(0, 10);

const makeSchema = (titleRequired: string) =>
  z.object({
    title: z.string().trim().min(1, titleRequired),
    description: z.string(),
    resolution: z.string(),
    priority: z.enum(LEVELS),
    status: z.enum(STATUSES),
    owner_id: z.string(),
    raised_by: z.string(),
    raised_date: z.string(),
    due_date: z.string(),
    completed_date: z.string(),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;

const empty: Values = {
  title: "",
  description: "",
  resolution: "",
  priority: "medium",
  status: "open",
  owner_id: "",
  raised_by: "",
  raised_date: today(),
  due_date: "",
  completed_date: "",
};

export default function ProjectActions() {
  const { t } = useTranslation();
  const levelOptions = LEVELS.map((v) => ({
    value: v,
    label: t(`action.level.${v}`),
  }));
  const statusOptions = STATUSES.map((v) => ({
    value: v,
    label: t(`action.statuses.${v}`),
  }));
  const schema = useMemo(
    () =>
      makeSchema(t("validation.required", { field: t("action.fields.title") })),
    [t],
  );
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [editing, setEditing] = useState<Action | null>(null);
  const [deleting, setDeleting] = useState<Action | null>(null);
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
        .from("project_actions")
        .select("*")
        .eq("project_id", projectId!)
        .eq("deleted", false)
        .order("action_number", { ascending: true }),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "CAMUNDA")
        .eq("deleted", false),
    ]);
    const err = a.error ?? u.error;
    setError(err ? err.message : null);
    setActions(a.data ?? []);
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

  const open = (r: Action | null) => {
    setEditing(r);
    form.setValues(
      r
        ? {
            title: r.title,
            description: r.description ?? "",
            resolution: r.resolution ?? "",
            priority: r.priority as Values["priority"],
            status: r.status as Values["status"],
            owner_id: r.owner_id ?? "",
            raised_by: r.raised_by ?? "",
            raised_date: r.raised_date,
            due_date: r.due_date ?? "",
            completed_date: r.completed_date ?? "",
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
      resolution: v.resolution.trim() || null,
      priority: v.priority,
      status: v.status,
      owner_id: v.owner_id || null,
      raised_by: v.raised_by || null,
      raised_date: v.raised_date || today(),
      due_date: v.due_date || null,
      completed_date: v.completed_date || null,
      updated_by: me?.userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase
          .from("project_actions")
          .update(fields)
          .eq("id", editing.id)
      : await supabase.from("project_actions").insert({
          id: crypto.randomUUID(),
          project_id: projectId!,
          created_by: me?.userId,
          // assigned by the project_actions_assign_number trigger
          action_number: undefined as unknown as number,
          ...fields,
        });
    setSaving(false);
    if (error) return setFormError(error.message);
    handlers.close();
    await load();
  };

  // Inline edit: update the row optimistically, roll back if the save fails.
  const saveField = async (
    action: Action,
    field: InlineField,
    value: string | null,
  ) => {
    const previous = action[field];
    const patch = (v: string | null) =>
      setActions((rs) =>
        rs.map((x) => (x.id === action.id ? { ...x, [field]: v } : x)),
      );
    patch(value);
    const { error } = await supabase
      .from("project_actions")
      .update({
        [field]: value,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["project_actions"]["Update"])
      .eq("id", action.id);
    if (error) {
      patch(previous);
      setError(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("project_actions")
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
        <Text fw={500}>{t("action.title")}</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => open(null)}
        >
          {t("action.add")}
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
            <Table.Th w={80}>{t("action.fields.actionId")}</Table.Th>
            <Table.Th>{t("action.fields.title")}</Table.Th>
            <Table.Th>{t("action.fields.description")}</Table.Th>
            <Table.Th>{t("action.fields.priority")}</Table.Th>
            <Table.Th>{t("action.fields.status")}</Table.Th>
            <Table.Th>{t("action.fields.owner")}</Table.Th>
            <Table.Th>{t("action.fields.dueShort")}</Table.Th>
            <Table.Th w={60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {actions.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={8}>
                <Text c="dimmed" ta="center" py="md">
                  {t("action.none")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            actions.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(r)}
                  >
                    {r.action_id}
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
                    w={110}
                    aria-label={t("action.fields.priority")}
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
                    aria-label={t("action.fields.status")}
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
                    aria-label={t("action.fields.owner")}
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
                    aria-label={t("action.fields.dueDate")}
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
        title={editing ? t("action.edit") : t("action.add")}
        size="xl"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label={t("action.fields.title")}
              data-autofocus
              {...form.getInputProps("title")}
            />
            <RichTextField
              label={t("action.fields.description")}
              value={form.values.description}
              onChange={(html) => form.setFieldValue("description", html)}
              error={form.errors.description}
            />
            <Group grow align="flex-start">
              <Select
                label={t("action.fields.priority")}
                data={levelOptions}
                allowDeselect={false}
                {...form.getInputProps("priority")}
              />
              <Select
                label={t("action.fields.status")}
                data={statusOptions}
                allowDeselect={false}
                {...form.getInputProps("status")}
              />
            </Group>
            <Group grow align="flex-start">
              <Select
                label={t("action.fields.owner")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("owner_id")}
              />
              <Select
                label={t("action.fields.raisedBy")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("raised_by")}
              />
              <TextInput
                type="date"
                label={t("action.fields.raisedDate")}
                {...form.getInputProps("raised_date")}
              />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                type="date"
                label={t("action.fields.dueDate")}
                {...form.getInputProps("due_date")}
              />
              <TextInput
                type="date"
                label={t("action.fields.completedDate")}
                {...form.getInputProps("completed_date")}
              />
            </Group>
            <RichTextField
              label={t("action.fields.resolution")}
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
        title={t("action.deleteTitle")}
      >
        <Stack>
          <Text>
            <Trans
              i18nKey="action.deleteConfirm"
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
