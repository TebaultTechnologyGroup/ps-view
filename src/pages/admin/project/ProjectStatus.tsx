import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";
import type { Database } from "@/lib/database.types";
import RichTextField, { RichTextPreview } from "@/components/RichTextField";

type Report = Database["public"]["Tables"]["project_status_reports"]["Row"];

const INDICATOR_COLOR: Record<string, string> = {
  onTrack: "green",
  atRisk: "yellow",
  blocked: "red",
  notStarted: "gray",
  onHold: "orange",
  canceled: "dark",
  complete: "teal",
};

export default function ProjectStatus() {
  const { t } = useTranslation();
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [indicators, setIndicators] = useState<
    { id: string; locale_tag: string }[]
  >([]);
  const [editing, setEditing] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, handlers] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      range_start: "",
      range_end: "",
      project_status_id: "",
      comments: "",
      published: false,
    },
    validate: {
      range_start: (v) =>
        v
          ? null
          : t("validation.required", {
              field: t("projectStatus.fields.periodStart"),
            }),
      range_end: (v, all) =>
        !v
          ? t("validation.required", {
              field: t("projectStatus.fields.periodEnd"),
            })
          : v < all.range_start
            ? t("projectStatus.validation.endBeforeStart")
            : null,
      project_status_id: (v) =>
        v
          ? null
          : t("validation.required", {
              field: t("projectStatus.fields.indicator"),
            }),
    },
  });

  const load = useCallback(async () => {
    const [r, i] = await Promise.all([
      supabase
        .from("project_status_reports")
        .select("*")
        .eq("project_id", projectId!)
        .order("range_start", { ascending: false }),
      supabase.from("project_status").select("id, locale_tag"),
    ]);
    const err = r.error ?? i.error;
    setError(err ? err.message : null);
    setReports(r.data ?? []);
    setIndicators(i.data ?? []);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const indicatorTag = (id: string | null) =>
    indicators.find((x) => x.id === id)?.locale_tag;

  // labels are i18n keys stored in the table
  const indicatorOptions = indicators.map((x) => ({
    value: x.id,
    label: t(`projectStatus.indicator.${x.locale_tag}`),
  }));

  const open = (r: Report | null) => {
    setEditing(r);
    form.setValues({
      range_start: r?.range_start ?? "",
      range_end: r?.range_end ?? "",
      project_status_id: r?.project_status_id ?? "",
      comments: r?.comments ?? "",
      published: !!r?.published_at,
    });
    form.resetDirty();
    form.clearErrors();
    handlers.open();
  };

  const submit = async (v: typeof form.values) => {
    setSaving(true);
    const now = new Date().toISOString();
    const fields = {
      range_start: v.range_start,
      range_end: v.range_end,
      project_status_id: v.project_status_id,
      comments: v.comments.trim() || null,
      published_at: v.published ? (editing?.published_at ?? now) : null,
      updated_by: me?.userId,
      updated_at: now,
    };
    const { error } = editing
      ? await supabase
          .from("project_status_reports")
          .update(fields)
          .eq("id", editing.id)
      : await supabase.from("project_status_reports").insert({
          id: crypto.randomUUID(),
          project_id: projectId!,
          created_by: me?.userId,
          ...fields,
        });
    setSaving(false);
    if (error) return setError(error.message);
    handlers.close();
    await load();
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Text fw={500}>{t("projectStatus.title")}</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => open(null)}>
          {t("projectStatus.add")}
        </Button>
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      <Table withTableBorder highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("projectStatus.fields.period")}</Table.Th>
            <Table.Th>{t("projectStatus.fields.indicator")}</Table.Th>
            <Table.Th>{t("projectStatus.fields.comments")}</Table.Th>
            <Table.Th>{t("projectStatus.fields.state")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reports.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed" ta="center" py="md">
                  {t("projectStatus.none")}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            reports.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(r)}
                  >
                    {r.range_start} – {r.range_end}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  {indicatorTag(r.project_status_id) && (
                    <Badge
                      variant="light"
                      color={
                        INDICATOR_COLOR[indicatorTag(r.project_status_id)!] ??
                        "gray"
                      }
                    >
                      {t(
                        `projectStatus.indicator.${indicatorTag(r.project_status_id)}`,
                      )}
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <RichTextPreview html={r.comments} />
                </Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={r.published_at ? "green" : "gray"}
                  >
                    {t(
                      r.published_at
                        ? "projectStatus.state.published"
                        : "projectStatus.state.draft",
                    )}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={opened}
        onClose={handlers.close}
        title={t(editing ? "projectStatus.edit" : "projectStatus.add")}
        size="lg"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            <Group grow align="flex-start">
              <TextInput
                type="date"
                label={t("projectStatus.fields.periodStart")}
                {...form.getInputProps("range_start")}
              />
              <TextInput
                type="date"
                label={t("projectStatus.fields.periodEnd")}
                {...form.getInputProps("range_end")}
              />
            </Group>
            <Select
              label={t("projectStatus.fields.indicator")}
              data={indicatorOptions}
              allowDeselect={false}
              {...form.getInputProps("project_status_id")}
            />
            <RichTextField
              label={t("projectStatus.fields.comments")}
              minHeight={160}
              value={form.values.comments}
              onChange={(html) => form.setFieldValue("comments", html)}
            />
            <Group justify="space-between">
              <label>
                <input
                  type="checkbox"
                  {...form.getInputProps("published", { type: "checkbox" })}
                />{" "}
                {t("projectStatus.state.published")}
              </label>
              <Group>
                <Button variant="default" onClick={handlers.close}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" loading={saving}>
                  {t("common.save")}
                </Button>
              </Group>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
