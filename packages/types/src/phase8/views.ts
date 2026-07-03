// ==========================================================================
// Phase 8 Contracts — Published Views (28D) & Evidence Pack (28F)
// ADR-030, ADR-031
// ==========================================================================

import type {
  ConfidenceLevel,
  EvidencePackVariant,
  IsoDateTime,
} from './common.js'
import type { ExplanationStep, ReconstructionVerification } from './reconstruction.js'
import type { CanonicalClaimViewModel } from './schema-evolution.js'
import type { ReviewEvent } from './lifecycle.js'
import type { IntegrationFreshness } from './integration.js'

export interface PublishedView {
  view_id: string
  view_version: string
  claim_instance_id: string
  claim_version_id: string
  org_id: string
  schema_version: string
  adapter_version: string
  canonical_view_version: string
  projection: CanonicalClaimViewModel
  confidence_level: ConfidenceLevel
  confidence_value: number
  confidence_computed_at: IsoDateTime
  freshness?: IntegrationFreshness
  published_at: IsoDateTime
  visibility_policy_ref: string
}

export interface EvidencePackSection {
  section_id: string
  title: string
  content: string | Record<string, unknown>
  refs?: Record<string, string>
}

export interface EvidencePack {
  pack_id: string
  claim_id: string
  variant: EvidencePackVariant
  generated_at: IsoDateTime
  schema_version: string
  adapter_version: string
  sections: EvidencePackSection[]
  explanation_steps: ExplanationStep[]
  review_history: ReviewEvent[]
  verification: ReconstructionVerification
  policies_applied: string[]
}

export interface EvidencePackSummary {
  pack_id: string
  claim_id: string
  variant: EvidencePackVariant
  summary: string
  confidence_level: ConfidenceLevel
  generated_at: IsoDateTime
}
