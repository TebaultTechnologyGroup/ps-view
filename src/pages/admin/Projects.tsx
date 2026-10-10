import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";
import type { Database } from "@/lib/database.types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export default function Projects() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<ProjectRow | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from("projects").select("*").eq("deleted", false),
      supabase.from("customers").select("id, name"),
    ]);
    const err = p.error ?? c.error;
    setError(err ? err.message : null);
    setProjects(p.data ?? []);
    setCustomers(Object.fromEntries((c.data ?? []).map((x) => [x.id, x.name])));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("projects")
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

  const query = search.trim().toLowerCase();
  const visible = projects
    .filter((p) =>
      [p.name, customers[p.customer_id ?? ""]].some((v) =>
        v?.toLowerCase().includes(query),
      ),
    )
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Projects</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate("/admin/projects/new")}
        >
          Add project
        </Button>
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextInput
        placeholder="Search projects"
        aria-label="Search projects"
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
            <Table.Th>Start</Table.Th>
            <Table.Th>End</Table.Th>
            <Table.Th w={100} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Text c="dimmed" ta="center" py="md">
                  {loading
                    ? "Loading…"
                    : projects.length === 0
                      ? "No projects yet"
                      : "No projects match your search"}
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
                    onClick={() => navigate(`/admin/projects/${p.id}`)}
                  >
                    {p.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{customers[p.customer_id ?? ""]}</Table.Td>
                <Table.Td>{p.start_date}</Table.Td>
                <Table.Td>{p.end_date}</Table.Td>
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
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete project"
      >
        <Stack>
          <Text>
            Are you sure you want to delete <b>{deleting?.name}</b>?
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
