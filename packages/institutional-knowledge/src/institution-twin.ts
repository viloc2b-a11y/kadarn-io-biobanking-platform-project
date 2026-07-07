// ==========================================================================
// Sprint A7 — Institution Digital Twin
// ==========================================================================
// Ensambla todas las capas en una representación canónica de la institución.
// No crea modelos nuevos — agrega los 12 dominios, 6 capas de inteligencia,
// y todos los explorers en un solo twin.
// ==========================================================================

import type { PersonProfile, PeopleDashboardState } from './people-intelligence'
import type { LabProfile, LabDashboardState } from './lab-intelligence'
import type { DocumentIntelligence, DocumentDashboardState } from './document-intelligence'
import type { RelationshipGraph, GraphHealthReport } from './relationship-graph'
import type {
  KnowledgeExplorerState, KnowledgeCoverage,
  TimelineExplorerState, SearchIndex,
} from './knowledge-explorer'
import type {
  NextBestAction, ProgressPath, CompletionRoadmap,
  InstitutionGrowthPath,
} from './guided-acquisition'
import type { TherapeuticAreaKey, CapabilityTypeKey, ProgramTypeKey } from './taxonomy'

// ==========================================================================
// INSTITUTION DIGITAL TWIN — Core
// ==========================================================================

export interface InstitutionDigitalTwin {
  twinId: string
  institutionId: string
  assembledAt: string
  version: string

  // Identity
  identity: InstitutionIdentity

  // Domain snapshots (all 12 domains aggregated)
  domains: DomainSnapshots

  // Intelligence layers (6 layers)
  intelligence: IntelligenceLayers

  // Cross-domain maps (derived relationships across domains)
  crossDomain: CrossDomainMaps

  // Derived institutional profile
  profile: InstitutionalProfile

  // Explorers (7 explorers)
  explorers: TwinExplorers

  // Guidance
  guidance: TwinGuidance

  // Health
  health: TwinHealth
}

// ==========================================================================
// IDENTITY
// ==========================================================================

export interface InstitutionIdentity {
  name: string
  organizationType: string
  foundedYear: number | null
  mission: string | null
  website: string | null
  primaryLocation: string | null
  timezone: string | null
  languages: string[]
  joinedKadarnAt: string | null
}

// ==========================================================================
// DOMAIN SNAPSHOTS
// ==========================================================================

export interface DomainSnapshots {
  organization: { itemCount: number; documentedCount: number; completeness: number }
  people: { itemCount: number; documentedCount: number; completeness: number }
  organizationStructure: { itemCount: number; documentedCount: number; completeness: number }
  facilities: { itemCount: number; documentedCount: number; completeness: number }
  equipment: { itemCount: number; documentedCount: number; completeness: number }
  laboratory: { itemCount: number; documentedCount: number; completeness: number }
  biospecimen: { itemCount: number; documentedCount: number; completeness: number }
  researchCapability: { itemCount: number; documentedCount: number; completeness: number }
  researchExperience: { itemCount: number; documentedCount: number; completeness: number }
  programCatalog: { itemCount: number; documentedCount: number; completeness: number }
  quality: { itemCount: number; documentedCount: number; completeness: number }
  regulatory: { itemCount: number; documentedCount: number; completeness: number }
}

// ==========================================================================
// INTELLIGENCE LAYERS
// ==========================================================================

export interface IntelligenceLayers {
  people: PeopleDashboardState | null
  laboratory: LabDashboardState | null
  document: DocumentDashboardState | null
  relationshipGraph: RelationshipGraph | null
  knowledgeCoverage: KnowledgeCoverage | null
  growthPath: InstitutionGrowthPath | null
}

// ==========================================================================
// CROSS-DOMAIN MAPS (derived — never stored)
// ==========================================================================

export interface CrossDomainMaps {
  /** Capability → Equipment that supports it */
  capabilityToEquipment: Record<string, string[]>
  /** Person → Capabilities they provide */
  personToCapability: Record<string, string[]>
  /** Facility → Programs that can be executed there */
  facilityToProgram: Record<string, string[]>
  /** Document → Claims it can support */
  documentToClaim: Record<string, string[]>
  /** Quality items → Regulatory items they satisfy */
  qualityToRegulatory: Record<string, string[]>
  /** Equipment → Laboratories they belong to */
  equipmentToLab: Record<string, string[]>
  /** Person → Documents they are linked to */
  personToDocument: Record<string, string[]>
  /** Program → Required capabilities */
  programToCapabilities: Record<string, string[]>
}

// ==========================================================================
// INSTITUTIONAL PROFILE (derived from all layers)
// ==========================================================================

export interface InstitutionalProfile {
  /** One-line institutional identity */
  primaryIdentity: string
  /** Top 5 capabilities by evidence strength */
  coreStrengths: string[]
  /** Growth trajectory from timeline */
  growthTrajectory: string
  /** Readiness summary */
  readinessSummary: string | null
  /** Market position */
  marketPosition: string | null

  // By dimension
  research: ResearchProfile
  operations: OperationsProfile
  compliance: ComplianceProfile
  growth: GrowthProfile
}

export interface ResearchProfile {
  topTherapeuticAreas: TherapeuticAreaKey[]
  activeStudies: number
  completedStudies: number
  totalPatientsEnrolled: number
  researchStaffCount: number
  phaseCapabilities: string[]
}

export interface OperationsProfile {
  laboratories: number
  totalEquipment: number
  storageCapacity: string
  processingCapacity: string
  shippingCapabilities: string[]
  staffingLevel: 'understaffed' | 'adequate' | 'overstaffed'
}

export interface ComplianceProfile {
  certificationCount: number
  licenseCount: number
  expiredItems: number
  upcomingRenewals: number
  auditStatus: 'current' | 'pending' | 'overdue'
  overallComplianceScore: number
}

export interface GrowthProfile {
  maturityStage: string
  nextStage: string | null
  coverageScore: number
  healthScore: number
  recentMilestones: string[]
  growthDirection: 'expanding' | 'stabilizing' | 'consolidating' | 'emerging'
}

// ==========================================================================
// EXPLORERS
// ==========================================================================

export interface TwinExplorers {
  knowledge: KnowledgeExplorerState | null
  people: { totalProfiles: number; byRole: Record<string, number>; healthScore: number } | null
  capability: { totalCapabilities: number; byCategory: Record<string, number>; evidenceStrength: string } | null
  compliance: { qualityScore: number; regulatoryScore: number; criticalRisks: number; nextRenewal: string | null } | null
  readiness: { status: string; score: number; missingCapabilities: string[] } | null
  document: DocumentDashboardState | null
  relationship: { totalNodes: number; totalEdges: number; orphans: number; density: number } | null
  timeline: TimelineExplorerState | null
}

// ==========================================================================
// GUIDANCE
// ==========================================================================

export interface TwinGuidance {
  nextBestActions: NextBestAction[]
  progressPath: ProgressPath | null
  completionRoadmap: CompletionRoadmap | null
  growthPath: InstitutionGrowthPath | null
}

// ==========================================================================
// HEALTH
// ==========================================================================

export interface TwinHealth {
  overall: number
  dimensions: {
    knowledgeCoverage: number
    peopleHealth: number
    labHealth: number
    documentHealth: number
    graphHealth: number
    complianceHealth: number
  }
  status: 'excellent' | 'good' | 'fair' | 'concerning' | 'critical'
  summary: string
}

// ==========================================================================
// TWIN BUILDER
// ==========================================================================

export interface TwinBuildInput {
  institutionId: string
  identity: InstitutionIdentity
  domainSnapshots: DomainSnapshots
  intelligenceLayers: IntelligenceLayers
  crossDomainMaps: CrossDomainMaps
  profile: InstitutionalProfile
  guidance: TwinGuidance
  health: TwinHealth
}

export function assembleDigitalTwin(input: TwinBuildInput): InstitutionDigitalTwin {
  return {
    twinId: `twin-${input.institutionId}`,
    institutionId: input.institutionId,
    assembledAt: new Date().toISOString(),
    version: '2.0.0',

    identity: input.identity,
    domains: input.domainSnapshots,
    intelligence: input.intelligenceLayers,
    crossDomain: input.crossDomainMaps,
    profile: input.profile,
    explorers: buildExplorers(input),
    guidance: input.guidance,
    health: input.health,
  }
}

function buildExplorers(input: TwinBuildInput): TwinExplorers {
  return {
    knowledge: null, // Built from Knowledge Explorer
    people: input.intelligenceLayers.people ? {
      totalProfiles: input.intelligenceLayers.people.totalPeople,
      byRole: input.intelligenceLayers.people.byRole,
      healthScore: input.intelligenceLayers.people.healthSummary.overallHealth,
    } : null,
    capability: {
      totalCapabilities: input.domainSnapshots.researchCapability.itemCount,
      byCategory: {},
      evidenceStrength: 'moderate',
    },
    compliance: {
      qualityScore: input.domainSnapshots.quality.completeness,
      regulatoryScore: input.domainSnapshots.regulatory.completeness,
      criticalRisks: 0,
      nextRenewal: null,
    },
    readiness: {
      status: 'unknown',
      score: 0,
      missingCapabilities: [],
    },
    document: input.intelligenceLayers.document,
    relationship: input.intelligenceLayers.relationshipGraph ? {
      totalNodes: input.intelligenceLayers.relationshipGraph.stats.totalNodes,
      totalEdges: input.intelligenceLayers.relationshipGraph.stats.totalEdges,
      orphans: input.intelligenceLayers.relationshipGraph.stats.orphans,
      density: input.intelligenceLayers.relationshipGraph.stats.density,
    } : null,
    timeline: null,
  }
}

// ==========================================================================
// QUICK HEALTH ASSESSMENT
// ==========================================================================

export function quickHealthAssessment(twin: InstitutionDigitalTwin): TwinHealth {
  const scores = [
    twin.domains.people.completeness,
    twin.domains.facilities.completeness,
    twin.domains.equipment.completeness,
    twin.domains.laboratory.completeness,
    twin.domains.researchCapability.completeness,
    twin.domains.regulatory.completeness,
    twin.domains.quality.completeness,
    twin.domains.programCatalog.completeness,
  ]

  const overall = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)

  const status: TwinHealth['status'] =
    overall >= 90 ? 'excellent'
    : overall >= 70 ? 'good'
    : overall >= 50 ? 'fair'
    : overall >= 30 ? 'concerning'
    : 'critical'

  const dims = twin.intelligence
  const summary = status === 'excellent'
    ? 'Institution is fully profiled with complete knowledge, documents, and relationships.'
    : status === 'good'
    ? 'Strong institutional profile with minor gaps.'
    : status === 'fair'
    ? 'Institution has foundational knowledge but significant gaps remain.'
    : status === 'concerning'
    ? 'Critical gaps in institutional knowledge — focus on documents and people.'
    : 'Minimal institutional knowledge. Start with critical documents and key personnel.'

  return {
    overall,
    dimensions: {
      knowledgeCoverage: dims.knowledgeCoverage?.overallCoverage ?? 0,
      peopleHealth: dims.people?.healthSummary.overallHealth ?? 0,
      labHealth: 0,
      documentHealth: dims.document?.healthScore ?? 0,
      graphHealth: 0,
      complianceHealth: Math.round((twin.domains.quality.completeness + twin.domains.regulatory.completeness) / 2),
    },
    status,
    summary,
  }
}

// ==========================================================================
// DIGITAL TWIN SNAPSHOT (for historical comparison)
// ==========================================================================

export interface TwinSnapshot {
  snapshotId: string
  twinId: string
  capturedAt: string
  twin: InstitutionDigitalTwin
  label: string
}

export function captureTwinSnapshot(twin: InstitutionDigitalTwin, label: string): TwinSnapshot {
  return {
    snapshotId: `snap-${twin.institutionId}-${Date.now()}`,
    twinId: twin.twinId,
    capturedAt: new Date().toISOString(),
    twin: JSON.parse(JSON.stringify(twin)), // Deep clone
    label,
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const DIGITAL_TWIN = {
  assembleDigitalTwin,
  quickHealthAssessment,
  captureTwinSnapshot,
}
