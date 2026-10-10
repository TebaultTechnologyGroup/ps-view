import {
  AppShell,
  Button,
  Group,
  NavLink,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconBuildingSkyscraper,
  IconBriefcase,
  IconFolders,
  IconLayoutDashboard,
  IconLogout,
  IconSearch,
  IconUser,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { NavLink as RouterLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/guards/AppContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/admin/dashboard", icon: IconLayoutDashboard },
  { label: "Portfolios", to: "/admin/portfolios", icon: IconFolders },
  { label: "Projects", to: "/admin/projects", icon: IconBriefcase },
  { label: "Customers", to: "/admin/customers", icon: IconBuildingSkyscraper },
  { label: "Users", to: "/admin/users", icon: IconUser },
  { label: "Groups", to: "/admin/groups", icon: IconUsersGroup },
];

// TODO: replace with the authenticated user once Supabase auth is implemented
const currentUser = { name: "Mark Tebault" };

export default function AdminLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <IconUsers size={24} />
            <Title order={3} size="h4" style={{ whiteSpace: "nowrap" }}>
              PS Delivery Portal
            </Title>
          </Group>

          <TextInput
            placeholder="Search"
            aria-label="Search"
            leftSection={<IconSearch size={16} />}
            w={{ base: 140, sm: 320 }}
          />

          <Group gap="md" wrap="nowrap">
            <Group gap={6} wrap="nowrap">
              <IconUser size={18} />
              <Text size="sm" fw={500}>
                {currentUser.name}
              </Text>
            </Group>
            <Button
              variant="default"
              size="xs"
              leftSection={<IconLogout size={14} />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            component={RouterLink}
            to={to}
            label={label}
            leftSection={<Icon size={18} />}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
