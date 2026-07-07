// ==========================================================================
// Sprint A1 — People Intelligence
// ==========================================================================
// Extiende el People Domain existente. No crea nuevo dominio.
// Cada persona es modelada como un perfil completo con dimensión temporal.
// ==========================================================================

import {
  THERAPEUTIC_AREAS, CERTIFICATION_TYPES, TRAINING_TYPES,
  RESEARCH_ROLES, CAPABILITY_TYPES, PROGRAM_TYPES,
  type TherapeuticAreaKey, type CertificationTypeKey, type TrainingTypeKey,
  type ResearchRoleKey, type CapabilityTypeKey, type ProgramTypeKey,
} from '../taxonomy'

// ==========================================================================
// PERSON INTELLIGENCE — Core Profile
// ==========================================================================

export interface PersonProfile {
  personId: string
  institutionId: string
  identity: PersonIdentity
  professional: ProfessionalProfile
  education: EducationRecord[]
  licenses: LicenseRecord[]
  certifications: CertificationRecord[]
  training: TrainingRecord[]
  languages: LanguageProficiency[]
  researchHistory: ResearchExperienceRecord[]
  therapeuticExperience: TherapeuticExperience[]
  programParticipation: ProgramParticipationRecord[]
  capabilities: PersonCapability[]
  documents: PersonDocument[]
  availability: PersonAvailability
  succession: SuccessionPlan
  timeline: PersonTimelineEvent[]
  derivedMetrics: PersonDerivedMetrics
}

// ==========================================================================
// IDENTITY
// ==========================================================================

export interface PersonIdentity {
  firstName: string
  lastName: string
  title: string
  pronouns: string | null
  primaryRole: ResearchRoleKey
  secondaryRoles: ResearchRoleKey[]
  employmentStatus: 'active' | 'on_leave' | 'terminated' | 'retired' | 'transitioning'
  joinedAt: string
  departedAt: string | null
}

// ==========================================================================
// PROFESSIONAL PROFILE
// ==========================================================================

export interface ProfessionalProfile {
  currentTitle: string
  department: string | null
  specialties: string[]
  yearsOfExperience: number
  researchFocus: TherapeuticAreaKey[]
  bio: string | null
  orcidId: string | null
  npiNumber: string | null
}

// ==========================================================================
// EDUCATION
// ==========================================================================

export interface EducationRecord {
  degree: string
  institution: string
  field: string
  year: number
  country: string
}

// ==========================================================================
// LICENSES
// ==========================================================================

export interface LicenseRecord {
  type: string // e.g. 'medical', 'nursing', 'pharmacy'
  licenseNumber: string
  issuingState: string
  issuedAt: string
  expiresAt: string | null
  status: 'active' | 'expired' | 'suspended' | 'pending'
  verifiedAt: string | null
}

// ==========================================================================
// CERTIFICATIONS
// ==========================================================================

export interface CertificationRecord {
  type: CertificationTypeKey
  issuedAt: string
  expiresAt: string | null
  renewedCount: number
  verifiedBy: string | null
  status: 'active' | 'expired' | 'expiring_soon' | 'missing'
}

// ==========================================================================
// TRAINING
// ==========================================================================

export interface TrainingRecord {
  type: TrainingTypeKey
  completedAt: string
  expiresAt: string | null
  score: number | null
  status: 'completed' | 'in_progress' | 'expired' | 'missing'
}

// ==========================================================================
// LANGUAGES
// ==========================================================================

export interface LanguageProficiency {
  language: string
  proficiency: 'native' | 'fluent' | 'professional' | 'basic'
}

// ==========================================================================
// RESEARCH EXPERIENCE (temporal — accumulates over time)
// ==========================================================================

export interface ResearchExperienceRecord {
  studyId: string
  studyTitle: string
  role: ResearchRoleKey
  therapeuticArea: TherapeuticAreaKey
  phase: string
  sponsorName: string
  startDate: string
  endDate: string | null
  patientEnrollment: number
  status: 'completed' | 'active' | 'terminated' | 'suspended'
}

// ==========================================================================
// THERAPEUTIC EXPERIENCE (aggregated across studies)
// ==========================================================================

export interface TherapeuticExperience {
  therapeuticArea: TherapeuticAreaKey
  studyCount: number
  totalPatientsEnrolled: number
  firstStudyYear: number
  lastStudyYear: number | null
  roles: ResearchRoleKey[]
}

// ==========================================================================
// PROGRAM PARTICIPATION
// ==========================================================================

export interface ProgramParticipationRecord {
  programId: string
  programType: ProgramTypeKey
  role: ResearchRoleKey
  startDate: string
  endDate: string | null
  contribution: string | null
}

// ==========================================================================
// CAPABILITIES (what this person can do)
// ==========================================================================

export interface PersonCapability {
  capabilityType: CapabilityTypeKey
  proficiency: 'expert' | 'proficient' | 'familiar' | 'learning'
  yearsOfExperience: number
  lastPerformedAt: string | null
  verifiedBy: string | null
}

// ==========================================================================
// DOCUMENTS (linked to this person)
// ==========================================================================

export interface PersonDocument {
  documentId: string
  documentType: string
  label: string
  uploadedAt: string | null
  expiresAt: string | null
  status: 'uploaded' | 'missing' | 'expired' | 'expiring_soon'
  isRequired: boolean
}

// ==========================================================================
// AVAILABILITY
// ==========================================================================

export interface PersonAvailability {
  currentStudyLoad: number
  maxStudyCapacity: number
  availableForNewStudies: boolean
  preferredTherapeuticAreas: TherapeuticAreaKey[]
  nextAvailableDate: string | null
  workSchedule: 'full_time' | 'part_time' | 'consulting' | 'on_call'
  averageHoursPerWeek: number
}

// ==========================================================================
// SUCCESSION
// ==========================================================================

export interface SuccessionPlan {
  backupPersonId: string | null
  backupPersonName: string | null
  delegationScope: CapabilityTypeKey[]
  crossTrainedPeople: string[]
  criticalityLevel: 'critical' | 'important' | 'replaceable'
  transitionPlan: string | null
}

// ==========================================================================
// TIMELINE
// ==========================================================================

export type PersonTimelineEventType =
  | 'joined'
  | 'role_changed'
  | 'certification_gained'
  | 'certification_expired'
  | 'license_obtained'
  | 'license_expired'
  | 'training_completed'
  | 'training_expired'
  | 'study_started'
  | 'study_completed'
  | 'capability_acquired'
  | 'capability_lost'
  | 'availability_changed'
  | 'departed'
  | 'reactivated'

export interface PersonTimelineEvent {
  eventId: string
  type: PersonTimelineEventType
  occurredAt: string
  description: string
  relatedStudyId: string | null
  relatedCapabilityType: string | null
}

// ==========================================================================
// DERIVED METRICS (calculated, never stored)
// ==========================================================================

export interface PersonDerivedMetrics {
  totalStudiesCompleted: number
  activeStudies: number
  yearsOfResearchExperience: number
  primaryTherapeuticArea: TherapeuticAreaKey | null
  certificationComplianceScore: number // 0-100
  trainingComplianceScore: number    // 0-100
  licenseComplianceScore: number     // 0-100
  capabilityCount: number
  studyCompletionRate: number         // % completed vs started
  averagePatientsPerStudy: number
  overallReadinessScore: number       // 0-100
}

// ==========================================================================
// DERIVED METRICS ENGINE
// ==========================================================================

export function computePersonMetrics(profile: PersonProfile): PersonDerivedMetrics {
  const completed = profile.researchHistory.filter((s) => s.status === 'completed')
  const active = profile.researchHistory.filter((s) => s.status === 'active')
  const all = profile.researchHistory

  // Primary therapeutic area
  const taCounts: Record<string, number> = {}
  for (const exp of profile.therapeuticExperience) {
    taCounts[exp.therapeuticArea] = exp.studyCount
  }
  let primaryTA: TherapeuticAreaKey | null = null
  let maxCount = 0
  for (const [ta, count] of Object.entries(taCounts)) {
    if (count > maxCount) { maxCount = count; primaryTA = ta as TherapeuticAreaKey }
  }

  // Certification compliance
  const certs = profile.certifications
  const activeCerts = certs.filter((c) => c.status === 'active' || c.status === 'expiring_soon').length
  const certScore = certs.length > 0 ? Math.round((activeCerts / certs.length) * 100) : 0

  // Training compliance
  const trainings = profile.training
  const completedTrainings = trainings.filter((t) => t.status === 'completed').length
  const trainScore = trainings.length > 0 ? Math.round((completedTrainings / trainings.length) * 100) : 0

  // License compliance
  const licenses = profile.licenses
  const activeLicenses = licenses.filter((l) => l.status === 'active').length
  const licenseScore = licenses.length > 0 ? Math.round((activeLicenses / licenses.length) * 100) : 0

  // Study completion rate
  const finished = all.filter((s) => s.status === 'completed' || s.status === 'terminated').length
  const completionRate = all.length > 0 ? Math.round((finished / all.length) * 100) : 0

  // Average patients
  const totalPatients = all.reduce((sum, s) => sum + s.patientEnrollment, 0)
  const avgPatients = all.length > 0 ? Math.round(totalPatients / all.length) : 0

  // Overall readiness
  const overall = Math.round((certScore + trainScore + licenseScore + completionRate) / 4)

  // Years of experience
  const firstStudy = all.length > 0
    ? Math.min(...all.map((s) => new Date(s.startDate).getFullYear()))
    : new Date().getFullYear()
  const yearsExp = new Date().getFullYear() - firstStudy

  return {
    totalStudiesCompleted: completed.length,
    activeStudies: active.length,
    yearsOfResearchExperience: yearsExp,
    primaryTherapeuticArea: primaryTA,
    certificationComplianceScore: certScore,
    trainingComplianceScore: trainScore,
    licenseComplianceScore: licenseScore,
    capabilityCount: profile.capabilities.length,
    studyCompletionRate: completionRate,
    averagePatientsPerStudy: avgPatients,
    overallReadinessScore: overall,
  }
}

// ==========================================================================
// AUTO-DETECTION ENGINE
// ==========================================================================

export interface PeopleRisk {
  riskType: 'missing_license' | 'expired_training' | 'missing_cv' | 'capability_gap' | 'succession_risk' | 'certification_expired' | 'license_expired' | 'no_backup' | 'overloaded'
  personId: string
  personName: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  recommendedAction: string
  detectedAt: string
}

export function detectPeopleRisks(profile: PersonProfile): PeopleRisk[] {
  const risks: PeopleRisk[] = []
  const now = new Date().toISOString()
  const name = `${profile.identity.firstName} ${profile.identity.lastName}`

  // Missing licenses for licensed roles
  if (['pi', 'sub_i', 'medical_director'].includes(profile.identity.primaryRole)) {
    if (profile.licenses.length === 0) {
      risks.push({
        riskType: 'missing_license', personId: profile.personId, personName: name,
        severity: 'critical',
        description: `No medical license recorded for ${name} (${profile.identity.primaryRole}).`,
        recommendedAction: 'Upload current medical license.',
        detectedAt: now,
      })
    }
  }

  // Expired licenses
  for (const lic of profile.licenses) {
    if (lic.status === 'expired') {
      risks.push({
        riskType: 'license_expired', personId: profile.personId, personName: name,
        severity: 'critical',
        description: `License ${lic.type} (${lic.licenseNumber}) expired on ${lic.expiresAt}.`,
        recommendedAction: `Renew ${lic.type} license immediately.`,
        detectedAt: now,
      })
    }
  }

  // Expired certifications
  for (const cert of profile.certifications) {
    if (cert.status === 'expired') {
      risks.push({
        riskType: 'certification_expired', personId: profile.personId, personName: name,
        severity: 'high',
        description: `Certification ${cert.type} expired.`,
        recommendedAction: `Renew ${cert.type} certification.`,
        detectedAt: now,
      })
    }
  }

  // Expired training
  for (const train of profile.training) {
    if (train.status === 'expired') {
      risks.push({
        riskType: 'expired_training', personId: profile.personId, personName: name,
        severity: 'high',
        description: `Training ${train.type} expired.`,
        recommendedAction: `Re-take ${train.type} training.`,
        detectedAt: now,
      })
    } else if (train.status === 'missing') {
      risks.push({
        riskType: 'expired_training', personId: profile.personId, personName: name,
        severity: 'medium',
        description: `Required training ${train.type} not completed.`,
        recommendedAction: `Complete ${train.type} training.`,
        detectedAt: now,
      })
    }
  }

  // Missing CV for research roles
  const researchRoles: string[] = ['pi', 'sub_i', 'study_coordinator', 'research_nurse', 'lab_director']
  if (researchRoles.includes(profile.identity.primaryRole)) {
    const hasCV = profile.documents.some((d) => d.documentType === 'cv' && d.status === 'uploaded')
    if (!hasCV) {
      risks.push({
        riskType: 'missing_cv', personId: profile.personId, personName: name,
        severity: 'medium',
        description: `No CV uploaded for ${name}.`,
        recommendedAction: 'Upload current curriculum vitae.',
        detectedAt: now,
      })
    }
  }

  // Succession risks
  if (profile.succession.criticalityLevel === 'critical' && !profile.succession.backupPersonId) {
    risks.push({
      riskType: 'no_backup', personId: profile.personId, personName: name,
      severity: 'critical',
      description: `${name} is critical with no backup person assigned.`,
      recommendedAction: 'Designate a backup person and create transition plan.',
      detectedAt: now,
    })
  }

  if (profile.succession.criticalityLevel === 'critical' && !profile.succession.transitionPlan) {
    risks.push({
      riskType: 'succession_risk', personId: profile.personId, personName: name,
      severity: 'high',
      description: `${name} has no documented transition plan.`,
      recommendedAction: 'Create and document transition plan.',
      detectedAt: now,
    })
  }

  // Overloaded
  if (profile.availability.currentStudyLoad > profile.availability.maxStudyCapacity) {
    risks.push({
      riskType: 'overloaded', personId: profile.personId, personName: name,
      severity: 'high',
      description: `${name} is overloaded: ${profile.availability.currentStudyLoad} studies vs ${profile.availability.maxStudyCapacity} max capacity.`,
      recommendedAction: 'Redistribute study load or increase capacity.',
      detectedAt: now,
    })
  }

  // Capability gaps for role
  const expectedCapabilities = getExpectedCapabilities(profile.identity.primaryRole)
  const personCaps = new Set(profile.capabilities.map((c) => c.capabilityType))
  for (const expected of expectedCapabilities) {
    if (!personCaps.has(expected)) {
      risks.push({
        riskType: 'capability_gap', personId: profile.personId, personName: name,
        severity: 'medium',
        description: `${name} is missing expected capability: ${expected}.`,
        recommendedAction: `Train or certify ${name} in ${expected}.`,
        detectedAt: now,
      })
    }
  }

  return risks
}

function getExpectedCapabilities(role: ResearchRoleKey): CapabilityTypeKey[] {
  const map: Partial<Record<ResearchRoleKey, CapabilityTypeKey[]>> = {
    pi: ['patient_recruitment', 'informed_consent', 'ae_sae_reporting'],
    sub_i: ['physical_exam', 'informed_consent', 'ae_sae_reporting'],
    study_coordinator: ['source_documentation', 'data_management', 'monitoring_readiness'],
    research_nurse: ['phlebotomy', 'vital_signs', 'infusion'],
    lab_director: ['sample_processing', 'cold_chain', 'biobanking'],
    lab_technician: ['centrifugation', 'aliquoting', 'phlebotomy'],
    regulatory_specialist: ['regulatory_submission', 'audit_readiness'],
    quality_manager: ['audit_readiness', 'monitoring_readiness'],
  }
  return map[role] ?? []
}

// ==========================================================================
// PEOPLE DASHBOARD STATE
// ==========================================================================

export interface PeopleDashboardState {
  institutionId: string
  totalPeople: number
  activePeople: number
  byRole: Record<string, number>
  healthSummary: {
    certificationCompliance: number  // 0-100 average
    trainingCompliance: number
    licenseCompliance: number
    cvCompleteness: number
    overallHealth: number
  }
  risks: PeopleRisk[]
  criticalRolesWithoutBackup: string[]
  overloadedPeople: string[]
  topTherapeuticAreas: { ta: TherapeuticAreaKey; count: number }[]
  recentChanges: PersonTimelineEvent[]
}

export function buildPeopleDashboard(profiles: PersonProfile[]): PeopleDashboardState {
  const now = new Date().toISOString()
  const active = profiles.filter((p) => p.identity.employmentStatus === 'active')
  const allRisks: PeopleRisk[] = []

  // Role distribution
  const byRole: Record<string, number> = {}
  for (const p of profiles) {
    byRole[p.identity.primaryRole] = (byRole[p.identity.primaryRole] ?? 0) + 1
  }

  // Health scores
  let totalCert = 0, totalTrain = 0, totalLic = 0, totalCV = 0
  for (const p of active) {
    const m = computePersonMetrics(p)
    totalCert += m.certificationComplianceScore
    totalTrain += m.trainingComplianceScore
    totalLic += m.licenseComplianceScore
    const hasCV = p.documents.some((d) => d.documentType === 'cv' && d.status === 'uploaded')
    if (hasCV) totalCV++
    allRisks.push(...detectPeopleRisks(p))
  }

  const n = active.length || 1

  // Critical roles without backup
  const noBackup = profiles
    .filter((p) => p.succession.criticalityLevel === 'critical' && !p.succession.backupPersonId)
    .map((p) => `${p.identity.firstName} ${p.identity.lastName}`)

  // Overloaded
  const overloaded = profiles
    .filter((p) => p.availability.currentStudyLoad > p.availability.maxStudyCapacity)
    .map((p) => `${p.identity.firstName} ${p.identity.lastName}`)

  // Top therapeutic areas
  const taMap: Record<string, number> = {}
  for (const p of profiles) {
    for (const exp of p.therapeuticExperience) {
      taMap[exp.therapeuticArea] = (taMap[exp.therapeuticArea] ?? 0) + exp.studyCount
    }
  }
  const topTA = Object.entries(taMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ta, count]) => ({ ta: ta as TherapeuticAreaKey, count }))

  // Recent timeline events
  const allEvents = profiles.flatMap((p) => p.timeline)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 20)

  return {
    institutionId: profiles[0]?.institutionId ?? '',
    totalPeople: profiles.length,
    activePeople: active.length,
    byRole,
    healthSummary: {
      certificationCompliance: Math.round(totalCert / n),
      trainingCompliance: Math.round(totalTrain / n),
      licenseCompliance: Math.round(totalLic / n),
      cvCompleteness: Math.round((totalCV / n) * 100),
      overallHealth: Math.round((totalCert + totalTrain + totalLic) / (3 * n)),
    },
    risks: allRisks.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 }
      return sev[a.severity] - sev[b.severity]
    }),
    criticalRolesWithoutBackup: noBackup,
    overloadedPeople: overloaded,
    topTherapeuticAreas: topTA,
    recentChanges: allEvents,
  }
}

// ==========================================================================
// PEOPLE EXPLORER STATE
// ==========================================================================

export type PeopleExplorerView = 'grid' | 'timeline' | 'by_role' | 'by_ta' | 'by_compliance'

export interface PeopleExplorerState {
  institutionId: string
  currentView: PeopleExplorerView
  totalPeople: number
  filters: {
    roles: ResearchRoleKey[]
    therapeuticAreas: TherapeuticAreaKey[]
    employmentStatus: string[]
    complianceRange: { min: number; max: number } | null
    searchText: string | null
  }
  sortBy: 'name' | 'role' | 'experience' | 'compliance' | 'studies'
  sortDirection: 'asc' | 'desc'
  selectedPersonId: string | null
}

// ==========================================================================
// PEOPLE HEALTH
// ==========================================================================

export interface PeopleHealthReport {
  institutionId: string
  calculatedAt: string
  scores: {
    certificationHealth: number
    trainingHealth: number
    licenseHealth: number
    documentationHealth: number
    successionHealth: number
    capacityHealth: number
    overall: number
  }
  criticalGaps: PeopleRisk[]
  recommendations: string[]
}

export function calculatePeopleHealth(profiles: PersonProfile[]): PeopleHealthReport {
  if (profiles.length === 0) {
    return {
      institutionId: '',
      calculatedAt: new Date().toISOString(),
      scores: { certificationHealth: 0, trainingHealth: 0, licenseHealth: 0, documentationHealth: 0, successionHealth: 0, capacityHealth: 0, overall: 0 },
      criticalGaps: [],
      recommendations: ['No people profiles found. Add people to begin tracking health.'],
    }
  }
  const recommendations: string[] = []
      const dashboard = buildPeopleDashboard(profiles)

  const criticalRisks = dashboard.risks.filter((r) => r.severity === 'critical').length
  const highRisks = dashboard.risks.filter((r) => r.severity === 'high').length

  const successionHealth = dashboard.criticalRolesWithoutBackup.length === 0 ? 100
    : Math.max(0, 100 - dashboard.criticalRolesWithoutBackup.length * 20)

  const capacityHealth = dashboard.overloadedPeople.length === 0 ? 100
    : Math.max(0, 100 - dashboard.overloadedPeople.length * 15)

  if (dashboard.criticalRolesWithoutBackup.length > 0) {
    recommendations.push(`${dashboard.criticalRolesWithoutBackup.length} critical roles without backup. Designate successors.`)
  }
  if (dashboard.overloadedPeople.length > 0) {
    recommendations.push(`${dashboard.overloadedPeople.length} people are overloaded. Redistribute workload.`)
  }
  if (dashboard.healthSummary.certificationCompliance < 80) {
    recommendations.push('Certification compliance below 80%. Review expired certifications.')
  }
  if (dashboard.healthSummary.cvCompleteness < 90) {
    recommendations.push('CV completeness below 90%. Ensure all research staff have current CVs uploaded.')
  }

  const overall = Math.round(
    (dashboard.healthSummary.certificationCompliance +
      dashboard.healthSummary.trainingCompliance +
      dashboard.healthSummary.licenseCompliance +
      dashboard.healthSummary.cvCompleteness +
      successionHealth +
      capacityHealth) / 6
  )

  return {
    institutionId: profiles[0]?.institutionId ?? '',
    calculatedAt: new Date().toISOString(),
    scores: {
      certificationHealth: dashboard.healthSummary.certificationCompliance,
      trainingHealth: dashboard.healthSummary.trainingCompliance,
      licenseHealth: dashboard.healthSummary.licenseCompliance,
      documentationHealth: dashboard.healthSummary.cvCompleteness,
      successionHealth,
      capacityHealth,
      overall,
    },
    criticalGaps: dashboard.risks.filter((r) => r.severity === 'critical'),
    recommendations,
  }
}

// ==========================================================================
// EXPORTS
// ==========================================================================

export const PEOPLE_INTELLIGENCE = {
  computePersonMetrics,
  detectPeopleRisks,
  buildPeopleDashboard,
  calculatePeopleHealth,
}
