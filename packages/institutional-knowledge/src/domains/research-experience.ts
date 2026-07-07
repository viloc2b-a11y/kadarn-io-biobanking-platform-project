// ==========================================================================
// IKM Domain Sprint 3B — Research Experience Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface ExperienceItem {
  key: string; label: string; description: string
  category: ExperienceCategory
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]
}

export type ExperienceCategory =
  | 'trial_metadata' | 'sponsor_info' | 'scope' | 'performance'
  | 'specimens' | 'outcomes' | 'derived'

// ==========================================================================
// EXPERIENCE TYPES — What kinds of research has the institution done?
// ==========================================================================

export const EXPERIENCE_TYPES: ExperienceItem[] = [
  { key: 'clinical_trial', label: 'Clinical Trial', description: 'Interventional clinical trial — Phase I through IV', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Program Matching'], enablesCapabilities: ['Clinical Trial Experience'] },
  { key: 'observational_study', label: 'Observational Study', description: 'Non-interventional observational or cohort study', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Observational Research'] },
  { key: 'registry_study', label: 'Registry Study', description: 'Patient or disease registry participation', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Registry Experience'] },
  { key: 'natural_history', label: 'Natural History Study', description: 'Longitudinal natural history or disease progression study', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Natural History Experience'] },
  { key: 'biobanking_project', label: 'Biobanking Project', description: 'Biospecimen collection, processing, and storage project', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Biobanking Experience'] },
  { key: 'ivd_program', label: 'IVD / Diagnostic Program', description: 'In vitro diagnostic validation or performance study', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['IVD Experience'] },
  { key: 'specimen_collection', label: 'Specimen Collection Program', description: 'Dedicated biospecimen collection program for a sponsor or repository', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Collection Experience'] },
  { key: 'academic_research', label: 'Academic / Investigator-Initiated', description: 'Investigator-initiated research, academic collaborations, grant-funded studies', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Academic Research Experience'] },
  { key: 'commercial_collection', label: 'Commercial Collection', description: 'Commercial biospecimen collection for biobanks or commercial repositories', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Commercial Experience'] },
  { key: 'expanded_access', label: 'Expanded Access / Compassionate Use', description: 'Expanded access or compassionate use programs', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Access Program Experience'] },
  { key: 'public_health', label: 'Public Health Program', description: 'Public health research, surveillance, or screening program', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Public Health Experience'] },
  { key: 'custom_experience', label: 'Other Research Experience', description: 'Other research experience not covered by standard categories', category: 'trial_metadata', itemType: 'historical_event', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], },
]

// ==========================================================================
// TRIAL METADATA — For each experience
// ==========================================================================

export const TRIAL_METADATA: ExperienceItem[] = [
  { key: 'study_title', label: 'Study Title', description: 'Full protocol title or study name', category: 'trial_metadata', itemType: 'other', required: true, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], },
  { key: 'therapeutic_area', label: 'Therapeutic Area', description: 'Oncology, cardiology, neurology, infectious disease, rare disease, etc.', category: 'trial_metadata', itemType: 'other', required: true, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching', 'Capability Intelligence'], enablesCapabilities: ['Therapeutic Expertise'], },
  { key: 'disease_area', label: 'Disease Area / Indication', description: 'Specific disease or indication — NSCLC, Alzheimer\'s, COVID-19, etc.', category: 'trial_metadata', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Disease Expertise'], },
  { key: 'study_phase', label: 'Study Phase', description: 'Phase I, II, III, IV, or N/A for non-interventional', category: 'trial_metadata', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Phase Experience'], },
]

// ==========================================================================
// SPONSOR & PARTNER INFO
// ==========================================================================

export const SPONSOR_INFO: ExperienceItem[] = [
  { key: 'sponsor_name', label: 'Sponsor Name', description: 'Pharmaceutical, biotech, or device company that sponsored the study', category: 'sponsor_info', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Sponsor Relationship History'], },
  { key: 'cro_name', label: 'CRO Partner', description: 'Contract Research Organization involved in the study', category: 'sponsor_info', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['CRO Relationship History'], },
  { key: 'academic_partner', label: 'Academic Partner', description: 'Academic institution or university collaborator', category: 'sponsor_info', itemType: 'relationship', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Academic Partnerships'], },
  { key: 'institution_role', label: 'Institution Role', description: 'Principal site, sub-site, central lab, recruitment only, data only, etc.', category: 'sponsor_info', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Role Experience'], },
]

// ==========================================================================
// SCOPE & SCALE
// ==========================================================================

export const EXPERIENCE_SCOPE: ExperienceItem[] = [
  { key: 'start_date', label: 'Start Date', description: 'Date the institution began work on this study', category: 'scope', itemType: 'historical_event', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], },
  { key: 'end_date', label: 'End Date / Completion Date', description: 'Date the institution completed work or study closed', category: 'scope', itemType: 'historical_event', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], },
  { key: 'status', label: 'Current Status', description: 'Active, completed, terminated, suspended, in start-up, in close-out', category: 'scope', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], },
  { key: 'countries', label: 'Countries', description: 'Countries where this study was conducted by the institution', category: 'scope', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Global Experience'], },
  { key: 'num_sites', label: 'Number of Sites', description: 'Number of sites the institution operated for this study', category: 'scope', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Multi-Site Experience'], },
  { key: 'population_type', label: 'Study Population', description: 'Healthy volunteers, patients, pediatric, elderly, special populations', category: 'scope', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Population Experience'], },
]

// ==========================================================================
// PERFORMANCE
// ==========================================================================

export const EXPERIENCE_PERFORMANCE: ExperienceItem[] = [
  { key: 'enrollment_target', label: 'Enrollment Target', description: 'Target number of subjects the institution committed to enroll', category: 'performance', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], },
  { key: 'enrollment_actual', label: 'Actual Enrollment', description: 'Actual number of subjects enrolled by the institution', category: 'performance', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Enrollment Performance'], },
  { key: 'enrollment_rate', label: 'Enrollment Rate', description: 'Subjects per month — derived from enrollment / duration', category: 'performance', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Enrollment Velocity'], },
  { key: 'screen_fail_rate', label: 'Screen Failure Rate', description: 'Percentage of screened subjects who failed screening', category: 'performance', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], },
  { key: 'retention_rate', label: 'Retention Rate', description: 'Percentage of enrolled subjects who completed the study', category: 'performance', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Patient Retention'], },
]

// ==========================================================================
// SPECIMENS
// ==========================================================================

export const EXPERIENCE_SPECIMENS: ExperienceItem[] = [
  { key: 'specimens_collected', label: 'Specimens Collected', description: 'Types and approximate quantities of specimens collected', category: 'specimens', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Specimen Experience'], },
  { key: 'lab_activities', label: 'Laboratory Activities', description: 'Processing, testing, storage, or shipping performed for this study', category: 'specimens', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Lab Experience'], },
  { key: 'services_performed', label: 'Services Performed', description: 'Summary of research services the institution provided for this study', category: 'specimens', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Service Experience'], },
  { key: 'technology_used', label: 'Technology / Systems Used', description: 'EDC, LIMS, ePRO, imaging systems, or other technology used', category: 'specimens', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Technology Experience'], },
]

// ==========================================================================
// OUTCOMES
// ==========================================================================

export const EXPERIENCE_OUTCOMES: ExperienceItem[] = [
  { key: 'key_outcomes', label: 'Key Outcomes', description: 'Summary of key results, milestones, or achievements', category: 'outcomes', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], },
  { key: 'lessons_learned', label: 'Lessons Learned', description: 'Operational insights or improvements identified during this study', category: 'outcomes', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Institutional Learning'], },
  { key: 'publications', label: 'Publications', description: 'Publications, abstracts, or presentations resulting from this study', category: 'outcomes', itemType: 'other', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Academic Output'], },
]

// ==========================================================================
// DOCUMENTS
// ==========================================================================

export interface ExperienceDocument {
  key: string; label: string; description: string
  required: boolean; expires: boolean; typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]; evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const EXPERIENCE_DOCUMENTS: ExperienceDocument[] = [
  { key: 'closeout_letter', label: 'Study Close-Out Letter', description: 'Official close-out letter from sponsor or CRO', required: false, expires: false, supportsKnowledgeItems: ['clinical_trial', 'observational_study', 'ivd_program'], evidenceClass: 'A' },
  { key: 'study_summary', label: 'Study Summary / Report', description: 'Summary of study activities, enrollment, and outcomes', required: false, expires: false, supportsKnowledgeItems: ['clinical_trial', 'observational_study'], evidenceClass: 'B' },
  { key: 'publication_doc', label: 'Publication / Abstract', description: 'Published manuscript or conference abstract from this study', required: false, expires: false, supportsKnowledgeItems: ['publications'], evidenceClass: 'B' },
  { key: 'sponsor_recognition', label: 'Sponsor Recognition / Award', description: 'Recognition letter, performance award, or preferred site designation from sponsor', required: false, expires: false, supportsKnowledgeItems: ['clinical_trial'], evidenceClass: 'C' },
  { key: 'inspection_report', label: 'Regulatory Inspection Report', description: 'FDA, EMA, or other regulatory inspection outcome for this study', required: false, expires: false, supportsKnowledgeItems: ['clinical_trial'], evidenceClass: 'A' },
]

// ==========================================================================
// DERIVED METRICS (computed, not stored)
// ==========================================================================

export interface DerivedExperienceMetrics {
  totalStudies: number
  activeStudies: number
  completedStudies: number
  yearsOfExperience: number
  therapeuticAreas: string[]
  sponsorCount: number
  uniqueSponsors: string[]
  croCount: number
  totalEnrollment: number
  avgEnrollmentRate: number
  phaseDistribution: Record<string, number>
  specimenExperience: string[]
}

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const EXPERIENCE_DOMAIN_CATALOG: ExperienceItem[] = [
  ...EXPERIENCE_TYPES,
  ...TRIAL_METADATA,
  ...SPONSOR_INFO,
  ...EXPERIENCE_SCOPE,
  ...EXPERIENCE_PERFORMANCE,
  ...EXPERIENCE_SPECIMENS,
  ...EXPERIENCE_OUTCOMES,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const EXPERIENCE_DOMAIN_STATS = {
  totalItems: EXPERIENCE_DOMAIN_CATALOG.length,
  experienceTypes: EXPERIENCE_TYPES.length,
  metadataFields: TRIAL_METADATA.length,
  sponsorFields: SPONSOR_INFO.length,
  scopeFields: EXPERIENCE_SCOPE.length,
  performanceFields: EXPERIENCE_PERFORMANCE.length,
  specimenFields: EXPERIENCE_SPECIMENS.length,
  outcomeFields: EXPERIENCE_OUTCOMES.length,
  totalDocuments: EXPERIENCE_DOCUMENTS.length,
  downstreamEngines: [...new Set(EXPERIENCE_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const EXPERIENCE_SECTIONS = [
  { name: 'Experience Types', items: EXPERIENCE_TYPES, completionKey: 'types' },
  { name: 'Study Metadata', items: TRIAL_METADATA, completionKey: 'metadata' },
  { name: 'Sponsors & Partners', items: SPONSOR_INFO, completionKey: 'sponsors' },
  { name: 'Scope & Scale', items: EXPERIENCE_SCOPE, completionKey: 'scope' },
  { name: 'Performance', items: EXPERIENCE_PERFORMANCE, completionKey: 'performance' },
  { name: 'Specimens & Services', items: EXPERIENCE_SPECIMENS, completionKey: 'specimens' },
  { name: 'Outcomes & Learning', items: EXPERIENCE_OUTCOMES, completionKey: 'outcomes' },
]
