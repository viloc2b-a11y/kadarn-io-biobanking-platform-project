// ==========================================================================
// Kadarn Telemetry — Structured JSON logger (Loki-ready stdout)
// ==========================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogFields {
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  pipeline?: string;
  stage?: string;
  route?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): LogLevel {
  const raw = (process.env.KADARN_LOG_LEVEL ?? 'info').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel()];
}

export function log(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (!shouldLog(level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: process.env.KADARN_SERVICE_NAME ?? 'kadarn-api',
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logDebug(message: string, fields?: LogFields): void {
  log('debug', message, fields);
}

export function logInfo(message: string, fields?: LogFields): void {
  log('info', message, fields);
}

export function logWarn(message: string, fields?: LogFields): void {
  log('warn', message, fields);
}

export function logError(message: string, fields?: LogFields): void {
  log('error', message, fields);
}
