// ==========================================================================
// Rate Limiter — Sprint 25E
// ==========================================================================
// Simple in-memory rate limiter for API endpoints.
// Production should use Redis or similar. MVP uses memory.
// ==========================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 60_000)

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000, // 1 minute
  maxRequests: 100,
}

const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  'sponsor-search': { windowMs: 60_000, maxRequests: 20 },
  'discovery-report': { windowMs: 60_000, maxRequests: 10 },
  'institution-public': { windowMs: 60_000, maxRequests: 60 },
}

export function checkRateLimit(
  endpoint: string,
  identifier: string,
  config?: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const cfg = config ?? ENDPOINT_CONFIGS[endpoint] ?? DEFAULT_CONFIG
  const key = `${endpoint}:${identifier}`
  const now = Date.now()

  let entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + cfg.windowMs }
    store.set(key, entry)
  }

  entry.count++
  const remaining = cfg.maxRequests - entry.count

  return {
    allowed: entry.count <= cfg.maxRequests,
    remaining: Math.max(0, remaining),
    resetAt: entry.resetAt,
  }
}

export function rateLimitHeaders(endpoint: string, identifier: string): Record<string, string> {
  const result = checkRateLimit(endpoint, identifier)
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  }
}
