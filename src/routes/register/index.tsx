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

export const Register = () => {
  const navigate = useNavigate();

  return (
    <div style={containerStyle}>
      <Card style={cardStyle}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Looking to join?
        </Typography.Title>
        <Typography.Paragraph>
          New accounts are provisioned through your organization&apos;s OAuth provider. Request
          access from an administrator to be added to the workspace.
        </Typography.Paragraph>
        <Button type="primary" block onClick={() => navigate('/login')}>
          Back to login
        </Button>
      </Card>
    </div>
  );
};
