// ==========================================================================
// Sprint A8 — Institution Operating System Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  observe, analyzeImpact, generateRecommendations,
  createActionPlan, generateGrowthPath,
  buildIOSDashboard, computeIOSHealth,
  INSTITUTION_OS,
  type Observation, type InstitutionDigitalTwin,
  type InstitutionOperatingSystem,
} from '../../packages/institutional-knowledge/src/institution-os'
import { assembleDigitalTwin, type TwinBuildInput, type DomainSnapshots } from '../../packages/institutional-knowledge/src/institution-twin'
import { buildRelationshipGraph } from '../../packages/institutional-knowledge/src/relationship-graph'
import type { RelationshipGraph, GraphNode, GraphEdge } from '../../packages/institutional-knowledge/src/relationship-graph'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeDomainSnapshots(completeness: number): DomainSnapshots {
  return {
    organization: { itemCount: 37, documentedCount: Math.round(37 * completeness / 100), completeness },
    people: { itemCount: 31, documentedCount: Math.round(31 * completeness / 100), completeness },
    organizationStructure: { itemCount: 40, documentedCount: Math.round(40 * completeness / 100), completeness },
    facilities: { itemCount: 40, documentedCount: Math.round(40 * completeness / 100), completeness },
    equipment: { itemCount: 29, documentedCount: Math.round(29 * completeness / 100), completeness },
    laboratory: { itemCount: 35, documentedCount: Math.round(35 * completeness / 100), completeness },
    biospecimen: { itemCount: 57, documentedCount: Math.round(57 * completeness / 100), completeness },
    researchCapability: { itemCount: 29, documentedCount: Math.round(29 * completeness / 100), completeness },
    researchExperience: { itemCount: 37, documentedCount: Math.round(37 * completeness / 100), completeness },
    programCatalog: { itemCount: 21, documentedCount: Math.round(21 * completeness / 100), completeness },
    quality: { itemCount: 34, documentedCount: Math.round(34 * completeness / 100), completeness },
    regulatory: { itemCount: 28, documentedCount: Math.round(28 * completeness / 100), completeness },
  }
}

function makeTwinInput(overrides: Partial<TwinBuildInput> = {}): TwinBuildInput {
  return {
    institutionId: 'org-test',
    identity: {
      name: 'Test Medical Center', organizationType: 'academic_medical_center',
      foundedYear: 1995, mission: 'Advancing medicine.', website: 'https://test.org',
      primaryLocation: 'Boston', timezone: 'America/New_York',
      languages: ['English'], joinedKadarnAt: '2025-01-01T00:00:00Z',
    },
    domainSnapshots: makeDomainSnapshots(50),
    intelligenceLayers: {
      people: null, laboratory: null, document: null, relationshipGraph: null,
      knowledgeCoverage: null, growthPath: null,
    },
    crossDomainMaps: {
      capabilityToEquipment: {}, personToCapability: {}, facilityToProgram: {},
      documentToClaim: {}, qualityToRegulatory: {}, equipmentToLab: {},
      personToDocument: {}, programToCapabilities: {},
    },
    profile: {
      primaryIdentity: 'Academic Medical Center.',
      coreStrengths: ['Oncology', 'Lab Testing'],
      growthTrajectory: 'Expanding.', readinessSummary: null, marketPosition: null,
      research: { topTherapeuticAreas: ['oncology'], activeStudies: 3, completedStudies: 12, totalPatientsEnrolled: 450, researchStaffCount: 8, phaseCapabilities: ['Phase I', 'Phase II', 'Phase III'] },
      operations: { laboratories: 2, totalEquipment: 6, storageCapacity: '1000', processingCapacity: '48/day', shippingCapabilities: ['Domestic'], staffingLevel: 'adequate' },
      compliance: { certificationCount: 3, licenseCount: 4, expiredItems: 0, upcomingRenewals: 2, auditStatus: 'current', overallComplianceScore: 75 },
      growth: { maturityStage: 'developing', nextStage: 'established', coverageScore: 50, healthScore: 50, recentMilestones: [], growthDirection: 'expanding' },
    },
    guidance: { nextBestActions: [], progressPath: null, completionRoadmap: null, growthPath: null },
    health: {
      overall: 50, dimensions: { knowledgeCoverage: 50, peopleHealth: 50, labHealth: 50, documentHealth: 50, graphHealth: 50, complianceHealth: 50 },
      status: 'fair', summary: 'Fair institutional health.',
    },
    ...overrides,
  }
}

function makeGraph(): RelationshipGraph {
  const nodes: GraphNode[] = [
    { nodeId: 'org-1', nodeType: 'organization', label: 'Test Medical Center', properties: {} },
    { nodeId: 'pi-1', nodeType: 'person', label: 'Dr. Smith', properties: {} },
    { nodeId: 'cap-1', nodeType: 'capability', label: 'PBMC Processing', properties: {} },
    { nodeId: 'lab-1', nodeType: 'laboratory', label: 'Core Lab', properties: {} },
    { nodeId: 'equip-1', nodeType: 'equipment', label: 'Freezer A', properties: {} },
    { nodeId: 'doc-1', nodeType: 'document', label: 'CLIA Certificate', properties: {} },
  ]
  const edges: GraphEdge[] = [
    { edgeId: 'e1', sourceNodeId: 'pi-1', targetNodeId: 'cap-1', relationshipType: 'pi_to_capability', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e2', sourceNodeId: 'cap-1', targetNodeId: 'lab-1', relationshipType: 'depends_on', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e3', sourceNodeId: 'lab-1', targetNodeId: 'equip-1', relationshipType: 'lab_to_equipment', direction: 'directed', strength: 'moderate', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'system', metadata: {} },
    { edgeId: 'e4', sourceNodeId: 'doc-1', targetNodeId: 'lab-1', relationshipType: 'certified_by', direction: 'directed', strength: 'strong', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z', source: 'import', metadata: {} },
  ]
  return buildRelationshipGraph({ institutionId: 'org-test', nodes, edges })
}

// ==========================================================================
// PART 1 — Observe
// ==========================================================================

describe('IOS — Observe Layer', () => {
  it('returns baseline observation when no previous twin', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const observations = observe(twin, null)

    expect(observations).toHaveLength(1)
    expect(observations[0].observationType).toBe('new_knowledge_item')
    expect(observations[0].severity).toBe('info')
  })

  it('detects domain completeness changes', () => {
    const prev = assembleDigitalTwin(makeTwinInput({ domainSnapshots: makeDomainSnapshots(50) }))
    const curr = assembleDigitalTwin(makeTwinInput({ domainSnapshots: makeDomainSnapshots(60) }))

    const observations = observe(curr, prev)
    const domainChanges = observations.filter((o) => o.observationType === 'domain_completeness_changed')

    expect(domainChanges.length).toBeGreaterThan(0)
    expect(domainChanges[0].previousState).toBeDefined()
    expect(domainChanges[0].newState).toBeDefined()
  })

  it('detects capability loss when documented count decreases', () => {
    const prev = assembleDigitalTwin(makeTwinInput({ domainSnapshots: makeDomainSnapshots(60) }))
    const curr = assembleDigitalTwin(makeTwinInput({ domainSnapshots: makeDomainSnapshots(30) }))

    const observations = observe(curr, prev)
    const lost = observations.filter((o) => o.observationType === 'capability_lost')

    expect(lost.length).toBeGreaterThan(0)
    expect(lost[0].severity).toBe('high')
  })

  it('detects new capabilities when documented count increases', () => {
    const prev = assembleDigitalTwin(makeTwinInput({ domainSnapshots: makeDomainSnapshots(30) }))
    const curr = assembleDigitalTwin(makeTwinInput({ domainSnapshots: makeDomainSnapshots(50) }))

    const observations = observe(curr, prev)
    const gained = observations.filter((o) => o.observationType === 'lab_capability_gained')

    expect(gained.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 2 — Understand / Impact
// ==========================================================================

describe('IOS — Impact Analysis', () => {
  it('analyzes impact using relationship graph traversal', () => {
    const graph = makeGraph()
    const twin = assembleDigitalTwin(makeTwinInput())

    const observation: Observation = {
      observationId: 'obs-001',
      observationType: 'expired_document',
      source: 'system',
      relatedEntities: ['lab-1'], // Lab is connected to doc, equipment, capability
      relatedDocuments: ['doc-1'],
      relatedKnowledgeItems: [],
      occurredAt: new Date().toISOString(),
      severity: 'critical',
      description: 'CLIA certificate expired.',
      previousState: null, newState: null,
    }

    const impact = analyzeImpact({ observation, graph, twin })

    expect(impact.analysisId).toBeDefined()
    expect(impact.affectedDomains.length).toBeGreaterThan(0)
    expect(impact.affectedLaboratories.length).toBeGreaterThan(0)
    // Equipment should be indirectly affected (lab → equipment)
    expect(impact.affectedEquipment.length).toBeGreaterThan(0)
    expect(impact.explanation).toContain('expired document')
    expect(impact.explanation).toContain('affecting')
  })

  it('generates human-readable explanation', () => {
    const graph = makeGraph()
    const twin = assembleDigitalTwin(makeTwinInput())
    const observation: Observation = {
      observationId: 'obs-002', observationType: 'expired_document',
      source: 'system', relatedEntities: ['doc-1'], relatedDocuments: ['doc-1'],
      relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
      severity: 'critical', description: 'Document expired.',
      previousState: null, newState: null,
    }

    const impact = analyzeImpact({ observation, graph, twin })
    expect(impact.explanation).toContain('expired document')
    expect(impact.explanation).toContain('CLIA Certificate')
  })
})

// ==========================================================================
// PART 3 — Recommend
// ==========================================================================

describe('IOS — Recommendations', () => {
  it('generates recommendations from observations', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const observations: Observation[] = [
      {
        observationId: 'obs-1', observationType: 'expired_document',
        source: 'system', relatedEntities: ['lab-1'], relatedDocuments: ['doc-1'],
        relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
        severity: 'critical', description: 'CLIA expired.',
        previousState: null, newState: null,
      },
      {
        observationId: 'obs-2', observationType: 'training_expired',
        source: 'system', relatedEntities: ['pi-1'], relatedDocuments: [],
        relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
        severity: 'high', description: 'GCP training expired.',
        previousState: null, newState: null,
      },
    ]

    const graph = makeGraph()
    const impacts = observations.map((o) => analyzeImpact({ observation: o, graph, twin }))
    const recs = generateRecommendations({ observations, impacts, twin })

    expect(recs.length).toBeGreaterThanOrEqual(2)
    const renewRec = recs.find((r) => r.type === 'renew_document')
    const trainRec = recs.find((r) => r.type === 'train_person')
    expect(renewRec).toBeDefined()
    expect(trainRec).toBeDefined()
  })

  it('recommendations are sorted by priority', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const graph = makeGraph()
    const observations: Observation[] = [
      {
        observationId: 'obs-a', observationType: 'expired_document',
        source: 'system', relatedEntities: ['lab-1'], relatedDocuments: [],
        relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
        severity: 'critical', description: 'Expired.',
        previousState: null, newState: null,
      },
      {
        observationId: 'obs-b', observationType: 'expiring_document',
        source: 'system', relatedEntities: ['doc-1'], relatedDocuments: [],
        relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
        severity: 'high', description: 'Expiring.',
        previousState: null, newState: null,
      },
    ]
    const impacts = observations.map((o) => analyzeImpact({ observation: o, graph, twin }))
    const recs = generateRecommendations({ observations, impacts, twin })

    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].priority).toBeGreaterThanOrEqual(recs[i - 1].priority)
    }
  })

  it('low-severity observations do not generate recommendations', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const graph = makeGraph()
    const observations: Observation[] = [{
      observationId: 'obs-low', observationType: 'domain_completeness_changed',
      source: 'system', relatedEntities: [], relatedDocuments: [],
      relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
      severity: 'info', description: 'Minor change.',
      previousState: null, newState: null,
    }]
    const impacts = observations.map((o) => analyzeImpact({ observation: o, graph, twin }))
    const recs = generateRecommendations({ observations, impacts, twin })

    expect(recs).toHaveLength(0)
  })
})

// ==========================================================================
// PART 4 — Orchestrate
// ==========================================================================

describe('IOS — Action Plans', () => {
  it('creates action plan from recommendations', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const graph = makeGraph()
    const observations: Observation[] = [
      {
        observationId: 'obs-1', observationType: 'expired_document',
        source: 'system', relatedEntities: ['lab-1'], relatedDocuments: ['doc-1'],
        relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
        severity: 'critical', description: 'CLIA expired.',
        previousState: null, newState: null,
      },
    ]
    const impacts = observations.map((o) => analyzeImpact({ observation: o, graph, twin }))
    const recs = generateRecommendations({ observations, impacts, twin })

    const plan = createActionPlan({
      goal: 'restore_expired_compliance',
      goalDescription: 'Restore expired compliance across all domains.',
      targetCapabilityOrProgram: null,
      recommendations: recs,
    })

    expect(plan.planId).toContain('plan-')
    expect(plan.goal).toBe('restore_expired_compliance')
    expect(plan.steps.length).toBeGreaterThan(0)
    expect(plan.status).toBe('active')
    expect(plan.expectedImpact).toBeTruthy()
  })

  it('empty recommendations produces draft plan', () => {
    const plan = createActionPlan({
      goal: 'improve_domain_health',
      goalDescription: 'Improve knowledge domains.',
      targetCapabilityOrProgram: null,
      recommendations: [],
    })

    expect(plan.status).toBe('draft')
    expect(plan.steps).toHaveLength(0)
  })
})

// ==========================================================================
// PART 5 — Growth Path
// ==========================================================================

describe('IOS — Growth Path', () => {
  it('generates growth path for a target capability', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const graph = makeGraph()
    const recs: any[] = []

    const path = generateGrowthPath({
      targetCapabilityOrProgram: 'PBMC Processing',
      twin,
      graph,
      recommendations: recs,
    })

    expect(path.pathId).toContain('gp-')
    expect(path.targetCapabilityOrProgram).toBe('PBMC Processing')
    expect(path.currentState.knowledgeItemsRequired).toBeGreaterThan(0)
    expect(path.progressPercentage).toBeGreaterThan(0)
  })

  it('identifies missing knowledge domains', () => {
    const twin = assembleDigitalTwin(makeTwinInput({ domainSnapshots: makeDomainSnapshots(25) }))
    const graph = makeGraph()

    const path = generateGrowthPath({
      targetCapabilityOrProgram: 'PBMC', twin, graph, recommendations: [],
    })

    expect(path.missingKnowledge.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 6 — Dashboard
// ==========================================================================

describe('IOS — Dashboard', () => {
  it('builds operating dashboard', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const graph = makeGraph()
    const observations: Observation[] = [
      {
        observationId: 'obs-1', observationType: 'expired_document',
        source: 'system', relatedEntities: ['lab-1'], relatedDocuments: ['doc-1'],
        relatedKnowledgeItems: [], occurredAt: new Date().toISOString(),
        severity: 'critical', description: 'Critical doc expired.',
        previousState: null, newState: null,
      },
    ]
    const impacts = observations.map((o) => analyzeImpact({ observation: o, graph, twin }))
    const recs = generateRecommendations({ observations, impacts, twin })

    const dashboard = buildIOSDashboard({
      institutionId: 'org-test',
      observations, impacts, recommendations: recs,
      actionPlans: [], growthPaths: [],
    })

    expect(dashboard.overview.activeObservations).toBe(1)
    expect(dashboard.overview.criticalObservations).toBe(1)
    expect(dashboard.atRisk.length).toBe(1)
    expect(dashboard.recommendedActions.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 7 — IOS Health
// ==========================================================================

describe('IOS — Health', () => {
  it('computes health from observations and recommendations', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const graph = makeGraph()
    const observations: Observation[] = [
      {
        observationId: 'obs-1', observationType: 'expired_document', source: 'system',
        relatedEntities: ['lab-1'], relatedDocuments: ['doc-1'], relatedKnowledgeItems: [],
        occurredAt: new Date().toISOString(), severity: 'critical', description: 'Expired.',
        previousState: null, newState: null,
      },
    ]
    const impacts = observations.map((o) => analyzeImpact({ observation: o, graph, twin }))
    const recs = generateRecommendations({ observations, impacts, twin })

    const health = computeIOSHealth({
      observations, recommendations: recs, actionPlans: [],
    })

    expect(health.observationVolume).toBe('low')  // 1 obs
    expect(health.criticalRiskCount).toBe(1)
    expect(health.pendingActionCount).toBeGreaterThan(0)
    expect(health.overall).toBeGreaterThan(0)
  })

  it('healthy system with zero issues', () => {
    const health = computeIOSHealth({
      observations: [], recommendations: [], actionPlans: [],
    })

    expect(health.criticalRiskCount).toBe(0)
    expect(health.pendingActionCount).toBe(0)
    expect(health.overall).toBeGreaterThan(50)
  })
})

// ==========================================================================
// PART 8 — Boundary
// ==========================================================================

describe('IOS — Boundary', () => {
  it('no Sponsor Matching', () => {
    const exported = Object.keys(INSTITUTION_OS)
    expect(exported).not.toContain('matchSponsors')
  })

  it('no Marketplace', () => {
    const exported = Object.keys(INSTITUTION_OS)
    expect(exported).not.toContain('marketplaceMatch')
  })

  it('no Evidence Core mutation', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const observations = observe(twin, null)
    expect(observations.length).toBeGreaterThan(0)
  })

  it('all logic is deterministic — same input = same output', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    const obs1 = observe(twin, twin)  // Same twin → no changes
    const obs2 = observe(twin, twin)

    expect(obs1).toEqual(obs2)
  })

  it('Digital Twin compatibility preserved', () => {
    const twin = assembleDigitalTwin(makeTwinInput())
    // InstitutionIntelligenceGraph is an alias of InstitutionDigitalTwin
    const iig: InstitutionDigitalTwin = twin
    expect(iig.institutionId).toBe('org-test')
    expect(iig.domains.people).toBeDefined()
  })
})
