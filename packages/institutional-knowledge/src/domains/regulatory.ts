// ==========================================================================
// IKM Domain Sprint — Regulatory Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface RegulatoryItem {
  key: string; label: string; description: string
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; expires: boolean; typicalExpirationMonths?: number
  generatesCandidates: boolean; consumedBy: string[]
  category: 'irb_ethics' | 'federal_registrations' | 'lab_certifications' | 'licenses' | 'shipping_safety' | 'policies_insurance'
}

// ==========================================================================
// IRB / ETHICS OVERSIGHT
// ==========================================================================

export const IRB_ETHICS: RegulatoryItem[] = [
  { key: 'irb_registration', label: 'IRB Registration', description: 'Institutional Review Board registration — internal IRB, external IRB, or commercial IRB arrangement', itemType: 'regulatory', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 36, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Compliance'], category: 'irb_ethics' },
  { key: 'irb_agreement', label: 'IRB Agreement / Reliance', description: 'Documentation of IRB reliance agreements or external IRB contracts', itemType: 'regulatory', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 36, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], category: 'irb_ethics' },
  { key: 'ibc_registration', label: 'IBC Registration', description: 'Institutional Biosafety Committee registration — required for recombinant DNA, gene therapy, and biohazard research', itemType: 'regulatory', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 36, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], category: 'irb_ethics' },
  { key: 'ethics_committee', label: 'Ethics Committee Registration', description: 'Ethics Committee registration for non-FDA research or international ethics review requirements', itemType: 'regulatory', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 36, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], category: 'irb_ethics' },
  { key: 'human_subjects_protection', label: 'Human Subjects Protection Training', description: 'Institutional training on human subjects protection — institutional certification of compliance', itemType: 'training', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 24, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], category: 'irb_ethics' },
  { key: 'irb_roster', label: 'Current IRB Roster', description: 'Current IRB membership roster with qualifications and affiliations', itemType: 'regulatory', required: true, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], category: 'irb_ethics' },
]

// ==========================================================================
// FEDERAL REGISTRATIONS
// ==========================================================================

export const FEDERAL_REGISTRATIONS: RegulatoryItem[] = [
  { key: 'fwa', label: 'Federalwide Assurance (FWA)', description: 'OHRP Federalwide Assurance — required for all institutions conducting HHS-funded human subjects research', itemType: 'regulatory', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], category: 'federal_registrations' },
  { key: 'fda_registration', label: 'FDA Establishment Registration', description: 'FDA registration for facilities that manufacture, process, or handle investigational products', itemType: 'regulatory', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Compliance'], category: 'federal_registrations' },
  { key: 'clinicaltrials_gov', label: 'ClinicalTrials.gov Registration', description: 'Institutional registration and compliance with ClinicalTrials.gov reporting requirements', itemType: 'regulatory', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Compliance'], category: 'federal_registrations' },
  { key: 'ohrp_registration', label: 'OHRP Registration', description: 'Office for Human Research Protections institutional registration', itemType: 'regulatory', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], category: 'federal_registrations' },
  { key: 'dea_registration', label: 'DEA Registration', description: 'Drug Enforcement Administration registration for handling controlled substances in research', itemType: 'licensing', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 36, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Compliance'], category: 'federal_registrations' },
]

// ==========================================================================
// LABORATORY CERTIFICATIONS
// ==========================================================================

export const LAB_CERTIFICATIONS: RegulatoryItem[] = [
  { key: 'clia_certificate', label: 'CLIA Certificate', description: 'Clinical Laboratory Improvement Amendments certificate — required for all clinical lab testing', itemType: 'certification', required: true, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Capability Intelligence'], category: 'lab_certifications' },
  { key: 'cap_accreditation', label: 'CAP Accreditation', description: 'College of American Pathologists laboratory accreditation', itemType: 'certification', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Capability Intelligence'], category: 'lab_certifications' },
  { key: 'cola_accreditation', label: 'COLA Accreditation', description: 'COLA laboratory accreditation for physician office and clinical laboratories', itemType: 'certification', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], category: 'lab_certifications' },
  { key: 'iso_certification', label: 'ISO Certification', description: 'ISO 15189 (medical laboratories) or ISO 17025 (testing/calibration) certification', itemType: 'certification', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], category: 'lab_certifications' },
]

// ==========================================================================
// STATE & PROFESSIONAL LICENSES
// ==========================================================================

export const STATE_LICENSES: RegulatoryItem[] = [
  { key: 'state_license', label: 'State Clinical Laboratory License', description: 'State-issued clinical laboratory operating license — requirements vary by state', itemType: 'licensing', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 12, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], category: 'licenses' },
  { key: 'state_business_license', label: 'State Business License', description: 'General state business registration for operating as a legal entity', itemType: 'licensing', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 12, generatesCandidates: true, consumedBy: ['Readiness', 'Compliance'], category: 'licenses' },
  { key: 'medical_director_license', label: 'Medical Director License', description: 'Current medical license for the Laboratory Medical Director or equivalent', itemType: 'licensing', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 24, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Capability Intelligence'], category: 'licenses' },
  { key: 'radiology_license', label: 'Radiology / Imaging License', description: 'State license for radiology, MRI, CT, or other imaging equipment and operations', itemType: 'licensing', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 12, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], category: 'licenses' },
  { key: 'pharmacy_license', label: 'Investigational Pharmacy License', description: 'Pharmacy license for handling investigational drugs and devices — if institution operates a pharmacy', itemType: 'licensing', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 12, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], category: 'licenses' },
]

// ==========================================================================
// SHIPPING & SAFETY CERTIFICATIONS
// ==========================================================================

export const SHIPPING_SAFETY: RegulatoryItem[] = [
  { key: 'iata_certification', label: 'IATA Dangerous Goods Certification', description: 'IATA certification for shipping dangerous goods — required for biological sample shipping', itemType: 'certification', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 24, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], category: 'shipping_safety' },
  { key: 'biohazard_certification', label: 'Biohazard / BSL Certification', description: 'Biosafety level certification for laboratory facilities handling biological agents', itemType: 'certification', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 36, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence', 'Sponsor Intelligence'], category: 'shipping_safety' },
  { key: 'import_export', label: 'Import / Export Permits', description: 'Permits for importing or exporting biological materials across borders', itemType: 'licensing', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 12, generatesCandidates: true, consumedBy: ['Capability Intelligence'], category: 'shipping_safety' },
]

// ==========================================================================
// POLICIES & INSURANCE
// ==========================================================================

export const POLICIES_INSURANCE: RegulatoryItem[] = [
  { key: 'research_misconduct_policy', label: 'Research Misconduct Policy', description: 'Institutional policy for handling research misconduct allegations and investigations', itemType: 'policy', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Compliance'], category: 'policies_insurance' },
  { key: 'conflict_of_interest_policy', label: 'Conflict of Interest Policy', description: 'Institutional policy for managing financial and non-financial conflicts of interest in research', itemType: 'policy', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Compliance', 'Sponsor Intelligence'], category: 'policies_insurance' },
  { key: 'data_management_policy', label: 'Data Management / Sharing Policy', description: 'Institutional policy for research data management, retention, and sharing', itemType: 'policy', required: false, historical: true, documentSupported: true, expires: false, generatesCandidates: true, consumedBy: ['Compliance'], category: 'policies_insurance' },
  { key: 'research_insurance', label: 'Research / Clinical Trial Insurance', description: 'Insurance policy covering clinical trial activities — required by most sponsors', itemType: 'policy', required: true, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 12, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Compliance'], category: 'policies_insurance' },
  { key: 'professional_liability', label: 'Professional Liability Insurance', description: 'Malpractice or professional liability coverage for physicians and investigators', itemType: 'policy', required: false, historical: true, documentSupported: true, expires: true, typicalExpirationMonths: 12, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], category: 'policies_insurance' },
]

// ==========================================================================
// DOCUMENTS
// ==========================================================================

export interface RegulatoryDocument {
  key: string; label: string; description: string
  required: boolean; expires: boolean; typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]; evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const REGULATORY_DOCUMENTS: RegulatoryDocument[] = [
  { key: 'irb_approval_letter', label: 'IRB Approval Letter', description: 'Current IRB registration or approval letter for the institution', required: true, expires: true, typicalExpirationMonths: 36, supportsKnowledgeItems: ['irb_registration'], evidenceClass: 'A' },
  { key: 'fwa_document', label: 'FWA Document', description: 'Federalwide Assurance number and approval documentation', required: false, expires: false, supportsKnowledgeItems: ['fwa'], evidenceClass: 'A' },
  { key: 'clia_certificate_doc', label: 'CLIA Certificate', description: 'Current CLIA certificate with CLIA number', required: true, expires: false, supportsKnowledgeItems: ['clia_certificate'], evidenceClass: 'A' },
  { key: 'cap_certificate_doc', label: 'CAP Accreditation Certificate', description: 'Current CAP accreditation certificate', required: false, expires: false, supportsKnowledgeItems: ['cap_accreditation'], evidenceClass: 'A' },
  { key: 'dea_certificate', label: 'DEA Registration Certificate', description: 'Current DEA registration certificate', required: false, expires: true, typicalExpirationMonths: 36, supportsKnowledgeItems: ['dea_registration'], evidenceClass: 'A' },
  { key: 'iata_certificate_doc', label: 'IATA Training Certificate', description: 'Current IATA dangerous goods certification for shipping staff', required: true, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['iata_certification'], evidenceClass: 'B' },
  { key: 'state_lab_license_doc', label: 'State Lab License', description: 'Current state clinical laboratory license', required: true, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['state_license'], evidenceClass: 'B' },
  { key: 'medical_license_doc', label: 'Medical Director License', description: 'Current medical license for the Lab Director', required: true, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['medical_director_license'], evidenceClass: 'A' },
  { key: 'insurance_cert', label: 'Insurance Certificate', description: 'Certificate of clinical trial research insurance', required: true, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['research_insurance'], evidenceClass: 'B' },
  { key: 'fda_registration_doc', label: 'FDA Registration Certificate', description: 'FDA establishment registration documentation', required: false, expires: false, supportsKnowledgeItems: ['fda_registration'], evidenceClass: 'A' },
  { key: 'human_subjects_cert', label: 'Human Subjects Protection Certificate', description: 'Institutional or key personnel human subjects protection training certificates', required: true, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['human_subjects_protection'], evidenceClass: 'B' },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const REGULATORY_DOMAIN_CATALOG: RegulatoryItem[] = [
  ...IRB_ETHICS, ...FEDERAL_REGISTRATIONS, ...LAB_CERTIFICATIONS,
  ...STATE_LICENSES, ...SHIPPING_SAFETY, ...POLICIES_INSURANCE,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const REGULATORY_DOMAIN_STATS = {
  totalItems: REGULATORY_DOMAIN_CATALOG.length,
  requiredItems: REGULATORY_DOMAIN_CATALOG.filter((i) => i.required).length,
  expiringItems: REGULATORY_DOMAIN_CATALOG.filter((i) => i.expires).length,
  itemsGeneratingCandidates: REGULATORY_DOMAIN_CATALOG.filter((i) => i.generatesCandidates).length,
  totalDocuments: REGULATORY_DOCUMENTS.length,
  requiredDocuments: REGULATORY_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: REGULATORY_DOCUMENTS.filter((d) => d.expires).length,
  downstreamEngines: [...new Set(REGULATORY_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
  byCategory: {
    irbEthics: IRB_ETHICS.length,
    federalRegistrations: FEDERAL_REGISTRATIONS.length,
    labCertifications: LAB_CERTIFICATIONS.length,
    stateLicenses: STATE_LICENSES.length,
    shippingSafety: SHIPPING_SAFETY.length,
    policiesInsurance: POLICIES_INSURANCE.length,
  },
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const REGULATORY_SECTIONS = [
  { name: 'IRB & Ethics Oversight', items: IRB_ETHICS, completionKey: 'irb' },
  { name: 'Federal Registrations', items: FEDERAL_REGISTRATIONS, completionKey: 'federal' },
  { name: 'Laboratory Certifications', items: LAB_CERTIFICATIONS, completionKey: 'lab_cert' },
  { name: 'State & Professional Licenses', items: STATE_LICENSES, completionKey: 'licenses' },
  { name: 'Shipping & Safety', items: SHIPPING_SAFETY, completionKey: 'safety' },
  { name: 'Institutional Policies & Insurance', items: POLICIES_INSURANCE, completionKey: 'policies' },
]

// ==========================================================================
// LIFECYCLE — Renewal tracking
// ==========================================================================

export const REGULATORY_LIFECYCLE = {
  // Items that need renewal tracking
  renewableItems: REGULATORY_DOMAIN_CATALOG.filter((i) => i.expires).map((i) => ({
    key: i.key,
    label: i.label,
    typicalMonths: i.typicalExpirationMonths || 12,
    remindAt: '90 days before expiration',
  })),
  // Items that never expire but require periodic confirmation
  permanentItems: REGULATORY_DOMAIN_CATALOG.filter((i) => !i.expires).map((i) => ({
    key: i.key,
    label: i.label,
    confirmInterval: 'Annual confirmation recommended',
  })),
}

// ==========================================================================
// OPERATIONS — Auto-detection
// ==========================================================================

export const REGULATORY_OPERATIONS = {
  criticalChecks: [
    { check: 'missing_irb', description: 'No IRB registration or agreement documented', severity: 'critical' },
    { check: 'missing_clia', description: 'CLIA certificate not documented', severity: 'critical' },
    { check: 'missing_state_lab_license', description: 'State clinical laboratory license not documented', severity: 'critical' },
    { check: 'missing_medical_director_license', description: 'Medical Director license not documented', severity: 'critical' },
    { check: 'missing_insurance', description: 'Research / clinical trial insurance not documented', severity: 'critical' },
    { check: 'missing_iata', description: 'IATA certification not documented — cannot ship samples', severity: 'critical' },
    { check: 'missing_human_subjects', description: 'Human subjects protection training expired or missing', severity: 'warning' },
    { check: 'expired_license', description: 'One or more licenses past expiration date', severity: 'critical' },
    { check: 'expiring_soon', description: 'One or more licenses expire within 90 days', severity: 'warning' },
    { check: 'no_regulatory_owner', description: 'No person assigned as regulatory compliance owner', severity: 'warning' },
  ],
}
