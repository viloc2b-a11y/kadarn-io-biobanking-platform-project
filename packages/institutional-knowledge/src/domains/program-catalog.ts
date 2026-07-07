// ==========================================================================
// IKM Domain Sprint 3C — Program Catalog Domain
// ==========================================================================
// Programs are reusable operational templates that define institutional
// requirements. This is the bridge between Institutional Knowledge and
// future Program Readiness. DO NOT evaluate institutions here.
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface ProgramCatalogItem {
  key: string; label: string; description: string
  category: ProgramCategory
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]
}

export type ProgramCategory =
  | 'clinical_trial' | 'biobanking' | 'ivd' | 'central_lab'
  | 'specimen_collection' | 'healthy_volunteers' | 'disease_cohort'
  | 'natural_history' | 'registry' | 'real_world_evidence'
  | 'companion_diagnostics' | 'precision_medicine'
  | 'cell_therapy' | 'gene_therapy' | 'academic_research'
  | 'government_research' | 'commercial_biospecimen'
  | 'longitudinal_cohort' | 'remote_study' | 'decentralized_study'
  | 'custom_program'

// ==========================================================================
// PROGRAM TYPES
// ==========================================================================

export const PROGRAM_TYPES: ProgramCatalogItem[] = [
  { key: 'clinical_trial_program', label: 'Clinical Trial Program', description: 'Interventional clinical trial requiring patient enrollment, IP administration, and GCP compliance', category: 'clinical_trial', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Clinical Research Execution'] },
  { key: 'biobanking_program', label: 'Biobanking Program', description: 'Biospecimen collection, processing, storage, and distribution program for a repository', category: 'biobanking', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Readiness', 'Capability Intelligence'], enablesCapabilities: ['Biospecimen Repository Operations'] },
  { key: 'ivd_program', label: 'IVD / Diagnostic Program', description: 'In vitro diagnostic validation requiring characterized samples, clinical annotation, and regulatory compliance', category: 'ivd', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['IVD Validation'] },
  { key: 'central_lab_program', label: 'Central Laboratory Program', description: 'Centralized laboratory services for multi-site trials — testing, processing, storage, shipping', category: 'central_lab', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Central Lab Services'] },
  { key: 'specimen_collection_program', label: 'Specimen Collection Program', description: 'Dedicated biospecimen collection with defined processing, storage, and shipping requirements', category: 'specimen_collection', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Readiness'], enablesCapabilities: ['Collection Operations'] },
  { key: 'healthy_volunteer_program', label: 'Healthy Volunteer Program', description: 'Program requiring access to healthy volunteer populations for Phase I or vaccine studies', category: 'healthy_volunteers', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Phase I Operations'] },
  { key: 'disease_cohort_program', label: 'Disease Cohort Program', description: 'Program requiring access to specific disease populations with characterized clinical data', category: 'disease_cohort', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Patient Access'] },
  { key: 'natural_history_program', label: 'Natural History Program', description: 'Longitudinal observational study tracking disease progression without intervention', category: 'natural_history', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Longitudinal Research'] },
  { key: 'registry_program', label: 'Registry Program', description: 'Patient or disease registry requiring data collection, quality control, and long-term follow-up', category: 'registry', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Registry Operations'] },
  { key: 'rwe_program', label: 'Real World Evidence Program', description: 'Program generating RWE from EHR, claims, or observational data sources', category: 'real_world_evidence', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['RWE Generation'] },
  { key: 'companion_dx_program', label: 'Companion Diagnostics Program', description: 'Program developing or validating a companion diagnostic with biospecimen requirements', category: 'companion_diagnostics', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Readiness'], enablesCapabilities: ['CDx Development'] },
  { key: 'precision_medicine_program', label: 'Precision Medicine Program', description: 'Program requiring molecular profiling, biomarker analysis, and targeted therapy matching', category: 'precision_medicine', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Precision Medicine'] },
  { key: 'cell_therapy_program', label: 'Cell Therapy Program', description: 'Program involving cell collection, manufacturing, infusion, and monitoring', category: 'cell_therapy', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Cell Therapy Operations'] },
  { key: 'gene_therapy_program', label: 'Gene Therapy Program', description: 'Program involving gene therapy vector administration with biosafety and monitoring requirements', category: 'gene_therapy', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Gene Therapy Operations'] },
  { key: 'academic_program', label: 'Academic Research Program', description: 'Investigator-initiated or grant-funded academic research program', category: 'academic_research', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Program Matching'], enablesCapabilities: ['Academic Research'] },
  { key: 'government_program', label: 'Government Research Program', description: 'Federally funded research program — NIH, DOD, CDC, BARDA, etc.', category: 'government_research', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching'], enablesCapabilities: ['Government Research'] },
  { key: 'commercial_biospecimen_program', label: 'Commercial Biospecimen Program', description: 'Commercial biospecimen collection and distribution program for industry clients', category: 'commercial_biospecimen', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Capability Intelligence'], enablesCapabilities: ['Commercial Operations'] },
  { key: 'longitudinal_cohort_program', label: 'Longitudinal Cohort Program', description: 'Multi-year cohort study with repeated sample collection and long-term follow-up', category: 'longitudinal_cohort', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Longitudinal Research'] },
  { key: 'remote_program', label: 'Remote / Virtual Study Program', description: 'Fully remote study with telemedicine, home visits, and direct-to-patient shipping', category: 'remote_study', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Remote Research'] },
  { key: 'decentralized_program', label: 'Decentralized / Hybrid Study Program', description: 'Hybrid study combining site visits with remote elements — eConsent, ePRO, wearables', category: 'decentralized_study', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Program Matching', 'Sponsor Intelligence'], enablesCapabilities: ['Hybrid Research'] },
  { key: 'custom_program', label: 'Custom / Other Program', description: 'Institution-specific or novel program type not covered by standard categories', category: 'custom_program', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [] },
]

// ==========================================================================
// PROGRAM REQUIREMENTS — Reusable templates
// ==========================================================================

export interface ProgramRequirement {
  key: string
  label: string
  description: string
  /** What type of requirement: capability, document, equipment, personnel, facility, process, certification */
  requirementType: 'capability' | 'document' | 'equipment' | 'personnel' | 'facility' | 'process' | 'certification'
  /** Whether this requirement is mandatory for the program */
  mandatory: boolean
  /** Which program types require this */
  appliesToPrograms: string[]
  /** Reference to the knowledge domain item this requirement maps to */
  mapsToKnowledgeItem?: string
}

export const PROGRAM_REQUIREMENTS: ProgramRequirement[] = [
  // Core requirements (apply to most programs)
  { key: 'req_irb', label: 'IRB / Ethics Committee Approval', description: 'Active IRB registration or central IRB reliance agreement', requirementType: 'certification', mandatory: true, appliesToPrograms: ['clinical_trial_program', 'biobanking_program', 'ivd_program', 'specimen_collection_program', 'healthy_volunteer_program', 'disease_cohort_program', 'natural_history_program'], mapsToKnowledgeItem: 'irb' },
  { key: 'req_gcp_pi', label: 'GCP-Trained Principal Investigator', description: 'PI with current GCP training and relevant therapeutic experience', requirementType: 'personnel', mandatory: true, appliesToPrograms: ['clinical_trial_program', 'ivd_program', 'healthy_volunteer_program', 'disease_cohort_program'], mapsToKnowledgeItem: 'pi' },
  { key: 'req_gcp_staff', label: 'GCP-Trained Staff', description: 'Study staff with current GCP and human subjects protection training', requirementType: 'personnel', mandatory: true, appliesToPrograms: ['clinical_trial_program', 'ivd_program'], mapsToKnowledgeItem: 'gcp_training' },
  { key: 'req_informed_consent', label: 'Informed Consent Process', description: 'Documented informed consent process with ICF templates', requirementType: 'process', mandatory: true, appliesToPrograms: ['clinical_trial_program', 'biobanking_program', 'ivd_program', 'specimen_collection_program'], mapsToKnowledgeItem: 'icf_template' },

  // Biospecimen requirements
  { key: 'req_neg80_storage', label: '-80°C Storage Capability', description: 'Ultra-low temperature storage with continuous monitoring and alarm systems', requirementType: 'equipment', mandatory: true, appliesToPrograms: ['biobanking_program', 'specimen_collection_program', 'commercial_biospecimen_program', 'longitudinal_cohort_program'], mapsToKnowledgeItem: 'freezer_80' },
  { key: 'req_pbmc_processing', label: 'PBMC Processing Capability', description: 'Validated PBMC isolation by density gradient with viability assessment', requirementType: 'capability', mandatory: false, appliesToPrograms: ['biobanking_program', 'specimen_collection_program', 'cell_therapy_program'], mapsToKnowledgeItem: 'pbmc' },
  { key: 'req_temp_monitoring', label: 'Temperature Monitoring System', description: '24/7 continuous temperature monitoring with alarm escalation', requirementType: 'equipment', mandatory: true, appliesToPrograms: ['biobanking_program', 'specimen_collection_program', 'central_lab_program'], mapsToKnowledgeItem: 'temp_monitoring' },
  { key: 'req_chain_of_custody', label: 'Chain of Custody Documentation', description: 'End-to-end chain of custody from collection through disposition or shipping', requirementType: 'process', mandatory: true, appliesToPrograms: ['biobanking_program', 'specimen_collection_program', 'ivd_program', 'central_lab_program'], mapsToKnowledgeItem: 'chain_of_custody' },
  { key: 'req_shipping', label: 'Sample Shipping Capability', description: 'Validated cold chain or ambient shipping with IATA/DOT compliance', requirementType: 'capability', mandatory: false, appliesToPrograms: ['biobanking_program', 'specimen_collection_program', 'commercial_biospecimen_program'], mapsToKnowledgeItem: 'cold_chain_shipping' },

  // Lab requirements
  { key: 'req_clia', label: 'CLIA Certification', description: 'Current CLIA certificate for clinical laboratory testing', requirementType: 'certification', mandatory: true, appliesToPrograms: ['central_lab_program', 'ivd_program'], mapsToKnowledgeItem: 'certifications' },
  { key: 'req_cap', label: 'CAP Accreditation', description: 'College of American Pathologists accreditation', requirementType: 'certification', mandatory: false, appliesToPrograms: ['central_lab_program', 'biobanking_program'], mapsToKnowledgeItem: 'accreditations' },
  { key: 'req_biosafety', label: 'Biosafety Level 2', description: 'BSL-2 facility with certified biosafety cabinets', requirementType: 'facility', mandatory: true, appliesToPrograms: ['biobanking_program', 'specimen_collection_program', 'central_lab_program', 'cell_therapy_program', 'gene_therapy_program'], mapsToKnowledgeItem: 'biosafety_level' },

  // Specialized requirements
  { key: 'req_cell_processing', label: 'Cell Processing Facility', description: 'Certified cell processing facility with environmental monitoring', requirementType: 'facility', mandatory: true, appliesToPrograms: ['cell_therapy_program', 'gene_therapy_program'], mapsToKnowledgeItem: 'processing_lab' },
  { key: 'req_iso13485', label: 'ISO 13485 Certification', description: 'Quality management for medical devices / IVD manufacturing', requirementType: 'certification', mandatory: true, appliesToPrograms: ['ivd_program', 'companion_dx_program'], mapsToKnowledgeItem: 'iso' },
  { key: 'req_imaging', label: 'Imaging Capability', description: 'Access to MRI, CT, PET, or other imaging modalities with research-quality acquisition', requirementType: 'equipment', mandatory: false, appliesToPrograms: ['clinical_trial_program', 'precision_medicine_program'], mapsToKnowledgeItem: 'imaging' },

  // Operational requirements
  { key: 'req_weekend', label: 'Weekend Processing Availability', description: 'Ability to process samples on weekends for time-sensitive protocols', requirementType: 'process', mandatory: false, appliesToPrograms: ['specimen_collection_program', 'biobanking_program', 'cell_therapy_program'], mapsToKnowledgeItem: 'weekend_availability' },
  { key: 'req_home_visits', label: 'Home Visit Capability', description: 'Ability to conduct study visits at patient homes', requirementType: 'capability', mandatory: false, appliesToPrograms: ['remote_program', 'decentralized_program'], mapsToKnowledgeItem: 'home_visits' },
  { key: 'req_digital_tools', label: 'Digital Research Tools', description: 'eConsent, ePRO, telemedicine, or wearable device capability', requirementType: 'capability', mandatory: false, appliesToPrograms: ['remote_program', 'decentralized_program'], mapsToKnowledgeItem: 'digital_research' },
]

// ==========================================================================
// CATEGORY LABELS
// ==========================================================================

export const PROGRAM_CATEGORY_LABELS: Record<ProgramCategory, string> = {
  clinical_trial: 'Clinical Trial', biobanking: 'Biobanking', ivd: 'IVD / Diagnostics',
  central_lab: 'Central Laboratory', specimen_collection: 'Specimen Collection',
  healthy_volunteers: 'Healthy Volunteers', disease_cohort: 'Disease Cohort',
  natural_history: 'Natural History', registry: 'Registry',
  real_world_evidence: 'Real World Evidence', companion_diagnostics: 'Companion Diagnostics',
  precision_medicine: 'Precision Medicine', cell_therapy: 'Cell Therapy',
  gene_therapy: 'Gene Therapy', academic_research: 'Academic Research',
  government_research: 'Government Research', commercial_biospecimen: 'Commercial Biospecimen',
  longitudinal_cohort: 'Longitudinal Cohort', remote_study: 'Remote Study',
  decentralized_study: 'Decentralized Study', custom_program: 'Custom Program',
}

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const PROGRAM_DOMAIN_STATS = {
  totalProgramTypes: PROGRAM_TYPES.length,
  totalRequirements: PROGRAM_REQUIREMENTS.length,
  mandatoryRequirements: PROGRAM_REQUIREMENTS.filter((r) => r.mandatory).length,
  optionalRequirements: PROGRAM_REQUIREMENTS.filter((r) => !r.mandatory).length,
  categories: Object.keys(PROGRAM_CATEGORY_LABELS).length,
  requirementTypes: [...new Set(PROGRAM_REQUIREMENTS.map((r) => r.requirementType))],
  programsWithMostRequirements: (() => {
    const counts: Record<string, number> = {}
    for (const req of PROGRAM_REQUIREMENTS) {
      for (const prog of req.appliesToPrograms) {
        counts[prog] = (counts[prog] ?? 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  })(),
}

// ==========================================================================
// HELPER: Get requirements for a specific program
// ==========================================================================

export function getProgramRequirements(programKey: string): { mandatory: ProgramRequirement[]; optional: ProgramRequirement[] } {
  const all = PROGRAM_REQUIREMENTS.filter((r) => r.appliesToPrograms.includes(programKey))
  return {
    mandatory: all.filter((r) => r.mandatory),
    optional: all.filter((r) => !r.mandatory),
  }
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const PROGRAM_SECTIONS = [
  { name: 'Clinical Research', itemKeys: ['clinical_trial_program', 'healthy_volunteer_program', 'disease_cohort_program', 'natural_history_program'] },
  { name: 'Biospecimen Programs', itemKeys: ['biobanking_program', 'specimen_collection_program', 'commercial_biospecimen_program', 'longitudinal_cohort_program'] },
  { name: 'Diagnostics & Precision', itemKeys: ['ivd_program', 'companion_dx_program', 'precision_medicine_program'] },
  { name: 'Laboratory Services', itemKeys: ['central_lab_program'] },
  { name: 'Advanced Therapies', itemKeys: ['cell_therapy_program', 'gene_therapy_program'] },
  { name: 'Innovative Models', itemKeys: ['remote_program', 'decentralized_program'] },
  { name: 'Research & Registry', itemKeys: ['registry_program', 'rwe_program', 'academic_program', 'government_program'] },
  { name: 'Other', itemKeys: ['custom_program'] },
]
