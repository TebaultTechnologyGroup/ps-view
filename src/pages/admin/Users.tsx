import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zodResolver } from "mantine-form-zod-resolver";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";
import type { Database } from "@/lib/database.types";
import { usersSchema, type UsersFormValues } from "@/dba/validations";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type Customer = { id: string; name: string };

const emptyValues: UsersFormValues = {
  email: "",
  password: "",
  full_name: "",
  display_name: "",
  role: "CUSTOMER",
  customer_id: "",
  country: "",
  city: "",
  locale: "",
  timezone: "",
  active: true,
};

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [formOpened, formHandlers] = useDisclosure(false);

  const form = useForm<UsersFormValues>({
    initialValues: emptyValues,
    validate: zodResolver(usersSchema),
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [usersRes, customersRes] = await Promise.all([
      supabase.from("users").select("*").eq("deleted", false),
      supabase.from("customers").select("id, name"),
    ]);
    const err = usersRes.error ?? customersRes.error;
    if (err) setError(err.message);
    else setError(null);
    setUsers(usersRes.data ?? []);
    setCustomers(customersRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string | null) =>
    customers.find((c) => c.id === id)?.name ?? "";

  const openCreate = () => {
    setEditing(null);
    form.setValues(emptyValues);
    form.resetDirty();
    form.clearErrors();
    setFormError(null);
    formHandlers.open();
  };

  const openEdit = (u: UserRow) => {
    setEditing(u);
    form.setValues({
      email: u.email ?? "",
      password: "",
      full_name: u.full_name ?? "",
      display_name: u.display_name ?? "",
      role: u.role as UsersFormValues["role"],
      customer_id: u.customer_id ?? "",
      country: u.country ?? "",
      city: u.city ?? "",
      locale: u.locale ?? "",
      timezone: u.timezone ?? "",
      active: u.active !== false,
    });
    form.resetDirty();
    form.clearErrors();
    setFormError(null);
    formHandlers.open();
  };

  const handleSubmit = async (values: UsersFormValues) => {
    if (!editing && !values.password) {
      form.setFieldError("password", "Password is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    const { email, password, ...rest } = values;
    const profile = {
      ...rest,
      full_name: rest.full_name.trim() || null,
      display_name: rest.display_name.trim() || null,
      country: rest.country.trim() || null,
      city: rest.city.trim() || null,
      locale: rest.locale.trim() || null,
      timezone: rest.timezone.trim() || null,
      // Camunda staff aren't tied to a customer
      customer_id: rest.role === "CUSTOMER" ? rest.customer_id : null,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from("users")
          .update({
            ...profile,
            updated_by: me?.userId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        // The auth user must exist first (service role), so this goes through the API.
        const { data } = await supabase.auth.getSession();

        const res = await fetch("/api/admin-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session?.access_token}`,
          },
          body: JSON.stringify({ email: email.trim(), password, ...profile }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to create user");
      }
      formHandlers.close();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // Soft delete: the row is referenced by created_by/updated_by elsewhere, and
  // AppContext already denies access to inactive or deleted users.
  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase
      .from("users")
      .update({
        deleted: true,
        active: false,
        updated_by: me?.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deleting.id);
    setDeleting(null);
    if (error) setError(error.message);
    else await load();
  };

  const query = search.trim().toLowerCase();
  const visible = users
    .filter((u) =>
      [u.full_name, u.display_name, u.email, customerName(u.customer_id)].some(
        (v) => v?.toLowerCase().includes(query),
      ),
    )
    .sort((a, b) =>
      (a.full_name ?? a.email ?? "").localeCompare(
        b.full_name ?? b.email ?? "",
      ),
    );

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Users</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Add user
        </Button>
      </Group>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextInput
        placeholder="Search users"
        aria-label="Search users"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        maw={400}
      />

      <Table verticalSpacing="sm" highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th w={100} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text c="dimmed" ta="center" py="md">
                  {loading
                    ? "Loading…"
                    : users.length === 0
                      ? "No users yet"
                      : "No users match your search"}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            visible.map((u) => {
              const name = u.full_name || u.display_name || u.email || u.id;
              return (
                <Table.Tr key={u.id}>
                  <Table.Td>
                    <Anchor
                      component="button"
                      type="button"
                      fw={500}
                      onClick={() => openEdit(u)}
                    >
                      {name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      color={u.role === "CAMUNDA" ? "blue" : "gray"}
                    >
                      {u.role}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{customerName(u.customer_id)}</Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={u.active === false ? "red" : "green"}
                    >
                      {u.active === false ? "Inactive" : "Active"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <Tooltip
                        label={
                          u.id === me?.userId
                            ? "You can't delete yourself"
                            : "Delete"
                        }
                      >
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label={`Delete ${name}`}
                          disabled={u.id === me?.userId}
                          onClick={() => setDeleting(u)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })
          )}
        </Table.Tbody>
      </Table>

      <Modal
        size="lg"
        opened={formOpened}
        onClose={formHandlers.close}
        title={editing ? "Edit user" : "Add user"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {formError && <Alert color="red">{formError}</Alert>}
            <TextInput
              label="Email"
              disabled={!!editing}
              data-autofocus={!editing}
              {...form.getInputProps("email")}
              error={form.errors.email}
            />
            {!editing && (
              <PasswordInput
                label="Temporary password"
                description="The user can change it after signing in"
                {...form.getInputProps("password")}
                error={form.errors.password}
              />
            )}
            <Group grow align="flex-start">
              <TextInput
                label="Full name"
                {...form.getInputProps("full_name")}
                error={form.errors.full_name}
              />
              <TextInput
                label="Display name"
                {...form.getInputProps("display_name")}
                error={form.errors.display_name}
              />
            </Group>
            <Switch
              label="Camunda Employee"
              disabled={editing?.id === me?.userId}
              checked={form.values.role === "CAMUNDA"}
              onChange={(e) =>
                form.setFieldValue(
                  "role",
                  e.currentTarget.checked ? "CAMUNDA" : "CUSTOMER",
                )
              }
            />
            {form.values.role === "CUSTOMER" && (
              <Select
                label="Customer"
                searchable
                data={customers.map((c) => ({ value: c.id, label: c.name }))}
                {...form.getInputProps("customer_id")}
              />
            )}
            <Group grow align="flex-start">
              <TextInput label="Country" {...form.getInputProps("country")} />
              <TextInput label="City" {...form.getInputProps("city")} />
            </Group>
            <Group grow align="flex-start">
              <TextInput
                label="Locale"
                placeholder="en-US"
                {...form.getInputProps("locale")}
                error={form.errors.local}
              />
              <TextInput
                label="Timezone"
                placeholder="America/New_York"
                {...form.getInputProps("timezone")}
                error={form.errors.timezone}
              />
            </Group>
            <Switch
              label="Active"
              disabled={editing?.id === me?.userId}
              {...form.getInputProps("active", { type: "checkbox" })}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={formHandlers.close}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                {editing ? "Save" : "Add"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete user"
      >
        <Stack>
          <Text>
            Are you sure you want to delete{" "}
            <b>{deleting?.full_name || deleting?.email}</b>? They will no longer
            be able to sign in.
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
