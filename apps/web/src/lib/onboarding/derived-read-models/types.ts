// ==========================================================================
// ORP-1.5 Knowledge Boundary — Unified Knowledge Context
// ==========================================================================
// FROZEN CONTRACT. The KnowledgeContext is the single enrichment point
// between the Canonical Layer and Read Models. Read Models will not change
// their enrichment interface after ORP-1.5.
//
// No Claim Engine, Evidence Engine, or Confidence Engine is implemented here.
// These are extension points only.
// ==========================================================================

/**
 * Knowledge Context — the single enrichment contract between the Canonical
 * Layer and Read Models (ORP-1.5, FROZEN).
 *
 * Replaces loose claims/evidence/provenance parameters with a unified
 * envelope. Read Models consume `knowledge?: KnowledgeContext` and produce
 * identical output when absent.
 *
 * Reserved slots (confidence, limitations, quality) are declared but not
 * implemented. They will be populated by future engines (ORP-1.x+).
 */
export interface KnowledgeContext {
  /** Claim references from Claim Engine (future) */
  claims?: ClaimReference[]
  /** Evidence references from Evidence Engine (future) */
  evidence?: EvidenceReference[]
  /** Provenance references from Evidence Lineage / Published View */
  provenance?: ProvenanceReference[]

  // ── Reserved slots (not implemented — ORP-1.x+) ──

  /**
   * @reserved Confidence model references from Confidence Engine (future).
   * Not populated in ORP-1.5. Read Models must treat absence as neutral.
   */
  confidence?: ConfidenceContext

  /**
   * @reserved Known limitations of the current knowledge state.
   * Not populated in ORP-1.5. Read Models must treat absence as neutral.
   */
  limitations?: LimitationContext[]

  /**
   * @reserved Quality assessment references from Quality Engine (future).
   * Not populated in ORP-1.5. Read Models must treat absence as neutral.
   */
  quality?: QualityContext

  /** Timestamp of the last knowledge refresh. Set by the Knowledge Layer. */
  refreshedAt?: string
}

// ==========================================================================
// Reference Types (unchanged from ORP-1.4)
// ==========================================================================

/**
 * Reference to a claim that may support or challenge a capability.
 * Claims are produced by the Claim Engine (future).
 */
export interface ClaimReference {
  id: string
  claimType: string
  statement: string
  confidence?: 'High' | 'Medium' | 'Low' | 'Insufficient'
  status?: 'active' | 'under_review' | 'superseded' | 'withdrawn'
  subjectType?: string
  subjectId?: string
}

/**
 * Reference to an evidence object that supports or contradicts a claim.
 * Evidence is produced by the Evidence Engine (future).
 */
export interface EvidenceReference {
  id: string
  evidenceType: 'document' | 'observation' | 'attestation' | 'measurement' | 'audit'
  evidenceClass?: 'A' | 'B' | 'C' | 'D'
  source?: string
  freshness?: 'current' | 'aging' | 'expired'
  lastValidatedAt?: string
  expiresAt?: string
}

/**
 * Reference to provenance information linking claims and evidence.
 */
export interface ProvenanceReference {
  id: string
  sourceClaimId?: string
  sourceEvidenceId?: string
  relationshipType?: 'supports' | 'contradicts' | 'derives_from' | 'supersedes'
  depth?: number
}

// ==========================================================================
// Reserved Context Types (not implemented — ORP-1.x+)
// ==========================================================================

/**
 * @reserved Confidence context from Confidence Engine (future).
 * Structure is provisional and subject to change when the engine is built.
 */
export interface ConfidenceContext {
  /** Overall confidence level for the knowledge snapshot */
  level?: 'High' | 'Medium' | 'Low' | 'Insufficient'
  /** Confidence engine version that produced this assessment */
  engineVersion?: string
}

/**
 * @reserved A known limitation in the current knowledge state.
 * Read Models may surface these as caveats when present.
 */
export interface LimitationContext {
  /** Limitation identifier */
  id: string
  /** Human-readable description of the limitation */
  description: string
  /** What is affected by this limitation */
  affects: string[]
  /** Severity of the limitation */
  severity?: 'info' | 'warning' | 'blocker'
}

/**
 * @reserved Quality assessment context from Quality Engine (future).
 * Structure is provisional and subject to change when the engine is built.
 */
export interface QualityContext {
  /** Overall quality score (0-100) */
  score?: number
  /** Quality dimensions assessed */
  dimensions?: string[]
  /** Quality engine version */
  engineVersion?: string
}

// ==========================================================================
// OCP-3 Evidence Support Levels
// ==========================================================================

export type EvidenceSupport =
  | 'SUPPORTED_BY_EVIDENCE'
  | 'DECLARED_ONLY'
  | 'NEEDS_EVIDENCE'
  | 'PARTIALLY_SUPPORTED'
  | 'UNKNOWN'
  | 'NOT_APPLICABLE'
  | 'NEEDS_REVIEW'
  | 'EXPIRED_OR_OUTDATED'

export const EVIDENCE_SUPPORT_LABELS: Record<EvidenceSupport, string> = {
  SUPPORTED_BY_EVIDENCE: 'Supported by evidence',
  DECLARED_ONLY: 'Declared',
  NEEDS_EVIDENCE: 'Needs evidence',
  PARTIALLY_SUPPORTED: 'Partially supported',
  UNKNOWN: 'Not yet collected',
  NOT_APPLICABLE: 'Not applicable',
  NEEDS_REVIEW: 'Needs review',
  EXPIRED_OR_OUTDATED: 'Expired or outdated',
}

export interface ConditionalRequirement {
  condition: string
  requirement: string
  description: string
  evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const CONDITIONAL_REQUIREMENTS: ConditionalRequirement[] = [
  {
    condition: 'Laboratory or testing capability declared',
    requirement: 'CLIA Certificate (or CAP, COLA equivalent)',
    description: 'Required when the institution operates a clinical or research laboratory.',
    evidenceClass: 'A',
  },
  {
    condition: 'Biospecimen shipping or dangerous goods declared',
    requirement: 'IATA Dangerous Goods Certification',
    description: 'Required when the institution ships biospecimens or dangerous goods.',
    evidenceClass: 'B',
  },
  {
    condition: 'Investigational product handling declared',
    requirement: 'Pharmacy license or IP management SOP',
    description: 'Required when the institution handles investigational products.',
    evidenceClass: 'A',
  },
  {
    condition: 'Early phase capability declared',
    requirement: 'Overnight/stay capacity documentation',
    description: 'Required when the institution declares early phase trial capability.',
    evidenceClass: 'B',
  },
  {
    condition: 'Biospecimen operations declared',
    requirement: 'Chain of custody documentation',
    description: 'Required when biospecimen collection, processing, or storage is declared.',
    evidenceClass: 'B',
  },
]

export function getActiveConditionalRequirements(params: {
  infrastructure: unknown[]
  uploadedDocLabels: string[]
}): { requirement: ConditionalRequirement; active: boolean; satisfied: boolean }[] {
  const { infrastructure, uploadedDocLabels } = params
  const hasLab = infrastructure.some(
    (item: any) => item.laboratoryPresent === true,
  )
  const hasBiospecimen = infrastructure.some(
    (item: any) =>
      Array.isArray(item.biospecimenOperations) &&
      item.biospecimenOperations.some((op: string) => op !== 'None'),
  )
  const hasShipping = infrastructure.some(
    (item: any) =>
      item.shippingCapability === 'both' || item.shippingCapability === 'international',
  )
  const hasEarlyPhase = infrastructure.some(
    (item: any) =>
      item.facilityType === 'Early Phase Unit' || item.overnightEarlyPhaseCapacity === true,
  )

  const labels = uploadedDocLabels.map((l: string) => l.toLowerCase())

  return CONDITIONAL_REQUIREMENTS.map((req) => {
    let active = false
    if (req.requirement.includes('CLIA')) active = hasLab
    else if (req.requirement.includes('IATA')) active = hasBiospecimen || hasShipping
    else if (req.requirement.includes('Pharmacy')) active = hasBiospecimen
    else if (req.requirement.includes('Overnight')) active = hasEarlyPhase
    else if (req.requirement.includes('Chain of custody')) active = hasBiospecimen

    const satisfied = active
      ? labels.some(
          (l: string) =>
            l.includes('clia') ||
            l.includes('cap') ||
            l.includes('cola') ||
            l.includes('iata') ||
            l.includes('pharmacy') ||
            l.includes('custody') ||
            l.includes('overnight') ||
            l.includes('sop'),
        )
      : true

    return { requirement: req, active, satisfied }
  })
}

// ==========================================================================
// Read Model Enrichment (unchanged output shape from ORP-1.4)
// ==========================================================================

/**
 * Read model enrichment produced when KnowledgeContext is present.
 * Always a lightweight summary — never exposes internal engine state.
 */
export interface ReadModelEnrichment {
  claimIds: string[]
  evidenceIds: string[]
  claimCount: number
  evidenceCount: number
  claimsByConfidence?: Record<string, number>
  evidenceByFreshness?: Record<string, number>
}

// ==========================================================================
// Enrichment Builder (ORP-1.5 — accepts KnowledgeContext)
// ==========================================================================

/**
 * Extracts a lightweight enrichment summary from a KnowledgeContext.
 * Returns null when knowledge is absent or has no claims/evidence —
 * preserving ORP-1.3 identical output.
 *
 * FROZEN after ORP-1.5. New knowledge dimensions added to KnowledgeContext
 * must not change this function's return type.
 */
export function buildEnrichment(
  knowledge?: KnowledgeContext,
): ReadModelEnrichment | null {
  if (!knowledge) return null

  const claims = knowledge.claims
  const evidence = knowledge.evidence

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
