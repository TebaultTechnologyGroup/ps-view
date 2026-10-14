import { Anchor, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconUsersGroup } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const REPORTS = [
  {
    key: "projectReview",
    to: "/admin/reports/project-review",
    icon: IconUsersGroup,
  },
];

export default function Reports() {
  const { t } = useTranslation();
  return (
    <Stack gap="md">
      <Title order={2}>{t("reports.title")}</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {REPORTS.map(({ key, to, icon: Icon }) => (
          <Paper key={key} withBorder p="md" radius="md">
            <Icon size={24} />
            <Anchor component={Link} to={to} fw={600} display="block" mt="xs">
              {t(`reports.${key}.title`)}
            </Anchor>
            <Text size="sm" c="dimmed" mt={4}>
              {t(`reports.${key}.description`)}
            </Text>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
