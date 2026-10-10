import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";
import type { Database } from "@/lib/database.types";

type Report = Database["public"]["Tables"]["project_status_reports"]["Row"];

// project_status_id is omitted: there is no status lookup table yet.
export default function ProjectStatus() {
  const { id: projectId } = useParams();
  const { user: me } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [editing, setEditing] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [opened, handlers] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      range_start: "",
      range_end: "",
      comments: "",
      published: false,
    },
    validate: {
      range_start: (v) => (v ? null : "Start is required"),
      range_end: (v, all) =>
        !v
          ? "End is required"
          : v < all.range_start
            ? "End must be on or after start"
            : null,
    },
  });

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("project_status_reports")
      .select("*")
      .eq("project_id", projectId!)
      .order("range_start", { ascending: false });
    setError(error ? error.message : null);
    setReports(data ?? []);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (r: Report | null) => {
    setEditing(r);
    form.setValues({
      range_start: r?.range_start ?? "",
      range_end: r?.range_end ?? "",
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
        <Text fw={500}>Weekly status reports</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => open(null)}>
          Add report
        </Button>
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      <Table withTableBorder highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Period</Table.Th>
            <Table.Th>Comments</Table.Th>
            <Table.Th>State</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {reports.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4}>
                <Text c="dimmed" ta="center" py="md">
                  No status reports yet
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
                <Table.Td>{r.comments}</Table.Td>
                <Table.Td>
                  <Badge
                    variant="light"
                    color={r.published_at ? "green" : "gray"}
                  >
                    {r.published_at ? "Published" : "Draft"}
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
        title={editing ? "Edit report" : "Add report"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            <Group grow align="flex-start">
              <TextInput
                type="date"
                label="Period start"
                {...form.getInputProps("range_start")}
              />
              <TextInput
                type="date"
                label="Period end"
                {...form.getInputProps("range_end")}
              />
            </Group>
            <Textarea
              label="Comments"
              autosize
              minRows={4}
              {...form.getInputProps("comments")}
            />
            <Group justify="space-between">
              <label>
                <input
                  type="checkbox"
                  {...form.getInputProps("published", { type: "checkbox" })}
                />{" "}
                Published
              </label>
              <Group>
                <Button variant="default" onClick={handlers.close}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save
                </Button>
              </Group>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
