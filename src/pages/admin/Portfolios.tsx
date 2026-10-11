import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Modal,
  MultiSelect,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";
import type { Database } from "@/lib/database.types";

type Portfolio = Database["public"]["Tables"]["portfolios"]["Row"];
type Option = { value: string; label: string };

export default function Portfolios() {
  const { user: me } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  // portfolio id -> member project ids
  const [members, setMembers] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Portfolio | null>(null);
  const [deleting, setDeleting] = useState<Portfolio | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, handlers] = useDisclosure(false);

  const form = useForm({
    initialValues: { name: "", customer_id: "", project_ids: [] as string[] },
    validate: { name: (v) => (v.trim() ? null : "Name is required") },
  });

  const load = useCallback(async () => {
    const [p, c, pr, pp] = await Promise.all([
      supabase.from("portfolios").select("*").eq("deleted", false),
      supabase.from("customers").select("id, name"),
      supabase.from("projects").select("id, name").eq("deleted", false),
      supabase.from("portfolio_projects").select("portfolio_id, project_id"),
    ]);
    const err = p.error ?? c.error ?? pr.error ?? pp.error;
    setError(err ? err.message : null);
    setPortfolios(p.data ?? []);
    setCustomers((c.data ?? []).map((x) => ({ value: x.id, label: x.name })));
    setProjects(
      (pr.data ?? []).map((x) => ({ value: x.id, label: x.name ?? x.id })),
    );
    const byPortfolio: Record<string, string[]> = {};
    for (const x of pp.data ?? [])
      (byPortfolio[x.portfolio_id] ??= []).push(x.project_id);
    setMembers(byPortfolio);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (p: Portfolio | null) => {
    setEditing(p);
    form.setValues({
      name: p?.name ?? "",
      customer_id: p?.customer_id ?? "",
      project_ids: p ? (members[p.id] ?? []) : [],
    });
    form.resetDirty();
    form.clearErrors();
    setFormError(null);
    handlers.open();
  };

  const submit = async (v: typeof form.values) => {
    setSaving(true);
    setFormError(null);
    const now = new Date().toISOString();
    const id = editing?.id ?? crypto.randomUUID();
    const fields = {
      name: v.name.trim(),
      customer_id: v.customer_id || null,
      updated_by: me?.userId,
      updated_at: now,
    };
    const saved = editing
      ? await supabase.from("portfolios").update(fields).eq("id", id)
      : await supabase
          .from("portfolios")
          .insert({ id, created_by: me?.userId, ...fields });
    if (saved.error) {
      setSaving(false);
      return setFormError(saved.error.message);
    }

    // sync membership: remove dropped projects, add new ones
    const before = members[id] ?? [];
    const removed = before.filter((x) => !v.project_ids.includes(x));
    const added = v.project_ids.filter((x) => !before.includes(x));
    let err = null;
    if (removed.length) {
      err = (
        await supabase
          .from("portfolio_projects")
          .delete()
          .eq("portfolio_id", id)
          .in("project_id", removed)
      ).error;
    }
    if (!err && added.length) {
      err = (
        await supabase.from("portfolio_projects").insert(
          added.map((project_id) => ({
            portfolio_id: id,
            project_id,
            updated_by: me?.userId,
          })),
        )
      ).error;
    }
    setSaving(false);
    if (err) {
      await load();
      return setFormError(err.message);
    }
    handlers.close();
    await load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("portfolios")
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

  const customerName = (id: string | null) =>
    customers.find((c) => c.value === id)?.label ?? "";
  const projectName = (id: string) =>
    projects.find((p) => p.value === id)?.label ?? id;

  const query = search.trim().toLowerCase();
  const visible = portfolios
    .filter((p) =>
      [p.name, customerName(p.customer_id)].some((v) =>
        v?.toLowerCase().includes(query),
      ),
    )
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Portfolios</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => open(null)}>
          Add portfolio
        </Button>
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextInput
        placeholder="Search portfolios"
        aria-label="Search portfolios"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        maw={400}
      />

      <Table verticalSpacing="sm" highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Projects</Table.Th>
            <Table.Th w={60} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed" ta="center" py="md">
                  {loading
                    ? "Loading…"
                    : portfolios.length === 0
                      ? "No portfolios yet"
                      : "No portfolios match your search"}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            visible.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>
                  <Anchor
                    component="button"
                    type="button"
                    fw={500}
                    onClick={() => open(p)}
                  >
                    {p.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{customerName(p.customer_id)}</Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {(members[p.id] ?? []).map((id) => (
                      <Badge key={id} variant="light" color="gray">
                        {projectName(id)}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Tooltip label="Delete">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => setDeleting(p)}
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
        title={editing ? "Edit portfolio" : "Add portfolio"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label="Name"
              data-autofocus
              {...form.getInputProps("name")}
            />
            <Select
              label="Customer"
              searchable
              clearable
              data={customers}
              {...form.getInputProps("customer_id")}
            />
            <MultiSelect
              label="Projects"
              searchable
              clearable
              data={projects}
              {...form.getInputProps("project_ids")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={handlers.close}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete portfolio"
      >
        <Stack>
          <Text>
            Are you sure you want to delete <b>{deleting?.name}</b>? Its
            projects are not deleted.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
