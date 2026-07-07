// ==========================================================================
// OCP-3 — Readiness Wiring & Evidence-Aware Completion Tests
// ==========================================================================

import { describe, expect, it } from 'vitest'
import { deriveCapabilityReadModel } from '../../apps/web/src/lib/onboarding/derived-read-models'
import { getActiveConditionalRequirements } from '../../apps/web/src/lib/onboarding/derived-read-models'
import { computeCompletionGate } from '../../apps/web/src/lib/onboarding/completion-gate'
import type { CompletionGateInput } from '../../apps/web/src/lib/onboarding/completion-gate'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeInfra(overrides: Record<string, unknown> = {}) {
  return {
    id: 'infra-1',
    facilityType: 'Hospital',
    dedicatedResearchSpace: 'dedicated',
    laboratoryPresent: false,
    biospecimenProcessingPresent: false,
    biospecimenOperations: ['None'],
    storageEquipment: [],
    backupPower: 'None',
    temperatureMonitoring: 'Manual logging',
    shippingCapability: 'none',
    ...overrides,
  }
}

function viloAnswers() {
  return {
    org_type: 'Academic Medical Center',
    org_therapeutic_areas: ['Oncology', 'Cardiology'],
    org_research_focus: ['Clinical Trials', 'Biobanking'],
    org_mission: 'Advancing clinical research.',
    org_operational_coverage: 'multi-country',
    people_team_members: [
      {
        id: 'tm-1', firstName: 'Sarah', lastName: 'Chen',
        primaryRole: 'Principal Investigator', researchRoles: ['PI'],
        languages: ['English'], certifications: [{ type: 'GCP', currentStatus: 'Active' }],
        therapeuticExpertise: ['Oncology'], yearsExperience: 15, isPrincipalInvestigator: true,
      },
    ],
    infra_location_infrastructure: [
      makeInfra({ laboratoryPresent: true, biospecimenOperations: ['blood', 'tissue'], storageEquipment: ['minus80'], backupPower: 'Generator + UPS', temperatureMonitoring: 'Continuous logging with alarms', shippingCapability: 'both' }),
    ],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OCP-3 evidence-aware capabilities', () => {
  it('unknown is not treated as absent — empty infra returns UNKNOWN', () => {
    const caps = deriveCapabilityReadModel({
      researchFocus: [],
      organizationType: 'Hospital',
      infrastructure: [],
      labCertifications: [],
      shippingCapability: null,
      uploadedDocLabels: [],
    })
    // No capabilities at all → empty list, not "Not available" for everything
    expect(caps.length).toBe(0)
  })

  it('declared-only does not produce strong readiness — lab declared but no docs', () => {
    const caps = deriveCapabilityReadModel({
      researchFocus: [],
      organizationType: 'Hospital',
      infrastructure: [makeInfra({ laboratoryPresent: true })],
      labCertifications: [],
      shippingCapability: null,
      uploadedDocLabels: [],
    })
    const labCap = caps.find((c) => c.name === 'Sample Processing')
    expect(labCap).toBeDefined()
    expect(labCap!.evidenceSupport).toBe('DECLARED_ONLY')
  })

  it('SUPPORTED_BY_EVIDENCE when documents back the capability', () => {
    const caps = deriveCapabilityReadModel({
      researchFocus: [],
      organizationType: 'Hospital',
      infrastructure: [makeInfra({ laboratoryPresent: true })],
      labCertifications: ['CLIA'],
      shippingCapability: null,
      uploadedDocLabels: ['CLIA Certificate', 'Quality Manual', 'IRB Approval'],
    })
    const labCap = caps.find((c) => c.name === 'Sample Processing')
    expect(labCap).toBeDefined()
    expect(labCap!.evidenceSupport).toBe('SUPPORTED_BY_EVIDENCE')
  })

  it('biospecimen capability shows DECLARED_ONLY when declared but no evidence', () => {
    const caps = deriveCapabilityReadModel({
      researchFocus: [],
      organizationType: 'Hospital',
      infrastructure: [makeInfra({ biospecimenOperations: ['blood', 'tissue'], storageEquipment: ['minus80'] })],
      labCertifications: [],
      shippingCapability: 'both',
      uploadedDocLabels: [],
    })
    const bioCap = caps.find((c) => c.name === 'Biospecimen Collection')
    expect(bioCap).toBeDefined()
    // Without matching docs, biospecimen is DECLARED_ONLY
    expect(bioCap!.evidenceSupport).toBe('DECLARED_ONLY')
  })
})

describe('OCP-3 conditional requirements', () => {
  it('CLIA is required only when lab capability is declared', () => {
    const reqs = getActiveConditionalRequirements({
      infrastructure: [{ laboratoryPresent: true }],
      uploadedDocLabels: [],
    })
    const clia = reqs.find((r) => r.requirement.requirement.includes('CLIA'))
    expect(clia).toBeDefined()
    expect(clia!.active).toBe(true)
    expect(clia!.satisfied).toBe(false)
  })

  it('CLIA is not required when no lab is declared', () => {
    const reqs = getActiveConditionalRequirements({
      infrastructure: [makeInfra({ laboratoryPresent: false })],
      uploadedDocLabels: [],
    })
    const clia = reqs.find((r) => r.requirement.requirement.includes('CLIA'))
    expect(clia).toBeDefined()
    expect(clia!.active).toBe(false)
    expect(clia!.satisfied).toBe(true) // not active = implicitly satisfied
  })

  it('IATA is required only when biospecimen shipping is declared', () => {
    const reqs = getActiveConditionalRequirements({
      infrastructure: [makeInfra({ biospecimenOperations: ['blood'], shippingCapability: 'both' })],
      uploadedDocLabels: [],
    })
    const iata = reqs.find((r) => r.requirement.requirement.includes('IATA'))
    expect(iata).toBeDefined()
    expect(iata!.active).toBe(true)
    expect(iata!.satisfied).toBe(false)
  })

  it('IATA is not required when no shipping is declared', () => {
    const reqs = getActiveConditionalRequirements({
      infrastructure: [makeInfra({ biospecimenOperations: ['None'], shippingCapability: 'none' })],
      uploadedDocLabels: [],
    })
    const iata = reqs.find((r) => r.requirement.requirement.includes('IATA'))
    expect(iata).toBeDefined()
    expect(iata!.active).toBe(false)
  })

  it('conditional requirements are satisfied when matching documents uploaded', () => {
    const reqs = getActiveConditionalRequirements({
      infrastructure: [makeInfra({ laboratoryPresent: true, biospecimenOperations: ['blood'], shippingCapability: 'both' })],
      uploadedDocLabels: ['CLIA Certificate', 'IATA Certification'],
    })
    const clia = reqs.find((r) => r.requirement.requirement.includes('CLIA'))
    const iata = reqs.find((r) => r.requirement.requirement.includes('IATA'))
    expect(clia!.satisfied).toBe(true)
    expect(iata!.satisfied).toBe(true)
  })
})

describe('OCP-3 evidence-aware completion gate', () => {
  it('ready for draft Passport with declared capabilities but missing evidence', () => {
    const input: CompletionGateInput = {
      answers: viloAnswers(),
      uploadedDocs: [],
      completedDomains: ['welcome', 'organization', 'people', 'infrastructure'],
      institutionName: 'Vilo Research',
    }
    const result = computeCompletionGate(input)
    // With declared capabilities but no documents → draft possible
    expect(result.canGenerateDraftPassport).toBe(true)
    // But not full Passport without evidence
    expect(result.canGenerateFullPassport).toBe(false)
  })

  it('ready for evidence-backed Passport with sufficient evidence', () => {
    const input: CompletionGateInput = {
      answers: viloAnswers(),
      uploadedDocs: [
        { uploaded: true, label: 'CLIA Certificate', type: 'certification', evidenceClass: 'A' },
        { uploaded: true, label: 'IRB Approval', type: 'regulatory', evidenceClass: 'A' },
        { uploaded: true, label: 'Business License', type: 'license', evidenceClass: 'A' },
      ],
      completedDomains: ['welcome', 'organization', 'people', 'infrastructure', 'documents'],
      institutionName: 'Vilo Research',
    }
    const result = computeCompletionGate(input)
    expect(result.canGenerateFullPassport).toBe(true)
  })

  it('does not overstate readiness when evidence is missing', () => {
    const input: CompletionGateInput = {
      answers: viloAnswers(),
      uploadedDocs: [{ uploaded: true, label: 'License', type: 'license', evidenceClass: 'B' }],
      completedDomains: ['welcome', 'organization', 'people', 'infrastructure', 'documents'],
      institutionName: 'Vilo Research',
    }
    const result = computeCompletionGate(input)
    // 1 doc is not enough for full Passport
    expect(result.canGenerateFullPassport).toBe(false)
    // Draft is available but status reflects evidence gap
    expect(result.canGenerateDraftPassport).toBe(true)
  })
})

describe('OCP-3 Vilo Research scenario', () => {
  it('Vilo Research with partial evidence gets honest readiness', () => {
    const input: CompletionGateInput = {
      answers: viloAnswers(),
      uploadedDocs: [
        { uploaded: true, label: 'CLIA Certificate', type: 'certification', evidenceClass: 'A' },
        { uploaded: true, label: 'Business License', type: 'license', evidenceClass: 'A' },
      ],
      completedDomains: ['welcome', 'organization', 'people', 'infrastructure', 'documents'],
      institutionName: 'Vilo Research',
    }
    const result = computeCompletionGate(input)
    // Vilo has lab + biospecimen declared, CLIA uploaded, but only 2 docs
    // Should be in NEEDS_EVIDENCE or IN_PROGRESS, not falsely READY
    expect(['NEEDS_EVIDENCE', 'IN_PROGRESS']).toContain(result.status)
    // Draft available but not full
    expect(result.canGenerateDraftPassport).toBe(true)
  })

  it('Vilo Research with full evidence is ready for Passport', () => {
    const input: CompletionGateInput = {
      answers: viloAnswers(),
      uploadedDocs: [
        { uploaded: true, label: 'CLIA Certificate', type: 'certification', evidenceClass: 'A' },
        { uploaded: true, label: 'IRB Approval', type: 'regulatory', evidenceClass: 'A' },
        { uploaded: true, label: 'Business License', type: 'license', evidenceClass: 'A' },
        { uploaded: true, label: 'IATA Certification', type: 'certification', evidenceClass: 'B' },
      ],
      completedDomains: ['welcome', 'organization', 'people', 'infrastructure', 'documents', 'memory'],
      institutionName: 'Vilo Research',
    }
    const result = computeCompletionGate(input)
    expect(result.status).toBe('READY_FOR_PASSPORT')
    expect(result.canGenerateFullPassport).toBe(true)
  })
})
