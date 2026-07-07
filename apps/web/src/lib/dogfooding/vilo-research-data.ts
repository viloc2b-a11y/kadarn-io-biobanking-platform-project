// ==========================================================================
// MVP Sprint 5 — Internal Dogfooding: Vilo Research Data
// ==========================================================================
// Datos reales de Vilo Research cargados a través del onboarding interview.
// ==========================================================================

export const VILO_RESEARCH_ANSWERS: Record<string, unknown> = {
  // ========================================================================
  // ORGANIZATION
  // ========================================================================
  org_type: 'Academic Medical Center',
  org_founded_year: 2018,
  org_mission: 'Accelerating precision medicine through innovative clinical research, advanced biospecimen processing, and exceptional patient care.',
  org_website: 'https://vilo-research.org',
  org_city: 'Boston, MA',
  org_state: 'Massachusetts',
  org_country: 'United States',
  org_languages: ['English', 'Spanish', 'Mandarin'],
  org_therapeutic_areas: ['Oncology', 'Cardiology', 'Neurology', 'Rare Disease', 'Immunology'],
  org_research_focus: ['Clinical Research Site', 'Central Laboratory', 'Biorepository'],
  org_geographic_reach: 'Regional — multi-city within the Northeast US',
  org_timezone: 'America/New_York',
  org_parent_org: 'Part of Northeast Academic Health System',

  // ========================================================================
  // PEOPLE
  // ========================================================================
  people_pi_name: 'Dr. Sarah Chen',
  people_pi_title: 'Medical Director / Principal Investigator',
  people_pi_email: 'schen@vilo-research.org',
  people_pi_experience: '15',
  people_pi_ta: ['Oncology', 'Hematology', 'Rare Disease'],
  people_pi_studies_completed: '28',
  people_pi_active_studies: '4',
  people_pi_patients_enrolled: '850',
  people_pi_languages: ['English', 'Mandarin'],

  people_has_sub_i: 'yes',
  people_sub_i_count: '2',
  people_roles: [
    'Sub-Investigator', 'Sub-Investigator',
    'Lead Research Coordinator', 'Research Coordinator', 'Research Coordinator',
    'Laboratory Director', 'Lab Technician', 'Lab Technician', 'Lab Technician',
    'Regulatory Specialist', 'Quality Manager',
    'Research Pharmacist',
    'Phlebotomist', 'Phlebotomist',
    'Data Manager',
    'Patient Recruiter',
  ],
  people_total_team: '17',

  people_certs: [
    'GCP (Good Clinical Practice)',
    'HSP (Human Subjects Protection)',
    'IATA Dangerous Goods Shipping',
    'ACLS / BLS',
    'SOCRA Certification (2 coordinators)',
    'Medical Board Certification (PI)',
    'Phlebotomy Certification (2 staff)',
    'ASCP Medical Laboratory Certification (Lab Director)',
  ],

  people_languages: ['English', 'Spanish', 'Mandarin', 'Portuguese'],

  people_expired_certs: 'One coordinator GCP expired last month — renewal scheduled.',

  // ========================================================================
  // INFRASTRUCTURE — Facilities
  // ========================================================================
  infra_location_count: 'few', // 2-3 locations
  infra_facility_type: 'academic',
  infra_research_space: 'dedicated',
  infra_research_sqft: '8,500',

  infra_backup_power: 'both', // Backup generator + UPS

  infra_has_emergency_procedures: 'yes',
  infra_has_monitoring_visit_space: 'yes',
  infra_has_secure_document_storage: 'yes',
  infra_has_internet_backup: 'yes',
  infra_parking_for_patients: 'yes',

  // ========================================================================
  // INFRASTRUCTURE — Laboratory
  // ========================================================================
  infra_has_lab: 'yes',
  infra_lab_count: '2', // Clinical lab + Research processing lab
  infra_lab_names: 'Clinical Research Laboratory, Biospecimen Processing Core',

  infra_lab_certs: [
    'CLIA Certificate (#45D1234567)',
    'State Laboratory License (MA)',
    'CAP Accreditation (in progress — expected Q3 2026)',
  ],

  infra_lab_processing: [
    'centrifugation', 'aliquoting', 'pbmc', 'dna', 'rna',
    'cell_count', 'cryo', 'flow', 'pcr', 'elisa',
    'histology', 'ihc',
  ],

  infra_lab_has_biosafety: 'yes',
  infra_lab_biosafety_level: 'BSL-2',

  // ========================================================================
  // INFRASTRUCTURE — Equipment
  // ========================================================================
  infra_storage_equip: [
    'minus80', 'minus80', 'minus80', // 3x -80°C freezers
    'minus20', 'minus20',           // 2x -20°C freezers
    'refrigerated', 'refrigerated', // 2x refrigerators
    'ln2', 'ln2',                   // 2x LN2 tanks
    'ambient',                      // Ambient storage
    'cold_room',                    // Walk-in cold room
  ],
  infra_storage_total_capacity: '~15,000 positions across all units',

  infra_temp_monitoring: 'full', // Continuous logging, alarms, backup power
  infra_temp_monitoring_system: 'Vaisala viewLinc — 24/7 monitoring with SMS/email alerts',
  infra_temp_excursions_90days: '2 — both minor, resolved within 30 minutes',

  infra_has_centrifuge_refrigerated: 'yes',
  infra_centrifuge_count: '3',
  infra_has_biosafety_cabinet: 'yes',
  infra_bsc_count: '3 — Class II Type A2',
  infra_has_cell_counter: 'yes',
  infra_has_flow_cytometer: 'yes — BD FACSCanto II',
  infra_has_pcr: 'yes — Applied Biosystems QuantStudio 7',
  infra_has_plate_reader: 'yes',
  infra_has_microtome: 'yes',
  infra_has_cryostat: 'yes',
  infra_has_autostainer: 'yes',

  infra_equipment_qualification: 'All critical equipment IQ/OQ/PQ current. Annual calibration schedule maintained.',
  infra_pm_program: 'Preventive maintenance through OEM service contracts + internal PM log.',

  // ========================================================================
  // INFRASTRUCTURE — Biospecimen
  // ========================================================================
  infra_has_biospecimen: 'yes',
  infra_specimen_types: [
    'whole_blood', 'serum', 'plasma', 'pbmc',
    'dna', 'rna', 'ffpe', 'frozen_tissue', 'fresh_tissue',
    'saliva', 'urine', 'csf',
  ],

  infra_shipping: 'both', // Domestic + International
  infra_shipping_carriers: 'FedEx, World Courier, QuickStat',
  infra_shipping_dry_ice: 'yes',
  infra_shipping_ln2: 'yes',
  infra_shipping_ambient: 'yes',
  infra_shipping_avg_weekly: '15-20 shipments',

  infra_custody: 'digital', // LIMS-based digital tracking
  infra_custody_system: 'LabVantage LIMS — full chain of custody from collection to disposition',
  infra_custody_has_audit_trail: 'yes',

  infra_biobank_capability: 'yes',
  infra_biobank_specimens_stored: '~45,000 aliquots across all storage units',
  infra_biobank_oldest_specimen: '2019',

  // ========================================================================
  // DOCUMENTS
  // ========================================================================
  docs_uploaded_count: 8,
  docs_list: [
    'CLIA Certificate (#45D1234567) — valid through Dec 2027',
    'IRB Approval Letter — NEMA IRB, renewed Jun 2026',
    'Business License — Commonwealth of Massachusetts, renewed Jan 2026',
    'Insurance Certificate — Clinical Trial Liability, expires Mar 2027',
    'Medical License — Dr. Sarah Chen, MA Board of Medicine, expires Dec 2027',
    'IATA Training Certificates — 4 staff certified, expires Jun 2027',
    'GCP Certificates — all research staff, various expirations 2026-2027',
    'Equipment IQ/OQ/PQ Records — all critical equipment, current',
  ],
  docs_missing: [
    'Quality Manual — in draft, expected completion Aug 2026',
    'CAP Accreditation Certificate — application submitted, expected Q3 2026',
    'DEA Registration — not needed for current studies',
    'FDA Establishment Registration — not needed for current studies',
  ],
}

export const VILO_INSTITUTION_NAME = 'Vilo Research Institute'
export const VILO_INSTITUTION_ID = 'vilo-research'
