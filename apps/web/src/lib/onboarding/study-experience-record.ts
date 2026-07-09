// ==========================================================================
// KTP-1.4 — Study Experience Record
// ==========================================================================
// Canonical entity for recording individual study participation history.
// Replaces free-text institutional memory with structured, verifiable records
// that connect to ClinicalTrials.gov, documents, claims, and evidence nodes.
//
// Design principles:
//   - Each study is a separate record — not a text field
//   - External anchors (NCT, protocol) are first-class fields
//   - Evidence status is per-component, not per-study
//   - Enrollment is self-reported by default
//   - No global "verified" label
// ==========================================================================

// --------------------------------------------------------------------------
// Component-level evidence status
// --------------------------------------------------------------------------

export type ComponentEvidenceStatus =
  | 'EXTERNALLY_CORROBORATED'   // Third-party confirmation (NCT, sponsor letter, lab)
  | 'DOCUMENT_SUPPORTED'         // Internal document uploaded (IRB letter, SIV, closeout)
  | 'ANCHORED'                   // Linked to external identifier (NCT) but not yet corroborated
  | 'SELF_REPORTED'              // Institution declaration only
  | 'UNKNOWN'                    // Not yet collected
  | 'NOT_APPLICABLE'             // Does not apply to this study

export const COMPONENT_LABELS: Record<ComponentEvidenceStatus, string> = {
  EXTERNALLY_CORROBORATED: 'Externally corroborated',
  DOCUMENT_SUPPORTED: 'Document-supported',
  ANCHORED: 'Anchored to external source',
  SELF_REPORTED: 'Self-reported',
  UNKNOWN: 'Not yet collected',
  NOT_APPLICABLE: 'Not applicable',
}

// --------------------------------------------------------------------------
// Study components that can be independently evidenced
// --------------------------------------------------------------------------

export type StudyComponent =
  | 'study_existence'
  | 'site_participation'
  | 'site_irb_approval'
  | 'operational_execution'
  | 'enrollment_performance'
  | 'biospecimen_handling'

export const STUDY_COMPONENT_LABELS: Record<StudyComponent, string> = {
  study_existence: 'Study existence',
  site_participation: 'Site participation',
  site_irb_approval: 'Site IRB approval',
  operational_execution: 'Operational execution',
  enrollment_performance: 'Enrollment / performance',
  biospecimen_handling: 'Biospecimen / sample handling',
}

// --------------------------------------------------------------------------
// Document types that can be attached per study
// --------------------------------------------------------------------------

export type StudyDocumentType =
  | 'irb_approval_letter'
  | 'activation_letter'
  | 'siv_report'
  | 'delegation_log'
  | 'form_1572'
  | 'closeout_letter'
  | 'lab_manual'
  | 'shipment_logs'
  | 'enrollment_summary'
  | 'sponsor_correspondence'
  | 'cro_correspondence'
  | 'protocol_document'
  | 'informed_consent'
  | 'other'

export const STUDY_DOCUMENT_LABELS: Record<StudyDocumentType, string> = {
  irb_approval_letter: 'IRB Approval Letter',
  activation_letter: 'Site Activation Letter',
  siv_report: 'Site Initiation Visit Report',
  delegation_log: 'Delegation of Authority Log',
  form_1572: 'Form FDA 1572',
  closeout_letter: 'Site Closeout Letter',
  lab_manual: 'Laboratory Manual',
  shipment_logs: 'Shipment / Transport Logs',
  enrollment_summary: 'Enrollment Summary Report',
  sponsor_correspondence: 'Sponsor Correspondence',
  cro_correspondence: 'CRO Correspondence',
  protocol_document: 'Protocol / Synopsis',
  informed_consent: 'Informed Consent Form',
  other: 'Other Study Document',
}

// --------------------------------------------------------------------------
// Study Experience Record
// --------------------------------------------------------------------------

export interface StudyExperienceRecord {
  /** Unique ID for this record */
  id: string

  // Study identity
  studyTitle: string
  protocolNumber: string
  clinicaltrialsGovNct: string | null
  sponsorName: string | null
  croName: string | null

  // Study classification
  indication: string | null
  phase: 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV' | 'Observational' | 'Device' | 'Other' | null
  studyType: 'Interventional' | 'Observational' | 'Registry' | 'Expanded Access' | null
  therapeuticArea: string | null

  // Dates
  siteActivationDate: string | null
  siteCloseoutDate: string | null

  // Site status
  siteStatus: 'active' | 'completed' | 'terminated' | 'suspended' | 'in_startup' | null

  // Enrollment (self-reported by default)
  enrollmentTarget: number | null
  enrollmentScreenedReported: number | null
  enrollmentEnrolledReported: number | null
  enrollmentCompletedReported: number | null

  // Location & PI
  locationId: string | null
  principalInvestigatorId: string | null

  // Documents attached
  documents: StudyExperienceDocument[]

  // Derived evidence status per component
  evidenceStatus: Record<StudyComponent, ComponentEvidenceStatus>

  // When this record was created/updated
  createdAt: string
  updatedAt: string
}

export interface StudyExperienceDocument {
  id: string
  documentType: StudyDocumentType
  label: string
  /** Reference to an uploaded document in onboarding store */
  uploadedDocLabel: string | null
  /** Whether this document has been physically uploaded */
  isUploaded: boolean
  /** Whether this document is pending upload */
  isPending: boolean
  /** When the document was issued (for freshness tracking) */
  effectiveDate: string | null
  /** When the document expires (e.g., IRB approval period) */
  expirationDate: string | null
  /** Review status */
  reviewStatus: 'not_reviewed' | 'under_review' | 'accepted' | 'rejected' | null
  /** Which components this document supports */
  componentsSupported: StudyComponent[]
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

let recordCounter = 0

export function createStudyExperienceRecord(overrides: Partial<StudyExperienceRecord> = {}): StudyExperienceRecord {
  const now = new Date().toISOString()
  recordCounter++
  return {
    id: `study-exp-${Date.now()}-${recordCounter}`,
    studyTitle: '',
    protocolNumber: '',
    clinicaltrialsGovNct: null,
    sponsorName: null,
    croName: null,
    indication: null,
    phase: null,
    studyType: null,
    therapeuticArea: null,
    siteActivationDate: null,
    siteCloseoutDate: null,
    siteStatus: null,
    enrollmentTarget: null,
    enrollmentScreenedReported: null,
    enrollmentEnrolledReported: null,
    enrollmentCompletedReported: null,
    locationId: null,
    principalInvestigatorId: null,
    documents: [],
    evidenceStatus: {
      study_existence: 'UNKNOWN',
      site_participation: 'UNKNOWN',
      site_irb_approval: 'UNKNOWN',
      operational_execution: 'UNKNOWN',
      enrollment_performance: 'UNKNOWN',
      biospecimen_handling: 'UNKNOWN',
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// --------------------------------------------------------------------------
// Classification engine
// --------------------------------------------------------------------------

/**
 * Classify evidence status for each study component based on available data.
 * Called whenever a study record is created or modified.
 */
export function classifyStudyEvidence(record: StudyExperienceRecord): Record<StudyComponent, ComponentEvidenceStatus> {
  const status: Record<StudyComponent, ComponentEvidenceStatus> = {
    study_existence: 'UNKNOWN',
    site_participation: 'UNKNOWN',
    site_irb_approval: 'UNKNOWN',
    operational_execution: 'UNKNOWN',
    enrollment_performance: 'UNKNOWN',
    biospecimen_handling: 'UNKNOWN',
  }

  // Study existence: anchored by NCT
  if (record.clinicaltrialsGovNct && record.clinicaltrialsGovNct.trim().length > 0) {
    status.study_existence = 'ANCHORED'
  } else if (record.studyTitle && record.protocolNumber) {
    status.study_existence = 'SELF_REPORTED'
  }

  // Site participation: check for site-listed NCT, IRB letter, activation, SIV, closeout, sponsor/CRO correspondence
  const hasIrbLetter = record.documents.some(d =>
    d.documentType === 'irb_approval_letter' && d.isUploaded
  )
  const hasActivationLetter = record.documents.some(d =>
    d.documentType === 'activation_letter' && d.isUploaded
  )
  const hasSivReport = record.documents.some(d =>
    d.documentType === 'siv_report' && d.isUploaded
  )
  const hasCloseoutLetter = record.documents.some(d =>
    d.documentType === 'closeout_letter' && d.isUploaded
  )
  const hasSponsorCorrespondence = record.documents.some(d =>
    (d.documentType === 'sponsor_correspondence' || d.documentType === 'cro_correspondence') && d.isUploaded
  )
  const hasForm1572 = record.documents.some(d =>
    d.documentType === 'form_1572' && d.isUploaded
  )

  if (hasSponsorCorrespondence) {
    status.site_participation = 'EXTERNALLY_CORROBORATED'
  } else if (hasIrbLetter || hasActivationLetter || hasCloseoutLetter || hasForm1572) {
    status.site_participation = 'DOCUMENT_SUPPORTED'
  } else if (record.clinicaltrialsGovNct) {
    status.site_participation = 'ANCHORED' // NCT exists but no site-specific docs
  } else if (record.siteStatus) {
    status.site_participation = 'SELF_REPORTED'
  }

  // Site IRB approval
  if (hasIrbLetter) {
    status.site_irb_approval = 'DOCUMENT_SUPPORTED'
  }

  // Operational execution: activation, SIV, delegation, closeout
  const hasDelegationLog = record.documents.some(d =>
    d.documentType === 'delegation_log' && d.isUploaded
  )
  if ((hasActivationLetter || hasSivReport) && hasCloseoutLetter) {
    status.operational_execution = 'DOCUMENT_SUPPORTED'
  } else if (hasActivationLetter || hasSivReport || hasDelegationLog || hasCloseoutLetter) {
    status.operational_execution = 'DOCUMENT_SUPPORTED'
  } else if (record.siteStatus === 'completed') {
    status.operational_execution = 'SELF_REPORTED'
  }

  // Enrollment: self-reported by default, document-supported if enrollment summary uploaded,
  // externally corroborated only with sponsor/CRO confirmation
  const hasEnrollmentSummary = record.documents.some(d =>
    d.documentType === 'enrollment_summary' && d.isUploaded
  )
  const hasEnrollmentData =
    record.enrollmentEnrolledReported !== null ||
    record.enrollmentScreenedReported !== null ||
    record.enrollmentCompletedReported !== null

  if (hasSponsorCorrespondence && hasEnrollmentData) {
    status.enrollment_performance = 'EXTERNALLY_CORROBORATED'
  } else if (hasEnrollmentSummary) {
    status.enrollment_performance = 'DOCUMENT_SUPPORTED'
  } else if (hasEnrollmentData) {
    status.enrollment_performance = 'SELF_REPORTED'
  }

  // Biospecimen handling: lab manual, shipment logs, protocol docs
  const hasLabManual = record.documents.some(d =>
    d.documentType === 'lab_manual' && d.isUploaded
  )
  const hasShipmentLogs = record.documents.some(d =>
    d.documentType === 'shipment_logs' && d.isUploaded
  )

  if (hasLabManual && hasShipmentLogs) {
    status.biospecimen_handling = 'DOCUMENT_SUPPORTED'
  } else if (hasLabManual || hasShipmentLogs) {
    status.biospecimen_handling = 'DOCUMENT_SUPPORTED'
  }
  // No self-reported fallback — biospecimen handling requires documentation

  // Mark NOT_APPLICABLE where appropriate
  if (!record.clinicaltrialsGovNct && !record.studyTitle) {
    // No study data at all
    for (const key of Object.keys(status) as StudyComponent[]) {
      if (status[key] === 'UNKNOWN') status[key] = 'UNKNOWN'
    }
  }

  return status
}

// --------------------------------------------------------------------------
// Derived claims
// --------------------------------------------------------------------------

export interface StudyExperienceClaim {
  claimId: string
  claimLabel: string
  /** Evidence status for this claim */
  evidenceStatus: ComponentEvidenceStatus
  /** Which studies support this claim */
  supportedByStudies: string[]
  /** Number of studies contributing */
  studyCount: number
}

/**
 * Derive aggregate claims from a set of study records.
 */
export function deriveStudyExperienceClaims(
  records: StudyExperienceRecord[],
): StudyExperienceClaim[] {
  const active = records.filter(r => r.studyTitle || r.protocolNumber || r.clinicaltrialsGovNct)

  return [
    {
      claimId: 'study.participation',
      claimLabel: 'Study Participation History',
      evidenceStatus: aggregateStatus(active, 'site_participation'),
      supportedByStudies: active.filter(r =>
        r.evidenceStatus.site_participation !== 'UNKNOWN' &&
        r.evidenceStatus.site_participation !== 'NOT_APPLICABLE'
      ).map(r => r.protocolNumber || r.clinicaltrialsGovNct || r.studyTitle),
      studyCount: active.length,
    },
    {
      claimId: 'regulatory.irb_pathway_executed',
      claimLabel: 'IRB Regulatory Pathway Executed',
      evidenceStatus: aggregateStatus(active, 'site_irb_approval'),
      supportedByStudies: active.filter(r =>
        r.evidenceStatus.site_irb_approval === 'DOCUMENT_SUPPORTED'
      ).map(r => r.protocolNumber || r.clinicaltrialsGovNct || r.studyTitle),
      studyCount: active.filter(r => r.evidenceStatus.site_irb_approval === 'DOCUMENT_SUPPORTED').length,
    },
    {
      claimId: 'patient_recruitment.enrollment_history',
      claimLabel: 'Patient Enrollment History',
      evidenceStatus: aggregateStatus(active, 'enrollment_performance'),
      supportedByStudies: active.filter(r =>
        r.evidenceStatus.enrollment_performance !== 'UNKNOWN' &&
        r.evidenceStatus.enrollment_performance !== 'NOT_APPLICABLE'
      ).map(r => r.protocolNumber || r.clinicaltrialsGovNct || r.studyTitle),
      studyCount: active.filter(r =>
        r.enrollmentEnrolledReported !== null || r.enrollmentCompletedReported !== null
      ).length,
    },
    {
      claimId: 'biospecimen.study_handling_experience',
      claimLabel: 'Biospecimen Handling in Studies',
      evidenceStatus: aggregateStatus(active, 'biospecimen_handling'),
      supportedByStudies: active.filter(r =>
        r.evidenceStatus.biospecimen_handling === 'DOCUMENT_SUPPORTED'
      ).map(r => r.protocolNumber || r.clinicaltrialsGovNct || r.studyTitle),
      studyCount: active.filter(r =>
        r.evidenceStatus.biospecimen_handling === 'DOCUMENT_SUPPORTED'
      ).length,
    },
    {
      claimId: 'closeout.completed',
      claimLabel: 'Study Closeout Completed',
      evidenceStatus: active.some(r =>
        r.evidenceStatus.operational_execution === 'DOCUMENT_SUPPORTED'
      ) ? 'DOCUMENT_SUPPORTED' : active.some(r => r.siteStatus === 'completed')
        ? 'SELF_REPORTED' : 'UNKNOWN',
      supportedByStudies: active.filter(r =>
        r.siteStatus === 'completed' || r.evidenceStatus.operational_execution === 'DOCUMENT_SUPPORTED'
      ).map(r => r.protocolNumber || r.clinicaltrialsGovNct || r.studyTitle),
      studyCount: active.filter(r => r.siteStatus === 'completed').length,
    },
  ]
}

function aggregateStatus(
  records: StudyExperienceRecord[],
  component: StudyComponent,
): ComponentEvidenceStatus {
  const statuses = records
    .map(r => r.evidenceStatus[component])
    .filter(s => s !== 'UNKNOWN' && s !== 'NOT_APPLICABLE')

  if (statuses.length === 0) return 'UNKNOWN'

  // Best status wins
  if (statuses.includes('EXTERNALLY_CORROBORATED')) return 'EXTERNALLY_CORROBORATED'
  if (statuses.includes('DOCUMENT_SUPPORTED')) return 'DOCUMENT_SUPPORTED'
  if (statuses.includes('ANCHORED')) return 'ANCHORED'
  return 'SELF_REPORTED'
}


// ==========================================================================
// KTP-1.4 — Historical Performance Signals
// ==========================================================================
// Derived signals from StudyExperienceRecords that serve as reusable inputs
// for future readiness engines, capability assessment, and protocol matching.
//
// IMPORTANT: These signals are INPUTS for future matching, NOT automatic
// matches. They do not produce rankings, scores, or fit determinations.
// Each signal preserves its evidence basis and limitations.
// ==========================================================================

export type SignalEvidenceBasis =
  | 'SELF_REPORTED'
  | 'DOCUMENT_SUPPORTED'
  | 'EXTERNALLY_CORROBORATED'
  | 'UNKNOWN'

export type StudyComplexityTier = 'low' | 'medium' | 'high' | 'unknown'
export type BiospecimenIntensityTier = 'none' | 'low' | 'moderate' | 'high' | 'unknown'
export type EnrollmentOutcomeBand = 'none_reported' | 'low' | 'moderate' | 'high' | 'unknown'
export type StartupEvidenceStatus = 'missing' | 'partial' | 'document_supported' | 'externally_corroborated'
export type SiteRoleCertainty = 'self_reported' | 'anchored' | 'document_supported' | 'externally_corroborated'

export interface TherapeuticAreaSignal {
  area: string
  studyCount: number
  evidenceBasis: SignalEvidenceBasis
}

export interface PhaseExperienceSignal {
  phase: string
  studyCount: number
  evidenceBasis: SignalEvidenceBasis
}

export interface SponsorRelationshipSignal {
  sponsorName: string
  studyCount: number
  evidenceBasis: SignalEvidenceBasis
}

export interface HistoricalPerformanceSignals {
  therapeuticAreaExperience: TherapeuticAreaSignal[]
  phaseExperience: PhaseExperienceSignal[]
  sponsorRelationshipHistory: SponsorRelationshipSignal[]
  studyComplexityTier: StudyComplexityTier
  biospecimenIntensityTier: BiospecimenIntensityTier
  enrollmentOutcomeBand: EnrollmentOutcomeBand
  startupEvidenceStatus: StartupEvidenceStatus
  siteRoleCertainty: SiteRoleCertainty
  executionPatternTags: string[]
  totalStudies: number
  externallyCorroboratedCount: number
  documentSupportedCount: number
  selfReportedOnlyCount: number
  limitations: string[]
}

/**
 * Derive historical performance signals from study experience records.
 * All signals preserve their evidence basis. Self-reported data is
 * explicitly marked and should not drive high-confidence matching.
 */
export function deriveHistoricalPerformanceSignals(
  records: StudyExperienceRecord[],
): HistoricalPerformanceSignals {
  const active = records.filter(r => r.studyTitle || r.protocolNumber || r.clinicaltrialsGovNct)

  // Therapeutic area experience
  const taMap = new Map<string, { count: number; basis: SignalEvidenceBasis }>()
  for (const r of active) {
    if (!r.indication && !r.therapeuticArea) continue
    const area = r.indication || r.therapeuticArea || 'Unspecified'
    const existing = taMap.get(area)
    const basis = signalBasis(r)
    if (!existing) {
      taMap.set(area, { count: 1, basis })
    } else {
      taMap.set(area, { count: existing.count + 1, basis: bestSignalBasis(existing.basis, basis) })
    }
  }
  const therapeuticAreaExperience: TherapeuticAreaSignal[] = Array.from(taMap.entries())
    .map(([area, v]) => ({ area, studyCount: v.count, evidenceBasis: v.basis }))
    .sort((a, b) => b.studyCount - a.studyCount)

  // Phase experience
  const phaseMap = new Map<string, { count: number; basis: SignalEvidenceBasis }>()
  for (const r of active) {
    if (!r.phase) continue
    const existing = phaseMap.get(r.phase)
    const basis = signalBasis(r)
    if (!existing) {
      phaseMap.set(r.phase, { count: 1, basis })
    } else {
      phaseMap.set(r.phase, { count: existing.count + 1, basis: bestSignalBasis(existing.basis, basis) })
    }
  }
  const phaseExperience: PhaseExperienceSignal[] = Array.from(phaseMap.entries())
    .map(([phase, v]) => ({ phase, studyCount: v.count, evidenceBasis: v.basis }))

  // Sponsor relationship history
  const sponsorMap = new Map<string, { count: number; basis: SignalEvidenceBasis }>()
  for (const r of active) {
    const name = r.sponsorName || r.croName
    if (!name) continue
    const existing = sponsorMap.get(name)
    const basis = signalBasis(r)
    if (!existing) {
      sponsorMap.set(name, { count: 1, basis })
    } else {
      sponsorMap.set(name, { count: existing.count + 1, basis: bestSignalBasis(existing.basis, basis) })
    }
  }
  const sponsorRelationshipHistory: SponsorRelationshipSignal[] = Array.from(sponsorMap.entries())
    .map(([sponsorName, v]) => ({ sponsorName, studyCount: v.count, evidenceBasis: v.basis }))

  // Aggregate signals
  const studyComplexityTier = computeComplexityTier(active)
  const biospecimenIntensityTier = computeBiospecimenIntensity(active)
  const enrollmentOutcomeBand = computeEnrollmentBand(active)
  const startupEvidenceStatus = computeStartupStatus(active)
  const siteRoleCertainty = computeSiteRoleCertainty(active)
  const executionPatternTags = computeExecutionTags(active)

  const externallyCorroboratedCount = active.filter(r =>
    r.evidenceStatus.site_participation === 'EXTERNALLY_CORROBORATED'
  ).length
  const documentSupportedCount = active.filter(r =>
    r.evidenceStatus.site_participation === 'DOCUMENT_SUPPORTED' || r.evidenceStatus.operational_execution === 'DOCUMENT_SUPPORTED'
  ).length
  const selfReportedOnlyCount = active.filter(r =>
    r.evidenceStatus.site_participation === 'SELF_REPORTED' && r.documents.every(d => !d.isUploaded)
  ).length

  const limitations: string[] = []
  if (selfReportedOnlyCount > 0) {
    limitations.push(selfReportedOnlyCount + ' studies are self-reported only. Upload documents to strengthen evidence.')
  }
  if (active.some(r => r.evidenceStatus.enrollment_performance === 'SELF_REPORTED')) {
    limitations.push('Enrollment data is self-reported. Sponsor/CRO confirmation required for externally corroborated enrollment.')
  }
  limitations.push('These signals are inputs for future matching. They do not determine protocol fit. Site qualification requires protocol-specific assessment.')
  if (active.length === 0) {
    limitations.push('No studies recorded. Add study experience to generate historical performance signals.')
  }

  return {
    therapeuticAreaExperience, phaseExperience, sponsorRelationshipHistory,
    studyComplexityTier, biospecimenIntensityTier, enrollmentOutcomeBand,
    startupEvidenceStatus, siteRoleCertainty, executionPatternTags,
    totalStudies: active.length, externallyCorroboratedCount,
    documentSupportedCount, selfReportedOnlyCount, limitations,
  }
}

function signalBasis(r: StudyExperienceRecord): SignalEvidenceBasis {
  if (r.evidenceStatus.site_participation === 'EXTERNALLY_CORROBORATED') return 'EXTERNALLY_CORROBORATED'
  if (r.evidenceStatus.site_participation === 'DOCUMENT_SUPPORTED') return 'DOCUMENT_SUPPORTED'
  return 'SELF_REPORTED'
}

function bestSignalBasis(a: SignalEvidenceBasis, b: SignalEvidenceBasis): SignalEvidenceBasis {
  const order: SignalEvidenceBasis[] = ['EXTERNALLY_CORROBORATED', 'DOCUMENT_SUPPORTED', 'SELF_REPORTED', 'UNKNOWN']
  for (const o of order) { if (o === a || o === b) return o }
  return 'UNKNOWN'
}

function computeComplexityTier(records: StudyExperienceRecord[]): StudyComplexityTier {
  if (records.length === 0) return 'unknown'
  const hasPhaseI = records.some(r => r.phase === 'Phase I')
  const hasPhaseIII = records.some(r => r.phase === 'Phase III')
  const hasDevice = records.some(r => r.phase === 'Device')
  const hasMultiSite = records.length >= 5
  if ((hasPhaseI && hasPhaseIII) || (hasPhaseI && hasMultiSite)) return 'high'
  if (hasPhaseIII || hasDevice || records.length >= 3) return 'medium'
  return 'low'
}

function computeBiospecimenIntensity(records: StudyExperienceRecord[]): BiospecimenIntensityTier {
  if (records.length === 0) return 'unknown'
  const bioStudies = records.filter(r =>
    r.evidenceStatus.biospecimen_handling === 'DOCUMENT_SUPPORTED' ||
    r.documents.some(d => d.documentType === 'lab_manual' || d.documentType === 'shipment_logs')
  )
  if (bioStudies.length >= 3) return 'high'
  if (bioStudies.length >= 1) return 'moderate'
  const hasBioKeywords = records.some(r =>
    (r.studyTitle || '').toLowerCase().includes('biospecimen') ||
    (r.studyTitle || '').toLowerCase().includes('sample')
  )
  if (hasBioKeywords) return 'low'
  return 'none'
}

function computeEnrollmentBand(records: StudyExperienceRecord[]): EnrollmentOutcomeBand {
  if (records.length === 0) return 'unknown'
  const withEnrollment = records.filter(r => r.enrollmentEnrolledReported !== null)
  if (withEnrollment.length === 0) return 'none_reported'
  const totalEnrolled = withEnrollment.reduce((s, r) => s + (r.enrollmentEnrolledReported || 0), 0)
  if (totalEnrolled >= 100) return 'high'
  if (totalEnrolled >= 30) return 'moderate'
  return 'low'
}

function computeStartupStatus(records: StudyExperienceRecord[]): StartupEvidenceStatus {
  if (records.length === 0) return 'missing'
  const withStartup = records.filter(r =>
    r.evidenceStatus.operational_execution === 'DOCUMENT_SUPPORTED' ||
    r.evidenceStatus.operational_execution === 'EXTERNALLY_CORROBORATED'
  )
  if (withStartup.length >= records.length * 0.5) {
    return withStartup.some(r => r.evidenceStatus.operational_execution === 'EXTERNALLY_CORROBORATED')
      ? 'externally_corroborated' : 'document_supported'
  }
  if (withStartup.length > 0) return 'partial'
  return 'missing'
}

function computeSiteRoleCertainty(records: StudyExperienceRecord[]): SiteRoleCertainty {
  if (records.length === 0) return 'self_reported'
  const best = aggregateStatus(records, 'site_participation')
  if (best === 'EXTERNALLY_CORROBORATED') return 'externally_corroborated'
  if (best === 'DOCUMENT_SUPPORTED') return 'document_supported'
  if (best === 'ANCHORED') return 'anchored'
  return 'self_reported'
}

function computeExecutionTags(records: StudyExperienceRecord[]): string[] {
  const tags = new Set<string>()
  for (const r of records) {
    if (r.studyType === 'Interventional') tags.add('interventional')
    if (r.studyType === 'Observational') tags.add('observational')
    if (r.phase === 'Phase I') tags.add('early_phase')
    if (r.phase === 'Phase III' || r.phase === 'Phase IV') tags.add('late_phase')
    if (r.evidenceStatus.biospecimen_handling === 'DOCUMENT_SUPPORTED') tags.add('biospecimen_heavy')
    if (r.documents.some(d => d.documentType === 'lab_manual')) tags.add('lab_involved')
    if (r.documents.some(d => d.documentType === 'shipment_logs')) tags.add('shipping_involved')
    if (r.phase === 'Device') tags.add('device_ivd')
    if (r.enrollmentEnrolledReported !== null && r.enrollmentEnrolledReported >= 50) tags.add('high_enrollment')
  }
  return Array.from(tags)
}


// ==========================================================================
// KTP-1.4 — Study Experience → Evidence Core Bridge
// ==========================================================================
// Connects StudyExperienceDocuments to real Evidence Nodes with provenance.
// Generates structured payloads ready for DB persistence when available.

export type DocumentSupportLevel =
  | 'FULL_SUPPORT'
  | 'PARTIAL_SUPPORT'
  | 'CONTEXTUAL_SUPPORT'
  | 'PENDING_REVIEW'
  | 'REFERENCED_ONLY'

export interface StudyExperienceEvidenceLink {
  studyExperienceRecordId: string
  studyDocumentId: string
  uploadedDocLabel: string | null
  evidenceNodeId: string | null
  supportedComponent: StudyComponent
  supportLevel: DocumentSupportLevel
  evidenceBasis: SignalEvidenceBasis
  reviewStatus: 'not_reviewed' | 'under_review' | 'accepted' | 'rejected'
  limitations: string[]
}

export interface StudyEvidenceNodePayload {
  proposedId: string
  claimId: string
  evidenceClass: 'B' | 'C'
  content: string
  source: string
  sourceType: 'institution_upload' | 'sponsor_correspondence' | 'public_registry_anchor'
  effectiveDate: string | null
  captureDate: string
  studyExperienceRecordId: string
  studyDocumentId: string
  supportedComponent: StudyComponent
  organizationId: string | null
  assertedBy: string | null
  provenanceSummary: string
  readyForPersistence: boolean
  warnings: string[]
}

export const DOCUMENT_COMPONENT_MAP: Record<StudyDocumentType, {
  components: StudyComponent[]
  supportLevel: DocumentSupportLevel
  evidenceBasis: SignalEvidenceBasis
}> = {
  irb_approval_letter:    { components: ['site_irb_approval', 'site_participation'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  activation_letter:      { components: ['operational_execution', 'site_participation'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  siv_report:             { components: ['operational_execution'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  delegation_log:         { components: ['operational_execution'], supportLevel: 'PARTIAL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  form_1572:              { components: ['site_participation'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  closeout_letter:        { components: ['operational_execution'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  lab_manual:             { components: ['biospecimen_handling', 'operational_execution'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  shipment_logs:          { components: ['biospecimen_handling'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  enrollment_summary:     { components: ['enrollment_performance'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  sponsor_correspondence: { components: ['site_participation'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'EXTERNALLY_CORROBORATED' },
  cro_correspondence:     { components: ['site_participation'], supportLevel: 'FULL_SUPPORT', evidenceBasis: 'EXTERNALLY_CORROBORATED' },
  protocol_document:      { components: ['operational_execution'], supportLevel: 'CONTEXTUAL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  informed_consent:       { components: ['site_irb_approval'], supportLevel: 'CONTEXTUAL_SUPPORT', evidenceBasis: 'DOCUMENT_SUPPORTED' },
  other:                  { components: [], supportLevel: 'PENDING_REVIEW', evidenceBasis: 'DOCUMENT_SUPPORTED' },
}

export function generateStudyEvidenceNodePayloads(
  record: StudyExperienceRecord,
  organizationId: string | null = null,
  assertedBy: string | null = null,
): StudyEvidenceNodePayload[] {
  const payloads: StudyEvidenceNodePayload[] = []
  const captureDate = new Date().toISOString()

  for (const doc of record.documents) {
    if (!doc.isUploaded) continue
    const mapping = DOCUMENT_COMPONENT_MAP[doc.documentType]
    if (!mapping || mapping.components.length === 0) {
      payloads.push({
        proposedId: 'ev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        claimId: '', evidenceClass: 'B', content: doc.label,
        source: 'study_experience_record', sourceType: 'institution_upload',
        effectiveDate: doc.effectiveDate, captureDate,
        studyExperienceRecordId: record.id, studyDocumentId: doc.id,
        supportedComponent: 'operational_execution',
        organizationId, assertedBy,
        provenanceSummary: 'Document pending component classification.',
        readyForPersistence: false,
        warnings: ['Document type not mapped to any study component.'],
      })
      continue
    }
    for (const component of mapping.components) {
      const claimId = componentToClaimId(component)
      const warnings: string[] = []
      if (doc.documentType === 'irb_approval_letter' && component === 'enrollment_performance') {
        warnings.push('IRB approval letter does not prove enrollment performance.')
      }
      payloads.push({
        proposedId: 'ev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        claimId,
        evidenceClass: (doc.documentType === 'enrollment_summary' || doc.documentType === 'sponsor_correspondence') ? 'C' : 'B',
        content: STUDY_DOCUMENT_LABELS[doc.documentType] + ' for ' + (record.protocolNumber || record.studyTitle),
        source: record.clinicaltrialsGovNct ? 'Study ' + record.clinicaltrialsGovNct + ' - ' + doc.label : 'Study ' + record.protocolNumber + ' - ' + doc.label,
        sourceType: mapping.evidenceBasis === 'EXTERNALLY_CORROBORATED' ? 'sponsor_correspondence' : 'institution_upload',
        effectiveDate: doc.effectiveDate, captureDate,
        studyExperienceRecordId: record.id, studyDocumentId: doc.id,
        supportedComponent: component, organizationId, assertedBy,
        provenanceSummary: STUDY_DOCUMENT_LABELS[doc.documentType] + ' for study ' + (record.protocolNumber || record.clinicaltrialsGovNct || record.studyTitle) + '. Supports ' + STUDY_COMPONENT_LABELS[component] + '.',
        readyForPersistence: true, warnings,
      })
    }
  }
  return payloads
}

export function createStudyEvidenceLinks(
  record: StudyExperienceRecord,
): StudyExperienceEvidenceLink[] {
  return record.documents.flatMap(doc => {
    const mapping = DOCUMENT_COMPONENT_MAP[doc.documentType]
    const components = mapping?.components || []
    return components.map(component => ({
      studyExperienceRecordId: record.id, studyDocumentId: doc.id,
      uploadedDocLabel: doc.uploadedDocLabel, evidenceNodeId: null,
      supportedComponent: component,
      supportLevel: (!doc.isUploaded ? 'REFERENCED_ONLY' : mapping?.supportLevel || 'PENDING_REVIEW') as DocumentSupportLevel,
      evidenceBasis: (!doc.isUploaded ? 'SELF_REPORTED' : mapping?.evidenceBasis || 'DOCUMENT_SUPPORTED') as SignalEvidenceBasis,
      reviewStatus: (doc.reviewStatus || 'not_reviewed') as 'not_reviewed',
      limitations: !doc.isUploaded ? ['Document referenced but not yet uploaded.'] : [],
    }))
  })
}

function componentToClaimId(component: StudyComponent): string {
  const m: Record<StudyComponent, string> = {
    study_existence: 'study.existence',
    site_participation: 'study.participation',
    site_irb_approval: 'regulatory.irb_pathway_executed',
    operational_execution: 'startup.activation_experience',
    enrollment_performance: 'patient_recruitment.enrollment_history',
    biospecimen_handling: 'biospecimen.study_handling_experience',
  }
  return m[component] || 'study.participation'
}
