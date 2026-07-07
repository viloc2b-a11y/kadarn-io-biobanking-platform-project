export const RESEARCH_LEADERSHIP_OPTIONS = [
  'Medical Director',
  'Scientific Director',
  'Research Director',
  'Principal Investigator',
  'Other',
] as const

export const PROFESSIONAL_CREDENTIAL_OPTIONS = [
  'MD',
  'DO',
  'PhD',
  'NP',
  'PA',
  'RN',
  'PharmD',
  'MPH',
  'MS',
  'Other',
] as const

export const RESEARCH_ROLE_OPTIONS = [
  'Principal Investigator',
  'Medical Director',
  'Sub-Investigator',
  'Research Physician',
  'Research Nurse',
  'Clinical Research Coordinator',
  'Regulatory Specialist',
  'Laboratory Director',
  'Laboratory Manager',
  'Pharmacist',
  'Recruitment Specialist',
  'Quality Manager',
  'Data Manager',
  'Project Manager',
  'Operations Manager',
  'Executive Leadership',
  'Other',
] as const

export const EMPLOYMENT_STATUS_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Affiliate',
  'Partner',
  'Other',
] as const

export const TEAM_LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'Mandarin',
  'Arabic',
  'German',
  'Japanese',
  'Korean',
  'Other',
] as const

export const PHASE_EXPERIENCE_OPTIONS = [
  'Early Phase',
  'Phase I',
  'Phase II',
  'Phase III',
  'Phase IV',
  'Device studies',
  'IVD experience',
  'Biospecimen experience',
  'Observational',
  'Registries',
  'Community research',
] as const

export const CERTIFICATION_TYPE_OPTIONS = [
  'GCP (Good Clinical Practice)',
  'Human Subjects Protection (HSP)',
  'IATA Dangerous Goods',
  'SOCRA',
  'ACRP',
  'NIH Human Subjects',
  'ACLS',
  'BLS',
  'PALS',
  'NRP',
  'Phlebotomy',
  'CLIA Training',
  'Biosafety',
  'Specimen Processing',
  'Chain of Custody',
  'Medical Board Certification',
  'DEA Registration',
  'State Medical License',
  'Nursing License',
  'Pharmacy License',
  'HIPAA',
  'OSHA',
  'CAPA',
  'Quality Systems',
  'Other',
] as const

export const CERTIFICATION_STATUS_OPTIONS = [
  'Active',
  'Expiring Soon',
  'Expired',
  'Pending',
  'Not Applicable',
] as const

export interface StaffCertification {
  id: string
  type: string
  certificationNumber: string
  issuingOrganization: string
  issueDate: string
  expirationDate: string
  currentStatus: string
}

export interface ResearchTeamMember {
  id: string
  firstName: string
  lastName: string
  credentials: string
  primaryRole: string
  email: string
  phone: string
  primaryLocationId: string
  languages: string[]
  employmentStatus: string
  researchRoles: string[]
  isPrincipalInvestigator: boolean
  therapeuticExpertise: string[]
  yearsExperience: string
  completedStudies: string
  currentStudies: string
  phaseExperience: string[]
  certifications: StaffCertification[]
}

export function createStaffCertification(index: number): StaffCertification {
  return {
    id: `certification-${Date.now()}-${index}`,
    type: '',
    certificationNumber: '',
    issuingOrganization: '',
    issueDate: '',
    expirationDate: '',
    currentStatus: 'Active',
  }
}

export function createResearchTeamMember(index: number): ResearchTeamMember {
  return {
    id: index === 0 ? 'team-member-primary' : `team-member-${Date.now()}-${index}`,
    firstName: '',
    lastName: '',
    credentials: '',
    primaryRole: index === 0 ? 'Principal Investigator' : '',
    email: '',
    phone: '',
    primaryLocationId: '',
    languages: [],
    employmentStatus: '',
    researchRoles: index === 0 ? ['Principal Investigator'] : [],
    isPrincipalInvestigator: index === 0,
    therapeuticExpertise: [],
    yearsExperience: '',
    completedStudies: '',
    currentStudies: '',
    phaseExperience: [],
    certifications: [],
  }
}

export function normalizeResearchTeamMembers(members: ResearchTeamMember[]): ResearchTeamMember[] {
  const normalized = members.map((member) => ({
    ...member,
    certifications: Array.isArray(member.certifications) ? member.certifications : [],
  }))

  return normalized.length > 0 ? normalized : [createResearchTeamMember(0)]
}
