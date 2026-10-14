import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  AppShell,
  Badge,
  Card,
  Container,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Typography,
} from "@mantine/core";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase-client";
import AppHeader from "./AppHeader";
import { sanitize } from "@/components/RichTextField";

type Rag = "green" | "yellow" | "red";

const RAG_LABEL: Record<Rag, string> = {
  green: "On Track",
  yellow: "At Risk",
  red: "Off Track",
};

function RagIndicator({ status }: { status: Rag }) {
  return (
    <ThemeIcon
      color={status}
      radius="xl"
      size={16}
      aria-label={RAG_LABEL[status]}
    >
      <span />
    </ThemeIcon>
  );
}

const INDICATOR_COLOR: Record<string, string> = {
  onTrack: "green",
  atRisk: "yellow",
  blocked: "red",
  notStarted: "gray",
  onHold: "orange",
  canceled: "dark",
  complete: "teal",
};

const fmt = (d: string | null) => (d ? dayjs(d).format("MMM D, YYYY") : "—");
const today = () => dayjs().format("YYYY-MM-DD");

// ---------- types ----------

interface Project {
  id: string;
  name: string | null;
  customer_id: string | null;
}
interface StatusReport {
  project_status_id: string | null;
  comments: string | null;
  published_at: string | null;
  range_start: string | null;
  range_end: string | null;
}
interface Milestone {
  id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  status: string;
  planned_date: string | null;
  forecast_date: string | null;
}
interface ChangeOrder {
  id: string;
  change_order_id: string | null;
  title: string;
  description: string | null;
  justification: string | null;
  requested_date: string;
  status: string;
  estimated_cost_impact: number;
  estimated_days_impact: number;
  currency: string;
  approver: string | null;
  decision_date: string | null;
}
interface Risk {
  id: string;
  risk_id: string | null;
  title: string;
  probability: string;
  description: string | null;
  mitigation: string | null;
  impact: string;
  due_date: string | null;
}
interface Action {
  id: string;
  action_id: string | null;
  title: string;
  description: string | null;
  resolution: string | null;
  priority: string;
  due_date: string | null;
  status: string;
}
interface Issue {
  id: string;
  issue_id: string | null;
  title: string;
  description: string | null;
  action_plan: string | null;
  resolution: string | null;
  severity: string | null;
  priority: string | null;
  status: string | null;
  raised_date: string;
  target_date: string | null;
  has_budget_impact: boolean | null;
  has_schedule_impact: boolean | null;
  has_scope_impact: boolean | null;
  estimated_cost_impact: number | null;
  estimated_days_delayed: number | null;
  currency: string | null;
}
interface Dependency {
  id: string;
  dependency_id: string | null;
  title: string;
  description: string | null;
  impact: string | null;
  resolution: string | null;
  dependency_type: string;
  direction: string;
  priority: string;
  related_party: string | null;
  due_date: string | null;
  status: string;
}

interface Data {
  projectId: string;
  report: StatusReport | null;
  milestones: Milestone[];
  changeOrders: ChangeOrder[];
  risks: Risk[];
  actions: Action[];
  issues: Issue[];
  dependencies: Dependency[];
}

// ---------- display helpers ----------

const LEVEL_RANK: Record<string, number> = { low: 1, medium: 2, high: 3 };
const levelColor = (p: string | null) =>
  p === "high" ? "red" : p === "medium" ? "yellow" : "gray";
const cap = (s: string | null) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "—";

const milestoneDate = (m: Milestone) => m.forecast_date ?? m.planned_date;

const milestoneRag = (m: Milestone): Rag => {
  const date = milestoneDate(m);
  if (m.status === "delayed" || (date && date < today())) return "red";
  if (m.status === "at_risk") return "yellow";
  return "green";
};

const CO_COLOR: Record<string, string> = {
  submitted: "yellow",
  approved: "green",
  implemented: "teal",
  rejected: "red",
};
const CO_LABEL: Record<string, string> = { submitted: "Pending approval" };

const coImpact = (o: ChangeOrder) => {
  const parts = [
    o.estimated_days_impact
      ? `${o.estimated_days_impact > 0 ? "+" : ""}${o.estimated_days_impact} days`
      : null,
    o.estimated_cost_impact
      ? `${o.estimated_cost_impact > 0 ? "+" : ""}${o.currency}${o.estimated_cost_impact.toLocaleString()}`
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
};

// ---------- components ----------

function Section({
  title,
  count,
  badge,
  children,
}: {
  title: string;
  count?: number;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <Title order={3} size="h4">
            {title}
          </Title>
          {badge}
        </Group>
        {count !== undefined && (
          <Badge variant="light" color="gray">
            {count}
          </Badge>
        )}
      </Group>
      {children}
    </Card>
  );
}

interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

function SimpleTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  detail,
}: {
  columns: Column<T>[];
  rows: T[];
  empty: string;
  // optional full-width row rendered beneath each data row
  detail?: (row: T) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="sm">
        {empty}
      </Text>
    );
  }
  return (
    <Table.ScrollContainer minWidth={600}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th key={c.header}>{c.header}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => {
            const extra = detail?.(r);
            return (
              <Fragment key={r.id}>
                <Table.Tr style={extra ? { borderBottom: "none" } : undefined}>
                  {columns.map((c) => (
                    <Table.Td key={c.header}>{c.cell(r)}</Table.Td>
                  ))}
                </Table.Tr>
                {extra && (
                  <Table.Tr>
                    <Table.Td colSpan={columns.length} pt={0}>
                      {extra}
                    </Table.Td>
                  </Table.Tr>
                )}
              </Fragment>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

const idCell = (id: string | null) => <Text fw={600}>{id}</Text>;
const bCell = (value: string) => <Text fw={600}>{value}</Text>;

function RichBlock({ label, html }: { label: string; html: string }) {
  return (
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>
        {label}
      </Text>
      <Typography fz="sm">
        <div dangerouslySetInnerHTML={{ __html: sanitize(html) }} />
      </Typography>
    </div>
  );
}

// Full-width row of labelled rich-text fields; empty fields are skipped.
function richDetails(blocks: [label: string, html: string | null][]) {
  const shown = blocks.filter(([, html]) => html && html.trim());
  if (shown.length === 0) return null;
  return (
    <SimpleGrid cols={{ base: 1, sm: Math.min(shown.length, 3) }} spacing="lg">
      {shown.map(([label, html]) => (
        <RichBlock key={label} label={label} html={html!} />
      ))}
    </SimpleGrid>
  );
}

const yesNo = (v: string | null) => (v ? cap(v) : "—");

const issueImpact = (i: Issue) => {
  const parts = [
    i.has_budget_impact
      ? `Budget${i.estimated_cost_impact ? ` (${i.currency ?? ""}${i.estimated_cost_impact.toLocaleString()})` : ""}`
      : null,
    i.has_schedule_impact
      ? `Schedule${i.estimated_days_delayed ? ` (${i.estimated_days_delayed} days)` : ""}`
      : null,
    i.has_scope_impact ? "Scope" : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
};

// With `projectId` the page is embedded (e.g. in the admin project view): it is
// pinned to that project and renders without the customer app shell.
export default function Dashboard({
  projectId: fixedId,
}: {
  projectId?: string;
}) {
  const { t } = useTranslation();
  const [indicators, setIndicators] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState<string | null>(fixedId ?? null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RLS limits everything here to the projects this user has been given access to.
  useEffect(() => {
    let cancelled = false;
    setProjectId(fixedId ?? null);
    Promise.all([
      (fixedId
        ? supabase
            .from("projects")
            .select("id, name, customer_id")
            .eq("id", fixedId)
        : supabase.from("projects").select("id, name, customer_id")
      )
        .eq("deleted", false)
        .order("name"),
      supabase.from("customers").select("id, name"),
      supabase.from("project_status").select("id, locale_tag"),
    ]).then(([p, c, ps]) => {
      if (cancelled) return;
      const err = p.error ?? c.error ?? ps.error;
      if (err) setError(err.message);
      const list = p.data ?? [];
      setProjects(list);
      setCustomers(
        Object.fromEntries((c.data ?? []).map((x) => [x.id, x.name])),
      );
      setIndicators(
        Object.fromEntries((ps.data ?? []).map((x) => [x.id, x.locale_tag])),
      );
      setProjectId((cur) => cur ?? list[0]?.id ?? null);
      if (list.length === 0) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fixedId]);

  const load = useCallback(async (id: string) => {
    const [sr, m, co, r, a, i, d] = await Promise.all([
      supabase
        .from("project_status_reports")
        .select(
          "project_status_id, comments, published_at, range_start, range_end",
        )
        .eq("project_id", id)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(1),
      supabase
        .from("project_milestones")
        .select(
          "id, milestone_id, title, description, notes, status, planned_date, forecast_date",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .neq("status", "completed"),
      supabase
        .from("project_change_orders")
        .select(
          "id, change_order_id, title, description, justification, requested_date, status, estimated_cost_impact, estimated_days_impact, currency, approver, decision_date",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .neq("status", "draft")
        .order("requested_date", { ascending: false }),
      supabase
        .from("project_risks")
        .select(
          "id, risk_id, title, probability, description, mitigation, impact, due_date",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .eq("status", "open"),
      supabase
        .from("project_actions")
        .select(
          "id, action_id, title, description, resolution, priority, due_date, status",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .in("status", ["open", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("project_issues")
        .select(
          "id, issue_id, title, description, action_plan, resolution, severity, priority, status, raised_date, target_date, has_budget_impact, has_schedule_impact, has_scope_impact, estimated_cost_impact, estimated_days_delayed, currency",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .eq("status", "open"),
      supabase
        .from("project_dependencies")
        .select(
          "id, dependency_id, title, description, impact, resolution, dependency_type, direction, priority, related_party, due_date, status",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .in("status", ["open", "at_risk"])
        .order("due_date", { ascending: true, nullsFirst: false }),
    ]);
    const err =
      sr.error ??
      m.error ??
      co.error ??
      r.error ??
      a.error ??
      i.error ??
      d.error;
    setError(err ? err.message : null);
    setData({
      projectId: id,
      report: sr.data?.[0] ?? null,
      milestones: (m.data ?? []).sort((x, y) =>
        (milestoneDate(x) ?? "9999").localeCompare(milestoneDate(y) ?? "9999"),
      ),
      changeOrders: co.data ?? [],
      risks: (r.data ?? []).sort(
        (x, y) =>
          LEVEL_RANK[y.probability] * LEVEL_RANK[y.impact] -
          LEVEL_RANK[x.probability] * LEVEL_RANK[x.impact],
      ),
      actions: a.data ?? [],
      issues: (i.data ?? []).sort(
        (x, y) =>
          (LEVEL_RANK[y.priority ?? ""] ?? 0) -
          (LEVEL_RANK[x.priority ?? ""] ?? 0),
      ),
      dependencies: d.data ?? [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    load(projectId).catch((e) => {
      if (!cancelled) setError(String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, load]);

  // data from a previously selected project counts as not loaded
  const current = data?.projectId === projectId ? data : null;
  const project = projects.find((p) => p.id === projectId);
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name ?? p.id })),
    [projects],
  );

  const shell = (content: ReactNode) =>
    fixedId ? (
      content
    ) : (
      <AppShell header={{ height: 60 }}>
        <AppHeader />
        <AppShell.Main>
          <Container size="xl" py="xl">
            {content}
          </Container>
        </AppShell.Main>
      </AppShell>
    );

  if (!loading && projects.length === 0) {
    return shell(
      <>
        {error && <Alert color="red">{error}</Alert>}
        <Text c="dimmed">
          {fixedId
            ? "Project not found."
            : "You don't have access to any projects yet."}
        </Text>
      </>,
    );
  }

  const indicatorTag = indicators[current?.report?.project_status_id ?? ""];

  const pendingCOs = current?.changeOrders.filter(
    (o) => o.status === "submitted",
  ).length;

  return shell(
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text c="dimmed" size="sm" tt="uppercase" fw={600}>
            {customers[project?.customer_id ?? ""] ?? ""}
          </Text>
          <Title order={1}>{project?.name}</Title>
        </div>
        {!fixedId && projects.length > 1 && (
          <Select
            aria-label="Project"
            data={projectOptions}
            value={projectId}
            onChange={(v) => v && setProjectId(v)}
            allowDeselect={false}
            w={280}
          />
        )}
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!current ? (
        <Text c="dimmed">Loading…</Text>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Section
              title="Current Status"
              badge={
                indicatorTag && (
                  <Badge
                    variant="light"
                    color={INDICATOR_COLOR[indicatorTag] ?? "gray"}
                  >
                    {t(`projectStatus.indicator.${indicatorTag}`)}
                  </Badge>
                )
              }
            >
              {current.report ? (
                <>
                  <Text size="sm" c="dimmed" mb="sm">
                    Published {fmt(current.report.published_at)}
                    {current.report.range_start && current.report.range_end
                      ? ` · covers ${fmt(current.report.range_start)} – ${fmt(current.report.range_end)}`
                      : ""}
                  </Text>
                  <Typography>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: sanitize(current.report.comments ?? ""),
                      }}
                    />
                  </Typography>
                </>
              ) : (
                <Text c="dimmed">No status report has been published yet.</Text>
              )}
            </Section>

            <Section
              title="Upcoming Milestones"
              count={current.milestones.length}
            >
              {current.milestones.length === 0 ? (
                <Text c="dimmed" ta="center" py="sm">
                  No upcoming milestones
                </Text>
              ) : (
                <Stack gap="sm">
                  {current.milestones.map((m) => (
                    <Group key={m.id} align="flex-start" wrap="nowrap" gap="sm">
                      <div style={{ paddingTop: 3 }}>
                        <RagIndicator status={milestoneRag(m)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Group justify="space-between" wrap="nowrap">
                          <Text fw={600}>{m.title}</Text>
                          <Text size="sm" c="dimmed">
                            {fmt(milestoneDate(m))}
                          </Text>
                        </Group>
                        {m.forecast_date &&
                          m.planned_date &&
                          m.forecast_date !== m.planned_date && (
                            <Text size="xs" c="dimmed">
                              Originally planned {fmt(m.planned_date)}
                            </Text>
                          )}
                        {m.description && (
                          <Typography fz="sm">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: sanitize(m.description),
                              }}
                            />
                          </Typography>
                        )}
                        {m.notes && (
                          <Typography fz="sm" c="dimmed">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: sanitize(m.notes),
                              }}
                            />
                          </Typography>
                        )}
                      </div>
                    </Group>
                  ))}
                </Stack>
              )}
            </Section>
          </SimpleGrid>

          <Section title="Change Orders" count={pendingCOs}>
            <SimpleTable
              rows={current.changeOrders}
              empty="No change orders"
              detail={(o) =>
                richDetails([
                  ["Description", o.description],
                  ["Justification", o.justification],
                ])
              }
              columns={[
                { header: "Date", cell: (o) => fmt(o.requested_date) },
                {
                  header: "CO #",
                  cell: (o) => idCell(o.change_order_id),
                },
                { header: "Name", cell: (o) => o.title },
                { header: "Impact to project", cell: coImpact },
                {
                  header: "Status",
                  cell: (o) => (
                    <Badge color={CO_COLOR[o.status] ?? "gray"} variant="light">
                      {CO_LABEL[o.status] ?? cap(o.status)}
                    </Badge>
                  ),
                },
                {
                  header: "Decision",
                  cell: (o) =>
                    o.approver || o.decision_date ? (
                      <Text size="sm">
                        {o.approver}
                        <Text span c="dimmed" size="sm">
                          {o.approver && o.decision_date ? " · " : ""}
                          {o.decision_date ? fmt(o.decision_date) : ""}
                        </Text>
                      </Text>
                    ) : (
                      <Text c="dimmed" size="sm">
                        —
                      </Text>
                    ),
                },
              ]}
            />
          </Section>

          <Section title="Open Risks" count={current.risks.length}>
            <SimpleTable
              rows={current.risks}
              empty="No open risks"
              detail={(r) =>
                richDetails([
                  ["Description", r.description],
                  ["Mitigation", r.mitigation],
                ])
              }
              columns={[
                { header: "ID", cell: (r) => idCell(r.risk_id) },
                { header: "Risk", cell: (r) => bCell(r.title) },
                {
                  header: "Probability",
                  cell: (r) => (
                    <Badge variant="light" color={levelColor(r.probability)}>
                      {cap(r.probability)}
                    </Badge>
                  ),
                },
                {
                  header: "Impact",
                  cell: (r) => (
                    <Badge variant="light" color={levelColor(r.impact)}>
                      {cap(r.impact)}
                    </Badge>
                  ),
                },
                { header: "Due", cell: (r) => fmt(r.due_date) },
              ]}
            />
          </Section>

          <Section title="Open Action Items" count={current.actions.length}>
            <SimpleTable
              rows={current.actions}
              empty="No open actions"
              detail={(r) =>
                richDetails([
                  ["Description", r.description],
                  ["Resolution", r.resolution],
                ])
              }
              columns={[
                { header: "ID", cell: (r) => idCell(r.action_id) },
                { header: "Action", cell: (r) => bCell(r.title) },
                {
                  header: "Priority",
                  cell: (r) => (
                    <Badge variant="light" color={levelColor(r.priority)}>
                      {cap(r.priority)}
                    </Badge>
                  ),
                },
                { header: "Due", cell: (r) => fmt(r.due_date) },
                {
                  header: "Status",
                  cell: (r) => {
                    const overdue = !!r.due_date && r.due_date < today();
                    return (
                      <Badge variant="light" color={overdue ? "red" : "blue"}>
                        {overdue ? "Overdue" : cap(r.status)}
                      </Badge>
                    );
                  },
                },
              ]}
            />
          </Section>

          <Section title="Open Issues" count={current.issues.length}>
            <SimpleTable
              rows={current.issues}
              empty="No open issues"
              detail={(r) =>
                richDetails([
                  ["Description", r.description],
                  ["Action plan", r.action_plan],
                  ["Resolution", r.resolution],
                ])
              }
              columns={[
                { header: "ID", cell: (r) => idCell(r.issue_id) },
                { header: "Issue", cell: (r) => bCell(r.title) },
                {
                  header: "Severity",
                  cell: (r) => (
                    <Badge variant="light" color={levelColor(r.severity)}>
                      {cap(r.severity)}
                    </Badge>
                  ),
                },
                {
                  header: "Priority",
                  cell: (r) => (
                    <Badge variant="light" color={levelColor(r.priority)}>
                      {cap(r.priority)}
                    </Badge>
                  ),
                },
                { header: "Impact", cell: issueImpact },
                { header: "Status", cell: (r) => yesNo(r.status) },
                { header: "Opened", cell: (r) => fmt(r.raised_date) },
                { header: "Target", cell: (r) => fmt(r.target_date) },
              ]}
            />
          </Section>

          <Section
            title="Open Dependencies"
            count={current.dependencies.length}
          >
            <SimpleTable
              rows={current.dependencies}
              empty="No open dependencies"
              detail={(r) =>
                richDetails([
                  ["Description", r.description],
                  ["Impact", r.impact],
                  ["Resolution", r.resolution],
                ])
              }
              columns={[
                { header: "ID", cell: (r) => idCell(r.dependency_id) },
                { header: "Dependency", cell: (r) => bCell(r.title) },
                {
                  header: "Type",
                  cell: (r) =>
                    `${cap(r.dependency_type)} · ${cap(r.direction)}`,
                },
                {
                  header: "Priority",
                  cell: (r) => (
                    <Badge variant="light" color={levelColor(r.priority)}>
                      {cap(r.priority)}
                    </Badge>
                  ),
                },
                {
                  header: "Depends on",
                  cell: (r) => r.related_party ?? "—",
                },
                { header: "Needed by", cell: (r) => fmt(r.due_date) },
                {
                  header: "Status",
                  cell: (r) => (
                    <Badge
                      variant="light"
                      color={r.status === "at_risk" ? "yellow" : "blue"}
                    >
                      {cap(r.status)}
                    </Badge>
                  ),
                },
              ]}
            />
          </Section>
        </>
      )}
    </Stack>,
  );
}
