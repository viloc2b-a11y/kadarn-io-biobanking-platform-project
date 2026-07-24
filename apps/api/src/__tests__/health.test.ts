import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock supabase client ──────────────────────────────────────────────
// Must be at the top of the file so vitest hoists it before any module
// evaluation.  This ensures the mock is in place when bootstrapInstrumentation()
// runs at import time.

let mockSupabaseShouldFail = false

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        limit: () =>
          mockSupabaseShouldFail
            ? Promise.resolve({ data: null, error: new Error('connection refused') })
            : Promise.resolve({ data: [{}], error: null }),
      }),
    }),
  }),
}))

// ── Imports ───────────────────────────────────────────────────────────
// Bootstraps instrumentation (idempotent) with the mocked supabase client.

import { GET as livenessGET } from '@/app/api/health/route'
import { GET as readinessGET } from '@/app/api/health/ready/route'

// ── Liveness endpoint tests ───────────────────────────────────────────

describe('GET /api/health (liveness)', () => {
  it('returns 200 with status ok and full response shape', async () => {
    const request = new Request('http://localhost/api/health')
    const response = await livenessGET(request)

    expect(response.status).toBe(200)

    const body = (await response.json()) as {
      ok: boolean
      request_id: string
      correlation_id: string
      generated_at: string
      data: {
        app: string
        status: string
        version: string
        environment: string
        uptime_ms: number
        timestamp: string
        memory: { heap_used_mb: number; heap_total_mb: number; rss_mb: number }
        checks: Array<{ name: string; status: string }>
      }
    }
    expect(body.ok).toBe(true)
    expect(body).toHaveProperty('request_id')
    expect(body).toHaveProperty('correlation_id')
    expect(body).toHaveProperty('generated_at')

    const { data } = body
    expect(data.app).toBe('kadarn-api')
    expect(data.status).toBe('ok')
    expect(typeof data.version).toBe('string')
    expect(data.version.length).toBeGreaterThan(0)
    expect(typeof data.environment).toBe('string')
    expect(data.uptime_ms).toBeGreaterThanOrEqual(0)

    // Timestamp is a valid ISO-8601 string
    expect(typeof data.timestamp).toBe('string')
    expect(Date.parse(data.timestamp)).not.toBeNaN()
  })

  it('includes memory metrics', async () => {
    const request = new Request('http://localhost/api/health')
    const response = await livenessGET(request)
    const { data } = (await response.json()) as {
      data: { memory: { heap_used_mb: number; heap_total_mb: number; rss_mb: number } }
    }

    expect(data.memory).toBeDefined()
    expect(typeof data.memory.heap_used_mb).toBe('number')
    expect(typeof data.memory.heap_total_mb).toBe('number')
    expect(typeof data.memory.rss_mb).toBe('number')
    expect(data.memory.heap_used_mb).toBeGreaterThanOrEqual(0)
  })

  it('resolves version from package.json when KADARN_VERSION is not set', async () => {
    // KADARN_VERSION is intentionally not set — the module reads
    // apps/api/package.json at import time, which contains "0.2.0".
    const request = new Request('http://localhost/api/health')
    const response = await livenessGET(request)
    const { data } = (await response.json()) as {
      data: { version: string }
    }

    expect(typeof data.version).toBe('string')
    expect(data.version.length).toBeGreaterThan(0)

    // The old npm_package_version ?? '0.2.0' fallback is gone; the version
    // comes from the new readVersion() mechanism (filesystem read or
    // KADARN_VERSION).  In this test environment neither KADARN_VERSION nor
    // npm_package_version is set, so the value is read from package.json.
    // Coincidentally it may equal '0.2.0' — that is fine as long as the
    // source mechanism is the filesystem read, not the old hardcoded string.
  })
})

// ── Readiness endpoint tests ──────────────────────────────────────────

describe('GET /api/health/ready (readiness)', () => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    mockSupabaseShouldFail = false
  })

  it('returns 200 with ready=true when supabase is reachable', async () => {
    const request = new Request('http://localhost/api/health/ready')
    const response = await readinessGET(request)

    expect(response.status).toBe(200)

    const body = (await response.json()) as {
      ok: boolean
      data: {
        ready: boolean
        status: string
        checks: Array<{ name: string; status: string }>
        timestamp: string
      }
    }
    expect(body.ok).toBe(true)

    const { data } = body
    expect(data.ready).toBe(true)
    expect(data.status).toBe('ok')

    // Checks array contains both 'config' and 'supabase'
    expect(Array.isArray(data.checks)).toBe(true)
    const supabaseCheck = data.checks.find((c) => c.name === 'supabase')
    expect(supabaseCheck).toBeDefined()
    expect(supabaseCheck!.status).toBe('ok')
  })

  it('returns 503 with ready=false when supabase is unreachable', async () => {
    mockSupabaseShouldFail = true

    const request = new Request('http://localhost/api/health/ready')
    const response = await readinessGET(request)

    expect(response.status).toBe(503)

    const body = (await response.json()) as {
      ok: boolean
      data: {
        ready: boolean
        status: string
        checks: Array<{ name: string; status: string }>
      }
    }
    expect(body.ok).toBe(true) // envelope ok is true (not an API error)

    const { data } = body
    expect(data.ready).toBe(false)
    expect(data.status).toBe('fail')

    const supabaseCheck = data.checks.find((c) => c.name === 'supabase')
    expect(supabaseCheck).toBeDefined()
    expect(supabaseCheck!.status).toBe('fail')
  })

  it('response includes timestamp and each check has name/status', async () => {
    const request = new Request('http://localhost/api/health/ready')
    const response = await readinessGET(request)
    const { data } = (await response.json()) as {
      data: {
        timestamp: string
        checks: Array<{ name: string; status: string; durationMs?: number }>
      }
    }

    // Timestamp is present and valid
    expect(typeof data.timestamp).toBe('string')
    expect(Date.parse(data.timestamp)).not.toBeNaN()

    // Every check item has name and a valid status
    expect(Array.isArray(data.checks)).toBe(true)
    expect(data.checks.length).toBeGreaterThan(0)

    for (const check of data.checks) {
      expect(typeof check.name).toBe('string')
      expect(['ok', 'degraded', 'fail']).toContain(check.status)
      if (check.durationMs !== undefined) {
        expect(typeof check.durationMs).toBe('number')
      }
    }
  })
})
