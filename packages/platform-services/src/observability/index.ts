// ==========================================================================
// Observability — Structured logging and tracing
// ==========================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  userId?: string;
  organizationId?: string;
  programId?: string;
  service: string;
  durationMs?: number;
  error?: { name: string; message: string; stack?: string };
  metadata?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;

  /** Create a child logger with bound context */
  child(bindings: Record<string, unknown>): Logger;

  /** Flush pending logs (for async transports) */
  flush(): Promise<void>;
}

export interface MetricsService {
  /** Increment a counter */
  increment(metric: string, value?: number, tags?: Record<string, string>): void;

  /** Record a gauge value */
  gauge(metric: string, value: number, tags?: Record<string, string>): void;

  /** Record a timing/histogram value */
  timing(metric: string, durationMs: number, tags?: Record<string, string>): void;

  /** Flush pending metrics */
  flush(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Console Logger implementation (development default)
// ---------------------------------------------------------------------------
export class ConsoleLogger implements Logger {
  private bindings: Record<string, unknown>;

  constructor(bindings: Record<string, unknown> = {}) {
    this.bindings = bindings;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: (this.bindings.service as string) ?? 'unknown',
      metadata: { ...this.bindings, ...meta },
    };

    const fn = level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : level === 'debug' ? console.debug
      : console.log;

    fn(JSON.stringify(entry));
  }

  debug(message: string, meta?: Record<string, unknown>): void { this.log('debug', message, meta); }
  info(message: string, meta?: Record<string, unknown>): void { this.log('info', message, meta); }
  warn(message: string, meta?: Record<string, unknown>): void { this.log('warn', message, meta); }
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log('error', message, { ...meta, error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined });
  }

  child(bindings: Record<string, unknown>): Logger {
    return new ConsoleLogger({ ...this.bindings, ...bindings });
  }

  async flush(): Promise<void> { /* no-op for console */ }
}

/** No-op Metrics implementation (development default) */
export class NoopMetricsService implements MetricsService {
  increment(_metric: string, _value?: number, _tags?: Record<string, string>): void {}
  gauge(_metric: string, _value: number, _tags?: Record<string, string>): void {}
  timing(_metric: string, _durationMs: number, _tags?: Record<string, string>): void {}
  async flush(): Promise<void> {}
}
