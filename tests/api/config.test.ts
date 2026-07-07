import { afterEach, describe, expect, it } from 'vitest'
import { validateConfig } from '../../apps/api/src/lib/config'

const ENV_KEYS = [
  'NODE_ENV',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_API_URL',
  'SUPABASE_JWT_SECRET',
  'SPONSOR_PASSPORT_DATA_SOURCE',
  'LEGACY_PASSPORT_ENABLED',
  'KADARN_ALLOW_DOMAIN_EVENT_FALLBACK',
  'KADARN_ALLOW_IN_MEMORY_RATE_LIMIT',
] as const

type EnvKey = (typeof ENV_KEYS)[number]

function setRequiredProductionEnv(): void {
  process.env.NODE_ENV = 'production'
  process.env.SUPABASE_URL = 'https://supabase.example.test'
  process.env.SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test'
  process.env.SUPABASE_JWT_SECRET = 'jwt-secret'
}

describe('runtime config production safety gates', () => {
  const originalEnv = new Map<EnvKey, string | undefined>(
    ENV_KEYS.map((key) => [key, process.env[key]]),
  )

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const originalValue = originalEnv.get(key)
      if (originalValue === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = originalValue
      }
    }
  })

  it('requires PCP-1.1 safety flags in production', () => {
    setRequiredProductionEnv()
    delete process.env.SPONSOR_PASSPORT_DATA_SOURCE
    delete process.env.LEGACY_PASSPORT_ENABLED
    delete process.env.KADARN_ALLOW_DOMAIN_EVENT_FALLBACK
    delete process.env.KADARN_ALLOW_IN_MEMORY_RATE_LIMIT

    const result = validateConfig()

    expect(result.valid).toBe(false)
    expect(result.missing).toContain('SPONSOR_PASSPORT_DATA_SOURCE')
    expect(result.missing).toContain('LEGACY_PASSPORT_ENABLED')
    expect(result.missing).toContain('KADARN_ALLOW_DOMAIN_EVENT_FALLBACK')
    expect(result.missing).toContain('KADARN_ALLOW_IN_MEMORY_RATE_LIMIT')
  })

  it('accepts explicit safe production flag values', () => {
    setRequiredProductionEnv()
    process.env.SPONSOR_PASSPORT_DATA_SOURCE = 'evidence-core'
    process.env.LEGACY_PASSPORT_ENABLED = 'false'
    process.env.KADARN_ALLOW_DOMAIN_EVENT_FALLBACK = 'false'
    process.env.KADARN_ALLOW_IN_MEMORY_RATE_LIMIT = 'false'

    const result = validateConfig()

    expect(result.valid).toBe(true)
    expect(result.missing).toEqual([])
  })
})
