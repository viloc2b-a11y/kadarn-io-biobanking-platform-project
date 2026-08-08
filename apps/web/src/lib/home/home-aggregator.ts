// ==========================================================================
// Slice 2 — Next Best Action Center: Home Data Aggregator
// ==========================================================================
// Pure functions that derive the 6 blocks from existing API responses.
// Never invents data. Never scores institutions. Never interprets unknown as no.
//
// Design contract:
// - Pure functions: same input → same output
// - Stateless: no side effects
// - Non-persistent: returns data, never writes
// - Factual-first: only derives conclusions from real data
// ==========================================================================

// ─── Block 1: PRIORIDAD HOY ───────────────────────────────────────────────

export interface PriorityItem {
  id: string
  kind: 'missing_evidence' | 'expired_evidence' | 'expiring_evidence'
    | 'pending_classification' | 'contradiction' | 'pending_review'
    | 'stale_confidence' | 'profile_gap' | 'passport_incomplete'
  title: string
  entityType: string       // e.g. "Claim", "Evidence", "Capability"
  entityName: string       // human-readable name
  whyItMatters: string     // one sentence explaining impact
  action: string           // recommended next action
  href: string             // link to the surface where it's resolved
}

export interface PriorityTodayInput {
  claims: ClaimSummary[]
  evidenceSummary: EvidenceSummary | null
  staleConfidence: StaleConfidenceItem[]
  gaps: GapItem[]
  reviewTasks: ReviewTaskSummary[]
}

export interface ClaimSummary {
  id: string
  statement: string
  status: string
  derivedState?: string
  confidence?: string
  evidenceCount?: number
  hasExpiredEvidence?: boolean
  hasDispute?: boolean
  institutionId?: string
  capabilityId?: string
}

export interface EvidenceSummary {
  totalDocuments: number
  documentsPresent: number
  documentsMissing: number
  documentsExpiringSoon: number
  documentsExpired: number
}

export interface StaleConfidenceItem {
  id: string
  entityType: string
  entityId: string
  entityName: string
  staleReason: string
}

export interface GapItem {
  id: string
  description: string
  severity: string
  relatedEntity?: string
  relatedEntityId?: string
}

export interface ReviewTaskSummary {
  id: string
  title: string
  status: string
  resourceType: string
  resourceId: string
  createdAt: string
}

/**
 * Derives the priority actions that require immediate attention.
 * Rules (ordered by priority):
 * 1. Evidence expired → action needed now
 * 2. Evidence expiring soon → action needed soon
 * 3. Claim without evidence → missing evidence
 * 4. Claim with contradiction → needs resolution
 * 5. Stale confidence → needs recalculation
 * 6. Profile gaps → incomplete profile
 *
 * NEVER invents priorities — returns empty array if no signal.
 */
export function derivePriorityToday(input: PriorityTodayInput): PriorityItem[] {
  const items: PriorityItem[] = []

  // Rule 1 & 2: Evidence urgency from evidence summary
  if (input.evidenceSummary) {
    if (input.evidenceSummary.documentsExpired > 0) {
      items.push({
        id: 'prio-expired-evidence',
        kind: 'expired_evidence',
        title: `${input.evidenceSummary.documentsExpired} documento(s) expirado(s) requieren atención inmediata`,
        entityType: 'Evidence',
        entityName: `${input.evidenceSummary.documentsExpired} documentos`,
        whyItMatters: 'La evidencia expirada debilita los claims que dependen de ella y puede impedir la publicación del Passport.',
        action: 'Revisar y renovar evidencia expirada',
        href: '/workspace/evidence',
      })
    }
    if (input.evidenceSummary.documentsExpiringSoon > 0) {
      items.push({
        id: 'prio-expiring-evidence',
        kind: 'expiring_evidence',
        title: `${input.evidenceSummary.documentsExpiringSoon} documento(s) próximos a expirar`,
        entityType: 'Evidence',
        entityName: `${input.evidenceSummary.documentsExpiringSoon} documentos`,
        whyItMatters: 'La evidencia próxima a expirar puede causar que claims queden sin soporte si no se renueva a tiempo.',
        action: 'Renovar evidencia antes de que expire',
        href: '/workspace/evidence',
      })
    }
  }

  // Rule 3: Claims without evidence
  const unevidenced = input.claims.filter(c =>
    (!c.evidenceCount || c.evidenceCount === 0) &&
    c.status !== 'archived' && c.status !== 'withdrawn'
  )
  if (unevidenced.length > 0) {
    const count = unevidenced.length
    items.push({
      id: 'prio-missing-evidence',
      kind: 'missing_evidence',
      title: `${count} claim(s) sin evidencia de soporte`,
      entityType: 'Claim',
      entityName: unevidenced.slice(0, 3).map(c => c.statement.slice(0, 60)).join(', '),
      whyItMatters: 'Los claims sin evidencia no pueden ser verificados ni publicados en el Passport.',
      action: count === 1 ? 'Adjuntar evidencia al claim' : 'Adjuntar evidencia a los claims',
      href: '/workspace/claims',
    })
  }

  // Rule 4: Claims with contradictions
  const contradicted = input.claims.filter(c =>
    c.hasDispute ||
    c.derivedState === 'contradicted'
  )
  if (contradicted.length > 0) {
    items.push({
      id: 'prio-contradiction',
      kind: 'contradiction',
      title: `${contradicted.length} claim(s) con contradicción o disputa activa`,
      entityType: 'Claim',
      entityName: contradicted.slice(0, 3).map(c => c.statement.slice(0, 60)).join(', '),
      whyItMatters: 'Las contradicciones no resueltas bloquean la verificación del claim y afectan la confianza institucional.',
      action: 'Resolver contradicciones pendientes',
      href: '/workspace/claims',
    })
  }

  // Rule 5: Stale confidence
  if (input.staleConfidence.length > 0) {
    items.push({
      id: 'prio-stale-confidence',
      kind: 'stale_confidence',
      title: `${input.staleConfidence.length} evaluación(es) de confianza desactualizada(s)`,
      entityType: 'Confidence',
      entityName: input.staleConfidence.slice(0, 3).map(s => s.entityName).join(', '),
      whyItMatters: 'Las evaluaciones desactualizadas pueden no reflejar el estado real de la evidencia.',
      action: 'Recalcular evaluaciones de confianza',
      href: '/workspace/claims',
    })
  }

  // Rule 6: Gaps
  if (input.gaps.length > 0) {
    const criticalGaps = input.gaps.filter(g => g.severity === 'critical' || g.severity === 'high')
    if (criticalGaps.length > 0) {
      items.push({
        id: 'prio-critical-gaps',
        kind: 'profile_gap',
        title: `${criticalGaps.length} brecha(s) crítica(s) en el perfil institucional`,
        entityType: 'Gap',
        entityName: criticalGaps.slice(0, 3).map(g => g.description.slice(0, 60)).join(', '),
        whyItMatters: 'Las brechas críticas impiden completar capacidades declaradas.',
        action: 'Resolver brechas del perfil',
        href: '/workspace/profile',
      })
    }
  }

  // Pending reviews from review queue
  const pendingReviews = input.reviewTasks.filter(t => t.status === 'pending')
  if (pendingReviews.length > 0) {
    items.push({
      id: 'prio-pending-reviews',
      kind: 'pending_review',
      title: `${pendingReviews.length} revisión(es) pendiente(s) requieren tu atención`,
      entityType: 'Review',
      entityName: pendingReviews.slice(0, 3).map(r => r.title).join(', '),
      whyItMatters: 'Las revisiones pendientes bloquean el avance de claims y evidencia.',
      action: 'Completar revisiones pendientes',
      href: '/workspace/review',
    })
  }

  return items
}

// ─── Block 2: READINESS ────────────────────────────────────────────────────

export interface ReadinessBlock {
  claimsByStatus: {
    supported: number
    declared: number
    unknown: number
    notApplicable: number
    staleExpired: number
    disputed: number
  }
  evidenceFreshness: {
    active: number
    expiringSoon: number
    expired: number
  }
  capabilityCoverage: CapabilityCoverageItem[]
  /** NEVER an institutional score. Factual breakdown only. */
}

export interface CapabilityCoverageItem {
  name: string
  totalClaims: number
  supportedClaims: number
  declaredClaims: number
  unknownClaims: number
  /** Only derive this per-capability, never roll up to institution level. */
}

export interface ReadinessInput {
  claims: ClaimSummary[]
  capabilities: CapabilityInput[]
  evidenceSummary: EvidenceSummary | null
}

export interface CapabilityInput {
  id: string
  name: string
  evidenceSupport?: string
  level?: string
}

/**
 * Derives readiness as factual breakdown, never as a score.
 * "Unknown" is explicitly NOT converted to "no".
 */
export function deriveReadinessBlock(input: ReadinessInput): ReadinessBlock {
  const claims = input.claims

  // Claims by evidence support status
  const claimsByStatus = {
    supported: claims.filter(c =>
      c.derivedState === 'substantiated' ||
      (c.evidenceCount && c.evidenceCount > 0 && c.confidence === 'High')
    ).length,
    unknown: claims.filter(c =>
      c.derivedState === 'unknown' ||
      (!c.derivedState && !c.status)
    ).length,
    declared: claims.filter(c =>
      c.derivedState === 'declared' ||
      c.derivedState === 'unsubstantiated' ||
      ((!c.evidenceCount || c.evidenceCount === 0) && c.derivedState !== 'unknown')
    ).length,
    notApplicable: 0, // Derived from claim context, not claims list
    staleExpired: claims.filter(c =>
      c.derivedState === 'stale' ||
      c.derivedState === 'expired' ||
      c.hasExpiredEvidence
    ).length,
    disputed: claims.filter(c =>
      c.derivedState === 'disputed' ||
      c.hasDispute
    ).length,
  }

  const evidenceFreshness = input.evidenceSummary ? {
    active: input.evidenceSummary.documentsPresent,
    expiringSoon: input.evidenceSummary.documentsExpiringSoon,
    expired: input.evidenceSummary.documentsExpired,
  } : { active: 0, expiringSoon: 0, expired: 0 }

  // Group by capability
  const capMap = new Map<string, { name: string; claims: ClaimSummary[] }>()
  for (const c of claims) {
    const capName = c.capabilityId || 'general'
    if (!capMap.has(capName)) capMap.set(capName, { name: capName, claims: [] })
    capMap.get(capName)!.claims.push(c)
  }
  // Add capabilities that have no claims yet
  for (const cap of input.capabilities) {
    if (!capMap.has(cap.id)) capMap.set(cap.id, { name: cap.name || cap.id, claims: [] })
  }

  const capabilityCoverage: CapabilityCoverageItem[] = []
  for (const [, v] of capMap) {
    capabilityCoverage.push({
      name: v.name,
      totalClaims: v.claims.length,
      supportedClaims: v.claims.filter(c =>
        c.derivedState === 'substantiated' || (c.evidenceCount && c.evidenceCount > 0)
      ).length,
      declaredClaims: v.claims.filter(c =>
        !c.evidenceCount || c.evidenceCount === 0
      ).length,
      unknownClaims: v.claims.filter(c =>
        c.derivedState === 'unknown' || (!c.derivedState && !c.status)
      ).length,
    })
  }
  // Sort: capabilities with most supported claims first
  capabilityCoverage.sort((a, b) => b.supportedClaims - a.supportedClaims)

  return { claimsByStatus, evidenceFreshness, capabilityCoverage }
}

// ─── Block 3: CAMBIOS RECIENTES ────────────────────────────────────────────

export interface ChangeItem {
  id: string
  kind: 'new_evidence' | 'claim_modified' | 'review_completed'
    | 'confidence_updated' | 'document_expired' | 'counter_evidence'
    | 'passport_changed'
  summary: string
  entityType: string
  entityId: string
  timestamp: string
  href: string
}

export interface RecentChangesInput {
  claims: ClaimSummary[]
  events: RecentEvent[]
}

export interface RecentEvent {
  id: string
  action: string
  resourceType: string
  resourceId: string
  summary: string
  createdAt: string
}

/**
 * Derives recent changes exclusively from real event data.
 * Claims without a factual timestamp are never presented as "recent changes."
 * No invented timestamps — an old claim with no event record is NOT a change.
 */
export function deriveRecentChanges(input: RecentChangesInput): ChangeItem[] {
  const items: ChangeItem[] = []

  // Only from real events — never from bare claims without timestamps
  for (const ev of input.events.slice(0, 10)) {
    items.push({
      id: `evt-${ev.id}`,
      kind: mapEventKind(ev.action, ev.resourceType),
      summary: ev.summary || `${ev.action} on ${ev.resourceType}`,
      entityType: ev.resourceType,
      entityId: ev.resourceId,
      timestamp: ev.createdAt,
      href: mapEventHref(ev.resourceType, ev.resourceId),
    })
  }

  items.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return items.slice(0, 8)
}

function mapEventKind(action: string, resourceType: string): ChangeItem['kind'] {
  const a = action.toLowerCase()
  if (a.includes('evidence') || a.includes('upload')) return 'new_evidence'
  if (a.includes('review') || a.includes('approve') || a.includes('reject')) return 'review_completed'
  if (a.includes('confidence') || a.includes('recalc')) return 'confidence_updated'
  if (a.includes('expir')) return 'document_expired'
  if (a.includes('dispute') || a.includes('counter')) return 'counter_evidence'
  if (a.includes('passport')) return 'passport_changed'
  return 'claim_modified'
}

function mapEventHref(resourceType: string, resourceId: string): string {
  const type = resourceType.toLowerCase()
  if (type.includes('claim')) return `/workspace/claims/${resourceId}`
  if (type.includes('evidence')) return `/workspace/evidence/${resourceId}`
  if (type.includes('review')) return `/workspace/review/${resourceId}`
  return `/workspace/claims`
}

// ─── Block 4: COLA DE REVISIÓN ─────────────────────────────────────────────

export interface ReviewQueueItem {
  id: string
  kind: 'pending_evidence_review' | 'claim_under_review'
    | 'contradiction' | 'unclassified_evidence'
    | 'right_of_response' | 'dispute'
  title: string
  status: string
  entityType: string
  entityId: string
  createdAt: string
  href: string
}

export interface ReviewQueueInput {
  reviewTasks: ReviewTaskSummary[]
  claims: ClaimSummary[]
}

/**
 * Derives the review queue from existing tasks and claim states.
 * Reuses existing workflows — never creates a second review system.
 */
export function deriveReviewQueue(input: ReviewQueueInput): ReviewQueueItem[] {
  const items: ReviewQueueItem[] = []

  // From review tasks API
  for (const task of input.reviewTasks) {
    if (task.status === 'completed' || task.status === 'cancelled') continue
    items.push({
      id: task.id,
      kind: mapReviewKind(task.resourceType),
      title: task.title,
      status: task.status,
      entityType: task.resourceType,
      entityId: task.resourceId,
      createdAt: task.createdAt,
      href: task.resourceType === 'claim'
        ? `/workspace/claims/${task.resourceId}`
        : `/workspace/review/${task.id}`,
    })
  }

  // From claims with disputes/contradictions — no invented timestamps
  // Disputes without a creation timestamp are listed but NOT time-sorted
  const disputeItems: ReviewQueueItem[] = []
  for (const c of input.claims) {
    if (c.hasDispute) {
      disputeItems.push({
        id: `disp-${c.id}`,
        kind: 'dispute',
        title: c.statement.slice(0, 80),
        status: 'pending',
        entityType: 'claim',
        entityId: c.id,
        createdAt: '', // no invented timestamp — factual only
        href: `/workspace/claims/${c.id}`,
      })
    }
  }

  // Items with real timestamps first (tasks), then disputes
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  // Append disputes after time-sorted items (they have no timestamp)
  items.push(...disputeItems)
  return items.slice(0, 10)
}

function mapReviewKind(resourceType: string): ReviewQueueItem['kind'] {
  const t = resourceType.toLowerCase()
  if (t.includes('evidence')) return 'pending_evidence_review'
  if (t.includes('claim')) return 'claim_under_review'
  if (t.includes('dispute') || t.includes('contradiction')) return 'contradiction'
  if (t.includes('response')) return 'right_of_response'
  return 'pending_evidence_review'
}

// ─── Block 5: PASSPORT ─────────────────────────────────────────────────────

export interface PassportBlock {
  /** Factual identity field presence — never a percentage threshold. */
  identityStatus: 'available' | 'partial' | 'pending'
  /** Which identity fields are present / missing. */
  identityFields: { name: boolean; type: boolean; location: boolean }
  claimsWithSupport: number
  totalClaims: number
  visibleGaps: string[]
  lastUpdated: string | null
  pendingBeforeShare: string[]
}

export interface PassportBlockInput {
  institutionName: string
  institutionId: string
  /** Factual identity fields — never a composite percentage. */
  identityFields: { name: boolean; type: boolean; location: boolean }
  claims: ClaimSummary[]
  evidenceSummary: EvidenceSummary | null
  passportGeneratedAt: string | null
  gaps: GapItem[]
}

/**
 * Derives Passport status as information product readiness,
 * never as a score or binary derived from a percentage.
 * Identity status is factual: checks specific fields, not thresholds.
 */
export function derivePassportBlock(input: PassportBlockInput): PassportBlock {
  const claimsWithEvidence = input.claims.filter(c =>
    c.evidenceCount && c.evidenceCount > 0
  ).length

  const visibleGaps: string[] = []
  for (const g of input.gaps.slice(0, 3)) {
    visibleGaps.push(g.description)
  }

  // Missing identity fields — factual, not percentage-based
  if (!input.identityFields.name && !visibleGaps.includes('Falta nombre de la institución')) {
    visibleGaps.unshift('Falta nombre de la institución')
  }
  if (!input.identityFields.type && !visibleGaps.includes('Falta tipo de institución')) {
    visibleGaps.unshift('Falta tipo de institución')
  }

  // Identity status from specific fields, NOT from overall percentage
  const presentCount = [input.identityFields.name, input.identityFields.type, input.identityFields.location]
    .filter(Boolean).length
  const identityStatus: PassportBlock['identityStatus'] =
    presentCount === 3 ? 'available' :
    presentCount >= 1 ? 'partial' :
    'pending'

  const pending: string[] = []
  if (claimsWithEvidence < input.claims.length) {
    pending.push(`${input.claims.length - claimsWithEvidence} claims sin evidencia`)
  }
  if (input.evidenceSummary && input.evidenceSummary.documentsExpired > 0) {
    pending.push(`${input.evidenceSummary.documentsExpired} documentos expirados`)
  }
  if (input.evidenceSummary && input.evidenceSummary.documentsMissing > 0) {
    pending.push(`${input.evidenceSummary.documentsMissing} documentos faltantes`)
  }
  if (!input.identityFields.name) pending.push('Nombre de la institución pendiente')
  if (!input.identityFields.type) pending.push('Tipo de institución pendiente')

  return {
    identityStatus,
    identityFields: input.identityFields,
    claimsWithSupport: claimsWithEvidence,
    totalClaims: input.claims.length,
    visibleGaps: visibleGaps.slice(0, 5),
    lastUpdated: input.passportGeneratedAt,
    pendingBeforeShare: pending.slice(0, 4),
  }
}

// ─── Block 6: EXPLICABILIDAD ───────────────────────────────────────────────
// Explainability is embedded in every block, not a standalone section.
// Each PriorityItem includes whyItMatters and action.
// Each Readiness breakdown shows factual counts, not scores.
// Confidence is always accompanied by an explanation traceable to evidence.
// This block exports helpers used by the UI components.

export interface ConfidenceExplanation {
  level: string
  explanation: string
  evidenceCount: number
  provenance?: string
  freshness: string
}

export function buildConfidenceExplanation(
  claim: ClaimSummary,
): ConfidenceExplanation {
  const evidenceCount = claim.evidenceCount ?? 0

  let level: string
  let explanation: string
  let freshness: string

  if (claim.hasExpiredEvidence) {
    level = 'Evidencia expirada'
    explanation = `El claim tiene ${evidenceCount} pieza(s) de evidencia, pero al menos un documento está expirado.`
    freshness = 'Documento expirado detectado'
  } else if (claim.hasDispute) {
    level = 'En disputa'
    explanation = 'Este claim tiene una disputa activa. La confianza está suspendida hasta que se resuelva.'
    freshness = 'Disputa activa'
  } else if (evidenceCount === 0) {
    level = 'Sin evidencia'
    explanation = 'No hay evidencia adjunta a este claim.'
    freshness = 'Sin evidencia'
  } else if (claim.derivedState === 'substantiated') {
    level = 'Sustentada'
    explanation = `${evidenceCount} pieza(s) de evidencia adjunta(s). El claim está marcado como sustentado.`
    freshness = 'No disponible' // factual: API no expone freshness aún
  } else if (evidenceCount >= 1) {
    level = 'Evidencia adjunta'
    explanation = `${evidenceCount} pieza(s) de evidencia adjunta(s). El estado derivado es "${claim.derivedState || 'desconocido'}".`
    freshness = 'No disponible'
  } else {
    level = 'No evaluada'
    explanation = 'No se ha realizado una evaluación de confianza para este claim.'
    freshness = 'No disponible'
  }

  return { level, explanation, evidenceCount, freshness }
}
