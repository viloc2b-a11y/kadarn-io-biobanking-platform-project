// ==========================================================================
// Evidence Firewall — Engine (Sprint 23C)
// ==========================================================================
// Mandatory protection layer. No evidence enters Discovery without passing.
// Never modifies evidence. Never evaluates capability. Deterministic only.
// ==========================================================================

import type {
  EvidencePayload,
  EvidenceQuarantineEntry,
  FirewallDecision,
  FirewallDecisionOutput,
  FirewallReviewItem,
  FirewallStatus,
  FirewallValidationResult,
  ValidationRule,
} from './types'

// --------------------------------------------------------------------------
// Supported providers (from Connector Layer)
// --------------------------------------------------------------------------

const SUPPORTED_PROVIDERS = new Set([
  'clinicaltrials.gov', 'pubmed', 'crossref', 'openalex', 'orcid', 'ror', 'fda',
])

// --------------------------------------------------------------------------
// Source validation
// --------------------------------------------------------------------------

function validateSource(payload: EvidencePayload): FirewallValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  if (!SUPPORTED_PROVIDERS.has(payload.source_provider)) {
    errors.push(`Unsupported provider: ${payload.source_provider}`)
  }

  if (!payload.id || payload.id.trim() === '') {
    errors.push('Missing evidence ID')
  }

  if (!payload.payload || Object.keys(payload.payload).length === 0) {
    errors.push('Empty payload')
  }

  if (!payload.metadata || Object.keys(payload.metadata).length === 0) {
    warnings.push('Missing metadata — payload accepted with warning')
  }

  const passed = errors.length === 0
  const decision: FirewallDecision = passed && warnings.length > 0
    ? 'accepted_with_warning'
    : passed ? 'accepted' : 'rejected'

  return { rule: 'source_validation', passed, decision, warnings, errors }
}

// --------------------------------------------------------------------------
// Identity validation (consume Identity Resolution only)
// --------------------------------------------------------------------------

function validateIdentity(
  payload: EvidencePayload,
  identityExists: boolean,
  identityState: string,
): FirewallValidationResult {
  const errors: string[] = []

  if (!payload.canonical_identity_id) {
    errors.push('Missing canonical identity ID')
  }

  if (!identityExists) {
    errors.push('Canonical identity not found in Identity Resolution')
  }

  if (identityState === 'ambiguous') {
    errors.push('Ambiguous identity — evidence quarantined until identity resolved')
  }

  if (identityState === 'unresolved') {
    errors.push('Unresolved identity — evidence rejected')
  }

  const passed = errors.length === 0

  return { rule: 'identity_validation', passed, decision: passed ? 'accepted' : 'rejected', warnings: [], errors }
}

// --------------------------------------------------------------------------
// Duplicate detection
// --------------------------------------------------------------------------

function detectDuplicates(
  payload: EvidencePayload,
  knownIds: Set<string>,
): FirewallValidationResult {
  const warnings: string[] = []

  if (knownIds.has(payload.id)) {
    warnings.push(`Duplicate evidence detected: ${payload.id}`)
  }

  const passed = warnings.length === 0

  return {
    rule: 'duplicate_detection',
    passed,
    decision: passed ? 'accepted' : 'accepted_with_warning',
    warnings,
    errors: [],
  }
}

// --------------------------------------------------------------------------
// Temporal consistency
// --------------------------------------------------------------------------

function validateTemporal(payload: EvidencePayload): FirewallValidationResult {
  const errors: string[] = []
  const data = payload.payload
  const now = new Date()

  // Publication date in the future
  const pubDate = data.publication_date ?? data.date ?? data.created_at
  if (pubDate && typeof pubDate === 'string') {
    const d = new Date(pubDate)
    if (d > now) {
      errors.push(`Publication date is in the future: ${pubDate}`)
    }
  }

  // Impossible timestamps
  const retrievedAt = new Date(payload.retrieved_at)
  if (retrievedAt > now) {
    errors.push('Retrieval timestamp is in the future')
  }

  const passed = errors.length === 0

  return {
    rule: 'temporal_consistency',
    passed,
    decision: passed ? 'accepted' : 'rejected',
    warnings: [],
    errors,
  }
}

// --------------------------------------------------------------------------
// Structural validation
// --------------------------------------------------------------------------

function validateStructure(payload: EvidencePayload): FirewallValidationResult {
  const errors: string[] = []
  const data = payload.payload

  switch (payload.object_type) {
    case 'publication':
      if (!data.title) errors.push('Publication missing title')
      break
    case 'study':
      if (!data.study_id && !data.nct_id) errors.push('Study missing identifier')
      break
    case 'sop':
      if (!data.title && !data.sop_id) errors.push('SOP missing identifier')
      break
    case 'certification':
      if (!data.certification_type) errors.push('Certification missing type')
      break
    default:
      break
  }

  if (typeof data !== 'object' || data === null) {
    errors.push('Payload is not a valid object')
  }

  const passed = errors.length === 0

  return {
    rule: 'structural_validation',
    passed,
    decision: passed ? 'accepted' : 'rejected',
    warnings: [],
    errors,
  }
}

// --------------------------------------------------------------------------
// Cross-source corroboration (minimal — compare identifiers when available)
// --------------------------------------------------------------------------

function corroborateSources(
  payload: EvidencePayload,
  existingByType: Map<string, EvidencePayload>,
): FirewallValidationResult {
  const warnings: string[] = []
  const key = `${payload.object_type}:${payload.id}`

  const existing = existingByType.get(key)
  if (existing && existing.source_provider !== payload.source_provider) {
    // Same object from different providers — corroborate
    const existingTitle = typeof existing.payload.title === 'string' ? existing.payload.title : ''
    const incomingTitle = typeof payload.payload.title === 'string' ? payload.payload.title : ''
    if (existingTitle && incomingTitle && existingTitle !== incomingTitle) {
      warnings.push(`Title mismatch across providers: "${existingTitle.slice(0, 50)}" vs "${incomingTitle.slice(0, 50)}"`)
    }
  }

  const passed = warnings.length === 0

  return {
    rule: 'cross_source_corroboration',
    passed,
    decision: passed ? 'accepted' : 'needs_review',
    warnings,
    errors: [],
  }
}

// --------------------------------------------------------------------------
// Evidence Firewall Engine
// --------------------------------------------------------------------------

export class EvidenceFirewall {
  private processedIds = new Set<string>()
  private byType = new Map<string, EvidencePayload>()
  private quarantine: EvidenceQuarantineEntry[] = []
  private reviewItems: FirewallReviewItem[] = []
  private identityLookup: (id: string) => { exists: boolean; state: string } = () => ({ exists: true, state: 'resolved' })

  private totalProcessed = 0
  private acceptedCount = 0
  private warningCount = 0
  private reviewCount = 0
  private quarantinedCount = 0
  private rejectedCount = 0

  /**
   * Register an identity lookup function (consumes Identity Resolution).
   */
  setIdentityLookup(fn: (id: string) => { exists: boolean; state: string }): void {
    this.identityLookup = fn
  }

  /**
   * Process evidence through the firewall.
   * Returns the firewall decision. Only 'accepted' or 'accepted_with_warning'
   * evidence should enter Discovery.
   */
  process(payload: EvidencePayload): FirewallDecisionOutput {
    const now = new Date().toISOString()
    const results: FirewallValidationResult[] = []
    const reviewItems: FirewallReviewItem[] = []

    // Rule 1: Source validation
    const sourceResult = validateSource(payload)
    results.push(sourceResult)
    if (sourceResult.decision === 'rejected') {
      this.rejectedCount++
      this.totalProcessed++
      this.processedIds.add(payload.id)
      return this.buildOutput(payload, 'rejected', results, [], now)
    }

    // Rule 2: Identity validation
    const identity = this.identityLookup(payload.canonical_identity_id)
    const identityResult = validateIdentity(payload, identity.exists, identity.state)
    results.push(identityResult)
    if (identityResult.decision === 'rejected') {
      this.rejectedCount++
      this.totalProcessed++
      this.processedIds.add(payload.id)
      return this.buildOutput(payload, 'rejected', results, [], now)
    }

    // Rule 3: Duplicate detection
    const dupResult = detectDuplicates(payload, this.processedIds)
    results.push(dupResult)

    // Rule 4: Temporal consistency
    const temporalResult = validateTemporal(payload)
    results.push(temporalResult)
    if (temporalResult.decision === 'rejected') {
      this.quarantineEvidence(payload, 'temporal_violation', 'rejected')
      this.quarantinedCount++
      this.totalProcessed++
      this.processedIds.add(payload.id)
      return this.buildOutput(payload, 'rejected', results, [], now)
    }

    // Rule 5: Structural validation
    const structResult = validateStructure(payload)
    results.push(structResult)
    if (structResult.decision === 'rejected') {
      this.rejectedCount++
      this.totalProcessed++
      this.processedIds.add(payload.id)
      return this.buildOutput(payload, 'rejected', results, [], now)
    }

    // Rule 6: Cross-source corroboration
    const corrobResult = corroborateSources(payload, this.byType)
    results.push(corrobResult)
    if (corrobResult.decision === 'needs_review') {
      const item = this.createReviewItem(payload.id, 'cross_source_conflict', corrobResult.warnings.join('; '))
      reviewItems.push(item)
      this.reviewCount++
    }

    // Determine final decision
    const hasWarnings = results.some((r) => r.decision === 'accepted_with_warning' || r.warnings.length > 0)
    const hasReview = corrobResult.decision === 'needs_review'

    let finalDecision: FirewallDecision
    if (hasReview) {
      finalDecision = 'needs_review'
    } else if (hasWarnings) {
      finalDecision = 'accepted_with_warning'
      this.warningCount++
    } else {
      finalDecision = 'accepted'
      this.acceptedCount++
    }

    this.totalProcessed++
    this.processedIds.add(payload.id)

    const typeKey = `${payload.object_type}:${payload.id}`
    this.byType.set(typeKey, payload)

    return this.buildOutput(payload, finalDecision, results, reviewItems, now)
  }

  /** Get all quarantined evidence */
  getQuarantine(): EvidenceQuarantineEntry[] {
    return [...this.quarantine]
  }

  /** Get review items */
  getReviewItems(): FirewallReviewItem[] {
    return [...this.reviewItems]
  }

  /** Resolve a review item */
  resolveReview(reviewId: string): void {
    const item = this.reviewItems.find((r) => r.id === reviewId)
    if (item) item.status = 'resolved'
  }

  /** Get firewall status */
  getStatus(): FirewallStatus {
    return {
      accepted: this.acceptedCount,
      accepted_with_warning: this.warningCount,
      needs_review: this.reviewCount,
      quarantined: this.quarantinedCount,
      rejected: this.rejectedCount,
      total_processed: this.totalProcessed,
      last_processed_at: this.totalProcessed > 0 ? new Date().toISOString() : null,
    }
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  private quarantineEvidence(payload: EvidencePayload, reason: string, state: FirewallDecision): void {
    this.quarantine.push({
      id: `quarantine:${payload.id}`,
      reason,
      source: payload.source_provider,
      canonical_identity: payload.canonical_identity_id,
      detected_at: new Date().toISOString(),
      firewall_state: state,
      review_required: true,
      metadata: payload.metadata,
      original_payload: payload,
    })
    this.quarantinedCount++
  }

  private createReviewItem(evidenceId: string, reason: string, description: string): FirewallReviewItem {
    const item: FirewallReviewItem = {
      id: `review:${evidenceId}:${Date.now()}`,
      reason,
      evidence_ids: [evidenceId],
      description,
      created_at: new Date().toISOString(),
      status: 'open',
    }
    this.reviewItems.push(item)
    return item
  }

  private buildOutput(
    payload: EvidencePayload,
    decision: FirewallDecision,
    results: FirewallValidationResult[],
    reviewItems: FirewallReviewItem[],
    now: string,
  ): FirewallDecisionOutput {
    return {
      decision,
      evidence_id: payload.id,
      validation_results: results,
      quarantine_entry: decision === 'rejected' || decision === 'quarantined'
        ? this.quarantine[this.quarantine.length - 1]
        : undefined,
      review_items: reviewItems,
      processed_at: now,
    }
  }
}
