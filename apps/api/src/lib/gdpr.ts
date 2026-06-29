// ==========================================================================
// Kadarn GDPR — Soft Erasure Utilities
// ==========================================================================
// KPR-03: GDPR Art.17 Right to Erasure
//
// This module implements Kadarn's soft-erasure strategy:
//   - Anonymize personal identifiers (not delete)
//   - Preserve provenance (append-only invariant)
//   - Maintain referential integrity (UUIDs stay)
//   - Preserve auditability (relations remain)
//
// Legal basis for provenance retention:
//   GDPR Art.17(3)(d) — archiving purposes in the public interest
//   GDPR Art.17(3)(e) — scientific research purposes
//   Recital 156 — further processing for archiving/scientific research
// ==========================================================================

import { createRouteClient } from '@/lib/supabase-server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErasureResult {
  user_id: string
  profiles_anonymized: boolean
  memberships_anonymized: boolean
  identity_links_removed: boolean
  organizations_affected: number
  provenance_preserved: boolean
  erasure_requested_at: string
}

// ---------------------------------------------------------------------------
// Anonymization helpers
// ---------------------------------------------------------------------------

const ANON_PREFIX = 'anonymized'

function anonEmail(): string {
  return `${ANON_PREFIX}-${crypto.randomUUID().slice(0, 8)}@erased.kadarn.io`
}

function anonName(): string {
  return `${ANON_PREFIX}-user-${crypto.randomUUID().slice(0, 8)}`
}

function anonOrgName(): string {
  return `${ANON_PREFIX}-org-${crypto.randomUUID().slice(0, 8)}`
}

// ---------------------------------------------------------------------------
// Erasure execution
// ---------------------------------------------------------------------------

/**
 * Execute a full erasure request for a user.
 *
 * Steps:
 *   1. Anonymize user_profiles (email, display name)
 *   2. Mark organization_memberships as anonymized
 *   3. Remove external identity links
 *   4. Anonymize organizations where user is sole member (optional)
 *   5. Provenance nodes are NEVER modified (append-only invariant)
 *
 * Returns the erasure result for audit logging.
 */
export async function executeErasure(userId: string): Promise<ErasureResult> {
  const supabase = await createRouteClient()
  const now = new Date().toISOString()
  const result: ErasureResult = {
    user_id: userId,
    profiles_anonymized: false,
    memberships_anonymized: false,
    identity_links_removed: false,
    organizations_affected: 0,
    provenance_preserved: true,
    erasure_requested_at: now,
  }

  // 1. Anonymize user_profiles
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      email: anonEmail(),
      display_name: anonName(),
      metadata: {
        ...(await getExistingProfileMetadata(supabase, userId)),
        anonymized_at: now,
        anonymized: true,
      },
    })
    .eq('id', userId)

  if (!profileError) {
    result.profiles_anonymized = true
  }

  // 2. Anonymize memberships (remove personal association)
  const { data: memberships } = await supabase
    .from('organization_memberships')
    .update({
      status: 'anonymized',
      user_id: userId, // UUID preserved for referential integrity
    })
    .eq('user_id', userId)
    .select('organization_id')

  if (memberships) {
    result.memberships_anonymized = true
    result.organizations_affected = memberships.length
  }

  // 3. Remove external identity links
  const { error: linksError } = await supabase
    .from('external_identity_links')
    .delete()
    .eq('user_profile_id', userId)

  if (!linksError) {
    result.identity_links_removed = true
  }

  // 4. Provenance is explicitly preserved — no modification

  return result
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getExistingProfileMetadata(
  supabase: any,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from('user_profiles')
    .select('metadata')
    .eq('id', userId)
    .single()

  if (data?.metadata && typeof data.metadata === 'object') {
    return data.metadata as Record<string, unknown>
  }
  return {}
}
