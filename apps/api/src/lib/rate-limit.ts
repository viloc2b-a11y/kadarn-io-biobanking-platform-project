// ==========================================================================
// Kadarn API - Rate Limiter
// ==========================================================================
// RC-0.4A - Lightweight in-memory rate limiter. No external dependencies.
//
// Usage:
//   import { rateLimit } from '@/lib/rate-limit'
//   export const GET = rateLimit({ windowMs: 60000, max: 30 }, handler)
// ==========================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum requests within the window */
  max: number
  /** Optional key generator (defaults to IP + route) */
  keyGenerator?: (request: Request) => string
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY = 'KADARN_ALLOW_IN_MEMORY_RATE_LIMIT'

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function isInMemoryRateLimitAllowed(): boolean {
  if (!isProductionRuntime()) return true
  return process.env[ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY] === 'true'
}

function inMemoryRateLimitDisabledResponse(request: Request): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: {
        code: 'RATE_LIMIT_STORE_NOT_CONFIGURED',
        message: 'Production rate limiting requires an explicit shared-store rollout or in-memory opt-in.',
        details: {
          required_env: ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY,
        },
      },
      request_id: request.headers.get('x-request-id') ?? 'unknown',
      generated_at: new Date().toISOString(),
    }),
    {
      status: 503,
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-store': 'memory-disabled',
      },
    },
  )
}

// ---------------------------------------------------------------------------
// Store - in-memory, per-process
// ---------------------------------------------------------------------------

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup every 60s
const rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000)
if (typeof rateLimitCleanupTimer?.unref === 'function') rateLimitCleanupTimer.unref()

// ---------------------------------------------------------------------------
// Default key generator - IP + route
// ---------------------------------------------------------------------------

function defaultKeyGenerator(request: Request): string {
  const url = new URL(request.url)
  const ip = request.headers.get('x-forwarded-for') ??
             request.headers.get('x-real-ip') ??
             'unknown'
  return `${ip}:${url.pathname}`
}

// ---------------------------------------------------------------------------
// Rate limit wrapper
// ---------------------------------------------------------------------------

/**
 * Wrap a route handler with rate limiting.
 *
 * Returns 429 Too Many Requests if the limit is exceeded.
 */
export function rateLimit(
  options: RateLimitOptions,
  handler: (request: Request, ...args: any[]) => Promise<Response>,
): (request: Request, ...args: any[]) => Promise<Response> {
  const keyGen = options.keyGenerator ?? defaultKeyGenerator

  return async (request: Request, ...args: any[]): Promise<Response> => {
    if (!isInMemoryRateLimitAllowed()) {
      return inMemoryRateLimitDisabledResponse(request)
    }

    const key = keyGen(request)
    const now = Date.now()

    let entry = store.get(key)

    // Create or reset expired window
    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + options.windowMs }
      store.set(key, entry)
    } else {
      entry.count++
    }

    // Set rate limit headers
    const remaining = Math.max(0, options.max - entry.count)
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000)

    if (entry.count > options.max) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'API_RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            details: {
              retry_after_seconds: resetSeconds,
              limit: options.max,
              window_ms: options.windowMs,
            },
          },
          request_id: request.headers.get('x-request-id') ?? 'unknown',
          generated_at: new Date().toISOString(),
        }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json',
            'retry-after': String(resetSeconds),
            'x-ratelimit-store': 'memory',
            'x-ratelimit-limit': String(options.max),
            'x-ratelimit-remaining': String(remaining),
            'x-ratelimit-reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        },
      )
    }

    // Forward to handler - inject rate limit headers into response
    const response = await handler(request, ...args)

    // Clone and add rate limit headers
    const headers = new Headers(response.headers)
    headers.set('x-ratelimit-store', 'memory')
    headers.set('x-ratelimit-limit', String(options.max))
    headers.set('x-ratelimit-remaining', String(remaining))
    headers.set('x-ratelimit-reset', String(Math.ceil(entry.resetAt / 1000)))

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  }
}

// ---------------------------------------------------------------------------
// Preset limits
// ---------------------------------------------------------------------------

/** Public/sponsor endpoints - generous but bounded */
export const PUBLIC_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,  // 1 minute
  max: 30,           // 30 req/min
}

/** Workspace endpoints - authenticated users */
export const WORKSPACE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 60,
}

/** Expensive compute endpoints - tightly restricted */
export const COMPUTE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 10,
}

/** Auth-sensitive endpoints - tightly restricted */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 5,
}
