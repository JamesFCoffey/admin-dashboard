import { Card, Typography, Button } from 'antd';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

const containerStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
};

const cardStyle: CSSProperties = {
  maxWidth: 420,
  width: '100%',
};

export const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <Card style={cardStyle}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Forgot your password?
        </Typography.Title>
        <Typography.Paragraph>
          Password resets are managed by your OAuth provider. Please use your provider&apos;s
          recovery flow or contact an administrator if you no longer have access.
        </Typography.Paragraph>
        <Button type="primary" block onClick={() => navigate('/login')}>
          Back to login
        </Button>
      </Card>
    </div>
  );
};
