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
    return {
      profile: {
        headline: bundle.profile.headline,
        summary: bundle.profile.summary,
        slug: bundle.profile.public_slug,
      },
      claims: views.map((view, i) => {
        const attrs = view.projection.attributes
        return {
          id: view.claim_instance_id,
          type: view.projection.claim_type_id,
          category: attrs.category,
          title: view.projection.summary,
          description: attrs.description,
          verification: attrs.verification,
          confidence: view.confidence_value,
        }
      }),
    }
  }
}
