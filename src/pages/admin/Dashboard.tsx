import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Group,
  HoverCard,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { RichText } from "@/components/RichTextField";
import { supabase } from "@/lib/supabase-client";

type Health = "red" | "amber" | "green";

type ProjectInfo = {
  id: string;
  name: string | null;
  customer_id: string | null;
  start_date: string | null;
  end_date: string | null;
};
type RiskInfo = {
  project_id: string;
  probability: string;
  impact: string;
  status: string;
};
type IssueInfo = {
  project_id: string;
  severity: string | null;
  status: string | null;
};
type ActionInfo = {
  project_id: string;
  status: string;
  due_date: string | null;
};
type DependencyInfo = {
  project_id: string;
  status: string;
  due_date: string | null;
};
type MilestoneInfo = {
  project_id: string;
  title: string;
  status: string;
  planned_date: string | null;
  forecast_date: string | null;
};
type ChangeOrderInfo = {
  project_id: string;
  status: string;
  currency: string;
  estimated_cost_impact: number;
};
type ReportInfo = {
  project_id: string | null;
  project_status_id: string | null;
  comments: string | null;
  range_end: string | null;
  published_at: string | null;
};

type Data = {
  projects: ProjectInfo[];
  customers: Record<string, string>;
  risks: RiskInfo[];
  issues: IssueInfo[];
  actions: ActionInfo[];
  dependencies: DependencyInfo[];
  milestones: MilestoneInfo[];
  changeOrders: ChangeOrderInfo[];
  reports: ReportInfo[];
  indicators: Record<string, string>;
};

type Row = {
  project: ProjectInfo;
  customer: string;
  status: string | null;
  statusComments: string | null;
  health: Health | null;
  criticalRisks: number;
  highIssues: number;
  overdueActions: number;
  lateMilestones: number;
  atRiskDependencies: number;
  nextMilestone: MilestoneInfo | null;
  pendingChangeOrders: number;
  lastReport: string | null;
  reportStale: boolean;
};

const STALE_REPORT_DAYS = 14;
const STATUS_COLOR: Record<string, string> = {
  onTrack: "green",
  atRisk: "yellow",
  blocked: "red",
  notStarted: "gray",
  onHold: "orange",
  canceled: "dark",
  complete: "teal",
};
const HEALTH_COLOR: Record<Health, string> = {
  red: "red",
  amber: "yellow",
  green: "green",
};
// The dashboard health of a project is its latest reported status.
// Statuses not listed here (not started, on hold, canceled) and projects with
// no report count toward none of the red/amber/green buckets.
const STATUS_HEALTH: Record<string, Health> = {
  blocked: "red",
  atRisk: "amber",
  onTrack: "green",
  complete: "green",
};
const STATUS_ORDER = [
  "blocked",
  "atRisk",
  "onHold",
  "onTrack",
  "notStarted",
  "complete",
  "canceled",
];
const statusRank = (tag: string | null) => {
  const i = tag ? STATUS_ORDER.indexOf(tag) : -1;
  return i === -1 ? STATUS_ORDER.length : i;
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const daysBetween = (fromIso: string, toIso: string) =>
  Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);

const isActive = (p: ProjectInfo, today: string) =>
  (!p.start_date || p.start_date <= today) &&
  (!p.end_date || p.end_date >= today);

// A milestone is late when it is not complete and its current expectation has passed,
// or it has been marked delayed.
const isLate = (m: MilestoneInfo, today: string) =>
  m.status !== "completed" &&
  (m.status === "delayed" ||
    (m.forecast_date ?? m.planned_date ?? "9999-12-31") < today);

const money = (totals: Map<string, number>) =>
  totals.size === 0
    ? "—"
    : [...totals].map(([cur, v]) => `${cur}${v.toLocaleString()}`).join(" · ");

function buildRows(d: Data, today: string): Row[] {
  const by = <T extends { project_id: string | null }>(items: T[]) => {
    const m = new Map<string, T[]>();
    for (const i of items) {
      if (!i.project_id) continue;
      const list = m.get(i.project_id) ?? [];
      list.push(i);
      m.set(i.project_id, list);
    }
    return m;
  };
  const risks = by(d.risks);
  const issues = by(d.issues);
  const actions = by(d.actions);
  const deps = by(d.dependencies);
  const miles = by(d.milestones);
  const cos = by(d.changeOrders);
  const reports = by(d.reports);

  return d.projects.map((project) => {
    const r = (risks.get(project.id) ?? []).filter((x) => x.status === "open");
    const criticalRisks = r.filter(
      (x) => x.probability === "high" && x.impact === "high",
    ).length;
    const highIssues = (issues.get(project.id) ?? []).filter(
      (x) => x.status === "open" && x.severity === "high",
    ).length;
    const overdueActions = (actions.get(project.id) ?? []).filter(
      (x) =>
        (x.status === "open" || x.status === "in_progress") &&
        x.due_date &&
        x.due_date < today,
    ).length;
    const ms = miles.get(project.id) ?? [];
    const lateMilestones = ms.filter((m) => isLate(m, today)).length;
    const atRiskDependencies = (deps.get(project.id) ?? []).filter(
      (x) => x.status === "at_risk",
    ).length;
    const nextMilestone =
      ms
        .filter((m) => m.status !== "completed")
        .sort((a, b) =>
          (a.forecast_date ?? a.planned_date ?? "9999").localeCompare(
            b.forecast_date ?? b.planned_date ?? "9999",
          ),
        )[0] ?? null;
    const pendingChangeOrders = (cos.get(project.id) ?? []).filter(
      (x) => x.status === "submitted",
    ).length;
    const lastReport =
      (reports.get(project.id) ?? [])
        .map((x) => x.published_at)
        .filter((x): x is string => !!x)
        .sort()
        .pop() ?? null;
    const reportStale =
      !lastReport ||
      daysBetween(lastReport.slice(0, 10), today) > STALE_REPORT_DAYS;

    // Current status = the report covering the most recent period.
    let latest: ReportInfo | null = null;
    for (const x of reports.get(project.id) ?? []) {
      if (!latest || (x.range_end ?? "") > (latest.range_end ?? "")) latest = x;
    }
    const status = latest?.project_status_id
      ? (d.indicators[latest.project_status_id] ?? null)
      : null;
    const health = status ? (STATUS_HEALTH[status] ?? null) : null;

    return {
      project,
      customer: d.customers[project.customer_id ?? ""] ?? "",
      status,
      statusComments: latest?.comments?.trim() || null,
      health,
      criticalRisks,
      highIssues,
      overdueActions,
      lateMilestones,
      atRiskDependencies,
      nextMilestone,
      pendingChangeOrders,
      lastReport,
      reportStale,
    };
  });
}

function Kpi({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string | number;
  hint?: string;
  color?: string;
}) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text fz={28} fw={700} c={color} lh={1.2} mt={4}>
        {value}
      </Text>
      {hint && (
        <Text size="xs" c="dimmed" mt={2}>
          {hint}
        </Text>
      )}
    </Paper>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  // RLS limits every query to what the signed-in user can see.
  const load = useCallback(async () => {
    const [p, c, r, i, a, d, m, co, sr, ps] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, customer_id, start_date, end_date")
        .eq("deleted", false),
      supabase.from("customers").select("id, name"),
      supabase
        .from("project_risks")
        .select("project_id, probability, impact, status")
        .eq("deleted", false),
      supabase
        .from("project_issues")
        .select("project_id, severity, status")
        .eq("deleted", false),
      supabase
        .from("project_actions")
        .select("project_id, status, due_date")
        .eq("deleted", false),
      supabase
        .from("project_dependencies")
        .select("project_id, status, due_date")
        .eq("deleted", false),
      supabase
        .from("project_milestones")
        .select("project_id, title, status, planned_date, forecast_date")
        .eq("deleted", false),
      supabase
        .from("project_change_orders")
        .select("project_id, status, currency, estimated_cost_impact")
        .eq("deleted", false),
      supabase
        .from("project_status_reports")
        .select("project_id, project_status_id, comments, range_end, published_at"),
      supabase.from("project_status").select("id, locale_tag"),
    ]);
    const err =
      p.error ??
      c.error ??
      r.error ??
      i.error ??
      a.error ??
      d.error ??
      m.error ??
      co.error ??
      sr.error ??
      ps.error;
    setError(err ? err.message : null);
    setData({
      projects: p.data ?? [],
      customers: Object.fromEntries((c.data ?? []).map((x) => [x.id, x.name])),
      risks: r.data ?? [],
      issues: i.data ?? [],
      actions: a.data ?? [],
      dependencies: d.data ?? [],
      milestones: m.data ?? [],
      changeOrders: co.data ?? [],
      reports: sr.data ?? [],
      indicators: Object.fromEntries(
        (ps.data ?? []).map((x) => [x.id, x.locale_tag]),
      ),
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayIso();
  const rows = useMemo(() => {
    if (!data) return [];
    return buildRows(data, today)
      .filter((r) => includeInactive || isActive(r.project, today))
      .sort(
        (a, b) =>
          statusRank(a.status) - statusRank(b.status) ||
          (a.project.name ?? "").localeCompare(b.project.name ?? ""),
      );
  }, [data, includeInactive, today]);

  const kpi = useMemo(() => {
    const sum = (f: (r: Row) => number) => rows.reduce((n, r) => n + f(r), 0);
    const ids = new Set(rows.map((r) => r.project.id));
    const pendingValue = new Map<string, number>();
    const approvedValue = new Map<string, number>();
    for (const co of data?.changeOrders ?? []) {
      if (!ids.has(co.project_id)) continue;
      const target =
        co.status === "submitted"
          ? pendingValue
          : co.status === "approved" || co.status === "implemented"
            ? approvedValue
            : null;
      target?.set(
        co.currency,
        (target.get(co.currency) ?? 0) + co.estimated_cost_impact,
      );
    }
    const count = (h: Health) => rows.filter((r) => r.health === h).length;
    return {
      projects: rows.length,
      red: count("red"),
      amber: count("amber"),
      green: count("green"),
      criticalRisks: sum((r) => r.criticalRisks),
      highIssues: sum((r) => r.highIssues),
      overdueActions: sum((r) => r.overdueActions),
      lateMilestones: sum((r) => r.lateMilestones),
      atRiskDependencies: sum((r) => r.atRiskDependencies),
      pendingChangeOrders: sum((r) => r.pendingChangeOrders),
      staleReports: rows.filter((r) => r.reportStale).length,
      pendingValue: money(pendingValue),
      approvedValue: money(approvedValue),
      endingSoon: rows.filter(
        (r) =>
          r.project.end_date &&
          daysBetween(today, r.project.end_date) >= 0 &&
          daysBetween(today, r.project.end_date) <= 30,
      ).length,
    };
  }, [rows, data, today]);

  const zeroOk = (n: number) => (n > 0 ? "red" : undefined);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{t("dashboard.title")}</Title>
        <Switch
          label={t("dashboard.includeInactive")}
          checked={includeInactive}
          onChange={(e) => setIncludeInactive(e.currentTarget.checked)}
        />
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <Kpi
          label={t(
            includeInactive ? "dashboard.kpi.projects" : "dashboard.kpi.active",
          )}
          value={kpi.projects}
          hint={t("dashboard.kpi.endingSoon", { count: kpi.endingSoon })}
        />
        <Kpi
          label={t("dashboard.kpi.atRisk")}
          value={kpi.red}
          color={zeroOk(kpi.red)}
          hint={t("dashboard.kpi.atRiskHint", { count: kpi.amber })}
        />
        <Kpi
          label={t("dashboard.kpi.criticalRisks")}
          value={kpi.criticalRisks}
          color={zeroOk(kpi.criticalRisks)}
          hint={t("dashboard.kpi.criticalRisksHint")}
        />
        <Kpi
          label={t("dashboard.kpi.highIssues")}
          value={kpi.highIssues}
          color={zeroOk(kpi.highIssues)}
          hint={t("dashboard.kpi.highIssuesHint")}
        />
        <Kpi
          label={t("dashboard.kpi.lateMilestones")}
          value={kpi.lateMilestones}
          color={zeroOk(kpi.lateMilestones)}
          hint={t("dashboard.kpi.lateMilestonesHint")}
        />
        <Kpi
          label={t("dashboard.kpi.overdueActions")}
          value={kpi.overdueActions}
          color={zeroOk(kpi.overdueActions)}
        />
        <Kpi
          label={t("dashboard.kpi.atRiskDependencies")}
          value={kpi.atRiskDependencies}
          color={zeroOk(kpi.atRiskDependencies)}
        />
        <Kpi
          label={t("dashboard.kpi.pendingChangeOrders")}
          value={kpi.pendingChangeOrders}
          hint={t("dashboard.kpi.pendingValue", { value: kpi.pendingValue })}
        />
        <Kpi
          label={t("dashboard.kpi.approvedValue")}
          value={kpi.approvedValue}
          hint={t("dashboard.kpi.approvedValueHint")}
        />
        <Kpi
          label={t("dashboard.kpi.staleReports")}
          value={kpi.staleReports}
          color={zeroOk(kpi.staleReports)}
          hint={t("dashboard.kpi.staleReportsHint", {
            days: STALE_REPORT_DAYS,
          })}
        />
      </SimpleGrid>

      {kpi.projects > 0 && (
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text fw={500}>{t("dashboard.healthMix")}</Text>
            <Tooltip
              multiline
              w={320}
              label={t("dashboard.healthRule")}
              withArrow
            >
              <Text size="xs" c="dimmed" style={{ cursor: "help" }}>
                {t("dashboard.healthRuleLink")}
              </Text>
            </Tooltip>
          </Group>
          <Progress.Root size={20}>
            {(["red", "amber", "green"] as const).map((h) => (
              <Progress.Section
                key={h}
                value={(kpi[h] / kpi.projects) * 100}
                color={HEALTH_COLOR[h]}
              >
                {kpi[h] > 0 && (
                  <Progress.Label>
                    {kpi[h]} {t(`dashboard.health.${h}`)}
                  </Progress.Label>
                )}
              </Progress.Section>
            ))}
          </Progress.Root>
        </Paper>
      )}

      <Table.ScrollContainer minWidth={900}>
        <Table verticalSpacing="sm" highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("dashboard.cols.project")}</Table.Th>
              <Table.Th>{t("dashboard.cols.customer")}</Table.Th>
              <Table.Th>{t("dashboard.cols.status")}</Table.Th>
              <Table.Th ta="right">
                {t("dashboard.cols.criticalRisks")}
              </Table.Th>
              <Table.Th ta="right">{t("dashboard.cols.highIssues")}</Table.Th>
              <Table.Th ta="right">
                {t("dashboard.cols.overdueActions")}
              </Table.Th>
              <Table.Th ta="right">
                {t("dashboard.cols.lateMilestones")}
              </Table.Th>
              <Table.Th>{t("dashboard.cols.nextMilestone")}</Table.Th>
              <Table.Th ta="right">{t("dashboard.cols.pendingCOs")}</Table.Th>
              <Table.Th>{t("dashboard.cols.lastReport")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={10}>
                  <Text c="dimmed" ta="center" py="md">
                    {data ? t("dashboard.none") : t("dashboard.loading")}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows.map((r) => {
                const n = (v: number, red = true) => (
                  <Text
                    size="sm"
                    ta="right"
                    c={v > 0 && red ? "red" : "dimmed"}
                  >
                    {v}
                  </Text>
                );
                return (
                  <Table.Tr key={r.project.id}>
                    <Table.Td>
                      <Anchor
                        component="button"
                        type="button"
                        fw={500}
                        onClick={() =>
                          navigate(`/admin/projects/${r.project.id}`)
                        }
                      >
                        {r.project.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{r.customer}</Table.Td>
                    <Table.Td>
                      {r.status ? (
                        <HoverCard
                          width={320}
                          shadow="md"
                          withArrow
                          openDelay={150}
                        >
                          <HoverCard.Target>
                            <Badge
                              color={STATUS_COLOR[r.status] ?? "gray"}
                              variant="light"
                              style={{ cursor: "help" }}
                            >
                              {t(`projectStatus.indicator.${r.status}`)}
                            </Badge>
                          </HoverCard.Target>
                          <HoverCard.Dropdown>
                            {r.statusComments ? (
                              <RichText html={r.statusComments} />
                            ) : (
                              <Text size="sm" c="dimmed">
                                {t("dashboard.noStatusText")}
                              </Text>
                            )}
                          </HoverCard.Dropdown>
                        </HoverCard>
                      ) : (
                        <Text size="sm" c="dimmed">
                          {t("reports.projectReview.noStatus")}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>{n(r.criticalRisks)}</Table.Td>
                    <Table.Td>{n(r.highIssues)}</Table.Td>
                    <Table.Td>{n(r.overdueActions)}</Table.Td>
                    <Table.Td>{n(r.lateMilestones)}</Table.Td>
                    <Table.Td>
                      {r.nextMilestone ? (
                        <Stack gap={0}>
                          <Text size="sm">{r.nextMilestone.title}</Text>
                          <Text size="xs" c="dimmed">
                            {r.nextMilestone.forecast_date ??
                              r.nextMilestone.planned_date ??
                              "—"}
                          </Text>
                        </Stack>
                      ) : (
                        "—"
                      )}
                    </Table.Td>
                    <Table.Td>{n(r.pendingChangeOrders, false)}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c={r.reportStale ? "red" : undefined}>
                        {r.lastReport
                          ? r.lastReport.slice(0, 10)
                          : t("dashboard.never")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
