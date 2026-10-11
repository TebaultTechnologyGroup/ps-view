import { useEffect, useState } from "react";
import {
  Alert,
  AppShell,
  Button,
  Group,
  Menu,
  Modal,
  PasswordInput,
  Stack,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronDown,
  IconKey,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/guards/AppContext";

const MIN_PASSWORD_LENGTH = 8;

function ChangePasswordModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    initialValues: { password: "", confirm: "" },
    validate: {
      password: (v) =>
        v.length >= MIN_PASSWORD_LENGTH
          ? null
          : `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      confirm: (v, values) =>
        v === values.password ? null : "Passwords do not match",
    },
  });

  const close = () => {
    form.reset();
    setError(null);
    setDone(false);
    onClose();
  };

  const submit = async (values: typeof form.values) => {
    setSaving(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    setSaving(false);
    if (error) setError(error.message);
    else setDone(true);
  };

  return (
    <Modal opened={opened} onClose={close} title="Change password">
      {done ? (
        <Stack>
          <Alert color="green">Your password has been updated.</Alert>
          <Group justify="flex-end">
            <Button onClick={close}>Close</Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(submit)}>
          <Stack>
            {error && <Alert color="red">{error}</Alert>}
            <PasswordInput
              label="New password"
              data-autofocus
              autoComplete="new-password"
              {...form.getInputProps("password")}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              {...form.getInputProps("confirm")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string | null>(null);
  const [pwOpened, pw] = useDisclosure(false);

  // Users can read their own profile row.
  const userId = user?.userId;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("users")
      .select("display_name, full_name, email")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data)
          setName(data.display_name || data.full_name || data.email);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Title order={3} size="h4" style={{ whiteSpace: "nowrap" }}>
            Camunda Delivery Dashboard
          </Title>
          <Menu position="bottom-end" width={200}>
            <Menu.Target>
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconUser size={18} />}
                rightSection={<IconChevronDown size={14} />}
              >
                {name ?? user?.email ?? "Account"}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconKey size={14} />} onClick={pw.open}>
                Change password
              </Menu.Item>
              <Menu.Item
                leftSection={<IconLogout size={14} />}
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>
      <ChangePasswordModal opened={pwOpened} onClose={pw.close} />
    </>
  );
}
