// ==========================================================================
// Capability Intelligence Engine (Sprint 21B)
// ==========================================================================
//
// The canonical source of institutional capabilities across Kadarn.
//
// Every future module must consume this engine instead of implementing
// its own capability logic. The Dashboard becomes a consumer — never the owner.
//
// No AI reasoning. No confidence computation. No Evidence Core writes.
// No "verified", "certified", "gold", "silver", "bronze".
// ==========================================================================

import type {
  CapabilityCategory,
  CapabilityEntry,
  CapabilityIntelligence,
  CapabilityIntelligenceInput,
  CapabilityStatus,
  CapabilitySummary,
  ResearchAssetLabel,
} from './types.js'

// --------------------------------------------------------------------------
// Deterministic capability-name → category mapping
// Categories are organizational only — do not infer capabilities.
// --------------------------------------------------------------------------

const NAME_TO_CATEGORY: ReadonlyArray<{ match: RegExp; category: CapabilityCategory }> = [
  { match: /pbmc|plasma|serum|whole blood|ffpe|tissue|dna|rna|extraction|nucleic|processing|centrifuge/i, category: 'Biospecimen Processing' },
  { match: /freezer|storage|cryo|refrigerat|ln2|liquid nitrogen|nitrogen/i, category: 'Storage' },
  { match: /shipping|cold chain|dry ice|transport|logistic/i, category: 'Shipping' },
  { match: /phase i|study|trial|recruit|enroll|patient|subject/i, category: 'Clinical Operations' },
  { match: /edc|clinical data|data management|electronic/i, category: 'Clinical Data' },
  { match: /digital path|whole slide|scanner|microscop/i, category: 'Digital Pathology' },
  { match: /imaging|radiology|mri|ct scan|ultrasound/i, category: 'Imaging' },
  { match: /lab|assay|analyzer|calibrat/i, category: 'Laboratory' },
  { match: /gcp|fda|inspection|audit|sop|regulatory|compliance|training|certificate/i, category: 'Regulatory' },
  { match: /quality|qa|qc|iso/i, category: 'Quality' },
  { match: /infrastructure|facility|building|power|network/i, category: 'Infrastructure' },
  { match: /staff|personnel|investigator|coordinator/i, category: 'Personnel' },
  { match: /omics|sequencing|genomic|molecular|proteomic/i, category: 'Research Operations' },
  { match: /ai.ready|ai ready|annotation|metadata|governance|data.*ready/i, category: 'AI Readiness Foundations' },
]

function categorize(name: string): CapabilityCategory {
  const lower = name.toLowerCase()
  for (const entry of NAME_TO_CATEGORY) {
    if (entry.match.test(lower)) return entry.category
  }
  return 'Research Operations'
}

// --------------------------------------------------------------------------
// Deterministic capability-name → research-asset mapping
// (from Sprint 21A — reused, not duplicated)
// --------------------------------------------------------------------------

const CAPABILITY_TO_ASSET: ReadonlyArray<{ match: RegExp; asset: ResearchAssetLabel }> = [
  { match: /pbmc/i, asset: 'PBMC' },
  { match: /ffpe/i, asset: 'FFPE Tissue' },
  { match: /whole blood/i, asset: 'Whole Blood' },
  { match: /serum/i, asset: 'Serum' },
  { match: /plasma/i, asset: 'Plasma' },
  { match: /frozen tissue|cryopreserv/i, asset: 'Frozen Tissue' },
  { match: /whole slide|digital path|scanner|microscop/i, asset: 'Whole Slide Images' },
  { match: /digital slide/i, asset: 'Digital Slides' },
  { match: /longitudinal|follow.up/i, asset: 'Longitudinal Dataset' },
  { match: /edc|clinical data|clinical dataset/i, asset: 'Clinical Dataset' },
  { match: /imaging|radiology/i, asset: 'Imaging Dataset' },
  { match: /ai.ready|ai ready|annotation|metadata|governance/i, asset: 'AI-ready Dataset' },
  { match: /omics|sequencing|molecular|genomic/i, asset: 'Omics-ready Dataset' },
  { match: /pathology|histology/i, asset: 'Pathology Dataset' },
]

function mapToResearchAssets(name: string): ResearchAssetLabel[] {
  const lower = name.toLowerCase()
  const assets: ResearchAssetLabel[] = []
  for (const entry of CAPABILITY_TO_ASSET) {
    if (entry.match.test(lower) && !assets.includes(entry.asset)) {
      assets.push(entry.asset)
    }
  }
  return assets
}

// --------------------------------------------------------------------------
// Status determination — pure presence/absence logic
// --------------------------------------------------------------------------

function determineStatus(
  hasClaims: boolean,
  hasEvidence: boolean,
  hasGaps: boolean,
  wasDetected: boolean,
): CapabilityStatus {
  if (!wasDetected) return 'not_detected'

  if (hasClaims && hasEvidence && !hasGaps) return 'supported'

  if (hasClaims && hasEvidence && hasGaps) return 'partially_supported'

  if ((hasClaims || hasEvidence) && hasGaps) return 'needs_more_evidence'

  if (hasClaims || hasEvidence) return 'needs_human_review'

  return 'needs_more_evidence'
}

// --------------------------------------------------------------------------
// Recommendation generation — deterministic, based on status and context
// --------------------------------------------------------------------------

function generateRecommendation(
  status: CapabilityStatus,
  hasClaims: boolean,
  hasGaps: boolean,
  missingRequirements: string[],
): string {
  switch (status) {
    case 'supported':
      return 'No action needed — capability is well-supported by current evidence.'

    case 'partially_supported':
      return missingRequirements.length > 0
        ? `Address identified gaps: ${missingRequirements.slice(0, 2).join('; ')}.`
        : 'Upload additional evidence to address remaining gaps.'

    case 'needs_more_evidence':
      if (!hasClaims) return 'Upload or link evidence documents that demonstrate this capability.'
      if (hasGaps) return 'Upload evidence documents that address the identified gaps.'
      return 'Expand discovery scope to gather more evidence for this capability.'

    case 'needs_human_review':
      return 'A reviewer should assess whether existing evidence supports this capability.'

    case 'not_detected':
      return 'Expand discovery scope or upload evidence demonstrating this capability.'

    default:
      return 'Review the evidence profile for this capability.'
  }
}

// --------------------------------------------------------------------------
// Summary builder — pure aggregation
// --------------------------------------------------------------------------

function buildSummary(capabilities: CapabilityEntry[]): CapabilitySummary {
  return {
    total: capabilities.length,
    supported: capabilities.filter((c) => c.status === 'supported').length,
    partial: capabilities.filter((c) => c.status === 'partially_supported').length,
    needs_evidence: capabilities.filter((c) => c.status === 'needs_more_evidence').length,
    needs_review: capabilities.filter((c) => c.status === 'needs_human_review').length,
    not_detected: capabilities.filter((c) => c.status === 'not_detected').length,
  }
}

// --------------------------------------------------------------------------
// CapabilityIntelligenceEngine
// --------------------------------------------------------------------------

export class CapabilityIntelligenceEngine {
  /**
   * Build the canonical institutional capability intelligence from
   * existing Discovery aggregate data. No API calls. No DB writes.
   * Pure derivation.
   */
  build(input: CapabilityIntelligenceInput): CapabilityIntelligence {
    const capabilities = this.buildCapabilities(input)
    const summary = buildSummary(capabilities)

    return {
      capabilities,
      summary,
      generated_at: new Date().toISOString(),
    }
  }

  /**
   * Build the list of canonical capability entries from input.
   * Merges duplicates, aggregates evidence/claims/gaps,
   * assigns status, and generates recommendations.
   */
  private buildCapabilities(input: CapabilityIntelligenceInput): CapabilityEntry[] {
    const { candidateCapabilities, claimCandidates, gaps } = input
    const now = new Date().toISOString()

    // Step 1: Normalize & deduplicate by name
    const merged = this.mergeByName(candidateCapabilities)

    // Step 2: Build entries
    const entries: CapabilityEntry[] = []
    for (const [, cap] of merged) {
      const name = cap.name
      const id = this.stableId(name)
      const category = categorize(name)

      // Supporting evidence
      const supporting_evidence = Array.from(
        new Set([
          ...cap.supportingEntityIds,
          ...cap.supportingRelationshipIds,
          ...cap.supportingArtifactIds,
        ]),
      )

      // Supporting claims
      const supporting_claims = claimCandidates
        .filter((cc) => cc.proposedClaimTypeId === cap.claimTypeId)
        .map((cc) => cc.reasoning)
        .filter(Boolean)

      // Related gaps — match on key terms from the capability name, not full string
      const nameWords = name
        .toLowerCase()
        .split(/[\s_]+/)
        .filter((w) => w.length > 2) // skip short words like "of", "in", etc.
      const relatedGaps = gaps.filter((g) => {
        const gapText = `${g.category} ${g.description}`.toLowerCase()
        return nameWords.some((word) => gapText.includes(word))
      })
      const gapDescriptions = relatedGaps.map((g) => g.description)
      const missing_requirements = gapDescriptions.slice(0, 3)

      // Research assets
      const research_assets_enabled = mapToResearchAssets(name)

      // Status
      const hasClaims = supporting_claims.length > 0
      const hasEvidence = supporting_evidence.length > 0
      const hasGaps = relatedGaps.length > 0
      const status = determineStatus(hasClaims, hasEvidence, hasGaps, true)

      // Recommendation
      const recommended_next_step = generateRecommendation(
        status,
        hasClaims,
        hasGaps,
        missing_requirements,
      )

      // Summary
      const summary = this.buildCapabilitySummary(
        name,
        status,
        supporting_claims.length,
        supporting_evidence.length,
        research_assets_enabled,
        relatedGaps.length,
      )

      entries.push({
        id,
        name,
        category,
        status,
        summary,
        supporting_claims,
        supporting_evidence,
        research_assets_enabled,
        missing_requirements,
        gaps: gapDescriptions,
        recommended_next_step,
        last_updated: now,
      })
    }

    // Step 3: Add not_detected capabilities for key research assets
    // that have no matching capability detected
    this.addUndetectedAssets(entries)

    return entries
  }

  /**
   * Merge candidate capabilities by name.
   * Deduplicates and aggregates evidence IDs.
   */
  private mergeByName(
    candidates: CapabilityIntelligenceInput['candidateCapabilities'],
  ): Map<string, CapabilityIntelligenceInput['candidateCapabilities'][number]> {
    const merged = new Map<string, CapabilityIntelligenceInput['candidateCapabilities'][number]>()

    for (const cap of candidates) {
      const key = cap.name.toLowerCase()
      const existing = merged.get(key)
      if (existing) {
        merged.set(key, {
          ...existing,
          supportingEntityIds: Array.from(
            new Set([...existing.supportingEntityIds, ...cap.supportingEntityIds]),
          ),
          supportingRelationshipIds: Array.from(
            new Set([...existing.supportingRelationshipIds, ...cap.supportingRelationshipIds]),
          ),
          supportingArtifactIds: Array.from(
            new Set([...existing.supportingArtifactIds, ...cap.supportingArtifactIds]),
          ),
          reasoning: `${existing.reasoning}; ${cap.reasoning}`,
        })
      } else {
        merged.set(key, { ...cap })
      }
    }

    return merged
  }

  /**
   * Generate a stable capability ID from a name.
   */
  private stableId(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
    return `capability:${slug}`
  }

  /**
   * Build a human-readable summary for a capability entry.
   */
  private buildCapabilitySummary(
    name: string,
    status: CapabilityStatus,
    claimCount: number,
    evidenceCount: number,
    assets: ResearchAssetLabel[],
    gapCount: number,
  ): string {
    const statusMap: Record<CapabilityStatus, string> = {
      supported: 'Supported by evidence',
      partially_supported: 'Partially supported — some gaps remain',
      needs_more_evidence: 'Needs more evidence',
      needs_human_review: 'Awaiting human review',
      not_detected: 'Not detected in current evidence',
    }

    const parts: string[] = [statusMap[status]]

    if (claimCount > 0) parts.push(`${claimCount} supporting claim(s)`)
    if (evidenceCount > 0) parts.push(`${evidenceCount} evidence reference(s)`)
    if (gapCount > 0) parts.push(`${gapCount} gap(s) identified`)
    if (assets.length > 0) parts.push(`Enables: ${assets.join(', ')}`)

    return `${name}: ${parts.join('. ')}.`
  }

  /**
   * Add entries for research assets with no detected capability.
   * These appear as "not_detected" in the output.
   */
  private addUndetectedAssets(entries: CapabilityEntry[]): void {
    const detectedAssets = new Set<ResearchAssetLabel>()
    for (const entry of entries) {
      for (const asset of entry.research_assets_enabled) {
        detectedAssets.add(asset)
      }
    }

    const now = new Date().toISOString()
    for (const asset of ResearchAssetLabels) {
      if (!detectedAssets.has(asset)) {
        entries.push({
          id: this.stableId(`undetected_${asset}`),
          name: asset,
          category: this.assetCategory(asset),
          status: 'not_detected',
          summary: `${asset}: Not detected in current evidence.`,
          supporting_claims: [],
          supporting_evidence: [],
          research_assets_enabled: [],
          missing_requirements: [],
          gaps: [],
          recommended_next_step:
            'Expand discovery scope or upload evidence demonstrating this asset type.',
          last_updated: now,
        })
      }
    }
  }

  /**
   * Assign a category to an undetected research asset.
   */
  private assetCategory(asset: ResearchAssetLabel): CapabilityCategory {
    if (
      ['Plasma', 'Serum', 'Whole Blood', 'PBMC', 'FFPE Tissue', 'Frozen Tissue'].includes(
        asset,
      )
    ) {
      return 'Biospecimen Processing'
    }
    if (['Digital Slides', 'Whole Slide Images'].includes(asset)) {
      return 'Digital Pathology'
    }
    if (['Imaging Dataset'].includes(asset)) {
      return 'Imaging'
    }
    if (['Clinical Dataset', 'Longitudinal Dataset'].includes(asset)) {
      return 'Clinical Data'
    }
    if (['Pathology Dataset'].includes(asset)) {
      return 'Digital Pathology'
    }
    if (['Omics-ready Dataset'].includes(asset)) {
      return 'Research Operations'
    }
    if (['AI-ready Dataset'].includes(asset)) {
      return 'AI Readiness Foundations'
    }
    return 'Research Operations'
  }
}

// Re-export labels for convenience
const ResearchAssetLabels = [
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
] as ResearchAssetLabel[]
