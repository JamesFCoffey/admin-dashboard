import { GithubOutlined, MailOutlined } from '@ant-design/icons';
import { useLogin } from '@refinedev/core';
import { Alert, App as AntdApp, Button, Card, Divider, Form, Input, Typography } from 'antd';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useSession } from 'next-auth/react';

import { demoAuthEmail } from '@/providers/auth';
import { appConfig } from '@/utilities/config';

type LoginFormValues = {
  email: string;
};

const oauthLabels: Record<string, string> = {
  github: 'GitHub',
};

const cardStyle: CSSProperties = {
  maxWidth: 420,
  width: '100%',
};

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
};

export const Login = () => {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<LoginFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { mutateAsync: login } = useLogin();
  const { status } = useSession();

  const availableOauthProviders = appConfig.oauthProviders.filter(
    (provider) => provider !== 'credentials',
  );

  const { search } = useLocation();
  const authError = useMemo(() => {
    const params = new URLSearchParams(search);
    const errorParam = params.get('error');

    if (!errorParam) return null;

    if (errorParam.toLowerCase() === 'callback') {
      return 'We couldn’t complete the sign-in. Confirm your account exists in the CRM or try the demo login below.';
    }

    return 'Login failed. Please try again or use the demo access.';
  }, [search]);

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams(search);
    const redirectParam = params.get('redirect');
    if (redirectParam && redirectParam.startsWith('/')) {
      return redirectParam;
    }

    const callbackUrl = params.get('callbackUrl');
    if (callbackUrl) {
      try {
        const url = new URL(callbackUrl);
        if (typeof window !== 'undefined' && url.origin === window.location.origin) {
          return `${url.pathname}${url.search}` || '/';
        }
      } catch (error) {
        console.warn('Failed to parse callbackUrl', error);
      }
    }

    return '/';
  }, [search]);

  if (status === 'authenticated') {
    return <Navigate to={redirectTarget} replace />;
  }

  const handleOauth = async (provider: string) => {
    try {
      await login({
        providerName: provider,
        redirectTo: redirectTarget,
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to sign in right now.');
    }
  };

  const handleDemoLogin = async ({ email }: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await login({
        email,
        providerName: 'credentials',
        redirectTo: redirectTarget,
      });

      if (result?.success === false && result.error) {
        message.error(result.error.message);
      } else {
        message.success('Signed in with demo credentials.');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <Card style={cardStyle}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Welcome back
        </Typography.Title>
        <Typography.Paragraph style={{ textAlign: 'center' }}>
          Sign in with your team&apos;s OAuth provider to access the dashboard.
        </Typography.Paragraph>

        {authError ? (
          <Alert type="error" message={authError} showIcon style={{ marginBottom: '1rem' }} />
        ) : null}

        {availableOauthProviders.length > 0 ? (
          availableOauthProviders.map((provider) => (
            <Button
              key={provider}
              block
              type="primary"
              icon={<GithubOutlined />}
              onClick={() => handleOauth(provider)}
              style={{ marginBottom: '1rem' }}
            >
              Continue with {oauthLabels[provider] ?? provider}
            </Button>
          ))
        ) : (
          <Alert
            type="warning"
            message="No OAuth providers are configured. Contact your admin to enable OAuth login."
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Divider>Demo access</Divider>
        <Typography.Paragraph>
          Need a quick tour? Use our demo login to explore the CRM experience.
        </Typography.Paragraph>
        <Form<LoginFormValues>
          form={form}
          layout="vertical"
          initialValues={{ email: demoAuthEmail }}
          onFinish={handleDemoLogin}
        >
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<MailOutlined />} placeholder="name@example.com" />
          </Form.Item>
          <Button block htmlType="submit" loading={isSubmitting} icon={<MailOutlined />}>
            Sign in with demo email
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: '1rem' }} type="secondary">
          Password reset and registration are managed by your OAuth provider.
        </Typography.Paragraph>
      </Card>
    </div>
  );
};
