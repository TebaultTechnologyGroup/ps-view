import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase-client";

type Perm = {
  id: string;
  type: string | null;
  target_id: string | null;
  level: string | null;
};
type Option = { value: string; label: string };

const TYPES = [
  { value: "user", label: "User" },
  { value: "group", label: "Group" },
  { value: "customer", label: "Customer" },
];
// TODO: confirm the level values the policies/app should use
const LEVELS = [
  { value: "view", label: "View" },
  { value: "edit", label: "Edit" },
];

// Controls who can see the project (project_permissions)
export default function ProjectPermissions({
  projectId,
}: {
  projectId: string;
}) {
  const [perms, setPerms] = useState<Perm[]>([]);
  const [targets, setTargets] = useState<Record<string, Option[]>>({});
  const [type, setType] = useState<string>("user");
  const [target, setTarget] = useState<string | null>(null);
  const [level, setLevel] = useState<string>("view");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, u, g, c] = await Promise.all([
      supabase
        .from("project_permissions")
        .select("*")
        .eq("project_id", projectId),
      supabase
        .from("users")
        .select("id, full_name, email")
        .eq("deleted", false),
      supabase.from("groups").select("id, name").eq("deleted", false),
      supabase.from("customers").select("id, name"),
    ]);
    const err = p.error ?? u.error ?? g.error ?? c.error;
    setError(err ? err.message : null);
    setPerms(p.data ?? []);
    setTargets({
      user: (u.data ?? []).map((x) => ({
        value: x.id,
        label: x.full_name || x.email || x.id,
      })),
      group: (g.data ?? []).map((x) => ({
        value: x.id,
        label: x.name ?? x.id,
      })),
      customer: (c.data ?? []).map((x) => ({ value: x.id, label: x.name })),
    });
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const labelFor = (p: Perm) =>
    targets[p.type ?? ""]?.find((o) => o.value === p.target_id)?.label ??
    p.target_id;

  const add = async () => {
    if (!target) return;
    const { error } = await supabase.from("project_permissions").insert({
      id: crypto.randomUUID(),
      project_id: projectId,
      type,
      target_id: target,
      level,
    });
    if (error) return setError(error.message);
    setTarget(null);
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("project_permissions")
      .delete()
      .eq("id", id);
    if (error) setError(error.message);
    else await load();
  };

  return (
    <Stack>
      <Title order={4}>Who can see this project</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Group align="flex-end">
        <Select
          label="Type"
          data={TYPES}
          allowDeselect={false}
          value={type}
          onChange={(v) => {
            setType(v ?? "user");
            setTarget(null);
          }}
        />
        <Select
          label="Who"
          searchable
          data={targets[type] ?? []}
          value={target}
          onChange={setTarget}
          w={260}
        />
        <Select
          label="Level"
          data={LEVELS}
          allowDeselect={false}
          value={level}
          onChange={(v) => setLevel(v ?? "view")}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={add}
          disabled={!target}
        >
          Add
        </Button>
      </Group>
      <Table withTableBorder>
        <Table.Tbody>
          {perms.length === 0 ? (
            <Table.Tr>
              <Table.Td>
                <Text c="dimmed">
                  Only Camunda staff and the owner can see this project.
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            perms.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.type}</Table.Td>
                <Table.Td>{labelFor(p)}</Table.Td>
                <Table.Td>{p.level}</Table.Td>
                <Table.Td w={60}>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label="Remove"
                    onClick={() => remove(p.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
