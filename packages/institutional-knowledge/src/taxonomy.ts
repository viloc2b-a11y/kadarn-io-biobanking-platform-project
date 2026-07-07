// ==========================================================================
// Sprint A0 — Canonical Taxonomy & Controlled Vocabulary
// ==========================================================================
// Congela todos los vocabularios maestros de Kadarn.
// Cada dominio consume estas taxonomías — ningún dominio define sus propios términos.
// Si un término no está acá, no existe en Kadarn.
// ==========================================================================

// ==========================================================================
// THERAPEUTIC AREAS
// ==========================================================================

export const THERAPEUTIC_AREAS = {
  oncology: { label: 'Oncology', category: 'therapeutic_area' },
  cardiology: { label: 'Cardiology / Cardiovascular', category: 'therapeutic_area' },
  neurology: { label: 'Neurology / CNS', category: 'therapeutic_area' },
  infectious_disease: { label: 'Infectious Disease', category: 'therapeutic_area' },
  rare_disease: { label: 'Rare Disease', category: 'therapeutic_area' },
  immunology: { label: 'Immunology / Autoimmune', category: 'therapeutic_area' },
  endocrinology: { label: 'Endocrinology / Metabolic', category: 'therapeutic_area' },
  respiratory: { label: 'Respiratory / Pulmonary', category: 'therapeutic_area' },
  gastroenterology: { label: 'Gastroenterology', category: 'therapeutic_area' },
  dermatology: { label: 'Dermatology', category: 'therapeutic_area' },
  hematology: { label: 'Hematology', category: 'therapeutic_area' },
  nephrology: { label: 'Nephrology', category: 'therapeutic_area' },
  ophthalmology: { label: 'Ophthalmology', category: 'therapeutic_area' },
  psychiatry: { label: 'Psychiatry / Mental Health', category: 'therapeutic_area' },
  womens_health: { label: "Women's Health / OB-GYN", category: 'therapeutic_area' },
  pediatrics: { label: 'Pediatrics', category: 'therapeutic_area' },
  geriatrics: { label: 'Geriatrics / Aging', category: 'therapeutic_area' },
  pain_management: { label: 'Pain Management', category: 'therapeutic_area' },
  vaccines: { label: 'Vaccines / Prevention', category: 'therapeutic_area' },
  transplantation: { label: 'Transplantation', category: 'therapeutic_area' },
  regenerative_medicine: { label: 'Regenerative Medicine', category: 'therapeutic_area' },
  cell_gene_therapy: { label: 'Cell & Gene Therapy', category: 'therapeutic_area' },
  precision_medicine: { label: 'Precision Medicine / Genomics', category: 'therapeutic_area' },
  medical_devices: { label: 'Medical Devices', category: 'therapeutic_area' },
  diagnostics: { label: 'Diagnostics / IVD', category: 'therapeutic_area' },
  digital_health: { label: 'Digital Health / DTx', category: 'therapeutic_area' },
} as const

export type TherapeuticAreaKey = keyof typeof THERAPEUTIC_AREAS

// ==========================================================================
// DISEASE AREAS (sub-taxonomy of therapeutic areas)
// ==========================================================================

export const DISEASE_AREAS = {
  // Oncology
  breast_cancer: { label: 'Breast Cancer', parent: 'oncology' },
  lung_cancer: { label: 'Lung Cancer', parent: 'oncology' },
  colorectal_cancer: { label: 'Colorectal Cancer', parent: 'oncology' },
  prostate_cancer: { label: 'Prostate Cancer', parent: 'oncology' },
  leukemia: { label: 'Leukemia', parent: 'oncology' },
  lymphoma: { label: 'Lymphoma', parent: 'oncology' },
  melanoma: { label: 'Melanoma', parent: 'oncology' },
  pancreatic_cancer: { label: 'Pancreatic Cancer', parent: 'oncology' },
  multiple_myeloma: { label: 'Multiple Myeloma', parent: 'oncology' },
  // Cardiology
  hypertension: { label: 'Hypertension', parent: 'cardiology' },
  heart_failure: { label: 'Heart Failure', parent: 'cardiology' },
  atrial_fibrillation: { label: 'Atrial Fibrillation', parent: 'cardiology' },
  coronary_artery_disease: { label: 'Coronary Artery Disease', parent: 'cardiology' },
  // Neurology
  alzheimers: { label: "Alzheimer's Disease", parent: 'neurology' },
  parkinsons: { label: "Parkinson's Disease", parent: 'neurology' },
  multiple_sclerosis: { label: 'Multiple Sclerosis', parent: 'neurology' },
  epilepsy: { label: 'Epilepsy', parent: 'neurology' },
  migraine: { label: 'Migraine', parent: 'neurology' },
  als: { label: 'ALS', parent: 'neurology' },
  // Infectious Disease
  hiv: { label: 'HIV/AIDS', parent: 'infectious_disease' },
  hepatitis_b: { label: 'Hepatitis B', parent: 'infectious_disease' },
  hepatitis_c: { label: 'Hepatitis C', parent: 'infectious_disease' },
  tuberculosis: { label: 'Tuberculosis', parent: 'infectious_disease' },
  covid19: { label: 'COVID-19', parent: 'infectious_disease' },
  sepsis: { label: 'Sepsis', parent: 'infectious_disease' },
  // Immunology
  rheumatoid_arthritis: { label: 'Rheumatoid Arthritis', parent: 'immunology' },
  lupus: { label: 'Systemic Lupus Erythematosus', parent: 'immunology' },
  psoriasis: { label: 'Psoriasis', parent: 'immunology' },
  crohns: { label: "Crohn's Disease", parent: 'immunology' },
  ulcerative_colitis: { label: 'Ulcerative Colitis', parent: 'immunology' },
  // Endocrinology
  diabetes_type1: { label: 'Type 1 Diabetes', parent: 'endocrinology' },
  diabetes_type2: { label: 'Type 2 Diabetes', parent: 'endocrinology' },
  obesity: { label: 'Obesity', parent: 'endocrinology' },
  thyroid_disorder: { label: 'Thyroid Disorders', parent: 'endocrinology' },
  // Respiratory
  asthma: { label: 'Asthma', parent: 'respiratory' },
  copd: { label: 'COPD', parent: 'respiratory' },
  pulmonary_fibrosis: { label: 'Pulmonary Fibrosis', parent: 'respiratory' },
  // Rare Disease
  cystic_fibrosis: { label: 'Cystic Fibrosis', parent: 'rare_disease' },
  duchenne: { label: 'Duchenne Muscular Dystrophy', parent: 'rare_disease' },
  huntingtons: { label: "Huntington's Disease", parent: 'rare_disease' },
  hemophilia: { label: 'Hemophilia', parent: 'rare_disease' },
  gaucher: { label: "Gaucher Disease", parent: 'rare_disease' },
} as const

export type DiseaseAreaKey = keyof typeof DISEASE_AREAS

// ==========================================================================
// SPECIMEN TYPES
// ==========================================================================

export const SPECIMEN_TYPES = {
  whole_blood: { label: 'Whole Blood', category: 'liquid', anticoagulant: true, typicalVolume: '5-10 mL' },
  serum: { label: 'Serum', category: 'liquid', anticoagulant: false, typicalVolume: '2-5 mL' },
  plasma: { label: 'Plasma', category: 'liquid', anticoagulant: true, typicalVolume: '2-5 mL' },
  pbmc: { label: 'PBMC (Peripheral Blood Mononuclear Cells)', category: 'cellular', requiresProcessing: true },
  buffy_coat: { label: 'Buffy Coat', category: 'cellular', requiresProcessing: true },
  dna: { label: 'DNA (Genomic)', category: 'molecular', extracted: true },
  rna: { label: 'RNA', category: 'molecular', extracted: true, coldChain: 'minus80' },
  ffpe: { label: 'FFPE (Formalin-Fixed Paraffin-Embedded)', category: 'tissue', ambientStorage: true },
  fresh_frozen_tissue: { label: 'Fresh Frozen Tissue', category: 'tissue', coldChain: 'minus80' },
  fresh_tissue: { label: 'Fresh Tissue', category: 'tissue', coldChain: 'refrigerated', stabilityHours: 24 },
  saliva: { label: 'Saliva', category: 'liquid', nonInvasive: true },
  urine: { label: 'Urine', category: 'liquid', nonInvasive: true },
  csf: { label: 'CSF (Cerebrospinal Fluid)', category: 'liquid', invasive: true },
  bone_marrow: { label: 'Bone Marrow Aspirate', category: 'tissue', invasive: true },
  stool: { label: 'Stool / Fecal', category: 'solid', nonInvasive: true },
  swab_nasopharyngeal: { label: 'Nasopharyngeal Swab', category: 'swab' },
  swab_buccal: { label: 'Buccal Swab', category: 'swab', nonInvasive: true },
  swab_vaginal: { label: 'Vaginal Swab', category: 'swab' },
  swab_rectal: { label: 'Rectal Swab', category: 'swab' },
  sputum: { label: 'Sputum', category: 'liquid' },
  pleural_fluid: { label: 'Pleural Fluid', category: 'liquid' },
  ascites: { label: 'Ascites Fluid', category: 'liquid' },
  synovial_fluid: { label: 'Synovial Fluid', category: 'liquid' },
  hair: { label: 'Hair Sample', category: 'solid', ambientStorage: true },
  nails: { label: 'Nail Clippings', category: 'solid', ambientStorage: true },
  biopsy_core: { label: 'Core Needle Biopsy', category: 'tissue' },
  biopsy_excisional: { label: 'Excisional Biopsy', category: 'tissue' },
  surgical_resection: { label: 'Surgical Resection', category: 'tissue' },
  cell_pellet: { label: 'Cell Pellet', category: 'cellular', requiresProcessing: true },
  plasma_edta: { label: 'Plasma (EDTA)', category: 'liquid', anticoagulant: true },
  plasma_heparin: { label: 'Plasma (Heparin)', category: 'liquid', anticoagulant: true },
  plasma_citrate: { label: 'Plasma (Citrate)', category: 'liquid', anticoagulant: true },
} as const

export type SpecimenTypeKey = keyof typeof SPECIMEN_TYPES

// ==========================================================================
// LABORATORY TECHNIQUES
// ==========================================================================

export const LABORATORY_TECHNIQUES = {
  // Processing
  centrifugation: { label: 'Centrifugation', category: 'processing' },
  aliquoting: { label: 'Aliquoting', category: 'processing' },
  pbmc_isolation: { label: 'PBMC Isolation (Ficoll)', category: 'processing' },
  dna_extraction: { label: 'DNA Extraction', category: 'molecular' },
  rna_extraction: { label: 'RNA Extraction', category: 'molecular' },
  protein_extraction: { label: 'Protein Extraction', category: 'molecular' },
  cell_counting: { label: 'Cell Counting / Viability', category: 'processing' },
  cryopreservation: { label: 'Cryopreservation', category: 'storage' },
  thawing: { label: 'Controlled Thawing', category: 'processing' },
  fixation: { label: 'Tissue Fixation (Formalin)', category: 'histology' },
  embedding: { label: 'Paraffin Embedding', category: 'histology' },
  sectioning: { label: 'Microtome Sectioning', category: 'histology' },
  h_e_staining: { label: 'H&E Staining', category: 'histology' },
  ihc: { label: 'Immunohistochemistry (IHC)', category: 'histology' },
  // Molecular
  pcr: { label: 'PCR', category: 'molecular' },
  qpcr: { label: 'qPCR / RT-qPCR', category: 'molecular' },
  digital_pcr: { label: 'Digital PCR (dPCR)', category: 'molecular' },
  ngs: { label: 'Next-Generation Sequencing (NGS)', category: 'molecular' },
  whole_genome: { label: 'Whole Genome Sequencing (WGS)', category: 'molecular' },
  whole_exome: { label: 'Whole Exome Sequencing (WES)', category: 'molecular' },
  rna_seq: { label: 'RNA Sequencing (RNA-seq)', category: 'molecular' },
  microarray: { label: 'Microarray Analysis', category: 'molecular' },
  elisa: { label: 'ELISA', category: 'immunoassay' },
  multiplex_immunoassay: { label: 'Multiplex Immunoassay', category: 'immunoassay' },
  flow_cytometry: { label: 'Flow Cytometry', category: 'cellular' },
  mass_cytometry: { label: 'Mass Cytometry (CyTOF)', category: 'cellular' },
  cell_sorting: { label: 'FACS / Cell Sorting', category: 'cellular' },
  // Clinical Chemistry
  chemistry_panel: { label: 'Clinical Chemistry Panel', category: 'clinical' },
  hematology_analyzer: { label: 'Hematology Analyzer', category: 'clinical' },
  coagulation: { label: 'Coagulation Testing', category: 'clinical' },
  urinalysis: { label: 'Urinalysis', category: 'clinical' },
  microbiology_culture: { label: 'Microbiology Culture', category: 'clinical' },
  serology: { label: 'Serology Testing', category: 'clinical' },
  // Imaging
  mri: { label: 'MRI', category: 'imaging' },
  ct: { label: 'CT Scan', category: 'imaging' },
  pet_ct: { label: 'PET/CT', category: 'imaging' },
  ultrasound: { label: 'Ultrasound', category: 'imaging' },
  x_ray: { label: 'X-Ray', category: 'imaging' },
  dexa: { label: 'DEXA / Bone Density', category: 'imaging' },
  mammography: { label: 'Mammography', category: 'imaging' },
} as const

export type LaboratoryTechniqueKey = keyof typeof LABORATORY_TECHNIQUES

// ==========================================================================
// EQUIPMENT CATEGORIES
// ==========================================================================

export const EQUIPMENT_CATEGORIES = {
  // Storage
  freezer_minus80: { label: '-80°C Freezer', category: 'storage', temperatureRange: '-70°C to -86°C' },
  freezer_minus20: { label: '-20°C Freezer', category: 'storage', temperatureRange: '-18°C to -25°C' },
  refrigerator: { label: 'Refrigerator (2-8°C)', category: 'storage', temperatureRange: '2°C to 8°C' },
  ln2_tank: { label: 'Liquid Nitrogen Tank', category: 'storage', temperatureRange: '-196°C' },
  ln2_vapor: { label: 'LN2 Vapor Phase', category: 'storage', temperatureRange: '-150°C to -190°C' },
  ambient_storage: { label: 'Ambient Storage (15-25°C)', category: 'storage', temperatureRange: '15°C to 25°C' },
  cold_room: { label: 'Cold Room / Walk-in', category: 'storage' },
  // Processing
  centrifuge_refrigerated: { label: 'Refrigerated Centrifuge', category: 'processing' },
  centrifuge_room_temp: { label: 'Room Temperature Centrifuge', category: 'processing' },
  microcentrifuge: { label: 'Microcentrifuge', category: 'processing' },
  biosafety_cabinet: { label: 'Biosafety Cabinet (BSC Class II)', category: 'safety' },
  fume_hood: { label: 'Fume Hood', category: 'safety' },
  // Analysis
  pcr_thermocycler: { label: 'PCR Thermocycler', category: 'molecular' },
  qpcr_instrument: { label: 'qPCR Instrument', category: 'molecular' },
  sequencer: { label: 'DNA Sequencer (NGS)', category: 'molecular' },
  flow_cytometer: { label: 'Flow Cytometer', category: 'cellular' },
  cell_counter: { label: 'Automated Cell Counter', category: 'cellular' },
  plate_reader: { label: 'Microplate Reader', category: 'immunoassay' },
  spectrophotometer: { label: 'Spectrophotometer', category: 'analytical' },
  chemistry_analyzer: { label: 'Clinical Chemistry Analyzer', category: 'clinical' },
  hematology_analyzer: { label: 'Hematology Analyzer', category: 'clinical' },
  coagulometer: { label: 'Coagulometer', category: 'clinical' },
  // Imaging
  mri_scanner: { label: 'MRI Scanner', category: 'imaging' },
  ct_scanner: { label: 'CT Scanner', category: 'imaging' },
  ultrasound_machine: { label: 'Ultrasound Machine', category: 'imaging' },
  xray_machine: { label: 'X-Ray Machine', category: 'imaging' },
  // Histology
  microtome: { label: 'Microtome', category: 'histology' },
  tissue_processor: { label: 'Tissue Processor', category: 'histology' },
  embedding_station: { label: 'Embedding Station', category: 'histology' },
  autostainer: { label: 'Automated Slide Stainer', category: 'histology' },
  cryostat: { label: 'Cryostat', category: 'histology' },
  // Shipping
  dry_shipper: { label: 'Dry Shipper (LN2)', category: 'shipping' },
  cold_pack_shipper: { label: 'Cold Pack Shipper', category: 'shipping' },
  ambient_shipper: { label: 'Ambient Shipper', category: 'shipping' },
  temperature_monitor: { label: 'Temperature Monitor / Data Logger', category: 'monitoring' },
  // General
  pipette: { label: 'Pipette (Single/Multi-channel)', category: 'general' },
  balance: { label: 'Analytical Balance', category: 'general' },
  ph_meter: { label: 'pH Meter', category: 'general' },
  water_bath: { label: 'Water Bath', category: 'general' },
  incubator: { label: 'Incubator', category: 'general' },
  autoclave: { label: 'Autoclave', category: 'sterilization' },
  ice_maker: { label: 'Ice Maker', category: 'general' },
  pure_water_system: { label: 'Pure Water System', category: 'general' },
} as const

export type EquipmentCategoryKey = keyof typeof EQUIPMENT_CATEGORIES

// ==========================================================================
// FACILITY TYPES
// ==========================================================================

export const FACILITY_TYPES = {
  clinical_research_site: { label: 'Clinical Research Site', category: 'clinical' },
  central_laboratory: { label: 'Central Laboratory', category: 'laboratory' },
  specialty_laboratory: { label: 'Specialty Laboratory', category: 'laboratory' },
  reference_laboratory: { label: 'Reference Laboratory', category: 'laboratory' },
  biobank: { label: 'Biobank / Repository', category: 'storage' },
  biorepository_satellite: { label: 'Satellite Biorepository', category: 'storage' },
  processing_center: { label: 'Processing Center', category: 'processing' },
  collection_site: { label: 'Collection Site', category: 'clinical' },
  clinic: { label: 'Clinic / Outpatient', category: 'clinical' },
  hospital: { label: 'Hospital', category: 'clinical' },
  academic_center: { label: 'Academic Medical Center', category: 'clinical' },
  pharmacy: { label: 'Investigational Pharmacy', category: 'pharmacy' },
  imaging_center: { label: 'Imaging Center', category: 'imaging' },
  data_center: { label: 'Data / Coordinating Center', category: 'administrative' },
  office: { label: 'Administrative Office', category: 'administrative' },
  mobile_unit: { label: 'Mobile Research Unit', category: 'clinical' },
  home_visit: { label: 'Home Visit (Decentralized)', category: 'clinical' },
} as const

export type FacilityTypeKey = keyof typeof FACILITY_TYPES

// ==========================================================================
// CAPABILITY TYPES
// ==========================================================================

export const CAPABILITY_TYPES = {
  patient_recruitment: { label: 'Patient Recruitment', category: 'clinical_operations' },
  informed_consent: { label: 'Informed Consent Process', category: 'clinical_operations' },
  physical_exam: { label: 'Physical Examination', category: 'clinical_operations' },
  vital_signs: { label: 'Vital Signs Collection', category: 'clinical_operations' },
  ecg: { label: 'ECG / EKG', category: 'clinical_operations' },
  infusion: { label: 'Infusion / IP Administration', category: 'clinical_operations' },
  injection: { label: 'Injection (IM/SC/IV)', category: 'clinical_operations' },
  phlebotomy: { label: 'Phlebotomy / Blood Draw', category: 'specimen_collection' },
  biopsy: { label: 'Tissue Biopsy', category: 'specimen_collection' },
  urine_collection: { label: 'Urine Collection', category: 'specimen_collection' },
  saliva_collection: { label: 'Saliva Collection', category: 'specimen_collection' },
  csf_collection: { label: 'CSF Collection (Lumbar Puncture)', category: 'specimen_collection' },
  sample_processing: { label: 'Sample Processing', category: 'laboratory' },
  centrifugation: { label: 'Centrifugation', category: 'laboratory' },
  aliquoting: { label: 'Aliquoting', category: 'laboratory' },
  pbmc_processing: { label: 'PBMC Processing', category: 'laboratory' },
  dna_extraction: { label: 'DNA Extraction', category: 'laboratory' },
  rna_extraction: { label: 'RNA Extraction', category: 'laboratory' },
  ffpe_processing: { label: 'FFPE Processing', category: 'laboratory' },
  histology: { label: 'Histology / Slide Preparation', category: 'laboratory' },
  ihc: { label: 'Immunohistochemistry (IHC)', category: 'laboratory' },
  flow_cytometry: { label: 'Flow Cytometry', category: 'laboratory' },
  pcr: { label: 'PCR / qPCR', category: 'laboratory' },
  ngs: { label: 'Next-Generation Sequencing', category: 'laboratory' },
  elisa: { label: 'ELISA', category: 'laboratory' },
  biobanking: { label: 'Biobanking / Long-term Storage', category: 'storage' },
  cold_chain: { label: 'Cold Chain Management', category: 'logistics' },
  sample_shipping_domestic: { label: 'Domestic Sample Shipping', category: 'logistics' },
  sample_shipping_international: { label: 'International Sample Shipping', category: 'logistics' },
  dry_ice_shipping: { label: 'Dry Ice Shipping', category: 'logistics' },
  ln2_shipping: { label: 'LN2 Dry Shipper', category: 'logistics' },
  imaging_mri: { label: 'MRI Imaging', category: 'imaging' },
  imaging_ct: { label: 'CT Imaging', category: 'imaging' },
  imaging_pet: { label: 'PET/CT Imaging', category: 'imaging' },
  imaging_ultrasound: { label: 'Ultrasound', category: 'imaging' },
  imaging_xray: { label: 'X-Ray', category: 'imaging' },
  imaging_dexa: { label: 'DEXA / Bone Density', category: 'imaging' },
  investigational_pharmacy: { label: 'Investigational Pharmacy', category: 'pharmacy' },
  ip_management: { label: 'IP Management / Accountability', category: 'pharmacy' },
  regulatory_submission: { label: 'Regulatory Submission (IRB/FDA)', category: 'regulatory' },
  contract_negotiation: { label: 'Contract / Budget Negotiation', category: 'administrative' },
  data_management: { label: 'Data Management / EDC', category: 'data' },
  source_documentation: { label: 'Source Documentation', category: 'data' },
  ae_sae_reporting: { label: 'AE / SAE Reporting', category: 'safety' },
  monitoring_readiness: { label: 'Monitoring Visit Readiness', category: 'quality' },
  audit_readiness: { label: 'Audit Readiness', category: 'quality' },
  emergency_care: { label: 'Emergency Care / Code Response', category: 'safety' },
  telemedicine: { label: 'Telemedicine / Remote Visits', category: 'clinical_operations' },
  decentralized_trial: { label: 'Decentralized / Hybrid Trial Capability', category: 'clinical_operations' },
  phase1: { label: 'Phase I / FIH Capability', category: 'research_phase' },
  phase2: { label: 'Phase II Capability', category: 'research_phase' },
  phase3: { label: 'Phase III Capability', category: 'research_phase' },
  phase4: { label: 'Phase IV / Post-Market', category: 'research_phase' },
  device_trial: { label: 'Medical Device Trial', category: 'research_phase' },
  rwe_study: { label: 'Real World Evidence Study', category: 'research_phase' },
  registry_study: { label: 'Registry / Observational Study', category: 'research_phase' },
} as const

export type CapabilityTypeKey = keyof typeof CAPABILITY_TYPES

// ==========================================================================
// DOCUMENT TYPES
// ==========================================================================

export const DOCUMENT_TYPES = {
  quality_manual: { label: 'Quality Manual', category: 'quality', evidenceClass: 'A' },
  sop: { label: 'Standard Operating Procedure', category: 'quality', evidenceClass: 'B' },
  work_instruction: { label: 'Work Instruction', category: 'quality', evidenceClass: 'C' },
  policy_document: { label: 'Policy Document', category: 'policy', evidenceClass: 'B' },
  training_record: { label: 'Training Record', category: 'training', evidenceClass: 'C' },
  competency_assessment: { label: 'Competency Assessment', category: 'training', evidenceClass: 'C' },
  cv: { label: 'Curriculum Vitae', category: 'personnel', evidenceClass: 'B' },
  medical_license: { label: 'Medical License', category: 'licensing', evidenceClass: 'A' },
  dea_registration: { label: 'DEA Registration', category: 'licensing', evidenceClass: 'A' },
  state_lab_license: { label: 'State Lab License', category: 'licensing', evidenceClass: 'A' },
  clia_certificate: { label: 'CLIA Certificate', category: 'certification', evidenceClass: 'A' },
  cap_certificate: { label: 'CAP Accreditation', category: 'certification', evidenceClass: 'A' },
  cola_certificate: { label: 'COLA Accreditation', category: 'certification', evidenceClass: 'A' },
  iso_certificate: { label: 'ISO Certification', category: 'certification', evidenceClass: 'A' },
  fwa_document: { label: 'Federalwide Assurance (FWA)', category: 'regulatory', evidenceClass: 'A' },
  irb_approval: { label: 'IRB Approval / Registration', category: 'regulatory', evidenceClass: 'A' },
  ibc_approval: { label: 'IBC Registration', category: 'regulatory', evidenceClass: 'A' },
  fda_registration: { label: 'FDA Registration', category: 'regulatory', evidenceClass: 'A' },
  insurance_certificate: { label: 'Insurance Certificate', category: 'insurance', evidenceClass: 'B' },
  iata_certificate: { label: 'IATA Certification', category: 'certification', evidenceClass: 'B' },
  gcp_certificate: { label: 'GCP Training Certificate', category: 'training', evidenceClass: 'C' },
  hsp_certificate: { label: 'Human Subjects Protection Certificate', category: 'training', evidenceClass: 'C' },
  equipment_qualification: { label: 'Equipment Qualification (IQ/OQ/PQ)', category: 'equipment', evidenceClass: 'B' },
  calibration_certificate: { label: 'Calibration Certificate', category: 'equipment', evidenceClass: 'B' },
  preventive_maintenance_log: { label: 'Preventive Maintenance Log', category: 'equipment', evidenceClass: 'C' },
  temperature_log: { label: 'Temperature Monitoring Log', category: 'equipment', evidenceClass: 'C' },
  capa_record: { label: 'CAPA Record', category: 'quality', evidenceClass: 'B' },
  deviation_report: { label: 'Deviation Report', category: 'quality', evidenceClass: 'B' },
  audit_report: { label: 'Audit Report', category: 'quality', evidenceClass: 'A' },
  management_review: { label: 'Management Review Minutes', category: 'quality', evidenceClass: 'B' },
  risk_assessment: { label: 'Risk Assessment', category: 'quality', evidenceClass: 'C' },
  vendor_qualification: { label: 'Vendor Qualification', category: 'quality', evidenceClass: 'C' },
  chain_of_custody: { label: 'Chain of Custody Record', category: 'logistics', evidenceClass: 'B' },
  shipping_manifest: { label: 'Shipping Manifest', category: 'logistics', evidenceClass: 'C' },
  informed_consent_form: { label: 'Informed Consent Form (ICF)', category: 'regulatory', evidenceClass: 'A' },
  protocol: { label: 'Study Protocol', category: 'research', evidenceClass: 'A' },
  investigator_brochure: { label: 'Investigator Brochure (IB)', category: 'research', evidenceClass: 'A' },
  regulatory_binder: { label: 'Regulatory Binder', category: 'regulatory', evidenceClass: 'A' },
  business_license: { label: 'Business License', category: 'licensing', evidenceClass: 'A' },
  tax_document: { label: 'Tax ID / W-9', category: 'financial', evidenceClass: 'B' },
  contract: { label: 'Contract / Agreement', category: 'legal', evidenceClass: 'A' },
  mta: { label: 'Material Transfer Agreement (MTA)', category: 'legal', evidenceClass: 'A' },
} as const

export type DocumentTypeKey = keyof typeof DOCUMENT_TYPES

// ==========================================================================
// CERTIFICATION TYPES
// ==========================================================================

export const CERTIFICATION_TYPES = {
  gcp: { label: 'Good Clinical Practice (GCP)', category: 'research', typicallyExpiresMonths: 36 },
  hsp: { label: 'Human Subjects Protection (HSP)', category: 'research', typicallyExpiresMonths: 24 },
  iata: { label: 'IATA Dangerous Goods', category: 'shipping', typicallyExpiresMonths: 24 },
  acls: { label: 'Advanced Cardiac Life Support (ACLS)', category: 'clinical', typicallyExpiresMonths: 24 },
  bls: { label: 'Basic Life Support (BLS)', category: 'clinical', typicallyExpiresMonths: 24 },
  socra: { label: 'SOCRA Certified Clinical Research Professional', category: 'research', typicallyExpiresMonths: 36 },
  acrp: { label: 'ACRP Certified (CCRC/CCRA/CPI)', category: 'research', typicallyExpiresMonths: 36 },
  phlebotomy: { label: 'Phlebotomy Certification', category: 'clinical', typicallyExpiresMonths: null },
  ascp: { label: 'ASCP Medical Laboratory Certification', category: 'laboratory', typicallyExpiresMonths: 36 },
  amt: { label: 'AMT Medical Technologist Certification', category: 'laboratory', typicallyExpiresMonths: 36 },
  board_certification: { label: 'Medical Board Certification', category: 'clinical', typicallyExpiresMonths: 120 },
  clia_lab_director: { label: 'CLIA Lab Director Qualification', category: 'laboratory', typicallyExpiresMonths: null },
} as const

export type CertificationTypeKey = keyof typeof CERTIFICATION_TYPES

// ==========================================================================
// TRAINING TYPES
// ==========================================================================

export const TRAINING_TYPES = {
  gcp_training: { label: 'GCP Training', certificationKey: 'gcp' },
  hsp_training: { label: 'Human Subjects Protection Training', certificationKey: 'hsp' },
  iata_training: { label: 'IATA Dangerous Goods Training', certificationKey: 'iata' },
  sop_training: { label: 'SOP-Specific Training', certificationKey: null },
  equipment_training: { label: 'Equipment Operation Training', certificationKey: null },
  safety_training: { label: 'Lab Safety / Biosafety Training', certificationKey: null },
  protocol_training: { label: 'Protocol-Specific Training', certificationKey: null },
  data_privacy: { label: 'Data Privacy / HIPAA Training', certificationKey: null },
  diversity_training: { label: 'Diversity & Inclusion in Research', certificationKey: null },
  soft_skills: { label: 'Communication / Soft Skills', certificationKey: null },
  leadership: { label: 'Leadership / Management Training', certificationKey: null },
} as const

export type TrainingTypeKey = keyof typeof TRAINING_TYPES

// ==========================================================================
// ORGANIZATION TYPES
// ==========================================================================

export const ORGANIZATION_TYPES = {
  academic_medical_center: { label: 'Academic Medical Center' },
  community_hospital: { label: 'Community Hospital' },
  research_institute: { label: 'Independent Research Institute' },
  reference_lab: { label: 'Reference / Central Laboratory' },
  biobank: { label: 'Biobank / Biospecimen Repository' },
  cro: { label: 'Contract Research Organization (CRO)' },
  physician_practice: { label: 'Physician Practice / Clinic' },
  diagnostic_lab: { label: 'Diagnostic Laboratory' },
  specialty_lab: { label: 'Specialty Laboratory' },
  pharma_site: { label: 'Pharma / Biotech Research Site' },
  government: { label: 'Government / Public Health' },
  nonprofit: { label: 'Non-Profit Research Organization' },
  site_network: { label: 'Site Network / SMO' },
  university: { label: 'University' },
} as const

export type OrganizationTypeKey = keyof typeof ORGANIZATION_TYPES

// ==========================================================================
// RESEARCH ROLES
// ==========================================================================

export const RESEARCH_ROLES = {
  pi: { label: 'Principal Investigator (PI)', category: 'investigator', leadership: true },
  sub_i: { label: 'Sub-Investigator (Sub-I)', category: 'investigator', leadership: false },
  study_coordinator: { label: 'Study Coordinator', category: 'operations', leadership: false },
  lead_coordinator: { label: 'Lead Coordinator', category: 'operations', leadership: true },
  research_nurse: { label: 'Research Nurse', category: 'clinical', leadership: false },
  research_pharmacist: { label: 'Research Pharmacist', category: 'pharmacy', leadership: false },
  lab_director: { label: 'Laboratory Director', category: 'laboratory', leadership: true },
  lab_technician: { label: 'Laboratory Technician', category: 'laboratory', leadership: false },
  lab_manager: { label: 'Laboratory Manager', category: 'laboratory', leadership: true },
  biobank_manager: { label: 'Biobank Manager', category: 'storage', leadership: true },
  biobank_technician: { label: 'Biobank Technician', category: 'storage', leadership: false },
  data_manager: { label: 'Data Manager', category: 'data', leadership: false },
  regulatory_specialist: { label: 'Regulatory Specialist', category: 'regulatory', leadership: false },
  quality_manager: { label: 'Quality Manager / QA', category: 'quality', leadership: true },
  quality_specialist: { label: 'Quality Specialist', category: 'quality', leadership: false },
  research_director: { label: 'Director of Research', category: 'leadership', leadership: true },
  ceo: { label: 'CEO / Executive Director', category: 'leadership', leadership: true },
  medical_director: { label: 'Medical Director', category: 'leadership', leadership: true },
  site_director: { label: 'Site Director', category: 'leadership', leadership: true },
  cra: { label: 'Clinical Research Associate (CRA)', category: 'monitoring', leadership: false },
  crc: { label: 'Clinical Research Coordinator (CRC)', category: 'operations', leadership: false },
  recruiter: { label: 'Patient Recruiter', category: 'operations', leadership: false },
  phlebotomist: { label: 'Phlebotomist', category: 'clinical', leadership: false },
  external_consultant: { label: 'External Consultant', category: 'external', leadership: false },
  sponsor_representative: { label: 'Sponsor Representative', category: 'external', leadership: false },
  cro_representative: { label: 'CRO Representative', category: 'external', leadership: false },
} as const

export type ResearchRoleKey = keyof typeof RESEARCH_ROLES

// ==========================================================================
// PROGRAM TYPES
// ==========================================================================

export const PROGRAM_TYPES = {
  phase1_oncology: { label: 'Phase I Oncology', category: 'clinical_trial', phase: 'Phase I' },
  phase2_oncology: { label: 'Phase II Oncology', category: 'clinical_trial', phase: 'Phase II' },
  phase3_oncology: { label: 'Phase III Oncology', category: 'clinical_trial', phase: 'Phase III' },
  phase1_general: { label: 'Phase I General Medicine', category: 'clinical_trial', phase: 'Phase I' },
  phase2_general: { label: 'Phase II General Medicine', category: 'clinical_trial', phase: 'Phase II' },
  phase3_general: { label: 'Phase III General Medicine', category: 'clinical_trial', phase: 'Phase III' },
  phase4: { label: 'Phase IV / Post-Market', category: 'clinical_trial', phase: 'Phase IV' },
  device_trial: { label: 'Medical Device Trial', category: 'clinical_trial', phase: 'N/A' },
  biospecimen_collection: { label: 'Biospecimen Collection Program', category: 'biospecimen' },
  biobank_deposit: { label: 'Biobank Deposit Program', category: 'biospecimen' },
  specialty_lab_services: { label: 'Specialty Lab Services Program', category: 'laboratory' },
  central_lab_services: { label: 'Central Lab Services Program', category: 'laboratory' },
  imaging_core_lab: { label: 'Imaging Core Lab Program', category: 'imaging' },
  registry_study: { label: 'Registry / Observational Study', category: 'observational' },
  rwe_program: { label: 'Real World Evidence Program', category: 'observational' },
  expanded_access: { label: 'Expanded Access / Compassionate Use', category: 'access' },
  investigator_initiated: { label: 'Investigator-Initiated Trial (IIT)', category: 'research' },
  decentralized_trial: { label: 'Decentralized / Hybrid Trial', category: 'clinical_trial' },
  diagnostic_validation: { label: 'Diagnostic / IVD Validation', category: 'diagnostic' },
  sample_processing_only: { label: 'Sample Processing Only', category: 'laboratory' },
} as const

export type ProgramTypeKey = keyof typeof PROGRAM_TYPES

// ==========================================================================
// RELATIONSHIP TYPES
// ==========================================================================

export const RELATIONSHIP_TYPES = {
  // Internal (IKM domain)
  operated_by: { label: 'Operated by', domain: 'internal' },
  located_in: { label: 'Located in', domain: 'internal' },
  part_of: { label: 'Part of', domain: 'internal' },
  governed_by: { label: 'Governed by', domain: 'internal' },
  produces: { label: 'Produces', domain: 'internal' },
  depends_on: { label: 'Depends on', domain: 'internal' },
  certified_by: { label: 'Certified by', domain: 'internal' },
  employs: { label: 'Employs', domain: 'internal' },
  supports: { label: 'Supports', domain: 'internal' },
  evidences: { label: 'Evidences', domain: 'internal' },
  precedes: { label: 'Precedes', domain: 'internal' },
  related_to: { label: 'Related to', domain: 'internal' },
  // External (institutional ecosystem)
  sponsor_to_institution: { label: 'Sponsor ↔ Institution', domain: 'external' },
  cro_to_institution: { label: 'CRO ↔ Institution', domain: 'external' },
  pi_to_study: { label: 'PI → Study', domain: 'external' },
  pi_to_capability: { label: 'PI → Capability', domain: 'external' },
  lab_to_equipment: { label: 'Laboratory → Equipment', domain: 'internal' },
  equipment_to_facility: { label: 'Equipment → Facility', domain: 'internal' },
  facility_to_program: { label: 'Facility → Program', domain: 'internal' },
  site_to_network: { label: 'Site → Network', domain: 'external' },
  network_to_sponsor: { label: 'Network → Sponsor', domain: 'external' },
  biobank_to_collection: { label: 'Biobank → Collection Program', domain: 'internal' },
  document_to_claim: { label: 'Document → Claim', domain: 'evidence' },
  claim_to_capability: { label: 'Claim → Capability', domain: 'evidence' },
  capability_to_program: { label: 'Capability → Program', domain: 'evidence' },
  program_to_readiness: { label: 'Program → Readiness Requirement', domain: 'evidence' },
  person_to_certification: { label: 'Person → Certification', domain: 'internal' },
  person_to_training: { label: 'Person → Training', domain: 'internal' },
  person_to_document: { label: 'Person → Document', domain: 'internal' },
  equipment_to_document: { label: 'Equipment → Document', domain: 'internal' },
  facility_to_document: { label: 'Facility → Document', domain: 'internal' },
  capability_to_document: { label: 'Capability → Document', domain: 'evidence' },
  program_to_document: { label: 'Program → Document', domain: 'evidence' },
  institution_to_marketplace: { label: 'Institution → Marketplace Sector', domain: 'marketplace' },
} as const

export type RelationshipTypeKey = keyof typeof RELATIONSHIP_TYPES

// ==========================================================================
// STORAGE CONDITIONS
// ==========================================================================

export const STORAGE_CONDITIONS = {
  ambient: { label: 'Ambient (15-25°C)', minTemp: 15, maxTemp: 25 },
  refrigerated: { label: 'Refrigerated (2-8°C)', minTemp: 2, maxTemp: 8 },
  frozen_minus20: { label: 'Frozen (-20°C)', minTemp: -25, maxTemp: -15 },
  frozen_minus80: { label: 'Ultra-Low (-80°C)', minTemp: -86, maxTemp: -70 },
  ln2_liquid: { label: 'Liquid Nitrogen (-196°C)', minTemp: -196, maxTemp: -196 },
  ln2_vapor: { label: 'LN2 Vapor Phase (-150°C to -190°C)', minTemp: -190, maxTemp: -150 },
  dry_ice: { label: 'Dry Ice (-78°C)', minTemp: -78, maxTemp: -78 },
  cold_pack: { label: 'Cold Pack (2-8°C)', minTemp: 2, maxTemp: 8 },
} as const

export type StorageConditionKey = keyof typeof STORAGE_CONDITIONS

// ==========================================================================
// TAXONOMY HEALTH
// ==========================================================================

export const TAXONOMY_STATS = {
  therapeuticAreas: Object.keys(THERAPEUTIC_AREAS).length,
  diseaseAreas: Object.keys(DISEASE_AREAS).length,
  specimenTypes: Object.keys(SPECIMEN_TYPES).length,
  laboratoryTechniques: Object.keys(LABORATORY_TECHNIQUES).length,
  equipmentCategories: Object.keys(EQUIPMENT_CATEGORIES).length,
  facilityTypes: Object.keys(FACILITY_TYPES).length,
  capabilityTypes: Object.keys(CAPABILITY_TYPES).length,
  documentTypes: Object.keys(DOCUMENT_TYPES).length,
  certificationTypes: Object.keys(CERTIFICATION_TYPES).length,
  trainingTypes: Object.keys(TRAINING_TYPES).length,
  organizationTypes: Object.keys(ORGANIZATION_TYPES).length,
  researchRoles: Object.keys(RESEARCH_ROLES).length,
  programTypes: Object.keys(PROGRAM_TYPES).length,
  relationshipTypes: Object.keys(RELATIONSHIP_TYPES).length,
  storageConditions: Object.keys(STORAGE_CONDITIONS).length,
  totalTerms: 0, // Computed below
}

// Compute total
TAXONOMY_STATS.totalTerms =
  TAXONOMY_STATS.therapeuticAreas +
  TAXONOMY_STATS.diseaseAreas +
  TAXONOMY_STATS.specimenTypes +
  TAXONOMY_STATS.laboratoryTechniques +
  TAXONOMY_STATS.equipmentCategories +
  TAXONOMY_STATS.facilityTypes +
  TAXONOMY_STATS.capabilityTypes +
  TAXONOMY_STATS.documentTypes +
  TAXONOMY_STATS.certificationTypes +
  TAXONOMY_STATS.trainingTypes +
  TAXONOMY_STATS.organizationTypes +
  TAXONOMY_STATS.researchRoles +
  TAXONOMY_STATS.programTypes +
  TAXONOMY_STATS.relationshipTypes +
  TAXONOMY_STATS.storageConditions

// ==========================================================================
// VALIDATION — ensures controlled vocabulary integrity
// ==========================================================================

export function validateTaxonomyTerm(
  taxonomy: Record<string, unknown>,
  term: string,
): { valid: boolean; error: string | null } {
  if (term in taxonomy) {
    return { valid: true, error: null }
  }
  return { valid: false, error: `Term "${term}" is not in the canonical taxonomy. Available: ${Object.keys(taxonomy).slice(0, 10).join(', ')}...` }
}

export function getAllTherapeuticAreaKeys(): TherapeuticAreaKey[] {
  return Object.keys(THERAPEUTIC_AREAS) as TherapeuticAreaKey[]
}

export function getAllCapabilityTypeKeys(): CapabilityTypeKey[] {
  return Object.keys(CAPABILITY_TYPES) as CapabilityTypeKey[]
}

export function getAllSpecimenTypeKeys(): SpecimenTypeKey[] {
  return Object.keys(SPECIMEN_TYPES) as SpecimenTypeKey[]
}

export function getAllDocumentTypeKeys(): DocumentTypeKey[] {
  return Object.keys(DOCUMENT_TYPES) as DocumentTypeKey[]
}
