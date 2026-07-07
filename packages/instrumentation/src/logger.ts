import { ConsoleLogger, type Logger } from '@kadarn/platform-services'
import { getRequestContext } from './context.js'

const SENSITIVE = /(?:bearer\s+|eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|password|secret|api[_-]?key)/i

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    return SENSITIVE.test(value) ? '[REDACTED]' : value
  }
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.test(k) ? '[REDACTED]' : redact(v)
    }
    return out
  }
  return value
}

let rootLogger: Logger = new ConsoleLogger({ service: 'kadarn' })

export function setLogger(logger: Logger): void {
  rootLogger = logger
}

export function getLogger(): Logger {
  const ctx = getRequestContext()
  if (!ctx) return rootLogger
  return rootLogger.child({
    requestId: ctx.requestId,
    correlationId: ctx.correlationId,
    traceId: ctx.traceId,
    route: ctx.route,
    method: ctx.method,
    userId: ctx.userId,
  })
}

export function logStructured(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  meta?: Record<string, unknown>,
  error?: Error,
): void {
  const logger = getLogger()
  const safeMeta = meta ? (redact(meta) as Record<string, unknown>) : undefined
  switch (level) {
    case 'debug': logger.debug(message, safeMeta); break
    case 'info': logger.info(message, safeMeta); break
    case 'warn': logger.warn(message, safeMeta); break
    case 'error': logger.error(message, error, safeMeta); break
  }
}
