import { useCallback, useMemo, useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
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
  | "severity"
  | "priority"
  | "status"
  | "owner_id"
  | "category_id"
  | "target_date";
type Issue = Database["public"]["Tables"]["project_issues"]["Row"];
type Option = { value: string; label: string };

const LEVELS = ["low", "medium", "high"] as const;
const STATUSES = ["open", "mitigated", "accepted", "closed"] as const;

const makeSchema = (titleRequired: string) =>
  z.object({
    title: z.string().trim().min(1, titleRequired),
    description: z.string(),
    action_plan: z.string(),
    resolution: z.string(),
    severity: z.enum(LEVELS),
    priority: z.enum(LEVELS),
    status: z.enum(STATUSES),
    category_id: z.string(),
    owner_id: z.string(),
    raised_by: z.string(),
    raised_date: z.string(),
    target_date: z.string(),
    actual_date: z.string(),
    has_budget_impact: z.boolean(),
    has_schedule_impact: z.boolean(),
    has_scope_impact: z.boolean(),
    estimated_cost_impact: z.number(),
    estimated_days_delayed: z.number(),
    currency: z.string(),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;

const empty: Values = {
  title: "",
  description: "",
  action_plan: "",
  resolution: "",
  severity: "medium",
  priority: "medium",
  status: "open",
  category_id: "",
  owner_id: "",
  raised_by: "",
  raised_date: new Date().toISOString().slice(0, 10),
  target_date: "",
  actual_date: "",
  has_budget_impact: false,
  has_schedule_impact: false,
  has_scope_impact: false,
  estimated_cost_impact: 0,
  estimated_days_delayed: 0,
  currency: "$",
};

export default function ProjectIssues() {
  const { t } = useTranslation();
  const levelOptions = LEVELS.map((v) => ({
    value: v,
    label: t(`issue.level.${v}`),
  }));
  const statusOptions = STATUSES.map((v) => ({
    value: v,
    label: t(`issue.statuses.${v}`),
  }));
  const schema = useMemo(
    () =>
      makeSchema(t("validation.required", { field: t("issue.fields.title") })),
    [t],
  );
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [editing, setEditing] = useState<Issue | null>(null);
  const [deleting, setDeleting] = useState<Issue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, handlers] = useDisclosure(false);

  const form = useForm<Values>({
    initialValues: empty,
    validate: zodResolver(schema),
  });

  const load = useCallback(async () => {
    const [i, u, c] = await Promise.all([
      supabase
        .from("project_issues")
        .select("*")
        .eq("project_id", projectId!)
        .eq("deleted", false)
        .order("issue_number", { ascending: true }),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "CAMUNDA")
        .eq("deleted", false),
      supabase.from("issue_categories").select("id, locale_tag"),
    ]);
    const err = i.error ?? u.error ?? c.error;
    setError(err ? err.message : null);
    setIssues(i.data ?? []);
    setUsers(
      (u.data ?? []).map((x) => ({
        value: x.id,
        label: x.full_name || x.email || x.id,
      })),
    );
    setCategories(
      (c.data ?? []).map((x) => ({ value: x.id, label: x.locale_tag })),
    );
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // category labels are i18n keys stored in the table
  const categoryOptions = categories.map((c) => ({
    value: c.value,
    label: t(c.label),
  }));

  const open = (r: Issue | null) => {
    setEditing(r);
    form.setValues(
      r
        ? {
            title: r.title,
            description: r.description ?? "",
            action_plan: r.action_plan ?? "",
            resolution: r.resolution ?? "",
            severity: (r.severity ?? "medium") as Values["severity"],
            priority: (r.priority ?? "medium") as Values["priority"],
            status: (r.status ?? "open") as Values["status"],
            category_id: r.category_id ?? "",
            owner_id: r.owner_id ?? "",
            raised_by: r.raised_by ?? "",
            raised_date: r.raised_date,
            target_date: r.target_date ?? "",
            actual_date: r.actual_date ?? "",
            has_budget_impact: r.has_budget_impact ?? false,
            has_schedule_impact: r.has_schedule_impact ?? false,
            has_scope_impact: r.has_scope_impact ?? false,
            estimated_cost_impact: r.estimated_cost_impact ?? 0,
            estimated_days_delayed: r.estimated_days_delayed ?? 0,
            currency: r.currency ?? "$",
          }
        : { ...empty, raised_by: me?.userId ?? "" },
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
      action_plan: v.action_plan.trim() || null,
      resolution: v.resolution.trim() || null,
      severity: v.severity,
      priority: v.priority,
      status: v.status,
      category_id: v.category_id || null,
      owner_id: v.owner_id || null,
      raised_by: v.raised_by || null,
      raised_date: v.raised_date || empty.raised_date,
      target_date: v.target_date || null,
      actual_date: v.actual_date || null,
      has_budget_impact: v.has_budget_impact,
      has_schedule_impact: v.has_schedule_impact,
      has_scope_impact: v.has_scope_impact,
      estimated_cost_impact: v.estimated_cost_impact,
      estimated_days_delayed: v.estimated_days_delayed,
      currency: v.currency.trim() || "$",
      updated_by: me?.userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase
          .from("project_issues")
          .update(fields)
          .eq("id", editing.id)
      : await supabase.from("project_issues").insert({
          id: crypto.randomUUID(),
          project_id: projectId!,
          created_by: me?.userId,
          // assigned by the project_issues_assign_number trigger
          issue_number: undefined as unknown as number,
          ...fields,
        });
    setSaving(false);
    if (error) return setFormError(error.message);
    handlers.close();
    await load();
  };

  // Inline edit: update the row optimistically, roll back if the save fails.
  const saveField = async (
    issue: Issue,
    field: InlineField,
    value: string | null,
  ) => {
    const previous = issue[field];
    const patch = (v: string | null) =>
      setIssues((rs) =>
        rs.map((x) => (x.id === issue.id ? { ...x, [field]: v } : x)),
      );
    patch(value);
    const { error } = await supabase
      .from("project_issues")
      .update({
        [field]: value,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["project_issues"]["Update"])
      .eq("id", issue.id);
    if (error) {
      patch(previous);
      setError(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("project_issues")
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

  const impacts = (r: Issue) =>
    [
      r.has_budget_impact && t("issue.fields.budgetImpact"),
      r.has_schedule_impact && t("issue.fields.scheduleImpact"),
      r.has_scope_impact && t("issue.fields.scopeImpact"),
    ].filter(Boolean) as string[];

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={500}>{t("issue.title")}</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => open(null)}
        >
          {t("issue.add")}
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
            <Table.Th w={80}>{t("issue.fields.issueId")}</Table.Th>
            <Table.Th>{t("issue.fields.title")}</Table.Th>
            <Table.Th>{t("issue.fields.description")}</Table.Th>
            <Table.Th>{t("issue.fields.category")}</Table.Th>
            <Table.Th>{t("issue.fields.severity")}</Table.Th>
            <Table.Th>{t("issue.fields.priority")}</Table.Th>
            <Table.Th>{t("issue.fields.status")}</Table.Th>
            <Table.Th>{t("issue.fields.owner")}</Table.Th>
            <Table.Th>{t("issue.fields.targetShort")}</Table.Th>
            <Table.Th>{t("issue.fields.costImpact")}</Table.Th>
            <Table.Th w={60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {issues.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={11}>
                <Text c="dimmed" ta="center" py="md">
                  {t("issue.none")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            issues.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(r)}
                  >
                    {r.issue_id}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Stack gap={4}>
                    <Text size="sm">{r.title}</Text>
                    {impacts(r).length > 0 && (
                      <Group gap={4}>
                        {impacts(r).map((label) => (
                          <Badge key={label} size="xs" variant="light">
                            {label}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td maw={240}>
                  <RichTextPreview html={r.description} />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={130}
                    aria-label={t("issue.fields.category")}
                    clearable
                    data={categoryOptions}
                    value={r.category_id}
                    onChange={(v) => saveField(r, "category_id", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={110}
                    aria-label={t("issue.fields.severity")}
                    data={levelOptions}
                    allowDeselect={false}
                    value={r.severity}
                    onChange={(v) => v && saveField(r, "severity", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={110}
                    aria-label={t("issue.fields.priority")}
                    data={levelOptions}
                    allowDeselect={false}
                    value={r.priority}
                    onChange={(v) => v && saveField(r, "priority", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={120}
                    aria-label={t("issue.fields.status")}
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
                    aria-label={t("issue.fields.owner")}
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
                    aria-label={t("issue.fields.targetDate")}
                    // keyed on the saved value so a rollback resets the input
                    key={`${r.id}-${r.target_date ?? ""}`}
                    defaultValue={r.target_date ?? ""}
                    onBlur={(e) => {
                      const v = e.currentTarget.value || null;
                      if (v !== r.target_date) saveField(r, "target_date", v);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  {r.estimated_cost_impact
                    ? `${r.currency ?? ""}${r.estimated_cost_impact.toLocaleString()}`
                    : "—"}
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
        title={editing ? t("issue.edit") : t("issue.add")}
        size="xl"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label={t("issue.fields.title")}
              data-autofocus
              {...form.getInputProps("title")}
            />
            <RichTextField
              label={t("issue.fields.description")}
              value={form.values.description}
              onChange={(html) => form.setFieldValue("description", html)}
              error={form.errors.description}
            />
            <Group grow align="flex-start">
              <Select
                label={t("issue.fields.category")}
                clearable
                data={categoryOptions}
                {...form.getInputProps("category_id")}
              />
              <Select
                label={t("issue.fields.severity")}
                data={levelOptions}
                allowDeselect={false}
                {...form.getInputProps("severity")}
              />
              <Select
                label={t("issue.fields.priority")}
                data={levelOptions}
                allowDeselect={false}
                {...form.getInputProps("priority")}
              />
              <Select
                label={t("issue.fields.status")}
                data={statusOptions}
                allowDeselect={false}
                {...form.getInputProps("status")}
              />
            </Group>
            <Group grow align="flex-start">
              <Select
                label={t("issue.fields.owner")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("owner_id")}
              />
              <Select
                label={t("issue.fields.raisedBy")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("raised_by")}
              />
              <TextInput
                type="date"
                label={t("issue.fields.raisedDate")}
                {...form.getInputProps("raised_date")}
              />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                type="date"
                label={t("issue.fields.targetDate")}
                {...form.getInputProps("target_date")}
              />
              <TextInput
                type="date"
                label={t("issue.fields.actualDate")}
                {...form.getInputProps("actual_date")}
              />
            </Group>
            <Group>
              <Checkbox
                label={t("issue.fields.budgetImpact")}
                {...form.getInputProps("has_budget_impact", {
                  type: "checkbox",
                })}
              />
              <Checkbox
                label={t("issue.fields.scheduleImpact")}
                {...form.getInputProps("has_schedule_impact", {
                  type: "checkbox",
                })}
              />
              <Checkbox
                label={t("issue.fields.scopeImpact")}
                {...form.getInputProps("has_scope_impact", {
                  type: "checkbox",
                })}
              />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                label={t("issue.fields.currency")}
                maxLength={3}
                {...form.getInputProps("currency")}
              />
              <NumberInput
                label={t("issue.fields.costImpact")}
                min={0}
                allowDecimal={false}
                thousandSeparator=","
                {...form.getInputProps("estimated_cost_impact")}
              />
              <NumberInput
                label={t("issue.fields.daysDelayed")}
                min={0}
                allowDecimal={false}
                {...form.getInputProps("estimated_days_delayed")}
              />
            </Group>
            <RichTextField
              label={t("issue.fields.actionPlan")}
              value={form.values.action_plan}
              onChange={(html) => form.setFieldValue("action_plan", html)}
              error={form.errors.action_plan}
            />
            <RichTextField
              label={t("issue.fields.resolution")}
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
        title={t("issue.deleteTitle")}
      >
        <Stack>
          <Text>
            <Trans
              i18nKey="issue.deleteConfirm"
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
