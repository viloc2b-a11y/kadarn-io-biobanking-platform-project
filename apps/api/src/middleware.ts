import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 120
const MAX_BUCKETS = 10_000
const CLEANUP_INTERVAL_MS = 5 * 60_000

const buckets = new Map<string, { count: number; resetAt: number }>()

// Periodic cleanup of expired entries (best-effort; may not run in edge-isolated environments)
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

function isLegacyApiPath(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return false
  if (pathname.startsWith('/api/v1/')) return false
  if (pathname === '/api' || pathname === '/api/health' || pathname === '/api/metrics') return false
  if (pathname.startsWith('/api/health/')) return false
  return true
}

function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: { code: 429, message: 'Rate limit exceeded. Try again later.', details: null } },
    { status: 429 },
  )
}

/**
 * Edge-middleware rate limiter (legacy /api/* paths only — /api/v1/* is skipped).
 *
 * /api/v1/* routes use withRateLimit() in rate-limit.ts instead.
 * The two instances are intentional: middleware.ts runs at the edge
 * for legacy endpoints, while rate-limit.ts runs in the Node.js route
 * handler for current API routes. Both are independent by design.
 *
 * NOTE: Single-process V8 ensures atomic Map read/write within one
 * synchronous execution. In multi-worker deployments, each worker
 * maintains its own in-memory Map, so per-IP counts are approximate
 * (acceptable for rate limiting, not for billing).
 */
export function middleware(request: NextRequest) {
  // Handle CORS preflight — respond immediately without rate limiting
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin') ?? '*'
    const response = new NextResponse(null, { status: 204 })
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-Id')
    response.headers.set('Access-Control-Max-Age', '86400')
    if (origin !== '*') {
      response.headers.set('Vary', 'Origin')
    }
    return response
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'local'
  const now = Date.now()
  let bucket = buckets.get(ip)
  if (!bucket || now >= bucket.resetAt) {
    evictIfNeeded()
    bucket = { count: 0, resetAt: now + WINDOW_MS }
    buckets.set(ip, bucket)
  }
  // Atomic increment (single-process V8 is safe; cross-instance is approximate)
  if (++bucket.count > MAX_REQUESTS) {
    return rateLimitResponse()
  }

  const response = NextResponse.next()

  // CORS headers — permissive during alpha; tighten for production
  const origin = request.headers.get('origin') ?? '*'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-Id')
  response.headers.set('Access-Control-Expose-Headers', 'X-Kadarn-Api-Version')
  if (origin !== '*') {
    response.headers.set('Vary', 'Origin')
  }

  response.headers.set('X-Kadarn-Api-Version', 'v1')

  if (isLegacyApiPath(request.nextUrl.pathname)) {
    response.headers.set('Deprecation', 'true')
    response.headers.set('Link', '</api/v1>; rel="successor-version"')
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
