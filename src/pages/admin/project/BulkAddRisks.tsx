import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Textarea,
} from "@mantine/core";
import Papa from "papaparse";
import * as z from "zod";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";

type Owner = { value: string; label: string; email: string };

const COLUMNS = [
  "risk_number",
  "title",
  "description",
  "probability",
  "impact",
  "status",
  "mitigation",
  "owner",
  "due_date",
];

const level = z.enum(["low", "medium", "high"]);
const rowSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string(),
  probability: level,
  impact: level,
  status: z.enum(["open", "mitigated", "accepted", "closed"]),
  mitigation: z.string(),
  owner: z.string(),
  due_date: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD"),
});

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Description/mitigation are stored as HTML (rich text editor)
const toHtml = (s: string) =>
  s.trim() ? `<p>${escapeHtml(s.trim()).replace(/\r?\n/g, "<br>")}</p>` : null;

type Parsed = {
  line: number;
  data?: z.infer<typeof rowSchema> & { owner_id: string | null };
  errors: string[];
};

function parse(
  text: string,
  owners: Owner[],
): { rows: Parsed[]; problem?: string } {
  const res = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: "greedy",
    // spreadsheets paste as tab-separated; CSV files as commas
    delimitersToGuess: [",", "\t", ";"],
    transformHeader: (h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_"),
  });
  const headers = res.meta.fields ?? [];
  if (!headers.includes("title"))
    return {
      rows: [],
      problem:
        'The first row must be a header row that includes a "title" column.',
    };

  const rows = res.data.map((raw, i): Parsed => {
    const get = (k: string) => (raw[k] ?? "").trim();
    const candidate = {
      title: get("title"),
      description: raw.description ?? "",
      probability: get("probability").toLowerCase() || "medium",
      impact: get("impact").toLowerCase() || "medium",
      status: get("status").toLowerCase() || "open",
      mitigation: raw.mitigation ?? "",
      owner: get("owner"),
      due_date: get("due_date"),
    };
    const parsed = rowSchema.safeParse(candidate);
    const errors = parsed.success
      ? []
      : parsed.error.issues.map((e) => `${String(e.path[0])}: ${e.message}`);
    let owner_id: string | null = null;
    if (candidate.owner) {
      const o = owners.find(
        (x) => x.email.toLowerCase() === candidate.owner.toLowerCase(),
      );
      if (o) owner_id = o.value;
      else
        errors.push(`owner: no Camunda user with email "${candidate.owner}"`);
    }
    return {
      line: i + 2,
      errors,
      data: parsed.success ? { ...parsed.data, owner_id } : undefined,
    };
  });
  return { rows };
}

export default function BulkAddRisks({
  opened,
  onClose,
  projectId,
  owners,
  onDone,
}: {
  opened: boolean;
  onClose: () => void;
  projectId: string;
  owners: Owner[];
  onDone: () => void;
}) {
  const { user: me } = useAuth();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { rows, problem } = useMemo(
    () =>
      text.trim()
        ? parse(text, owners)
        : { rows: [] as Parsed[], problem: undefined },
    [text, owners],
  );
  const bad = rows.filter((r) => r.errors.length > 0);
  const canImport = rows.length > 0 && bad.length === 0 && !problem;

  const close = () => {
    setText("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    const now = new Date().toISOString();
    // One insert = all or nothing; the DB trigger assigns R-numbers in row order.
    const { error } = await supabase.from("project_risks").insert(
      rows.map((r) => ({
        id: crypto.randomUUID(),
        project_id: projectId,
        risk_number: 1, /////////// TODO: Figure out how to fix this.  I am unsure where this error is coming from.
        title: r.data!.title,
        description: toHtml(r.data!.description),
        probability: r.data!.probability,
        impact: r.data!.impact,
        status: r.data!.status,
        mitigation: toHtml(r.data!.mitigation),
        owner_id: r.data!.owner_id,
        due_date: r.data!.due_date || null,
        created_by: me?.userId,
        updated_by: me?.userId,
        created_at: now,
        updated_at: now,
      })),
    );

    setSaving(false);
    if (error) return setError(error.message);
    close();
    onDone();
  };

  return (
    <Modal opened={opened} onClose={close} title="Bulk add risks" size="xl">
      <Stack>
        <Text size="sm">
          Paste CSV (or cells copied from a spreadsheet). The first row must be
          a header row. Columns: <b>{COLUMNS.join(", ")}</b>. Only <b>title</b>{" "}
          is required. Probability and impact: low/medium/high (default medium).
          Status: open/mitigated/accepted/closed (default open). Owner is a
          Camunda user's email. Dates are YYYY-MM-DD. A risk_id column is
          ignored; new risks get the next R-number.
        </Text>
        <Textarea
          aria-label="CSV data"
          placeholder={
            "title,probability,impact,owner\nVendor delay,high,medium,jane@camunda.com"
          }
          autosize
          minRows={6}
          maxRows={14}
          styles={{ input: { fontFamily: "monospace" } }}
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
        />
        {problem && <Alert color="red">{problem}</Alert>}
        {error && <Alert color="red">{error}</Alert>}
        {rows.length > 0 && (
          <>
            <Text size="sm" c={bad.length ? "red" : "dimmed"}>
              {rows.length} row{rows.length === 1 ? "" : "s"} found
              {bad.length
                ? `, ${bad.length} with errors. Fix them to import.`
                : ", ready to import."}
            </Text>
            {bad.length > 0 && (
              <Table withTableBorder>
                <Table.Tbody>
                  {bad.map((r) => (
                    <Table.Tr key={r.line}>
                      <Table.Td w={90}>Row {r.line}</Table.Td>
                      <Table.Td c="red">{r.errors.join("; ")}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canImport} loading={saving}>
            Import {canImport ? rows.length : ""} risk
            {rows.length === 1 ? "" : "s"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
