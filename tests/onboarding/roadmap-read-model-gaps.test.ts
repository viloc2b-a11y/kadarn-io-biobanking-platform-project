// ==========================================================================
// dashboard-next-best-action Phase A/C — Roadmap factual gaps + last-updated
// ==========================================================================
// Design ref: decisions-2 rule 4 — roadmap-read-model.ts must add factual
// counts/freshness/gaps info; the deprecated currentReadinessLevel/
// targetReadinessLevel tier (additive in PR-A) is removed entirely in PR-C.
// Spec ref: "Permitted Passport Summary Fields" (same non-evaluative
// principle applied to the roadmap surface — spec id 980).
//
// `deriveRoadmapReadModel()` already computed `claimGaps`/`evidenceGaps`
// internally but never returned them (dead computation). This test proves
// they are now exposed as factual, non-scored fields.

import { describe, expect, it } from 'vitest'
import {
  derivePassportReadModel,
  deriveRoadmapReadModel,
} from '../../apps/web/src/lib/onboarding/derived-read-models'
import type { InstitutionalLocation } from '../../apps/web/src/lib/onboarding/institutional-locations'
import type { LocationInfrastructure } from '../../apps/web/src/lib/onboarding/location-infrastructure'
import type { ResearchTeamMember } from '../../apps/web/src/lib/onboarding/research-team'

function makeLocation(): InstitutionalLocation {
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
  }
}

function makeInfrastructure(): LocationInfrastructure {
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
    storageEquipment: ['-80C Freezer'],
    temperatureMonitoring: 'Continuous logging with alarms',
    shippingCapability: 'Domestic and international',
    biospecimenOperations: ['Collection', 'Processing', 'Storage'],
  }
}

function makeTeamMember(): ResearchTeamMember {
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
    certifications: [],
  }
}

describe('deriveRoadmapReadModel — factual gaps, additive alongside deprecated tier (Phase A)', () => {
  it('exposes claimGaps/evidenceGaps as factual arrays, never merged into a score', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: {},
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
      knowledge: {
        claims: [
          { id: 'c1', claimType: 'capability', statement: 'Runs Phase II trials', confidence: 'Low' },
          { id: 'c2', claimType: 'capability', statement: 'Has cold chain', confidence: 'Insufficient' },
        ],
        evidence: [
          { id: 'e1', evidenceType: 'document', freshness: 'expired' },
        ],
        refreshedAt: '2026-08-01T00:00:00.000Z',
      },
    })

    expect(Array.isArray(result.claimGaps)).toBe(true)
    expect(Array.isArray(result.evidenceGaps)).toBe(true)
    expect(result.claimGaps.length).toBeGreaterThan(0)
    expect(result.evidenceGaps.length).toBeGreaterThan(0)
    expect(result.claimGaps[0]).toContain('claims need stronger evidence')
    expect(result.evidenceGaps[0]).toContain('evidence items are expired')

    // Non-evaluative: no numeric score anywhere in the gap entries.
    expect(typeof result.claimGaps[0]).toBe('string')
    expect(typeof result.evidenceGaps[0]).toBe('string')
  })

  it('exposes lastEvidenceUpdate from knowledge.refreshedAt when present', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: {},
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
      knowledge: { refreshedAt: '2026-08-01T00:00:00.000Z' },
    })

    expect(result.lastEvidenceUpdate).toBe('2026-08-01T00:00:00.000Z')
  })

  it('returns empty gap arrays and no lastEvidenceUpdate when knowledge is absent (unchanged from before)', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: {},
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
    })

    expect(result.claimGaps).toEqual([])
    expect(result.evidenceGaps).toEqual([])
    expect(result.lastEvidenceUpdate).toBeUndefined()
  })

  it('never returns the institution-level currentReadinessLevel/targetReadinessLevel tier (Phase C removal)', () => {
    const passport = derivePassportReadModel({
      institutionId: 'test-1',
      institutionName: 'Test Institution',
      answers: {},
      uploadedDocs: [],
    })

    const result = deriveRoadmapReadModel({
      passport,
      locations: [makeLocation()],
      teamMembers: [makeTeamMember()],
      infrastructure: [makeInfrastructure()],
      strategicGoals: ['IVD readiness'],
    })

    expect(result).not.toHaveProperty('currentReadinessLevel')
    expect(result).not.toHaveProperty('targetReadinessLevel')
  })
})
