// ==========================================================================
// IKM Domain Sprint 2A — Organization Structure Domain
// ==========================================================================
// Models HOW an institution is organized — its operating model,
// network structure, and capability distribution.
// Distinct from Organization Domain (Sprint 1) which models identity.
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface OrgStructureItem {
  key: string; label: string; description: string
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]
}

// ==========================================================================
// ORGANIZATION MODELS
// ==========================================================================

export const ORG_MODELS: OrgStructureItem[] = [
  { key: 'independent_site', label: 'Independent Research Site', description: 'Single standalone site operating independently — not part of a network or health system', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Site Autonomy'] },
  { key: 'independent_practice', label: 'Independent Medical Practice', description: 'Physician practice conducting research independently', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Physician-Led Research'] },
  { key: 'multi_site_org', label: 'Multi-Site Research Organization', description: 'Single organization operating research across multiple physical locations', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Multi-Site Operations', 'Geographic Coverage'] },
  { key: 'site_network', label: 'Site Network', description: 'Network of affiliated but independently operated research sites sharing resources', itemType: 'relationship', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Network'], enablesCapabilities: ['Network Participation', 'Shared Resources'] },
  { key: 'health_system', label: 'Health System', description: 'Integrated health system with multiple hospitals, clinics, and research units', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Integrated Care', 'Patient Access'] },
  { key: 'hospital', label: 'Hospital', description: 'Hospital-based research program — may be standalone or part of a health system', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Inpatient Research'] },
  { key: 'academic_center', label: 'Academic Medical Center', description: 'University-affiliated medical center with teaching, research, and clinical care', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Academic Research', 'Investigator Expertise'] },
  { key: 'university_research', label: 'University Research Center', description: 'University-based research unit — may not have clinical care', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Basic Research', 'Translational Research'] },
  { key: 'biobank', label: 'Biobank', description: 'Standalone or network-affiliated biobank for biospecimen collection and storage', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Biospecimen Repository'] },
  { key: 'lab_network', label: 'Laboratory Network', description: 'Network of laboratories sharing methodologies, QC, and reference capabilities', itemType: 'relationship', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Distributed Testing'] },
  { key: 'diagnostic_network', label: 'Diagnostic Network', description: 'Network of diagnostic facilities sharing testing platforms and results', itemType: 'relationship', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Diagnostic Coverage'] },
  { key: 'cro', label: 'CRO', description: 'Contract Research Organization providing research services to sponsors', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Full-Service Research'] },
  { key: 'sponsor_site', label: 'Sponsor-Owned Site', description: 'Research site owned and operated by a pharmaceutical or device sponsor', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Captive Research'] },
  { key: 'community_network', label: 'Community Research Network', description: 'Network of community-based practices bringing research to local populations', itemType: 'relationship', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Community Access', 'Diverse Populations'] },
  { key: 'hybrid_org', label: 'Hybrid Organization', description: 'Organization combining multiple models — e.g., academic center + community network + biobank', itemType: 'other', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Multi-Model Flexibility'] },
]

// ==========================================================================
// NETWORK STRUCTURE
// ==========================================================================

export const NETWORK_STRUCTURE: OrgStructureItem[] = [
  { key: 'parent_org', label: 'Parent Organization', description: 'Top-level organization that owns or governs member sites', itemType: 'other', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Network'], enablesCapabilities: ['Network Governance'] },
  { key: 'member_sites', label: 'Member Sites', description: 'Individual sites operating under the parent organization', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Distributed Operations'] },
  { key: 'regional_hubs', label: 'Regional Hubs', description: 'Regional centers that coordinate multiple satellite sites in a geographic area', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Regional Coordination'] },
  { key: 'satellite_clinics', label: 'Satellite Clinics', description: 'Smaller clinics operating under a hub or parent site', itemType: 'facility', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Geographic Reach'] },
  { key: 'central_lab', label: 'Central Laboratory', description: 'Centralized lab serving all network sites', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Centralized Testing'] },
  { key: 'shared_biobank', label: 'Shared Biobank', description: 'Network-level biobank serving multiple sites', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Shared Biospecimen Repository'] },
  { key: 'shared_pharmacy', label: 'Shared Pharmacy', description: 'Central pharmacy preparing and distributing investigational products to sites', itemType: 'facility', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Centralized IP Management'] },
  { key: 'shared_regulatory', label: 'Shared Regulatory', description: 'Centralized regulatory affairs supporting all sites', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Regulatory', 'Sponsor Intelligence'], enablesCapabilities: ['Centralized Compliance'] },
  { key: 'shared_recruitment', label: 'Shared Recruitment', description: 'Centralized patient recruitment supporting all sites', itemType: 'process', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Centralized Enrollment'] },
  { key: 'shared_quality', label: 'Shared Quality', description: 'Centralized quality management across the network', itemType: 'process', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Quality', 'Readiness'], enablesCapabilities: ['Network Quality'] },
  { key: 'shared_operations', label: 'Shared Operations', description: 'Centralized operations management for contracting, budgeting, and logistics', itemType: 'process', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Operational Efficiency'] },
]

// ==========================================================================
// CAPABILITY DISTRIBUTION
// ==========================================================================

export type CapabilityScope = 'site_specific' | 'shared_network' | 'centralized' | 'distributed' | 'inherited'

export const CAPABILITY_SCOPES: { scope: CapabilityScope; label: string; description: string }[] = [
  { scope: 'site_specific', label: 'Site-Specific', description: 'Capability exists only at this specific site — not shared with other network locations' },
  { scope: 'shared_network', label: 'Shared Across Network', description: 'Capability is available to multiple sites within the network — shared infrastructure or personnel' },
  { scope: 'centralized', label: 'Centralized', description: 'Capability is provided from a central hub serving the entire network — one location, many consumers' },
  { scope: 'distributed', label: 'Distributed', description: 'Capability exists at multiple sites independently — each site has its own instance' },
  { scope: 'inherited', label: 'Inherited', description: 'Capability is inherited from a parent organization or network membership — not independently maintained' },
]

// ==========================================================================
// PEOPLE DISTRIBUTION
// ==========================================================================

export const PEOPLE_DISTRIBUTION: OrgStructureItem[] = [
  { key: 'shared_pi', label: 'Shared PI', description: 'Principal Investigator covering multiple sites in the network', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Multi-Site Leadership'] },
  { key: 'local_pi', label: 'Local PI', description: 'Site-specific Principal Investigator with local responsibility', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Site Leadership'] },
  { key: 'traveling_coordinator', label: 'Traveling CRC', description: 'Clinical Research Coordinator who travels between sites', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Flexible Staffing'] },
  { key: 'central_regulatory', label: 'Central Regulatory Staff', description: 'Regulatory personnel serving the entire network from a central location', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Regulatory'], enablesCapabilities: ['Centralized Regulatory'] },
  { key: 'central_lab_staff', label: 'Central Lab Staff', description: 'Laboratory personnel at the central/s shared lab', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Centralized Testing'] },
  { key: 'shared_quality_staff', label: 'Shared Quality Staff', description: 'Quality personnel serving the entire network', itemType: 'person', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Quality'], enablesCapabilities: ['Network Quality'] },
]

// ==========================================================================
// EQUIPMENT DISTRIBUTION
// ==========================================================================

export const EQUIPMENT_DISTRIBUTION: OrgStructureItem[] = [
  { key: 'local_equipment', label: 'Locally Owned Equipment', description: 'Equipment owned and maintained at a specific site', itemType: 'equipment', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Site Autonomy'] },
  { key: 'shared_equipment', label: 'Shared Equipment', description: 'Equipment shared between multiple sites within the network', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence'], enablesCapabilities: ['Resource Sharing'] },
  { key: 'central_equipment', label: 'Centralized Equipment', description: 'Equipment located at a central facility serving the entire network', itemType: 'equipment', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Centralized Capacity'] },
  { key: 'equipment_by_request', label: 'Equipment Available by Request', description: 'Equipment not routinely available but accessible through arrangement', itemType: 'equipment', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: ['Flexible Capacity'] },
]

// ==========================================================================
// PROGRAM DISTRIBUTION
// ==========================================================================

export const PROGRAM_DISTRIBUTION: OrgStructureItem[] = [
  { key: 'single_site_program', label: 'Single Site Execution', description: 'Program executed at a single site only', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Focused Execution'] },
  { key: 'multi_site_program', label: 'Multi-Site Execution', description: 'Program executed across multiple sites simultaneously', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching', 'Capability Intelligence'], enablesCapabilities: ['Scaled Execution'] },
  { key: 'network_wide_program', label: 'Network-Wide Execution', description: 'Program executed across the entire network of sites', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Maximum Coverage'] },
  { key: 'regional_hub_program', label: 'Regional Hub Execution', description: 'Program executed through regional hubs with satellite sites', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Regional Execution'] },
]

// ==========================================================================
// FULL CATALOG
// ==========================================================================

export const ORG_STRUCTURE_CATALOG: OrgStructureItem[] = [
  ...ORG_MODELS,
  ...NETWORK_STRUCTURE,
  ...PEOPLE_DISTRIBUTION,
  ...EQUIPMENT_DISTRIBUTION,
  ...PROGRAM_DISTRIBUTION,
]

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const ORG_STRUCTURE_STATS = {
  totalItems: ORG_STRUCTURE_CATALOG.length,
  orgModels: ORG_MODELS.length,
  networkStructureItems: NETWORK_STRUCTURE.length,
  peopleDistributionItems: PEOPLE_DISTRIBUTION.length,
  equipmentDistributionItems: EQUIPMENT_DISTRIBUTION.length,
  programDistributionItems: PROGRAM_DISTRIBUTION.length,
  capabilityScopes: CAPABILITY_SCOPES.length,
  downstreamEngines: [...new Set(ORG_STRUCTURE_CATALOG.flatMap((i) => i.consumedBy))],
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const ORG_STRUCTURE_SECTIONS = [
  { name: 'Organization Model', items: ORG_MODELS, completionKey: 'model' },
  { name: 'Network Structure', items: NETWORK_STRUCTURE, completionKey: 'network' },
  { name: 'People Distribution', items: PEOPLE_DISTRIBUTION, completionKey: 'people_dist' },
  { name: 'Equipment Distribution', items: EQUIPMENT_DISTRIBUTION, completionKey: 'equip_dist' },
  { name: 'Program Distribution', items: PROGRAM_DISTRIBUTION, completionKey: 'program_dist' },
]

// ==========================================================================
// ARCHITECTURAL RECOMMENDATION
// ==========================================================================

/**
 * Future engines (Readiness, Capability Intelligence, Sponsor Intelligence)
 * should evaluate capabilities at BOTH levels independently:
 *
 * SITE LEVEL:
 *   - What can this specific site demonstrate?
 *   - Relevant for: single-site programs, site-specific certifications
 *
 * NETWORK LEVEL:
 *   - What can the network as a whole demonstrate?
 *   - Relevant for: multi-site programs, shared services, centralized labs
 *
 * The two levels are NOT additive. A network with 5 sites each having
 * partial PBMC capability does NOT automatically have full PBMC capability
 * at the network level. The network capability depends on whether shared
 * services, centralized processing, or standardized SOPs exist.
 */
