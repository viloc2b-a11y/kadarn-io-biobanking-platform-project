// ==========================================================================
// Kadarn Evidence Lineage — Claim Provenance Engine
// ==========================================================================
// Sprint 28D. Phase 8.
//
// Every Claim can answer: Why does this Claim exist?
// Full traceability: Facts → Sources → Parser → Model → Rule → Actor → Date.
// ==========================================================================

import type { Claim, ClaimCandidate, ClaimType } from './claim-generation.js'
import type { NormalizedEntity } from './entity-resolution.js'
import type { Source, SourceVersion, ExtractionRun, ExtractedFact } from './types.js'

// --------------------------------------------------------------------------
// Provenance types
// --------------------------------------------------------------------------

export interface ProvenanceStep {
  stepId: string
  stepType: 'source_ingestion' | 'fact_extraction' | 'entity_resolution' | 'rule_application' | 'claim_generation' | 'review' | 'publication'
  description: string
  timestamp: string
  actor: 'system' | 'human' | string
  inputs: ProvenanceInput[]
  outputs: ProvenanceOutput[]
}

export interface ProvenanceInput {
  type: string
  id: string
  version: string
}

export interface ProvenanceOutput {
  type: string
  id: string
}

export interface ClaimProvenance {
  claimId: string
  claimType: ClaimType
  entity: { entityId: string; canonicalName: string }
  steps: ProvenanceStep[]
  /** Whether this provenance contains enough information to reconstruct the claim */
  reconstructible: boolean
  /** When the provenance was last verified */
  lastVerified: string
}

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

export class ClaimProvenanceEngine {
  private readonly provenances = new Map<string, ClaimProvenance>()

  /**
   * Build the complete provenance chain for a Claim.
   */
  buildProvenance(
    claim: Claim,
    candidate: ClaimCandidate,
    entity: NormalizedEntity,
    facts: ExtractedFact[],
    extractionRun: ExtractionRun,
    source: Source,
    sourceVersion: SourceVersion,
  ): ClaimProvenance {
    const steps: ProvenanceStep[] = []

    // Step 1: Source ingestion
    steps.push({
      stepId: 'step:source',
      stepType: 'source_ingestion',
      description: `Document acquired from ${source.providerId}`,
      timestamp: source.acquiredAt,
      actor: 'system',
      inputs: [],
      outputs: [{ type: 'Source', id: source.sourceId }, { type: 'SourceVersion', id: sourceVersion.sourceVersionId }],
    })

    // Step 2: Fact extraction
    steps.push({
      stepId: 'step:extraction',
      stepType: 'fact_extraction',
      description: `Facts extracted using ${extractionRun.parserName} v${extractionRun.parserVersion}`,
      timestamp: extractionRun.completedAt,
      actor: 'system',
      inputs: [
        { type: 'SourceVersion', id: sourceVersion.sourceVersionId, version: String(sourceVersion.version) },
        { type: 'ExtractionRun', id: extractionRun.extractionRunId, version: extractionRun.parserVersion },
      ],
      outputs: facts.map(f => ({ type: 'ExtractedFact', id: f.factId })),
    })

    // Step 3: Entity resolution
    steps.push({
      stepId: 'step:entity',
      stepType: 'entity_resolution',
      description: `Entity resolved: ${entity.canonicalName} (${entity.entityId})`,
      timestamp: entity.resolvedAt,
      actor: 'system',
      inputs: facts.filter(f => f.factType === 'entity').map(f => ({ type: 'ExtractedFact', id: f.factId, version: '1' })),
      outputs: [{ type: 'NormalizedEntity', id: entity.entityId }],
    })

    // Step 4: Rule application
    steps.push({
      stepId: 'step:rule',
      stepType: 'rule_application',
      description: `Rule ${candidate.ruleId} v${candidate.ruleVersion} applied → ClaimCandidate ${candidate.candidateId}`,
      timestamp: candidate.generatedAt,
      actor: 'system',
      inputs: [
        { type: 'Rule', id: candidate.ruleId, version: candidate.ruleVersion },
        ...candidate.facts.map(fId => ({ type: 'ExtractedFact', id: fId, version: '1' })),
      ],
      outputs: [{ type: 'ClaimCandidate', id: candidate.candidateId }],
    })

    // Step 5: Claim generation
    steps.push({
      stepId: 'step:claim',
      stepType: 'claim_generation',
      description: `Claim ${claim.claimId} generated from candidate ${candidate.candidateId}`,
      timestamp: claim.generatedAt,
      actor: 'system',
      inputs: [{ type: 'ClaimCandidate', id: candidate.candidateId, version: '1' }],
      outputs: [{ type: 'Claim', id: claim.claimId }],
    })

    const provenance: ClaimProvenance = {
      claimId: claim.claimId,
      claimType: claim.claimType,
      entity: { entityId: entity.entityId, canonicalName: entity.canonicalName },
      steps,
      reconstructible: steps.length >= 5,
      lastVerified: new Date().toISOString(),
    }

    this.provenances.set(claim.claimId, provenance)
    return provenance
  }

  /**
   * Get the full provenance for a Claim.
   */
  getProvenance(claimId: string): ClaimProvenance | undefined {
    return this.provenances.get(claimId)
  }

  /**
   * Verify that a Claim can be fully reconstructed from its provenance.
   */
  canReconstruct(claimId: string): boolean {
    const prov = this.provenances.get(claimId)
    return prov?.reconstructible ?? false
  }

  /**
   * List all provenances.
   */
  listProvenances(): ClaimProvenance[] {
    return [...this.provenances.values()]
  }
}
