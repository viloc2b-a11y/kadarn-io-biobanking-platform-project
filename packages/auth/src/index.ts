import { createServerClient, createBrowserClient, type CookieOptions } from '@supabase/ssr'
import type { KadarnRole, Experience, UserProfile, OrganizationMembership } from '@kadarn/types'

// ─── Environment ─────────────────────────────────────────────────────────────

function env(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

// ─── Browser client (client components) ──────────────────────────────────────

export function createKadarnBrowserClient() {
  // Static property access — required for Next.js to inline NEXT_PUBLIC_* in client bundles.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── Server client (Server Components, Server Actions, middleware) ────────────

export type CookieAdapter = {
  getAll(): { name: string; value: string }[]
  setAll(cookies: { name: string; value: string; options: CookieOptions }[]): void
}

export function createKadarnServerClient(adapter: CookieAdapter) {
  return createServerClient(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    { cookies: adapter },
  )
}

// ─── Role resolution ──────────────────────────────────────────────────────────

export function resolveRole(userMeta: Record<string, unknown>): KadarnRole {
  const role = userMeta?.kadarn_role as string | undefined
  const validRoles: KadarnRole[] = ['kadarn_internal', 'org_admin', 'org_member', 'marketplace_user']
  if (role && validRoles.includes(role as KadarnRole)) return role as KadarnRole
  return 'marketplace_user'
}

// ─── Experience routing ───────────────────────────────────────────────────────

export function resolveExperience(role: KadarnRole, hasMembership: boolean): Experience {
  if (role === 'kadarn_internal') return 'koc'
  if (hasMembership && (role === 'org_admin' || role === 'org_member')) return 'workspace'
  return 'marketplace'
}

export function defaultRedirect(role: KadarnRole, hasMembership: boolean): string {
  const experience = resolveExperience(role, hasMembership)
  switch (experience) {
    case 'koc': return '/koc'
    case 'workspace': return '/workspace'
    default: return '/marketplace'
  }
}

// ─── Route access rules ───────────────────────────────────────────────────────

export type RouteGuardResult =
  | { allowed: true }
  | { allowed: false; redirectTo: string }

export function checkRouteAccess(
  pathname: string,
  role: KadarnRole | null,
  hasMembership: boolean,
): RouteGuardResult {
  // KOC: kadarn_internal only
  if (pathname.startsWith('/koc')) {
    if (role !== 'kadarn_internal') return { allowed: false, redirectTo: '/marketplace' }
  }

  // Workspace: requires authenticated org member
  if (pathname.startsWith('/workspace')) {
    if (!role) return { allowed: false, redirectTo: '/login?next=/workspace' }
    if (!hasMembership) return { allowed: false, redirectTo: '/marketplace' }
  }

  // Auth routes: redirect authenticated users away
  if ((pathname.startsWith('/login') || pathname.startsWith('/auth/login')) && role) {
    return { allowed: false, redirectTo: defaultRedirect(role, hasMembership) }
  }

  return { allowed: true }
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { UserProfile, OrganizationMembership, KadarnRole, Experience }
