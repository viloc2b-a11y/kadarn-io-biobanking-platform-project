// ==========================================================================
// Published View Engine — Sprint 28D
// ADR-030: sole product-facing projection authority
// ==========================================================================

import type { PublishedView, ConfidenceLevel } from '@kadarn/types/phase8'
import type { CanonicalClaimViewModel } from '@kadarn/types/phase8'

export type ViewAudience = 'canonical' | 'sponsor' | 'institution' | 'public'

export interface PublishInput {
  claimInstanceId: string
  claimVersionId: string
  orgId: string
  projection: CanonicalClaimViewModel
  confidenceLevel: ConfidenceLevel
  confidenceValue: number
  audience: ViewAudience
  visibilityPolicyRef: string
  adapterVersion?: string
}

export class PublishedViewEngine {
  private views: PublishedView[] = []
  private counter = 0

  publish(input: PublishInput): PublishedView {
    const now = new Date().toISOString()
    const filtered = filterProjection(input.projection, input.audience)
    const view: PublishedView = {
      view_id: `view:${++this.counter}`,
      view_version: '1.0.0',
      claim_instance_id: input.claimInstanceId,
      claim_version_id: input.claimVersionId,
      org_id: input.orgId,
      schema_version: input.projection.schema_version,
      adapter_version: input.adapterVersion ?? 'native:1.0.0',
      canonical_view_version: '1.0.0',
      projection: filtered,
      confidence_level: input.confidenceLevel,
      confidence_value: input.confidenceValue,
      confidence_computed_at: now,
      published_at: now,
      visibility_policy_ref: input.visibilityPolicyRef,
    }
    this.views.push(view)
    return view
  }

  getViewsForClaim(claimInstanceId: string): PublishedView[] {
    return this.views.filter(v => v.claim_instance_id === claimInstanceId)
  }

  getAll(): PublishedView[] {
    return [...this.views]
  }
}

function filterProjection(
  projection: CanonicalClaimViewModel,
  audience: ViewAudience,
): CanonicalClaimViewModel {
  if (audience === 'public') {
    const attrs = { ...projection.attributes }
    delete attrs.internal_notes
    delete attrs.private_contact
    return { ...projection, attributes: attrs }
  }
  if (audience === 'sponsor') {
    return projection
  }
  return projection
}

export function confidenceLevelFromScore(score: number): ConfidenceLevel {
  if (score >= 80) return 'high'
  if (score >= 60) return 'moderate'
  if (score >= 40) return 'low'
  return 'insufficient'
}
