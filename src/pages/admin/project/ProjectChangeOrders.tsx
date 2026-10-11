import { useCallback, useMemo, useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
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

type InlineField = "status" | "owner_id";
type ChangeOrder = Database["public"]["Tables"]["project_change_orders"]["Row"];
type Option = { value: string; label: string };

const STATUSES = ["draft", "submitted", "approved", "rejected", "implemented"] as const;

const today = () => new Date().toISOString().slice(0, 10);

const makeSchema = (titleRequired: string) =>
  z.object({
    title: z.string().trim().min(1, titleRequired),
    description: z.string(),
    justification: z.string(),
    status: z.enum(STATUSES),
    owner_id: z.string(),
    requested_by: z.string(),
    requested_date: z.string(),
    approver: z.string(),
    decision_date: z.string(),
    estimated_cost_impact: z.number(),
    estimated_days_impact: z.number(),
    currency: z.string(),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;

const empty: Values = {
  title: "",
  description: "",
  justification: "",
  status: "draft",
  owner_id: "",
  requested_by: "",
  requested_date: today(),
  approver: "",
  decision_date: "",
  estimated_cost_impact: 0,
  estimated_days_impact: 0,
  currency: "$",
};

export default function ProjectChangeOrders() {
  const { t } = useTranslation();
  const statusOptions = STATUSES.map((v) => ({
    value: v,
    label: t(`changeOrder.statuses.${v}`),
  }));
  const schema = useMemo(
    () =>
      makeSchema(t("validation.required", { field: t("changeOrder.fields.title") })),
    [t],
  );
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [users, setUsers] = useState<Option[]>([]);
  const [editing, setEditing] = useState<ChangeOrder | null>(null);
  const [deleting, setDeleting] = useState<ChangeOrder | null>(null);
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
        .from("project_change_orders")
        .select("*")
        .eq("project_id", projectId!)
        .eq("deleted", false)
        .order("change_order_number", { ascending: true }),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "CAMUNDA")
        .eq("deleted", false),
    ]);
    const err = a.error ?? u.error;
    setError(err ? err.message : null);
    setChangeOrders(a.data ?? []);
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

  const open = (r: ChangeOrder | null) => {
    setEditing(r);
    form.setValues(
      r
        ? {
            title: r.title,
            description: r.description ?? "",
            justification: r.justification ?? "",
            status: r.status as Values["status"],
            owner_id: r.owner_id ?? "",
            requested_by: r.requested_by ?? "",
            requested_date: r.requested_date,
            approver: r.approver ?? "",
            decision_date: r.decision_date ?? "",
            estimated_cost_impact: r.estimated_cost_impact,
            estimated_days_impact: r.estimated_days_impact,
            currency: r.currency,
          }
        : { ...empty, requested_date: today(), requested_by: me?.userId ?? "" },
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
      justification: v.justification.trim() || null,
      status: v.status,
      owner_id: v.owner_id || null,
      requested_by: v.requested_by || null,
      requested_date: v.requested_date || today(),
      approver: v.approver.trim() || null,
      decision_date: v.decision_date || null,
      estimated_cost_impact: v.estimated_cost_impact,
      estimated_days_impact: v.estimated_days_impact,
      currency: v.currency.trim() || "$",
      updated_by: me?.userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase
          .from("project_change_orders")
          .update(fields)
          .eq("id", editing.id)
      : await supabase.from("project_change_orders").insert({
          id: crypto.randomUUID(),
          project_id: projectId!,
          created_by: me?.userId,
          // assigned by the project_change_orders_assign_number trigger
          change_order_number: undefined as unknown as number,
          ...fields,
        });
    setSaving(false);
    if (error) return setFormError(error.message);
    handlers.close();
    await load();
  };

  // Inline edit: update the row optimistically, roll back if the save fails.
  const saveField = async (
    changeOrder: ChangeOrder,
    field: InlineField,
    value: string | null,
  ) => {
    const previous = changeOrder[field];
    const patch = (v: string | null) =>
      setChangeOrders((rs) =>
        rs.map((x) => (x.id === changeOrder.id ? { ...x, [field]: v } : x)),
      );
    patch(value);
    const { error } = await supabase
      .from("project_change_orders")
      .update({
        [field]: value,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["project_change_orders"]["Update"])
      .eq("id", changeOrder.id);
    if (error) {
      patch(previous);
      setError(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("project_change_orders")
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
        <Text fw={500}>{t("changeOrder.title")}</Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => open(null)}
        >
          {t("changeOrder.add")}
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
            <Table.Th w={80}>{t("changeOrder.fields.changeOrderId")}</Table.Th>
            <Table.Th>{t("changeOrder.fields.title")}</Table.Th>
            <Table.Th>{t("changeOrder.fields.description")}</Table.Th>
            <Table.Th>{t("changeOrder.fields.status")}</Table.Th>
            <Table.Th>{t("changeOrder.fields.owner")}</Table.Th>
            <Table.Th>{t("changeOrder.fields.costShort")}</Table.Th>
            <Table.Th>{t("changeOrder.fields.daysShort")}</Table.Th>
            <Table.Th w={60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {changeOrders.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={8}>
                <Text c="dimmed" ta="center" py="md">
                  {t("changeOrder.none")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            changeOrders.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(r)}
                  >
                    {r.change_order_id}
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
                    aria-label={t("changeOrder.fields.status")}
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
                    aria-label={t("changeOrder.fields.owner")}
                    searchable
                    clearable
                    data={users}
                    value={r.owner_id}
                    onChange={(v) => saveField(r, "owner_id", v)}
                  />
                </Table.Td>
                <Table.Td>
                  {r.estimated_cost_impact
                    ? `${r.currency}${r.estimated_cost_impact.toLocaleString()}`
                    : "—"}
                </Table.Td>
                <Table.Td>{r.estimated_days_impact || "—"}</Table.Td>
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
        title={editing ? t("changeOrder.edit") : t("changeOrder.add")}
        size="xl"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label={t("changeOrder.fields.title")}
              data-autofocus
              {...form.getInputProps("title")}
            />
            <RichTextField
              label={t("changeOrder.fields.description")}
              value={form.values.description}
              onChange={(html) => form.setFieldValue("description", html)}
              error={form.errors.description}
            />
            <Group grow align="flex-start">
              <Select
                label={t("changeOrder.fields.status")}
                data={statusOptions}
                allowDeselect={false}
                {...form.getInputProps("status")}
              />
              <Select
                label={t("changeOrder.fields.owner")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("owner_id")}
              />
            </Group>
            <Group grow align="flex-start">
              <Select
                label={t("changeOrder.fields.requestedBy")}
                searchable
                clearable
                data={users}
                {...form.getInputProps("requested_by")}
              />
              <TextInput
                type="date"
                label={t("changeOrder.fields.requestedDate")}
                {...form.getInputProps("requested_date")}
              />
              <TextInput
                label={t("changeOrder.fields.approver")}
                {...form.getInputProps("approver")}
              />
              <TextInput
                type="date"
                label={t("changeOrder.fields.decisionDate")}
                {...form.getInputProps("decision_date")}
              />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                label={t("changeOrder.fields.currency")}
                maxLength={3}
                {...form.getInputProps("currency")}
              />
              <NumberInput
                label={t("changeOrder.fields.costImpact")}
                allowDecimal={false}
                thousandSeparator=","
                {...form.getInputProps("estimated_cost_impact")}
              />
              <NumberInput
                label={t("changeOrder.fields.daysImpact")}
                allowDecimal={false}
                {...form.getInputProps("estimated_days_impact")}
              />
            </Group>
            <RichTextField
              label={t("changeOrder.fields.justification")}
              value={form.values.justification}
              onChange={(html) => form.setFieldValue("justification", html)}
              error={form.errors.justification}
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
        title={t("changeOrder.deleteTitle")}
      >
        <Stack>
          <Text>
            <Trans
              i18nKey="changeOrder.deleteConfirm"
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
