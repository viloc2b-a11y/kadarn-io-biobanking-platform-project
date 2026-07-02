// ==========================================================================
// Governance & Explainability — Types (Sprint 23D)
// ==========================================================================

export type EngineId =
  | 'connector_layer'
  | 'identity_resolution'
  | 'evidence_firewall'
  | 'discovery_pipeline'
  | 'capability_intelligence'
  | 'gap_intelligence'
  | 'institutional_assessment'
  | 'sponsor_readiness'
  | 'recommendation_engine'
  | 'recognition_report'

export type GovernanceDomain =
  | 'capability_taxonomy'
  | 'research_asset_taxonomy'
  | 'recommendation_categories'
  | 'identity_rules'
  | 'firewall_rules'
  | 'discovery_rules'
  | 'assessment_rules'

export interface EngineVersion {
  engine_id: EngineId
  engine_name: string
  version: string
  generated_at: string | null
  input_dependencies: EngineId[]
  output_contract: string
}

export interface GovernanceVersion {
  domain: GovernanceDomain
  version: string
  effective_from: string
  description: string
  rules: string[]
  supersedes: string | null
}

export interface ExplainabilityRecord {
  id: string
  subject: string
  subject_type: 'capability' | 'research_asset' | 'gap' | 'assessment' | 'readiness' | 'recommendation' | 'report'
  generated_by: EngineId
  generated_at: string
  engine_version: string
  input_sources: string[]
  supporting_evidence: string[]
  blocking_gaps: string[]
  derived_from: string[]
  explanation: string
  metadata: Record<string, unknown>
}
