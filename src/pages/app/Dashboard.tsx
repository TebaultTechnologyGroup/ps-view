import { useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Typography,
} from '@mantine/core'
import { IconCheck, IconCircleDashed, IconClockHour4, IconX } from '@tabler/icons-react'
import dayjs from 'dayjs'

type Rag = 'green' | 'yellow' | 'red'

const RAG_LABEL: Record<Rag, string> = { green: 'On Track', yellow: 'At Risk', red: 'Off Track' }

function RagIndicator({ status, withLabel = false }: { status: Rag; withLabel?: boolean }) {
  return (
    <Group gap={6} wrap="nowrap">
      <ThemeIcon color={status} radius="xl" size={16} aria-label={RAG_LABEL[status]}>
        <span />
      </ThemeIcon>
      {withLabel && (
        <Text size="sm" fw={600}>
          {RAG_LABEL[status]}
        </Text>
      )}
    </Group>
  )
}

const fmt = (d: string) => dayjs(d).format('MMM D, YYYY')

// ---------- mock data ----------

const project = {
  name: 'Acme First Start',
  customer: 'Acme Incorporated',
}

const currentStatus = {
  rag: 'yellow' as Rag,
  published: '2026-10-02',
  author: 'Jordan Rivera, Project Manager',
  commentsHtml: `
    <p><strong>Summary:</strong> Build phase is progressing, but we are <em>slightly behind</em> due to delayed access to the Acme staging environment.</p>
    <ul>
      <li>Process models for Order-to-Cash are 80% complete</li>
      <li>Connector development started for SAP integration</li>
      <li>Staging access expected by <strong>Oct 12</strong>; a delay beyond that will push UAT</li>
    </ul>
    <p>Next week: complete remaining BPMN models and begin integration testing.</p>`,
}

const milestones: { name: string; due: string; rag: Rag; comment?: string }[] = [
  { name: 'Staging environment ready', due: '2026-10-12', rag: 'red', comment: 'Acme IT has not yet granted network access.' },
  { name: 'Order-to-Cash models complete', due: '2026-10-16', rag: 'yellow', comment: 'Waiting on SME review of exception paths.' },
  { name: 'SAP integration complete', due: '2026-10-30', rag: 'green' },
  { name: 'User acceptance testing', due: '2026-11-13', rag: 'yellow', comment: 'Dependent on staging environment delivery.' },
  { name: 'Go-live', due: '2026-12-01', rag: 'green' },
]

type ApprovalState = 'Pending approval' | 'Approved' | 'Rejected'

interface ChangeOrder {
  id: string
  date: string
  number: string
  name: string
  impact: string
  status: ApprovalState
  approvedBy?: string
  approvedOn?: string
}

const initialChangeOrders: ChangeOrder[] = [
  { id: '1', date: '2026-09-15', number: 'CO-001', name: 'Add Salesforce integration', impact: '+3 weeks, +$24,000', status: 'Approved', approvedBy: 'Dana Whitfield', approvedOn: '2026-09-20' },
  { id: '2', date: '2026-09-28', number: 'CO-002', name: 'Additional process model: Returns', impact: '+1 week, +$8,000', status: 'Pending approval' },
  { id: '3', date: '2026-10-03', number: 'CO-003', name: 'Extended hypercare period', impact: '+2 weeks, +$12,000', status: 'Pending approval' },
  { id: '4', date: '2026-09-10', number: 'CO-004', name: 'Custom reporting dashboard', impact: '+4 weeks, +$30,000', status: 'Rejected' },
]

const STATUS_COLOR: Record<ApprovalState, string> = {
  'Pending approval': 'yellow',
  Approved: 'green',
  Rejected: 'red',
}

const risks = [
  { id: 'R-01', title: 'Key SME availability limited during Q4', severity: 'High', owner: 'Acme – Priya Shah', due: '2026-10-20' },
  { id: 'R-02', title: 'SAP API rate limits may constrain throughput', severity: 'Medium', owner: 'Camunda – Lee Chen', due: '2026-10-25' },
  { id: 'R-03', title: 'Scope creep from additional departments', severity: 'Medium', owner: 'Camunda – Jordan Rivera', due: '2026-11-01' },
]

const actionItems = [
  { id: 'A-14', title: 'Provide VPN credentials for staging', owner: 'Acme – Tom Becker', due: '2026-10-10', status: 'Overdue' },
  { id: 'A-15', title: 'Review exception-path BPMN diagrams', owner: 'Acme – Priya Shah', due: '2026-10-14', status: 'Open' },
  { id: 'A-17', title: 'Schedule UAT participants', owner: 'Camunda – Jordan Rivera', due: '2026-10-21', status: 'Open' },
]

const issues = [
  { id: 'I-05', title: 'Staging environment unreachable from Camunda network', priority: 'High', owner: 'Acme – Tom Becker', opened: '2026-09-29' },
  { id: 'I-06', title: 'Test data for invoices incomplete', priority: 'Medium', owner: 'Acme – Priya Shah', opened: '2026-10-01' },
]

const dependencies = [
  { id: 'D-02', title: 'SAP sandbox access', dependsOn: 'Acme IT', needed: '2026-10-15', status: 'At Risk' },
  { id: 'D-03', title: 'Signed-off requirements for Returns process', dependsOn: 'Acme Operations', needed: '2026-10-22', status: 'On Track' },
]

type GateState = 'Complete' | 'In progress' | 'Not started'

const gates: { name: string; target: string; state: GateState; approvedBy?: string; approvedOn?: string }[] = [
  { name: 'Discovery complete', target: '2026-08-14', state: 'Complete', approvedBy: 'Dana Whitfield', approvedOn: '2026-08-15' },
  { name: 'Design complete', target: '2026-09-18', state: 'Complete', approvedBy: 'Dana Whitfield', approvedOn: '2026-09-21' },
  { name: 'Build complete', target: '2026-11-06', state: 'In progress' },
  { name: 'Project complete', target: '2026-12-15', state: 'Not started' },
]

const GATE_ICON: Record<GateState, { color: string; icon: ReactNode }> = {
  Complete: { color: 'green', icon: <IconCheck size={14} /> },
  'In progress': { color: 'blue', icon: <IconClockHour4 size={14} /> },
  'Not started': { color: 'gray', icon: <IconCircleDashed size={14} /> },
}

const priorityColor = (p: string) => (p === 'High' ? 'red' : p === 'Medium' ? 'yellow' : 'gray')

// ---------- components ----------

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" mb="md">
        <Title order={3} size="h4">
          {title}
        </Title>
        {count !== undefined && <Badge variant="light" color="gray">{count}</Badge>}
      </Group>
      {children}
    </Card>
  )
}

function ChangeOrdersTable() {
  const [orders, setOrders] = useState(initialChangeOrders)

  const decide = (id: string, status: 'Approved' | 'Rejected') =>
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              approvedBy: status === 'Approved' ? 'Mark Tebault' : undefined,
              approvedOn: status === 'Approved' ? dayjs().format('YYYY-MM-DD') : undefined,
            }
          : o,
      ),
    )

  return (
    <Table.ScrollContainer minWidth={800}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>CO #</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Impact to project</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Approved by</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {orders.map((o) => (
            <Table.Tr key={o.id}>
              <Table.Td>{fmt(o.date)}</Table.Td>
              <Table.Td fw={600}>{o.number}</Table.Td>
              <Table.Td>{o.name}</Table.Td>
              <Table.Td>{o.impact}</Table.Td>
              <Table.Td>
                <Badge color={STATUS_COLOR[o.status]} variant="light">
                  {o.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                {o.status === 'Approved' && o.approvedBy ? (
                  <Text size="sm">
                    {o.approvedBy}
                    <Text span c="dimmed" size="sm">
                      {' '}· {fmt(o.approvedOn!)}
                    </Text>
                  </Text>
                ) : (
                  <Text c="dimmed" size="sm">—</Text>
                )}
              </Table.Td>
              <Table.Td>
                {o.status === 'Pending approval' && (
                  <Group gap="xs" wrap="nowrap">
                    <Button size="compact-sm" color="green" leftSection={<IconCheck size={14} />} onClick={() => decide(o.id, 'Approved')}>
                      Approve
                    </Button>
                    <Button size="compact-sm" color="red" variant="outline" leftSection={<IconX size={14} />} onClick={() => decide(o.id, 'Rejected')}>
                      Reject
                    </Button>
                  </Group>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
}

function SimpleTable<T extends { id: string }>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
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
  )
}

export default function Dashboard() {
  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Text c="dimmed" size="sm" tt="uppercase" fw={600}>
            {project.customer}
          </Text>
          <Title order={1}>{project.name}</Title>
        </div>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Section title="Current Status">
            <Group justify="space-between" mb="sm">
              <RagIndicator status={currentStatus.rag} withLabel />
              <Text size="sm" c="dimmed">
                Published {fmt(currentStatus.published)} · {currentStatus.author}
              </Text>
            </Group>
            <Typography>
              {/* Static mock content; real data must be sanitized before rendering as HTML */}
              <div dangerouslySetInnerHTML={{ __html: currentStatus.commentsHtml }} />
            </Typography>
          </Section>

          <Section title="Upcoming Milestones" count={milestones.length}>
            <Stack gap="sm">
              {milestones.map((m) => (
                <Group key={m.name} align="flex-start" wrap="nowrap" gap="sm">
                  <div style={{ paddingTop: 3 }}>
                    <RagIndicator status={m.rag} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Group justify="space-between" wrap="nowrap">
                      <Text fw={600}>{m.name}</Text>
                      <Text size="sm" c="dimmed">{fmt(m.due)}</Text>
                    </Group>
                    {m.comment && (
                      <Text size="sm" c="dimmed">
                        {m.comment}
                      </Text>
                    )}
                  </div>
                </Group>
              ))}
            </Stack>
          </Section>
        </SimpleGrid>

        <Section title="Open Change Orders" count={initialChangeOrders.filter((o) => o.status === 'Pending approval').length}>
          <ChangeOrdersTable />
        </Section>

        <Section title="Open Risks" count={risks.length}>
          <SimpleTable
            rows={risks}
            columns={[
              { header: 'ID', cell: (r) => <Text fw={600}>{r.id}</Text> },
              { header: 'Risk', cell: (r) => r.title },
              { header: 'Severity', cell: (r) => <Badge variant="light" color={priorityColor(r.severity)}>{r.severity}</Badge> },
              { header: 'Owner', cell: (r) => r.owner },
              { header: 'Mitigation due', cell: (r) => fmt(r.due) },
            ]}
          />
        </Section>

        <Section title="Open Action Items" count={actionItems.length}>
          <SimpleTable
            rows={actionItems}
            columns={[
              { header: 'ID', cell: (r) => <Text fw={600}>{r.id}</Text> },
              { header: 'Action', cell: (r) => r.title },
              { header: 'Owner', cell: (r) => r.owner },
              { header: 'Due', cell: (r) => fmt(r.due) },
              { header: 'Status', cell: (r) => <Badge variant="light" color={r.status === 'Overdue' ? 'red' : 'blue'}>{r.status}</Badge> },
            ]}
          />
        </Section>

        <Section title="Open Issues" count={issues.length}>
          <SimpleTable
            rows={issues}
            columns={[
              { header: 'ID', cell: (r) => <Text fw={600}>{r.id}</Text> },
              { header: 'Issue', cell: (r) => r.title },
              { header: 'Priority', cell: (r) => <Badge variant="light" color={priorityColor(r.priority)}>{r.priority}</Badge> },
              { header: 'Owner', cell: (r) => r.owner },
              { header: 'Opened', cell: (r) => fmt(r.opened) },
            ]}
          />
        </Section>

        <Section title="Open Dependencies" count={dependencies.length}>
          <SimpleTable
            rows={dependencies}
            columns={[
              { header: 'ID', cell: (r) => <Text fw={600}>{r.id}</Text> },
              { header: 'Dependency', cell: (r) => r.title },
              { header: 'Depends on', cell: (r) => r.dependsOn },
              { header: 'Needed by', cell: (r) => fmt(r.needed) },
              { header: 'Status', cell: (r) => <Badge variant="light" color={r.status === 'At Risk' ? 'yellow' : 'green'}>{r.status}</Badge> },
            ]}
          />
        </Section>

        <Section title="Gates & Approvals" count={gates.length}>
          <SimpleTable
            rows={gates.map((g) => ({ ...g, id: g.name }))}
            columns={[
              {
                header: 'Gate',
                cell: (g) => (
                  <Group gap="xs" wrap="nowrap">
                    <ThemeIcon size={24} radius="xl" color={GATE_ICON[g.state].color}>
                      {GATE_ICON[g.state].icon}
                    </ThemeIcon>
                    <Text fw={600}>{g.name}</Text>
                  </Group>
                ),
              },
              { header: 'Target date', cell: (g) => fmt(g.target) },
              { header: 'Status', cell: (g) => <Badge variant="light" color={GATE_ICON[g.state].color}>{g.state}</Badge> },
              {
                header: 'Approved by',
                cell: (g) =>
                  g.approvedBy ? (
                    <Text size="sm">
                      {g.approvedBy}
                      <Text span c="dimmed" size="sm"> · {fmt(g.approvedOn!)}</Text>
                    </Text>
                  ) : (
                    <Text c="dimmed" size="sm">—</Text>
                  ),
              },
            ]}
          />
        </Section>
      </Stack>
    </Container>
  )
}
