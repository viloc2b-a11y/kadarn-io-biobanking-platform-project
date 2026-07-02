// ==========================================================================
// Governance & Explainability — Engine (Sprint 23D)
// ==========================================================================
// Canonical explanation service. Read-only over canonical outputs.
// No new intelligence. No recomputation. No hidden reasoning.
// ==========================================================================

import type {
  EngineId,
  EngineVersion,
  ExplainabilityRecord,
  GovernanceDomain,
  GovernanceVersion,
} from './types.js'

// --------------------------------------------------------------------------
// Engine Registry
// --------------------------------------------------------------------------

const ENGINE_REGISTRY: EngineVersion[] = [
  {
    engine_id: 'connector_layer', engine_name: 'Connector Layer', version: '1.0.0',
    generated_at: null, input_dependencies: [], output_contract: 'ConnectorResponse',
  },
  {
    engine_id: 'identity_resolution', engine_name: 'Identity Resolution Engine', version: '1.0.0',
    generated_at: null, input_dependencies: ['connector_layer'], output_contract: 'CanonicalIdentity',
  },
  {
    engine_id: 'evidence_firewall', engine_name: 'Evidence Firewall', version: '1.0.0',
    generated_at: null, input_dependencies: ['connector_layer', 'identity_resolution'],
    output_contract: 'FirewallDecisionOutput',
  },
  {
    engine_id: 'discovery_pipeline', engine_name: 'Discovery Pipeline', version: '1.0.0',
    generated_at: null, input_dependencies: ['evidence_firewall'],
    output_contract: 'DiscoveryResult',
  },
  {
    engine_id: 'capability_intelligence', engine_name: 'Capability Intelligence Engine', version: '1.0.0',
    generated_at: null, input_dependencies: ['discovery_pipeline'],
    output_contract: 'CapabilityIntelligence',
  },
  {
    engine_id: 'gap_intelligence', engine_name: 'Evidence Gap Intelligence Engine', version: '1.0.0',
    generated_at: null, input_dependencies: ['discovery_pipeline', 'capability_intelligence'],
    output_contract: 'EvidenceGapIntelligence',
  },
  {
    engine_id: 'institutional_assessment', engine_name: 'Institutional Capability Assessment Engine', version: '1.0.0',
    generated_at: null, input_dependencies: ['capability_intelligence', 'gap_intelligence'],
    output_contract: 'InstitutionCapabilityAssessment',
  },
  {
    engine_id: 'sponsor_readiness', engine_name: 'Sponsor Readiness Engine', version: '1.0.0',
    generated_at: null, input_dependencies: ['institutional_assessment'],
    output_contract: 'SponsorReadiness',
  },
  {
    engine_id: 'recommendation_engine', engine_name: 'Recommendation Engine', version: '1.0.0',
    generated_at: null, input_dependencies: ['institutional_assessment', 'gap_intelligence', 'sponsor_readiness'],
    output_contract: 'RecommendationEngineOutput',
  },
  {
    engine_id: 'recognition_report', engine_name: 'Institution Recognition Report', version: '1.0.0',
    generated_at: null, input_dependencies: ['capability_intelligence', 'gap_intelligence', 'institutional_assessment', 'sponsor_readiness', 'recommendation_engine'],
    output_contract: 'InstitutionRecognitionReport',
  },
]

// --------------------------------------------------------------------------
// Governance Registry
// --------------------------------------------------------------------------

const GOVERNANCE_REGISTRY: GovernanceVersion[] = [
  {
    domain: 'capability_taxonomy', version: '1.0.0',
    effective_from: '2026-07-02', description: 'Initial capability taxonomy for biospecimen domain',
    rules: ['14 capability categories', '5 assessment statuses', '4 maturity levels'],
    supersedes: null,
  },
  {
    domain: 'research_asset_taxonomy', version: '1.0.0',
    effective_from: '2026-07-02', description: 'Research asset labels for biospecimen domain',
    rules: ['14 research asset labels', 'Deterministic capability-to-asset mapping'],
    supersedes: null,
  },
  {
    domain: 'recommendation_categories', version: '1.0.0',
    effective_from: '2026-07-02', description: 'Recommendation categories and priorities',
    rules: ['9 recommendation categories', '4 priority levels', '5 statuses'],
    supersedes: null,
  },
  {
    domain: 'identity_rules', version: '1.0.0',
    effective_from: '2026-07-02', description: 'Identity resolution rules',
    rules: ['5 identity states', 'No automatic merge under ambiguity'],
    supersedes: null,
  },
  {
    domain: 'firewall_rules', version: '1.0.0',
    effective_from: '2026-07-02', description: 'Evidence firewall validation rules',
    rules: ['6 validation rules', '5 decision states', 'No evidence mutation'],
    supersedes: null,
  },
  {
    domain: 'discovery_rules', version: '1.0.0',
    effective_from: '2026-07-02', description: 'Discovery pipeline rules',
    rules: ['Artifact ingestion', 'Layer 0/1 extraction', 'Agent pipeline'],
    supersedes: null,
  },
  {
    domain: 'assessment_rules', version: '1.0.0',
    effective_from: '2026-07-02', description: 'Institutional capability assessment rules',
    rules: ['5 assessment states', 'Deterministic status mapping', 'No confidence computation'],
    supersedes: null,
  },
]

const VERSION_HISTORY: GovernanceVersion[][] = [GOVERNANCE_REGISTRY.map((g) => ({ ...g }))]

// --------------------------------------------------------------------------
// Governance & Explainability Service
// --------------------------------------------------------------------------

export class GovernanceExplainabilityService {
  /**
   * Get all registered engine versions.
   */
  getEngineVersions(): EngineVersion[] {
    return ENGINE_REGISTRY.map((e) => ({ ...e }))
  }

  /**
   * Get engine by ID.
   */
  getEngine(engineId: EngineId): EngineVersion | undefined {
    return ENGINE_REGISTRY.find((e) => e.engine_id === engineId)
  }

  /**
   * Get engine lineage (dependency chain).
   */
  getEngineLineage(engineId: EngineId): EngineVersion[] {
    const lineage: EngineVersion[] = []
    const visited = new Set<EngineId>()

    const walk = (id: EngineId) => {
      if (visited.has(id)) return
      visited.add(id)
      const engine = this.getEngine(id)
      if (engine) {
        lineage.push(engine)
        for (const dep of engine.input_dependencies) walk(dep)
      }
    }

    walk(engineId)
    return lineage.reverse()
  }

  /**
   * Get current governance version for a domain.
   */
  getGovernanceVersion(domain: GovernanceDomain): GovernanceVersion | undefined {
    return GOVERNANCE_REGISTRY.find((g) => g.domain === domain)
  }

  /**
   * Get all governance versions.
   */
  getAllGovernanceVersions(): GovernanceVersion[] {
    return GOVERNANCE_REGISTRY.map((g) => ({ ...g }))
  }

  /**
   * Get immutable version history.
   */
  getVersionHistory(): GovernanceVersion[][] {
    return VERSION_HISTORY.map((snapshot) => snapshot.map((g) => ({ ...g })))
  }

  /**
   * Generate an explainability record for a capability.
   */
  explainCapability(
    capability: { name: string; status: string; category: string },
    supportingEvidence: string[],
    gaps: string[],
  ): ExplainabilityRecord {
    const now = new Date().toISOString()
    return {
      id: `explain:capability:${capability.name.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}`,
      subject: capability.name,
      subject_type: 'capability',
      generated_by: 'capability_intelligence',
      generated_at: now,
      engine_version: '1.0.0',
      input_sources: ['discovery_pipeline'],
      supporting_evidence: supportingEvidence,
      blocking_gaps: [],
      derived_from: [],
      explanation: `${capability.name} (${capability.category}) is assessed as ${capability.status}. This determination was made by the Capability Intelligence Engine v1.0.0 using ${supportingEvidence.length} pieces of supporting evidence from the Discovery Pipeline.`,
      metadata: { capability_category: capability.category, gaps_referenced: gaps.length },
    }
  }

  /**
   * Generate an explainability record for an assessment.
   */
  explainAssessment(
    entry: { capability_name: string; assessment_status: string; operational_maturity: string },
    evidenceCount: number,
    blockingCount: number,
  ): ExplainabilityRecord {
    const now = new Date().toISOString()
    return {
      id: `explain:assessment:${entry.capability_name.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}`,
      subject: entry.capability_name,
      subject_type: 'assessment',
      generated_by: 'institutional_assessment',
      generated_at: now,
      engine_version: '1.0.0',
      input_sources: ['capability_intelligence', 'gap_intelligence'],
      supporting_evidence: Array(evidenceCount).fill('').map((_, i) => `evidence-ref-${i + 1}`),
      blocking_gaps: Array(blockingCount).fill('').map((_, i) => `blocking-gap-${i + 1}`),
      derived_from: ['capability_intelligence', 'gap_intelligence'],
      explanation: `${entry.capability_name} is assessed as ${entry.assessment_status} at ${entry.operational_maturity} maturity. Determined by Institutional Capability Assessment Engine v1.0.0 using inputs from Capability Intelligence and Evidence Gap Intelligence.`,
      metadata: { blocking_gaps: blockingCount, maturity: entry.operational_maturity },
    }
  }

  /**
   * Generate an explainability record for a recommendation.
   */
  explainRecommendation(
    rec: { title: string; priority: string; reason: string },
    sourceEngine: string,
  ): ExplainabilityRecord {
    const now = new Date().toISOString()
    return {
      id: `explain:rec:${rec.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40)}`,
      subject: rec.title,
      subject_type: 'recommendation',
      generated_by: 'recommendation_engine',
      generated_at: now,
      engine_version: '1.0.0',
      input_sources: ['institutional_assessment', 'gap_intelligence', 'sponsor_readiness'],
      supporting_evidence: [],
      blocking_gaps: [],
      derived_from: [sourceEngine],
      explanation: `"${rec.title}" is a ${rec.priority} priority recommendation generated by the Recommendation Engine v1.0.0. Reason: ${rec.reason}.`,
      metadata: { priority: rec.priority, source_engine: sourceEngine },
    }
  }

  /**
   * Generate an explainability record for readiness.
   */
  explainReadiness(
    readiness: { readiness_label: string },
    strengths: string[],
    concerns: string[],
  ): ExplainabilityRecord {
    const now = new Date().toISOString()
    return {
      id: `explain:readiness`,
      subject: 'Sponsor Readiness',
      subject_type: 'readiness',
      generated_by: 'sponsor_readiness',
      generated_at: now,
      engine_version: '1.0.0',
      input_sources: ['institutional_assessment'],
      supporting_evidence: [],
      blocking_gaps: [],
      derived_from: ['institutional_assessment'],
      explanation: `Overall sponsor readiness is "${readiness.readiness_label}". This determination was made by the Sponsor Readiness Engine v1.0.0 based on institutional assessment data. Strengths identified: ${strengths.length}. Concerns identified: ${concerns.length}.`,
      metadata: { strengths_count: strengths.length, concerns_count: concerns.length },
    }
  }
}
