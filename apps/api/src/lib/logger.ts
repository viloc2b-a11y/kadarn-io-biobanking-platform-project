// ==========================================================================
// Kadarn API — Structured Logger with Sensitive Data Redaction
// ==========================================================================
// RC-0.4 — Standardized JSON logging. Never logs tokens, PII, PHI,
// private evidence, or confidential payloads.
// ==========================================================================

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

/** Fields that must NEVER appear in logs. */
const REDACTED_FIELDS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'token',
  'password',
  'secret',
  'api_key',
  'apikey',
  'x-api-key',
  'access_token',
  'refresh_token',
  'jwt',
  'bearer',
])

/** Fields whose values must be redacted. Applies recursively. */
const REDACTED_VALUE_FIELDS = new Set([
  ...REDACTED_FIELDS,
  'email',
  'phone',
  'contact',
  'contact_name',
  'contact_email',
  'contact_phone',
  'private_evidence',
  'internal_notes',
  'raw_document',
  'document_content',
  'source_file',
  'pii',
  'phi',
  'address',
  'ssn',
  'passport',
  'credit_card',
  'bank_account',
])

const REDACTED_PLACEHOLDER = '[REDACTED]'

/**
 * Deep-redact sensitive values from an object for safe logging.
 */
export function redact(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(redact)
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '')
    if (REDACTED_VALUE_FIELDS.has(lowerKey) || REDACTED_FIELDS.has(key.toLowerCase())) {
      result[key] = REDACTED_PLACEHOLDER
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redact(value)
    } else {
      result[key] = value
    }
  }
  return result
}

/**
 * Redact sensitive headers from a Headers or headers-like object.
 */
export function redactHeaders(headers: Record<string, string> | Headers): Record<string, string> {
  const result: Record<string, string> = {}
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      result[key] = REDACTED_FIELDS.has(key.toLowerCase()) ? REDACTED_PLACEHOLDER : value
    })
  } else {
    for (const [key, value] of Object.entries(headers)) {
      result[key] = REDACTED_FIELDS.has(key.toLowerCase()) ? REDACTED_PLACEHOLDER : value
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Structured logger
// ---------------------------------------------------------------------------

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  request_id?: string
  route?: string
  method?: string
  status?: number
  duration_ms?: number
  actor_type?: string
  role?: string
  error_code?: string | number
  error_stack?: string
  timestamp: string
  [key: string]: unknown
}

const isProduction = process.env.NODE_ENV === 'production'

function emit(entry: LogEntry): void {
  // Strip error_stack in production
  if (isProduction) {
    delete entry.error_stack
  }
  // Redact any extra fields
  const safe = redact(entry) as LogEntry

  const line = JSON.stringify(safe)
  switch (entry.level) {
    case 'error': console.error(line); break
    case 'warn': console.warn(line); break
    case 'debug': if (!isProduction) console.debug(line); break
    default: console.log(line)
  }
}

export const logger = {
  info(message: string, extra: Partial<LogEntry> = {}): void {
    emit({ level: 'info', message, timestamp: new Date().toISOString(), ...extra })
  },
  warn(message: string, extra: Partial<LogEntry> = {}): void {
    emit({ level: 'warn', message, timestamp: new Date().toISOString(), ...extra })
  },
  error(message: string, extra: Partial<LogEntry> = {}): void {
    emit({ level: 'error', message, timestamp: new Date().toISOString(), ...extra })
  },
  debug(message: string, extra: Partial<LogEntry> = {}): void {
    emit({ level: 'debug', message, timestamp: new Date().toISOString(), ...extra })
  },
}

// ---------------------------------------------------------------------------
// Request logger middleware helper
// ---------------------------------------------------------------------------

/**
 * Log an API request with timing.
 * Usage: const start = Date.now(); ... logger.request({...}, start)
 */
export function logRequest(
  details: {
    request_id: string
    route: string
    method: string
    status: number
    actor_type?: string
    role?: string
    error_code?: string | number
  },
  startTime: number,
): void {
  const duration = Date.now() - startTime
  logger.info('api_request', { ...details, duration_ms: duration })
}
