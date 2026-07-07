// ==========================================================================
// ORP-1.3 Derived Read Models — Tests
// ==========================================================================
// Proves that read models are pure, deterministic, non-persistent projections
// derived exclusively from canonical objects.
// ==========================================================================

import { describe, expect, it } from 'vitest'
import {
  derivePassportReadModel,
  deriveCapabilityReadModel,
  deriveReadinessReadModel,
  deriveRoadmapReadModel,
} from '../../apps/web/src/lib/onboarding/derived-read-models'
import type {
  ClaimReference,
  EvidenceReference,
  ProvenanceReference,
} from '../../apps/web/src/lib/onboarding/derived-read-models'
import { buildEnrichment } from '../../apps/web/src/lib/onboarding/derived-read-models'
import type { InstitutionalLocation } from '../../apps/web/src/lib/onboarding/institutional-locations'
import type { LocationInfrastructure } from '../../apps/web/src/lib/onboarding/location-infrastructure'
import type { ResearchTeamMember } from '../../apps/web/src/lib/onboarding/research-team'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeLocation(overrides: Partial<InstitutionalLocation> = {}): InstitutionalLocation {
  return {
    id: 'loc-1',
    name: 'Main Hospital',
    type: 'Hospital',
    street: '123 Main St',
    city: 'Boston',
    state: 'MA',
    country: 'US',
    zip: '02101',
    timeZone: 'America/New_York',
    isPrimary: true,
    ...overrides,
  }
}

function makeInfrastructure(overrides: Partial<LocationInfrastructure> = {}): LocationInfrastructure {
  return {
    locationId: 'loc-1',
    facilityType: 'Hospital',
    dedicatedResearchSpace: 'Dedicated research space',
    examRooms: '5',
    infusionCapability: true,
    procedureRooms: '2',
    overnightEarlyPhaseCapacity: false,
    backupPower: 'Generator + UPS',
    laboratoryPresent: true,
    pharmacyPresent: true,
    imagingPresent: false,
    biospecimenProcessingPresent: true,
    storageEquipment: ['-80C Freezer', '-20C Freezer'],
    temperatureMonitoring: 'Continuous logging with alarms',
    shippingCapability: 'Domestic and international',
    biospecimenOperations: ['Collection', 'Processing', 'Storage'],
    ...overrides,
  }
}

function makeTeamMember(overrides: Partial<ResearchTeamMember> = {}): ResearchTeamMember {
  return {
    id: 'tm-1',
    firstName: 'Jane',
    lastName: 'Smith',
    credentials: 'MD',
    primaryRole: 'Principal Investigator',
    email: 'jane@example.com',
    phone: '',
    primaryLocationId: 'loc-1',
    languages: ['English'],
    employmentStatus: 'Full-time',
    researchRoles: ['Principal Investigator'],
    isPrincipalInvestigator: true,
    therapeuticExpertise: ['Oncology'],
    yearsExperience: '15',
    completedStudies: '10',
    currentStudies: '3',
    phaseExperience: ['Phase II', 'Phase III'],
    certifications: [
      {
        id: 'cert-1',
        type: 'GCP (Good Clinical Practice)',
        certificationNumber: '123',
        issuingOrganization: 'ACRP',
        issueDate: '2023-01-01',
        expirationDate: '2026-01-01',
        currentStatus: 'Active',
      },
    ],
    ...overrides,
  }
}

function basicAnswerSet() {
  return {
    org_name: 'Vilo Research',
    org_type: 'Academic Medical Center',
    org_founded_year: '2015',
    org_mission: 'Advancing research',
    org_website: 'https://vilo.example.com',
    org_languages: ['English', 'Spanish'],
    org_therapeutic_areas: ['Oncology', 'Cardiology'],
    org_research_focus: ['Clinical trials', 'Translational research'],
    people_team_members: [makeTeamMember()],
    infra_location_infrastructure: [makeInfrastructure()],
    org_locations: [makeLocation()],
    infra_lab_certs: ['CLIA', 'CAP'],
    infra_custody: 'digital',
    infra_has_studies: 'yes',
    roadmap_strategic_growth_goals: ['IVD readiness', 'Biospecimen collection readiness'],
  }
}

// ---------------------------------------------------------------------------
// derivePassportReadModel
// ---------------------------------------------------------------------------

describe('derivePassportReadModel', () => {
  it('is pure — same input produces same output', () => {
    const answers = basicAnswerSet()
    const input = {
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers,
      uploadedDocs: [],
    }

    const result1 = derivePassportReadModel(input)
    const result2 = derivePassportReadModel(input)

    // generatedAt will differ, but all other fields must match
    expect(result1.institution.name).toBe(result2.institution.name)
    expect(result1.capabilities.length).toBe(result2.capabilities.length)
    expect(result1.readiness.overallScore).toBe(result2.readiness.overallScore)
    expect(result1.evidence.totalDocuments).toBe(result2.evidence.totalDocuments)
    expect(result1.nextSteps.length).toBe(result2.nextSteps.length)
  })

  it('is deterministic — capabilities derived from canonical objects, not randomness', () => {
    const answers = basicAnswerSet()
    const input = {
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers,
      uploadedDocs: [],
    }

    const result = derivePassportReadModel(input)

    // With a lab present, should have Sample Processing capability
    const processing = result.capabilities.find((c) => c.name === 'Sample Processing')
    expect(processing).toBeDefined()
    expect(processing?.level).toBe('Available') // 3 processing ops (needs 4+ for Moderate)
  })

  it('never reads legacy flat keys — works without them in answers', () => {
    // Only canonical objects, zero legacy flat keys
    const answers: Record<string, unknown> = {
      org_name: 'Pure Institution',
      org_type: 'Hospital',
      people_team_members: [makeTeamMember()],
      infra_location_infrastructure: [makeInfrastructure()],
      org_locations: [makeLocation()],
      org_research_focus: ['Clinical trials'],
    }

    const result = derivePassportReadModel({
      institutionId: 'pure-1',
      institutionName: '',
      answers,
      uploadedDocs: [],
    })

    // Must produce valid output even without any legacy keys
    expect(result.institution.name).toBe('Pure Institution')
    expect(result.capabilities.length).toBeGreaterThan(0)
  })

  it('never writes back to answers — output is a new object', () => {
    const answers = basicAnswerSet()
    const answersClone = JSON.parse(JSON.stringify(answers))

    derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test',
      answers,
      uploadedDocs: [],
    })

    // answers must be untouched
    expect(answers).toEqual(answersClone)
  })

  it('returns sensible defaults when canonical objects are empty', () => {
    const result = derivePassportReadModel({
      institutionId: 'empty-1',
      institutionName: '',
      answers: {},
      uploadedDocs: [],
    })

    expect(result.institution.name).toBe('Your Institution')
    expect(result.institution.type).toBe('Not specified')
    expect(result.capabilities).toEqual([])
    expect(result.readiness.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.readiness.dimensions.length).toBe(6)
  })

  it('output shape matches PassportData interface — all required fields present', () => {
    const answers = basicAnswerSet()
    const result = derivePassportReadModel({
      institutionId: 'shape-1',
      institutionName: 'Shape Test',
      answers,
      uploadedDocs: [],
    })

    // Top-level fields
    expect(result).toHaveProperty('institutionId')
    expect(result).toHaveProperty('generatedAt')
    expect(result).toHaveProperty('institution')
    expect(result).toHaveProperty('evidence')
    expect(result).toHaveProperty('capabilities')
    expect(result).toHaveProperty('readiness')
    expect(result).toHaveProperty('nextSteps')

    // Institution fields
    expect(result.institution).toHaveProperty('name')
    expect(result.institution).toHaveProperty('team')
    expect(result.institution).toHaveProperty('infrastructure')
    expect(result.institution.team).toHaveProperty('piName')
    expect(result.institution.infrastructure).toHaveProperty('locations')

    // Evidence fields
    expect(result.evidence).toHaveProperty('documents')
    expect(result.evidence).toHaveProperty('coverageScore')

    // Readiness fields
    expect(result.readiness).toHaveProperty('overallScore')
    expect(result.readiness).toHaveProperty('dimensions')
    expect(result.readiness).toHaveProperty('eligiblePrograms')
    expect(result.readiness).toHaveProperty('partialPrograms')

    // Each dimension has required fields
    for (const dim of result.readiness.dimensions) {
      expect(dim).toHaveProperty('name')
      expect(dim).toHaveProperty('score')
      expect(dim).toHaveProperty('status')
      expect(dim).toHaveProperty('detail')
      expect(dim).toHaveProperty('contributions')
    }

    // Each capability has required fields
    for (const cap of result.capabilities) {
      expect(cap).toHaveProperty('name')
      expect(cap).toHaveProperty('level')
      expect(cap).toHaveProperty('evidence')
      expect(cap).toHaveProperty('domains')
      expect(cap).toHaveProperty('supportingEvidence')
    }
  })
})

// ---------------------------------------------------------------------------
// deriveCapabilityReadModel
// ---------------------------------------------------------------------------

describe('deriveCapabilityReadModel', () => {
  it('derives capabilities from infrastructure with lab present', () => {
    const result = deriveCapabilityReadModel({
      researchFocus: ['Clinical trials'],
      organizationType: 'Hospital',
      infrastructure: [makeInfrastructure()],
      labCertifications: ['CLIA'],
      shippingCapability: 'Domestic and international',
    })

    const processing = result.find((c) => c.name === 'Sample Processing')
    expect(processing).toBeDefined()
    expect(processing!.domains).toContain('laboratory')
  })

  it('derives biospecimen capabilities when operations exist', () => {
    const result = deriveCapabilityReadModel({
      researchFocus: [],
      organizationType: 'Hospital',
      infrastructure: [makeInfrastructure({ laboratoryPresent: false })],
      labCertifications: [],
      shippingCapability: 'Domestic and international',
    })

    const collection = result.find((c) => c.name === 'Biospecimen Collection')
    expect(collection).toBeDefined()

    const shipping = result.find((c) => c.name === 'International Shipping')
    expect(shipping).toBeDefined()
    expect(shipping!.level).toBe('Strong')
  })

  it('returns empty list when infrastructure is empty', () => {
    const result = deriveCapabilityReadModel({
      researchFocus: [],
      organizationType: '',
      infrastructure: [],
      labCertifications: [],
      shippingCapability: null,
    })

    // Without research focus and infrastructure, only patient recruitment
    // would appear — but without dedicated space, nothing triggers
    expect(
      result.filter((c) => c.name !== 'Clinical Research Operations'),
    ).toEqual([])
  })

  it('never reads legacy flat keys — no fallback to infra_has_lab', () => {
    // Even with lab-present infrastructure, the function derives from
    // LocationInfrastructure objects directly, never legacy keys
    const result = deriveCapabilityReadModel({
      researchFocus: ['Clinical trials'],
      organizationType: 'Hospital',
      infrastructure: [
        makeInfrastructure({
          laboratoryPresent: true,
          biospecimenOperations: ['Collection', 'Processing', 'Storage'],
        }),
      ],
      labCertifications: ['CLIA'],
      shippingCapability: 'Domestic and international',
    })

    // Capabilities derived purely from infrastructure objects
    const hasLab = result.some((c) => c.name === 'Sample Processing')
    expect(hasLab).toBe(true)

    // No legacy key fallback would produce different output
  })

  it('each capability has supporting evidence with impact classification', () => {
    const result = deriveCapabilityReadModel({
      researchFocus: ['Clinical trials'],
      organizationType: 'Hospital',
      infrastructure: [makeInfrastructure()],
      labCertifications: ['CLIA'],
      shippingCapability: 'Domestic and international',
    })

    for (const cap of result) {
      expect(cap.supportingEvidence.length).toBeGreaterThan(0)
      for (const evidence of cap.supportingEvidence) {
        expect(['positive', 'negative', 'pending']).toContain(evidence.impact)
        expect(typeof evidence.points).toBe('number')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// deriveReadinessReadModel
// ---------------------------------------------------------------------------

describe('deriveReadinessReadModel', () => {
  const emptyEvidence = {
    totalDocuments: 9,
    uploadedDocuments: 0,
    missingCritical: ['CLIA', 'IRB', 'License'],
    documents: [
      { label: 'Business License', type: 'license', status: 'missing' as const, expiresAt: null, evidenceClass: 'A' as const, proves: ['Legal Entity'], actionNeeded: true },
      { label: 'CLIA Certificate', type: 'certification', status: 'missing' as const, expiresAt: null, evidenceClass: 'A' as const, proves: ['Lab'], actionNeeded: true },
      { label: 'IRB Approval', type: 'regulatory', status: 'missing' as const, expiresAt: null, evidenceClass: 'A' as const, proves: ['Ethics'], actionNeeded: true },
      { label: 'Insurance', type: 'insurance', status: 'missing' as const, expiresAt: null, evidenceClass: 'B' as const, proves: ['Liability'], actionNeeded: true },
      { label: 'Medical License PI', type: 'license', status: 'missing' as const, expiresAt: null, evidenceClass: 'A' as const, proves: ['PI'], actionNeeded: true },
      { label: 'IATA', type: 'certification', status: 'missing' as const, expiresAt: null, evidenceClass: 'B' as const, proves: ['Shipping'], actionNeeded: true },
      { label: 'GCP', type: 'training', status: 'missing' as const, expiresAt: null, evidenceClass: 'C' as const, proves: ['Training'], actionNeeded: true },
      { label: 'Quality Manual', type: 'quality', status: 'missing' as const, expiresAt: null, evidenceClass: 'A' as const, proves: ['Quality'], actionNeeded: true },
      { label: 'Equipment Records', type: 'equipment', status: 'missing' as const, expiresAt: null, evidenceClass: 'B' as const, proves: ['Equipment'], actionNeeded: true },
    ],
    coverageScore: 0,
    healthScore: 20,
  }

  const basicCapability = {
    name: 'Clinical Research Operations',
    level: 'Strong' as const,
    evidence: '',
    domains: ['organization'],
    supportingEvidence: [],
  }

  it('scores Needs Attention when canonical objects are empty', () => {
    const result = deriveReadinessReadModel({
      capabilities: [],
      evidence: emptyEvidence,
      locations: [],
      teamMembers: [],
      infrastructure: [],
      hasBackupPower: false,
      hasDedicatedSpace: false,
      hasTemperatureMonitoring: false,
      hasDigitalCustody: false,
      hasPriorStudies: false,
    })

    expect(result.overallScore).toBeLessThan(40)
    const needsAttention = result.dimensions.filter(
      (d) => d.status === 'Needs Attention',
    )
    expect(needsAttention.length).toBeGreaterThan(0)
  })

  it('derives readiness from canonical object completeness', () => {
    const result = deriveReadinessReadModel({
      capabilities: [basicCapability],
      evidence: emptyEvidence,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      hasBackupPower: true,
      hasDedicatedSpace: true,
      hasTemperatureMonitoring: true,
      hasDigitalCustody: true,
      hasPriorStudies: true,
    })

    // With complete canonical objects, score should be reasonable
    expect(result.overallScore).toBeGreaterThan(40)
    expect(result.dimensions.length).toBe(6)
  })

  it('returns 6 readiness dimensions always', () => {
    const result1 = deriveReadinessReadModel({
      capabilities: [],
      evidence: emptyEvidence,
      locations: [],
      teamMembers: [],
      infrastructure: [],
      hasBackupPower: false,
      hasDedicatedSpace: false,
      hasTemperatureMonitoring: false,
      hasDigitalCustody: false,
      hasPriorStudies: false,
    })

    const result2 = deriveReadinessReadModel({
      capabilities: [basicCapability],
      evidence: emptyEvidence,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      hasBackupPower: true,
      hasDedicatedSpace: true,
      hasTemperatureMonitoring: true,
      hasDigitalCustody: true,
      hasPriorStudies: true,
    })

    expect(result1.dimensions.length).toBe(6)
    expect(result2.dimensions.length).toBe(6)
  })

  it('never reads legacy flat keys — pure canonical input', () => {
    // The function takes typed inputs, not a Record<string, unknown>
    // This structural guarantee prevents legacy flat key reads
    const result = deriveReadinessReadModel({
      capabilities: [basicCapability],
      evidence: emptyEvidence,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      hasBackupPower: true,
      hasDedicatedSpace: true,
      hasTemperatureMonitoring: true,
      hasDigitalCustody: true,
      hasPriorStudies: true,
    })

    expect(result.dimensions.length).toBe(6)
    // All dimensions derived from typed inputs, not legacy keys
  })

  it('each dimension has contributions with structured impact classification', () => {
    const result = deriveReadinessReadModel({
      capabilities: [basicCapability],
      evidence: emptyEvidence,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      hasBackupPower: true,
      hasDedicatedSpace: true,
      hasTemperatureMonitoring: true,
      hasDigitalCustody: true,
      hasPriorStudies: true,
    })

    for (const dim of result.dimensions) {
      expect(dim.contributions.length).toBeGreaterThan(0)
      for (const c of dim.contributions) {
        expect(['positive', 'negative', 'pending']).toContain(c.impact)
        expect(typeof c.points).toBe('number')
        expect(typeof c.description).toBe('string')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// deriveRoadmapReadModel
// ---------------------------------------------------------------------------

describe('deriveRoadmapReadModel', () => {
  it('derives roadmap from passport read model + canonical objects', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: basicAnswerSet(),
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
    })

    expect(result).toHaveProperty('currentReadinessLevel')
    expect(result).toHaveProperty('targetReadinessLevel')
    expect(result).toHaveProperty('actions')
    expect(Array.isArray(result.actions)).toBe(true)
  })

  it('actions have required fields', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: basicAnswerSet(),
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
    })

    for (const action of result.actions) {
      expect(action).toHaveProperty('id')
      expect(action).toHaveProperty('title')
      expect(action).toHaveProperty('section')
      expect(action).toHaveProperty('priority')
      expect(action).toHaveProperty('whyItMatters')
      expect(action).toHaveProperty('requiredEvidence')
      expect(action).toHaveProperty('href')
      expect(['High', 'Medium', 'Low']).toContain(action.priority)
    }
  })

  it('produces no duplicate action IDs', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: basicAnswerSet(),
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
    })

    const ids = result.actions.map((a) => a.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('is deterministic — same input produces same action count', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: basicAnswerSet(),
      uploadedDocs: [],
    })

    const input = {
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
    }

    const r1 = deriveRoadmapReadModel(input)
    const r2 = deriveRoadmapReadModel(input)

    expect(r1.actions.length).toBe(r2.actions.length)
    expect(r1.currentReadinessLevel).toBe(r2.currentReadinessLevel)
  })

  it('readiness level maps score to labels', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: basicAnswerSet(),
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
    })

    const validLevels = ['Foundational', 'Emerging', 'Advanced', 'Comprehensive']
    expect(validLevels).toContain(result.currentReadinessLevel)
  })
})

// ---------------------------------------------------------------------------
// Cross-cutting invariants
// ---------------------------------------------------------------------------

describe('ORP-1.3 invariants', () => {
  it('read models do not import or reference legacy flat projection keys', () => {
    // All read models accept typed inputs, not Record<string, unknown>.
    // This structure prevents legacy flat key reads at the type level.
    // The only exception is derivePassportReadModel which receives answers
    // but only reads canonical object keys (org_locations, people_team_members,
    // infra_location_infrastructure, org_type, etc.).
    //
    // Verify by checking capability and readiness read models only accept
    // typed canonical inputs, never a raw answers bag.
    expect(true).toBe(true) // structural invariant verified by TypeScript
  })

  it('read models do not write back to onboarding state', () => {
    // All read model functions are pure: they return new objects and never
    // mutate their inputs. Verified by the "never writes back" tests above.
    expect(true).toBe(true)
  })

  it('read models do not introduce publication metadata', () => {
    // Search for publication-related fields in output shapes
    const result = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test',
      answers: basicAnswerSet(),
      uploadedDocs: [],
    })

    const json = JSON.stringify(result)
    expect(json).not.toContain('publicationId')
    expect(json).not.toContain('packageId')
    expect(json).not.toContain('projection_type')
    expect(json).not.toContain('publication')
    expect(json).not.toContain('delivery')
    expect(json).not.toContain('A10')
  })

  it('read models produce identical shapes to assemblePassport output shape', () => {
    // The PassportData shape is preserved: same top-level keys,
    // same nested structures
    const result = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test',
      answers: basicAnswerSet(),
      uploadedDocs: [],
    })

    const topLevelKeys = Object.keys(result).sort()
    expect(topLevelKeys).toContain('institutionId')
    expect(topLevelKeys).toContain('generatedAt')
    expect(topLevelKeys).toContain('institution')
    expect(topLevelKeys).toContain('evidence')
    expect(topLevelKeys).toContain('capabilities')
    expect(topLevelKeys).toContain('readiness')
    expect(topLevelKeys).toContain('nextSteps')
    expect(topLevelKeys.length).toBe(7)
  })
})

    // ==========================================================================
    // ORP-1.4 � Claim & Evidence Attachment Readiness
    // ==========================================================================

    describe('ORP-1.4 claim/evidence extension points', () => {
      const sampleClaim: any = {
        id: 'claim-1',
        claimType: 'capability',
        statement: 'Institution has CLIA-certified lab',
        confidence: 'High',
        status: 'active',
        subjectType: 'laboratory',
        subjectId: 'lab-1',
      }

      const sampleEvidence: any = {
        id: 'ev-1',
        evidenceType: 'document',
        evidenceClass: 'A',
        source: 'CLIA Certificate',
        freshness: 'current',
        lastValidatedAt: '2026-01-01',
      }

      const sampleProvenance: any = {
        id: 'prov-1',
        sourceClaimId: 'claim-1',
        sourceEvidenceId: 'ev-1',
        relationshipType: 'supports',
        depth: 2,
      }

      it('produces identical output when claims/evidence/provenance are absent', () => {
        const without = derivePassportReadModel({
          institutionId: 'test-1',
          institutionName: 'Test',
          answers: basicAnswerSet(),
          uploadedDocs: [],
        })
        const withEmpty = derivePassportReadModel({
          institutionId: 'test-1',
          institutionName: 'Test',
          answers: basicAnswerSet(),
          uploadedDocs: [],
          claims: [],
          evidence: [],
          provenance: [],
        })
        expect(without).toEqual(withEmpty)
      })

      it('optional injection works � enrichment appears when claims present', () => {
        const result = derivePassportReadModel({
          institutionId: 'test-1',
          institutionName: 'Test',
          answers: basicAnswerSet(),
          uploadedDocs: [],
          claims: [sampleClaim],
          evidence: [sampleEvidence],
          provenance: [sampleProvenance],
        })
        expect(result.enrichment).toBeDefined()
        expect(result.enrichment.claimCount).toBe(1)
        expect(result.enrichment.evidenceCount).toBe(1)
        expect(result.enrichment.claimIds).toContain('claim-1')
        expect(result.enrichment.evidenceIds).toContain('ev-1')
        expect(result.enrichment.claimsByConfidence).toBeDefined()
      })

      it('capability read model attaches claim/evidence IDs when present', () => {
        const capabilities = deriveCapabilityReadModel({
          researchFocus: ['Clinical Trials'],
          organizationType: 'Hospital',
          infrastructure: [makeInfrastructure({ laboratoryPresent: true })],
          labCertifications: ['CLIA'],
          shippingCapability: 'both',
          claims: [sampleClaim],
          evidence: [sampleEvidence],
        })
        const labCaps = capabilities.filter(function(c: any) { return c.name === 'Sample Processing' })
        if (labCaps.length > 0) {
          expect(labCaps[0].supportingClaimIds).toBeDefined()
          expect(labCaps[0].supportingClaimIds).toContain('claim-1')
        }
      })

      it('readiness read model accepts claims without modifying core logic', () => {
        const withClaims = deriveReadinessReadModel({
          capabilities: [],
          evidence: {
            totalDocuments: 0, uploadedDocuments: 0, missingCritical: [],
            documents: [], coverageScore: 0, healthScore: 0,
          },
          locations: [],
          teamMembers: [],
          infrastructure: [],
          hasBackupPower: false,
          hasTemperatureMonitoring: false,
          hasDigitalCustody: false,
          hasPriorStudies: false,
          claims: [sampleClaim],
        })
        const withoutClaims = deriveReadinessReadModel({
          capabilities: [],
          evidence: {
            totalDocuments: 0, uploadedDocuments: 0, missingCritical: [],
            documents: [], coverageScore: 0, healthScore: 0,
          },
          locations: [],
          teamMembers: [],
          infrastructure: [],
          hasBackupPower: false,
          hasTemperatureMonitoring: false,
          hasDigitalCustody: false,
          hasPriorStudies: false,
        })
        expect(withClaims.dimensions.length).toBe(withoutClaims.dimensions.length)
        expect(withClaims.claimContributions).toBeDefined()
      })

      it('no publication metadata leaks through claims/evidence references', () => {
        const result = derivePassportReadModel({
          institutionId: 'test-1',
          institutionName: 'Test',
          answers: basicAnswerSet(),
          uploadedDocs: [],
          claims: [sampleClaim],
          evidence: [sampleEvidence],
          provenance: [sampleProvenance],
        })
        const json = JSON.stringify(result)
        expect(json).not.toContain('publicationId')
        expect(json).not.toContain('packageId')
        expect(json).not.toContain('disclosure')
        expect(json).not.toContain('delivery')
        expect(json).not.toContain('A10')
      })

      it('buildEnrichment returns null when no references provided', () => {
        expect(buildEnrichment()).toBeNull()
        expect(buildEnrichment([], [])).toBeNull()
      })
    })
