// ==========================================================================
// IKM Content Sprint 1 — Organization Questionnaire
// ==========================================================================
// Production-ready questionnaire metadata. Every question creates downstream
// value for Sponsor Intelligence, Readiness, Capability Intelligence, or Compliance.
// No placeholder questions. No data collection for its own sake.
// ==========================================================================

import type {
  QuestionnaireDefinition, QuestionnaireSection, QuestionDefinition,
} from '../questionnaire-engine'
import { createQuestionnaireFromDomain, addQuestionsToSection } from '../questionnaire-engine'

// ==========================================================================
// SECTION 1: Organization Identity
// ==========================================================================

const SECTION_IDENTITY: QuestionnaireSection = {
  key: 'identity', title: 'Organization Identity',
  description: 'Basic information about your organization — name, type, and mission.',
  order: 0, standalone: true,
  questions: [
    {
      key: 'legal_name', label: 'Legal Organization Name', type: 'text', order: 0, repeatable: false,
      description: 'The official registered name of your institution as it appears on legal documents.',
      validation: { required: true, minLength: 2, maxLength: 200 },
      destination: { domain: 'organization', knowledgeItemKey: 'legal_name', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'dba_names', label: 'Other Names (DBA / Trade Names)', type: 'text', order: 1, repeatable: false,
      description: 'Any other names your institution operates under — Doing Business As names, trade names, or aliases.',
      validation: { required: false },
      destination: { domain: 'organization', knowledgeItemKey: 'dba_names', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'org_type', label: 'Organization Type', type: 'single_choice', order: 2, repeatable: false,
      description: 'Select the type that best describes your institution.',
      validation: { required: true },
      options: [
        { value: 'academic_medical_center', label: 'Academic Medical Center' },
        { value: 'community_hospital', label: 'Community Hospital' },
        { value: 'reference_lab', label: 'Reference / Central Laboratory' },
        { value: 'biobank', label: 'Biobank / Biospecimen Repository' },
        { value: 'cro', label: 'Contract Research Organization (CRO)' },
        { value: 'physician_practice', label: 'Physician Practice / Clinic' },
        { value: 'research_institute', label: 'Independent Research Institute' },
        { value: 'diagnostic_lab', label: 'Diagnostic Laboratory' },
        { value: 'pharma_site', label: 'Pharma / Biotech Research Site' },
        { value: 'government', label: 'Government / Public Health Facility' },
        { value: 'other', label: 'Other' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'organization_type', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'research_org_type', label: 'Research Organization Type', type: 'dropdown', order: 3, repeatable: false,
      description: 'How does your institution primarily function in research? Select all that apply.',
      validation: { required: true, minSelections: 1 },
      options: [
        { value: 'clinical_research_site', label: 'Clinical Research Site — conducts interventional trials' },
        { value: 'central_laboratory', label: 'Central Laboratory — provides lab services to studies' },
        { value: 'biorepository', label: 'Biorepository — stores and distributes biospecimens' },
        { value: 'specialty_lab', label: 'Specialty Laboratory — specialized testing or processing' },
        { value: 'processing_center', label: 'Processing Center — sample processing and aliquoting' },
        { value: 'recruitment_center', label: 'Recruitment Center — patient enrollment focused' },
        { value: 'data_center', label: 'Data / Imaging Center — data collection and analysis' },
        { value: 'coordinating_center', label: 'Coordinating Center — multi-site coordination' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'research_org_type', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'mission_statement', label: 'Mission Statement', type: 'textarea', order: 4, repeatable: false,
      description: 'Your institutional mission. What drives your research? Who do you serve?',
      validation: { required: false, maxLength: 2000 },
      destination: { domain: 'organization', knowledgeItemKey: 'mission_statement', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'founded_year', label: 'Year Founded', type: 'number', order: 5, repeatable: false,
      description: 'When was your institution or research program established?',
      validation: { required: false, min: 1800, max: 2030 },
      destination: { domain: 'organization', knowledgeItemKey: 'operational_since', entityType: 'historical_event', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'website', label: 'Website', type: 'text', order: 6, repeatable: false,
      description: 'Your primary institutional website URL.',
      validation: { required: false },
      destination: { domain: 'organization', knowledgeItemKey: 'website', entityType: 'asset', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'languages', label: 'Operating Languages', type: 'checklist', order: 7, repeatable: false,
      description: 'Languages in which your institution can conduct business and research. Important for sponsor matching with diverse populations.',
      validation: { required: false },
      options: [
        { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' }, { value: 'de', label: 'German' },
        { value: 'zh', label: 'Chinese (Mandarin)' }, { value: 'ja', label: 'Japanese' },
        { value: 'ko', label: 'Korean' }, { value: 'pt', label: 'Portuguese' },
        { value: 'ar', label: 'Arabic' }, { value: 'other', label: 'Other' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'languages', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
  ],
}

// ==========================================================================
// SECTION 2: Legal & Registration
// ==========================================================================

const SECTION_LEGAL: QuestionnaireSection = {
  key: 'legal', title: 'Legal & Registration',
  description: 'Legal entity information — required for compliance, contracts, and sponsor verification.',
  order: 1, standalone: true,
  questions: [
    {
      key: 'legal_entity_type', label: 'Legal Entity Type', type: 'single_choice', order: 0, repeatable: false,
      description: 'Your legal structure. Used by Compliance and Financial engines.',
      validation: { required: true },
      options: [
        { value: 'corporation', label: 'Corporation (For-Profit)' },
        { value: 'nonprofit', label: 'Non-Profit / 501(c)(3)' },
        { value: 'llc', label: 'LLC' },
        { value: 'government', label: 'Government Entity' },
        { value: 'academic', label: 'Academic Institution' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'sole_proprietor', label: 'Sole Proprietor' },
        { value: 'other', label: 'Other' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'legal_entity_type', entityType: 'regulatory', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true },
      answerSource: 'user',
    },
    {
      key: 'tax_id', label: 'Tax Identification Number (EIN)', type: 'text', order: 1, repeatable: false,
      description: 'Employer Identification Number or equivalent tax ID. Required for financial operations and sponsor contracts.',
      validation: { required: true },
      destination: { domain: 'organization', knowledgeItemKey: 'tax_id', entityType: 'regulatory', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true },
      answerSource: 'user',
    },
    {
      key: 'business_license_doc', label: 'Business License', type: 'document_upload', order: 2, repeatable: false,
      description: 'Upload your current business operating license. Required for Program Participation readiness.',
      validation: { required: true },
      destination: { domain: 'organization', knowledgeItemKey: 'business_license', entityType: 'certification', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true, documentType: 'certification' },
      answerSource: 'user',
    },
    {
      key: 'insurance_doc', label: 'Certificate of Insurance', type: 'document_upload', order: 3, repeatable: false,
      description: 'Professional liability or clinical trial insurance certificate. Required by most sponsors.',
      validation: { required: true },
      destination: { domain: 'organization', knowledgeItemKey: 'insurance', entityType: 'policy', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true, documentType: 'insurance' },
      answerSource: 'user',
    },
    {
      key: 'parent_org', label: 'Parent Organization', type: 'text', order: 4, repeatable: false,
      description: 'If your institution is part of a larger health system, university, or parent company, enter the name here.',
      validation: { required: false },
      destination: { domain: 'organization', knowledgeItemKey: 'parent_organization', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'ownership', label: 'Ownership Structure', type: 'single_choice', order: 5, repeatable: false,
      description: 'Helps sponsors understand your institutional context.',
      validation: { required: false },
      options: [
        { value: 'public', label: 'Publicly Traded' }, { value: 'private', label: 'Privately Held' },
        { value: 'physician_owned', label: 'Physician-Owned' }, { value: 'investor_backed', label: 'Investor-Backed' },
        { value: 'academic', label: 'Academic / University-Owned' }, { value: 'government', label: 'Government-Owned' },
        { value: 'nonprofit', label: 'Non-Profit' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'ownership_structure', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
  ],
}

// ==========================================================================
// SECTION 3: Locations
// ==========================================================================

const SECTION_LOCATIONS: QuestionnaireSection = {
  key: 'locations', title: 'Locations & Facilities',
  description: 'Where your institution operates. Critical for sponsor site selection and logistics.',
  order: 2, standalone: true,
  questions: [
    {
      key: 'primary_address', label: 'Primary Address', type: 'text', order: 0, repeatable: false,
      description: 'Main physical address — street, city, state, ZIP, country.',
      validation: { required: true },
      destination: { domain: 'organization', knowledgeItemKey: 'mailing_address', entityType: 'facility', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'has_multiple_locations', label: 'Does your institution operate at multiple physical locations?', type: 'boolean', order: 1, repeatable: false,
      description: 'Include satellite clinics, separate lab facilities, off-site storage.',
      validation: { required: true },
      destination: { domain: 'organization', knowledgeItemKey: null, entityType: null, relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'timezone', label: 'Primary Time Zone', type: 'single_choice', order: 2, repeatable: false,
      description: 'Your primary operating time zone. Important for sponsor coordination.',
      validation: { required: true },
      options: [
        { value: 'America/New_York', label: 'Eastern (ET)' }, { value: 'America/Chicago', label: 'Central (CT)' },
        { value: 'America/Denver', label: 'Mountain (MT)' }, { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
        { value: 'America/Anchorage', label: 'Alaska' }, { value: 'Pacific/Honolulu', label: 'Hawaii' },
        { value: 'Europe/London', label: 'GMT / UK' }, { value: 'Europe/Paris', label: 'Central European (CET)' },
        { value: 'Asia/Tokyo', label: 'Japan' }, { value: 'other', label: 'Other' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'time_zones', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'weekend_ops', label: 'Weekend Operations', type: 'boolean', order: 3, repeatable: false,
      description: 'Can your institution process samples or conduct study visits on weekends? A key differentiator for time-sensitive protocols.',
      validation: { required: true },
      destination: { domain: 'facilities', knowledgeItemKey: null, entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'emergency_power', label: 'Emergency / Backup Power', type: 'boolean', order: 4, repeatable: false,
      description: 'Do you have backup generators or UPS for critical equipment and storage? Required for sample integrity.',
      validation: { required: true },
      destination: { domain: 'facilities', knowledgeItemKey: 'emergency_power', entityType: 'equipment', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true },
      answerSource: 'user',
    },
  ],
}

// ==========================================================================
// SECTION 4: Contacts
// ==========================================================================

const SECTION_CONTACTS: QuestionnaireSection = {
  key: 'contacts', title: 'Key Contacts & Leadership',
  description: 'Who represents your institution? Sponsors and CROs need to know who to reach.',
  order: 3, standalone: true,
  questions: [
    {
      key: 'primary_contact_name', label: 'Primary Contact Name', type: 'text', order: 0, repeatable: false,
      description: 'Main point of contact for sponsor inquiries and program opportunities.',
      validation: { required: true },
      destination: { domain: 'organization', knowledgeItemKey: 'primary_contact', entityType: 'person', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'primary_contact_email', label: 'Primary Contact Email', type: 'text', order: 1, repeatable: false,
      description: 'Email address for the primary contact.',
      validation: { required: true },
      destination: { domain: 'organization', knowledgeItemKey: 'primary_contact', entityType: 'person', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false, customProperty: 'email' },
      answerSource: 'user',
    },
    {
      key: 'primary_contact_phone', label: 'Primary Contact Phone', type: 'text', order: 2, repeatable: false,
      description: 'Direct phone number for the primary contact.',
      validation: { required: false },
      destination: { domain: 'organization', knowledgeItemKey: 'primary_contact', entityType: 'person', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false, customProperty: 'phone' },
      answerSource: 'user',
    },
    {
      key: 'leadership_team', label: 'Leadership Team', type: 'repeating_section', order: 3, repeatable: true,
      description: 'Add key leadership: Medical Director, Lab Director, Quality Director, Research Director.',
      validation: { required: false },
      destination: { domain: 'organization', knowledgeItemKey: 'leadership_team', entityType: 'person', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true },
      answerSource: 'user',
      children: [
        { key: 'leader_name', label: 'Name', type: 'text', order: 0, repeatable: false, validation: { required: true }, destination: { domain: 'organization', knowledgeItemKey: null, entityType: 'person', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false } },
        { key: 'leader_role', label: 'Role / Title', type: 'single_choice', order: 1, repeatable: false, validation: { required: true }, options: [
          { value: 'ceo', label: 'CEO / Executive Director' }, { value: 'medical_director', label: 'Medical Director' },
          { value: 'lab_director', label: 'Laboratory Director' }, { value: 'quality_director', label: 'Quality Director' },
          { value: 'research_director', label: 'Research Director' }, { value: 'operations_director', label: 'Operations Director' },
          { value: 'regulatory_director', label: 'Regulatory Director' }, { value: 'other', label: 'Other' },
        ], destination: { domain: 'organization', knowledgeItemKey: null, entityType: null, relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false } },
        { key: 'leader_email', label: 'Email', type: 'text', order: 2, repeatable: false, validation: { required: true }, destination: { domain: 'organization', knowledgeItemKey: null, entityType: null, relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false, customProperty: 'email' } },
      ],
    },
  ],
}

// ==========================================================================
// SECTION 5: Research Profile
// ==========================================================================

const SECTION_RESEARCH: QuestionnaireSection = {
  key: 'research', title: 'Research Profile & Capabilities',
  description: 'What kind of research does your institution do? This directly feeds Sponsor Intelligence and Program Matching.',
  order: 4, standalone: true,
  questions: [
    {
      key: 'therapeutic_areas', label: 'Therapeutic Areas of Expertise', type: 'checklist', order: 0, repeatable: false,
      description: 'Select all therapeutic areas where you have research experience. This is the #1 filter sponsors use.',
      validation: { required: true, minSelections: 1 },
      options: [
        { value: 'oncology', label: 'Oncology' }, { value: 'cardiology', label: 'Cardiology / Cardiovascular' },
        { value: 'neurology', label: 'Neurology / CNS' }, { value: 'infectious_disease', label: 'Infectious Disease' },
        { value: 'rare_disease', label: 'Rare Disease' }, { value: 'immunology', label: 'Immunology / Autoimmune' },
        { value: 'endocrinology', label: 'Endocrinology / Metabolic' }, { value: 'respiratory', label: 'Respiratory / Pulmonary' },
        { value: 'gastroenterology', label: 'Gastroenterology' }, { value: 'dermatology', label: 'Dermatology' },
        { value: 'hematology', label: 'Hematology' }, { value: 'nephrology', label: 'Nephrology' },
        { value: 'ophthalmology', label: 'Ophthalmology' }, { value: 'psychiatry', label: 'Psychiatry / Mental Health' },
        { value: 'womens_health', label: "Women's Health / OB-GYN" }, { value: 'pediatrics', label: 'Pediatrics' },
        { value: 'geriatrics', label: 'Geriatrics / Aging' }, { value: 'pain', label: 'Pain Management' },
        { value: 'vaccines', label: 'Vaccines / Prevention' }, { value: 'other', label: 'Other' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'therapeutic_focus', entityType: 'capability', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'active_studies', label: 'Active Research Studies (approximate)', type: 'number', order: 1, repeatable: false,
      description: 'How many active studies are currently running at your institution? Approximate is fine.',
      validation: { required: false, min: 0 },
      destination: { domain: 'organization', knowledgeItemKey: 'research_profile', entityType: 'historical_event', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'studies_last_3_years', label: 'Studies Completed (Last 3 Years)', type: 'number', order: 2, repeatable: false,
      description: 'Approximate number of studies completed in the last 3 years. Shows operational track record.',
      validation: { required: false, min: 0 },
      destination: { domain: 'organization', knowledgeItemKey: 'research_profile', entityType: 'historical_event', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'patient_population_size', label: 'Patient Population Size', type: 'single_choice', order: 3, repeatable: false,
      description: 'Approximate size of the patient population you serve or can access for research.',
      validation: { required: false },
      options: [
        { value: 'lt_10k', label: '< 10,000' }, { value: '10k_50k', label: '10,000 - 50,000' },
        { value: '50k_100k', label: '50,000 - 100,000' }, { value: '100k_500k', label: '100,000 - 500,000' },
        { value: 'gt_500k', label: '> 500,000' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'patient_population', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'geographic_reach', label: 'Geographic Reach', type: 'checklist', order: 4, repeatable: false,
      description: 'Where can your institution conduct research?',
      validation: { required: false },
      options: [
        { value: 'local', label: 'Local / Single City' }, { value: 'regional', label: 'Regional / Multi-City' },
        { value: 'statewide', label: 'Statewide' }, { value: 'multi_state', label: 'Multi-State' },
        { value: 'national', label: 'National / Country-Wide' }, { value: 'international', label: 'International' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'geographic_coverage', entityType: 'other', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'service_portfolio', label: 'Research Services Offered', type: 'checklist', order: 5, repeatable: false,
      description: 'What research services does your institution provide? Select all that apply.',
      validation: { required: true, minSelections: 1 },
      options: [
        { value: 'patient_recruitment', label: 'Patient Recruitment & Enrollment' },
        { value: 'biospecimen_collection', label: 'Biospecimen Collection (blood, tissue, etc.)' },
        { value: 'sample_processing', label: 'Sample Processing (centrifugation, aliquoting, PBMC)' },
        { value: 'specialty_processing', label: 'Specialty Processing (DNA/RNA extraction, flow cytometry)' },
        { value: 'biobanking', label: 'Biobanking / Long-Term Storage' },
        { value: 'clinical_lab', label: 'Clinical Laboratory Testing' },
        { value: 'imaging', label: 'Medical Imaging (MRI, CT, PET, ultrasound)' },
        { value: 'infusion', label: 'Infusion / IP Administration' },
        { value: 'pharmacy', label: 'Investigational Pharmacy Services' },
        { value: 'regulatory', label: 'Regulatory Support (IRB, FDA submissions)' },
        { value: 'data_management', label: 'Data Management / EDC' },
        { value: 'shipping', label: 'Sample Shipping (domestic & international)' },
        { value: 'home_visits', label: 'Home Visits / Mobile Research' },
        { value: 'telemedicine', label: 'Telemedicine / Remote Visits' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'service_portfolio', entityType: 'capability', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
  ],
}

// ==========================================================================
// SECTION 6: Networks & Relationships
// ==========================================================================

const SECTION_NETWORKS: QuestionnaireSection = {
  key: 'networks', title: 'Networks & Affiliations',
  description: 'Connections that extend your institutional reach.',
  order: 5, standalone: true,
  questions: [
    {
      key: 'research_networks', label: 'Research Network Memberships', type: 'checklist', order: 0, repeatable: false,
      description: 'Are you a member of any research networks or consortia?',
      validation: { required: false },
      options: [
        { value: 'swog', label: 'SWOG' }, { value: 'ecog_acrin', label: 'ECOG-ACRIN' },
        { value: 'alliance', label: 'Alliance for Clinical Trials' }, { value: 'ncorp', label: 'NCORP' },
        { value: 'ctsu', label: 'CTSU' }, { value: 'curebase', label: 'Curebase' },
        { value: 'science37', label: 'Science 37' }, { value: 'reaction', label: 'Reaction / Decentralized Network' },
        { value: 'local_network', label: 'Local / Regional Research Network' },
        { value: 'none', label: 'None / Independent' }, { value: 'other', label: 'Other' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'networks', entityType: 'relationship', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true },
      answerSource: 'user',
    },
    {
      key: 'academic_affiliations', label: 'Academic Affiliations', type: 'text', order: 1, repeatable: false,
      description: 'University affiliations, teaching hospital status, or academic partnerships.',
      validation: { required: false },
      destination: { domain: 'organization', knowledgeItemKey: 'academic_affiliations', entityType: 'relationship', relationshipType: null, generatesDocument: true, generatesEvidenceCandidate: true },
      answerSource: 'user',
    },
    {
      key: 'sponsor_experience', label: 'Sponsors You Have Worked With', type: 'textarea', order: 2, repeatable: false,
      description: 'List pharmaceutical, biotech, or device companies you have conducted research for. Helps establish your track record.',
      validation: { required: false },
      destination: { domain: 'organization', knowledgeItemKey: 'sponsor_history', entityType: 'historical_event', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
  ],
}

// ==========================================================================
// SECTION 7: Growth & Strategy
// ==========================================================================

const SECTION_STRATEGY: QuestionnaireSection = {
  key: 'strategy', title: 'Growth & Strategic Direction',
  description: 'Where is your institution heading? Helps Kadarn recommend relevant programs.',
  order: 6, standalone: true,
  questions: [
    {
      key: 'growth_areas', label: 'Areas You Want to Grow', type: 'checklist', order: 0, repeatable: false,
      description: 'What capabilities or therapeutic areas are you looking to develop? Kadarn will recommend programs that match.',
      validation: { required: false },
      options: [
        { value: 'phase1', label: 'Phase I / Early Phase Capability' },
        { value: 'pbmc', label: 'PBMC / Specialty Processing' },
        { value: 'biobanking', label: 'Biobanking / Repository Services' },
        { value: 'ivd', label: 'IVD / Diagnostic Validation' },
        { value: 'genomics', label: 'Genomics / Molecular Testing' },
        { value: 'imaging', label: 'Imaging Services' },
        { value: 'decentralized', label: 'Decentralized / Hybrid Trials' },
        { value: 'cell_gene', label: 'Cell & Gene Therapy' },
        { value: 'rwe', label: 'Real World Evidence' },
        { value: 'rare_disease', label: 'Rare Disease Programs' },
        { value: 'pediatrics', label: 'Pediatric Research' },
        { value: 'global', label: 'International / Multi-Country Studies' },
      ],
      destination: { domain: 'organization', knowledgeItemKey: 'growth_plans', entityType: 'goal', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
    {
      key: 'strategic_priorities', label: 'Strategic Priorities (Next 12 Months)', type: 'textarea', order: 1, repeatable: false,
      description: 'What are your top 2-3 strategic priorities for research operations in the coming year?',
      validation: { required: false, maxLength: 1000 },
      destination: { domain: 'organization', knowledgeItemKey: 'strategic_objectives', entityType: 'goal', relationshipType: null, generatesDocument: false, generatesEvidenceCandidate: false },
      answerSource: 'user',
    },
  ],
}

// ==========================================================================
// BUILD THE COMPLETE QUESTIONNAIRE
// ==========================================================================

export function buildOrganizationQuestionnaire(): QuestionnaireDefinition {
  const def = createQuestionnaireFromDomain({
    id: 'org-onboarding-v1',
    title: 'Organization Profile',
    description: 'Build your institutional profile. This information powers your readiness assessments, sponsor discovery, and program matching. Estimated completion: 20-30 minutes.',
    domain: 'organization',
    type: 'organization_onboarding',
    sections: [
      { key: SECTION_IDENTITY.key, title: SECTION_IDENTITY.title, description: SECTION_IDENTITY.description, order: SECTION_IDENTITY.order, standalone: SECTION_IDENTITY.standalone },
      { key: SECTION_LEGAL.key, title: SECTION_LEGAL.title, description: SECTION_LEGAL.description, order: SECTION_LEGAL.order, standalone: SECTION_LEGAL.standalone },
      { key: SECTION_LOCATIONS.key, title: SECTION_LOCATIONS.title, description: SECTION_LOCATIONS.description, order: SECTION_LOCATIONS.order, standalone: SECTION_LOCATIONS.standalone },
      { key: SECTION_CONTACTS.key, title: SECTION_CONTACTS.title, description: SECTION_CONTACTS.description, order: SECTION_CONTACTS.order, standalone: SECTION_CONTACTS.standalone },
      { key: SECTION_RESEARCH.key, title: SECTION_RESEARCH.title, description: SECTION_RESEARCH.description, order: SECTION_RESEARCH.order, standalone: SECTION_RESEARCH.standalone },
      { key: SECTION_NETWORKS.key, title: SECTION_NETWORKS.title, description: SECTION_NETWORKS.description, order: SECTION_NETWORKS.order, standalone: SECTION_NETWORKS.standalone },
      { key: SECTION_STRATEGY.key, title: SECTION_STRATEGY.title, description: SECTION_STRATEGY.description, order: SECTION_STRATEGY.order, standalone: SECTION_STRATEGY.standalone },
    ],
  })

  // Inject all questions into their sections
  for (const section of [SECTION_IDENTITY, SECTION_LEGAL, SECTION_LOCATIONS, SECTION_CONTACTS, SECTION_RESEARCH, SECTION_NETWORKS, SECTION_STRATEGY]) {
    addQuestionsToSection(def, section.key, section.questions)
  }

  return def
}

// ==========================================================================
// PRODUCTION QUESTIONNAIRE INSTANCE
// ==========================================================================

export const ORGANIZATION_QUESTIONNAIRE = buildOrganizationQuestionnaire()

// ==========================================================================
// QUESTIONNAIRE STATS
// ==========================================================================

export const ORGANIZATION_QUESTIONNAIRE_STATS = {
  totalSections: ORGANIZATION_QUESTIONNAIRE.sections.length,
  totalQuestions: ORGANIZATION_QUESTIONNAIRE.sections.reduce((sum, s) => sum + s.questions.length, 0),
  requiredQuestions: ORGANIZATION_QUESTIONNAIRE.sections.reduce(
    (sum, s) => sum + s.questions.filter((q) => q.validation?.required).length, 0
  ),
  documentQuestions: ORGANIZATION_QUESTIONNAIRE.sections.reduce(
    (sum, s) => sum + s.questions.filter((q) => q.type === 'document_upload').length, 0
  ),
  sections: ORGANIZATION_QUESTIONNAIRE.sections.map((s) => ({
    key: s.key,
    title: s.title,
    questions: s.questions.length,
    required: s.questions.filter((q) => q.validation?.required).length,
  })),
  downstreamValue: {
    enginesFed: ['Sponsor Intelligence', 'Capability Intelligence', 'Program Matching', 'Readiness', 'Compliance', 'Financial'],
    knowledgeItemsPopulated: ORGANIZATION_QUESTIONNAIRE.sections.flatMap((s) =>
      s.questions.filter((q) => q.destination.knowledgeItemKey).map((q) => q.destination.knowledgeItemKey)
    ).filter((v, i, a) => v && a.indexOf(v) === i),
  },
}
