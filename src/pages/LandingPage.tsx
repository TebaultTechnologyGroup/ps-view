import {
  Container,
  Text,
  Button,
  Stack,
  Group,
  Title,
  Box,
  Paper,
  Image,
  TextInput,
  PasswordInput,
  Anchor,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import classes from "./LandingPage.module.css";
import camundaLogo from "../../public/Logo_White.svg";
import { supabase } from "@/lib/supabase-client";
import { useState } from "react";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length > 0 ? null : "Password is required"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoginError(null);
    setResetMessage(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setLoginError(
          error.status === 400 ? "Invalid email or password." : error.message,
        );
        return;
      }

      // No navigation needed: AppProvider loads users.role and
      // RedirectAuthenticated sends the user to their home page.
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoginError(null);
    setResetMessage(null);
    const emailError = form.validateField("email").hasError;
    if (emailError) return;

    setIsResetting(true);
    try {
      console.log(import.meta.env.VITE_PASSWORD_REDIRECT);
      const { error } = await supabase.auth.resetPasswordForEmail(
        form.values.email,
        { redirectTo: import.meta.env.VITE_PASSWORD_REDIRECT },
      );
      if (error) {
        setLoginError(error.message);
        return;
      }
      setResetMessage(
        `If an account exists for ${form.values.email}, a password reset link has been sent.`,
      );
    } catch (error) {
      console.error("Reset password error:", error);
      setLoginError("Could not send reset email. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Box className={classes.brandPanel}>
        <Stack gap="xl" className={classes.brandContent}>
          <Image src={camundaLogo} alt="Camunda" w={160} />

          <Stack gap="md">
            <Title order={1} className={classes.title}>
              Camunda Delivery Portal
            </Title>
            <Text size="lg" className={classes.description}>
              Your one stop for project information: RAID logs, milestones,
              change orders and status reports.
            </Text>
          </Stack>

          <Text size="sm" className={classes.note}>
            Access is provided by your Camunda Professional Services Delivery
            Lead.
          </Text>
        </Stack>
      </Box>

      <Box className={classes.formPanel}>
        <Container size={420} w="100%">
          <Stack gap="xl">
            <Stack gap={4}>
              <Title order={2}>Sign in</Title>
              <Text size="sm" c="dimmed">
                Enter your credentials to access the portal
              </Text>
            </Stack>

            <Paper p="xl" radius="md" className={classes.loginCard}>
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="your.email@example.com"
                    {...form.getInputProps("email")}
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    {...form.getInputProps("password")}
                  />

                  {loginError && (
                    <Alert color="red" variant="light" role="alert">
                      {loginError}
                    </Alert>
                  )}
                  {resetMessage && (
                    <Alert color="green" variant="light">
                      {resetMessage}
                    </Alert>
                  )}

                  <Group justify="flex-end">
                    <Anchor
                      component="button"
                      type="button"
                      size="sm"
                      c="#0a84ff"
                      onClick={handleResetPassword}
                      disabled={isResetting}
                    >
                      {isResetting ? "Sending..." : "Forgot your password?"}
                    </Anchor>
                  </Group>

                  <Button
                    type="submit"
                    loading={isLoading}
                    fullWidth
                    size="md"
                    className={classes.button}
                  >
                    Sign In
                  </Button>
                </Stack>
              </form>
            </Paper>

            <Text size="sm" c="dimmed" ta="center">
              Contact your administrator if you don't have access
            </Text>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
