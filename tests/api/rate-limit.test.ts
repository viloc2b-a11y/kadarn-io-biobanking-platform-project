import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PUBLIC_RATE_LIMIT,
  isInMemoryRateLimitAllowed,
  rateLimit,
} from '../../apps/api/src/lib/rate-limit'

const ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY = 'KADARN_ALLOW_IN_MEMORY_RATE_LIMIT'

describe('rateLimit production safety gate', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalAllowInMemory = process.env[ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY]

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    if (originalAllowInMemory === undefined) {
      delete process.env[ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY]
    } else {
      process.env[ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY] = originalAllowInMemory
    }
    vi.restoreAllMocks()
  })

  it('allows in-memory rate limiting outside production', () => {
    process.env.NODE_ENV = 'test'
    delete process.env[ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY]

    expect(isInMemoryRateLimitAllowed()).toBe(true)
  })

  it('rejects in-memory rate limiting in production without explicit opt-in', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env[ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY]
    const handler = vi.fn(async () => new Response('ok'))

    const guarded = rateLimit(PUBLIC_RATE_LIMIT, handler)
    const response = await guarded(new Request('https://api.kadarn.test/v1/institution/public/acme'))

    expect(response.status).toBe(503)
    expect(response.headers.get('x-ratelimit-store')).toBe('memory-disabled')
    expect(handler).not.toHaveBeenCalled()
  })

  it('allows in-memory rate limiting in production only with explicit opt-in', async () => {
    process.env.NODE_ENV = 'production'
    process.env[ALLOW_IN_MEMORY_RATE_LIMIT_ENV_KEY] = 'true'
    const handler = vi.fn(async () => new Response('ok'))

    const guarded = rateLimit(PUBLIC_RATE_LIMIT, handler)
    const response = await guarded(new Request('https://api.kadarn.test/v1/institution/public/acme'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-ratelimit-store')).toBe('memory')
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
