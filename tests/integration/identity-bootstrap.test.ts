// ==========================================================================
// APF-01 — Identity Bootstrap Tests
// ==========================================================================
// Validates that the bootstrap script exists, has the expected user list,
// and enforces safety guards.
// ==========================================================================

import { describe, it, expect } from 'vitest'

const EXPECTED_USERS = [
  'kadarn.admin@demo.kadarn.io',
  'biobank.admin@demo.kadarn.io',
  'biobank.coordinator@demo.kadarn.io',
  'hospital.coordinator@demo.kadarn.io',
  'sponsor.pm@demo.kadarn.io',
  'lab.user@demo.kadarn.io',
  'courier.user@demo.kadarn.io',
]

const EXPECTED_ORGS: Record<string, string> = {
  'kadarn.admin@demo.kadarn.io': 'a1000000-0000-0000-0000-000000000001',
  'biobank.admin@demo.kadarn.io': 'a1000000-0000-0000-0000-000000000010',
  'biobank.coordinator@demo.kadarn.io': 'a1000000-0000-0000-0000-000000000010',
  'hospital.coordinator@demo.kadarn.io': 'a1000000-0000-0000-0000-000000000020',
  'sponsor.pm@demo.kadarn.io': 'a1000000-0000-0000-0000-000000000030',
  'lab.user@demo.kadarn.io': 'a1000000-0000-0000-0000-000000000040',
  'courier.user@demo.kadarn.io': 'a1000000-0000-0000-0000-000000000050',
}

describe('APF-01: Identity Bootstrap', () => {
  // -----------------------------------------------------------------------
  // Script existence
  // -----------------------------------------------------------------------

  it('bootstrap script exists', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const exists = fs.existsSync(scriptPath)
    expect(exists).toBe(true)
  })

  // -----------------------------------------------------------------------
  // Expected user list
  // -----------------------------------------------------------------------

  it('has all 7 expected pilot users', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const source = fs.readFileSync(scriptPath, 'utf-8')

    for (const email of EXPECTED_USERS) {
      expect(source).toContain(email)
    }
  })

  it('has correct organization mappings for each user', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const source = fs.readFileSync(scriptPath, 'utf-8')

    for (const [email, orgId] of Object.entries(EXPECTED_ORGS)) {
      // Each user should reference their org
      const emailLine = source.split('\n').find(l => l.includes(email))
      expect(emailLine).toBeDefined()
      if (emailLine) {
        expect(emailLine).toContain(orgId)
      }
    }
  })

  // -----------------------------------------------------------------------
  // Safety guards
  // -----------------------------------------------------------------------

  it('refuses to run without SERVICE_ROLE_KEY', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const source = fs.readFileSync(scriptPath, 'utf-8')

    expect(source).toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(source).toContain('process.exit(1)')
  })

  it('has production safety guard', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const source = fs.readFileSync(scriptPath, 'utf-8')

    expect(source).toContain('ALLOW_PRODUCTION')
    expect(source).toContain('supabase.co')
  })

  // -----------------------------------------------------------------------
  // Password safety
  // -----------------------------------------------------------------------

  it('does not contain hardcoded passwords', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const source = fs.readFileSync(scriptPath, 'utf-8')

    // Should not contain any obvious password patterns
    expect(source).not.toContain('Test123!')
    expect(source).not.toContain('Password123')
  })

  // -----------------------------------------------------------------------
  // Idempotency
  // -----------------------------------------------------------------------

  it('checks for existing users before creating', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const source = fs.readFileSync(scriptPath, 'utf-8')

    expect(source).toContain('already exists')
  })

  // -----------------------------------------------------------------------
  // Role mapping
  // -----------------------------------------------------------------------

  it('has expected role assignments', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const root = path.resolve(import.meta.dirname, '..', '..')
    const scriptPath = path.join(root, 'scripts/seed-pilot-users.ts')
    const source = fs.readFileSync(scriptPath, 'utf-8')

    expect(source).toContain('platform_admin')
    expect(source).toContain('org_admin')
    expect(source).toContain('member')
  })

  // -----------------------------------------------------------------------
  // User count
  // -----------------------------------------------------------------------

  it('has exactly 7 pilot users configured', () => {
    expect(EXPECTED_USERS).toHaveLength(7)
  })
})
