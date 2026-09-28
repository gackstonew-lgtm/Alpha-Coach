/**
 * Meta Coach Structured Logger & Monitoring Bridge
 * Produces structured JSON logs for log aggregators (Datadog, CloudWatch, Vercel)
 * and optionally integrates with Sentry if SENTRY_DSN is provided.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  meta?: Record<string, unknown>;
}

class LoggerService {
  private isSentryConfigured: boolean = false;

  constructor() {
    this.isSentryConfigured = Boolean(process.env.SENTRY_DSN);
    if (this.isSentryConfigured) {
      this.info('Sentry backend monitoring initialized');
    }
  }

  private emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      service: 'meta-coach-api',
      message,
      ...(meta ? { meta } : {})
    };

    if (process.env.NODE_ENV === 'test') {
      return; // Keep test runner output clean
    }

    const formatted = JSON.stringify(payload);
    if (level === 'error') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.emit('info', message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.emit('warn', message, meta);
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      this.emit('debug', message, meta);
    }
  }

  public error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

    this.emit('error', message, {
      ...meta,
      error: errorDetails
    });

    // Optional Sentry forwarder
    if (this.isSentryConfigured && error) {
      try {
        const sentryPkg = (global as any).Sentry;
        if (sentryPkg?.captureException) {
          sentryPkg.captureException(error, { extra: { message, ...meta } });
        }
      } catch {
        // Fallback silently if Sentry package is not bundled
      }
    }
  }
}

export const logger = new LoggerService();
