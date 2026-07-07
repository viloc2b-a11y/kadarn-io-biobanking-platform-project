// ==========================================================================
// Knowledge Domains — Types (IKM/EVM Sprint 4)
// ==========================================================================

import type { KnowledgeItem, KnowledgeItemType } from './types'

export type KnowledgeDomainId =
  | 'organization' | 'people' | 'facilities' | 'equipment'
  | 'laboratory' | 'regulatory' | 'quality' | 'programs'
  | 'research_experience' | 'biospecimen_operations' | 'technology'
  | 'community' | 'documents' | 'custom'

export interface KnowledgeDomain {
  id: KnowledgeDomainId
  name: string
  description: string
  knowledgeItems: KnowledgeItem[]
  requiredItems: DomainRequiredItem[]
  missingItems: DomainRequiredItem[]
  progress: DomainProgress
  assessedAt: string
}

export interface DomainRequiredItem {
  label: string
  description: string
  itemType: KnowledgeItemType
  fulfilled: boolean
  fulfilledById?: string
}

export interface DomainProgress {
  knowledgeCoverage: number
  documentCoverage: number
  averageMaturity: number
  evidenceCoverage: number
  completeness: KnowledgeCompleteness
  missingDocs: number
  expiringDocs: number
  expiredDocs: number
  totalItems: number
  itemsWithDocs: number
  nextBestActions: string[]
}

export type KnowledgeCompleteness =
  | 'not_started' | 'started' | 'partially_documented'
  | 'well_documented' | 'nearly_complete' | 'complete'

export interface InstitutionDashboardState {
  organizationId: string
  institutionMemory: { totalItems: number; totalDomains: number; domainsCompleted: number; byType: Record<string, number> }
  domainCompletion: DomainCompletionEntry[]
  evidenceMaturity: { byLevel: Record<string, number>; averageMaturity: number; itemsAboveEM3: number; itemsBelowEM2: number }
  documentStatus: { total: number; expiring: number; expired: number; missing: number }
  knowledgeHealth: { orphans: number; isolates: number; duplicates: number; readyForEvidence: number }
  recentChanges: { itemId: string; statement: string; change: string; changedAt: string }[]
  upcomingExpirations: { documentId: string; documentName: string; expirationDate: string; daysUntil: number }[]
  recommendedActions: string[]
  generatedAt: string
}

export interface DomainCompletionEntry {
  domainId: KnowledgeDomainId
  name: string
  completeness: KnowledgeCompleteness
  coverage: number
  maturity: number
  itemCount: number
}

export const KNOWLEDGE_DOMAIN_CATALOG: Array<{
  id: KnowledgeDomainId; name: string; description: string
  requiredItems: Omit<DomainRequiredItem, 'fulfilled' | 'fulfilledById'>[]
}> = [
  { id: 'organization', name: 'Organization', description: 'Institutional identity, structure, and governance', requiredItems: [
    { label: 'Legal Name', description: 'Official registered name', itemType: 'other' },
    { label: 'Organization Type', description: 'Academic Medical Center, Hospital, Lab, Biobank...', itemType: 'other' },
    { label: 'Physical Locations', description: 'All physical sites where the institution operates', itemType: 'facility' },
    { label: 'Business License', description: 'Current business operating license', itemType: 'certification' },
    { label: 'Tax Identification', description: 'EIN or equivalent', itemType: 'regulatory' },
    { label: 'Insurance Coverage', description: 'Liability or clinical trial insurance', itemType: 'policy' },
    { label: 'Primary Contact', description: 'Main point of contact', itemType: 'person' },
  ]},
  { id: 'people', name: 'People', description: 'Personnel, qualifications, and training', requiredItems: [
    { label: 'Key personnel list', description: 'Director, managers, key staff', itemType: 'person' },
  ]},
  { id: 'facilities', name: 'Facilities', description: 'Physical locations, labs, storage', requiredItems: [
    { label: 'Primary facility', description: 'Main laboratory or clinical site', itemType: 'facility' },
  ]},
  { id: 'equipment', name: 'Equipment', description: 'Instruments, devices, maintenance', requiredItems: [
    { label: 'Equipment inventory', description: 'List of major equipment', itemType: 'equipment' },
  ]},
  { id: 'laboratory', name: 'Laboratory', description: 'Lab operations, certifications, QC', requiredItems: [
    { label: 'Lab certification', description: 'CLIA, CAP, or ISO 15189', itemType: 'certification' },
  ]},
  { id: 'regulatory', name: 'Regulatory', description: 'Compliance, IRB, submissions', requiredItems: [
    { label: 'IRB registration', description: 'Active IRB or reliance agreement', itemType: 'regulatory' },
  ]},
  { id: 'quality', name: 'Quality', description: 'QMS, audits, CAPA', requiredItems: [
    { label: 'QMS documentation', description: 'Quality manual or ISO 9001', itemType: 'quality' },
  ]},
  { id: 'programs', name: 'Programs', description: 'Active and historical research programs', requiredItems: [
    { label: 'Current programs', description: 'Active research programs', itemType: 'capability' },
  ]},
  { id: 'research_experience', name: 'Research Experience', description: 'Publications, studies, output', requiredItems: [
    { label: 'Publication list', description: 'Relevant publications', itemType: 'historical_event' },
  ]},
  { id: 'biospecimen_operations', name: 'Biospecimen Operations', description: 'Collection, processing, storage', requiredItems: [
    { label: 'Collection SOPs', description: 'Sample collection procedures', itemType: 'process' },
  ]},
  { id: 'technology', name: 'Technology', description: 'IT systems, LIMS, data', requiredItems: [
    { label: 'LIMS/IT systems', description: 'Lab information systems', itemType: 'asset' },
  ]},
  { id: 'community', name: 'Community', description: 'Patient population, engagement', requiredItems: [
    { label: 'Population served', description: 'Demographics and reach', itemType: 'other' },
  ]},
  { id: 'documents', name: 'Documents', description: 'Document inventory', requiredItems: [
    { label: 'Document index', description: 'Master list of controlled documents', itemType: 'other' },
  ]},
  { id: 'custom', name: 'Custom', description: 'Institution-specific domain', requiredItems: [] },
]
