// ==========================================================================
// Kadarn Evidence Lineage — Claim Generation Engine
// ==========================================================================
// Sprint 28C. Phase 8.
//
// Separates Facts from Claims. Never creates Claims directly from documents.
// Pipeline: Fact → RuleEngine → ClaimCandidate → Claim.
// ==========================================================================

import type { NormalizedEntity } from './entity-resolution.js'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ClaimType =
  | 'biospecimen_collection' | 'regulatory_compliance' | 'clinical_experience'
  | 'laboratory_capability' | 'data_management' | 'logistics_capability'
  | 'imaging_capability' | 'biobanking' | 'research_output'

export interface ClaimCandidate {
  candidateId: string
  facts: string[]
  ruleId: string
  ruleVersion: string
  claimType: ClaimType
  statement: string
  entityId: string
  confidenceInputs: ConfidenceInput[]
  generatedAt: string
}

export interface ConfidenceInput {
  source: 'evidence_class' | 'recency' | 'diversity' | 'entity_trust' | 'counter_evidence'
  value: number
  weight: number
}

export interface ClaimDefinition {
  definitionId: string
  claimType: ClaimType
  schemaVersion: number
  label: string
  description: string
}

export interface Claim {
  claimId: string
  candidateId: string
  entityId: string
  claimType: ClaimType
  claimDefinitionId: string
  claimVersion: number
  statement: string
  status: 'proposed' | 'validated' | 'published' | 'disputed' | 'archived'
  facts: string[]
  confidenceInputs: ConfidenceInput[]
  generatedAt: string
  publishedAt?: string
  archivedAt?: string
}

// --------------------------------------------------------------------------
// Rule definition
// --------------------------------------------------------------------------

export interface GenerationRule {
  ruleId: string
  ruleVersion: string
  claimType: ClaimType
  /** Returns true if the given facts can generate a claim of this type */
  matches(facts: Array<{ factType: string; content: Record<string, unknown> }>): boolean
  /** Generate a claim statement from facts */
  generateStatement(facts: Array<{ factType: string; content: Record<string, unknown> }>, entity: NormalizedEntity): string
}

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

export class ClaimGenerationEngine {
  private readonly rules: GenerationRule[] = []
  private candidateCounter = 0
  private claimCounter = 0

  /** Register a generation rule. */
  registerRule(rule: GenerationRule): void {
    this.rules.push(rule)
  }

  /**
   * Generate claim candidates from facts for a resolved entity.
   * Facts → RuleEngine → ClaimCandidate
   */
  generateCandidates(
    facts: Array<{ factId: string; factType: string; content: Record<string, unknown> }>,
    entity: NormalizedEntity,
  ): ClaimCandidate[] {
    const candidates: ClaimCandidate[] = []

    for (const rule of this.rules) {
      if (rule.matches(facts)) {
        this.candidateCounter++
        candidates.push({
          candidateId: `cc:${this.candidateCounter}`,
          facts: facts.map(f => f.factId),
          ruleId: rule.ruleId,
          ruleVersion: rule.ruleVersion,
          claimType: rule.claimType,
          statement: rule.generateStatement(facts, entity),
          entityId: entity.entityId,
          confidenceInputs: this.defaultConfidenceInputs(facts),
          generatedAt: new Date().toISOString(),
        })
      }
    }

    return candidates
  }

  /**
   * Promote a candidate to a published Claim.
   * ClaimCandidate → Claim
   */
  promoteToClaim(candidate: ClaimCandidate, definitionId: string): Claim {
    this.claimCounter++
    return {
      claimId: `claim:${this.claimCounter}`,
      candidateId: candidate.candidateId,
      entityId: candidate.entityId,
      claimType: candidate.claimType,
      claimDefinitionId: definitionId,
      claimVersion: 1,
      statement: candidate.statement,
      status: 'proposed',
      facts: candidate.facts,
      confidenceInputs: candidate.confidenceInputs,
      generatedAt: candidate.generatedAt,
    }
  }

  // --------------------------------------------------------------------------
  // Default rules (can be extended)
  // --------------------------------------------------------------------------

  static defaultRules(): GenerationRule[] {
    return [
      {
        ruleId: 'rule:biospecimen',
        ruleVersion: '1.0.0',
        claimType: 'biospecimen_collection',
        matches: (facts) => facts.some(f => f.factType === 'asset' && this.isBiospecimen(f.content)),
        generateStatement: (facts, entity) => `${entity.canonicalName} has biospecimen collection capability.`,
      },
      {
        ruleId: 'rule:capability',
        ruleVersion: '1.0.0',
        claimType: 'laboratory_capability',
        matches: (facts) => facts.some(f => f.factType === 'capability'),
        generateStatement: (facts, entity) => {
          const cap = facts.find(f => f.factType === 'capability')
          return `${entity.canonicalName} provides ${cap?.content?.name ?? 'laboratory'} services.`
        },
      },
      {
        ruleId: 'rule:clinical_experience',
        ruleVersion: '1.0.0',
        claimType: 'clinical_experience',
        matches: (facts) => facts.some(f => f.factType === 'claim' && (f.content as any)?.type === 'demographic'),
        generateStatement: (_facts, entity) => `${entity.canonicalName} has demonstrated clinical research experience.`,
      },
    ]
  }

  private static isBiospecimen(content: Record<string, unknown>): boolean {
    const type = content.type as string | undefined
    return type === 'biospecimen' || type === 'cohort'
  }

  private defaultConfidenceInputs(facts: Array<{ factType: string }>): ConfidenceInput[] {
    return [
      { source: 'evidence_class', value: 0.6, weight: 0.3 },
      { source: 'diversity', value: Math.min(facts.length / 5, 1.0), weight: 0.3 },
      { source: 'recency', value: 0.8, weight: 0.2 },
      { source: 'entity_trust', value: 0.5, weight: 0.2 },
    ]
  }
}
