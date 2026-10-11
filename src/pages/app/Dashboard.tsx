import {
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

const fmt = (d: string | null) => (d ? dayjs(d).format("MMM D, YYYY") : "—");
const today = () => dayjs().format("YYYY-MM-DD");

// ---------- types ----------

interface Project {
  id: string;
  name: string | null;
  customer_id: string | null;
}
interface StatusReport {
  comments: string | null;
  published_at: string | null;
  range_start: string | null;
  range_end: string | null;
}
interface Milestone {
  id: string;
  milestone_id: string | null;
  title: string;
  notes: string | null;
  status: string;
  planned_date: string | null;
  forecast_date: string | null;
}
interface ChangeOrder {
  id: string;
  change_order_id: string | null;
  title: string;
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
  impact: string;
  due_date: string | null;
}
interface Action {
  id: string;
  action_id: string | null;
  title: string;
  due_date: string | null;
  status: string;
}
interface Issue {
  id: string;
  issue_id: string | null;
  title: string;
  priority: string | null;
  raised_date: string;
}
interface Dependency {
  id: string;
  dependency_id: string | null;
  title: string;
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
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" mb="md">
        <Title order={3} size="h4">
          {title}
        </Title>
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
}: {
  columns: Column<T>[];
  rows: T[];
  empty: string;
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
          {rows.map((r) => (
            <Table.Tr key={r.id}>
              {columns.map((c) => (
                <Table.Td key={c.header}>{c.cell(r)}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

const idCell = (id: string | null) => <Text fw={600}>{id}</Text>;

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // RLS limits everything here to the projects this user has been given access to.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase
        .from("projects")
        .select("id, name, customer_id")
        .eq("deleted", false)
        .order("name"),
      supabase.from("customers").select("id, name"),
    ]).then(([p, c]) => {
      if (cancelled) return;
      const err = p.error ?? c.error;
      if (err) setError(err.message);
      const list = p.data ?? [];
      setProjects(list);
      setCustomers(
        Object.fromEntries((c.data ?? []).map((x) => [x.id, x.name])),
      );
      setProjectId((cur) => cur ?? list[0]?.id ?? null);
      if (list.length === 0) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async (id: string) => {
    const [sr, m, co, r, a, i, d] = await Promise.all([
      supabase
        .from("project_status_reports")
        .select("comments, published_at, range_start, range_end")
        .eq("project_id", id)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(1),
      supabase
        .from("project_milestones")
        .select(
          "id, milestone_id, title, notes, status, planned_date, forecast_date",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .neq("status", "completed"),
      supabase
        .from("project_change_orders")
        .select(
          "id, change_order_id, title, requested_date, status, estimated_cost_impact, estimated_days_impact, currency, approver, decision_date",
        )
        .eq("project_id", id)
        .eq("deleted", false)
        .neq("status", "draft")
        .order("requested_date", { ascending: false }),
      supabase
        .from("project_risks")
        .select("id, risk_id, title, probability, impact, due_date")
        .eq("project_id", id)
        .eq("deleted", false)
        .eq("status", "open"),
      supabase
        .from("project_actions")
        .select("id, action_id, title, due_date, status")
        .eq("project_id", id)
        .eq("deleted", false)
        .in("status", ["open", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("project_issues")
        .select("id, issue_id, title, priority, raised_date")
        .eq("project_id", id)
        .eq("deleted", false)
        .eq("status", "open"),
      supabase
        .from("project_dependencies")
        .select("id, dependency_id, title, related_party, due_date, status")
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

  if (!loading && projects.length === 0) {
    return (
      <AppShell header={{ height: 60 }}>
        <AppHeader />
        <AppShell.Main>
          <Container size="xl" py="xl">
            {error && <Alert color="red">{error}</Alert>}
            <Text c="dimmed">You don't have access to any projects yet.</Text>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

  const pendingCOs = current?.changeOrders.filter(
    (o) => o.status === "submitted",
  ).length;

  return (
    <AppShell header={{ height: 60 }}>
      <AppHeader />
      <AppShell.Main>
        <Container size="xl" py="xl">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-end">
              <div>
                <Text c="dimmed" size="sm" tt="uppercase" fw={600}>
                  {customers[project?.customer_id ?? ""] ?? ""}
                </Text>
                <Title order={1}>{project?.name}</Title>
              </div>
              {projects.length > 1 && (
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
                  <Section title="Current Status">
                    {current.report ? (
                      <>
                        <Text size="sm" c="dimmed" mb="sm">
                          Published {fmt(current.report.published_at)}
                          {current.report.range_start &&
                          current.report.range_end
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
                      <Text c="dimmed">
                        No status report has been published yet.
                      </Text>
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
                          <Group
                            key={m.id}
                            align="flex-start"
                            wrap="nowrap"
                            gap="sm"
                          >
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
                          <Badge
                            color={CO_COLOR[o.status] ?? "gray"}
                            variant="light"
                          >
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
                    columns={[
                      { header: "ID", cell: (r) => idCell(r.risk_id) },
                      { header: "Risk", cell: (r) => r.title },
                      {
                        header: "Probability",
                        cell: (r) => (
                          <Badge
                            variant="light"
                            color={levelColor(r.probability)}
                          >
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

                <Section
                  title="Open Action Items"
                  count={current.actions.length}
                >
                  <SimpleTable
                    rows={current.actions}
                    empty="No open actions"
                    columns={[
                      { header: "ID", cell: (r) => idCell(r.action_id) },
                      { header: "Action", cell: (r) => r.title },
                      { header: "Due", cell: (r) => fmt(r.due_date) },
                      {
                        header: "Status",
                        cell: (r) => {
                          const overdue = !!r.due_date && r.due_date < today();
                          return (
                            <Badge
                              variant="light"
                              color={overdue ? "red" : "blue"}
                            >
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
                    columns={[
                      { header: "ID", cell: (r) => idCell(r.issue_id) },
                      { header: "Issue", cell: (r) => r.title },
                      {
                        header: "Priority",
                        cell: (r) => (
                          <Badge variant="light" color={levelColor(r.priority)}>
                            {cap(r.priority)}
                          </Badge>
                        ),
                      },
                      { header: "Opened", cell: (r) => fmt(r.raised_date) },
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
                    columns={[
                      { header: "ID", cell: (r) => idCell(r.dependency_id) },
                      { header: "Dependency", cell: (r) => r.title },
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
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
