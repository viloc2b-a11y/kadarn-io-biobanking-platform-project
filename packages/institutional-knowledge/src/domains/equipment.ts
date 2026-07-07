// ==========================================================================
// IKM Domain Sprint 4 — Equipment Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface EquipmentKnowledgeItem {
  key: string; label: string; description: string
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]; relatedTo: KnowledgeItemType[]
}

// ==========================================================================
// EQUIPMENT TYPES
// ==========================================================================

export const EQUIPMENT_TYPES: EquipmentKnowledgeItem[] = [
  { key: 'freezer_80', label: '-80°C Freezer', description: 'Ultra-low temperature freezer for long-term biospecimen storage', itemType: 'equipment', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Biospecimen Storage'], relatedTo: ['facility'] },
  { key: 'freezer_20', label: '-20°C Freezer', description: 'Standard freezer for reagent and short-term sample storage', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Storage'], relatedTo: ['facility'] },
  { key: 'refrigerator', label: 'Refrigerator (2-8°C)', description: 'Refrigerated storage for reagents, samples, and temperature-sensitive materials', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Storage'], relatedTo: ['facility'] },
  { key: 'ln2_tank', label: 'Liquid Nitrogen Tank', description: 'Cryogenic storage for viable cells, tissues, and long-term preservation', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Cryopreservation'], relatedTo: ['facility'] },
  { key: 'centrifuge', label: 'Centrifuge', description: 'Refrigerated or standard centrifuge for sample processing', itemType: 'equipment', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Processing'], relatedTo: ['facility'] },
  { key: 'biosafety_cabinet', label: 'Biosafety Cabinet', description: 'Class II BSC for sterile sample handling and processing', itemType: 'equipment', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Regulatory'], enablesCapabilities: ['Sample Processing', 'Lab Safety'], relatedTo: ['facility'] },
  { key: 'laminar_hood', label: 'Laminar Flow Hood', description: 'Clean air workstation for sterile procedures', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sterile Processing'], relatedTo: ['facility'] },
  { key: 'incubator', label: 'CO2 Incubator', description: 'Cell culture incubator for viable cell maintenance', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Cell Culture'], relatedTo: ['facility'] },
  { key: 'microscope', label: 'Microscope', description: 'Light, fluorescence, or inverted microscope for cell analysis', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Cell Analysis'], relatedTo: ['facility'] },
  { key: 'balance', label: 'Analytical Balance', description: 'Precision balance for sample and reagent weighing', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: [], enablesCapabilities: ['Sample Preparation'], relatedTo: ['facility'] },
  { key: 'pipette', label: 'Pipette Set', description: 'Calibrated pipettes for precise liquid handling', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: [], enablesCapabilities: ['Sample Processing'], relatedTo: [] },
  { key: 'temp_monitoring', label: 'Temperature Monitoring System', description: 'Continuous temperature monitoring with alarms for storage units', itemType: 'equipment', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Sample Integrity', 'Regulatory Compliance'], relatedTo: ['facility'] },
  { key: 'pcr_machine', label: 'PCR / Thermal Cycler', description: 'PCR machine for nucleic acid amplification', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Molecular Analysis'], relatedTo: ['facility'] },
  { key: 'water_purification', label: 'Water Purification System', description: 'Type I/II water system for laboratory use', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: [], enablesCapabilities: ['Lab Operations'], relatedTo: ['facility'] },
  { key: 'backup_generator', label: 'Backup Generator', description: 'Emergency power generator for critical equipment', itemType: 'equipment', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Operational Continuity'], relatedTo: ['facility'] },
  { key: 'ups', label: 'UPS / Battery Backup', description: 'Uninterruptible power supply for critical instruments', itemType: 'equipment', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Operational Continuity'], relatedTo: [] },
  { key: 'shipping_equipment', label: 'Shipping Equipment', description: 'Validated shipping containers, data loggers, and cold chain packaging', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Sample Shipping'], relatedTo: [] },
  { key: 'label_printer', label: 'Barcode / Label Printer', description: 'Printer for sample labels, barcodes, and cryo-labels', itemType: 'equipment', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Sample Tracking'], relatedTo: [] },
  { key: 'custom_equipment', label: 'Other / Custom Equipment', description: 'Specialized or institution-specific equipment not listed above', itemType: 'equipment', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
]

// ==========================================================================
// EQUIPMENT ATTRIBUTES
// ==========================================================================

export const EQUIPMENT_ATTRIBUTES: EquipmentKnowledgeItem[] = [
  { key: 'manufacturer', label: 'Manufacturer', description: 'Equipment manufacturer or vendor', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'model', label: 'Model / Version', description: 'Model number or version identifier', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
  { key: 'serial_number', label: 'Serial Number', description: 'Manufacturer serial number for traceability', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Quality', 'Compliance'], enablesCapabilities: ['Equipment Traceability'], relatedTo: [] },
  { key: 'asset_id', label: 'Internal Asset ID', description: 'Institutional asset tag or internal identifier', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
  { key: 'location', label: 'Assigned Location', description: 'Facility and room where equipment is installed', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: [], relatedTo: ['facility'] },
  { key: 'owner', label: 'Assigned Owner / Operator', description: 'Person responsible for equipment operation and maintenance', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Equipment Management'], relatedTo: ['person'] },
  { key: 'status', label: 'Operational Status', description: 'Planned, installed, operational, under maintenance, out of service, retired, disposed', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'install_date', label: 'Installation Date', description: 'Date equipment was installed and put into service', itemType: 'historical_event', required: false, historical: false, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
  { key: 'retired_date', label: 'Retired / Disposal Date', description: 'Date equipment was taken out of service or disposed', itemType: 'historical_event', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
  { key: 'supports_capability', label: 'Supports Capability', description: 'Which institutional capabilities this equipment enables', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: [], relatedTo: ['capability'] },
]

// ==========================================================================
// LIFECYCLE
// ==========================================================================

export const EQUIPMENT_LIFECYCLE = {
  states: ['planned', 'installed', 'operational', 'under_maintenance', 'out_of_service', 'retired', 'disposed'] as const,
  transitions: {
    planned: ['installed'],
    installed: ['operational', 'retired'],
    operational: ['under_maintenance', 'out_of_service', 'retired'],
    under_maintenance: ['operational', 'out_of_service'],
    out_of_service: ['operational', 'retired'],
    retired: ['disposed'],
    disposed: [],
  },
}

// ==========================================================================
// DOCUMENTS
// ==========================================================================

export interface EquipmentDocument {
  key: string; label: string; description: string
  required: boolean; expires: boolean; typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]; evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const EQUIPMENT_DOCUMENTS: EquipmentDocument[] = [
  { key: 'purchase_record', label: 'Purchase Record / Invoice', description: 'Proof of equipment acquisition', required: false, expires: false, supportsKnowledgeItems: ['freezer_80', 'centrifuge', 'biosafety_cabinet'], evidenceClass: 'D' },
  { key: 'iq_doc', label: 'Installation Qualification (IQ)', description: 'Documented verification that equipment is installed correctly', required: true, expires: false, supportsKnowledgeItems: ['freezer_80', 'centrifuge', 'biosafety_cabinet', 'temp_monitoring', 'pcr_machine'], evidenceClass: 'A' },
  { key: 'oq_doc', label: 'Operational Qualification (OQ)', description: 'Documented verification that equipment operates within specifications', required: true, expires: false, supportsKnowledgeItems: ['freezer_80', 'centrifuge', 'biosafety_cabinet'], evidenceClass: 'A' },
  { key: 'pq_doc', label: 'Performance Qualification (PQ)', description: 'Documented verification of equipment performance under load', required: false, expires: false, supportsKnowledgeItems: ['freezer_80', 'biosafety_cabinet'], evidenceClass: 'B' },
  { key: 'calibration_cert', label: 'Calibration Certificate', description: 'Current calibration certificate with date and results', required: true, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['centrifuge', 'balance', 'pipette', 'temp_monitoring', 'pcr_machine', 'biosafety_cabinet'], evidenceClass: 'A' },
  { key: 'maintenance_log', label: 'Maintenance Log / Service Record', description: 'Record of preventive and corrective maintenance', required: true, expires: false, supportsKnowledgeItems: ['freezer_80', 'centrifuge', 'biosafety_cabinet', 'ln2_tank', 'backup_generator'], evidenceClass: 'B' },
  { key: 'temp_log', label: 'Temperature Monitoring Logs', description: 'Continuous temperature records for storage equipment', required: true, expires: false, supportsKnowledgeItems: ['freezer_80', 'freezer_20', 'refrigerator', 'ln2_tank', 'temp_monitoring'], evidenceClass: 'A' },
  { key: 'bsc_cert', label: 'Biosafety Cabinet Certification', description: 'Annual BSC certification for airflow and containment', required: true, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['biosafety_cabinet', 'laminar_hood'], evidenceClass: 'A' },
  { key: 'eq_sop', label: 'Equipment SOP', description: 'Standard operating procedure for equipment use', required: false, expires: false, supportsKnowledgeItems: ['centrifuge', 'biosafety_cabinet', 'pcr_machine', 'ln2_tank'], evidenceClass: 'B' },
  { key: 'warranty', label: 'Warranty / Service Contract', description: 'Active warranty or service contract documentation', required: false, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['freezer_80', 'centrifuge', 'biosafety_cabinet', 'pcr_machine'], evidenceClass: 'C' },
  { key: 'manual', label: 'Equipment Manual', description: 'Manufacturer operating manual', required: false, expires: false, supportsKnowledgeItems: ['freezer_80', 'centrifuge', 'biosafety_cabinet'], evidenceClass: 'D' },
  { key: 'eq_photo', label: 'Equipment Photograph', description: 'Photo of installed equipment with visible asset tag', required: false, expires: false, supportsKnowledgeItems: ['freezer_80', 'centrifuge', 'biosafety_cabinet'], evidenceClass: 'D' },
  { key: 'generator_test', label: 'Generator Test Record', description: 'Monthly or quarterly backup generator test results', required: true, expires: false, supportsKnowledgeItems: ['backup_generator'], evidenceClass: 'B' },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const EQUIPMENT_DOMAIN_CATALOG: EquipmentKnowledgeItem[] = [
  ...EQUIPMENT_TYPES,
  ...EQUIPMENT_ATTRIBUTES,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const EQUIPMENT_DOMAIN_STATS = {
  totalKnowledgeItems: EQUIPMENT_DOMAIN_CATALOG.length,
  requiredItems: EQUIPMENT_DOMAIN_CATALOG.filter((i) => i.required).length,
  optionalItems: EQUIPMENT_DOMAIN_CATALOG.filter((i) => !i.required).length,
  itemsThatGenerateCandidates: EQUIPMENT_DOMAIN_CATALOG.filter((i) => i.generatesCandidates).length,
  totalDocuments: EQUIPMENT_DOCUMENTS.length,
  requiredDocuments: EQUIPMENT_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: EQUIPMENT_DOCUMENTS.filter((d) => d.expires).length,
  downstreamEngines: [...new Set(EQUIPMENT_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
  enabledCapabilities: [...new Set(EQUIPMENT_DOMAIN_CATALOG.flatMap((i) => i.enablesCapabilities))],
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const EQUIPMENT_SECTIONS = [
  { name: 'Storage Equipment', items: EQUIPMENT_TYPES.filter((i) => ['freezer_80', 'freezer_20', 'refrigerator', 'ln2_tank'].includes(i.key)), completionKey: 'storage' },
  { name: 'Processing Equipment', items: EQUIPMENT_TYPES.filter((i) => ['centrifuge', 'biosafety_cabinet', 'laminar_hood', 'incubator'].includes(i.key)), completionKey: 'processing' },
  { name: 'Analytical Equipment', items: EQUIPMENT_TYPES.filter((i) => ['microscope', 'balance', 'pipette', 'pcr_machine'].includes(i.key)), completionKey: 'analytical' },
  { name: 'Monitoring & Infrastructure', items: EQUIPMENT_TYPES.filter((i) => ['temp_monitoring', 'water_purification', 'backup_generator', 'ups'].includes(i.key)), completionKey: 'monitoring' },
  { name: 'Support Equipment', items: EQUIPMENT_TYPES.filter((i) => ['shipping_equipment', 'label_printer', 'custom_equipment'].includes(i.key)), completionKey: 'support' },
  { name: 'Attributes & Metadata', items: EQUIPMENT_ATTRIBUTES, completionKey: 'attributes' },
]

// ==========================================================================
// OPERATIONS
// ==========================================================================

export const EQUIPMENT_OPERATIONS = {
  criticalChecks: [
    { check: 'calibration_expired', description: 'Calibration certificate expired or expiring within 30 days', keys: ['centrifuge', 'balance', 'pipette', 'temp_monitoring'] },
    { check: 'bsc_cert_expired', description: 'Biosafety cabinet certification expired or expiring', keys: ['biosafety_cabinet', 'laminar_hood'] },
    { check: 'temp_logs_missing', description: 'Temperature monitoring logs missing for storage equipment', keys: ['freezer_80', 'freezer_20', 'refrigerator', 'ln2_tank'] },
    { check: 'iq_missing', description: 'Installation qualification missing for critical equipment', keys: ['freezer_80', 'centrifuge', 'biosafety_cabinet'] },
    { check: 'no_owner', description: 'Equipment has no assigned owner/operator', keys: ['freezer_80', 'centrifuge', 'biosafety_cabinet'] },
    { check: 'no_location', description: 'Equipment location not documented', keys: ['freezer_80', 'centrifuge'] },
    { check: 'generator_not_tested', description: 'Backup generator test records missing', keys: ['backup_generator'] },
    { check: 'no_sop', description: 'Equipment lacks standard operating procedure', keys: ['centrifuge', 'biosafety_cabinet', 'pcr_machine'] },
  ],
}

// ==========================================================================
// DASHBOARD STATE
// ==========================================================================

export const EQUIPMENT_DASHBOARD_SECTIONS = [
  'equipment_inventory',
  'operational_equipment',
  'equipment_requiring_attention',
  'upcoming_expirations',
  'calibration_status',
  'maintenance_status',
  'evidence_maturity',
  'knowledge_health',
] as const
