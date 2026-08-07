// ==========================================================================
// Compatibility Layer — Legacy Read Adapter (Sprint 28D)
// Read-only bridge: continuity_experience_claims → PublishedView
// Consumers cannot distinguish legacy vs native source.
// ==========================================================================

import type { PublishedView } from '@kadarn/types/phase8'
import { PublishedViewEngine, confidenceLevelFromScore, type ViewAudience } from './engine'

export const LEGACY_ADAPTER_VERSION = 'legacy-read:1.0.0'

export interface LegacyContinuityClaim {
  id: string
  claim_type: string
  category: string
  title: string
  description: string
  therapeutic_area?: string | null
  study_phase?: string | null
  biospecimen_type?: string | null
  quantity?: number | null
  verification_status: string
  confidence_score: number | null
  sponsor_name_policy?: string | null
  masked_sponsor_label?: string | null
  /** dashboard-next-best-action CRITICAL #1 fix — freshness signal for confidenceExplanation. */
  updated_at?: string | null
  /** Nested join (continuity_evidence_items) — used only to build a factual,
   * non-evaluative supporting/contradicting evidence count. Never rendered
   * as a standalone score. */
  continuity_evidence_items?: Array<{ verification_status?: string | null }>
  /** Nested join (continuity_references) — same purpose as above. */
  continuity_references?: Array<{ status?: string | null }>
}

export interface LegacyContinuityProfile {
  id: string
  organization_id: string
  headline?: string | null
  summary?: string | null
  public_slug?: string | null
}

export interface LegacyPassportBundle {
  profile: LegacyContinuityProfile
  claims: LegacyContinuityClaim[]
}

function verificationLabel(status: string): string {
  if (status === 'kadarn_verified') return 'Externally confirmed'
  if (status === 'reference_confirmed') return 'Reference confirmed'
  if (status === 'evidence_submitted') return 'Supported by evidence'
  return 'Self reported'
}

// ─── dashboard-next-best-action CRITICAL #1 fix ─────────────────────────
// Site Passport previously rendered a bare `Confidence {n}/100` with no
// explanation (verify-report id 1010). `confidence_level` (High/Moderate/
// Low/Insufficient, see engine.ts `confidenceLevelFromScore`) was already
// computed onto every PublishedView but silently dropped by
// `toLegacyPassportResponse`. These helpers surface it, always paired with
// a factual, evidence-grounded explanation — never a bare label or a bare
// number (spec id 980, "Bare label is invalid").
//
// `continuity_experience_claims` has no evidence-relationship typing of its
// own (unlike evidence-core's `claim_evidence_links` — SUPPORTS/
// PARTIALLY_SUPPORTS/CONTRADICTS), so this counts real, already-linked
// `continuity_evidence_items`/`continuity_references` rows by their own
// review status (migration 043) rather than inventing a relationship type
// that doesn't exist on this legacy schema.

function capitalizeLevel(level: string): string {
  return level.length === 0 ? level : level.charAt(0).toUpperCase() + level.slice(1)
}

interface EvidenceCounts {
  supportingEvidenceCount: number
  contradictingEvidenceCount: number
}

function countEvidence(claim?: LegacyContinuityClaim): EvidenceCounts {
  const items = claim?.continuity_evidence_items ?? []
  const refs = claim?.continuity_references ?? []
  const supportingEvidenceCount =
    items.filter((item) => item.verification_status !== 'rejected').length +
    refs.filter((ref) => ref.status === 'confirmed').length
  const contradictingEvidenceCount =
    items.filter((item) => item.verification_status === 'rejected').length +
    refs.filter((ref) => ref.status === 'declined').length
  return { supportingEvidenceCount, contradictingEvidenceCount }
}

function buildConfidenceExplanation(claim: LegacyContinuityClaim | undefined, provenance: string): string {
  const { supportingEvidenceCount, contradictingEvidenceCount } = countEvidence(claim)
  const parts: string[] = [provenance]
  parts.push(
    supportingEvidenceCount > 0
      ? `${supportingEvidenceCount} supporting evidence item${supportingEvidenceCount === 1 ? '' : 's'} on file`
      : 'no supporting evidence items on file',
  )
  if (contradictingEvidenceCount > 0) {
    parts.push(
      `${contradictingEvidenceCount} contradicting item${contradictingEvidenceCount === 1 ? '' : 's'} flagged`,
    )
  }
  if (claim?.updated_at) {
    parts.push(`last updated ${claim.updated_at}`)
  }
  return parts.join('; ')
}

export class LegacyReadAdapter {
  constructor(private readonly engine = new PublishedViewEngine()) {}

  /** Map legacy passport data to Published Views (one view per claim). */
  adaptPassport(bundle: LegacyPassportBundle, audience: ViewAudience = 'public'): PublishedView[] {
    const orgId = bundle.profile.organization_id
    return bundle.claims.map(claim => this.adaptClaim(claim, orgId, audience))
  }

  adaptClaim(
    claim: LegacyContinuityClaim,
    orgId: string,
    audience: ViewAudience = 'public',
  ): PublishedView {
    const score = claim.confidence_score ?? 0
    return this.engine.publish({
      claimInstanceId: claim.id,
      claimVersionId: `legacy-v1:${claim.id}`,
      orgId,
      confidenceLevel: confidenceLevelFromScore(score),
      confidenceValue: score,
      audience,
      visibilityPolicyRef: 'legacy:continuity_experience_claims',
      adapterVersion: LEGACY_ADAPTER_VERSION,
      projection: {
        claim_type_id: claim.claim_type,
        claim_instance_id: claim.id,
        claim_version_id: `legacy-v1:${claim.id}`,
        schema_version: 'legacy:continuity:1.0.0',
        subject_entity_id: orgId,
        summary: claim.title,
        attributes: {
          category: claim.category,
          description: claim.description,
          therapeutic_area: claim.therapeutic_area ?? null,
          study_phase: claim.study_phase ?? null,
          biospecimen_type: claim.biospecimen_type ?? null,
          quantity: claim.quantity ?? null,
          verification: verificationLabel(claim.verification_status),
          verification_status: claim.verification_status,
          sponsor_name_policy: claim.sponsor_name_policy ?? null,
          masked_sponsor_label: claim.masked_sponsor_label ?? null,
        },
        evidence_refs: [],
        lifecycle_state: claim.verification_status,
        adapter_version: LEGACY_ADAPTER_VERSION,
      },
    })
  }

  /** Legacy JSON shape for backward-compatible API responses during transition */
  toLegacyPassportResponse(bundle: LegacyPassportBundle, views: PublishedView[]) {
    const claimsById = new Map(bundle.claims.map((claim) => [claim.id, claim]))
    return {
      profile: {
        headline: bundle.profile.headline,
        summary: bundle.profile.summary,
        slug: bundle.profile.public_slug,
      },
      claims: views.map((view) => {
        const attrs = view.projection.attributes
        const sourceClaim = claimsById.get(view.claim_instance_id)
        return {
          id: view.claim_instance_id,
          type: view.projection.claim_type_id,
          category: attrs.category,
          title: view.projection.summary,
          description: attrs.description,
          verification: attrs.verification,
          // Legacy shape — untouched (tests/phase8/legacy-equivalence/
          // passport.equivalence.test.ts depends on this exact number).
          confidence: view.confidence_value,
          // CRITICAL #1 fix (verify-report id 1010) — additive. Consumers
          // MUST render these two together; never confidence/confidenceLevel
          // alone as a bare label/number (spec id 980).
          confidenceLevel: capitalizeLevel(view.confidence_level),
          confidenceExplanation: buildConfidenceExplanation(sourceClaim, attrs.verification as string),
        }
      }),
    }
  }
}
