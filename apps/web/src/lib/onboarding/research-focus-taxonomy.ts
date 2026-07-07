export interface ResearchFocusOption {
  readonly value: string
  readonly description: string
}

export interface ResearchFocusGroup {
  readonly id: string
  readonly label: string
  readonly options: readonly ResearchFocusOption[]
}

export const RESEARCH_FOCUS_GROUPS = [
  {
    id: 'current-operational-roles',
    label: 'Core Research Operations',
    options: [
      { value: 'Clinical Research Site', description: 'Interventional clinical trials' },
      { value: 'Central Laboratory', description: 'Laboratory services supporting studies' },
      { value: 'Biorepository', description: 'Long-term biospecimen storage and distribution' },
      { value: 'Specialty Laboratory', description: 'Specialized testing and analysis' },
      { value: 'Processing Center', description: 'Sample processing, aliquoting, and shipping' },
      { value: 'Recruitment Center', description: 'Patient identification and enrollment' },
      { value: 'Data / Imaging Center', description: 'Data management, imaging, and centralized analysis' },
      { value: 'Coordinating Center', description: 'Multi-site study coordination' },
    ],
  },
  {
    id: 'clinical-research-programs',
    label: 'Clinical Research Programs',
    options: [
      { value: 'Early Phase Unit', description: 'Phase I / First-in-Human research' },
      { value: 'Phase II-IV Clinical Research', description: 'Later phase interventional clinical research' },
      { value: 'Decentralized Clinical Trials', description: 'Remote or distributed clinical trial execution' },
      { value: 'Hybrid Clinical Trials', description: 'Combined site-based and remote research model' },
      { value: 'Investigator-Initiated Research', description: 'Investigator-led study programs' },
      { value: 'Academic Research Programs', description: 'Academic and institution-led research programs' },
    ],
  },
  {
    id: 'biospecimen-programs',
    label: 'Biospecimen Programs',
    options: [
      { value: 'Prospective Biospecimen Collection', description: 'Forward-looking collection from consented participants' },
      { value: 'Retrospective Biospecimen Collection', description: 'Use of existing specimens or archived collections' },
      { value: 'Longitudinal Biospecimen Programs', description: 'Repeat collection over time' },
      { value: 'Healthy Volunteer Collections', description: 'Collections from healthy volunteers' },
      { value: 'Disease-Specific Collections', description: 'Collections focused on specific diseases or cohorts' },
      { value: 'Population Biobanking', description: 'Population-scale biospecimen programs' },
    ],
  },
  {
    id: 'diagnostics-ivd',
    label: 'Diagnostics / IVD',
    options: [
      { value: 'IVD Clinical Performance Studies', description: 'Clinical performance studies for in vitro diagnostics' },
      { value: 'Diagnostic Validation Studies', description: 'Validation of diagnostic tests or workflows' },
      { value: 'Companion Diagnostics', description: 'Diagnostics linked to therapeutic selection or response' },
      { value: 'Biomarker Development', description: 'Discovery or validation of biomarkers' },
      { value: 'Molecular Diagnostics', description: 'Molecular testing and diagnostic research' },
      { value: 'Point-of-Care Diagnostics', description: 'Point-of-care testing and validation' },
    ],
  },
  {
    id: 'non-interventional-research',
    label: 'Non-Interventional Research',
    options: [
      { value: 'Observational Studies', description: 'Prospective or retrospective non-interventional studies' },
      { value: 'Registries', description: 'Disease, device, treatment, or population registries' },
      { value: 'Natural History Studies', description: 'Disease progression and baseline natural history research' },
      { value: 'Chart Review Studies', description: 'Medical record and retrospective data studies' },
      { value: 'Real World Evidence (RWE)', description: 'Research using real-world data sources' },
      { value: 'Outcomes Research', description: 'Patient, clinical, economic, or operational outcomes research' },
      { value: 'Epidemiology', description: 'Population-level patterns, risks, and outcomes' },
    ],
  },
  {
    id: 'community-population-research',
    label: 'Community & Population Research',
    options: [
      { value: 'Community-Based Research', description: 'Research embedded in community settings' },
      { value: 'Public Health Programs', description: 'Public health research and implementation programs' },
      { value: 'Population Screening', description: 'Screening programs across defined populations' },
      { value: 'Minority Health Research', description: 'Research focused on minority and underserved populations' },
      { value: 'Rural Health Programs', description: 'Rural health research and access programs' },
      { value: 'Preventive Medicine', description: 'Prevention-focused research and programs' },
    ],
  },
  {
    id: 'translational-laboratory-research',
    label: 'Translational & Laboratory Research',
    options: [
      { value: 'Translational Research', description: 'Research connecting discovery, clinical evidence, and practice' },
      { value: 'Biomarker Research', description: 'Biomarker discovery, validation, or implementation' },
      { value: 'Genomics', description: 'Genomic research programs' },
      { value: 'Proteomics', description: 'Proteomic research programs' },
      { value: 'Precision Medicine', description: 'Precision medicine research and implementation' },
      { value: 'Cell & Gene Therapy Support', description: 'Operational or lab support for cell and gene therapy programs' },
    ],
  },
  {
    id: 'digital-technology-research',
    label: 'Digital & Technology Research',
    options: [
      { value: 'Digital Health Studies', description: 'Digital interventions, apps, or technology-enabled studies' },
      { value: 'Remote Monitoring Programs', description: 'Remote patient monitoring research programs' },
      { value: 'Wearable Device Studies', description: 'Wearable sensor or device research' },
      { value: 'AI / Clinical Decision Support Validation', description: 'Validation of AI or clinical decision support tools' },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    options: [
      { value: 'Other', description: 'Research focus not listed above' },
    ],
  },
] as const satisfies readonly ResearchFocusGroup[]
