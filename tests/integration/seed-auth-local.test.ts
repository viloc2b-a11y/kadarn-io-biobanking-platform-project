// ==========================================================================
// Phase 8 Remediation — local seed auth (GoTrue compatibility)
// ==========================================================================
// Requires Supabase local + migrations through 057 applied.
// ==========================================================================

import { describe, it, expect } from 'vitest'
import { signInAs } from '../setup/test-utils.js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''

describe('Local seed auth (GoTrue)', () => {
  it.skipIf(!SUPABASE_URL.includes('127.0.0.1') && !SUPABASE_URL.includes('localhost'))(
    'biobank@kadarn.test can sign in after db reset',
    async () => {
      const { session, userId } = await signInAs('biobank')
      expect(session.access_token).toBeTruthy()
      expect(userId).toBeTruthy()
    },
  )
})
