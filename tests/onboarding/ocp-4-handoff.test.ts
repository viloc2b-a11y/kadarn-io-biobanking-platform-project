// ==========================================================================
// OCP-4 — Final Handoff & I'm Done CTA Tests
// ==========================================================================

import { describe, expect, it } from 'vitest'
import { computeCompletionGate } from '../../apps/web/src/lib/onboarding/completion-gate'
import type { CompletionGateInput } from '../../apps/web/src/lib/onboarding/completion-gate'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function viloDraftInput(): CompletionGateInput {
  return {
    answers: {
      org_type: 'Academic Medical Center',
      org_therapeutic_areas: ['Oncology'],
      org_research_focus: ['Clinical Trials'],
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
        {
          id: 'infra-1', facilityType: 'Hospital', dedicatedResearchSpace: 'dedicated',
          laboratoryPresent: true, biospecimenProcessingPresent: true,
          biospecimenOperations: ['blood'], storageEquipment: ['minus80'],
          backupPower: 'Generator + UPS', temperatureMonitoring: 'Continuous logging with alarms',
          shippingCapability: 'both',
        },
      ],
    },
    uploadedDocs: [
      { uploaded: true, label: 'CLIA Certificate', type: 'certification', evidenceClass: 'A' },
      { uploaded: true, label: 'Business License', type: 'license', evidenceClass: 'A' },
    ],
    completedDomains: ['welcome', 'organization', 'people', 'infrastructure', 'documents'],
    institutionName: 'Vilo Research',
  }
}

function viloEvidenceInput(): CompletionGateInput {
  return {
    answers: viloDraftInput().answers,
    uploadedDocs: [
      { uploaded: true, label: 'CLIA Certificate', type: 'certification', evidenceClass: 'A' },
      { uploaded: true, label: 'IRB Approval', type: 'regulatory', evidenceClass: 'A' },
      { uploaded: true, label: 'Business License', type: 'license', evidenceClass: 'A' },
      { uploaded: true, label: 'IATA Certification', type: 'certification', evidenceClass: 'B' },
    ],
    completedDomains: ['welcome', 'organization', 'people', 'infrastructure', 'documents', 'memory'],
    institutionName: 'Vilo Research',
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OCP-4 completion states', () => {
  it('draft Passport can be reviewed — canGenerateDraftPassport is true', () => {
    const result = computeCompletionGate(viloDraftInput())
    expect(result.canGenerateDraftPassport).toBe(true)
    // Draft means evidence is partial
    expect(result.canGenerateFullPassport).toBe(false)
  })

  it('evidence-backed Passport can be reviewed — canGenerateFullPassport is true', () => {
    const result = computeCompletionGate(viloEvidenceInput())
    expect(result.canGenerateFullPassport).toBe(true)
    expect(result.status).toBe('READY_FOR_PASSPORT')
  })

  it('PASSPORT_GENERATED status when onboarding is completed', () => {
    const input: CompletionGateInput = {
      ...viloEvidenceInput(),
      passportGenerated: true,
    }
    const result = computeCompletionGate(input)
    expect(result.status).toBe('PASSPORT_GENERATED')
  })

  it('completion does not hide gaps — missing items still reported after completion', () => {
    const input: CompletionGateInput = {
      ...viloDraftInput(),
      passportGenerated: true,
    }
    const result = computeCompletionGate(input)
    // Status is PASSPORT_GENERATED
    expect(result.status).toBe('PASSPORT_GENERATED')
    // But missing items still exist (only 2 docs)
    expect(result.missingItems.length).toBeGreaterThan(0)
  })

  it('completion flag preserves existing completion gate data', () => {
    const withoutCompletion = computeCompletionGate(viloEvidenceInput())
    const withCompletion = computeCompletionGate({
      ...viloEvidenceInput(),
      passportGenerated: true,
    })
    // Same data except status
    expect(withCompletion.overallPercentage).toBe(withoutCompletion.overallPercentage)
    expect(withCompletion.criticalCompleted).toBe(withoutCompletion.criticalCompleted)
    expect(withCompletion.completedDomains.length).toBe(withoutCompletion.completedDomains.length)
    // Status differs
    expect(withCompletion.status).toBe('PASSPORT_GENERATED')
    expect(withoutCompletion.status).toBe('READY_FOR_PASSPORT')
  })

  it('PASSPORT_GENERATED status preserves next best action correctly', () => {
    const result = computeCompletionGate({
      ...viloDraftInput(),
      passportGenerated: true,
    })
    expect(result.status).toBe('PASSPORT_GENERATED')
    // Still has missing items (documents)
    expect(result.missingItems.some((m) => m.type === 'document')).toBe(true)
  })
})

describe('OCP-4 Vilo Research scenarios', () => {
  it('Vilo draft case: declared capabilities, partial evidence, can complete', () => {
    const result = computeCompletionGate(viloDraftInput())
    expect(result.canGenerateDraftPassport).toBe(true)
    expect(result.canGenerateFullPassport).toBe(false)
    // Gaps are visible
    const docGaps = result.missingItems.filter((m) => m.type === 'document')
    expect(docGaps.length).toBeGreaterThan(0)
  })

  it('Vilo evidence-backed case: sufficient evidence, ready for Passport', () => {
    const result = computeCompletionGate(viloEvidenceInput())
    expect(result.status).toBe('READY_FOR_PASSPORT')
    expect(result.canGenerateFullPassport).toBe(true)
  })

  it('Vilo with completed flag shows PASSPORT_GENERATED', () => {
    const result = computeCompletionGate({
      ...viloEvidenceInput(),
      passportGenerated: true,
    })
    expect(result.status).toBe('PASSPORT_GENERATED')
  })

  it('Vilo draft with completed flag still shows evidence gaps', () => {
    const result = computeCompletionGate({
      ...viloDraftInput(),
      passportGenerated: true,
    })
    expect(result.status).toBe('PASSPORT_GENERATED')
    // Evidence gaps persist
    expect(result.missingItems.filter((m) => m.type === 'document').length).toBeGreaterThan(0)
  })
})

describe('OCP-4 language compliance', () => {
  it('no verified/certified/approved language in status labels', () => {
    // Status labels imported from completion-gate don't use these terms
    const result = computeCompletionGate(viloEvidenceInput())
    const json = JSON.stringify(result)
    expect(json).not.toContain('verified')
    expect(json).not.toContain('certified')
    expect(json).not.toContain('approved')
    expect(json).not.toContain('sponsor-ready')
  })

  it('draft vs evidence-backed distinction preserved', () => {
    const draft = computeCompletionGate(viloDraftInput())
    const full = computeCompletionGate(viloEvidenceInput())
    expect(draft.canGenerateFullPassport).toBe(false)
    expect(full.canGenerateFullPassport).toBe(true)
  })
})
