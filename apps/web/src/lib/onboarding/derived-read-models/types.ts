// ==========================================================================
// ORP-1.4 Derived Read Models — Claim, Evidence & Provenance References
// ==========================================================================
// These are EXTENSION POINTS only. Read models accept optional references
// but do NOT implement Claim Engine, Evidence Engine, or Confidence Engine.
// When references are absent, output is identical to ORP-1.3 baseline.
//
// No publication metadata. No package ids. No disclosure. No delivery.
// ==========================================================================

/**
 * Reference to a claim that may support or challenge a capability.
 * Claims are produced by the Claim Engine (future — ORP-1.5+).
 */
export interface ClaimReference {
  /** Stable claim identifier from the Claim Engine */
  id: string
  /** Claim type classification */
  claimType: string
  /** The claim statement text */
  statement: string
  /** Claim confidence level, when available from Confidence Engine */
  confidence?: 'High' | 'Medium' | 'Low' | 'Insufficient'
  /** Claim lifecycle status */
  status?: 'active' | 'under_review' | 'superseded' | 'withdrawn'
  /** Subject of the claim (capability, person, location, etc.) */
  subjectType?: string
  /** Subject identifier */
  subjectId?: string
}

/**
 * Reference to an evidence object that supports or contradicts a claim.
 * Evidence is produced by the Evidence Engine (future — ORP-1.5+).
 */
export interface EvidenceReference {
  /** Stable evidence identifier from the Evidence Engine */
  id: string
  /** Evidence classification */
  evidenceType: 'document' | 'observation' | 'attestation' | 'measurement' | 'audit'
  /** Evidence class (A-D) per Kadarn evidence taxonomy */
  evidenceClass?: 'A' | 'B' | 'C' | 'D'
  /** Source of the evidence */
  source?: string
  /** Evidence freshness indicator */
  freshness?: 'current' | 'aging' | 'expired'
  /** When the evidence was last validated */
  lastValidatedAt?: string
  /** When the evidence expires, if applicable */
  expiresAt?: string
}

/**
 * Reference to provenance information linking claims and evidence.
 * Provenance is produced by the Evidence Lineage / Published View engine.
 */
export interface ProvenanceReference {
  /** Stable provenance identifier */
  id: string
  /** Source claim identifier */
  sourceClaimId?: string
  /** Source evidence identifier */
  sourceEvidenceId?: string
  /** Relationship type between linked entities */
  relationshipType?: 'supports' | 'contradicts' | 'derives_from' | 'supersedes'
  /** Provenance chain depth */
  depth?: number
}

/**
 * Read model enrichment produced when optional references are present.
 * Always a subset of the full reference — never exposes internal engine state.
 */
export interface ReadModelEnrichment {
  claimIds: string[]
  evidenceIds: string[]
  claimCount: number
  evidenceCount: number
  /** Claims grouped by confidence level (only when claims present) */
  claimsByConfidence?: Record<string, number>
  /** Evidence grouped by freshness (only when evidence present) */
  evidenceByFreshness?: Record<string, number>
}

/**
 * Extracts a lightweight enrichment summary from optional claim/evidence references.
 * Returns null when no references are provided — preserving ORP-1.3 identical output.
 */
export function buildEnrichment(
  claims?: ClaimReference[],
  evidence?: EvidenceReference[],
): ReadModelEnrichment | null {
  if (!claims?.length && !evidence?.length) return null

  const enrichment: ReadModelEnrichment = {
    claimIds: (claims ?? []).map((c) => c.id),
    evidenceIds: (evidence ?? []).map((e) => e.id),
    claimCount: claims?.length ?? 0,
    evidenceCount: evidence?.length ?? 0,
  }

  if (claims?.length) {
    const byConfidence: Record<string, number> = {}
    for (const c of claims) {
      const key = c.confidence ?? 'unknown'
      byConfidence[key] = (byConfidence[key] ?? 0) + 1
    }
    enrichment.claimsByConfidence = byConfidence
  }

  if (evidence?.length) {
    const byFreshness: Record<string, number> = {}
    for (const e of evidence) {
      const key = e.freshness ?? 'unknown'
      byFreshness[key] = (byFreshness[key] ?? 0) + 1
    }
    enrichment.evidenceByFreshness = byFreshness
  }

  return enrichment
}
