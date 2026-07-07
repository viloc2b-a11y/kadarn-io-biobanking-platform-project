// ==========================================================================
// Sprint A7 — Institution Digital Twin Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  assembleDigitalTwin, quickHealthAssessment, captureTwinSnapshot,
  DIGITAL_TWIN,
  type InstitutionDigitalTwin, type TwinBuildInput,
  type DomainSnapshots, type IntelligenceLayers, type CrossDomainMaps,
  type InstitutionalProfile, type TwinGuidance,
} from '../../packages/institutional-knowledge/src/institution-twin'

// ==========================================================================
// Fixtures
// ==========================================================================

function makeDomainSnapshots(): DomainSnapshots {
  return {
    organization: { itemCount: 37, documentedCount: 30, completeness: 81 },
    people: { itemCount: 31, documentedCount: 8, completeness: 26 },
    organizationStructure: { itemCount: 40, documentedCount: 20, completeness: 50 },
    facilities: { itemCount: 40, documentedCount: 5, completeness: 13 },
    equipment: { itemCount: 29, documentedCount: 6, completeness: 21 },
    laboratory: { itemCount: 35, documentedCount: 10, completeness: 29 },
    biospecimen: { itemCount: 57, documentedCount: 15, completeness: 26 },
    researchCapability: { itemCount: 29, documentedCount: 12, completeness: 41 },
    researchExperience: { itemCount: 37, documentedCount: 5, completeness: 14 },
    programCatalog: { itemCount: 21, documentedCount: 3, completeness: 14 },
    quality: { itemCount: 34, documentedCount: 5, completeness: 15 },
    regulatory: { itemCount: 28, documentedCount: 4, completeness: 14 },
  }
}

function makeIntelligenceLayers(): IntelligenceLayers {
  return {
    people: null,
    laboratory: null,
    document: null,
    relationshipGraph: null,
    knowledgeCoverage: null,
    growthPath: null,
  }
}

function makeBuildInput(overrides: Partial<TwinBuildInput> = {}): TwinBuildInput {
  return {
    institutionId: 'org-test',
    identity: {
      name: 'Test Medical Center',
      organizationType: 'academic_medical_center',
      foundedYear: 1995,
      mission: 'Advancing medicine through research.',
      website: 'https://testmedical.org',
      primaryLocation: 'Boston, MA',
      timezone: 'America/New_York',
      languages: ['English', 'Spanish'],
      joinedKadarnAt: '2025-01-01T00:00:00Z',
    },
    domainSnapshots: makeDomainSnapshots(),
    intelligenceLayers: makeIntelligenceLayers(),
    crossDomainMaps: {
      capabilityToEquipment: {},
      personToCapability: {},
      facilityToProgram: {},
      documentToClaim: {},
      qualityToRegulatory: {},
      equipmentToLab: {},
      personToDocument: {},
      programToCapabilities: {},
    },
    profile: {
      primaryIdentity: 'Academic Medical Center with oncology and lab testing capabilities.',
      coreStrengths: ['Oncology Research', 'CLIA Lab Testing', 'PBMC Processing'],
      growthTrajectory: 'Expanding lab infrastructure.',
      readinessSummary: null,
      marketPosition: null,
      research: {
        topTherapeuticAreas: ['oncology'],
        activeStudies: 3, completedStudies: 12, totalPatientsEnrolled: 450,
        researchStaffCount: 8,
        phaseCapabilities: ['Phase I', 'Phase II', 'Phase III'],
      },
      operations: {
        laboratories: 2, totalEquipment: 6, storageCapacity: '1000 positions',
        processingCapacity: '48 samples/day', shippingCapabilities: ['Domestic', 'International'],
        staffingLevel: 'adequate',
      },
      compliance: {
        certificationCount: 3, licenseCount: 4, expiredItems: 0,
        upcomingRenewals: 2, auditStatus: 'current',
        overallComplianceScore: 75,
      },
      growth: {
        maturityStage: 'developing', nextStage: 'established',
        coverageScore: 35, healthScore: 45,
        recentMilestones: ['CLIA renewed 2025', 'PBMC capability added'],
        growthDirection: 'expanding',
      },
    },
    guidance: {
      nextBestActions: [],
      progressPath: null,
      completionRoadmap: null,
      growthPath: null,
    },
    health: {
      overall: 42,
      dimensions: {
        knowledgeCoverage: 35, peopleHealth: 26, labHealth: 29,
        documentHealth: 40, graphHealth: 0, complianceHealth: 15,
      },
      status: 'concerning',
      summary: 'Critical gaps in institutional knowledge.',
    },
    ...overrides,
  }
}

// ==========================================================================
// PART 1 — Twin Assembly
// ==========================================================================

describe('Digital Twin — Assembly', () => {
  it('assembles full digital twin from all layers', () => {
    const input = makeBuildInput()
    const twin = assembleDigitalTwin(input)

    expect(twin.twinId).toContain('twin-org-test')
    expect(twin.institutionId).toBe('org-test')
    expect(twin.version).toBe('2.0.0')
    expect(twin.identity.name).toBe('Test Medical Center')
    expect(twin.domains.people.completeness).toBe(26)
    expect(twin.domains.regulatory.completeness).toBe(14)
    expect(twin.profile.primaryIdentity).toContain('Academic')
  })

  it('includes all 12 domain snapshots', () => {
    const twin = assembleDigitalTwin(makeBuildInput())
    const domains = twin.domains

    expect(domains.organization).toBeDefined()
    expect(domains.people).toBeDefined()
    expect(domains.organizationStructure).toBeDefined()
    expect(domains.facilities).toBeDefined()
    expect(domains.equipment).toBeDefined()
    expect(domains.laboratory).toBeDefined()
    expect(domains.biospecimen).toBeDefined()
    expect(domains.researchCapability).toBeDefined()
    expect(domains.researchExperience).toBeDefined()
    expect(domains.programCatalog).toBeDefined()
    expect(domains.quality).toBeDefined()
    expect(domains.regulatory).toBeDefined()
  })

  it('includes all 6 intelligence layers', () => {
    const twin = assembleDigitalTwin(makeBuildInput())
    const intel = twin.intelligence

    expect(intel).toHaveProperty('people')
    expect(intel).toHaveProperty('laboratory')
    expect(intel).toHaveProperty('document')
    expect(intel).toHaveProperty('relationshipGraph')
    expect(intel).toHaveProperty('knowledgeCoverage')
    expect(intel).toHaveProperty('growthPath')
  })

  it('includes 8 cross-domain maps', () => {
    const twin = assembleDigitalTwin(makeBuildInput())
    const maps = twin.crossDomain

    expect(Object.keys(maps)).toHaveLength(8)
    expect(maps.capabilityToEquipment).toBeDefined()
    expect(maps.personToCapability).toBeDefined()
    expect(maps.programToCapabilities).toBeDefined()
  })

  it('includes 5 profile dimensions', () => {
    const twin = assembleDigitalTwin(makeBuildInput())
    const profile = twin.profile

    expect(profile.research).toBeDefined()
    expect(profile.operations).toBeDefined()
    expect(profile.compliance).toBeDefined()
    expect(profile.growth).toBeDefined()
    expect(profile.coreStrengths).toHaveLength(3)
  })
})

// ==========================================================================
// PART 2 — Health Assessment
// ==========================================================================

describe('Digital Twin — Health', () => {
  it('quick health assessment computes overall score', () => {
    const twin = assembleDigitalTwin(makeBuildInput())
    const health = quickHealthAssessment(twin)

    expect(health.overall).toBeGreaterThan(0)
    expect(health.status).toBeTruthy()
    expect(health.summary).toBeTruthy()
  })

  it('empty twin has critical health', () => {
    const emptyDomains: DomainSnapshots = {
      organization: { itemCount: 0, documentedCount: 0, completeness: 0 },
      people: { itemCount: 0, documentedCount: 0, completeness: 0 },
      organizationStructure: { itemCount: 0, documentedCount: 0, completeness: 0 },
      facilities: { itemCount: 0, documentedCount: 0, completeness: 0 },
      equipment: { itemCount: 0, documentedCount: 0, completeness: 0 },
      laboratory: { itemCount: 0, documentedCount: 0, completeness: 0 },
      biospecimen: { itemCount: 0, documentedCount: 0, completeness: 0 },
      researchCapability: { itemCount: 0, documentedCount: 0, completeness: 0 },
      researchExperience: { itemCount: 0, documentedCount: 0, completeness: 0 },
      programCatalog: { itemCount: 0, documentedCount: 0, completeness: 0 },
      quality: { itemCount: 0, documentedCount: 0, completeness: 0 },
      regulatory: { itemCount: 0, documentedCount: 0, completeness: 0 },
    }

    const twin = assembleDigitalTwin(makeBuildInput({ domainSnapshots: emptyDomains }))
    const health = quickHealthAssessment(twin)

    expect(health.overall).toBe(0)
    expect(health.status).toBe('critical')
  })

  it('full twin has excellent health', () => {
    const fullDomains: DomainSnapshots = {
      organization: { itemCount: 37, documentedCount: 37, completeness: 100 },
      people: { itemCount: 31, documentedCount: 31, completeness: 100 },
      organizationStructure: { itemCount: 40, documentedCount: 40, completeness: 100 },
      facilities: { itemCount: 40, documentedCount: 40, completeness: 100 },
      equipment: { itemCount: 29, documentedCount: 29, completeness: 100 },
      laboratory: { itemCount: 35, documentedCount: 35, completeness: 100 },
      biospecimen: { itemCount: 57, documentedCount: 57, completeness: 100 },
      researchCapability: { itemCount: 29, documentedCount: 29, completeness: 100 },
      researchExperience: { itemCount: 37, documentedCount: 37, completeness: 100 },
      programCatalog: { itemCount: 21, documentedCount: 21, completeness: 100 },
      quality: { itemCount: 34, documentedCount: 34, completeness: 100 },
      regulatory: { itemCount: 28, documentedCount: 28, completeness: 100 },
    }

    const twin = assembleDigitalTwin(makeBuildInput({ domainSnapshots: fullDomains }))
    const health = quickHealthAssessment(twin)

    expect(health.overall).toBe(100)
    expect(health.status).toBe('excellent')
  })
})

// ==========================================================================
// PART 3 — Snapshot
// ==========================================================================

describe('Digital Twin — Snapshot', () => {
  it('captures immutable snapshot of twin', () => {
    const twin = assembleDigitalTwin(makeBuildInput())
    const snapshot = captureTwinSnapshot(twin, 'Q1 2026 Baseline')

    expect(snapshot.snapshotId).toContain('snap-')
    expect(snapshot.label).toBe('Q1 2026 Baseline')
    expect(snapshot.twin.institutionId).toBe('org-test')

    // Snapshot is independent — modifying twin doesn't affect snapshot
    twin.domains.people.completeness = 999
    expect(snapshot.twin.domains.people.completeness).toBe(26) // original value
  })
})

// ==========================================================================
// PART 4 — Boundary
// ==========================================================================

describe('Digital Twin — Boundary', () => {
  it('no Sponsor Matching', () => {
    const exported = Object.keys(DIGITAL_TWIN)
    expect(exported).not.toContain('matchSponsors')
  })

  it('no Marketplace', () => {
    const exported = Object.keys(DIGITAL_TWIN)
    expect(exported).not.toContain('marketplaceMatch')
  })

  it('twin is a consumer — aggregates, never produces new domains', () => {
    const twin = assembleDigitalTwin(makeBuildInput())
    // All data comes from input — twin is pure aggregation
    expect(twin.domains.people.completeness).toBe(26)
    expect(twin.identity.name).toBe('Test Medical Center')
  })

  it('cross-domain maps are derived, not stored', () => {
    const input = makeBuildInput()
    const twin = assembleDigitalTwin(input)

    // Maps are passed through, not computed inside twin
    expect(twin.crossDomain.capabilityToEquipment).toBe(input.crossDomainMaps.capabilityToEquipment)
  })
})
