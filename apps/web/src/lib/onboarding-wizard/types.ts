// ==========================================================================
// Onboarding Wizard Types — Block 04 Product Layer
// ==========================================================================
// 10-step onboarding wizard for institution setup.
// Persistent draft via localStorage. Submits to backend API.
// ==========================================================================

export const WIZARD_STEPS = [
  'identity',
  'institution-type',
  'research-focus',
  'locations',
  'people',
  'infrastructure',
  'capabilities',
  'evidence',
  'review',
  'results',
] as const

export type WizardStep = (typeof WIZARD_STEPS)[number]

export const STEP_LABELS: Record<WizardStep, string> = {
  'identity': 'Institution Identity',
  'institution-type': 'Institution Type',
  'research-focus': 'Research Focus',
  'locations': 'Locations & Coverage',
  'people': 'People & Roles',
  'infrastructure': 'Infrastructure',
  'capabilities': 'Capabilities',
  'evidence': 'Document Upload',
  'review': 'Review & Submit',
  'results': 'Results',
}

export const STEP_DESCRIPTIONS: Record<WizardStep, string> = {
  'identity': 'Tell us about your institution.',
  'institution-type': 'Classify your organization type.',
  'research-focus': 'Define your therapeutic areas and research priorities.',
  'locations': 'Where does your institution operate?',
  'people': 'Who are the key people in your organization?',
  'infrastructure': 'What facilities and equipment do you have?',
  'capabilities': 'Declare your institutional capabilities.',
  'evidence': 'Upload supporting documentation.',
  'review': 'Review everything before submitting.',
  'results': 'Your Capability Portfolio, Readiness, and Passport.',
}

export type InstitutionType =
  | 'Hospital'
  | 'Biobank'
  | 'Contract Research Organization (CRO)'
  | 'Laboratory'
  | 'Academic Medical Center'
  | 'Independent Research Site'
  | 'SMO'
  | 'Research Network'
  | 'Physician Practice / Clinic'
  | 'University'
  | 'Non-Profit Research Organization'
  | 'Other'

export const INSTITUTION_TYPE_OPTIONS: InstitutionType[] = [
  'Hospital',
  'Biobank',
  'Contract Research Organization (CRO)',
  'Laboratory',
  'Academic Medical Center',
  'Independent Research Site',
  'SMO',
  'Research Network',
  'Physician Practice / Clinic',
  'University',
  'Non-Profit Research Organization',
  'Other',
]

export type TherapeuticArea =
  | 'Oncology'
  | 'Cardiology'
  | 'Neurology'
  | 'Immunology'
  | 'Infectious Disease'
  | 'Rare Disease'
  | 'Endocrinology'
  | 'Gastroenterology'
  | 'Hematology'
  | 'Dermatology'
  | 'Psychiatry'
  | 'Ophthalmology'
  | 'Respiratory'
  | 'Musculoskeletal'
  | 'Nephrology'
  | 'Women\'s Health'
  | 'Pediatrics'
  | 'Geriatrics'
  | 'Genetics'
  | 'Vaccines'

export const THERAPEUTIC_AREA_OPTIONS: TherapeuticArea[] = [
  'Oncology',
  'Cardiology',
  'Neurology',
  'Immunology',
  'Infectious Disease',
  'Rare Disease',
  'Endocrinology',
  'Gastroenterology',
  'Hematology',
  'Dermatology',
  'Psychiatry',
  'Ophthalmology',
  'Respiratory',
  'Musculoskeletal',
  'Nephrology',
  "Women's Health",
  'Pediatrics',
  'Geriatrics',
  'Genetics',
  'Vaccines',
]

export type ResearchModality =
  | 'Clinical Trials (Phase I)'
  | 'Clinical Trials (Phase II)'
  | 'Clinical Trials (Phase III)'
  | 'Clinical Trials (Phase IV)'
  | 'Observational Studies'
  | 'Registry Studies'
  | 'Real-World Evidence'
  | 'Device Trials'
  | 'Diagnostic Studies'
  | 'Digital Therapeutics'
  | 'Decentralized / Hybrid Trials'
  | 'Basket / Umbrella Trials'

export const RESEARCH_MODALITY_OPTIONS: ResearchModality[] = [
  'Clinical Trials (Phase I)',
  'Clinical Trials (Phase II)',
  'Clinical Trials (Phase III)',
  'Clinical Trials (Phase IV)',
  'Observational Studies',
  'Registry Studies',
  'Real-World Evidence',
  'Device Trials',
  'Diagnostic Studies',
  'Digital Therapeutics',
  'Decentralized / Hybrid Trials',
  'Basket / Umbrella Trials',
]

export interface WizardLocation {
  id: string
  name: string
  type: string
  street: string
  city: string
  state: string
  country: string
  zip: string
  isPrimary: boolean
}

export interface WizardPerson {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isPI: boolean
  yearsExperience: number
  therapeuticExpertise: string[]
}

export interface WizardInfrastructure {
  id: string
  facilityType: string
  dedicatedResearchSpace: string
  laboratoryPresent: boolean
  labCertifications: string[]
  equipmentTypes: string[]
  backupPower: string
  temperatureMonitoring: string
  biospecimenOperations: string[]
  storageEquipment: string[]
}

export interface WizardCapability {
  id: string
  name: string
  description: string
  confidence: 'High' | 'Medium' | 'Low'
}

export interface WizardDocument {
  id: string
  label: string
  type: string
  fileName?: string
  fileSize?: number
  uploaded: boolean
}

export interface WizardDraft {
  version: number
  updatedAt: string

  // Step 1: Identity
  identity_name: string
  identity_description: string

  // Step 2: Institution Type
  institution_type: InstitutionType | ''

  // Step 3: Research Focus
  research_therapeuticAreas: TherapeuticArea[]
  research_modalities: ResearchModality[]
  research_description: string

  // Step 4: Locations
  locations: WizardLocation[]

  // Step 5: People
  people: WizardPerson[]

  // Step 6: Infrastructure
  infrastructure: WizardInfrastructure[]

  // Step 7: Capabilities
  capabilities: WizardCapability[]

  // Step 8: Evidence
  documents: WizardDocument[]

  // Meta
  currentStep: WizardStep
  submitted: boolean
  institutionId: string | null
}

export const EMPTY_DRAFT: WizardDraft = {
  version: 1,
  updatedAt: new Date().toISOString(),
  identity_name: '',
  identity_description: '',
  institution_type: '',
  research_therapeuticAreas: [],
  research_modalities: [],
  research_description: '',
  locations: [
    {
      id: 'loc-1',
      name: '',
      type: '',
      street: '',
      city: '',
      state: '',
      country: '',
      zip: '',
      isPrimary: true,
    },
  ],
  people: [],
  infrastructure: [],
  capabilities: [],
  documents: [],
  currentStep: 'identity',
  submitted: false,
  institutionId: null,
}
