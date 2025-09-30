import { Button, Result } from 'antd';
import React from 'react';
import { logger } from '@/utilities/logger';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

type ErrorBoundaryProps = React.PropsWithChildren<{
  fallback?: React.ReactNode;
}>;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Unhandled error captured', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <Result
        status="error"
        title="Something went wrong"
        subTitle={
          this.state.error?.message ?? 'An unexpected error occurred while loading the dashboard.'
        }
        extra={
          <Button type="primary" onClick={this.handleReset}>
            Back to safety
          </Button>
        }
      />
    );
  }
}

export default ErrorBoundary;
