import React, { Component, ErrorInfo, ReactNode } from 'react';
import { sentry } from '../../services/sentry';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    sentry.captureException(error, { componentStack: errorInfo.componentStack });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-content-primary">
          <div className="max-w-md w-full framer-card p-6 sm:p-8 rounded-2xl bg-surface border border-rose-500/30 shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-heading text-content-primary">
                Application Interruption
              </h1>
              <p className="text-xs text-content-muted leading-relaxed">
                An unexpected runtime error occurred. We have logged this diagnostic event and our systems are ready to recover.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-canvas border border-border-subtle text-left overflow-x-auto max-h-32 text-[11px] font-mono text-rose-400">
                {this.state.error.message || 'Unknown Exception'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs transition shadow-lg shadow-brand-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border-subtle text-content-secondary hover:text-content-primary font-bold text-xs transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
