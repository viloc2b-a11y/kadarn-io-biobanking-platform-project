// ==========================================================================
// MVP Sprint 2 — Infrastructure Interview (Adaptive)
// ==========================================================================
// Facilities, Lab, Equipment, and Biospecimen as one adaptive interview.
// Each subdomain has a gate question. If gate = no, entire subtree hidden.
// ==========================================================================

import type { InterviewSection } from '@/lib/onboarding/interview-engine'

export const INFRASTRUCTURE_INTERVIEW: InterviewSection[] = [
  // ========================================================================
  // FACILITIES (always shown — every institution has a facility)
  // ========================================================================
  {
    id: 'facilities-core',
    domain: 'infrastructure',
    title: 'Facilities & Locations',
    description: 'Your physical footprint determines what you can do. Every space matters.',
    questions: [
      {
        id: 'infra_location_count', domain: 'infrastructure', section: 'facilities', number: 1,
        question: 'How many physical locations does your institution operate from?',
        help: 'Include all sites where research activities occur.',
        type: 'radio', required: true,
        options: [
          { value: 'single', label: 'Single location' },
          { value: 'few', label: '2-3 locations' },
          { value: 'several', label: '4-10 locations' },
          { value: 'many', label: '10+ locations' },
        ],
        generatesClaim: 'Geographic Coverage', feedsCapability: 'Multi-Site Operations', affectsReadiness: 'Operational',
      },
      {
        id: 'infra_facility_type', domain: 'infrastructure', section: 'facilities', number: 2,
        question: 'What type of facility is your primary research site?',
        help: 'This determines your operational context.',
        type: 'select', required: true,
        options: [
          { value: 'dedicated_clinical', label: 'Clinical Research Site — dedicated research space' },
          { value: 'hospital', label: 'Hospital — research within a hospital setting' },
          { value: 'clinic', label: 'Clinic / Outpatient — community-based research' },
          { value: 'academic', label: 'Academic Medical Center' },
          { value: 'lab_only', label: 'Laboratory — standalone lab facility' },
          { value: 'biobank', label: 'Biobank / Repository' },
        ],
        generatesClaim: 'Facility Type', feedsCapability: 'Clinical Operations', affectsReadiness: 'Operational',
      },
      {
        id: 'infra_research_space', domain: 'infrastructure', section: 'facilities', number: 3,
        question: 'Do your facilities have dedicated research space?',
        help: 'Sponsors prefer sites with dedicated research areas.',
        type: 'radio', required: true,
        options: [
          { value: 'dedicated', label: 'Yes — dedicated research wing, floor, or building' },
          { value: 'shared', label: 'Shared — clinical and research spaces overlap' },
          { value: 'minimal', label: 'Minimal — limited or no dedicated research space' },
        ],
        generatesClaim: 'Research Infrastructure', feedsCapability: 'Clinical Operations', affectsReadiness: 'Operational',
      },
      {
        id: 'infra_backup_power', domain: 'infrastructure', section: 'facilities', number: 4,
        question: 'Do you have backup power for critical equipment?',
        help: 'Power failure can destroy years of research specimens.',
        type: 'radio', required: true,
        options: [
          { value: 'both', label: 'Yes — backup generator + UPS for critical equipment' },
          { value: 'generator', label: 'Backup generator only' },
          { value: 'none', label: 'No backup power' },
        ],
        generatesClaim: 'Emergency Preparedness', feedsCapability: 'Cold Chain Reliability', affectsReadiness: 'Operational',
      },
    ],
  },

  // ========================================================================
  // LABORATORY — Gate: only if institution has a lab
  // ========================================================================
  {
    id: 'lab-gate',
    domain: 'infrastructure',
    title: 'Laboratory',
    description: 'Your laboratory capabilities.',
    questions: [
      {
        id: 'infra_has_lab', domain: 'infrastructure', section: 'laboratory', number: 5,
        question: 'Do you operate a laboratory?',
        help: 'If no, we skip all lab-related questions.',
        type: 'radio', required: true, isGate: true,
        options: [
          { value: 'yes', label: 'Yes — we operate one or more laboratories' },
          { value: 'no', label: 'No — we do not operate a laboratory' },
        ],
        generatesClaim: 'Laboratory Operations', feedsCapability: 'Sample Processing', affectsReadiness: 'Laboratory',
      },
    ],
  },
  {
    id: 'lab-details',
    domain: 'infrastructure',
    title: 'Laboratory Capabilities',
    description: 'What your lab can do.',
    gateCondition: { questionId: 'infra_has_lab', operator: 'equals', value: 'yes' },
    questions: [
      {
        id: 'infra_lab_certs', domain: 'infrastructure', section: 'laboratory', number: 6,
        question: 'What certifications does your laboratory hold?',
        help: 'CLIA is required for clinical testing. CAP/COLA are quality accreditations.',
        type: 'checkbox', required: true,
        options: [
          { value: 'clia', label: 'CLIA Certificate' },
          { value: 'cap', label: 'CAP Accreditation' },
          { value: 'cola', label: 'COLA Accreditation' },
          { value: 'iso', label: 'ISO 15189 / 17025' },
          { value: 'state_lab', label: 'State Laboratory License' },
          { value: 'none', label: 'None — research-only, not clinical' },
        ],
        generatesClaim: 'Lab Certification', feedsCapability: 'Clinical Testing', affectsReadiness: 'Regulatory',
      },
      {
        id: 'infra_lab_processing', domain: 'infrastructure', section: 'laboratory', number: 7,
        question: 'What processing capabilities does your lab have?',
        help: 'Select everything. This directly determines program eligibility.',
        type: 'checkbox', required: true,
        options: [
          { value: 'centrifugation', label: 'Centrifugation' },
          { value: 'aliquoting', label: 'Aliquoting' },
          { value: 'pbmc', label: 'PBMC Isolation' },
          { value: 'dna', label: 'DNA Extraction' },
          { value: 'rna', label: 'RNA Extraction' },
          { value: 'cell_count', label: 'Cell Counting / Viability' },
          { value: 'cryo', label: 'Cryopreservation' },
          { value: 'flow', label: 'Flow Cytometry' },
          { value: 'pcr', label: 'PCR / qPCR' },
          { value: 'elisa', label: 'ELISA' },
          { value: 'histology', label: 'Histology / Slide Prep' },
          { value: 'ihc', label: 'Immunohistochemistry (IHC)' },
        ],
        generatesClaim: 'Lab Processing Capabilities', feedsCapability: 'Sample Processing', affectsReadiness: 'Laboratory',
      },
    ],
  },

  // ========================================================================
  // EQUIPMENT — Only if has lab or handles biospecimens
  // ========================================================================
  {
    id: 'equipment-core',
    domain: 'infrastructure',
    title: 'Equipment & Storage',
    description: 'The tools that power your research.',
    questions: [
      {
        id: 'infra_storage_equip', domain: 'infrastructure', section: 'equipment', number: 8,
        question: 'What storage equipment do you operate?',
        help: 'Storage capacity and type determine which specimen programs you qualify for.',
        type: 'checkbox', required: false,
        options: [
          { value: 'minus80', label: '-80°C Freezer', description: 'Standard for long-term biospecimen storage' },
          { value: 'minus20', label: '-20°C Freezer' },
          { value: 'refrigerated', label: 'Refrigerator (2-8°C)' },
          { value: 'ln2', label: 'Liquid Nitrogen Tank', description: 'Required for PBMC and viable cell storage' },
          { value: 'ambient', label: 'Ambient Storage (15-25°C)' },
          { value: 'cold_room', label: 'Cold Room / Walk-in' },
        ],
        generatesClaim: 'Storage Infrastructure', feedsCapability: 'Biospecimen Storage', affectsReadiness: 'Biospecimen',
      },
      {
        id: 'infra_temp_monitoring', domain: 'infrastructure', section: 'equipment', number: 9,
        question: 'Do you have temperature monitoring with alarms?',
        help: 'Continuous monitoring is mandatory for regulated studies.',
        type: 'radio', required: false,
        options: [
          { value: 'full', label: 'Yes — continuous logging, alarms, backup power' },
          { value: 'partial', label: 'Partially — manual checks, no automated alarms' },
          { value: 'none', label: 'Not yet — implementing monitoring' },
        ],
        generatesClaim: 'Temperature Monitoring', feedsCapability: 'Cold Chain Reliability', affectsReadiness: 'Biospecimen',
      },
    ],
  },

  // ========================================================================
  // BIOSPECIMEN — Gate: only if institution handles biospecimens
  // ========================================================================
  {
    id: 'biospecimen-gate',
    domain: 'infrastructure',
    title: 'Biospecimen Operations',
    description: 'How you handle biological samples.',
    questions: [
      {
        id: 'infra_has_biospecimen', domain: 'infrastructure', section: 'biospecimen', number: 10,
        question: 'Do you collect, process, store, or ship biospecimens?',
        help: 'If your institution only handles data or administrative work, we skip this.',
        type: 'radio', required: true, isGate: true,
        options: [
          { value: 'yes', label: 'Yes — we handle biospecimens' },
          { value: 'no', label: 'No — we do not handle biospecimens' },
        ],
        generatesClaim: 'Biospecimen Operations', feedsCapability: 'Sample Collection', affectsReadiness: 'Biospecimen',
      },
    ],
  },
  {
    id: 'biospecimen-details',
    domain: 'infrastructure',
    title: 'Specimen Types & Handling',
    description: 'What specimens you handle and how.',
    gateCondition: { questionId: 'infra_has_biospecimen', operator: 'equals', value: 'yes' },
    questions: [
      {
        id: 'infra_specimen_types', domain: 'infrastructure', section: 'biospecimen', number: 11,
        question: 'What specimen types do you handle?',
        help: 'Select every type you can collect, process, store, or ship.',
        type: 'checkbox', required: true,
        options: [
          { value: 'whole_blood', label: 'Whole Blood' },
          { value: 'serum', label: 'Serum' },
          { value: 'plasma', label: 'Plasma' },
          { value: 'pbmc', label: 'PBMC' },
          { value: 'dna', label: 'DNA' },
          { value: 'rna', label: 'RNA' },
          { value: 'ffpe', label: 'FFPE Tissue' },
          { value: 'frozen_tissue', label: 'Fresh Frozen Tissue' },
          { value: 'fresh_tissue', label: 'Fresh Tissue' },
          { value: 'saliva', label: 'Saliva' },
          { value: 'urine', label: 'Urine' },
          { value: 'csf', label: 'CSF' },
        ],
        generatesClaim: 'Specimen Type Coverage', feedsCapability: 'Biospecimen Collection', affectsReadiness: 'Biospecimen',
      },
      {
        id: 'infra_shipping', domain: 'infrastructure', section: 'biospecimen', number: 12,
        question: 'Can you ship biospecimens?',
        help: 'International shipping requires IATA-certified staff.',
        type: 'radio', required: true,
        options: [
          { value: 'both', label: 'Yes — both domestic and international' },
          { value: 'domestic', label: 'Domestic only' },
          { value: 'none', label: 'We do not ship — specimens stay on site' },
        ],
        generatesClaim: 'Shipping Capability', feedsCapability: 'Sample Shipping', affectsReadiness: 'Biospecimen',
      },
      {
        id: 'infra_custody', domain: 'infrastructure', section: 'biospecimen', number: 13,
        question: 'How do you track chain of custody?',
        help: 'Chain of custody traces every specimen from collection to final disposition.',
        type: 'radio', required: true,
        options: [
          { value: 'digital', label: 'Digital tracking system (LIMS or electronic log)' },
          { value: 'paper', label: 'Paper logs or manual tracking' },
          { value: 'none', label: 'Not currently tracked' },
        ],
        generatesClaim: 'Chain of Custody', feedsCapability: 'Specimen Traceability', affectsReadiness: 'Biospecimen',
      },
    ],
  },
]

export const INFRASTRUCTURE_TOTAL_QUESTIONS = INFRASTRUCTURE_INTERVIEW.reduce(
  (sum, s) => sum + s.questions.length, 0
)
