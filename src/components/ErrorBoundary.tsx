import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocorreu um erro inesperado na interface.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Unhandled React error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: 32 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--expense-light)',
                color: 'var(--expense)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>Algo deu errado</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
              {this.state.errorMessage}
            </p>
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              <RotateCw size={15} />
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
