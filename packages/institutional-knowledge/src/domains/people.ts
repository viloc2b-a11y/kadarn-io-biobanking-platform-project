// ==========================================================================
// IKM Domain Sprint 2 — People Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

// ==========================================================================
// People Knowledge Items Catalog
// ==========================================================================

export interface PeopleKnowledgeItem {
  key: string
  label: string
  description: string
  itemType: KnowledgeItemType
  required: boolean
  historical: boolean
  documentSupported: boolean
  documentExpires: boolean
  generatesCandidates: boolean
  consumedBy: string[]
  enablesCapabilities: string[]
  relatedTo: KnowledgeItemType[]
}

// ==========================================================================
// PERSON TYPES
// ==========================================================================

export const PEOPLE_ROLES: PeopleKnowledgeItem[] = [
  { key: 'pi', label: 'Principal Investigator', description: 'Lead investigator responsible for research program conduct', itemType: 'person', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness', 'Regulatory'], enablesCapabilities: ['Program Leadership'], relatedTo: ['capability', 'facility'] },
  { key: 'sub_i', label: 'Sub-Investigator', description: 'Co-investigator or sub-investigator supporting PI', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Research Capacity'], relatedTo: ['person'] },
  { key: 'research_coordinator', label: 'Research Coordinator', description: 'Clinical research coordinator managing study operations', itemType: 'person', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Study Operations'], relatedTo: ['capability'] },
  { key: 'regulatory_coordinator', label: 'Regulatory Coordinator', description: 'Staff responsible for IRB submissions, regulatory docs, compliance', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Regulatory', 'Compliance'], enablesCapabilities: ['Regulatory Operations'], relatedTo: ['regulatory'] },
  { key: 'recruitment_staff', label: 'Recruitment Staff', description: 'Patient recruitment and enrollment personnel', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Patient Recruitment'], relatedTo: ['capability'] },
  { key: 'lab_staff', label: 'Laboratory Staff', description: 'Lab technicians, technologists, processing personnel', itemType: 'person', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Lab Operations'], relatedTo: ['equipment', 'facility'] },
  { key: 'pharmacist', label: 'Pharmacist', description: 'Investigational drug or clinical trial pharmacist', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Pharmacy Operations'], relatedTo: ['facility'] },
  { key: 'nurse', label: 'Nurse / Research Nurse', description: 'Nursing staff supporting clinical research activities', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Clinical Operations'], relatedTo: ['facility'] },
  { key: 'medical_assistant', label: 'Medical Assistant', description: 'Medical assistants supporting clinical workflows', itemType: 'person', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Clinical Support'], relatedTo: ['person'] },
  { key: 'business_development', label: 'Business Development', description: 'Staff responsible for sponsor relationships, contracts, business growth', itemType: 'person', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Business Development'], relatedTo: [] },
  { key: 'quality_staff', label: 'Quality Staff', description: 'Quality assurance, quality control, audit personnel', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Quality', 'Compliance'], enablesCapabilities: ['Quality Operations'], relatedTo: ['quality'] },
  { key: 'executive_leadership', label: 'Executive Leadership', description: 'CEO, CMO, CSO, COO, and other executive roles', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Organizational Leadership'], relatedTo: [] },
  { key: 'admin_staff', label: 'Administrative Staff', description: 'Administrative, contracting, billing, and support personnel', itemType: 'person', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Administrative Support'], relatedTo: [] },
  { key: 'it_staff', label: 'IT / Informatics Staff', description: 'IT support, data management, EDC specialists, LIMS administrators', itemType: 'person', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Technology'], enablesCapabilities: ['Data Operations'], relatedTo: ['asset'] },
  { key: 'consultants', label: 'Consultants / Contractors', description: 'External consultants providing specialized services', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Specialized Expertise'], relatedTo: [] },
  { key: 'external_collaborators', label: 'External Collaborators', description: 'Academic collaborators, co-investigators at other institutions', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Network'], enablesCapabilities: ['Collaborative Research'], relatedTo: ['relationship'] },
]

// ==========================================================================
// PROFESSIONAL ATTRIBUTES
// ==========================================================================

export const PEOPLE_ATTRIBUTES: PeopleKnowledgeItem[] = [
  { key: 'professional_role', label: 'Professional Role', description: 'Current professional title and function', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'specialties', label: 'Specialties / Expertise', description: 'Medical specialties, research expertise, technical skills', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Specialized Capability'], relatedTo: ['capability'] },
  { key: 'research_experience_years', label: 'Research Experience', description: 'Years of research experience, number of studies, therapeutic areas', itemType: 'historical_event', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Research Track Record'], relatedTo: [] },
  { key: 'languages_spoken', label: 'Languages Spoken', description: 'Languages the person can communicate in professionally', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Patient Communication'], relatedTo: [] },
  { key: 'availability', label: 'Availability', description: 'Full-time, part-time, available hours, on-call status', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Operational Capacity'], relatedTo: [] },
  { key: 'employment_status', label: 'Employment Status', description: 'Active, on leave, terminated, retired, transitioning', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
]

// ==========================================================================
// LICENSES & CREDENTIALS
// ==========================================================================

export const PEOPLE_CREDENTIALS: PeopleKnowledgeItem[] = [
  { key: 'medical_license', label: 'Medical License', description: 'Active state medical license with number and expiration', itemType: 'certification', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Regulatory', 'Sponsor Intelligence'], enablesCapabilities: ['Clinical Practice'], relatedTo: [] },
  { key: 'dea_license', label: 'DEA Registration', description: 'Drug Enforcement Administration registration for controlled substances', itemType: 'certification', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Regulatory', 'Sponsor Intelligence'], enablesCapabilities: ['Controlled Substance Handling'], relatedTo: [] },
  { key: 'board_certification', label: 'Board Certification', description: 'Medical board certification in relevant specialty', itemType: 'certification', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Clinical Expertise'], relatedTo: [] },
  { key: 'professional_memberships', label: 'Professional Memberships', description: 'Membership in professional societies and organizations', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'affiliations', label: 'Institutional Affiliations', description: 'Other institutions or academic centers the person is affiliated with', itemType: 'relationship', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Multi-Institutional Research'], relatedTo: [] },
]

// ==========================================================================
// TRAINING
// ==========================================================================

export const PEOPLE_TRAINING: PeopleKnowledgeItem[] = [
  { key: 'gcp_training', label: 'GCP Training', description: 'Good Clinical Practice training completion and date', itemType: 'certification', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Regulatory', 'Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Regulatory Compliance'], relatedTo: [] },
  { key: 'iata_training', label: 'IATA Training', description: 'Dangerous goods shipping training for biological samples', itemType: 'certification', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Sample Shipping'], relatedTo: [] },
  { key: 'biosafety_training', label: 'Biosafety Training', description: 'Biosafety level training (BSL-2, BSL-3)', itemType: 'certification', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Compliance'], enablesCapabilities: ['Lab Safety'], relatedTo: [] },
  { key: 'sop_training', label: 'SOP Training Records', description: 'Training completion records for relevant SOPs', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Quality', 'Readiness'], enablesCapabilities: ['Operational Competence'], relatedTo: ['process'] },
  { key: 'human_subjects_training', label: 'Human Subjects Protection', description: 'CITI or equivalent human subjects research training', itemType: 'certification', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Regulatory', 'IRB'], enablesCapabilities: ['Ethical Research'], relatedTo: [] },
  { key: 'other_training', label: 'Additional Training', description: 'Other relevant training: EDC systems, informed consent, data privacy', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
]

// ==========================================================================
// PROGRAM PARTICIPATION
// ==========================================================================

export const PEOPLE_PROGRAMS: PeopleKnowledgeItem[] = [
  { key: 'delegation_log', label: 'Delegation of Authority Log', description: 'Record of delegated responsibilities per study', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Regulatory', 'Sponsor Intelligence'], enablesCapabilities: ['Study Authorization'], relatedTo: ['capability'] },
  { key: 'study_roles', label: 'Study Roles & Responsibilities', description: 'Specific roles on active and completed studies', itemType: 'historical_event', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Study Experience'], relatedTo: [] },
  { key: 'therapeutic_experience', label: 'Therapeutic Area Experience', description: 'Specific therapeutic areas the person has research experience in', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Therapeutic Expertise'], relatedTo: ['capability'] },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const PEOPLE_DOMAIN_CATALOG: PeopleKnowledgeItem[] = [
  ...PEOPLE_ROLES,
  ...PEOPLE_ATTRIBUTES,
  ...PEOPLE_CREDENTIALS,
  ...PEOPLE_TRAINING,
  ...PEOPLE_PROGRAMS,
]

// ==========================================================================
// DOCUMENT CATALOG
// ==========================================================================

export interface PeopleDocument {
  key: string
  label: string
  description: string
  required: boolean
  expires: boolean
  typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]
  evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const PEOPLE_DOCUMENTS: PeopleDocument[] = [
  { key: 'cv', label: 'Curriculum Vitae', description: 'Current CV with research experience and publications', required: true, expires: false, supportsKnowledgeItems: ['pi', 'sub_i', 'research_coordinator'], evidenceClass: 'A' },
  { key: 'medical_license_doc', label: 'Medical License', description: 'Active state medical license with number and expiration', required: false, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['medical_license'], evidenceClass: 'A' },
  { key: 'dea_doc', label: 'DEA Registration', description: 'DEA certificate for controlled substances', required: false, expires: true, typicalExpirationMonths: 36, supportsKnowledgeItems: ['dea_license'], evidenceClass: 'A' },
  { key: 'board_cert_doc', label: 'Board Certification', description: 'Board certification certificate', required: false, expires: true, typicalExpirationMonths: 120, supportsKnowledgeItems: ['board_certification'], evidenceClass: 'B' },
  { key: 'gcp_cert', label: 'GCP Certificate', description: 'Good Clinical Practice training certificate', required: true, expires: true, typicalExpirationMonths: 36, supportsKnowledgeItems: ['gcp_training'], evidenceClass: 'A' },
  { key: 'iata_cert', label: 'IATA Certificate', description: 'IATA dangerous goods shipping certificate', required: false, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['iata_training'], evidenceClass: 'B' },
  { key: 'biosafety_cert', label: 'Biosafety Training Certificate', description: 'BSL-2 or BSL-3 training completion', required: true, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['biosafety_training'], evidenceClass: 'B' },
  { key: 'human_subjects_cert', label: 'Human Subjects Protection Certificate', description: 'CITI or equivalent completion certificate', required: true, expires: true, typicalExpirationMonths: 36, supportsKnowledgeItems: ['human_subjects_training'], evidenceClass: 'A' },
  { key: 'diploma', label: 'Diploma / Degree', description: 'Highest relevant academic degree', required: false, expires: false, supportsKnowledgeItems: ['pi', 'sub_i'], evidenceClass: 'C' },
  { key: 'delegation_log_doc', label: 'Delegation of Authority Log', description: 'Signed delegation log for current studies', required: true, expires: true, typicalExpirationMonths: 0, supportsKnowledgeItems: ['delegation_log'], evidenceClass: 'A' },
  { key: 'job_description', label: 'Job Description', description: 'Current job description for the role', required: false, expires: false, supportsKnowledgeItems: ['professional_role'], evidenceClass: 'C' },
  { key: 'sop_training_log', label: 'SOP Training Log', description: 'Record of SOP-specific training completion', required: false, expires: false, supportsKnowledgeItems: ['sop_training'], evidenceClass: 'B' },
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const PEOPLE_DOMAIN_STATS = {
  totalKnowledgeItems: PEOPLE_DOMAIN_CATALOG.length,
  requiredItems: PEOPLE_DOMAIN_CATALOG.filter((i) => i.required).length,
  optionalItems: PEOPLE_DOMAIN_CATALOG.filter((i) => !i.required).length,
  itemsThatGenerateCandidates: PEOPLE_DOMAIN_CATALOG.filter((i) => i.generatesCandidates).length,
  totalDocuments: PEOPLE_DOCUMENTS.length,
  requiredDocuments: PEOPLE_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: PEOPLE_DOCUMENTS.filter((d) => d.expires).length,
  downstreamEngines: [...new Set(PEOPLE_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
  enabledCapabilities: [...new Set(PEOPLE_DOMAIN_CATALOG.flatMap((i) => i.enablesCapabilities))],
}

// ==========================================================================
// SECTIONS (progressive UX)
// ==========================================================================

export const PEOPLE_SECTIONS = [
  { name: 'Roles & Positions', items: PEOPLE_ROLES, completionKey: 'roles' },
  { name: 'Professional Profile', items: PEOPLE_ATTRIBUTES, completionKey: 'attributes' },
  { name: 'Licenses & Credentials', items: PEOPLE_CREDENTIALS, completionKey: 'credentials' },
  { name: 'Training & Certifications', items: PEOPLE_TRAINING, completionKey: 'training' },
  { name: 'Program Participation', items: PEOPLE_PROGRAMS, completionKey: 'programs' },
]

// ==========================================================================
// OPERATIONS — Auto-detection rules
// ==========================================================================

export const PEOPLE_OPERATIONS = {
  /** Items that should trigger alerts when expired or missing */
  criticalChecks: [
    { check: 'gcp_expired', description: 'GCP training expired or expiring within 30 days', keys: ['gcp_training'] },
    { check: 'license_expired', description: 'Medical license expired', keys: ['medical_license'] },
    { check: 'cv_missing', description: 'CV not uploaded for key personnel', keys: ['pi', 'sub_i', 'research_coordinator'] },
    { check: 'biosafety_missing', description: 'Biosafety training missing for lab staff', keys: ['biosafety_training'] },
    { check: 'human_subjects_expired', description: 'Human subjects protection training expired', keys: ['human_subjects_training'] },
    { check: 'delegation_log_missing', description: 'Delegation log missing for active studies', keys: ['delegation_log'] },
  ],
}
