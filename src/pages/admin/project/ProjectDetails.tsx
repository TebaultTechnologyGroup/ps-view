import { useEffect, useState } from "react";
import { Alert, Button, Group, Select, Stack, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useNavigate, useParams } from "react-router-dom";
import * as z from "zod";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";
import ProjectPermissions from "./ProjectPermissions";

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    customer_id: z.string().min(1, "Customer is required"),
    owner_id: z.string(),
    type_id: z.string(),
    start_date: z.string(),
    end_date: z.string(),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    path: ["end_date"],
    message: "End date must be on or after the start date",
  });

type Values = z.infer<typeof schema>;
type Option = { value: string; label: string };

const empty: Values = {
  name: "",
  customer_id: "",
  owner_id: "",
  type_id: "",
  start_date: "",
  end_date: "",
};

export default function ProjectDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Option[]>([]);
  const [owners, setOwners] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<Values>({
    initialValues: empty,
    validate: zodResolver(schema),
  });

  useEffect(() => {
    (async () => {
      const [c, u, t] = await Promise.all([
        supabase.from("customers").select("id, name"),
        supabase
          .from("users")
          .select("id, full_name, email")
          .eq("role", "CAMUNDA")
          .eq("deleted", false),
        supabase.from("project_types").select("id, name").eq("active", true),
      ]);
      setCustomers((c.data ?? []).map((x) => ({ value: x.id, label: x.name })));
      setOwners(
        (u.data ?? []).map((x) => ({
          value: x.id,
          label: x.full_name || x.email || x.id,
        })),
      );
      setTypes(
        (t.data ?? []).map((x) => ({ value: x.id, label: x.name ?? "" })),
      );

      if (id) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();
        if (error) return setError(error.message);
        form.setValues({
          name: data.name ?? "",
          customer_id: data.customer_id ?? "",
          owner_id: data.owner_id ?? "",
          type_id: data.type_id ?? "",
          start_date: data.start_date ?? "",
          end_date: data.end_date ?? "",
        });
        form.resetDirty();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (v: Values) => {
    setSaving(true);
    setError(null);
    const fields = {
      name: v.name.trim(),
      customer_id: v.customer_id,
      owner_id: v.owner_id || null,
      type_id: v.type_id || null,
      start_date: v.start_date || null,
      end_date: v.end_date || null,
      updated_by: me?.userId,
      updated_at: new Date().toISOString(),
    };
    if (id) {
      const { error } = await supabase
        .from("projects")
        .update(fields)
        .eq("id", id);
      if (error) setError(error.message);
      else form.resetDirty();
    } else {
      const newId = crypto.randomUUID();
      const { error } = await supabase
        .from("projects")
        .insert({ id: newId, ...fields, created_by: me?.userId });
      if (error) setError(error.message);
      else navigate(`/admin/projects/${newId}/details`, { replace: true });
    }
    setSaving(false);
  };

  return (
    <Stack gap="xl" maw={720}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          {error && <Alert color="red">{error}</Alert>}
          <TextInput label="Name" {...form.getInputProps("name")} />
          <Select
            label={t("common.customer")}
            searchable
            data={customers}
            {...form.getInputProps("customer_id")}
          />
          <Group grow align="flex-start">
            <Select
              label="Owner"
              searchable
              clearable
              data={owners}
              {...form.getInputProps("owner_id")}
            />
            <Select
              label="Type"
              clearable
              data={types}
              {...form.getInputProps("type_id")}
            />
          </Group>
          <Group grow align="flex-start">
            <TextInput
              type="date"
              label="Start date"
              {...form.getInputProps("start_date")}
            />
            <TextInput
              type="date"
              label="End date"
              {...form.getInputProps("end_date")}
            />
          </Group>
          <Group justify="flex-end">
            <Button type="submit" loading={saving}>
              {id ? "Save" : "Create project"}
            </Button>
          </Group>
        </Stack>
      </form>

      {id && <ProjectPermissions projectId={id} />}
    </Stack>
  );
}
