// ==========================================================================
// IKM Domain Sprint 3 — Facilities Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface FacilityKnowledgeItem {
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
// FACILITY TYPES
// ==========================================================================

export const FACILITY_TYPES: FacilityKnowledgeItem[] = [
  { key: 'main_site', label: 'Main Site', description: 'Primary institutional location — headquarters, main hospital, or central facility', itemType: 'facility', required: true, historical: false, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness', 'Capability Intelligence'], enablesCapabilities: ['Institutional Presence'], relatedTo: [] },
  { key: 'satellite_site', label: 'Satellite Site', description: 'Secondary location operating under the main institution', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Multi-Site Operations', 'Geographic Coverage'], relatedTo: [] },
  { key: 'clinic', label: 'Clinic', description: 'Outpatient or specialty clinic where patient visits occur', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Clinical Operations', 'Patient Access'], relatedTo: ['person'] },
  { key: 'research_unit', label: 'Research Unit', description: 'Dedicated clinical research unit for study visits and procedures', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness', 'Capability Intelligence'], enablesCapabilities: ['Research Operations'], relatedTo: ['person', 'equipment'] },
  { key: 'phase1_unit', label: 'Phase I Unit', description: 'Dedicated early-phase clinical trial unit with monitoring capabilities', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Early Phase Trials'], relatedTo: ['person', 'equipment'] },
  { key: 'laboratory', label: 'Laboratory', description: 'Wet lab, processing lab, or analytical lab for research activities', itemType: 'facility', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Lab Operations', 'Sample Processing'], relatedTo: ['equipment', 'person'] },
  { key: 'biobank', label: 'Biobank / Repository', description: 'Dedicated biospecimen storage and management facility', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Biospecimen Storage'], relatedTo: ['equipment'] },
  { key: 'processing_area', label: 'Processing Area', description: 'Designated area for sample processing, aliquoting, and preparation', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Processing'], relatedTo: ['equipment'] },
  { key: 'pharmacy', label: 'Pharmacy', description: 'Investigational drug storage, preparation, and dispensing area', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Pharmacy Operations'], relatedTo: ['person'] },
  { key: 'sample_storage', label: 'Sample Storage', description: 'Dedicated -80°C, -20°C, LN2, or ambient storage area', itemType: 'facility', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Sample Storage'], relatedTo: ['equipment'] },
  { key: 'admin_office', label: 'Administrative Office', description: 'Office space for administrative, regulatory, and business staff', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Administrative Operations'], relatedTo: [] },
  { key: 'mobile_unit', label: 'Mobile Unit', description: 'Mobile clinic, collection vehicle, or portable research unit', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Mobile Research', 'Community Access'], relatedTo: [] },
  { key: 'warehouse', label: 'Warehouse / Supply Storage', description: 'Storage for supplies, kits, equipment, and non-biological materials', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Supply Chain'], relatedTo: [] },
  { key: 'training_area', label: 'Training Area', description: 'Space for staff training, GCP sessions, and SOP review', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Staff Development'], relatedTo: ['person'] },
]

// ==========================================================================
// FACILITY ATTRIBUTES
// ==========================================================================

export const FACILITY_ATTRIBUTES: FacilityKnowledgeItem[] = [
  { key: 'address', label: 'Address', description: 'Physical address including street, city, state, ZIP, country', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Compliance', 'Regulatory'], enablesCapabilities: [], relatedTo: [] },
  { key: 'status', label: 'Operational Status', description: 'Active, under construction, renovation, inactive, closed', itemType: 'other', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: [], relatedTo: [] },
  { key: 'operational_since', label: 'Operational Since', description: 'Date the facility became operational', itemType: 'historical_event', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Operational Track Record'], relatedTo: [] },
  { key: 'square_footage', label: 'Square Footage', description: 'Total square footage or square meters (optional, for capacity estimation)', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Capacity Estimation'], relatedTo: [] },
  { key: 'research_capacity', label: 'Research Capacity', description: 'Maximum concurrent studies, patients per day, or samples per month this facility can support', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Operational Throughput'], relatedTo: [] },
  { key: 'operating_hours', label: 'Operating Hours', description: 'Regular hours, extended hours, weekend availability, on-call status', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Operational Availability'], relatedTo: [] },
  { key: 'accessibility', label: 'Accessibility', description: 'ADA compliance, elevator access, patient accessibility features', itemType: 'other', required: false, historical: false, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Patient Accessibility'], relatedTo: [] },
  { key: 'parking', label: 'Parking', description: 'Available parking for patients, staff, and courier services', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Patient Access'], relatedTo: [] },
]

// ==========================================================================
// INFRASTRUCTURE
// ==========================================================================

export const FACILITY_INFRASTRUCTURE: FacilityKnowledgeItem[] = [
  { key: 'emergency_power', label: 'Emergency Power / Backup Generator', description: 'Backup power system for critical equipment and storage', itemType: 'equipment', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Sponsor Intelligence'], enablesCapabilities: ['Operational Continuity'], relatedTo: [] },
  { key: 'internet_connectivity', label: 'Internet / Network Connectivity', description: 'Reliable internet and network infrastructure for EDC, LIMS, communications', itemType: 'asset', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Data Operations'], relatedTo: [] },
  { key: 'environmental_controls', label: 'Environmental Monitoring', description: 'Temperature, humidity, and environmental monitoring systems', itemType: 'equipment', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality'], enablesCapabilities: ['Sample Integrity'], relatedTo: [] },
  { key: 'security_system', label: 'Security System', description: 'Access control, badge system, cameras, alarm monitoring', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Compliance'], enablesCapabilities: ['Sample Security'], relatedTo: [] },
  { key: 'biosafety_level', label: 'Biosafety Level', description: 'BSL-1, BSL-2, or BSL-3 designation for the facility', itemType: 'regulatory', required: true, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Readiness', 'Regulatory', 'Compliance'], enablesCapabilities: ['Lab Safety', 'Sample Handling'], relatedTo: [] },
  { key: 'restricted_areas', label: 'Restricted Access Areas', description: 'Areas with limited access: pharmacy, sample storage, data room', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Compliance'], enablesCapabilities: ['Access Control'], relatedTo: [] },
]

// ==========================================================================
// FACILITY AREAS (sub-locations within a facility)
// ==========================================================================

export const FACILITY_AREAS: FacilityKnowledgeItem[] = [
  { key: 'reception', label: 'Reception / Waiting Area', description: 'Patient and visitor reception and waiting area', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Patient Experience'], relatedTo: [] },
  { key: 'exam_rooms', label: 'Exam Rooms', description: 'Patient examination rooms for study visits', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Clinical Operations'], relatedTo: ['person'] },
  { key: 'procedure_rooms', label: 'Procedure Rooms', description: 'Rooms for minor procedures, biopsies, infusions', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Clinical Procedures'], relatedTo: ['equipment', 'person'] },
  { key: 'infusion_room', label: 'Infusion Room', description: 'Dedicated infusion area for study drug administration', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Infusion Capability'], relatedTo: ['equipment', 'person'] },
  { key: 'collection_room', label: 'Sample Collection Room', description: 'Phlebotomy or biospecimen collection area', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Collection'], relatedTo: ['equipment', 'person'] },
  { key: 'lab_area', label: 'Laboratory Area', description: 'Wet lab bench space, equipment stations, processing areas', itemType: 'facility', required: true, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Lab Operations'], relatedTo: ['equipment'] },
  { key: 'processing_room', label: 'Processing Room', description: 'Dedicated sample processing and aliquoting room', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Processing'], relatedTo: ['equipment'] },
  { key: 'freezer_room', label: 'Freezer / Storage Room', description: 'Room housing -80°C freezers, LN2 tanks, and monitored storage', itemType: 'facility', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence'], enablesCapabilities: ['Sample Storage'], relatedTo: ['equipment'] },
  { key: 'pharmacy_area', label: 'Pharmacy Area', description: 'Secure pharmacy for investigational product storage and preparation', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Pharmacy Operations'], relatedTo: ['person'] },
  { key: 'archive_room', label: 'Archive / Records Room', description: 'Secure storage for study documents, source records, and regulatory files', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Regulatory', 'Compliance'], enablesCapabilities: ['Document Retention'], relatedTo: [] },
  { key: 'training_room', label: 'Training Room', description: 'Space for staff training sessions and meetings', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Staff Development'], relatedTo: [] },
  { key: 'storage_area', label: 'General Storage', description: 'Storage for supplies, kits, shipping materials, and non-regulated items', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Supply Management'], relatedTo: [] },
]

// ==========================================================================
// DOCUMENTS
// ==========================================================================

export interface FacilityDocument {
  key: string
  label: string
  description: string
  required: boolean
  expires: boolean
  typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]
  evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const FACILITY_DOCUMENTS: FacilityDocument[] = [
  { key: 'floor_plan', label: 'Floor Plan', description: 'Current floor plan showing layout, rooms, and areas', required: true, expires: false, supportsKnowledgeItems: ['main_site', 'laboratory'], evidenceClass: 'B' },
  { key: 'occupancy_permit', label: 'Certificate of Occupancy', description: 'Certificate of occupancy or equivalent from local authority', required: true, expires: false, supportsKnowledgeItems: ['main_site'], evidenceClass: 'A' },
  { key: 'fire_inspection', label: 'Fire Inspection Report', description: 'Most recent fire safety inspection', required: true, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['main_site', 'satellite_site'], evidenceClass: 'A' },
  { key: 'safety_inspection', label: 'Safety Inspection Report', description: 'General safety inspection or OSHA compliance report', required: false, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['main_site', 'laboratory'], evidenceClass: 'B' },
  { key: 'emergency_plan', label: 'Emergency Response Plan', description: 'Documented emergency procedures, evacuation routes, contacts', required: true, expires: false, supportsKnowledgeItems: ['main_site', 'laboratory', 'biobank'], evidenceClass: 'B' },
  { key: 'biosafety_cert', label: 'Biosafety Level Certification', description: 'BSL designation certificate or institutional biosafety committee approval', required: true, expires: true, typicalExpirationMonths: 36, supportsKnowledgeItems: ['biosafety_level'], evidenceClass: 'A' },
  { key: 'env_monitoring_log', label: 'Environmental Monitoring Logs', description: 'Temperature and humidity monitoring records for sample storage', required: true, expires: false, supportsKnowledgeItems: ['environmental_controls', 'freezer_room'], evidenceClass: 'B' },
  { key: 'facility_photos', label: 'Facility Photographs', description: 'Current photos of facility exterior and key areas', required: false, expires: false, supportsKnowledgeItems: ['main_site', 'laboratory', 'freezer_room'], evidenceClass: 'D' },
  { key: 'maintenance_log', label: 'Maintenance Records', description: 'Records of preventive maintenance for facility systems', required: false, expires: false, supportsKnowledgeItems: ['emergency_power', 'environmental_controls'], evidenceClass: 'C' },
  { key: 'cleaning_sop', label: 'Cleaning / Sanitization SOP', description: 'Standard operating procedure for facility cleaning and sanitization', required: false, expires: false, supportsKnowledgeItems: ['laboratory', 'processing_room'], evidenceClass: 'C' },
  { key: 'storage_temp_log', label: 'Storage Temperature Logs', description: 'Continuous temperature monitoring records for sample storage', required: true, expires: false, supportsKnowledgeItems: ['sample_storage', 'freezer_room'], evidenceClass: 'A' },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const FACILITY_DOMAIN_CATALOG: FacilityKnowledgeItem[] = [
  ...FACILITY_TYPES,
  ...FACILITY_ATTRIBUTES,
  ...FACILITY_INFRASTRUCTURE,
  ...FACILITY_AREAS,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const FACILITY_DOMAIN_STATS = {
  totalKnowledgeItems: FACILITY_DOMAIN_CATALOG.length,
  requiredItems: FACILITY_DOMAIN_CATALOG.filter((i) => i.required).length,
  optionalItems: FACILITY_DOMAIN_CATALOG.filter((i) => !i.required).length,
  itemsThatGenerateCandidates: FACILITY_DOMAIN_CATALOG.filter((i) => i.generatesCandidates).length,
  totalDocuments: FACILITY_DOCUMENTS.length,
  requiredDocuments: FACILITY_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: FACILITY_DOCUMENTS.filter((d) => d.expires).length,
  downstreamEngines: [...new Set(FACILITY_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
  enabledCapabilities: [...new Set(FACILITY_DOMAIN_CATALOG.flatMap((i) => i.enablesCapabilities))],
}

// ==========================================================================
// SECTIONS (progressive UX)
// ==========================================================================

export const FACILITY_SECTIONS = [
  { name: 'Facility Types', items: FACILITY_TYPES, completionKey: 'types' },
  { name: 'Attributes & Location', items: FACILITY_ATTRIBUTES, completionKey: 'attributes' },
  { name: 'Infrastructure & Systems', items: FACILITY_INFRASTRUCTURE, completionKey: 'infrastructure' },
  { name: 'Areas & Rooms', items: FACILITY_AREAS, completionKey: 'areas' },
]

// ==========================================================================
// OPERATIONS — Auto-detection
// ==========================================================================

export const FACILITY_OPERATIONS = {
  criticalChecks: [
    { check: 'fire_inspection_expired', description: 'Fire inspection expired or expiring within 30 days', keys: ['fire_inspection'] },
    { check: 'biosafety_cert_expired', description: 'Biosafety level certification expired', keys: ['biosafety_level'] },
    { check: 'emergency_plan_missing', description: 'Emergency response plan not documented', keys: ['emergency_plan'] },
    { check: 'no_emergency_power', description: 'Facility lacks documented emergency power / backup', keys: ['emergency_power'] },
    { check: 'no_env_monitoring', description: 'Environmental monitoring not documented for sample storage', keys: ['environmental_controls'] },
    { check: 'temp_logs_missing', description: 'Storage temperature logs missing or outdated', keys: ['sample_storage', 'freezer_room'] },
    { check: 'no_lab_area', description: 'Laboratory facility defined but no lab area documented', keys: ['lab_area'] },
  ],
}
