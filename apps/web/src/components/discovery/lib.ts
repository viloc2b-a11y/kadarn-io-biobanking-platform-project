// ==========================================================================
// Discovery Workbench — pure helpers (no React; unit-testable)
// ==========================================================================

/** Badge tone for a claim candidate state-machine state. Display only. */
export function candidateStateTone(state: string): 'default' | 'amber' | 'green' | 'red' {
  const normalized = state.trim().toUpperCase()
  if (['ACCEPTED', 'ENRICHED', 'CURATED'].includes(normalized)) return 'green'
  if (['REJECTED', 'ARCHIVED', 'FAILED'].includes(normalized)) return 'red'
  if (['DEFERRED', 'NEEDS_MORE_EVIDENCE', 'PENDING_REVIEW', 'PROPOSED', 'DETECTED'].includes(normalized)) return 'amber'
  return 'default'
}

/**
 * Render a discovery confidence value exactly as provided by the API.
 * Never derives, scales, or recalculates confidence — display only.
 */
export function formatDiscoveryConfidence(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim() !== '') return value
  return '—'
}

/** Human-readable label from SNAKE_CASE or snake_case identifiers. */
export function labelize(value: string): string {
  return value.replace(/_/g, ' ').trim()
}

export type EnrichmentParseResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string }

/** Parse an enrichment payload textarea into a plain JSON object. */
export function parseEnrichmentPayload(text: string): EnrichmentParseResult {
  const trimmed = text.trim()
  if (trimmed === '') return { ok: false, error: 'Enrichment payload is required for ENRICH.' }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { ok: false, error: 'Enrichment payload must be valid JSON.' }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'Enrichment payload must be a JSON object (key/value pairs).' }
  }
  return { ok: true, value: parsed as Record<string, unknown> }
}

/** Short excerpt for candidate content in list rows. */
export function excerpt(text: string, maxLength = 180): string {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (collapsed.length <= maxLength) return collapsed
  return `${collapsed.slice(0, maxLength - 1).trimEnd()}…`
}

// ==========================================================================
// Sponsor Readiness — pure categorical assessment (Task 4)
//
// This is presence/absence logic only. It never sums, averages, or otherwise
// arithmetically combines discovery_confidence / confidence values. It never
// produces a numeric score and never uses the word "verified".
// ==========================================================================

export type SponsorReadinessLabel =
  | 'presentation_ready'
  | 'needs_additional_evidence'
  | 'needs_human_review'
  | 'not_enough_evidence'

export interface SponsorReadinessInput {
  capabilityCount: number
  claimCount: number
  criticalGapCount: number
  totalGapCount: number
  hasNarrative: boolean
  hasCurationReview: boolean
}

export interface SponsorReadinessAssessment {
  label: SponsorReadinessLabel
}

/**
 * Categorical readiness assessment derived purely from presence/absence of
 * data — no arithmetic on confidence values, no numeric score.
 *
 * Rules (checked in order):
 * 1. Not enough source data at all (no capabilities and no claims) -> not_enough_evidence
 * 2. Any critical evidence gap present -> needs_additional_evidence
 * 3. No curation/review activity yet on the available capabilities/claims -> needs_human_review
 * 4. Otherwise -> presentation_ready
 */
export function assessSponsorReadiness(input: SponsorReadinessInput): SponsorReadinessAssessment {
  const { capabilityCount, claimCount, criticalGapCount, hasCurationReview } = input

  if (capabilityCount === 0 && claimCount === 0) {
    return { label: 'not_enough_evidence' }
  }

  if (criticalGapCount > 0) {
    return { label: 'needs_additional_evidence' }
  }

  if (!hasCurationReview) {
    return { label: 'needs_human_review' }
  }

  return { label: 'presentation_ready' }
}

// ==========================================================================
// Research Assets Enabled — deterministic capability-to-asset mapping (Sprint 21A)
//
// ⚠️  Sprint 21B: Canonical capability logic has moved to the
// CapabilityIntelligenceEngine in @kadarn/evidence-discovery.
//
// These functions remain as dashboard-side fallback shims.
// New consumers should use the CapabilityIntelligenceEngine output.
// The dashboard panel now accepts a `capabilityIntelligence` prop
// and uses the engine output when available.
//
// These are derived dashboard views, not Evidence Core entities.
// Do not create a Research Asset Graph or Engine from this mapping.
// Confidence display is passthrough only — never computed here.
// ==========================================================================

/** Allowed research asset labels as defined by Sprint 21A specification. */
export const RESEARCH_ASSET_LABELS = [
  'Plasma',
  'Serum',
  'Whole Blood',
  'PBMC',
  'FFPE Tissue',
  'Frozen Tissue',
  'Digital Slides',
  'Whole Slide Images',
  'Clinical Dataset',
  'Longitudinal Dataset',
  'Imaging Dataset',
  'Pathology Dataset',
  'Omics-ready Dataset',
  'AI-ready Dataset',
] as const

export type ResearchAssetLabel = (typeof RESEARCH_ASSET_LABELS)[number]

export type ResearchAssetStatus =
  | 'Enabled by current evidence'
  | 'Needs additional evidence'
  | 'Needs human review'
  | 'Not enough evidence yet'

export interface ResearchAssetEntry {
  asset: ResearchAssetLabel
  status: ResearchAssetStatus
  supportingCapabilities: string[]
  supportingClaims: string[]
  missingRequirements: string[]
  nextStep: string
}

/**
 * Deterministic capability-name → asset-label mapping.
 * Each key is a lowercase substring matched against capability names.
 * First match wins; order matters for overlapping terms.
 */
const CAPABILITY_TO_ASSET: ReadonlyArray<{ match: string; asset: ResearchAssetLabel }> = [
  { match: 'pbmc', asset: 'PBMC' },
  { match: 'ffpe', asset: 'FFPE Tissue' },
  { match: 'whole blood', asset: 'Whole Blood' },
  { match: 'whole_blood', asset: 'Whole Blood' },
  { match: 'serum', asset: 'Serum' },
  { match: 'plasma', asset: 'Plasma' },
  { match: 'frozen tissue', asset: 'Frozen Tissue' },
  { match: 'frozen_tissue', asset: 'Frozen Tissue' },
  { match: 'cryopreserved', asset: 'Frozen Tissue' },
  { match: 'whole slide', asset: 'Whole Slide Images' },
  { match: 'whole_slide', asset: 'Whole Slide Images' },
  { match: 'digital pathology', asset: 'Whole Slide Images' },
  { match: 'digital_pathology', asset: 'Whole Slide Images' },
  { match: 'scanner', asset: 'Whole Slide Images' },
  { match: 'digital slide', asset: 'Digital Slides' },
  { match: 'digital_slide', asset: 'Digital Slides' },
  { match: 'microscopy', asset: 'Digital Slides' },
  { match: 'longitudinal', asset: 'Longitudinal Dataset' },
  { match: 'follow-up', asset: 'Longitudinal Dataset' },
  { match: 'follow_up', asset: 'Longitudinal Dataset' },
  { match: 'edc', asset: 'Clinical Dataset' },
  { match: 'clinical data', asset: 'Clinical Dataset' },
  { match: 'clinical_data', asset: 'Clinical Dataset' },
  { match: 'clinical dataset', asset: 'Clinical Dataset' },
  { match: 'imaging', asset: 'Imaging Dataset' },
  { match: 'radiology', asset: 'Imaging Dataset' },
  { match: 'ai-ready', asset: 'AI-ready Dataset' },
  { match: 'ai_ready', asset: 'AI-ready Dataset' },
  { match: 'ai ready', asset: 'AI-ready Dataset' },
  { match: 'annotation', asset: 'AI-ready Dataset' },
  { match: 'metadata', asset: 'AI-ready Dataset' },
  { match: 'governance', asset: 'AI-ready Dataset' },
  { match: 'omics', asset: 'Omics-ready Dataset' },
  { match: 'sequencing', asset: 'Omics-ready Dataset' },
  { match: 'molecular', asset: 'Omics-ready Dataset' },
  { match: 'genomic', asset: 'Omics-ready Dataset' },
  { match: 'pathology', asset: 'Pathology Dataset' },
  { match: 'histology', asset: 'Pathology Dataset' },
]

/**
 * Map discovered capabilities to research asset labels using substring matching.
 * Returns one entry per asset label.
 */
export function mapCapabilitiesToResearchAssets(
  capabilities: Array<Record<string, unknown>>,
  claims: Array<Record<string, unknown>>,
  gaps: Array<Record<string, unknown>>,
): ResearchAssetEntry[] {
  const capabilityNames = capabilities.map((c) =>
    String(c.name ?? c.label ?? c.capabilityId ?? '').toLowerCase(),
  )
  const claimTexts = claims.map((c) =>
    String(c.content ?? c.text ?? c.summary ?? '').toLowerCase(),
  )
  const gapCategories = gaps.map((g) =>
    String(g.category ?? '').toLowerCase(),
  )
  const gapDescriptions = gaps.map((g) =>
    String(g.description ?? '').toLowerCase(),
  )

  // Build a map: asset → array of matched capability names
  const assetCapMap = new Map<ResearchAssetLabel, string[]>()
  for (const entry of CAPABILITY_TO_ASSET) {
    for (const capName of capabilityNames) {
      if (capName.includes(entry.match)) {
        const existing = assetCapMap.get(entry.asset) ?? []
        if (!existing.includes(capName)) {
          existing.push(capName)
        }
        assetCapMap.set(entry.asset, existing)
      }
    }
  }

  const results: ResearchAssetEntry[] = []
  for (const asset of RESEARCH_ASSET_LABELS) {
    const supportingCapabilities = assetCapMap.get(asset) ?? []
    const status = getResearchAssetStatus(
      asset,
      supportingCapabilities,
      claimTexts,
      gapCategories,
      gapDescriptions,
    )
    const supportingClaims = claimTexts.filter((t) =>
      t.includes(asset.toLowerCase()),
    )
    const missingRequirements = getMissingRequirements(asset, supportingCapabilities, gapDescriptions)
    const nextStep = getResearchAssetNextStep(status)

    results.push({
      asset,
      status,
      supportingCapabilities,
      supportingClaims: supportingClaims.length > 0 ? [asset] : [],
      missingRequirements,
      nextStep,
    })
  }

  return results
}

/**
 * Determine the status of a research asset based on capability presence,
 * supporting claims, and gaps. Pure presence/absence logic — no confidence
 * arithmetic, no "verified" language.
 */
export function getResearchAssetStatus(
  asset: ResearchAssetLabel,
  supportingCapabilities: string[],
  claimTexts: string[],
  gapCategories: string[],
  gapDescriptions: string[],
): ResearchAssetStatus {
  const hasCapability = supportingCapabilities.length > 0

  if (!hasCapability) {
    return 'Not enough evidence yet'
  }

  const assetLower = asset.toLowerCase()
  const hasSupportingClaim = claimTexts.some((t) => t.includes(assetLower))
  const hasRelevantGap =
    gapCategories.some((c) => c.includes(assetLower)) ||
    gapDescriptions.some((d) => d.includes(assetLower))

  if (!hasSupportingClaim && hasRelevantGap) {
    return 'Needs additional evidence'
  }

  if (!hasSupportingClaim && !hasRelevantGap) {
    return 'Needs human review'
  }

  return 'Enabled by current evidence'
}

/** Missing requirements derived from gaps that mention the asset. */
function getMissingRequirements(
  asset: ResearchAssetLabel,
  _supportingCapabilities: string[],
  gapDescriptions: string[],
): string[] {
  const assetLower = asset.toLowerCase()
  return gapDescriptions
    .filter((d) => d.includes(assetLower))
    .slice(0, 3)
}

/**
 * Recommended next step for an asset based on its status.
 * No promotion language — actionable, neutral guidance.
 */
export function getResearchAssetNextStep(status: ResearchAssetStatus): string {
  switch (status) {
    case 'Enabled by current evidence':
      return 'Review supporting evidence and consider adding to sponsor-facing summary.'
    case 'Needs additional evidence':
      return 'Upload or link evidence documents that address the identified gaps.'
    case 'Needs human review':
      return 'A reviewer should assess whether existing evidence supports this asset type.'
    case 'Not enough evidence yet':
      return 'Expand discovery scope or upload evidence demonstrating this asset type.'
    default:
      return 'Review the evidence profile for this asset type.'
  }
}
