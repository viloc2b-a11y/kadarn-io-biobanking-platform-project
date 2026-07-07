// ==========================================================================
// IKM Domain Sprint 6 — Biospecimen Operations Domain
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface BiospecimenKnowledgeItem {
  key: string; label: string; description: string
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]; relatedTo: KnowledgeItemType[]
}

// ==========================================================================
// SPECIMEN TYPES
// ==========================================================================

export const SPECIMEN_TYPES: BiospecimenKnowledgeItem[] = [
  { key: 'whole_blood', label: 'Whole Blood', description: 'Venous whole blood collected in EDTA, heparin, citrate, or serum tubes', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Collection'], relatedTo: ['equipment'] },
  { key: 'serum', label: 'Serum', description: 'Serum from clotted blood, processed within specified time window', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Sample Processing'], relatedTo: ['equipment'] },
  { key: 'plasma', label: 'Plasma', description: 'Plasma from anticoagulated blood, processed and frozen within protocol windows', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Processing'], relatedTo: ['equipment'] },
  { key: 'pbmc', label: 'PBMC', description: 'Peripheral blood mononuclear cells isolated by density gradient centrifugation', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['PBMC Processing', 'Specialty Processing'], relatedTo: ['equipment', 'process'] },
  { key: 'buffy_coat', label: 'Buffy Coat', description: 'Leukocyte-enriched fraction from whole blood centrifugation', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Processing'], relatedTo: ['equipment'] },
  { key: 'dna', label: 'DNA', description: 'Genomic DNA extracted from blood, tissue, saliva, or FFPE samples', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Molecular Analysis'], relatedTo: ['equipment'] },
  { key: 'rna', label: 'RNA', description: 'Total RNA or mRNA extracted with quality metrics (RIN/DV200)', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Molecular Analysis'], relatedTo: ['equipment'] },
  { key: 'saliva', label: 'Saliva', description: 'Saliva collection for DNA, hormone, or microbiome analysis', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Non-Invasive Collection'], relatedTo: [] },
  { key: 'urine', label: 'Urine', description: 'Urine collection — spot, timed, or 24-hour with processing protocols', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Sample Collection'], relatedTo: [] },
  { key: 'stool', label: 'Stool / Fecal', description: 'Stool collection for microbiome, calprotectin, or other analysis', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Microbiome Research'], relatedTo: [] },
  { key: 'csf', label: 'CSF', description: 'Cerebrospinal fluid collection via lumbar puncture', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Specialty Collection'], relatedTo: ['person'] },
  { key: 'bone_marrow', label: 'Bone Marrow', description: 'Bone marrow aspirate or biopsy collection and processing', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Specialty Collection'], relatedTo: ['person', 'facility'] },
  { key: 'tissue_fresh', label: 'Fresh Tissue', description: 'Fresh surgical or biopsy tissue with rapid processing or preservation', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Tissue Collection'], relatedTo: ['facility', 'equipment'] },
  { key: 'ffpe', label: 'FFPE Tissue', description: 'Formalin-fixed paraffin-embedded tissue blocks and slides', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Tissue Processing', 'Pathology'], relatedTo: ['equipment'] },
  { key: 'frozen_tissue', label: 'Frozen Tissue (OCT)', description: 'Snap-frozen or OCT-embedded tissue for cryosectioning or molecular analysis', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Tissue Preservation'], relatedTo: ['equipment'] },
  { key: 'swab_nasal', label: 'Nasal Swab', description: 'Nasal swab for respiratory pathogen or microbiome analysis', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Collection'], relatedTo: [] },
  { key: 'swab_op', label: 'Oropharyngeal Swab', description: 'OP swab for respiratory or microbiome analysis', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Collection'], relatedTo: [] },
  { key: 'swab_np', label: 'Nasopharyngeal Swab', description: 'NP swab for viral or bacterial testing', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Sample Collection'], relatedTo: [] },
  { key: 'swab_wound', label: 'Wound Swab', description: 'Wound swab for culture or molecular analysis', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Collection'], relatedTo: [] },
  { key: 'cell_lines', label: 'Cell Lines', description: 'Immortalized or primary cell lines — culture, expansion, characterization, banking', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Cell Culture'], relatedTo: ['equipment'] },
  { key: 'custom_specimen', label: 'Custom / Other Specimen Type', description: 'Institution-specific or study-specific specimen types', itemType: 'process', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], relatedTo: [] },
]

// ==========================================================================
// COLLECTION CAPABILITIES
// ==========================================================================

export const COLLECTION_CAPABILITIES: BiospecimenKnowledgeItem[] = [
  { key: 'collection_volume', label: 'Collection Volume', description: 'Typical and maximum blood/sample volume per draw, per visit, per patient', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Sample Volume Capacity'], relatedTo: [] },
  { key: 'collection_frequency', label: 'Collection Frequency', description: 'How frequently samples can be collected — daily, weekly, monthly, per protocol', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Collection Capacity'], relatedTo: [] },
  { key: 'max_daily', label: 'Maximum Daily Capacity', description: 'Maximum number of collections, patients, or samples per day', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Operational Throughput'], relatedTo: [] },
  { key: 'weekend_availability', label: 'Weekend Availability', description: 'Sample collection and processing available on weekends', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Operational Flexibility'], relatedTo: [] },
  { key: 'holiday_availability', label: 'Holiday Availability', description: 'Sample collection and processing available on holidays', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Operational Continuity'], relatedTo: [] },
  { key: 'home_collection', label: 'Home Collection', description: 'Capability to collect samples at patient home or remote location', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Remote Collection', 'Patient Access'], relatedTo: ['person'] },
  { key: 'mobile_collection', label: 'Mobile Collection Unit', description: 'Mobile phlebotomy or collection unit capability', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Community Access', 'Mobile Research'], relatedTo: ['facility'] },
  { key: 'pediatric', label: 'Pediatric Capability', description: 'Capability to collect samples from pediatric patients with age-appropriate methods', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Pediatric Research'], relatedTo: ['person'] },
  { key: 'geriatric', label: 'Geriatric Capability', description: 'Capability to collect from elderly or frail populations', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Geriatric Research'], relatedTo: [] },
  { key: 'healthy_donors', label: 'Healthy Donor Access', description: 'Access to healthy volunteer donor population', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Normal Controls'], relatedTo: [] },
  { key: 'disease_cohorts', label: 'Disease Cohort Access', description: 'Access to specific disease populations — oncology, cardiology, neurology, etc.', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Disease-Specific Research'], relatedTo: [] },
  { key: 'special_populations', label: 'Special Population Access', description: 'Pregnant women, neonates, immunocompromised, rare disease, etc.', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Special Population Research'], relatedTo: [] },
]

// ==========================================================================
// PROCESSING & STORAGE
// ==========================================================================

export const PROCESSING_STORAGE: BiospecimenKnowledgeItem[] = [
  { key: 'processing_time', label: 'Processing Time Windows', description: 'Time from collection to processing — 30min, 1hr, 2hr, 4hr, 24hr windows', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Quality'], relatedTo: [] },
  { key: 'aliquoting', label: 'Aliquoting Capability', description: 'Ability to aliquot samples into specified volumes and tube types', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Management'], relatedTo: ['equipment'] },
  { key: 'labeling', label: 'Sample Labeling', description: 'Barcode or human-readable labeling system with unique identifiers', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Tracking'], relatedTo: ['equipment'] },
  { key: 'chain_of_custody', label: 'Chain of Custody', description: 'End-to-end chain of custody documentation from collection to disposition', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Regulatory', 'Compliance', 'Readiness'], enablesCapabilities: ['Sample Traceability'], relatedTo: ['process'] },
  { key: 'storage_80', label: '-80°C Storage', description: 'Ultra-low temperature storage capacity and monitoring', itemType: 'capability', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Long-term Storage'], relatedTo: ['equipment'] },
  { key: 'storage_20', label: '-20°C Storage', description: 'Standard freezer storage for reagents and short-term samples', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Short-term Storage'], relatedTo: ['equipment'] },
  { key: 'storage_4', label: '2-8°C Refrigerated Storage', description: 'Refrigerated storage for temperature-sensitive samples and reagents', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Sample Storage'], relatedTo: ['equipment'] },
  { key: 'ln2_storage', label: 'Liquid Nitrogen Storage', description: 'Cryogenic storage for viable cells and long-term preservation', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Cryopreservation'], relatedTo: ['equipment'] },
  { key: 'ambient_storage', label: 'Ambient Temperature Storage', description: 'Room temperature storage for dry samples, slides, kits, supplies', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Sample Storage'], relatedTo: [] },
  { key: 'temp_monitoring', label: 'Temperature Monitoring & Alarms', description: '24/7 continuous temperature monitoring with alarm escalation', itemType: 'process', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Readiness', 'Quality', 'Compliance'], enablesCapabilities: ['Sample Integrity'], relatedTo: ['equipment'] },
  { key: 'backup_storage', label: 'Backup Storage', description: 'Secondary storage capability in case of primary storage failure', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['Operational Continuity'], relatedTo: ['equipment', 'facility'] },
]

// ==========================================================================
// SHIPPING & DISTRIBUTION
// ==========================================================================

export const SHIPPING_DISTRIBUTION: BiospecimenKnowledgeItem[] = [
  { key: 'domestic_shipping', label: 'Domestic Shipping', description: 'Capability to ship samples domestically with proper packaging and documentation', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Sample Distribution'], relatedTo: [] },
  { key: 'international_shipping', label: 'International Shipping', description: 'Capability to ship samples internationally with customs and regulatory compliance', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Global Distribution'], relatedTo: [] },
  { key: 'cold_chain_shipping', label: 'Cold Chain Shipping', description: 'Validated cold chain shipping with temperature monitoring and data loggers', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Cold Chain Logistics'], relatedTo: ['equipment'] },
  { key: 'dry_ice_shipping', label: 'Dry Ice Shipping', description: 'Capability to ship on dry ice with IATA/DOT compliance', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Frozen Shipping'], relatedTo: ['equipment'] },
  { key: 'ln2_shipping', label: 'LN2 Dry Shipper', description: 'Capability to ship in liquid nitrogen dry shippers for viable cells', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Cryogenic Shipping'], relatedTo: ['equipment'] },
  { key: 'ambient_shipping', label: 'Ambient Temperature Shipping', description: 'Capability to ship at ambient temperature for dry or stable samples', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Sample Distribution'], relatedTo: [] },
  { key: 'packaging_validation', label: 'Packaging Validation', description: 'Validated packaging configurations for each temperature range', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Quality'], enablesCapabilities: ['Shipping Compliance'], relatedTo: [] },
  { key: 'courier_agreements', label: 'Courier Agreements', description: 'Active agreements with FedEx, UPS, DHL, World Courier, QuickStat, etc.', itemType: 'relationship', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Shipping Logistics'], relatedTo: [] },
]

// ==========================================================================
// INVENTORY & DISPOSITION
// ==========================================================================

export const INVENTORY_DISPOSITION: BiospecimenKnowledgeItem[] = [
  { key: 'inventory_system', label: 'Inventory Management System', description: 'System for tracking sample location, quantity, status, and chain of custody', itemType: 'asset', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Sample Tracking'], relatedTo: [] },
  { key: 'sample_destruction', label: 'Sample Destruction / Disposal', description: 'Procedure for sample destruction per protocol, regulatory, or patient request', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Regulatory', 'Compliance'], enablesCapabilities: ['Sample Lifecycle Management'], relatedTo: ['process'] },
  { key: 'sample_return', label: 'Sample Return to Sponsor', description: 'Capability to return leftover or unused samples to sponsor', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Sample Management'], relatedTo: [] },
  { key: 'stability_data', label: 'Sample Stability Data', description: 'Documented stability data for specimen types under collection and storage conditions', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Sponsor Intelligence'], enablesCapabilities: ['Sample Quality'], relatedTo: [] },
]

// ==========================================================================
// DOCUMENTS
// ==========================================================================

export interface BiospecimenDocument {
  key: string; label: string; description: string
  required: boolean; expires: boolean; typicalExpirationMonths?: number
  supportsKnowledgeItems: string[]; evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const BIOSPECIMEN_DOCUMENTS: BiospecimenDocument[] = [
  { key: 'collection_sop', label: 'Sample Collection SOP', description: 'Standard operating procedure for each specimen type collection', required: true, expires: false, supportsKnowledgeItems: ['whole_blood', 'plasma', 'serum', 'pbmc', 'urine', 'saliva'], evidenceClass: 'A' },
  { key: 'processing_sop', label: 'Sample Processing SOP', description: 'Processing protocols for centrifugation, aliquoting, PBMC isolation, etc.', required: true, expires: false, supportsKnowledgeItems: ['whole_blood', 'plasma', 'serum', 'pbmc', 'buffy_coat', 'dna', 'rna'], evidenceClass: 'A' },
  { key: 'aliquot_sop', label: 'Aliquoting SOP', description: 'Procedure for sample aliquoting, labeling, and storage assignment', required: true, expires: false, supportsKnowledgeItems: ['aliquoting', 'labeling'], evidenceClass: 'B' },
  { key: 'storage_sop', label: 'Sample Storage SOP', description: 'Storage protocols including temperature mapping, monitoring, and alarm response', required: true, expires: false, supportsKnowledgeItems: ['storage_80', 'storage_20', 'ln2_storage', 'temp_monitoring'], evidenceClass: 'A' },
  { key: 'chain_custody_sop', label: 'Chain of Custody SOP', description: 'End-to-end chain of custody documentation procedure', required: true, expires: false, supportsKnowledgeItems: ['chain_of_custody'], evidenceClass: 'A' },
  { key: 'shipping_sop', label: 'Sample Shipping SOP', description: 'Procedures for domestic and international sample shipping', required: false, expires: false, supportsKnowledgeItems: ['domestic_shipping', 'international_shipping', 'cold_chain_shipping', 'dry_ice_shipping'], evidenceClass: 'A' },
  { key: 'temp_logs', label: 'Temperature Monitoring Logs', description: 'Continuous temperature records for all storage units with alarm events', required: true, expires: false, supportsKnowledgeItems: ['temp_monitoring', 'storage_80', 'ln2_storage'], evidenceClass: 'A' },
  { key: 'packaging_validation_doc', label: 'Packaging Validation Report', description: 'Validation documentation for shipping container configurations', required: false, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['packaging_validation', 'cold_chain_shipping'], evidenceClass: 'B' },
  { key: 'iata_cert', label: 'IATA / DOT Training Certificates', description: 'Staff training certificates for dangerous goods shipping', required: false, expires: true, typicalExpirationMonths: 24, supportsKnowledgeItems: ['dry_ice_shipping', 'ln2_shipping', 'international_shipping'], evidenceClass: 'A' },
  { key: 'courier_contracts', label: 'Courier Service Agreements', description: 'Active agreements with shipping couriers', required: false, expires: true, typicalExpirationMonths: 12, supportsKnowledgeItems: ['courier_agreements'], evidenceClass: 'C' },
  { key: 'inventory_sop', label: 'Inventory Management SOP', description: 'Procedure for sample inventory tracking, auditing, and reconciliation', required: true, expires: false, supportsKnowledgeItems: ['inventory_system'], evidenceClass: 'B' },
  { key: 'destruction_sop', label: 'Sample Destruction SOP', description: 'Procedure for sample destruction with documentation and regulatory compliance', required: false, expires: false, supportsKnowledgeItems: ['sample_destruction'], evidenceClass: 'B' },
  { key: 'stability_report', label: 'Sample Stability Report', description: 'Documented stability data for key specimen types', required: false, expires: false, supportsKnowledgeItems: ['stability_data'], evidenceClass: 'B' },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const BIOSPECIMEN_DOMAIN_CATALOG: BiospecimenKnowledgeItem[] = [
  ...SPECIMEN_TYPES,
  ...COLLECTION_CAPABILITIES,
  ...PROCESSING_STORAGE,
  ...SHIPPING_DISTRIBUTION,
  ...INVENTORY_DISPOSITION,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const BIOSPECIMEN_DOMAIN_STATS = {
  totalKnowledgeItems: BIOSPECIMEN_DOMAIN_CATALOG.length,
  requiredItems: BIOSPECIMEN_DOMAIN_CATALOG.filter((i) => i.required).length,
  totalDocuments: BIOSPECIMEN_DOCUMENTS.length,
  requiredDocuments: BIOSPECIMEN_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: BIOSPECIMEN_DOCUMENTS.filter((d) => d.expires).length,
  specimenTypes: SPECIMEN_TYPES.length,
  collectionCapabilities: COLLECTION_CAPABILITIES.length,
  processingStorage: PROCESSING_STORAGE.length,
  shippingDistribution: SHIPPING_DISTRIBUTION.length,
  downstreamEngines: [...new Set(BIOSPECIMEN_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
  enabledCapabilities: [...new Set(BIOSPECIMEN_DOMAIN_CATALOG.flatMap((i) => i.enablesCapabilities))],
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const BIOSPECIMEN_SECTIONS = [
  { name: 'Specimen Types', items: SPECIMEN_TYPES, completionKey: 'specimens' },
  { name: 'Collection Capabilities', items: COLLECTION_CAPABILITIES, completionKey: 'collection' },
  { name: 'Processing & Storage', items: PROCESSING_STORAGE, completionKey: 'processing' },
  { name: 'Shipping & Distribution', items: SHIPPING_DISTRIBUTION, completionKey: 'shipping' },
  { name: 'Inventory & Disposition', items: INVENTORY_DISPOSITION, completionKey: 'inventory' },
]

// ==========================================================================
// OPERATIONS
// ==========================================================================

export const BIOSPECIMEN_OPERATIONS = {
  criticalChecks: [
    { check: 'no_collection_sop', description: 'Collection SOP missing for supported specimen types', keys: ['collection_sop'] },
    { check: 'no_processing_sop', description: 'Processing SOP missing', keys: ['processing_sop'] },
    { check: 'no_storage_sop', description: 'Storage SOP missing', keys: ['storage_sop'] },
    { check: 'no_chain_of_custody', description: 'Chain of custody not documented', keys: ['chain_of_custody'] },
    { check: 'no_temp_monitoring', description: 'Temperature monitoring not documented', keys: ['temp_monitoring'] },
    { check: 'no_inventory', description: 'Inventory management system not documented', keys: ['inventory_system'] },
    { check: 'shipping_certs_expired', description: 'IATA or shipping certifications expired', keys: ['iata_cert'] },
    { check: 'no_cold_chain', description: 'Cold chain shipping capability claimed but not validated', keys: ['cold_chain_shipping', 'packaging_validation'] },
  ],
}

// ==========================================================================
// CAPABILITY MATRIX
// ==========================================================================

export const BIOSPECIMEN_CAPABILITY_MATRIX_SECTIONS = [
  'collection', 'processing', 'storage', 'shipping', 'special_populations',
] as const

// ==========================================================================
// DASHBOARD STATE
// ==========================================================================

export const BIOSPECIMEN_DASHBOARD_SECTIONS = [
  'specimen_capability_matrix',
  'processing_capacity',
  'storage_capacity',
  'collection_coverage',
  'documentation_status',
  'knowledge_health',
  'evidence_maturity',
  'upcoming_expirations',
] as const
