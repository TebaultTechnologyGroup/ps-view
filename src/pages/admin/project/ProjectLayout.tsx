import { Anchor, Group, Stack, Tabs, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

export const PROJECT_TABS = [
  { value: "details" },
  { value: "status" },
  { value: "risks" },
  { value: "issues" },
  { value: "actions" },
  { value: "dependencies" },
  { value: "milestones" },
  { value: "change-orders" },
];

export default function ProjectLayout() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNew = id === undefined;
  const base = isNew ? "/admin/projects/new" : `/admin/projects/${id}`;
  const active = isNew ? "details" : (pathname.split("/")[4] ?? "details");

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>{isNew ? "New project" : "Project"}</Title>
        <Anchor component={NavLink} to="/admin/projects" size="sm">
          ← Back to projects
        </Anchor>
      </Group>
      <Tabs value={active} onChange={(v) => v && navigate(`${base}/${v}`)}>
        <Tabs.List>
          {PROJECT_TABS.map((tab) => (
            // other tabs need a saved project to attach to
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              disabled={isNew && tab.value !== "details"}
            >
              {t(`projectTabs.${tab.value}`)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Outlet />
    </Stack>
  );
}
