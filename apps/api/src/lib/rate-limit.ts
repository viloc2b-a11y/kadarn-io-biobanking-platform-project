// ==========================================================================
// Kadarn API — Rate Limiter
// ==========================================================================
// RC-0.4A — Lightweight in-memory rate limiter. No external dependencies.
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

// ---------------------------------------------------------------------------
// Store — in-memory, per-process
// ---------------------------------------------------------------------------

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup every 60s
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60_000).unref()

// ---------------------------------------------------------------------------
// Default key generator — IP + route
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
            code: 429,
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
            'x-ratelimit-limit': String(options.max),
            'x-ratelimit-remaining': String(remaining),
            'x-ratelimit-reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        },
      )
    }

    // Forward to handler — inject rate limit headers into response
    const response = await handler(request, ...args)

    // Clone and add rate limit headers
    const headers = new Headers(response.headers)
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

/** Public/sponsor endpoints — generous but bounded */
export const PUBLIC_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,  // 1 minute
  max: 30,           // 30 req/min
}

/** Workspace endpoints — authenticated users */
export const WORKSPACE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 60,
}

/** Expensive compute endpoints — tightly restricted */
export const COMPUTE_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 10,
}

/** Auth-sensitive endpoints — tightly restricted */
export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 5,
}
