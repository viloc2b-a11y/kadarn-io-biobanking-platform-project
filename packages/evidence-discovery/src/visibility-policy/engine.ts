// ==========================================================================
// Visibility Policy Engine — Types + Engine (Sprint 24A)
// ==========================================================================
// Canonical authorization layer. Claim-level visibility policies.
// Identity is protected. Evidence is controlled. Deterministic.
// ==========================================================================

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ActorType = 'public' | 'sponsor' | 'cro' | 'institution' | 'kadarn_internal' | 'administrator'

export type VisibilityLevel = 'public' | 'discovery' | 'restricted' | 'private' | 'hidden'

export interface VisibilityPolicy {
  policy_id: string
  claim_id: string
  actor_type: ActorType
  visibility_level: VisibilityLevel
  can_view_summary: boolean
  can_view_evidence: boolean
  can_view_identity: boolean
  can_view_private_evidence: boolean
  can_download: boolean
  expires_at: string | null
  metadata: Record<string, unknown>
}

export interface VisibilityResolution {
  actor: ActorType
  claim_id: string
  resolved_level: VisibilityLevel
  can_view_identity: boolean
  can_view_summary: boolean
  can_view_evidence: boolean
  can_view_private_evidence: boolean
  can_download: boolean
  policy_applied: string
  reason: string
}

// --------------------------------------------------------------------------
// Default visibility matrix
// --------------------------------------------------------------------------

const DEFAULT_VISIBILITY: Record<ActorType, VisibilityLevel> = {
  public: 'hidden',
  sponsor: 'discovery',
  cro: 'discovery',
  institution: 'restricted',
  kadarn_internal: 'private',
  administrator: 'private',
}

const IDENTITY_VISIBILITY: Record<ActorType, boolean> = {
  public: false,
  sponsor: false,
  cro: false,
  institution: true,
  kadarn_internal: true,
  administrator: true,
}

// --------------------------------------------------------------------------
// Actor capabilities per visibility level
// --------------------------------------------------------------------------

function capabilitiesForLevel(level: VisibilityLevel): {
  summary: boolean
  evidence: boolean
  privateEvidence: boolean
  download: boolean
} {
  switch (level) {
    case 'public': return { summary: false, evidence: false, privateEvidence: false, download: false }
    case 'discovery': return { summary: true, evidence: false, privateEvidence: false, download: false }
    case 'restricted': return { summary: true, evidence: true, privateEvidence: false, download: false }
    case 'private': return { summary: true, evidence: true, privateEvidence: true, download: true }
    case 'hidden': return { summary: false, evidence: false, privateEvidence: false, download: false }
  }
}

// --------------------------------------------------------------------------
// Visibility Policy Engine
// --------------------------------------------------------------------------

export class VisibilityPolicyEngine {
  private policies = new Map<string, VisibilityPolicy>()
  private overrides = new Map<string, Partial<VisibilityPolicy>>()

  /**
   * Register a visibility policy for a claim-actor pair.
   */
  setPolicy(policy: VisibilityPolicy): void {
    const key = `${policy.claim_id}:${policy.actor_type}`
    this.policies.set(key, policy)
  }

  /**
   * Apply an institutional override.
   */
  setOverride(claimId: string, override: Partial<VisibilityPolicy>): void {
    this.overrides.set(claimId, override)
  }

  /**
   * Resolve visibility for an actor on a claim.
   */
  resolve(actor: ActorType, claimId: string): VisibilityResolution {
    // Check for explicit policy
    const key = `${claimId}:${actor}`
    const policy = this.policies.get(key)

    // Check for institutional override
    const override = this.overrides.get(claimId)

    // Determine visibility level
    let level: VisibilityLevel
    if (policy) {
      level = policy.visibility_level
    } else if (override?.visibility_level) {
      level = override.visibility_level
    } else {
      level = DEFAULT_VISIBILITY[actor]
    }

    // Check expiration
    if (policy?.expires_at && new Date(policy.expires_at) < new Date()) {
      level = DEFAULT_VISIBILITY[actor]
    }

    const caps = capabilitiesForLevel(level)
    const canViewIdentity = IDENTITY_VISIBILITY[actor]

    return {
      actor,
      claim_id: claimId,
      resolved_level: level,
      can_view_identity: canViewIdentity,
      can_view_summary: caps.summary,
      can_view_evidence: caps.evidence,
      can_view_private_evidence: caps.privateEvidence,
      can_download: caps.download,
      policy_applied: policy?.policy_id ?? 'default',
      reason: policy
        ? `Explicit policy: ${policy.policy_id}`
        : override
          ? 'Institutional override applied'
          : `Default visibility for ${actor}`,
    }
  }

  /**
   * Resolve visibility for multiple claims at once.
   */
  resolveAll(actor: ActorType, claimIds: string[]): VisibilityResolution[] {
    return claimIds.map((id) => this.resolve(actor, id))
  }

  /**
   * Get all registered policies.
   */
  getPolicies(): VisibilityPolicy[] {
    return Array.from(this.policies.values())
  }

  /**
   * Check if an actor can see identity for any claim.
   */
  canSeeAnyIdentity(actor: ActorType): boolean {
    return IDENTITY_VISIBILITY[actor] === true
  }

  /**
   * Get default level for an actor type.
   */
  getDefaultLevel(actor: ActorType): VisibilityLevel {
    return DEFAULT_VISIBILITY[actor]
  }
}
