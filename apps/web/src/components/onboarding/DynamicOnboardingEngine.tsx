'use client'

// ==========================================================================
// DynamicOnboardingEngine — Rules-engine-driven onboarding module activator.
//
// Reads the institution type from profile context, activates the applicable
// sections per onboarding-rules.yml, skips N/A sections, allows UNKNOWN and
// NOT_APPLICABLE values, creates structured facts (not auto-published claims),
// tracks progress per dimension, and enforces max 10 sections/session.
//
// Schema: onboarding-rules/v1 (specs/site-profile/onboarding-rules.yml)
// Dark theme (Qdrant style): bg #131722, accent #8b86e5, Inter font.
// ==========================================================================

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { useOnboarding } from '@/lib/onboarding/onboarding-context'
import type { OnboardingDomain } from '@/lib/onboarding/onboarding-journey'
import { ONBOARDING_JOURNEY } from '@/lib/onboarding/onboarding-journey'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Institution type keys from onboarding-rules.yml */
export type InstitutionTypeKey =
  | 'clinical_research_site'
  | 'community_research_site'
  | 'phase1_unit'
  | 'central_laboratory'
  | 'biorepository'
  | 'biospecimen_collection_site'
  | 'diagnostics_ivd_lab'
  | 'specialty_practice'
  | 'processing_laboratory'
  | 'imaging_center'
  | 'recruitment_network'
  | 'technology_data_provider'

/** Section keys used in the rules engine */
export type OnboardingSectionKey =
  | 'organization'
  | 'locations'
  | 'people'
  | 'infrastructure'
  | 'equipment'
  | 'capabilities'
  | 'claims'
  | 'pharmacy'
  | 'biospecimen'
  | 'imaging'
  | 'lab_infrastructure'
  | 'phase1_unit'
  | 'patient_recruitment'
  | 'clinical_trials_experience'
  | 'technology_systems'

/** Evidence expectation tier */
export type EvidenceExpectation =
  | 'standard_clinical'
  | 'community_based'
  | 'phase1_enhanced'
  | 'lab_intensive'
  | 'storage_focused'
  | 'collection_focused'
  | 'diagnostics_focused'
  | 'practice_based'
  | 'processing_intensive'
  | 'imaging_focused'
  | 'recruitment_focused'
  | 'technology_focused'

/** Activation state for a section */
export type SectionActivation = 'required' | 'conditional' | 'not_applicable' | 'inactive'

/** Answer state per field */
export type AnswerValue = string | string[] | boolean | null

export type AnswerConfidence = 'confirmed' | 'declared' | 'unknown' | 'not_applicable'

export interface StructuredFact {
  id: string
  section: OnboardingSectionKey
  fieldKey: string
  value: AnswerValue
  confidence: AnswerConfidence
  label: string
  createdAt: string
  dimension: ProgressDimension
}

/** Progress dimension for per-dimension tracking */
export type ProgressDimension =
  | 'identity'
  | 'operations'
  | 'clinical'
  | 'infrastructure'
  | 'quality'
  | 'capabilities'

export interface DimensionProgress {
  dimension: ProgressDimension
  label: string
  completedFields: number
  totalFields: number
  percentage: number
}

export interface SectionState {
  key: OnboardingSectionKey
  activation: SectionActivation
  label: string
  dimension: ProgressDimension
  fields: SectionField[]
  answers: Record<string, AnswerValue>
  confidences: Record<string, AnswerConfidence>
}

export interface SectionField {
  key: string
  label: string
  type: 'text' | 'select' | 'multi-select' | 'boolean' | 'textarea'
  required: boolean
  options?: string[]
}

/** Institution type rules (from onboarding-rules.yml) */
export interface InstitutionTypeRules {
  key: InstitutionTypeKey
  label: string
  requiredSections: OnboardingSectionKey[]
  conditionalSections: OnboardingSectionKey[]
  naSections: OnboardingSectionKey[]
  evidenceExpectations: EvidenceExpectation
}

/** Engine output for consumers */
export interface DynamicOnboardingState {
  institutionType: InstitutionTypeKey | null
  institutionTypeLabel: string
  rules: InstitutionTypeRules | null
  sections: SectionState[]
  activeSections: SectionState[]
  dimensions: DimensionProgress[]
  overallProgress: number
  structuredFacts: StructuredFact[]
  maxSectionsPerSession: number
}

export interface DynamicOnboardingEngineProps {
  /** Override institution type (falls back to onboarding context) */
  institutionType?: InstitutionTypeKey
  /** Pre-existing structured facts from a previous session */
  initialFacts?: StructuredFact[]
  /** Callback when a fact is created or updated */
  onFactChange?: (fact: StructuredFact) => void
  /** Callback when section answers change */
  onSectionChange?: (sectionKey: OnboardingSectionKey, answers: Record<string, AnswerValue>) => void
  children: (state: DynamicOnboardingState, actions: DynamicOnboardingActions) => ReactNode
}

export interface DynamicOnboardingActions {
  setAnswer: (sectionKey: OnboardingSectionKey, fieldKey: string, value: AnswerValue) => void
  setConfidence: (sectionKey: OnboardingSectionKey, fieldKey: string, confidence: AnswerConfidence) => void
  getStructuredFacts: () => StructuredFact[]
  resetSection: (sectionKey: OnboardingSectionKey) => void
  resetAll: () => void
}

// ─── Institution Type Rules (from onboarding-rules.yml v1.0.0) ──────────────

const INSTITUTION_TYPE_RULES: Record<InstitutionTypeKey, InstitutionTypeRules> = {
  clinical_research_site: {
    key: 'clinical_research_site',
    label: 'Clinical Research Site',
    requiredSections: ['organization', 'locations', 'people', 'infrastructure', 'equipment', 'capabilities', 'claims'],
    conditionalSections: ['pharmacy', 'biospecimen', 'imaging'],
    naSections: [],
    evidenceExpectations: 'standard_clinical',
  },
  community_research_site: {
    key: 'community_research_site',
    label: 'Community Research Site',
    requiredSections: ['organization', 'locations', 'people', 'capabilities', 'claims'],
    conditionalSections: ['pharmacy', 'lab_infrastructure'],
    naSections: ['phase1_unit'],
    evidenceExpectations: 'community_based',
  },
  phase1_unit: {
    key: 'phase1_unit',
    label: 'Phase 1 Unit',
    requiredSections: ['organization', 'locations', 'people', 'infrastructure', 'equipment', 'pharmacy', 'capabilities', 'claims'],
    conditionalSections: ['biospecimen'],
    naSections: [],
    evidenceExpectations: 'phase1_enhanced',
  },
  central_laboratory: {
    key: 'central_laboratory',
    label: 'Central Laboratory',
    requiredSections: ['organization', 'locations', 'people', 'lab_infrastructure', 'equipment', 'capabilities', 'claims'],
    conditionalSections: ['pharmacy'],
    naSections: ['patient_recruitment', 'clinical_trials_experience'],
    evidenceExpectations: 'lab_intensive',
  },
  biorepository: {
    key: 'biorepository',
    label: 'Biorepository',
    requiredSections: ['organization', 'locations', 'equipment', 'capabilities', 'claims'],
    conditionalSections: ['lab_infrastructure', 'pharmacy'],
    naSections: ['clinical_trials_experience', 'patient_recruitment'],
    evidenceExpectations: 'storage_focused',
  },
  biospecimen_collection_site: {
    key: 'biospecimen_collection_site',
    label: 'Biospecimen Collection Site',
    requiredSections: ['organization', 'locations', 'people', 'infrastructure', 'equipment', 'capabilities', 'claims'],
    conditionalSections: ['lab_infrastructure'],
    naSections: ['pharmacy'],
    evidenceExpectations: 'collection_focused',
  },
  diagnostics_ivd_lab: {
    key: 'diagnostics_ivd_lab',
    label: 'Diagnostics / IVD Lab',
    requiredSections: ['organization', 'locations', 'people', 'lab_infrastructure', 'equipment', 'capabilities', 'claims'],
    conditionalSections: [],
    naSections: ['pharmacy', 'patient_recruitment'],
    evidenceExpectations: 'diagnostics_focused',
  },
  specialty_practice: {
    key: 'specialty_practice',
    label: 'Specialty Practice',
    requiredSections: ['organization', 'locations', 'people', 'capabilities', 'claims'],
    conditionalSections: ['equipment', 'lab_infrastructure'],
    naSections: ['phase1_unit', 'biospecimen'],
    evidenceExpectations: 'practice_based',
  },
  processing_laboratory: {
    key: 'processing_laboratory',
    label: 'Processing Laboratory',
    requiredSections: ['organization', 'locations', 'people', 'lab_infrastructure', 'equipment', 'capabilities', 'claims'],
    conditionalSections: [],
    naSections: ['pharmacy', 'patient_recruitment'],
    evidenceExpectations: 'processing_intensive',
  },
  imaging_center: {
    key: 'imaging_center',
    label: 'Imaging Center',
    requiredSections: ['organization', 'locations', 'people', 'equipment', 'capabilities', 'claims'],
    conditionalSections: ['lab_infrastructure'],
    naSections: ['pharmacy', 'biospecimen'],
    evidenceExpectations: 'imaging_focused',
  },
  recruitment_network: {
    key: 'recruitment_network',
    label: 'Recruitment Network',
    requiredSections: ['organization', 'locations', 'capabilities', 'claims'],
    conditionalSections: ['people'],
    naSections: ['lab_infrastructure', 'pharmacy', 'equipment', 'biospecimen'],
    evidenceExpectations: 'recruitment_focused',
  },
  technology_data_provider: {
    key: 'technology_data_provider',
    label: 'Technology / Data Provider',
    requiredSections: ['organization', 'technology_systems', 'capabilities', 'claims'],
    conditionalSections: ['locations'],
    naSections: ['lab_infrastructure', 'pharmacy', 'biospecimen', 'patient_recruitment'],
    evidenceExpectations: 'technology_focused',
  },
}

// ─── Section Metadata ───────────────────────────────────────────────────────

interface SectionMeta {
  key: OnboardingSectionKey
  label: string
  dimension: ProgressDimension
  domain: OnboardingDomain
  defaultFields: SectionField[]
}

const SECTION_META: Record<OnboardingSectionKey, SectionMeta> = {
  organization: {
    key: 'organization',
    label: 'Organization',
    dimension: 'identity',
    domain: 'organization',
    defaultFields: [
      { key: 'org_name', label: 'Institution Name', type: 'text', required: true },
      { key: 'org_type', label: 'Institution Type', type: 'select', required: true, options: [
        'Hospital', 'Biobank', 'CRO', 'Laboratory', 'Academic Medical Center',
        'Independent Research Site', 'SMO', 'Research Network', 'Physician Practice',
        'University', 'Non-Profit', 'Other',
      ]},
      { key: 'org_mission', label: 'Mission Statement', type: 'textarea', required: false },
      { key: 'org_founded_year', label: 'Founded Year', type: 'text', required: false },
      { key: 'org_website', label: 'Website', type: 'text', required: false },
    ],
  },
  locations: {
    key: 'locations',
    label: 'Locations',
    dimension: 'operations',
    domain: 'organization',
    defaultFields: [
      { key: 'loc_country', label: 'Primary Country', type: 'text', required: true },
      { key: 'loc_city', label: 'Primary City', type: 'text', required: true },
      { key: 'loc_total_sites', label: 'Number of Sites', type: 'text', required: false },
      { key: 'loc_has_multiple', label: 'Multiple Locations?', type: 'boolean', required: false },
    ],
  },
  people: {
    key: 'people',
    label: 'People & Team',
    dimension: 'clinical',
    domain: 'people',
    defaultFields: [
      { key: 'ppl_pi_name', label: 'Principal Investigator', type: 'text', required: true },
      { key: 'ppl_team_size', label: 'Research Team Size', type: 'select', required: false, options: [
        '1-5', '6-15', '16-50', '51-100', '100+',
      ]},
      { key: 'ppl_has_dedicated_coordinator', label: 'Dedicated Study Coordinator?', type: 'boolean', required: false },
      { key: 'ppl_has_regulatory_staff', label: 'Dedicated Regulatory Staff?', type: 'boolean', required: false },
      { key: 'ppl_gcp_certified', label: 'Staff GCP Certified?', type: 'boolean', required: false },
    ],
  },
  infrastructure: {
    key: 'infrastructure',
    label: 'Infrastructure',
    dimension: 'infrastructure',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'infra_facility_type', label: 'Facility Type', type: 'select', required: true, options: [
        'Clinic', 'Hospital', 'Laboratory', 'Phase 1 Unit', 'Office', 'Mixed',
      ]},
      { key: 'infra_exam_rooms', label: 'Exam/Consult Rooms', type: 'text', required: false },
      { key: 'infra_has_backup_power', label: 'Backup Power?', type: 'boolean', required: false },
      { key: 'infra_has_temp_monitoring', label: 'Temperature Monitoring?', type: 'boolean', required: false },
      { key: 'infra_has_secure_storage', label: 'Secure Storage?', type: 'boolean', required: false },
    ],
  },
  equipment: {
    key: 'equipment',
    label: 'Equipment & Systems',
    dimension: 'infrastructure',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'eq_has_centrifuge', label: 'Centrifuge?', type: 'boolean', required: false },
      { key: 'eq_has_freezer_minus80', label: '-80°C Freezer?', type: 'boolean', required: false },
      { key: 'eq_has_freezer_minus20', label: '-20°C Freezer?', type: 'boolean', required: false },
      { key: 'eq_has_refrigerated_centrifuge', label: 'Refrigerated Centrifuge?', type: 'boolean', required: false },
      { key: 'eq_has_biosafety_cabinet', label: 'Biosafety Cabinet?', type: 'boolean', required: false },
    ],
  },
  capabilities: {
    key: 'capabilities',
    label: 'Capabilities',
    dimension: 'capabilities',
    domain: 'capabilities',
    defaultFields: [
      { key: 'cap_therapeutic_areas', label: 'Therapeutic Areas', type: 'multi-select', required: true, options: [
        'Oncology', 'Cardiology', 'Neurology', 'Immunology', 'Infectious Disease',
        'Rare Disease', 'Endocrinology', 'Respiratory', 'Gastroenterology',
      ]},
      { key: 'cap_study_phases', label: 'Study Phases', type: 'multi-select', required: false, options: [
        'Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Device', 'Diagnostics',
      ]},
      { key: 'cap_patient_population', label: 'Patient Population', type: 'multi-select', required: false, options: [
        'Adult', 'Pediatric', 'Geriatric', 'Healthy Volunteers', 'Special Populations',
      ]},
    ],
  },
  claims: {
    key: 'claims',
    label: 'Claims & Evidence',
    dimension: 'quality',
    domain: 'capabilities',
    defaultFields: [
      { key: 'clm_fda_audited', label: 'FDA Audited (5yr)?', type: 'boolean', required: false },
      { key: 'clm_ema_audited', label: 'EMA Audited (5yr)?', type: 'boolean', required: false },
      { key: 'clm_has_quality_system', label: 'Formal Quality System?', type: 'boolean', required: false },
      { key: 'clm_irb_type', label: 'IRB/EC Type', type: 'select', required: false, options: [
        'Local/Institutional', 'Central', 'Both', 'None',
      ]},
    ],
  },
  pharmacy: {
    key: 'pharmacy',
    label: 'Pharmacy',
    dimension: 'infrastructure',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'pharm_has_investigational', label: 'Investigational Drug Service?', type: 'boolean', required: true },
      { key: 'pharm_has_controlled_substance', label: 'Controlled Substance Storage?', type: 'boolean', required: false },
      { key: 'pharm_has_usp797', label: 'USP <797> Compliant?', type: 'boolean', required: false },
      { key: 'pharm_has_usp800', label: 'USP <800> Compliant?', type: 'boolean', required: false },
      { key: 'pharm_has_IV_admixture', label: 'IV Admixture Capability?', type: 'boolean', required: false },
    ],
  },
  biospecimen: {
    key: 'biospecimen',
    label: 'Biospecimen',
    dimension: 'infrastructure',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'bio_has_collection', label: 'Biospecimen Collection?', type: 'boolean', required: true },
      { key: 'bio_has_processing', label: 'Sample Processing?', type: 'boolean', required: false },
      { key: 'bio_has_storage', label: 'Long-term Storage?', type: 'boolean', required: false },
      { key: 'bio_has_shipping', label: 'Shipping Capability?', type: 'boolean', required: false },
      { key: 'bio_types', label: 'Sample Types', type: 'multi-select', required: false, options: [
        'Blood', 'Urine', 'Tissue', 'CSF', 'Stool', 'Saliva', 'Swabs',
      ]},
    ],
  },
  imaging: {
    key: 'imaging',
    label: 'Imaging',
    dimension: 'infrastructure',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'img_has_ct', label: 'CT Scanner?', type: 'boolean', required: false },
      { key: 'img_has_mri', label: 'MRI?', type: 'boolean', required: false },
      { key: 'img_has_xray', label: 'X-Ray?', type: 'boolean', required: false },
      { key: 'img_has_ultrasound', label: 'Ultrasound?', type: 'boolean', required: false },
      { key: 'img_has_pet', label: 'PET/CT?', type: 'boolean', required: false },
      { key: 'img_has_dxa', label: 'DXA?', type: 'boolean', required: false },
    ],
  },
  lab_infrastructure: {
    key: 'lab_infrastructure',
    label: 'Lab Infrastructure',
    dimension: 'infrastructure',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'lab_has_internal', label: 'Internal Lab?', type: 'boolean', required: true },
      { key: 'lab_pbmc_processing', label: 'PBMC Processing?', type: 'boolean', required: false },
      { key: 'lab_cert_clia', label: 'CLIA Certified?', type: 'boolean', required: false },
      { key: 'lab_cert_cap', label: 'CAP Accredited?', type: 'boolean', required: false },
      { key: 'lab_cert_iso', label: 'ISO 15189?', type: 'boolean', required: false },
      { key: 'lab_cert_gmp', label: 'GMP Compliant?', type: 'boolean', required: false },
    ],
  },
  phase1_unit: {
    key: 'phase1_unit',
    label: 'Phase 1 Unit',
    dimension: 'clinical',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'p1_has_dedicated_unit', label: 'Dedicated Phase 1 Unit?', type: 'boolean', required: true },
      { key: 'p1_bed_count', label: 'Phase 1 Beds', type: 'text', required: false },
      { key: 'p1_has_telemetry', label: 'Telemetry Capability?', type: 'boolean', required: false },
      { key: 'p1_has_emergency_cart', label: 'Emergency Crash Cart?', type: 'boolean', required: false },
      { key: 'p1_has_pharmacy_proximity', label: 'Pharmacy Proximity?', type: 'boolean', required: false },
    ],
  },
  patient_recruitment: {
    key: 'patient_recruitment',
    label: 'Patient Recruitment',
    dimension: 'clinical',
    domain: 'people',
    defaultFields: [
      { key: 'rec_has_database', label: 'Patient Database?', type: 'boolean', required: false },
      { key: 'rec_avg_enrollment', label: 'Avg Enrollment/Year', type: 'select', required: false, options: [
        '<10', '10-50', '51-100', '101-500', '>500',
      ]},
      { key: 'rec_has_diverse_pop', label: 'Diverse Population Access?', type: 'boolean', required: false },
      { key: 'rec_has_outreach', label: 'Community Outreach?', type: 'boolean', required: false },
    ],
  },
  clinical_trials_experience: {
    key: 'clinical_trials_experience',
    label: 'Clinical Trials Experience',
    dimension: 'clinical',
    domain: 'capabilities',
    defaultFields: [
      { key: 'ctx_total_studies', label: 'Total Studies (Lifetime)', type: 'text', required: false },
      { key: 'ctx_active_studies', label: 'Currently Active Studies', type: 'text', required: false },
      { key: 'ctx_sponsor_types', label: 'Sponsor Types', type: 'multi-select', required: false, options: [
        'Pharma', 'Biotech', 'Device', 'CRO', 'Academic', 'Government',
      ]},
    ],
  },
  technology_systems: {
    key: 'technology_systems',
    label: 'Technology Systems',
    dimension: 'operations',
    domain: 'infrastructure',
    defaultFields: [
      { key: 'tech_has_emr', label: 'EMR/EHR System?', type: 'boolean', required: true },
      { key: 'tech_has_edc', label: 'EDC System?', type: 'boolean', required: false },
      { key: 'tech_has_ctms', label: 'CTMS?', type: 'boolean', required: false },
      { key: 'tech_emr_type', label: 'EMR Vendor', type: 'select', required: false, options: [
        'Epic', 'Cerner', 'Meditech', 'Allscripts', 'Other', 'None',
      ]},
      { key: 'tech_has_api_access', label: 'API/Data Export Capability?', type: 'boolean', required: false },
    ],
  },
}

// ─── Dimension labels ───────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<ProgressDimension, string> = {
  identity: 'Identity',
  operations: 'Operations',
  clinical: 'Clinical',
  infrastructure: 'Infrastructure',
  quality: 'Quality',
  capabilities: 'Capabilities',
}

// ─── Answer → Claim Pipeline Constants ──────────────────────────────────────

/**
 * The answer-to-claim pipeline stages (from onboarding-rules.yml):
 * Onboarding Answer → Structured Fact → Claim Candidate → Institution Confirmation
 * → Evidence Association → Reviewed Claim → Capability Projection
 *
 * Rule: "An answer must not auto-convert to a published claim"
 */
const CLAIM_PIPELINE_STAGES = [
  'Onboarding Answer',
  'Structured Fact',
  'Claim Candidate',
  'Institution Confirmation',
  'Evidence Association',
  'Reviewed Claim',
  'Capability Projection',
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeActivation(
  sectionKey: OnboardingSectionKey,
  rules: InstitutionTypeRules,
): SectionActivation {
  if (rules.requiredSections.includes(sectionKey)) return 'required'
  if (rules.conditionalSections.includes(sectionKey)) return 'conditional'
  if (rules.naSections.includes(sectionKey)) return 'not_applicable'
  return 'inactive'
}

function isConfidenceEmpty(c: AnswerConfidence): boolean {
  return c === 'unknown' || c === 'not_applicable'
}

function isAnswerEmpty(v: AnswerValue): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string' && v.trim() === '') return true
  if (Array.isArray(v) && v.length === 0) return true
  return false
}

function buildSectionStates(
  rules: InstitutionTypeRules,
  existingFacts: StructuredFact[],
  maxSections: number,
): SectionState[] {
  // Gather all section keys mentioned by this institution type
  const mentioned = new Set<OnboardingSectionKey>([
    ...rules.requiredSections,
    ...rules.conditionalSections,
    ...rules.naSections,
  ])

  // Build states for every mentioned section
  const allStates: SectionState[] = []
  for (const sectionKey of mentioned) {
    const meta = SECTION_META[sectionKey]
    const activation = computeActivation(sectionKey, rules)

    // Rebuild answers from existing facts
    const answers: Record<string, AnswerValue> = {}
    const confidences: Record<string, AnswerConfidence> = {}
    for (const fact of existingFacts) {
      if (fact.section === sectionKey) {
        answers[fact.fieldKey] = fact.value
        confidences[fact.fieldKey] = fact.confidence
      }
    }

    allStates.push({
      key: sectionKey,
      activation,
      label: meta.label,
      dimension: meta.dimension,
      fields: meta.defaultFields,
      answers,
      confidences,
    })
  }

  // Sort: required first, then conditional, then N/A
  const orderPriority: Record<SectionActivation, number> = {
    required: 0,
    conditional: 1,
    not_applicable: 2,
    inactive: 3,
  }
  allStates.sort((a, b) => orderPriority[a.activation] - orderPriority[b.activation])

  return allStates
}

function computeDimensionProgress(sections: SectionState[]): DimensionProgress[] {
  const dimMap: Record<ProgressDimension, { completedFields: number; totalFields: number }> = {
    identity: { completedFields: 0, totalFields: 0 },
    operations: { completedFields: 0, totalFields: 0 },
    clinical: { completedFields: 0, totalFields: 0 },
    infrastructure: { completedFields: 0, totalFields: 0 },
    quality: { completedFields: 0, totalFields: 0 },
    capabilities: { completedFields: 0, totalFields: 0 },
  }

  for (const section of sections) {
    if (section.activation === 'not_applicable' || section.activation === 'inactive') continue

    const dim = dimMap[section.dimension]
    for (const field of section.fields) {
      dim.totalFields++
      const answer = section.answers[field.key]
      const confidence = section.confidences[field.key]
      // Count as completed if answered and confidence is confirmed/declared
      if (!isAnswerEmpty(answer) && confidence && !isConfidenceEmpty(confidence)) {
        dim.completedFields++
      }
      // Also count as completed if explicitly marked N/A
      if (confidence === 'not_applicable') {
        dim.completedFields++
      }
    }
  }

  return Object.entries(dimMap).map(([key, value]) => ({
    dimension: key as ProgressDimension,
    label: DIMENSION_LABELS[key as ProgressDimension],
    completedFields: value.completedFields,
    totalFields: value.totalFields,
    percentage: value.totalFields > 0
      ? Math.round((value.completedFields / value.totalFields) * 100)
      : 0,
  }))
}

function computeOverallProgress(dimensions: DimensionProgress[]): number {
  const total = dimensions.reduce((s, d) => s + d.totalFields, 0)
  const completed = dimensions.reduce((s, d) => s + d.completedFields, 0)
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

// ─── Institution type detection from onboarding context ─────────────────────

/**
 * Maps the user-facing institution type string (from OrganizationStep)
 * to the rules engine InstitutionTypeKey.
 */
function mapInstitutionTypeToKey(raw: string): InstitutionTypeKey | null {
  const normalized = raw.toLowerCase().trim()

  const mapping: Record<string, InstitutionTypeKey> = {
    'independent research site': 'clinical_research_site',
    'hospital': 'clinical_research_site',
    'academic medical center': 'clinical_research_site',
    'clinical research site': 'clinical_research_site',
    'community research site': 'community_research_site',
    'physician practice / clinic': 'specialty_practice',
    'physician practice': 'specialty_practice',
    'specialty practice': 'specialty_practice',
    'phase 1 unit': 'phase1_unit',
    'phase1 unit': 'phase1_unit',
    'biobank': 'biorepository',
    'biorepository': 'biorepository',
    'laboratory': 'central_laboratory',
    'central laboratory': 'central_laboratory',
    'reference / central laboratory': 'central_laboratory',
    'biospecimen collection site': 'biospecimen_collection_site',
    'diagnostics lab': 'diagnostics_ivd_lab',
    'diagnostics / ivd lab': 'diagnostics_ivd_lab',
    'diagnostics ivd lab': 'diagnostics_ivd_lab',
    'processing laboratory': 'processing_laboratory',
    'imaging center': 'imaging_center',
    'recruitment network': 'recruitment_network',
    'research network': 'recruitment_network',
    'technology / data provider': 'technology_data_provider',
    'technology data provider': 'technology_data_provider',
    'technology provider': 'technology_data_provider',
    'smo': 'clinical_research_site',
    'cro': 'clinical_research_site',
    'contract research organization': 'clinical_research_site',
    'contract research organization (cro)': 'clinical_research_site',
    'university': 'clinical_research_site',
    'non-profit research organization': 'clinical_research_site',
    'non-profit': 'clinical_research_site',
    'other': 'clinical_research_site',
  }

  return mapping[normalized] ?? null
}

// ─── Component ──────────────────────────────────────────────────────────────

export function DynamicOnboardingEngine({
  institutionType: overrideType,
  initialFacts = [],
  onFactChange,
  onSectionChange,
  children,
}: DynamicOnboardingEngineProps) {
  const { state: onboardingState } = useOnboarding()
  const [facts, setFacts] = useState<StructuredFact[]>(initialFacts)
  const [sectionAnswers, setSectionAnswers] = useState<
    Record<OnboardingSectionKey, Record<string, AnswerValue>>
  >({} as Record<OnboardingSectionKey, Record<string, AnswerValue>>)
  const [sectionConfidences, setSectionConfidences] = useState<
    Record<OnboardingSectionKey, Record<string, AnswerConfidence>>
  >({} as Record<OnboardingSectionKey, Record<string, AnswerConfidence>>)

  // Detect institution type from context
  const detectedType = useMemo<InstitutionTypeKey | null>(() => {
    if (overrideType) return overrideType

    const rawType = String(
      onboardingState.answers.org_type ??
      onboardingState.answers.identity_type ??
      onboardingState.answers.institution_type ??
      '',
    ).trim()

    if (!rawType) return null
    return mapInstitutionTypeToKey(rawType)
  }, [overrideType, onboardingState.answers])

  const rules = useMemo<InstitutionTypeRules | null>(() => {
    if (!detectedType) return null
    return INSTITUTION_TYPE_RULES[detectedType] ?? null
  }, [detectedType])

  const maxSectionsPerSession = 10

  // Build section states
  const sectionStates = useMemo<SectionState[]>(() => {
    if (!rules) return []

    const baseStates = buildSectionStates(rules, facts, maxSectionsPerSession)

    // Merge in current answers/confidences
    return baseStates.map((state) => ({
      ...state,
      answers: {
        ...state.answers,
        ...(sectionAnswers[state.key] ?? {}),
      },
      confidences: {
        ...state.confidences,
        ...(sectionConfidences[state.key] ?? {}),
      },
    }))
  }, [rules, facts, sectionAnswers, sectionConfidences])

  // Active sections (required + conditional, not N/A) capped at max 10
  const activeSections = useMemo(() => {
    const candidates = sectionStates.filter(
      (s) => s.activation === 'required' || s.activation === 'conditional',
    )
    return candidates.slice(0, maxSectionsPerSession)
  }, [sectionStates])

  // Per-dimension progress
  const dimensions = useMemo(() => computeDimensionProgress(activeSections), [activeSections])

  const overallProgress = useMemo(() => computeOverallProgress(dimensions), [dimensions])

  // Generate structured facts from all answers
  const structuredFacts = useMemo<StructuredFact[]>(() => {
    const result: StructuredFact[] = []

    for (const section of activeSections) {
      for (const field of section.fields) {
        const value = section.answers[field.key]
        const confidence = section.confidences[field.key] ?? 'unknown'

        if (isAnswerEmpty(value) && !isConfidenceEmpty(confidence)) continue

        result.push({
          id: `${section.key}.${field.key}`,
          section: section.key,
          fieldKey: field.key,
          value: value ?? null,
          confidence,
          label: field.label,
          createdAt: new Date().toISOString(),
          dimension: section.dimension,
        })
      }
    }

    // Merge with any pre-existing facts from sections not currently active
    for (const fact of facts) {
      if (!result.some((r) => r.id === fact.id)) {
        result.push(fact)
      }
    }

    return result
  }, [activeSections, facts])

  // Set answer action
  const setAnswer = useCallback(
    (sectionKey: OnboardingSectionKey, fieldKey: string, value: AnswerValue) => {
      setSectionAnswers((prev) => ({
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] ?? {}),
          [fieldKey]: value,
        },
      }))

      // Auto-set confidence to declared when a value is set
      if (!isAnswerEmpty(value)) {
        setSectionConfidences((prev) => ({
          ...prev,
          [sectionKey]: {
            ...(prev[sectionKey] ?? {}),
            [fieldKey]: 'declared' as AnswerConfidence,
          },
        }))
      }

      // Create or update the structured fact
      const section = SECTION_META[sectionKey]
      const field = section?.defaultFields.find((f) => f.key === fieldKey)
      const fact: StructuredFact = {
        id: `${sectionKey}.${fieldKey}`,
        section: sectionKey,
        fieldKey,
        value,
        confidence: 'declared',
        label: field?.label ?? fieldKey,
        createdAt: new Date().toISOString(),
        dimension: section?.dimension ?? 'capabilities',
      }

      setFacts((prev) => {
        const idx = prev.findIndex((f) => f.id === fact.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = fact
          return next
        }
        return [...prev, fact]
      })

      onFactChange?.(fact)
      onSectionChange?.(sectionKey, {
        ...(sectionAnswers[sectionKey] ?? {}),
        [fieldKey]: value,
      })
    },
    [sectionAnswers, onFactChange, onSectionChange],
  )

  // Set confidence action
  const setConfidence = useCallback(
    (sectionKey: OnboardingSectionKey, fieldKey: string, confidence: AnswerConfidence) => {
      setSectionConfidences((prev) => ({
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] ?? {}),
          [fieldKey]: confidence,
        },
      }))

      // Update the corresponding fact
      setFacts((prev) => {
        const factId = `${sectionKey}.${fieldKey}`
        const idx = prev.findIndex((f) => f.id === factId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], confidence }
          return next
        }
        return prev
      })
    },
    [],
  )

  const getStructuredFacts = useCallback(() => structuredFacts, [structuredFacts])

  const resetSection = useCallback((sectionKey: OnboardingSectionKey) => {
    setSectionAnswers((prev) => {
      const next = { ...prev }
      delete next[sectionKey]
      return next
    })
    setSectionConfidences((prev) => {
      const next = { ...prev }
      delete next[sectionKey]
      return next
    })
    setFacts((prev) => prev.filter((f) => f.section !== sectionKey))
  }, [])

  const resetAll = useCallback(() => {
    setSectionAnswers({} as Record<OnboardingSectionKey, Record<string, AnswerValue>>)
    setSectionConfidences({} as Record<OnboardingSectionKey, Record<string, AnswerConfidence>>)
    setFacts([])
  }, [])

  // Derive label
  const institutionTypeLabel = useMemo(() => {
    if (detectedType && INSTITUTION_TYPE_RULES[detectedType]) {
      return INSTITUTION_TYPE_RULES[detectedType].label
    }
    if (detectedType) return detectedType.replace(/_/g, ' ')
    return 'Unknown Institution Type'
  }, [detectedType])

  const state: DynamicOnboardingState = {
    institutionType: detectedType,
    institutionTypeLabel,
    rules,
    sections: sectionStates,
    activeSections,
    dimensions,
    overallProgress,
    structuredFacts,
    maxSectionsPerSession,
  }

  const actions: DynamicOnboardingActions = {
    setAnswer,
    setConfidence,
    getStructuredFacts,
    resetSection,
    resetAll,
  }

  return <>{children(state, actions)}</>
}

// ─── Export helpers for external use ────────────────────────────────────────

export {
  INSTITUTION_TYPE_RULES,
  SECTION_META,
  DIMENSION_LABELS,
  CLAIM_PIPELINE_STAGES,
  mapInstitutionTypeToKey,
  computeActivation,
  computeDimensionProgress,
}
