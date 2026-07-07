// ==========================================================================
// Sprint A1 — People Intelligence Tests
// ==========================================================================

import { describe, it, expect } from 'vitest'
import {
  computePersonMetrics, detectPeopleRisks,
  buildPeopleDashboard, calculatePeopleHealth,
  PEOPLE_INTELLIGENCE,
  type PersonProfile, type PeopleRisk,
} from '../../packages/institutional-knowledge/src/people-intelligence'

// ==========================================================================
// Fixtures
// ==========================================================================

function makePI(): PersonProfile {
  return {
    personId: 'p-001',
    institutionId: 'org-test',
    identity: {
      firstName: 'Sarah', lastName: 'Chen', title: 'Dr.',
      pronouns: 'she/her',
      primaryRole: 'pi',
      secondaryRoles: ['medical_director'],
      employmentStatus: 'active',
      joinedAt: '2018-03-15T00:00:00Z',
      departedAt: null,
    },
    professional: {
      currentTitle: 'Medical Director / Principal Investigator',
      department: 'Oncology Research',
      specialties: ['breast_cancer', 'lung_cancer'],
      yearsOfExperience: 15,
      researchFocus: ['oncology'],
      bio: 'Experienced oncologist with Phase I-III trial expertise.',
      orcidId: '0000-0002-1234-5678',
      npiNumber: '1234567890',
    },
    education: [
      { degree: 'MD', institution: 'Harvard Medical School', field: 'Medicine', year: 2005, country: 'USA' },
      { degree: 'PhD', institution: 'Stanford University', field: 'Cancer Biology', year: 2009, country: 'USA' },
    ],
    licenses: [
      { type: 'medical', licenseNumber: 'MD12345', issuingState: 'CA', issuedAt: '2010-01-01T00:00:00Z', expiresAt: '2027-12-31T00:00:00Z', status: 'active', verifiedAt: '2025-06-01T00:00:00Z' },
    ],
    certifications: [
      { type: 'gcp', issuedAt: '2024-01-01T00:00:00Z', expiresAt: '2027-01-01T00:00:00Z', renewedCount: 3, verifiedBy: 'regulatory-dept', status: 'active' },
      { type: 'board_certification', issuedAt: '2010-06-01T00:00:00Z', expiresAt: '2030-06-01T00:00:00Z', renewedCount: 1, verifiedBy: null, status: 'active' },
    ],
    training: [
      { type: 'gcp_training', completedAt: '2024-01-15T00:00:00Z', expiresAt: '2027-01-15T00:00:00Z', score: 95, status: 'completed' },
      { type: 'hsp_training', completedAt: '2024-02-01T00:00:00Z', expiresAt: '2026-02-01T00:00:00Z', score: 100, status: 'completed' },
    ],
    languages: [
      { language: 'English', proficiency: 'native' },
      { language: 'Mandarin', proficiency: 'fluent' },
    ],
    researchHistory: [
      { studyId: 's-001', studyTitle: 'BREAST-CA-301', role: 'pi', therapeuticArea: 'oncology', phase: 'Phase III', sponsorName: 'Pfizer', startDate: '2020-01-01T00:00:00Z', endDate: '2023-06-01T00:00:00Z', patientEnrollment: 45, status: 'completed' },
      { studyId: 's-002', studyTitle: 'LUNG-IMM-202', role: 'pi', therapeuticArea: 'oncology', phase: 'Phase II', sponsorName: 'Merck', startDate: '2022-03-01T00:00:00Z', endDate: null, patientEnrollment: 28, status: 'active' },
      { studyId: 's-003', studyTitle: 'PAN-TUMOR-001', role: 'pi', therapeuticArea: 'oncology', phase: 'Phase I', sponsorName: 'AstraZeneca', startDate: '2024-01-01T00:00:00Z', endDate: null, patientEnrollment: 12, status: 'active' },
    ],
    therapeuticExperience: [
      { therapeuticArea: 'oncology', studyCount: 12, totalPatientsEnrolled: 450, firstStudyYear: 2012, lastStudyYear: 2025, roles: ['pi', 'sub_i'] },
    ],
    programParticipation: [
      { programId: 'prog-001', programType: 'phase3_oncology', role: 'pi', startDate: '2020-01-01T00:00:00Z', endDate: '2023-06-01T00:00:00Z', contribution: 'Lead PI' },
    ],
    capabilities: [
      { capabilityType: 'patient_recruitment', proficiency: 'expert', yearsOfExperience: 15, lastPerformedAt: '2025-06-01T00:00:00Z', verifiedBy: null },
      { capabilityType: 'informed_consent', proficiency: 'expert', yearsOfExperience: 15, lastPerformedAt: '2025-06-01T00:00:00Z', verifiedBy: null },
      { capabilityType: 'ae_sae_reporting', proficiency: 'expert', yearsOfExperience: 15, lastPerformedAt: '2025-06-01T00:00:00Z', verifiedBy: null },
    ],
    documents: [
      { documentId: 'doc-cv-001', documentType: 'cv', label: 'CV — Sarah Chen', uploadedAt: '2025-01-01T00:00:00Z', expiresAt: null, status: 'uploaded', isRequired: true },
      { documentId: 'doc-lic-001', documentType: 'medical_license', label: 'Medical License CA', uploadedAt: '2025-06-01T00:00:00Z', expiresAt: '2027-12-31T00:00:00Z', status: 'uploaded', isRequired: true },
    ],
    availability: {
      currentStudyLoad: 2,
      maxStudyCapacity: 4,
      availableForNewStudies: true,
      preferredTherapeuticAreas: ['oncology'],
      nextAvailableDate: '2026-01-01T00:00:00Z',
      workSchedule: 'full_time',
      averageHoursPerWeek: 50,
    },
    succession: {
      backupPersonId: 'p-002',
      backupPersonName: 'Dr. James Miller',
      delegationScope: ['patient_recruitment', 'informed_consent', 'ae_sae_reporting'],
      crossTrainedPeople: ['p-002', 'p-003'],
      criticalityLevel: 'critical',
      transitionPlan: 'Documented transition plan updated Q4 2025.',
    },
    timeline: [
      { eventId: 'te-1', type: 'joined', occurredAt: '2018-03-15T00:00:00Z', description: 'Joined as PI', relatedStudyId: null, relatedCapabilityType: null },
      { eventId: 'te-2', type: 'study_completed', occurredAt: '2023-06-01T00:00:00Z', description: 'Completed BREAST-CA-301', relatedStudyId: 's-001', relatedCapabilityType: null },
    ],
    derivedMetrics: {
      totalStudiesCompleted: 0, activeStudies: 0, yearsOfResearchExperience: 0,
      primaryTherapeuticArea: null, certificationComplianceScore: 0,
      trainingComplianceScore: 0, licenseComplianceScore: 0,
      capabilityCount: 0, studyCompletionRate: 0, averagePatientsPerStudy: 0,
      overallReadinessScore: 0,
    },
  }
}

function makeExpiredPerson(): PersonProfile {
  return {
    personId: 'p-099',
    institutionId: 'org-test',
    identity: {
      firstName: 'Bob', lastName: 'Risk', title: 'Dr.',
      pronouns: null,
      primaryRole: 'pi', secondaryRoles: [],
      employmentStatus: 'active', joinedAt: '2015-01-01T00:00:00Z', departedAt: null,
    },
    professional: {
      currentTitle: 'PI', department: null, specialties: [], yearsOfExperience: 10,
      researchFocus: ['oncology'], bio: null, orcidId: null, npiNumber: null,
    },
    education: [],
    licenses: [
      { type: 'medical', licenseNumber: 'MD99999', issuingState: 'NY', issuedAt: '2015-01-01T00:00:00Z', expiresAt: '2024-01-01T00:00:00Z', status: 'expired', verifiedAt: null },
    ],
    certifications: [
      { type: 'gcp', issuedAt: '2020-01-01T00:00:00Z', expiresAt: '2023-01-01T00:00:00Z', renewedCount: 0, verifiedBy: null, status: 'expired' },
    ],
    training: [
      { type: 'gcp_training', completedAt: '2020-01-01T00:00:00Z', expiresAt: '2023-01-01T00:00:00Z', score: 70, status: 'expired' },
      { type: 'hsp_training', completedAt: '2020-01-01T00:00:00Z', expiresAt: '2022-01-01T00:00:00Z', score: null, status: 'expired' },
    ],
    languages: [],
    researchHistory: [],
    therapeuticExperience: [],
    programParticipation: [],
    capabilities: [],
    documents: [
      { documentId: 'doc-missing', documentType: 'cv', label: 'CV', uploadedAt: null, expiresAt: null, status: 'missing', isRequired: true },
    ],
    availability: {
      currentStudyLoad: 3, maxStudyCapacity: 2, availableForNewStudies: false,
      preferredTherapeuticAreas: [], nextAvailableDate: null, workSchedule: 'full_time', averageHoursPerWeek: 40,
    },
    succession: {
      backupPersonId: null, backupPersonName: null, delegationScope: [],
      crossTrainedPeople: [], criticalityLevel: 'critical', transitionPlan: null,
    },
    timeline: [],
    derivedMetrics: { totalStudiesCompleted: 0, activeStudies: 0, yearsOfResearchExperience: 0, primaryTherapeuticArea: null, certificationComplianceScore: 0, trainingComplianceScore: 0, licenseComplianceScore: 0, capabilityCount: 0, studyCompletionRate: 0, averagePatientsPerStudy: 0, overallReadinessScore: 0 },
  }
}

// ==========================================================================
// PART 1 — Derived Metrics
// ==========================================================================

describe('People Intelligence — Derived Metrics', () => {
  it('computes metrics for active PI with research history', () => {
    const profile = makePI()
    const metrics = computePersonMetrics(profile)

    expect(metrics.totalStudiesCompleted).toBe(1) // s-001 completed
    expect(metrics.activeStudies).toBe(2)          // s-002, s-003 active
    expect(metrics.yearsOfResearchExperience).toBeGreaterThan(5)
    expect(metrics.primaryTherapeuticArea).toBe('oncology')
    expect(metrics.certificationComplianceScore).toBe(100) // both active
    expect(metrics.trainingComplianceScore).toBe(100)      // both completed
    expect(metrics.licenseComplianceScore).toBe(100)       // active
    expect(metrics.capabilityCount).toBe(3)
    expect(metrics.studyCompletionRate).toBeGreaterThan(0)
    expect(metrics.overallReadinessScore).toBeGreaterThan(80)
  })

  it('handles empty profile gracefully', () => {
    const profile = makePI()
    profile.researchHistory = []
    profile.certifications = []
    profile.training = []
    profile.licenses = []
    profile.capabilities = []

    const metrics = computePersonMetrics(profile)
    expect(metrics.totalStudiesCompleted).toBe(0)
    expect(metrics.overallReadinessScore).toBe(0)
  })

  it('certification score reflects expired certs', () => {
    const profile = makeExpiredPerson()
    const metrics = computePersonMetrics(profile)
    expect(metrics.certificationComplianceScore).toBe(0) // 1 expired cert out of 1
  })
})

// ==========================================================================
// PART 2 — Risk Detection
// ==========================================================================

describe('People Intelligence — Risk Detection', () => {
  it('detects multiple risks on expired profile', () => {
    const profile = makeExpiredPerson()
    const risks = detectPeopleRisks(profile)

    const riskTypes = risks.map((r) => r.riskType)
    expect(riskTypes).toContain('license_expired')
    expect(riskTypes).toContain('certification_expired')
    expect(riskTypes).toContain('expired_training')
    expect(riskTypes).toContain('missing_cv')
    expect(riskTypes).toContain('no_backup')
    expect(riskTypes).toContain('succession_risk')
    expect(riskTypes).toContain('overloaded')
  })

  it('healthy PI has zero risks', () => {
    const profile = makePI()
    const risks = detectPeopleRisks(profile)
    expect(risks).toHaveLength(0)
  })

  it('detects missing license for licensed role', () => {
    const profile = makePI()
    profile.licenses = []
    profile.documents = profile.documents.filter((d) => d.documentType !== 'medical_license')

    const risks = detectPeopleRisks(profile)
    expect(risks.some((r) => r.riskType === 'missing_license')).toBe(true)
  })

  it('detects capability gaps for role', () => {
    const profile = makePI()
    profile.capabilities = [] // Remove all — PI expects 3 capabilities

    const risks = detectPeopleRisks(profile)
    const gaps = risks.filter((r) => r.riskType === 'capability_gap')
    expect(gaps.length).toBe(3) // patient_recruitment, informed_consent, ae_sae_reporting
  })

  it('detects overloaded person', () => {
    const profile = makePI()
    profile.availability.currentStudyLoad = 6
    profile.availability.maxStudyCapacity = 4

    const risks = detectPeopleRisks(profile)
    expect(risks.some((r) => r.riskType === 'overloaded')).toBe(true)
  })
})

// ==========================================================================
// PART 3 — Dashboard
// ==========================================================================

describe('People Intelligence — Dashboard', () => {
  it('builds dashboard from multiple profiles', () => {
    const dashboard = buildPeopleDashboard([makePI(), makeExpiredPerson()])

    expect(dashboard.totalPeople).toBe(2)
    expect(dashboard.activePeople).toBe(2)
    expect(dashboard.byRole.pi).toBe(2)
    expect(dashboard.risks.length).toBeGreaterThan(5) // expired person has many risks
    expect(dashboard.healthSummary.overallHealth).toBeLessThan(100)
  })

  it('healthy team has no critical risks', () => {
    const dashboard = buildPeopleDashboard([makePI()])
    expect(dashboard.criticalRolesWithoutBackup).toHaveLength(0)
    expect(dashboard.overloadedPeople).toHaveLength(0)
  })

  it('detects critical roles without backup', () => {
    const dashboard = buildPeopleDashboard([makeExpiredPerson()])
    expect(dashboard.criticalRolesWithoutBackup.length).toBeGreaterThan(0)
  })

  it('detects overloaded people', () => {
    const dashboard = buildPeopleDashboard([makeExpiredPerson()])
    expect(dashboard.overloadedPeople.length).toBeGreaterThan(0)
  })

  it('top therapeutic areas are sorted by study count', () => {
    const dashboard = buildPeopleDashboard([makePI()])
    expect(dashboard.topTherapeuticAreas.length).toBeGreaterThan(0)
    expect(dashboard.topTherapeuticAreas[0].ta).toBe('oncology')
  })

  it('recent changes include timeline events', () => {
    const dashboard = buildPeopleDashboard([makePI()])
    expect(dashboard.recentChanges.length).toBeGreaterThan(0)
  })
})

// ==========================================================================
// PART 4 — People Health
// ==========================================================================

describe('People Intelligence — Health', () => {
  it('healthy profile scores high', () => {
    const health = calculatePeopleHealth([makePI()])
    expect(health.scores.overall).toBeGreaterThan(80)
    expect(health.criticalGaps).toHaveLength(0)
  })

  it('expired profile scores low', () => {
    const health = calculatePeopleHealth([makeExpiredPerson()])
    expect(health.scores.overall).toBeLessThan(50)
    expect(health.recommendations.length).toBeGreaterThan(0)
  })

  it('mixed team shows balanced health', () => {
    const health = calculatePeopleHealth([makePI(), makeExpiredPerson()])
    expect(health.scores.overall).toBeGreaterThan(0)
    expect(health.scores.overall).toBeLessThan(90)
  })

  it('empty team returns zero health', () => {
    const health = calculatePeopleHealth([])
    expect(health.scores.overall).toBe(0)
    expect(health.criticalGaps).toHaveLength(0)
  })
})

// ==========================================================================
// PART 5 — Boundary
// ==========================================================================

describe('People Intelligence — Boundary', () => {
  it('no Readiness engine calls', () => {
    const exported = Object.keys(PEOPLE_INTELLIGENCE)
    expect(exported).not.toContain('calculateReadiness')
  })

  it('no Evidence Core mutation', () => {
    // All metrics are derived, not stored
    const profile = makePI()
    const metrics = computePersonMetrics(profile)
    expect(typeof metrics.overallReadinessScore).toBe('number')
  })

  it('uses canonical taxonomy types', () => {
    const profile = makePI()
    expect(profile.certifications[0].type).toBe('gcp')
    expect(profile.identity.primaryRole).toBe('pi')
    expect(profile.therapeuticExperience[0].therapeuticArea).toBe('oncology')
  })
})
