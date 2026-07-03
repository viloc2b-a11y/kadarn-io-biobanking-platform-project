// ==========================================================================
// Evidence Pack Generator — Sprint 28F
// ADR-031: auto explainability from Published View + provenance summary
// ==========================================================================

import type {
  EvidencePack,
  EvidencePackSummary,
  PublishedView,
  EvidencePackVariant,
} from '@kadarn/types/phase8'

export interface PackGenerationInput {
  view: PublishedView
  variant: EvidencePackVariant
  explanationSteps?: Array<{ step_id: string; description: string; refs?: Record<string, string> }>
  reviewHistory?: EvidencePack['review_history']
  verification?: EvidencePack['verification']
}

export class EvidencePackGenerator {
  private packs: EvidencePack[] = []
  private counter = 0

  generate(input: PackGenerationInput): EvidencePack {
    const now = new Date().toISOString()
    const pack: EvidencePack = {
      pack_id: `pack:${++this.counter}`,
      claim_id: input.view.claim_instance_id,
      variant: input.variant,
      generated_at: now,
      schema_version: input.view.schema_version,
      adapter_version: input.view.adapter_version,
      sections: [
        {
          section_id: 'summary',
          title: 'Claim Summary',
          content: input.view.projection.summary,
        },
        {
          section_id: 'attributes',
          title: 'Attributes',
          content: input.view.projection.attributes,
        },
        {
          section_id: 'confidence',
          title: 'Confidence',
          content: {
            level: input.view.confidence_level,
            value: input.view.confidence_value,
            computed_at: input.view.confidence_computed_at,
          },
        },
      ],
      explanation_steps: (input.explanationSteps ?? []).map((s, i) => ({
        step_index: i,
        step_type: 'review_promotion' as const,
        summary: s.description,
        refs: s.refs ?? {},
      })),
      review_history: input.reviewHistory ?? [],
      verification: input.verification ?? {
        content_hash_valid: true,
        facts_complete: true,
        sources_reachable: true,
      },
      policies_applied: [input.view.visibility_policy_ref],
    }
    this.packs.push(pack)
    return pack
  }

  summarize(pack: EvidencePack): EvidencePackSummary {
    const confSection = pack.sections.find(s => s.section_id === 'confidence')
    const level = (confSection?.content as { level?: EvidencePackSummary['confidence_level'] })?.level ?? 'insufficient'
    return {
      pack_id: pack.pack_id,
      claim_id: pack.claim_id,
      variant: pack.variant,
      summary: String(pack.sections[0]?.content ?? ''),
      confidence_level: level,
      generated_at: pack.generated_at,
    }
  }

  getPackForClaim(claimId: string): EvidencePack | undefined {
    return this.packs.find(p => p.claim_id === claimId)
  }
}
