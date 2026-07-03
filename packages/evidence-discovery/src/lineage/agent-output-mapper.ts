// ==========================================================================
// Agent output → Lineage extraction input (Sprint 28B)
// Maps Discovery agent JSON to EvidenceLineageEngine input — Facts only.
// ==========================================================================

export interface AgentEntityMention {
  line: number
  rule: string
}

export interface AgentEntity {
  id: string
  name: string
  type: string
  mentions: AgentEntityMention[]
  sectionId: string
}

export interface AgentRelationship {
  id: string
  type: string
  line: number
  sectionId: string
}

/** Provisional statements — become ExtractedFacts (factType: claim), not Claims */
export interface AgentClaimStatement {
  id: string
  statement: string
  type: string
  line: number
  sectionId: string
}

export interface AgentCapability {
  id: string
  name: string
  category: string
  line: number
  sectionId: string
}

export interface AgentAsset {
  id: string
  name: string
  type: string
  line: number
  sectionId: string
}

export interface AgentOutputMap {
  capability_detector?: { capabilities?: AgentCapability[] }
  claim_candidate_detector?: { candidates?: Array<{ id: string; proposedClaimTypeId?: string; reasoning?: string; line?: number }> }
  entity_extractor?: { entities?: AgentEntity[] }
  relationship_extractor?: { relationships?: AgentRelationship[] }
  evidence_gap_detector?: { reports?: unknown[] }
}

export interface LineageExtractionInput {
  entities: AgentEntity[]
  relationships: AgentRelationship[]
  claims: AgentClaimStatement[]
  capabilities: AgentCapability[]
  assets: AgentAsset[]
}

/**
 * Convert Discovery agent outputs to lineage extraction input.
 * Claim candidates from agents become factType `claim` — never direct Claims.
 */
export function agentOutputsToLineageExtraction(outputs: AgentOutputMap): LineageExtractionInput {
  const entities = outputs.entity_extractor?.entities ?? []
  const relationships = outputs.relationship_extractor?.relationships ?? []

  const capabilities = (outputs.capability_detector?.capabilities ?? []).map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    line: c.line ?? 0,
    sectionId: c.sectionId ?? 's0',
  }))

  const assets: AgentAsset[] = []

  const claims: AgentClaimStatement[] = (outputs.claim_candidate_detector?.candidates ?? []).map(c => ({
    id: c.id,
    statement: c.reasoning ?? c.id,
    type: c.proposedClaimTypeId ?? 'unknown',
    line: c.line ?? 0,
    sectionId: 's0',
  }))

  return { entities, relationships, claims, capabilities, assets }
}
