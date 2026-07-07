// ==========================================================================
// IKM Domain Sprint 1 — Organization Domain
// ==========================================================================
// Models everything an institution can know about itself regarding its
// organizational identity. Exhaustive, not generic.
// ==========================================================================

import type { KnowledgeItemType } from '../types'

// ==========================================================================
// Organization Knowledge Items Catalog
// ==========================================================================

export interface OrganizationKnowledgeItem {
  /** Unique key for this knowledge item within the organization domain */
  key: string
  /** Business meaning — what this represents */
  label: string
  /** Longer description */
  description: string
  /** Knowledge item type */
  itemType: KnowledgeItemType
  /** Is this required for a complete organization profile? */
  required: boolean
  /** Can this change over time? (historical tracking) */
  historical: boolean
  /** Should this be supported by a document? */
  documentSupported: boolean
  /** Can supporting documents expire? */
  documentExpires: boolean
  /** Does this generate evidence candidates? */
  generatesCandidates: boolean
  /** What downstream engines consume this? */
  consumedBy: string[]
  /** What future capabilities does this enable? */
  enablesCapabilities: string[]
  /** Suggested related entity types */
  relatedTo: KnowledgeItemType[]
}

// ==========================================================================
// IDENTITY
// ==========================================================================

export const ORGANIZATION_IDENTITY: OrganizationKnowledgeItem[] = [
  {
    key: 'legal_name',
    label: 'Legal Name',
    description: 'Official registered name of the institution',
    itemType: 'other', required: true, historical: false,
    documentSupported: true, documentExpires: false,
    generatesCandidates: true,
    consumedBy: ['Sponsor Intelligence', 'Readiness'],
    enablesCapabilities: ['Program Participation'],
    relatedTo: [],
  },
  {
    key: 'dba_names',
    label: 'DBA / Trade Names',
    description: 'Doing Business As names, aliases, or trade names used by the institution',
    itemType: 'other', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: [],
    relatedTo: [],
  },
  {
    key: 'organization_type',
    label: 'Organization Type',
    description: 'Academic Medical Center, Community Hospital, Reference Lab, Biobank, CRO, Physician Practice, etc.',
    itemType: 'other', required: true, historical: false,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Marketplace'],
    enablesCapabilities: ['Program Matching'],
    relatedTo: [],
  },
  {
    key: 'research_org_type',
    label: 'Research Organization Type',
    description: 'Clinical Research Site, Central Laboratory, Biorepository, Specialty Lab, etc.',
    itemType: 'other', required: true, historical: false,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Program Matching'],
    enablesCapabilities: ['Program Type Eligibility'],
    relatedTo: [],
  },
  {
    key: 'mission_statement',
    label: 'Mission Statement',
    description: 'Institutional mission, core purpose, and values',
    itemType: 'other', required: false, historical: true,
    documentSupported: true, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: [],
    relatedTo: [],
  },
  {
    key: 'vision_statement',
    label: 'Vision Statement',
    description: 'Long-term vision and strategic direction',
    itemType: 'goal', required: false, historical: true,
    documentSupported: true, documentExpires: false,
    generatesCandidates: false,
    consumedBy: [],
    enablesCapabilities: [],
    relatedTo: [],
  },
  {
    key: 'website',
    label: 'Website',
    description: 'Primary institutional website URL',
    itemType: 'asset', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: [],
    relatedTo: [],
  },
  {
    key: 'languages',
    label: 'Languages Supported',
    description: 'Languages in which the institution can conduct business and research',
    itemType: 'other', required: false, historical: false,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Program Matching'],
    enablesCapabilities: ['Patient Population Access'],
    relatedTo: ['person'],
  },
]

// ==========================================================================
// LEGAL & STRUCTURE
// ==========================================================================

export const ORGANIZATION_LEGAL: OrganizationKnowledgeItem[] = [
  {
    key: 'legal_entity_type',
    label: 'Legal Entity Type',
    description: 'LLC, Corporation, Non-Profit, Government Entity, Academic Institution, etc.',
    itemType: 'regulatory', required: true, historical: false,
    documentSupported: true, documentExpires: false,
    generatesCandidates: true,
    consumedBy: ['Compliance'],
    enablesCapabilities: ['Program Participation'],
    relatedTo: [],
  },
  {
    key: 'tax_id',
    label: 'Tax Identification',
    description: 'EIN, Tax ID, or equivalent depending on jurisdiction',
    itemType: 'regulatory', required: true, historical: false,
    documentSupported: true, documentExpires: false,
    generatesCandidates: true,
    consumedBy: ['Financial Engine'],
    enablesCapabilities: ['Financial Operations'],
    relatedTo: [],
  },
  {
    key: 'parent_organization',
    label: 'Parent Organization',
    description: 'Parent company, health system, or university if applicable',
    itemType: 'other', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: [],
    relatedTo: [],
  },
  {
    key: 'affiliates',
    label: 'Affiliated Organizations',
    description: 'Sister organizations, network members, affiliated clinics or labs',
    itemType: 'relationship', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Network'],
    enablesCapabilities: ['Network Participation'],
    relatedTo: [],
  },
  {
    key: 'ownership_structure',
    label: 'Ownership Structure',
    description: 'Public, private, physician-owned, investor-backed, government, academic',
    itemType: 'other', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: [],
    relatedTo: [],
  },
]

// ==========================================================================
// LOCATIONS
// ==========================================================================

export const ORGANIZATION_LOCATIONS: OrganizationKnowledgeItem[] = [
  {
    key: 'physical_locations',
    label: 'Physical Locations',
    description: 'All physical sites where the institution operates — labs, clinics, offices, storage',
    itemType: 'facility', required: true, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'],
    enablesCapabilities: ['Geographic Coverage', 'Multi-Site Programs'],
    relatedTo: ['equipment', 'person'],
  },
  {
    key: 'service_locations',
    label: 'Service Locations',
    description: 'Locations where the institution provides services (may differ from physical locations)',
    itemType: 'facility', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: ['Service Coverage'],
    relatedTo: [],
  },
  {
    key: 'mailing_address',
    label: 'Mailing Address',
    description: 'Primary mailing and correspondence address',
    itemType: 'facility', required: true, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Compliance', 'Financial Engine'],
    enablesCapabilities: [],
    relatedTo: [],
  },
  {
    key: 'time_zones',
    label: 'Time Zones',
    description: 'Time zones in which the institution operates',
    itemType: 'other', required: false, historical: false,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: ['Multi-Region Operations'],
    relatedTo: [],
  },
  {
    key: 'operating_hours',
    label: 'Operating Hours',
    description: 'Regular operating hours, emergency hours, on-call availability',
    itemType: 'other', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: ['Operational Availability'],
    relatedTo: [],
  },
]

// ==========================================================================
// LICENSES, ACCREDITATIONS, CERTIFICATIONS
// ==========================================================================

export const ORGANIZATION_CREDENTIALS: OrganizationKnowledgeItem[] = [
  {
    key: 'business_license',
    label: 'Business License',
    description: 'General business operating license',
    itemType: 'certification', required: true, historical: true,
    documentSupported: true, documentExpires: true,
    generatesCandidates: true,
    consumedBy: ['Compliance', 'Sponsor Intelligence'],
    enablesCapabilities: ['Program Participation'],
    relatedTo: [],
  },
  {
    key: 'accreditations',
    label: 'Accreditations',
    description: 'Institutional accreditations — JCAHO, CAP, AABB, FACT, etc.',
    itemType: 'certification', required: false, historical: true,
    documentSupported: true, documentExpires: true,
    generatesCandidates: true,
    consumedBy: ['Readiness', 'Sponsor Intelligence', 'Capability Intelligence'],
    enablesCapabilities: ['Program Eligibility', 'Quality Assurance'],
    relatedTo: [],
  },
  {
    key: 'certifications',
    label: 'Certifications',
    description: 'Institutional-level certifications — ISO 9001, ISO 13485, ISO 15189, CLIA, etc.',
    itemType: 'certification', required: false, historical: true,
    documentSupported: true, documentExpires: true,
    generatesCandidates: true,
    consumedBy: ['Readiness', 'Capability Intelligence'],
    enablesCapabilities: ['Quality Management', 'IVD Validation'],
    relatedTo: [],
  },
  {
    key: 'insurance',
    label: 'Insurance Coverage',
    description: 'Professional liability, general liability, cyber, clinical trial insurance',
    itemType: 'policy', required: true, historical: true,
    documentSupported: true, documentExpires: true,
    generatesCandidates: true,
    consumedBy: ['Compliance', 'Sponsor Intelligence'],
    enablesCapabilities: ['Program Participation'],
    relatedTo: [],
  },
]

// ==========================================================================
// CONTACTS
// ==========================================================================

export const ORGANIZATION_CONTACTS: OrganizationKnowledgeItem[] = [
  {
    key: 'primary_contact',
    label: 'Primary Contact',
    description: 'Main point of contact for the institution',
    itemType: 'person', required: true, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: [],
    relatedTo: [],
  },
  {
    key: 'leadership_team',
    label: 'Leadership Team',
    description: 'Key leadership: CEO, Medical Director, Lab Director, Quality Director, etc.',
    itemType: 'person', required: false, historical: true,
    documentSupported: true, documentExpires: false,
    generatesCandidates: true,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: ['Organizational Capability'],
    relatedTo: [],
  },
  {
    key: 'key_departments',
    label: 'Key Departments / Functions',
    description: 'Research, laboratory, quality, regulatory, operations, administration',
    itemType: 'other', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Capability Intelligence'],
    enablesCapabilities: ['Organizational Capability'],
    relatedTo: ['person'],
  },
]

// ==========================================================================
// RESEARCH PROFILE
// ==========================================================================

export const ORGANIZATION_RESEARCH: OrganizationKnowledgeItem[] = [
  {
    key: 'therapeutic_focus',
    label: 'Therapeutic Focus Areas',
    description: 'Oncology, cardiology, neurology, infectious disease, rare disease, etc.',
    itemType: 'capability', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Program Matching', 'Marketplace'],
    enablesCapabilities: ['Program Type Matching'],
    relatedTo: [],
  },
  {
    key: 'research_profile',
    label: 'Research Profile',
    description: 'Overview of research activity: active studies, publications, investigator experience',
    itemType: 'historical_event', required: false, historical: true,
    documentSupported: true, documentExpires: false,
    generatesCandidates: true,
    consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'],
    enablesCapabilities: ['Research Capability Assessment'],
    relatedTo: [],
  },
  {
    key: 'patient_population',
    label: 'Patient Population Overview',
    description: 'Demographics, size, diversity, and accessibility of patient population served',
    itemType: 'other', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Program Matching'],
    enablesCapabilities: ['Patient Recruitment Capability'],
    relatedTo: [],
  },
  {
    key: 'geographic_coverage',
    label: 'Geographic Coverage',
    description: 'Regions, states, or countries where the institution can operate',
    itemType: 'other', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Program Matching'],
    enablesCapabilities: ['Multi-Region Programs', 'Geographic Diversity'],
    relatedTo: ['facility'],
  },
  {
    key: 'service_portfolio',
    label: 'Service Portfolio',
    description: 'Summary of research services offered: biospecimen, clinical, lab, data, imaging',
    itemType: 'capability', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'],
    enablesCapabilities: ['Service Discovery'],
    relatedTo: [],
  },
]

// ==========================================================================
// NETWORKS & RELATIONSHIPS
// ==========================================================================

export const ORGANIZATION_NETWORKS: OrganizationKnowledgeItem[] = [
  {
    key: 'networks',
    label: 'Research Networks',
    description: 'Member of research networks, consortia, or collaborative groups',
    itemType: 'relationship', required: false, historical: true,
    documentSupported: true, documentExpires: true,
    generatesCandidates: true,
    consumedBy: ['Sponsor Intelligence', 'Network'],
    enablesCapabilities: ['Network Participation', 'Multi-Site Programs'],
    relatedTo: [],
  },
  {
    key: 'academic_affiliations',
    label: 'Academic Affiliations',
    description: 'University affiliations, teaching hospital status, academic partnerships',
    itemType: 'relationship', required: false, historical: true,
    documentSupported: true, documentExpires: false,
    generatesCandidates: true,
    consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'],
    enablesCapabilities: ['Academic Research Profile'],
    relatedTo: [],
  },
  {
    key: 'cro_relationships',
    label: 'CRO Relationships',
    description: 'Active or past relationships with Contract Research Organizations',
    itemType: 'relationship', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: ['CRO-Mediated Programs'],
    relatedTo: [],
  },
  {
    key: 'sponsor_history',
    label: 'Sponsor History',
    description: 'Pharma, biotech, and device sponsors the institution has worked with',
    itemType: 'historical_event', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: ['Sponsor Trust Building'],
    relatedTo: [],
  },
  {
    key: 'vendor_partnerships',
    label: 'Vendor & Service Partnerships',
    description: 'Key vendors: courier services, equipment providers, reference labs, etc.',
    itemType: 'relationship', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: [],
    enablesCapabilities: ['Operational Continuity'],
    relatedTo: [],
  },
]

// ==========================================================================
// STRATEGY & GROWTH
// ==========================================================================

export const ORGANIZATION_STRATEGY: OrganizationKnowledgeItem[] = [
  {
    key: 'strategic_objectives',
    label: 'Strategic Objectives',
    description: 'Current strategic priorities for research and institutional growth',
    itemType: 'goal', required: false, historical: true,
    documentSupported: true, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Growth Intelligence'],
    enablesCapabilities: ['Strategic Alignment'],
    relatedTo: [],
  },
  {
    key: 'growth_plans',
    label: 'Growth Plans',
    description: 'Plans for expansion: new capabilities, facilities, therapeutic areas, geographies',
    itemType: 'goal', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Growth Intelligence'],
    enablesCapabilities: ['Future Readiness'],
    relatedTo: [],
  },
  {
    key: 'milestones',
    label: 'Organizational Milestones',
    description: 'Key dates: founded, accreditations achieved, major programs completed, expansions',
    itemType: 'historical_event', required: false, historical: true,
    documentSupported: false, documentExpires: false,
    generatesCandidates: false,
    consumedBy: ['Sponsor Intelligence'],
    enablesCapabilities: ['Institutional Track Record'],
    relatedTo: [],
  },
]

// ==========================================================================
// FULL CATALOG (all items)
// ==========================================================================

export const ORGANIZATION_DOMAIN_CATALOG: OrganizationKnowledgeItem[] = [
  ...ORGANIZATION_IDENTITY,
  ...ORGANIZATION_LEGAL,
  ...ORGANIZATION_LOCATIONS,
  ...ORGANIZATION_CREDENTIALS,
  ...ORGANIZATION_CONTACTS,
  ...ORGANIZATION_RESEARCH,
  ...ORGANIZATION_NETWORKS,
  ...ORGANIZATION_STRATEGY,
]

// ==========================================================================
// DOCUMENT CATALOG
// ==========================================================================

export interface OrganizationDocument {
  key: string
  label: string
  description: string
  required: boolean
  expires: boolean
  typicalExpirationMonths?: number
  supportsKnowledgeItems: string[] // keys of OrganizationKnowledgeItems
  evidenceClass: 'A' | 'B' | 'C' | 'D'
}

export const ORGANIZATION_DOCUMENTS: OrganizationDocument[] = [
  {
    key: 'business_license_doc', label: 'Business License',
    description: 'Current business operating license from relevant authority',
    required: true, expires: true, typicalExpirationMonths: 12,
    supportsKnowledgeItems: ['business_license'],
    evidenceClass: 'A',
  },
  {
    key: 'tax_id_doc', label: 'Tax ID / EIN Letter',
    description: 'IRS EIN confirmation letter or equivalent',
    required: true, expires: false,
    supportsKnowledgeItems: ['tax_id'],
    evidenceClass: 'A',
  },
  {
    key: 'insurance_cert', label: 'Certificate of Insurance',
    description: 'Professional liability or clinical trial insurance certificate',
    required: true, expires: true, typicalExpirationMonths: 12,
    supportsKnowledgeItems: ['insurance'],
    evidenceClass: 'A',
  },
  {
    key: 'org_chart', label: 'Organizational Chart',
    description: 'Current organizational structure and reporting lines',
    required: true, expires: false,
    supportsKnowledgeItems: ['leadership_team', 'key_departments'],
    evidenceClass: 'B',
  },
  {
    key: 'clia_cert', label: 'CLIA Certificate',
    description: 'Clinical Laboratory Improvement Amendments certificate',
    required: false, expires: true, typicalExpirationMonths: 24,
    supportsKnowledgeItems: ['certifications'],
    evidenceClass: 'A',
  },
  {
    key: 'cap_cert', label: 'CAP Accreditation',
    description: 'College of American Pathologists accreditation',
    required: false, expires: true, typicalExpirationMonths: 24,
    supportsKnowledgeItems: ['accreditations'],
    evidenceClass: 'A',
  },
  {
    key: 'iso_cert', label: 'ISO Certificate',
    description: 'ISO 9001, ISO 13485, or ISO 15189 certificate',
    required: false, expires: true, typicalExpirationMonths: 36,
    supportsKnowledgeItems: ['certifications'],
    evidenceClass: 'A',
  },
  {
    key: 'mission_doc', label: 'Mission Statement Document',
    description: 'Formal mission and values statement',
    required: false, expires: false,
    supportsKnowledgeItems: ['mission_statement'],
    evidenceClass: 'D',
  },
  {
    key: 'research_profile_doc', label: 'Research Profile / Capabilities Deck',
    description: 'Overview of research capabilities, publications, and experience',
    required: false, expires: false,
    supportsKnowledgeItems: ['research_profile', 'service_portfolio'],
    evidenceClass: 'C',
  },
  {
    key: 'network_membership', label: 'Network Membership Confirmation',
    description: 'Proof of membership in research networks or consortia',
    required: false, expires: true, typicalExpirationMonths: 12,
    supportsKnowledgeItems: ['networks'],
    evidenceClass: 'C',
  },
  {
    key: 'leadership_cv', label: 'Leadership CVs / Bios',
    description: 'CVs or professional biographies of key leadership',
    required: false, expires: false,
    supportsKnowledgeItems: ['leadership_team'],
    evidenceClass: 'C',
  },
  {
    key: 'w9_form', label: 'W-9 Form',
    description: 'IRS W-9 or equivalent tax form',
    required: true, expires: false,
    supportsKnowledgeItems: ['tax_id'],
    evidenceClass: 'B',
  },
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const ORGANIZATION_DOMAIN_STATS = {
  totalKnowledgeItems: ORGANIZATION_DOMAIN_CATALOG.length,
  requiredItems: ORGANIZATION_DOMAIN_CATALOG.filter((i) => i.required).length,
  optionalItems: ORGANIZATION_DOMAIN_CATALOG.filter((i) => !i.required).length,
  itemsThatGenerateCandidates: ORGANIZATION_DOMAIN_CATALOG.filter((i) => i.generatesCandidates).length,
  itemsWithDocuments: ORGANIZATION_DOMAIN_CATALOG.filter((i) => i.documentSupported).length,
  totalDocuments: ORGANIZATION_DOCUMENTS.length,
  requiredDocuments: ORGANIZATION_DOCUMENTS.filter((d) => d.required).length,
  expiringDocuments: ORGANIZATION_DOCUMENTS.filter((d) => d.expires).length,
  downstreamEngines: [...new Set(ORGANIZATION_DOMAIN_CATALOG.flatMap((i) => i.consumedBy))],
  enabledCapabilities: [...new Set(ORGANIZATION_DOMAIN_CATALOG.flatMap((i) => i.enablesCapabilities))],
}

// ==========================================================================
// Sections (for progressive UX)
// ==========================================================================

export const ORGANIZATION_SECTIONS = [
  { name: 'Identity', items: ORGANIZATION_IDENTITY, completionKey: 'identity' },
  { name: 'Legal & Structure', items: ORGANIZATION_LEGAL, completionKey: 'legal' },
  { name: 'Locations', items: ORGANIZATION_LOCATIONS, completionKey: 'locations' },
  { name: 'Licenses & Certifications', items: ORGANIZATION_CREDENTIALS, completionKey: 'credentials' },
  { name: 'Contacts & Leadership', items: ORGANIZATION_CONTACTS, completionKey: 'contacts' },
  { name: 'Research Profile', items: ORGANIZATION_RESEARCH, completionKey: 'research' },
  { name: 'Networks & Relationships', items: ORGANIZATION_NETWORKS, completionKey: 'networks' },
  { name: 'Strategy & Growth', items: ORGANIZATION_STRATEGY, completionKey: 'strategy' },
]
