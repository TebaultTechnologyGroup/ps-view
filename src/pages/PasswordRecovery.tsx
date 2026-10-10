import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";

const MIN_PASSWORD_LENGTH = 8;

// Target of the password reset email link (VITE_PASSWORD_REDIRECT).
// Supabase turns the link into a recovery session, which lets the user set a new password.
export default function PasswordRecovery() {
  const navigate = useNavigate();
  // undefined = still checking, false = no recovery session (invalid/expired link)
  const [hasSession, setHasSession] = useState<boolean | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [done, setDone] = useState(false);

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

  useEffect(() => {
    // Keep this callback synchronous: awaiting supabase calls inside it can deadlock.
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY" || s) setHasSession(true);
    });

    // The client exchanges the link's token asynchronously; give it a moment
    // before declaring the link invalid.
    let timer: ReturnType<typeof setTimeout>;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
      else timer = setTimeout(() => setHasSession((v) => v ?? false), 2000);
    });

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setSubmitError(null);
    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      setDone(true);
      // The user is signed in now; "/" redirects them to their home page.
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (error) {
      console.error("Password update error:", error);
      setSubmitError("Could not update password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container size={420} w="100%">
        <Stack gap="xl">
          <Stack gap={4}>
            <Title order={2}>Set a new password</Title>
            <Text size="sm" c="dimmed">
              Choose a new password for your account
            </Text>
          </Stack>

          <Paper p="xl" radius="md" withBorder>
            {hasSession === undefined && (
              <Stack align="center">
                <Loader size="sm" />
              </Stack>
            )}

            {hasSession === false && (
              <Stack gap="md">
                <Alert color="red" variant="light" role="alert">
                  This password reset link is invalid or has expired.
                </Alert>
                <Anchor size="sm" onClick={() => navigate("/")}>
                  Back to sign in to request a new link
                </Anchor>
              </Stack>
            )}

            {hasSession && done && (
              <Alert color="green" variant="light">
                Password updated. Redirecting...
              </Alert>
            )}

            {hasSession && !done && (
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <PasswordInput
                    label="New password"
                    placeholder="Enter a new password"
                    {...form.getInputProps("password")}
                  />
                  <PasswordInput
                    label="Confirm password"
                    placeholder="Re-enter the new password"
                    {...form.getInputProps("confirm")}
                  />

                  {submitError && (
                    <Alert color="red" variant="light" role="alert">
                      {submitError}
                    </Alert>
                  )}

                  <Button type="submit" loading={isSaving} fullWidth size="md">
                    Update password
                  </Button>
                </Stack>
              </form>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
