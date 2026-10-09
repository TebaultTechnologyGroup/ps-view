import { Container, Text, Button, Stack, Group, Title, Box, ThemeIcon, Paper, Image, TextInput, PasswordInput, Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import classes from './LandingPage.module.css';
import camundaLogo from '../../public/Logo_White.svg';

export default function LandingPage() {
  const navigate = useNavigate();
  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => (value.length > 0 ? null : 'Password is required'),
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    console.log('Login attempt:', values);
    // TODO: Implement actual login logic
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    
    <Box className={classes.root}>
      {/* Hero Section */}
      <Box className={classes.hero} style={{ position: 'relative' }}>
        <Container size="lg" py={80} style={{ position: 'relative', zIndex: 1 }}>
          <Stack gap="xl" align="center" justify="center">
            <Group gap="sm" justify="center">
              <ThemeIcon size="100px" radius="md" variant="filled" color="#f7b500">
                <Image src={camundaLogo} />
              </ThemeIcon>
            </Group>

            <Title order={1} className={classes.title}>
              Camunda Delivery Portal
            </Title>

            <Text size="xl" className={classes.description} maw={600}>
              The Camunda delivery portal is your one stop for project information.  Contact your delivery lead for access.
            </Text>
           </Stack>
        </Container>
      </Box>

      {/* Login Section */}
      <Box className={classes.loginSection}>
        <Container size="sm" py={80}>
          <Stack gap="lg">
            <Stack gap="xs" align="center">
              <Title order={2}>Sign In</Title>
              <Text size="sm" c="dimmed">
                Enter your credentials to access the portal
              </Text>
            </Stack>

            <Paper p="lg" radius="md" className={classes.loginCard}>
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="Email"
                    placeholder="your.email@example.com"
                    {...form.getInputProps('email')}
                  />

                  <Stack gap="xs">
                    <PasswordInput
                      label="Password"
                      placeholder="Enter your password"
                      {...form.getInputProps('password')}
                    />
                    <Anchor href="/forgot-password" size="sm" c="#0a84ff">
                      Forgot your password?
                    </Anchor>
                  </Stack>

                  <Button
                    type="submit"
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
      </Box>  </Box>
  );
}

