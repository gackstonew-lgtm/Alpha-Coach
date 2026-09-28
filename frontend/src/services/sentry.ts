/**
 * Meta Coach Client Sentry Monitoring (Env-based & Safe Fallback)
 * Automatically activates if VITE_SENTRY_DSN is configured in environment.
 * Zero overhead and crash-proof when unconfigured.
 */

interface SentryBreadcrumb {
  category?: string;
  message?: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

class SentryService {
  private isEnabled: boolean = false;
  private dsn: string | null = null;

  constructor() {
    this.dsn = import.meta.env.VITE_SENTRY_DSN || null;
    this.isEnabled = Boolean(this.dsn);

    if (this.isEnabled) {
      console.log('[Monitoring] Sentry client monitoring enabled.');
    }
  }

  public captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!this.isEnabled) {
      if (import.meta.env.DEV) {
        console.error('[Error Tracker - Dev Fallback]:', error, context);
      }
      return;
    }

    try {
      const sentryWindow = window as any;
      if (sentryWindow.Sentry?.captureException) {
        sentryWindow.Sentry.captureException(error, { extra: context });
      } else {
        console.error('[Sentry captureException]:', error, context);
      }
    } catch (e) {
      console.warn('[Monitoring] Exception capture failed:', e);
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.isEnabled) {
      if (import.meta.env.DEV) {
        console.log(`[Message Tracker - Dev Fallback - ${level}]:`, message);
      }
      return;
    }

    try {
      const sentryWindow = window as any;
      if (sentryWindow.Sentry?.captureMessage) {
        sentryWindow.Sentry.captureMessage(message, level);
      }
    } catch (e) {
      console.warn('[Monitoring] Message capture failed:', e);
    }
  }

  public addBreadcrumb(breadcrumb: SentryBreadcrumb): void {
    if (!this.isEnabled) return;
    try {
      const sentryWindow = window as any;
      if (sentryWindow.Sentry?.addBreadcrumb) {
        sentryWindow.Sentry.addBreadcrumb(breadcrumb);
      }
    } catch {
      // Ignore breadcrumb capture failures
    }
  }
}

export const sentry = new SentryService();
