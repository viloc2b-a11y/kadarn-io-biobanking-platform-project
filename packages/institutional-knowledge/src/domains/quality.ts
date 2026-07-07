// ==========================================================================
// IKM Domain Sprint — Quality Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface QualityItem {
  key: string; label: string; description: string
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]
}

// ==========================================================================
// QUALITY MANAGEMENT SYSTEM
// ==========================================================================

export const QMS_FOUNDATION: QualityItem[] = [
  { key: 'quality_manual', label: 'Quality Manual', description: 'The foundational document describing the institutional quality management system — policies, objectives, scope, and structure', itemType: 'quality', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Quality Operations'] },
  { key: 'quality_policy', label: 'Quality Policy', description: 'Institutional commitment to quality — signed by executive leadership', itemType: 'policy', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Quality Commitment'] },
  { key: 'quality_objectives', label: 'Quality Objectives', description: 'Measurable quality goals — e.g., CAPA closure within 30 days, audit completion rate, training compliance', itemType: 'goal', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: false, consumedBy: ['Readiness'], enablesCapabilities: ['Quality Measurement'] },
  { key: 'quality_org_chart', label: 'Quality Organization', description: 'Organizational structure for quality — who is responsible for QMS, audits, CAPA, training', itemType: 'other', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Quality Governance'] },
  { key: 'management_review', label: 'Management Review', description: 'Periodic management review of the quality system — meeting minutes, action items, effectiveness assessment', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Quality Oversight'] },
]

// ==========================================================================
// SOP LIBRARY & CONTROLLED DOCUMENTS
// ==========================================================================

export const SOP_LIBRARY: QualityItem[] = [
  { key: 'sop_inventory', label: 'SOP Inventory / Master List', description: 'Complete inventory of all controlled SOPs with versions, dates, and review status', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Document Control'] },
  { key: 'sop_format', label: 'SOP Template / Format Standard', description: 'Standardized SOP format — purpose, scope, definitions, procedure, references, revision history', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Standardization'] },
  { key: 'document_review', label: 'Periodic Document Review', description: 'Scheduled review of all controlled documents — typically every 2-3 years', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Document Currency'] },
  { key: 'document_approval', label: 'Document Approval Workflow', description: 'Process for document creation, review, approval, and issuance — who can author, who must approve', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Document Governance'] },
  { key: 'obsolete_documents', label: 'Obsolete Document Control', description: 'Process for retiring obsolete documents — archiving, preventing use, maintaining history', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: false, consumedBy: ['Regulatory'], enablesCapabilities: ['Document Lifecycle'] },
]

// ==========================================================================
// CAPA & DEVIATIONS
// ==========================================================================

export const CAPA_DEVIATIONS: QualityItem[] = [
  { key: 'capa_system', label: 'CAPA System', description: 'Corrective and Preventive Action system — process for identifying, investigating, and resolving quality issues', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality', 'Sponsor Intelligence'], enablesCapabilities: ['Quality Improvement'] },
  { key: 'deviation_management', label: 'Deviation / Nonconformance Management', description: 'Process for documenting, investigating, and resolving deviations from SOPs or specifications', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality', 'Regulatory'], enablesCapabilities: ['Issue Resolution'] },
  { key: 'root_cause_analysis', label: 'Root Cause Analysis', description: 'Methodology for identifying root causes of quality issues — 5 Whys, fishbone, FMEA', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Quality'], enablesCapabilities: ['Problem Solving'] },
  { key: 'corrective_action', label: 'Corrective Actions', description: 'Actions taken to eliminate the cause of detected nonconformities — tracked from identification through verification', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Issue Correction'] },
  { key: 'preventive_action', label: 'Preventive Actions', description: 'Actions taken to eliminate the cause of potential nonconformities — proactive risk reduction', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Risk Prevention'] },
]

// ==========================================================================
// RISK MANAGEMENT
// ==========================================================================

export const RISK_MANAGEMENT: QualityItem[] = [
  { key: 'risk_management_process', label: 'Risk Management Process', description: 'Institutional process for identifying, assessing, and mitigating operational and quality risks', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Risk Management'] },
  { key: 'risk_register', label: 'Risk Register', description: 'Documented inventory of identified risks with severity, probability, mitigations, and owners', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Risk Awareness'] },
  { key: 'change_control', label: 'Change Control', description: 'Process for managing changes to equipment, processes, facilities, or systems that could affect quality', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Change Management'] },
]

// ==========================================================================
// TRAINING & COMPETENCY
// ==========================================================================

export const TRAINING_COMPETENCY: QualityItem[] = [
  { key: 'training_matrix', label: 'Training Matrix', description: 'Matrix mapping roles to required training — SOPs, GCP, safety, equipment, quality', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Training Management'] },
  { key: 'competency_assessment', label: 'Competency Assessment', description: 'Process for assessing and documenting staff competency for critical tasks — initial and periodic', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Staff Competency'] },
  { key: 'training_records', label: 'Training Records', description: 'Documentation of completed training — date, topic, trainer, assessment results', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Regulatory', 'Sponsor Intelligence'], enablesCapabilities: ['Training Compliance'] },
]

// ==========================================================================
// AUDITS
// ==========================================================================

export const AUDITS: QualityItem[] = [
  { key: 'internal_audit_program', label: 'Internal Audit Program', description: 'Scheduled internal audits of processes, facilities, and documentation against QMS requirements', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality', 'Sponsor Intelligence'], enablesCapabilities: ['Self-Assessment'] },
  { key: 'audit_schedule', label: 'Audit Schedule', description: 'Annual audit schedule — what will be audited, when, and by whom', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Quality'], enablesCapabilities: ['Audit Planning'] },
  { key: 'audit_findings', label: 'Audit Findings & Observations', description: 'Documented findings from audits — observations, nonconformances, and required corrective actions', itemType: 'historical_event', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality', 'Sponsor Intelligence'], enablesCapabilities: ['Audit Outcomes'] },
  { key: 'audit_response', label: 'Audit Response & CAPA', description: 'Responses to audit findings — root cause analysis, corrective actions, and verification of effectiveness', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Audit Closure'] },
]

// ==========================================================================
// EQUIPMENT & VENDOR QUALITY
// ==========================================================================

export const EQUIPMENT_VENDOR_QUALITY: QualityItem[] = [
  { key: 'equipment_qualification', label: 'Equipment Qualification (IQ/OQ/PQ)', description: 'Installation, Operational, and Performance Qualification for critical equipment', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Equipment Quality'] },
  { key: 'preventive_maintenance', label: 'Preventive Maintenance Program', description: 'Scheduled preventive maintenance for all critical equipment with documented completion', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Equipment Reliability'] },
  { key: 'vendor_qualification', label: 'Vendor Qualification', description: 'Process for evaluating and approving vendors and suppliers that impact quality', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Supply Chain Quality'] },
  { key: 'approved_vendor_list', label: 'Approved Vendor List', description: 'Current list of qualified vendors with scope, certification status, and review dates', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Vendor Management'] },
]

// ==========================================================================
// QUALITY METRICS & IMPROVEMENT
// ==========================================================================

export const QUALITY_METRICS: QualityItem[] = [
  { key: 'quality_metrics', label: 'Quality Metrics / KPIs', description: 'Key quality indicators — CAPA closure time, audit findings, training compliance, deviation rates, document review status', itemType: 'process', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Quality Measurement'] },
  { key: 'continuous_improvement', label: 'Continuous Improvement Program', description: 'Structured program for identifying and implementing quality improvements — beyond CAPA, proactive enhancement', itemType: 'goal', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Quality Culture'] },
  { key: 'incident_reporting', label: 'Incident / Event Reporting', description: 'System for reporting quality or safety incidents — near misses, adverse events, equipment failures', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Quality', 'Regulatory'], enablesCapabilities: ['Safety Culture'] },
  { key: 'lessons_learned', label: 'Lessons Learned / Best Practices', description: 'Institutional knowledge capture from quality events — what went wrong, what was improved, what to replicate', itemType: 'historical_event', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Quality', 'Capability Intelligence'], enablesCapabilities: ['Organizational Learning'] },
  { key: 'quality_meetings', label: 'Quality Review Meetings', description: 'Regular meetings to review quality metrics, CAPA status, audit findings, and improvement initiatives', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Quality Communication'] },
]

// ==========================================================================
// DOCUMENTS
// ==========================================================================

export interface QualityDocument {
  key: string; label: string; description: string
  required: boolean; expires: boolean; typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]; evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const QUALITY_DOCUMENTS: QualityDocument[] = [
  { key: 'quality_manual_doc', label: 'Quality Manual', description: 'Complete quality manual with policies, scope, and QMS structure', required: true, expires: false, supportsKnowledgeItems: ['quality_manual'], evidenceClass: 'A' },
  { key: 'sop_master_list', label: 'SOP Master List', description: 'Current inventory of all controlled documents with versions and review dates', required: true, expires: false, supportsKnowledgeItems: ['sop_inventory'], evidenceClass: 'B' },
  { key: 'capa_log', label: 'CAPA Log / Tracker', description: 'Current CAPA log with status, owners, due dates, and effectiveness verification', required: true, expires: false, supportsKnowledgeItems: ['capa_system', 'corrective_action'], evidenceClass: 'A' },
  { key: 'deviation_log', label: 'Deviation / Nonconformance Log', description: 'Record of deviations with investigation summaries and dispositions', required: true, expires: false, supportsKnowledgeItems: ['deviation_management'], evidenceClass: 'A' },
  { key: 'audit_schedule_doc', label: 'Annual Audit Schedule', description: 'Current year audit schedule with scope and auditors assigned', required: false, expires: false, supportsKnowledgeItems: ['audit_schedule'], evidenceClass: 'B' },
  { key: 'audit_reports', label: 'Internal Audit Reports', description: 'Completed internal audit reports with findings and responses', required: true, expires: false, supportsKnowledgeItems: ['internal_audit_program', 'audit_findings'], evidenceClass: 'A' },
  { key: 'training_matrix_doc', label: 'Training Matrix', description: 'Current training matrix with role requirements and completion status', required: true, expires: false, supportsKnowledgeItems: ['training_matrix'], evidenceClass: 'B' },
  { key: 'mgmt_review_minutes', label: 'Management Review Minutes', description: 'Minutes from periodic management review meetings with action items', required: true, expires: false, supportsKnowledgeItems: ['management_review'], evidenceClass: 'B' },
  { key: 'risk_register_doc', label: 'Risk Register', description: 'Current risk register with assessments and mitigations', required: false, expires: false, supportsKnowledgeItems: ['risk_register'], evidenceClass: 'C' },
  { key: 'equipment_iqoq', label: 'Equipment IQ/OQ/PQ Records', description: 'Qualification documentation for critical equipment', required: true, expires: false, supportsKnowledgeItems: ['equipment_qualification'], evidenceClass: 'A' },
  { key: 'pm_schedule', label: 'Preventive Maintenance Schedule', description: 'PM schedule with completion records for all critical equipment', required: true, expires: false, supportsKnowledgeItems: ['preventive_maintenance'], evidenceClass: 'B' },
  { key: 'vendor_list', label: 'Approved Vendor List', description: 'Current list of qualified vendors with approval status', required: false, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['vendor_qualification', 'approved_vendor_list'], evidenceClass: 'C' },
  { key: 'change_control_log', label: 'Change Control Log', description: 'Record of change requests with approvals and implementation verification', required: false, expires: false, supportsKnowledgeItems: ['change_control'], evidenceClass: 'B' },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const QUALITY_DOMAIN_CATALOG: QualityItem[] = [
  ...QMS_FOUNDATION, ...SOP_LIBRARY, ...CAPA_DEVIATIONS,
  ...RISK_MANAGEMENT, ...TRAINING_COMPETENCY, ...AUDITS,
  ...EQUIPMENT_VENDOR_QUALITY, ...QUALITY_METRICS,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const QUALITY_DOMAIN_STATS = {
  totalItems: QUALITY_DOMAIN_CATALOG.length,
  requiredItems: QUALITY_DOMAIN_CATALOG.filter((i) => i.required).length,
  optionalItems: QUALITY_DOMAIN_CATALOG.filter((i) => !i.required).length,
  itemsGeneratingCandidates: QUALITY_DOMAIN_CATALOG.filter((i) => i.generatesCandidates).length,
  totalDocuments: QUALITY_DOCUMENTS.length,
  requiredDocuments: QUALITY_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: QUALITY_DOCUMENTS.filter((d) => d.expires).length,
  downstreamEngines: [...new Set(QUALITY_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const QUALITY_SECTIONS = [
  { name: 'QMS Foundation', items: QMS_FOUNDATION, completionKey: 'qms' },
  { name: 'SOP Library & Documents', items: SOP_LIBRARY, completionKey: 'sops' },
  { name: 'CAPA & Deviations', items: CAPA_DEVIATIONS, completionKey: 'capa' },
  { name: 'Risk Management', items: RISK_MANAGEMENT, completionKey: 'risk' },
  { name: 'Training & Competency', items: TRAINING_COMPETENCY, completionKey: 'training' },
  { name: 'Audits', items: AUDITS, completionKey: 'audits' },
  { name: 'Equipment & Vendor Quality', items: EQUIPMENT_VENDOR_QUALITY, completionKey: 'eq_vendor' },
  { name: 'Metrics & Improvement', items: QUALITY_METRICS, completionKey: 'metrics' },
]

// ==========================================================================
// OPERATIONS — Auto-detection
// ==========================================================================

export const QUALITY_OPERATIONS = {
  criticalChecks: [
    { check: 'no_quality_manual', description: 'Quality manual not documented', severity: 'critical' },
    { check: 'no_sop_inventory', description: 'SOP inventory / master list missing', severity: 'critical' },
    { check: 'no_capa_system', description: 'CAPA system not documented', severity: 'critical' },
    { check: 'no_internal_audit', description: 'Internal audit program not established', severity: 'critical' },
    { check: 'no_training_matrix', description: 'Training matrix not documented', severity: 'critical' },
    { check: 'overdue_document_review', description: 'Documents past their periodic review date', severity: 'warning' },
    { check: 'overdue_capa', description: 'CAPA items past their due date', severity: 'warning' },
    { check: 'expired_training', description: 'Staff training records expired or expiring', severity: 'warning' },
    { check: 'no_management_review', description: 'Management review not conducted in last 12 months', severity: 'warning' },
    { check: 'no_equipment_qualification', description: 'Critical equipment lacks IQ/OQ/PQ documentation', severity: 'critical' },
    { check: 'no_preventive_maintenance', description: 'Preventive maintenance program not documented', severity: 'warning' },
  ],
}
