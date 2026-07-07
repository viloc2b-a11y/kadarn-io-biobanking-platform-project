// ==========================================================================
// IKM Domain Sprint 5 — Laboratory Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface LabKnowledgeItem {
  key: string; label: string; description: string
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]; relatedTo: KnowledgeItemType[]
}

// ==========================================================================
// LABORATORY TYPES
// ==========================================================================

export const LAB_TYPES: LabKnowledgeItem[] = [
  { key: 'clinical_lab', label: 'Clinical Laboratory', description: 'CLIA-certified clinical lab performing patient testing and research assays', itemType: 'facility', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Clinical Testing', 'Patient Results'], relatedTo: ['facility', 'equipment', 'person'] },
  { key: 'research_lab', label: 'Research Laboratory', description: 'Non-clinical research lab for basic, translational, or applied research', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Research Operations'], relatedTo: ['facility', 'equipment', 'person'] },
  { key: 'processing_lab', label: 'Processing Laboratory', description: 'Lab dedicated to sample processing, aliquoting, and preparation', itemType: 'facility', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Sample Processing', 'Biospecimen Operations'], relatedTo: ['facility', 'equipment'] },
  { key: 'biospecimen_lab', label: 'Biospecimen Laboratory', description: 'Lab focused on biospecimen collection, processing, storage, and distribution', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Biospecimen Repository'], relatedTo: ['facility', 'equipment'] },
  { key: 'molecular_lab', label: 'Molecular Laboratory', description: 'Lab for DNA/RNA extraction, PCR, sequencing, and molecular analysis', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Molecular Testing'], relatedTo: ['equipment'] },
  { key: 'microbiology_lab', label: 'Microbiology Laboratory', description: 'Lab for culture, identification, and susceptibility testing', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Microbiology Testing'], relatedTo: ['equipment'] },
  { key: 'pathology_lab', label: 'Pathology / Histology Laboratory', description: 'Lab for tissue processing, embedding, sectioning, staining, and digital pathology', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Tissue Processing', 'Digital Pathology'], relatedTo: ['equipment'] },
  { key: 'flow_cytometry', label: 'Flow Cytometry Laboratory', description: 'Lab with flow cytometry capability for cell analysis and sorting', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Cell Analysis'], relatedTo: ['equipment', 'person'] },
  { key: 'pbmc_lab', label: 'PBMC Processing Laboratory', description: 'Lab specialized in PBMC isolation, viability testing, and cryopreservation', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['PBMC Processing'], relatedTo: ['equipment', 'process'] },
  { key: 'cell_culture', label: 'Cell Culture Laboratory', description: 'Lab for cell line maintenance, expansion, and characterization', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Cell Culture'], relatedTo: ['equipment'] },
  { key: 'genetics_lab', label: 'Genetics / Genomics Laboratory', description: 'Lab for genetic testing, sequencing, and genomic analysis', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Genomic Analysis'], relatedTo: ['equipment'] },
  { key: 'custom_lab', label: 'Custom / Specialized Laboratory', description: 'Lab with institution-specific or unique capabilities', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
]

// ==========================================================================
// LAB ATTRIBUTES
// ==========================================================================

export const LAB_ATTRIBUTES: LabKnowledgeItem[] = [
  { key: 'lab_name', label: 'Laboratory Name', description: 'Unique name or identifier for the laboratory', itemType: 'other', required: true, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'lab_type', label: 'Laboratory Type', description: 'Classification: clinical, research, processing, molecular, etc.', itemType: 'other', required: true, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'facility_assoc', label: 'Associated Facility', description: 'Physical facility where this laboratory is located', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], relatedTo: ['facility'] },
  { key: 'status', label: 'Operational Status', description: 'Planning, operational, restricted, maintenance, temporary_closure, inactive, retired', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'services', label: 'Services Performed', description: 'List of laboratory services and tests performed', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Service Portfolio'], relatedTo: ['capability'] },
  { key: 'supported_programs', label: 'Supported Programs', description: 'Research programs and studies this lab supports', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Program Support'], relatedTo: ['capability'] },
  { key: 'specimen_types', label: 'Supported Specimen Types', description: 'Blood, plasma, serum, PBMC, tissue, urine, CSF, etc.', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Sample Diversity'], relatedTo: [] },
  { key: 'processing_capacity', label: 'Processing Capacity', description: 'Samples per day, per week, or per month this lab can process', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Throughput'], relatedTo: [] },
  { key: 'operating_schedule', label: 'Operating Schedule', description: 'Hours of operation, weekend availability, on-call coverage', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Operational Availability'], relatedTo: [] },
  { key: 'biosafety_level', label: 'Biosafety Level', description: 'BSL-1, BSL-2, or BSL-3', itemType: 'regulatory', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Regulatory'], enablesCapabilities: ['Lab Safety'], relatedTo: [] },
  { key: 'quality_system', label: 'Quality System', description: 'QMS framework: CLIA, CAP, ISO 15189, ISO 9001, or institutional', itemType: 'quality', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Quality', 'Sponsor Intelligence'], enablesCapabilities: ['Quality Assurance'], relatedTo: ['quality'] },
  { key: 'accreditations', label: 'Accreditations', description: 'CLIA, CAP, AABB, FACT, or other lab-specific accreditations', itemType: 'certification', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Accredited Operations'], relatedTo: [] },
]

// ==========================================================================
// LAB OPERATIONS
// ==========================================================================

export const LAB_OPERATIONS: LabKnowledgeItem[] = [
  { key: 'sample_reception', label: 'Sample Reception', description: 'Process for receiving, accessions, and logging incoming samples', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Tracking'], relatedTo: ['process'] },
  { key: 'sample_processing', label: 'Sample Processing', description: 'Aliquoting, centrifugation, separation, and preparation workflows', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Processing'], relatedTo: ['process', 'equipment'] },
  { key: 'aliquoting', label: 'Aliquoting', description: 'Process for dividing samples into aliquots for storage or distribution', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Management'], relatedTo: ['process'] },
  { key: 'pbmc_isolation', label: 'PBMC Isolation', description: 'Density gradient centrifugation protocol for PBMC separation', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['PBMC Processing'], relatedTo: ['process', 'equipment'] },
  { key: 'dna_rna_extraction', label: 'DNA/RNA Extraction', description: 'Nucleic acid extraction protocols for various sample types', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Molecular Analysis'], relatedTo: ['process', 'equipment'] },
  { key: 'sample_storage', label: 'Sample Storage', description: 'Protocols for -80°C, -20°C, LN2, and ambient storage with monitoring', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Sample Preservation'], relatedTo: ['equipment'] },
  { key: 'shipping', label: 'Sample Shipping', description: 'Procedures for domestic and international sample shipping with cold chain', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Sample Distribution'], relatedTo: ['process'] },
  { key: 'chain_of_custody', label: 'Chain of Custody', description: 'Documented chain of custody from collection through disposition', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Regulatory', 'Compliance'], enablesCapabilities: ['Sample Traceability'], relatedTo: ['process'] },
  { key: 'temp_monitoring', label: 'Temperature Monitoring', description: 'Continuous temperature monitoring with alarm escalation procedures', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Sample Integrity'], relatedTo: ['equipment'] },
  { key: 'waste_management', label: 'Waste Management', description: 'Biohazard, chemical, and general waste disposal procedures', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Regulatory'], enablesCapabilities: ['Lab Safety'], relatedTo: [] },
  { key: 'quality_control', label: 'Quality Control', description: 'QC procedures: proficiency testing, control samples, calibration verification', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality', 'Capability Intelligence'], enablesCapabilities: ['Quality Assurance'], relatedTo: ['quality'] },
]

// ==========================================================================
// LIFECYCLE
// ==========================================================================

export const LAB_LIFECYCLE = {
  states: ['planning', 'operational', 'restricted', 'maintenance', 'temporary_closure', 'inactive', 'retired'] as const,
  transitions: {
    planning: ['operational'],
    operational: ['restricted', 'maintenance', 'temporary_closure', 'inactive', 'retired'],
    restricted: ['operational', 'inactive'],
    maintenance: ['operational'],
    temporary_closure: ['operational', 'inactive'],
    inactive: ['operational', 'retired'],
    retired: [],
  },
}

// ==========================================================================
// DOCUMENTS
// ==========================================================================

export interface LabDocument {
  key: string; label: string; description: string
  required: boolean; expires: boolean; typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]; evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const LAB_DOCUMENTS: LabDocument[] = [
  { key: 'lab_sop_set', label: 'Laboratory SOP Set', description: 'Complete set of laboratory standard operating procedures', required: true, expires: false, supportsKnowledgeItems: ['sample_processing', 'aliquoting', 'pbmc_isolation', 'dna_rna_extraction', 'sample_storage'], evidenceClass: 'A' },
  { key: 'quality_manual', label: 'Quality Manual', description: 'Laboratory quality manual or quality management plan', required: true, expires: false, supportsKnowledgeItems: ['quality_system', 'quality_control'], evidenceClass: 'A' },
  { key: 'clia_cert', label: 'CLIA Certificate', description: 'Current CLIA certificate with number and expiration', required: false, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['accreditations', 'clinical_lab'], evidenceClass: 'A' },
  { key: 'cap_cert', label: 'CAP Accreditation', description: 'College of American Pathologists accreditation certificate', required: false, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['accreditations'], evidenceClass: 'A' },
  { key: 'temp_logs', label: 'Temperature Monitoring Logs', description: 'Continuous temperature records for all storage units', required: true, expires: false, supportsKnowledgeItems: ['temp_monitoring', 'sample_storage'], evidenceClass: 'A' },
  { key: 'maintenance_logs', label: 'Equipment Maintenance Logs', description: 'Preventive and corrective maintenance records for all lab equipment', required: true, expires: false, supportsKnowledgeItems: ['sample_processing', 'pbmc_isolation'], evidenceClass: 'B' },
  { key: 'validation_report', label: 'Method Validation Reports', description: 'Validation documentation for laboratory methods and assays', required: false, expires: false, supportsKnowledgeItems: ['sample_processing', 'pbmc_isolation', 'dna_rna_extraction'], evidenceClass: 'A' },
  { key: 'proficiency_testing', label: 'Proficiency Testing Records', description: 'PT results and corrective action documentation', required: true, expires: false, supportsKnowledgeItems: ['quality_control'], evidenceClass: 'A' },
  { key: 'capa_log', label: 'CAPA Log', description: 'Corrective and Preventive Action records', required: false, expires: false, supportsKnowledgeItems: ['quality_system'], evidenceClass: 'B' },
  { key: 'deviation_log', label: 'Deviation / Nonconformance Log', description: 'Record of deviations from SOPs and nonconformances', required: false, expires: false, supportsKnowledgeItems: ['quality_system'], evidenceClass: 'B' },
  { key: 'inspection_report', label: 'Inspection / Audit Report', description: 'Most recent regulatory or accreditation inspection report', required: false, expires: false, supportsKnowledgeItems: ['accreditations', 'quality_system'], evidenceClass: 'A' },
  { key: 'chain_custody_sop', label: 'Chain of Custody SOP', description: 'Documented chain of custody procedure from receipt to disposal', required: true, expires: false, supportsKnowledgeItems: ['chain_of_custody'], evidenceClass: 'A' },
  { key: 'shipping_sop', label: 'Sample Shipping SOP', description: 'Procedure for preparing and shipping biological samples', required: false, expires: false, supportsKnowledgeItems: ['shipping'], evidenceClass: 'B' },
  { key: 'training_records', label: 'Staff Training Records', description: 'Training completion documentation for lab personnel', required: true, expires: false, supportsKnowledgeItems: ['sample_processing', 'pbmc_isolation', 'quality_control'], evidenceClass: 'B' },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const LAB_DOMAIN_CATALOG: LabKnowledgeItem[] = [
  ...LAB_TYPES,
  ...LAB_ATTRIBUTES,
  ...LAB_OPERATIONS,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const LAB_DOMAIN_STATS = {
  totalKnowledgeItems: LAB_DOMAIN_CATALOG.length,
  requiredItems: LAB_DOMAIN_CATALOG.filter((i) => i.required).length,
  optionalItems: LAB_DOMAIN_CATALOG.filter((i) => !i.required).length,
  itemsThatGenerateCandidates: LAB_DOMAIN_CATALOG.filter((i) => i.generatesCandidates).length,
  totalDocuments: LAB_DOCUMENTS.length,
  requiredDocuments: LAB_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: LAB_DOCUMENTS.filter((d) => d.expires).length,
  downstreamEngines: [...new Set(LAB_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
  enabledCapabilities: [...new Set(LAB_DOMAIN_CATALOG.flatMap((i) => i.enablesCapabilities))],
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const LAB_SECTIONS = [
  { name: 'Laboratory Types', items: LAB_TYPES, completionKey: 'types' },
  { name: 'Attributes & Profile', items: LAB_ATTRIBUTES, completionKey: 'attributes' },
  { name: 'Operations & Workflows', items: LAB_OPERATIONS, completionKey: 'operations' },
]

// ==========================================================================
// OPERATIONS
// ==========================================================================

export const LAB_OPERATIONS_CHECKS = {
  criticalChecks: [
    { check: 'no_sops', description: 'Laboratory SOPs not documented', keys: ['lab_sop_set'] },
    { check: 'no_quality_manual', description: 'Quality manual not documented', keys: ['quality_manual'] },
    { check: 'no_temp_monitoring', description: 'Temperature monitoring not documented', keys: ['temp_monitoring', 'sample_storage'] },
    { check: 'no_chain_of_custody', description: 'Chain of custody procedure not documented', keys: ['chain_of_custody'] },
    { check: 'accreditation_expired', description: 'Lab accreditation expired or expiring', keys: ['clia_cert', 'cap_cert', 'accreditations'] },
    { check: 'no_proficiency', description: 'Proficiency testing records missing', keys: ['proficiency_testing'] },
    { check: 'no_training', description: 'Staff training records missing for lab personnel', keys: ['training_records'] },
    { check: 'no_personnel', description: 'No personnel assigned to laboratory', keys: ['processing_lab', 'biospecimen_lab'] },
  ],
}

// ==========================================================================
// DASHBOARD STATE
// ==========================================================================

export const LAB_DASHBOARD_SECTIONS = [
  'lab_health',
  'operational_readiness',
  'documentation_status',
  'quality_status',
  'knowledge_health',
  'evidence_maturity',
  'pending_actions',
] as const
