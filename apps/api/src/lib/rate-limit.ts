import { ApiError } from '@/lib/supabase-server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 120
const MAX_BUCKETS = 10_000
const CLEANUP_INTERVAL_MS = 5 * 60_000

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodic cleanup of expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key)
    }
  }, CLEANUP_INTERVAL_MS).unref()
}

/**
 * Evict entries when the map exceeds MAX_BUCKETS.
 * Uses O(1) random eviction instead of O(n log n) sort.
 */
function evictIfNeeded(): void {
  if (buckets.size < MAX_BUCKETS) return
  const now = Date.now()
  // First pass: remove expired entries
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
  // Second pass: if still over limit, remove random entries (O(1) avg)
  if (buckets.size >= MAX_BUCKETS) {
    const keys = [...buckets.keys()]
    const toDelete = Math.ceil(MAX_BUCKETS * 0.2) // remove 20%
    for (let i = 0; i < toDelete && i < keys.length; i++) {
      const randomIndex = Math.floor(Math.random() * keys.length)
      buckets.delete(keys[randomIndex])
      // Swap with last and pop to avoid re-selecting deleted keys
      keys[randomIndex] = keys[keys.length - 1 - i]
    }
  }
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return request.headers.get('x-real-ip') ?? 'local'
}

function checkRateLimit(request: Request): void {
  const key = clientKey(request)
  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    evictIfNeeded()
    bucket = { count: 0, resetAt: now + WINDOW_MS }
    buckets.set(key, bucket)
  }

  // Atomic increment (single-process V8 is safe; cross-instance is approximate)
  if (++bucket.count > MAX_REQUESTS) {
    throw new ApiError(429, 'Rate limit exceeded. Try again later.')
  }
}

type RouteContext = { params?: Promise<Record<string, string>> }

type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>

/**
 * In-memory sliding window rate limiter (per IP). Handles /api/v1/* routes.
 * This is intentionally a separate instance from middleware.ts — middleware.ts
 * handles legacy /api/* at the edge, while this runs in the Node.js route handler.
 *
 * Suitable for single-instance; replace with Redis in production cluster.
 *
 * NOTE: Single-process V8 ensures atomic Map read/write within one
 * synchronous execution. In multi-worker deployments, each worker
 * maintains its own in-memory Map, so per-IP counts are approximate
 * (acceptable for rate limiting, not for billing).
 */
export function withRateLimit(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    checkRateLimit(request)
    return handler(request, context)
  }
}
