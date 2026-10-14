import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Breadcrumbs,
  Group,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { RichTextPreview } from "@/components/RichTextField";

type ProjectRow = {
  id: string;
  name: string | null;
  owner_id: string | null;
  customer_id: string | null;
  start_date: string | null;
  end_date: string | null;
};
type ReportRow = {
  project_id: string | null;
  project_status_id: string | null;
  comments: string | null;
  range_end: string | null;
  published_at: string | null;
};
type Data = {
  projects: ProjectRow[];
  reports: ReportRow[];
  indicators: Record<string, string>;
  owners: Record<string, string>;
  customers: Record<string, string>;
};

const INDICATOR_COLOR: Record<string, string> = {
  onTrack: "green",
  atRisk: "yellow",
  blocked: "red",
  notStarted: "gray",
  onHold: "orange",
  canceled: "dark",
  complete: "teal",
};
// Lower sorts first: what the meeting needs to discuss comes to the top.
const INDICATOR_ORDER = [
  "blocked",
  "atRisk",
  "onHold",
  "onTrack",
  "notStarted",
  "complete",
  "canceled",
];
const NEEDS_ATTENTION = new Set(["blocked", "atRisk"]);
const UNASSIGNED = "__unassigned__";

const todayIso = () => new Date().toISOString().slice(0, 10);
const rank = (tag: string | null) => {
  const i = tag ? INDICATOR_ORDER.indexOf(tag) : -1;
  return i === -1 ? INDICATOR_ORDER.length : i;
};

export default function ProjectReview() {
  const { t } = useTranslation();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [attentionOnly, setAttentionOnly] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, sr, ps, u, c] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, owner_id, customer_id, start_date, end_date")
          .eq("deleted", false),
        supabase
          .from("project_status_reports")
          .select(
            "project_id, project_status_id, comments, range_end, published_at",
          ),
        supabase.from("project_status").select("id, locale_tag"),
        supabase
          .from("users")
          .select("id, full_name, email")
          .eq("role", "CAMUNDA")
          .eq("deleted", false),
        supabase.from("customers").select("id, name"),
      ]);
      const err = p.error ?? sr.error ?? ps.error ?? u.error ?? c.error;
      setError(err ? err.message : null);
      setData({
        projects: p.data ?? [],
        reports: sr.data ?? [],
        indicators: Object.fromEntries(
          (ps.data ?? []).map((x) => [x.id, x.locale_tag]),
        ),
        owners: Object.fromEntries(
          (u.data ?? []).map((x) => [x.id, x.full_name || x.email || x.id]),
        ),
        customers: Object.fromEntries(
          (c.data ?? []).map((x) => [x.id, x.name]),
        ),
      });
    })();
  }, []);

  const groups = useMemo(() => {
    if (!data) return [];
    const today = todayIso();

    // Current status = the report covering the most recent period.
    const latest = new Map<string, ReportRow>();
    for (const r of data.reports) {
      if (!r.project_id) continue;
      const cur = latest.get(r.project_id);
      if ((r.range_end ?? "") > (cur?.range_end ?? "")) {
        latest.set(r.project_id, r);
      }
    }

    const byOwner = new Map<
      string,
      { project: ProjectRow; report: ReportRow | null; tag: string | null }[]
    >();
    for (const project of data.projects) {
      if (
        !includeInactive &&
        ((project.start_date && project.start_date > today) ||
          (project.end_date && project.end_date < today))
      )
        continue;
      const report = latest.get(project.id) ?? null;
      const tag = report?.project_status_id
        ? (data.indicators[report.project_status_id] ?? null)
        : null;
      if (attentionOnly && !(tag && NEEDS_ATTENTION.has(tag))) continue;
      const key = project.owner_id ?? UNASSIGNED;
      const list = byOwner.get(key) ?? [];
      list.push({ project, report, tag });
      byOwner.set(key, list);
    }

    return [...byOwner]
      .map(([ownerId, items]) => ({
        ownerId,
        name: data.owners[ownerId] ?? "",
        items: items.sort(
          (a, b) =>
            rank(a.tag) - rank(b.tag) ||
            (a.project.name ?? "").localeCompare(b.project.name ?? ""),
        ),
      }))
      .sort((a, b) => {
        // Unassigned last, then by owner name.
        if (a.ownerId === UNASSIGNED) return 1;
        if (b.ownerId === UNASSIGNED) return -1;
        return a.name.localeCompare(b.name);
      });
  }, [data, includeInactive, attentionOnly]);

  return (
    <Stack gap="md">
      <Breadcrumbs>
        <Anchor component={Link} to="/admin/reports" size="sm">
          {t("reports.title")}
        </Anchor>
        <Text size="sm">{t("reports.projectReview.title")}</Text>
      </Breadcrumbs>
      <Group justify="space-between" align="flex-start">
        <Stack gap={2}>
          <Title order={2}>{t("reports.projectReview.title")}</Title>
          <Text size="sm" c="dimmed">
            {t("reports.projectReview.description")}
          </Text>
        </Stack>
        <Stack gap="xs">
          <Switch
            label={t("reports.projectReview.attentionOnly")}
            checked={attentionOnly}
            onChange={(e) => setAttentionOnly(e.currentTarget.checked)}
          />
          <Switch
            label={t("dashboard.includeInactive")}
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.currentTarget.checked)}
          />
        </Stack>
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {groups.length === 0 && (
        <Text c="dimmed" ta="center" py="md">
          {data ? t("dashboard.none") : t("dashboard.loading")}
        </Text>
      )}

      {groups.map((g) => {
        const flagged = g.items.filter(
          (i) => i.tag && NEEDS_ATTENTION.has(i.tag),
        );
        return (
          <Paper key={g.ownerId} withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Title order={4}>
                {g.ownerId === UNASSIGNED
                  ? t("reports.projectReview.unassigned")
                  : g.name}
              </Title>
              <Group gap="xs">
                <Badge variant="default">
                  {t("reports.projectReview.projectCount", {
                    count: g.items.length,
                  })}
                </Badge>
                {flagged.length > 0 && (
                  <Badge color="red" variant="light">
                    {t("reports.projectReview.needAttention", {
                      count: flagged.length,
                    })}
                  </Badge>
                )}
              </Group>
            </Group>
            <Table.ScrollContainer minWidth={700}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("dashboard.cols.project")}</Table.Th>
                    <Table.Th>{t("dashboard.cols.customer")}</Table.Th>
                    <Table.Th>{t("projectStatus.fields.indicator")}</Table.Th>
                    <Table.Th>{t("reports.projectReview.asOf")}</Table.Th>
                    <Table.Th>{t("projectStatus.fields.comments")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {g.items.map(({ project, report, tag }) => (
                    <Table.Tr key={project.id}>
                      <Table.Td>
                        <Anchor
                          component={Link}
                          to={`/admin/projects/${project.id}/status`}
                          fw={500}
                        >
                          {project.name}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        {data?.customers[project.customer_id ?? ""] ?? ""}
                      </Table.Td>
                      <Table.Td>
                        {tag ? (
                          <Badge
                            color={INDICATOR_COLOR[tag] ?? "gray"}
                            variant="light"
                          >
                            {t(`projectStatus.indicator.${tag}`)}
                          </Badge>
                        ) : (
                          <Text size="sm" c="dimmed">
                            {t("reports.projectReview.noStatus")}
                          </Text>
                        )}
                        {report && !report.published_at && (
                          <Text size="xs" c="dimmed">
                            {t("projectStatus.state.draft")}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>{report?.range_end ?? "—"}</Table.Td>
                      <Table.Td>
                        {report?.comments ? (
                          <RichTextPreview html={report.comments} />
                        ) : (
                          "—"
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        );
      })}
    </Stack>
  );
}
