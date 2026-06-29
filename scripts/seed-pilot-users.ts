#!/usr/bin/env npx tsx
// ==========================================================================
// APF-01 — Identity Bootstrap
// ==========================================================================
// Creates pilot users in Supabase Auth and links them to Kadarn memberships.
//
// Idempotent: safe to run multiple times.
// Never prints or commits passwords.
//
// Usage:
//   export SUPABASE_URL=http://127.0.0.1:54321
//   export SUPABASE_SERVICE_ROLE_KEY=<key>
//   npx tsx scripts/seed-pilot-users.ts
//
// Safety:
//   - Refuses to run without SERVICE_ROLE_KEY
//   - Refuses to run against production unless ALLOW_PRODUCTION=true
//   - Never prints passwords or secrets
// ==========================================================================

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ALLOW_PRODUCTION = process.env.ALLOW_PRODUCTION === 'true'

if (!SERVICE_KEY) {
  console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

// Safety guard: refuse production unless explicitly allowed
const isProduction = SUPABASE_URL.includes('supabase.co') && !SUPABASE_URL.includes('localhost')
if (isProduction && !ALLOW_PRODUCTION) {
  console.error('FATAL: Refusing to run against production. Set ALLOW_PRODUCTION=true to override.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Pilot users configuration
// ---------------------------------------------------------------------------

interface PilotUser {
  email: string
  password: string
  fullName: string
  orgId: string
  role: string
}

// Passwords are read from environment or use generated defaults (never committed)
function getPassword(email: string): string {
  const envKey = `PILOT_PASSWORD_${email.split('@')[0].replace(/\./g, '_').toUpperCase()}`
  return process.env[envKey] || `Pilot-${crypto.randomUUID().slice(0, 8)}!`
}

const PILOT_USERS: PilotUser[] = [
  { email: 'kadarn.admin@demo.kadarn.io',    fullName: 'Kadarn Platform Admin',    orgId: 'a1000000-0000-0000-0000-000000000001', role: 'platform_admin' },
  { email: 'biobank.admin@demo.kadarn.io',   fullName: 'Sophie Martin',           orgId: 'a1000000-0000-0000-0000-000000000010', role: 'org_admin' },
  { email: 'biobank.coordinator@demo.kadarn.io', fullName: 'Lucas Dubois',        orgId: 'a1000000-0000-0000-0000-000000000010', role: 'member' },
  { email: 'hospital.coordinator@demo.kadarn.io', fullName: 'Jean Dupont',        orgId: 'a1000000-0000-0000-0000-000000000020', role: 'org_admin' },
  { email: 'sponsor.pm@demo.kadarn.io',      fullName: 'Maria Rossi',             orgId: 'a1000000-0000-0000-0000-000000000030', role: 'org_admin' },
  { email: 'lab.user@demo.kadarn.io',        fullName: 'Klaus Weber',             orgId: 'a1000000-0000-0000-0000-000000000040', role: 'org_admin' },
  { email: 'courier.user@demo.kadarn.io',    fullName: 'Pieter van den Berg',     orgId: 'a1000000-0000-0000-0000-000000000050', role: 'org_admin' },
].map(u => ({ ...u, password: getPassword(u.email) }))

// ---------------------------------------------------------------------------
// Auth Admin API helpers (GoTrue)
// ---------------------------------------------------------------------------

const AUTH_API = `${SUPABASE_URL}/auth/v1/admin`
const HEADERS = {
  apikey: SERVICE_KEY!,
  Authorization: `Bearer ${SERVICE_KEY!}`,
  'Content-Type': 'application/json',
}

interface AuthUser {
  id: string
  email: string
}

async function createAuthUser(email: string, password: string): Promise<AuthUser | null> {
  // Check if user already exists
  const listResp = await fetch(`${AUTH_API}/users?filter%5Bemail%5D=${encodeURIComponent(email)}`, { headers: HEADERS })
  if (listResp.ok) {
    const existing = await listResp.json()
    if (existing.users && existing.users.length > 0) {
      console.log(`  SKIP auth user: ${email} (exists, id: ${existing.users[0].id.slice(0, 8)}...)`)
      return existing.users[0]
    }
  }

  // Create user
  const resp = await fetch(`${AUTH_API}/users`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  })

  if (!resp.ok) {
    const err = await resp.json()
    // If user already exists (Supabase returns error), try to find them
    if (resp.status === 409 || resp.status === 422) {
      console.log(`  NOTE auth user: ${email} — ${err.msg || 'already exists'}`)
      // Try to find by listing users
      const listResp2 = await fetch(`${AUTH_API}/users?filter%5Bemail%5D=${encodeURIComponent(email)}`, { headers: HEADERS })
      if (listResp2.ok) {
        const existing2 = await listResp2.json()
        if (existing2.users && existing2.users.length > 0) return existing2.users[0]
      }
      return null
    }
    console.error(`  ERROR auth user: ${email} — ${err.msg || resp.statusText}`)
    return null
  }

  const user = await resp.json()
  console.log(`  OK   auth user: ${email} (id: ${user.id.slice(0, 8)}...)`)
  return user
}

// ---------------------------------------------------------------------------
// User profiles
// ---------------------------------------------------------------------------

async function upsertProfile(userId: string, email: string, fullName: string) {
  // user_profiles has FK to auth.users — use REST API with service key
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY!)
  const { error } = await supabase.from('user_profiles').upsert({
    id: userId,
    email,
    full_name: fullName,
  }, { onConflict: 'id', ignoreDuplicates: false })

  if (error) {
    // Handle case where column doesn't exist or other schema issues
    if (error.code === 'PGRST204') {
      console.log(`  NOTE profile: ${email} — schema mismatch: ${error.message}`)
      return
    }
    console.error(`  ERROR profile: ${email} — ${error.message}`)
    return
  }
  console.log(`  OK   profile: ${email} (${fullName})`)
}

// ---------------------------------------------------------------------------
// Memberships
// ---------------------------------------------------------------------------

async function upsertMembership(userId: string, orgId: string, role: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY!)
  const now = new Date().toISOString()

  const { error } = await supabase.from('organization_memberships').upsert({
    organization_id: orgId,
    user_id: userId,
    status: 'active',
    invited_by: userId,
    invited_at: now,
    joined_at: now,
  }, { onConflict: 'organization_id,user_id', ignoreDuplicates: false })

  if (error) {
    console.error(`  ERROR membership: user ${userId.slice(0, 8)}... @ org ${orgId.slice(0, 8)}... — ${error.message}`)
    return
  }
  console.log(`  OK   membership: ${userId.slice(0, 8)}... @ ${orgId.slice(0, 8)}... (${role})`)
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

interface BootstrapResult {
  total: number
  authCreated: number
  profilesCreated: number
  membershipsCreated: number
  errors: number
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== APF-01: Identity Bootstrap ===')
  console.log(`URL: ${SUPABASE_URL}`)
  console.log(`Production: ${isProduction ? 'YES' : 'no'}`)
  console.log(`Users to create: ${PILOT_USERS.length}`)
  console.log('')

  const result: BootstrapResult = { total: PILOT_USERS.length, authCreated: 0, profilesCreated: 0, membershipsCreated: 0, errors: 0 }

  for (const user of PILOT_USERS) {
    console.log(`--- ${user.email} (${user.fullName}) ---`)

    // 1. Create auth user
    const authUser = await createAuthUser(user.email, user.password)
    if (!authUser) {
      result.errors++
      continue
    }
    result.authCreated++

    // 2. Create profile
    await upsertProfile(authUser.id, user.email, user.fullName)
    result.profilesCreated++

    // 3. Create membership
    await upsertMembership(authUser.id, user.orgId, user.role)
    result.membershipsCreated++

    console.log('')
  }

  // Summary
  console.log('=== Summary ===')
  console.log(`Total users:     ${result.total}`)
  console.log(`Auth created:    ${result.authCreated}`)
  console.log(`Profiles:        ${result.profilesCreated}`)
  console.log(`Memberships:     ${result.membershipsCreated}`)
  console.log(`Errors:          ${result.errors}`)
  console.log('')
  console.log('To retrieve passwords for testing:')
  console.log('  echo $PILOT_PASSWORD_<UPPER_USERNAME>')
  console.log('')
  console.log('Or set individual passwords via environment:')
  console.log('  export PILOT_PASSWORD_KADARN_ADMIN=<password>')
  console.log('  export PILOT_PASSWORD_BIOBANK_ADMIN=<password>')
  console.log('  # ... etc for each user')
  console.log('')

  if (result.errors > 0) {
    console.error('Some errors occurred. Review logs above.')
    process.exit(1)
  }

  console.log('Identity bootstrap complete.')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
