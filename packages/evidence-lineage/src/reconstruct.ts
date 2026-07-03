// ==========================================================================
// RECONSTRUCT service — KEMS-004 §7 (Sprint 28E)
// ==========================================================================

import type { ClaimProvenance } from './claim-provenance.js'
import { ClaimProvenanceEngine } from './claim-provenance.js'
import type { Claim, ClaimCandidate } from './claim-generation.js'
import type { NormalizedEntity } from './entity-resolution.js'
import type { ExtractedFact, ExtractionRun, Source, SourceVersion } from './types.js'

export interface ReconstructResult {
  claimId: string
  reconstructible: boolean
  provenance: ClaimProvenance | undefined
  errors: string[]
}

export class ReconstructService {
  constructor(private readonly provenanceEngine = new ClaimProvenanceEngine()) {}

  reconstruct(
    claimId: string,
    claim: Claim,
    candidate: ClaimCandidate,
    entity: NormalizedEntity,
    facts: ExtractedFact[],
    run: ExtractionRun,
    source: Source,
    sourceVersion: SourceVersion,
  ): ReconstructResult {
    const errors: string[] = []
    if (!facts.length) errors.push('ERR_FACT_MISSING')
    if (!run.extractionRunId) errors.push('ERR_EXTRACTION_RUN_MISSING')

    const provenance = this.provenanceEngine.buildProvenance(
      claim, candidate, entity, facts, run, source, sourceVersion,
    )

    if (!provenance.reconstructible) {
      errors.push('ERR_PROVENANCE_MISSING')
    }

    return {
      claimId,
      reconstructible: provenance.reconstructible && errors.length === 0,
      provenance,
      errors,
    }
  }

  getProvenance(claimId: string): ClaimProvenance | undefined {
    return this.provenanceEngine.getProvenance(claimId)
  }
}
