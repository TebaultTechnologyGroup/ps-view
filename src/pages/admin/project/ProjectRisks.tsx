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
import { IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import { zodResolver } from "mantine-form-zod-resolver";
import { Trans, useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as z from "zod";
import { supabase } from "@/lib/supabase-client";
import BulkAddRisks from "./BulkAddRisks";
import RichTextField, { RichTextPreview } from "@/components/RichTextField";
import { useAuth } from "@/guards/AppContext";
import type { Database } from "@/lib/database.types";

type InlineField =
  | "probability"
  | "impact"
  | "status"
  | "owner_id"
  | "due_date";
type Risk = Database["public"]["Tables"]["project_risks"]["Row"];

const LEVELS = ["low", "medium", "high"] as const;
const STATUSES = ["open", "mitigated", "accepted", "closed"] as const;

const makeSchema = (titleRequired: string) =>
  z.object({
    title: z.string().trim().min(1, titleRequired),
    description: z.string(),
    probability: z.enum(["low", "medium", "high"]),
    impact: z.enum(["low", "medium", "high"]),
    status: z.enum(["open", "mitigated", "accepted", "closed"]),
    mitigation: z.string(),
    owner_id: z.string(),
    due_date: z.string(),
  });
type Values = z.infer<ReturnType<typeof makeSchema>>;

const empty: Values = {
  title: "",
  description: "",
  probability: "medium",
  impact: "medium",
  status: "open",
  mitigation: "",
  owner_id: "",
  due_date: "",
};

const asLevel = (v: string) => v as Values["probability"];

export default function ProjectRisks() {
  const { t } = useTranslation();
  const levelOptions = LEVELS.map((v) => ({
    value: v,
    label: t(`risk.level.${v}`),
  }));
  const statusOptions = STATUSES.map((v) => ({
    value: v,
    label: t(`risk.statuses.${v}`),
  }));
  const schema = useMemo(
    () =>
      makeSchema(t("validation.required", { field: t("risk.fields.title") })),
    [t],
  );
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [owners, setOwners] = useState<
    { value: string; label: string; email: string }[]
  >([]);
  const [editing, setEditing] = useState<Risk | null>(null);
  const [deleting, setDeleting] = useState<Risk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, handlers] = useDisclosure(false);
  const [bulkOpened, bulk] = useDisclosure(false);

  const form = useForm<Values>({
    initialValues: empty,
    validate: zodResolver(schema),
  });

  const load = useCallback(async () => {
    const [r, u] = await Promise.all([
      supabase
        .from("project_risks")
        .select("*")
        .eq("project_id", projectId!)
        .eq("deleted", false)
        .order("risk_number", { ascending: true }),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("role", "CAMUNDA")
        .eq("deleted", false),
    ]);
    const err = r.error ?? u.error;
    setError(err ? err.message : null);
    setRisks(r.data ?? []);
    setOwners(
      (u.data ?? []).map((x) => ({
        value: x.id,
        label: x.full_name || x.email || x.id,
        email: x.email ?? "",
      })),
    );
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (r: Risk | null) => {
    setEditing(r);
    form.setValues(
      r
        ? {
            title: r.title,
            description: r.description ?? "",
            probability: asLevel(r.probability),
            impact: asLevel(r.impact),
            status: r.status as Values["status"],
            mitigation: r.mitigation ?? "",
            owner_id: r.owner_id ?? "",
            due_date: r.due_date ?? "",
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
      probability: v.probability,
      impact: v.impact,
      status: v.status,
      mitigation: v.mitigation.trim() || null,
      owner_id: v.owner_id || null,
      due_date: v.due_date || null,
      updated_by: me?.userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing
      ? await supabase.from("project_risks").update(fields).eq("id", editing.id)
      : await supabase.from("project_risks").insert({
          id: crypto.randomUUID(),
          risk_number: 1, ///// TODOD: Fix this.
          project_id: projectId!,
          created_by: me?.userId,
          ...fields,
        });
    setSaving(false);
    if (error) return setFormError(error.message);
    handlers.close();
    await load();
  };

  // Inline edit: update the row optimistically, roll back if the save fails.
  const saveField = async (
    risk: Risk,
    field: InlineField,
    value: string | null,
  ) => {
    const previous = risk[field];
    const patch = (v: string | null) =>
      setRisks((rs) =>
        rs.map((x) => (x.id === risk.id ? { ...x, [field]: v } : x)),
      );
    patch(value);
    const { error } = await supabase
      .from("project_risks")
      .update({
        [field]: value,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      } as Database["public"]["Tables"]["project_risks"]["Update"])
      .eq("id", risk.id);
    if (error) {
      patch(previous);
      setError(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("project_risks")
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
        <Text fw={500}>{t("risk.title")}</Text>
        <Group>
          <Button
            variant="default"
            leftSection={<IconUpload size={16} />}
            onClick={bulk.open}
          >
            {t("risk.bulkAdd")}
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => open(null)}
          >
            {t("risk.add")}
          </Button>
        </Group>
      </Group>
      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Table withTableBorder highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={80}>{t("risk.fields.riskId")}</Table.Th>
            <Table.Th>{t("risk.fields.title")}</Table.Th>
            <Table.Th>{t("risk.fields.description")}</Table.Th>
            <Table.Th>{t("risk.fields.mitigationShort")}</Table.Th>
            <Table.Th>{t("risk.fields.probability")}</Table.Th>
            <Table.Th>{t("risk.fields.impact")}</Table.Th>
            <Table.Th>{t("risk.fields.status")}</Table.Th>
            <Table.Th>{t("risk.fields.owner")}</Table.Th>
            <Table.Th>{t("risk.fields.dueShort")}</Table.Th>
            <Table.Th w={100} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {risks.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={10}>
                <Text c="dimmed" ta="center" py="md">
                  {t("risk.none")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            risks.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(r)}
                  >
                    {r.risk_id}
                  </Anchor>
                </Table.Td>
                <Table.Td>{r.title}</Table.Td>
                <Table.Td maw={240}>
                  <RichTextPreview html={r.description} />
                </Table.Td>
                <Table.Td maw={240}>
                  <RichTextPreview html={r.mitigation} />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={110}
                    aria-label={t("risk.fields.probability")}
                    data={levelOptions}
                    allowDeselect={false}
                    value={r.probability}
                    onChange={(v) => v && saveField(r, "probability", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={110}
                    aria-label={t("risk.fields.impact")}
                    data={levelOptions}
                    allowDeselect={false}
                    value={r.impact}
                    onChange={(v) => v && saveField(r, "impact", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    w={120}
                    aria-label={t("risk.fields.status")}
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
                    aria-label={t("risk.fields.owner")}
                    searchable
                    clearable
                    data={owners}
                    value={r.owner_id}
                    onChange={(v) => saveField(r, "owner_id", v)}
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    size="xs"
                    w={140}
                    type="date"
                    aria-label={t("risk.fields.dueDate")}
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
        title={editing ? t("risk.edit") : t("risk.add")}
        size="lg"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label={t("risk.fields.title")}
              data-autofocus
              {...form.getInputProps("title")}
            />
            <RichTextField
              label={t("risk.fields.description")}
              value={form.values.description}
              onChange={(html) => form.setFieldValue("description", html)}
              error={form.errors.description}
            />
            <Group grow align="flex-start">
              <Select
                label={t("risk.fields.probability")}
                data={levelOptions}
                allowDeselect={false}
                {...form.getInputProps("probability")}
              />
              <Select
                label={t("risk.fields.impact")}
                data={levelOptions}
                allowDeselect={false}
                {...form.getInputProps("impact")}
              />
              <Select
                label={t("risk.fields.status")}
                data={statusOptions}
                allowDeselect={false}
                {...form.getInputProps("status")}
              />
            </Group>
            <RichTextField
              label={t("risk.fields.mitigation")}
              value={form.values.mitigation}
              onChange={(html) => form.setFieldValue("mitigation", html)}
              error={form.errors.mitigation}
            />
            <Group grow align="flex-start">
              <Select
                label={t("risk.fields.owner")}
                searchable
                clearable
                data={owners}
                {...form.getInputProps("owner_id")}
              />
              <TextInput
                type="date"
                label={t("risk.fields.dueDate")}
                {...form.getInputProps("due_date")}
              />
            </Group>
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

      <BulkAddRisks
        opened={bulkOpened}
        onClose={bulk.close}
        projectId={projectId!}
        owners={owners}
        onDone={load}
      />

      <Modal
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("risk.deleteTitle")}
      >
        <Stack>
          <Text>
            <Trans
              i18nKey="risk.deleteConfirm"
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
