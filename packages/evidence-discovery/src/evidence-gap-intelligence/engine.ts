// ==========================================================================
// Evidence Gap Intelligence Engine (Sprint 21C)
// ==========================================================================
//
// Canonical evidence gap model. Gaps become structured, reusable intelligence.
//
// Consumes Discovery aggregate + CapabilityIntelligence output.
// Produces dashboard-ready gap intelligence.
//
// No AI reasoning. No confidence computation. No Evidence Core writes.
// No "verified", "certified", "gold", "silver", "bronze".
// ==========================================================================

import type {
  EvidenceGapEntry,
  EvidenceGapIntelligence,
  GapCategory,
  GapIntelligenceInput,
  GapReviewStatus,
  GapSeverity,
  GapSummary,
} from './types.js'

// --------------------------------------------------------------------------
// Deterministic severity mapping
// --------------------------------------------------------------------------

function mapSeverity(discoverySeverity: string): GapSeverity {
  const s = discoverySeverity.toLowerCase()
  if (s === 'critical' || s === 'blocking') return 'blocking'
  if (s === 'high') return 'high'
  if (s === 'moderate' || s === 'medium') return 'moderate'
  return 'low'
}

// --------------------------------------------------------------------------
// Deterministic category detection from gap description
// --------------------------------------------------------------------------

const CATEGORY_PATTERNS: ReadonlyArray<{ match: RegExp; category: GapCategory }> = [
  { match: /missing|not found|absent|no .* evidence|no .* document|lacks/i, category: 'missing_evidence' },
  { match: /weak|insufficient|low quality|thin|sparse|limited evidence/i, category: 'weak_evidence' },
  { match: /expired|outdated|old|stale|out of date|renew|recertif/i, category: 'expired_evidence' },
  { match: /inconsistent|contradict|conflict|mismatch|discrepan/i, category: 'inconsistent_evidence' },
  { match: /external|third.party|outside|vendor|independent|confirmation|verify externally/i, category: 'needs_external_confirmation' },
  { match: /review|assess|evaluate|inspect|human review|manual/i, category: 'needs_human_review' },
  { match: /metadata|label|tag|annotation|classif|index|search/i, category: 'insufficient_metadata' },
  { match: /governance|policy|compliance|regulation|sop|protocol|standard/i, category: 'governance_gap' },
  { match: /operational|process|workflow|pipeline|throughput|logistic/i, category: 'operational_gap' },
]

function categorizeGap(description: string, discoveryCategory: string): GapCategory {
  const text = `${discoveryCategory} ${description}`.toLowerCase()

  for (const pattern of CATEGORY_PATTERNS) {
    if (pattern.match.test(text)) return pattern.category
  }

  // Fallback based on discovery category
  const d = discoveryCategory.toLowerCase()
  if (d.includes('evidence') || d.includes('document')) return 'missing_evidence'
  if (d.includes('review')) return 'needs_human_review'
  if (d.includes('governance') || d.includes('compliance')) return 'governance_gap'

  return 'missing_evidence'
}

// --------------------------------------------------------------------------
// Blocking determination
// --------------------------------------------------------------------------

function isBlocking(severity: GapSeverity, category: GapCategory): boolean {
  if (severity === 'blocking') return true
  if (severity === 'high' && category !== 'insufficient_metadata') return true
  return false
}

// --------------------------------------------------------------------------
// Evidence needed suggestions
// --------------------------------------------------------------------------

function suggestEvidence(description: string, category: GapCategory): string[] {
  const suggestions: string[] = []
  const text = description.toLowerCase()

  switch (category) {
    case 'missing_evidence':
      suggestions.push('Upload relevant documentation (SOP, protocol, or study record)')
      if (text.includes('sop') || text.includes('protocol'))
        suggestions.push('Provide Standard Operating Procedure document')
      if (text.includes('calibration'))
        suggestions.push('Provide equipment calibration records')
      if (text.includes('training'))
        suggestions.push('Provide staff training records or certificates')
      if (suggestions.length === 1)
        suggestions.push('Submit any supporting institutional documentation')
      break

    case 'weak_evidence':
      suggestions.push('Provide additional corroborating documents from independent sources')
      suggestions.push('Cross-reference with public registries or external databases')
      break

    case 'expired_evidence':
      suggestions.push('Provide renewed or updated version of the document')
      suggestions.push('Submit current certification or accreditation')
      break

    case 'inconsistent_evidence':
      suggestions.push('Clarify discrepancy with supporting documentation')
      suggestions.push('Provide source document with version history')
      break

    case 'needs_external_confirmation':
      suggestions.push('Request third-party verification or audit report')
      suggestions.push('Submit reference letter or external validation')
      break

    case 'needs_human_review':
      suggestions.push('Assign to qualified reviewer for assessment')
      break

    case 'insufficient_metadata':
      suggestions.push('Add missing metadata fields (date, source, version)')
      break

    case 'governance_gap':
      suggestions.push('Provide governance policy or compliance documentation')
      suggestions.push('Submit audit trail or approval record')
      break

    case 'operational_gap':
      suggestions.push('Document operational workflow or process')
      suggestions.push('Provide throughput or performance metrics')
      break
  }

  return suggestions.slice(0, 3)
}

// --------------------------------------------------------------------------
// Recommendation generation
// --------------------------------------------------------------------------

function generateRecommendation(
  description: string,
  category: GapCategory,
  severity: GapSeverity,
  evidenceNeeded: string[],
): string {
  const prefix = severity === 'blocking' || severity === 'high'
    ? 'Priority action: '
    : 'Recommended: '

  const actions: Record<GapCategory, string> = {
    missing_evidence: `Upload missing evidence to address: ${description.slice(0, 80)}`,
    weak_evidence: `Strengthen evidence base: ${description.slice(0, 80)}`,
    expired_evidence: `Renew expired evidence: ${description.slice(0, 80)}`,
    inconsistent_evidence: `Resolve inconsistency: ${description.slice(0, 80)}`,
    needs_external_confirmation: `Seek external confirmation: ${description.slice(0, 80)}`,
    needs_human_review: `Assign for human review: ${description.slice(0, 80)}`,
    insufficient_metadata: `Improve metadata quality: ${description.slice(0, 80)}`,
    governance_gap: `Address governance gap: ${description.slice(0, 80)}`,
    operational_gap: `Resolve operational gap: ${description.slice(0, 80)}`,
  }

  return prefix + (actions[category] || `Address gap: ${description.slice(0, 80)}`)
}

// --------------------------------------------------------------------------
// Cross-reference gaps with capabilities
// --------------------------------------------------------------------------

function findAffectedCapabilities(
  gapDescription: string,
  capabilities: GapIntelligenceInput['capabilities'],
): string[] {
  if (!capabilities || capabilities.length === 0) return []

  const gapLower = gapDescription.toLowerCase()
  const affected: string[] = []

  for (const cap of capabilities) {
    // Match on capability name keywords or if the capability already references this gap
    const nameWords = cap.name.toLowerCase().split(/[\s_]+/).filter((w) => w.length > 2)
    const nameMatch = nameWords.some((word) => gapLower.includes(word))
    const gapMatch = cap.gaps.some((g) => g.toLowerCase().includes(gapLower.slice(0, 30)))

    if (nameMatch || gapMatch) {
      affected.push(cap.id)
    }
  }

  return affected.slice(0, 5)
}

function findAffectedAssets(
  affectedCapabilityIds: string[],
  capabilities: GapIntelligenceInput['capabilities'],
): string[] {
  if (!capabilities || capabilities.length === 0) return []

  const assets = new Set<string>()
  for (const cap of capabilities) {
    if (affectedCapabilityIds.includes(cap.id)) {
      for (const asset of cap.research_assets_enabled) {
        assets.add(asset)
      }
    }
  }

  return Array.from(assets).slice(0, 5)
}

// --------------------------------------------------------------------------
// Review status determination
// --------------------------------------------------------------------------

function determineReviewStatus(
  hasValidationNotes: boolean,
  severity: GapSeverity,
): GapReviewStatus {
  if (severity === 'blocking') return 'open'
  if (hasValidationNotes) return 'needs_review'
  if (severity === 'high') return 'open'
  if (severity === 'moderate') return 'needs_review'
  return 'deferred'
}

// --------------------------------------------------------------------------
// Summary builder
// --------------------------------------------------------------------------

function buildSummary(gaps: EvidenceGapEntry[]): GapSummary {
  return {
    total: gaps.length,
    blocking: gaps.filter((g) => g.blocking).length,
    high: gaps.filter((g) => g.severity === 'high' || g.severity === 'blocking').length,
    needs_review: gaps.filter((g) => g.review_status === 'needs_review' || g.review_status === 'open').length,
    resolved: gaps.filter((g) => g.review_status === 'resolved').length,
  }
}

// --------------------------------------------------------------------------
// EvidenceGapIntelligenceEngine
// --------------------------------------------------------------------------

export class EvidenceGapIntelligenceEngine {
  /**
   * Build canonical evidence gap intelligence from Discovery aggregate
   * and optional CapabilityIntelligence output.
   */
  build(input: GapIntelligenceInput): EvidenceGapIntelligence {
    const gaps = this.buildGaps(input)
    const summary = buildSummary(gaps)

    return {
      gaps,
      summary,
      generated_at: new Date().toISOString(),
    }
  }

  private buildGaps(input: GapIntelligenceInput): EvidenceGapEntry[] {
    const { discoveryGaps, capabilities, hasValidationNotes } = input
    const now = new Date().toISOString()

    return discoveryGaps.map((dg) => {
      const category = categorizeGap(dg.description, dg.category)
      const severity = mapSeverity(dg.severity)
      const blocking = isBlocking(severity, category)
      const evidence_needed = suggestEvidence(dg.description, category)
      const recommended_next_action = generateRecommendation(
        dg.description,
        category,
        severity,
        evidence_needed,
      )
      const affected_capabilities = findAffectedCapabilities(
        dg.description,
        capabilities,
      )
      const affected_research_assets = findAffectedAssets(
        affected_capabilities,
        capabilities,
      )
      const review_status = determineReviewStatus(
        hasValidationNotes ?? false,
        severity,
      )
      const id = this.stableId(dg.gapId, dg.description)

      return {
        id,
        title: dg.description.length > 100
          ? `${dg.description.slice(0, 97)}...`
          : dg.description,
        category,
        severity,
        blocking,
        affected_capabilities,
        affected_research_assets,
        evidence_needed,
        recommended_next_action,
        review_status,
        source_refs: [dg.gapId],
        last_updated: now,
      }
    })
  }

  private stableId(gapId: string, description: string): string {
    const slug = description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40)
    return `gap:${slug}_${gapId.slice(0, 8)}`
  }
}
