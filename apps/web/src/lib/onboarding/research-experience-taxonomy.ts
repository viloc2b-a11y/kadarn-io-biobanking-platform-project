export interface ResearchExperienceDomainGroup {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly options: readonly string[]
}

export const THERAPEUTIC_AREA_GROUPS = [
  {
    id: 'clinical-therapeutic-areas',
    label: 'Clinical Therapeutic Areas',
    description: 'Disease areas and clinical specialties where the institution has research experience.',
    options: [
      'Oncology',
      'Cardiology',
      'Neurology',
      'Infectious Disease',
      'Rare Disease',
      'Immunology',
      'Endocrinology',
      'Respiratory',
      'Gastroenterology',
      'Dermatology',
      'Hematology',
      'Nephrology',
      'Ophthalmology',
      'Psychiatry',
      "Women's Health",
      'Pediatrics',
      'Geriatrics',
      'Pain Management',
      'Vaccines',
      'Transplantation',
      'Cell & Gene Therapy',
      'Precision Medicine',
      'Medical Devices',
      'Diagnostics / IVD',
      'Other',
    ],
  },
  {
    id: 'metabolic-chronic-disease',
    label: 'Metabolic & Chronic Disease',
    description: 'Long-term metabolic, cardiovascular risk, and chronic disease programs.',
    options: ['Obesity', 'Diabetes', 'Metabolic Disorders', 'Lipid Disorders', 'Hypertension'],
  },
  {
    id: 'autoimmune-inflammatory',
    label: 'Autoimmune & Inflammatory',
    description: 'Immune-mediated and inflammatory research areas.',
    options: ['Rheumatology', 'Autoimmune Diseases', 'Allergy', 'Inflammatory Disorders'],
  },
  {
    id: 'womens-reproductive-health',
    label: "Women's & Reproductive Health",
    description: 'Women-focused, reproductive, and maternal health research.',
    options: ['Maternal Health', 'Fertility', 'Gynecology', 'Menopause', 'Contraception'],
  },
  {
    id: 'mens-health',
    label: "Men's Health",
    description: 'Male health and urology-focused research areas.',
    options: ['Urology', 'Prostate Disease', 'Sexual Health'],
  },
  {
    id: 'mental-behavioral-health',
    label: 'Mental & Behavioral Health',
    description: 'Behavioral, cognitive, and neurodegenerative research areas.',
    options: ['Addiction Medicine', 'Behavioral Health', 'Cognitive Disorders', "Alzheimer's Disease", 'Dementia'],
  },
  {
    id: 'special-programs',
    label: 'Special Programs',
    description: 'Specialty institutional programs that may support research operations.',
    options: ['Emergency Medicine Research', 'Critical Care', 'Surgery', 'Rehabilitation', 'Sports Medicine', 'Nutrition', 'Sleep Medicine'],
  },
] as const satisfies readonly ResearchExperienceDomainGroup[]

export const RESEARCH_MODALITY_GROUPS = [
  {
    id: 'population-community-research',
    label: 'Population & Community Research',
    description: 'Community, public health, and population-level research experience.',
    options: ['Public Health', 'Community Health', 'Health Equity', 'Minority Health', 'Rural Health', 'Epidemiology'],
  },
  {
    id: 'biospecimen-programs',
    label: 'Biospecimen Programs',
    description: 'Collection, processing, logistics, and longitudinal specimen programs.',
    options: ['Biospecimen Collection', 'Biobanking', 'Sample Processing', 'Sample Logistics', 'Longitudinal Collections'],
  },
  {
    id: 'laboratory-research',
    label: 'Laboratory Research',
    description: 'Laboratory science and assay-development research experience.',
    options: ['Clinical Laboratory Research', 'Biomarker Research', 'Molecular Diagnostics', 'Genomics', 'Proteomics', 'Microbiology', 'Pathology'],
  },
  {
    id: 'diagnostics-device-research',
    label: 'Diagnostics & Device Research',
    description: 'Device, diagnostic, monitoring, and imaging research modalities.',
    options: ['Companion Diagnostics', 'Digital Diagnostics', 'Wearables', 'Digital Health', 'Remote Monitoring', 'Imaging', 'Point-of-Care Testing'],
  },
  {
    id: 'non-interventional-research',
    label: 'Non-Interventional Research',
    description: 'Research that does not require a traditional drug trial intervention.',
    options: ['Observational Studies', 'Registries', 'Natural History Studies', 'Chart Review Studies', 'Real World Evidence', 'Outcomes Research', 'Health Services Research'],
  },
  {
    id: 'early-development',
    label: 'Early Development',
    description: 'Early clinical development and human pharmacology capabilities.',
    options: ['Phase I', 'First-in-Human', 'PK/PD Studies', 'Bioavailability', 'Bioequivalence'],
  },
  {
    id: 'clinical-operations',
    label: 'Clinical Operations',
    description: 'Operational models the institution knows how to execute.',
    options: ['Phase II-IV Clinical Trials', 'Decentralized Clinical Trials', 'Hybrid Trials', 'Home Health', 'Mobile Research', 'Telemedicine Research', 'Community-Based Research', 'Other'],
  },
  {
    id: 'academic-investigator-research',
    label: 'Academic & Investigator Research',
    description: 'Investigator-led, academic, and grant-funded research experience.',
    options: ['Investigator-Initiated Studies', 'Federally Funded Research', 'Foundation Research', 'Academic Collaborations'],
  },
] as const satisfies readonly ResearchExperienceDomainGroup[]

export const RESEARCH_EXPERIENCE_TAXONOMY = {
  therapeuticAreas: THERAPEUTIC_AREA_GROUPS,
  researchModalities: RESEARCH_MODALITY_GROUPS,
} as const
