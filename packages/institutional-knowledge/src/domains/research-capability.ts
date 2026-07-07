// ==========================================================================
// IKM Domain Sprint 3A — Research Capability Domain
// ==========================================================================
// Models WHAT the institution can actually do.
// NOT studies. NOT programs. NOT readiness.
// Capabilities are KNOWLEDGE. Readiness remains downstream.
// ==========================================================================

import type { KnowledgeItemType } from '../types'

export interface CapabilityItem {
  key: string; label: string; description: string
  category: CapabilityCategory
  itemType: KnowledgeItemType; required: boolean; historical: boolean
  documentSupported: boolean; documentExpires: boolean; generatesCandidates: boolean
  consumedBy: string[]; enablesCapabilities: string[]
  /** Keys of capabilities this one depends on */
  dependsOn: string[]
  /** Keys of capabilities that depend on this one */
  requiredBy: string[]
}

export type CapabilityCategory =
  | 'clinical_research' | 'biospecimen_collection' | 'biospecimen_processing'
  | 'biobanking' | 'ivd_collections' | 'translational_research'
  | 'phase1' | 'phase2' | 'phase3' | 'phase4'
  | 'healthy_volunteers' | 'special_populations' | 'pediatrics' | 'womens_health'
  | 'rare_disease' | 'genetics' | 'imaging' | 'infusion' | 'pkpd'
  | 'laboratory_services' | 'shipping' | 'long_term_storage'
  | 'home_visits' | 'mobile_research' | 'digital_research'
  | 'real_world_evidence' | 'patient_registry' | 'natural_history'
  | 'custom_capability'

// ==========================================================================
// CAPABILITY CATALOG
// ==========================================================================

export const CAPABILITY_CATALOG: CapabilityItem[] = [
  // Clinical Research
  { key: 'clinical_research', label: 'Clinical Research', description: 'Capability to conduct clinical research studies across all phases', category: 'clinical_research', itemType: 'capability', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness', 'Program Matching'], enablesCapabilities: ['Research Operations'], dependsOn: [], requiredBy: ['phase1', 'phase2', 'phase3', 'phase4'] },

  // Phase capabilities
  { key: 'phase1', label: 'Phase I Trials', description: 'First-in-human, safety, and dosing studies in healthy volunteers or patients', category: 'phase1', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Early Phase Research'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'phase2', label: 'Phase II Trials', description: 'Proof-of-concept and dose-finding studies in patient populations', category: 'phase2', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Mid Phase Research'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'phase3', label: 'Phase III Trials', description: 'Large-scale confirmatory trials for regulatory submission', category: 'phase3', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Regulatory Trials'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'phase4', label: 'Phase IV / Post-Market', description: 'Post-marketing surveillance and outcomes research', category: 'phase4', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Post-Market Research'], dependsOn: ['clinical_research'], requiredBy: [] },

  // Biospecimen
  { key: 'biospecimen_collection', label: 'Biospecimen Collection', description: 'Capability to collect biological samples per protocol requirements', category: 'biospecimen_collection', itemType: 'capability', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Acquisition'], dependsOn: ['clinical_research'], requiredBy: ['biospecimen_processing', 'biobanking', 'ivd_collections'] },
  { key: 'biospecimen_processing', label: 'Biospecimen Processing', description: 'Capability to process samples — centrifugation, aliquoting, PBMC isolation, DNA/RNA extraction', category: 'biospecimen_processing', itemType: 'capability', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Processing'], dependsOn: ['biospecimen_collection', 'laboratory_services'], requiredBy: ['biobanking'] },
  { key: 'biobanking', label: 'Biobanking', description: 'Capability to store, manage, and distribute biospecimens as a repository', category: 'biobanking', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Biospecimen Repository'], dependsOn: ['biospecimen_collection', 'biospecimen_processing', 'long_term_storage'], requiredBy: [] },
  { key: 'ivd_collections', label: 'IVD / Diagnostic Collections', description: 'Capability to collect and process samples specifically for IVD and diagnostic validation', category: 'ivd_collections', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Readiness'], enablesCapabilities: ['IVD Validation'], dependsOn: ['biospecimen_collection', 'biospecimen_processing'], requiredBy: [] },
  { key: 'translational_research', label: 'Translational Research', description: 'Capability to bridge basic science and clinical application with biomarker and correlative studies', category: 'translational_research', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Translational Science'], dependsOn: ['biospecimen_collection', 'laboratory_services'], requiredBy: [] },

  // Populations
  { key: 'healthy_volunteers', label: 'Healthy Volunteers', description: 'Access to and capability to enroll healthy volunteer populations', category: 'healthy_volunteers', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Phase I Recruitment'], dependsOn: ['clinical_research'], requiredBy: ['phase1'] },
  { key: 'special_populations', label: 'Special Populations', description: 'Capability to enroll pregnant women, immunocompromised, elderly, rare disease, etc.', category: 'special_populations', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Diverse Enrollment'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'pediatrics', label: 'Pediatric Research', description: 'Capability to conduct research with pediatric populations including age-appropriate methods', category: 'pediatrics', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Pediatric Studies'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'womens_health', label: 'Women\'s Health Research', description: 'Capability to conduct women\'s health studies including pregnancy-related research', category: 'womens_health', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Women\'s Health Studies'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'rare_disease', label: 'Rare Disease Research', description: 'Capability to identify, enroll, and manage rare disease patient populations', category: 'rare_disease', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence', 'Program Matching'], enablesCapabilities: ['Rare Disease Studies'], dependsOn: ['clinical_research'], requiredBy: [] },

  // Specialty capabilities
  { key: 'genetics', label: 'Genetics / Genomics', description: 'Capability to perform genetic testing, sequencing, and genomic analysis', category: 'genetics', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Genomic Research'], dependsOn: ['laboratory_services', 'biospecimen_processing'], requiredBy: [] },
  { key: 'imaging', label: 'Imaging Capability', description: 'Capability to perform and analyze medical imaging for research — MRI, CT, PET, ultrasound, DXA', category: 'imaging', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Imaging Research'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'infusion', label: 'Infusion Capability', description: 'Capability to administer investigational products via infusion with monitoring', category: 'infusion', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Infusion Studies'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'pkpd', label: 'PK/PD Sampling', description: 'Capability to perform pharmacokinetic and pharmacodynamic sampling per protocol', category: 'pkpd', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['PK/PD Studies'], dependsOn: ['clinical_research', 'biospecimen_collection', 'biospecimen_processing'], requiredBy: ['phase1'] },

  // Infrastructure capabilities
  { key: 'laboratory_services', label: 'Laboratory Services', description: 'Capability to perform laboratory testing — clinical, research, or specialty', category: 'laboratory_services', itemType: 'capability', required: true, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence', 'Readiness'], enablesCapabilities: ['Lab Operations'], dependsOn: [], requiredBy: ['biospecimen_processing', 'genetics', 'pkpd'] },
  { key: 'shipping', label: 'Sample Shipping', description: 'Capability to ship biological samples domestically and internationally with compliance', category: 'shipping', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence', 'Capability Intelligence'], enablesCapabilities: ['Sample Distribution'], dependsOn: ['biospecimen_processing'], requiredBy: [] },
  { key: 'long_term_storage', label: 'Long-Term Storage', description: 'Capability to store samples long-term at -80°C, LN2, or other conditions with monitoring', category: 'long_term_storage', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Capability Intelligence', 'Readiness'], enablesCapabilities: ['Sample Preservation'], dependsOn: ['biospecimen_processing'], requiredBy: ['biobanking'] },

  // Innovative models
  { key: 'home_visits', label: 'Home Visits', description: 'Capability to conduct study visits at patient homes or remote locations', category: 'home_visits', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Decentralized Trials'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'mobile_research', label: 'Mobile Research', description: 'Capability to operate mobile research units — vans, trailers, pop-up sites', category: 'mobile_research', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: true, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Community Research'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'digital_research', label: 'Digital / Decentralized Research', description: 'Capability to conduct research using digital tools — eConsent, ePRO, wearables, telemedicine', category: 'digital_research', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Digital Trials'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'real_world_evidence', label: 'Real World Evidence', description: 'Capability to generate RWE from EHR, claims, registry, and observational data', category: 'real_world_evidence', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['RWE Studies'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'patient_registry', label: 'Patient Registry', description: 'Capability to maintain and query patient registries for recruitment and follow-up', category: 'patient_registry', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Registry Studies'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'natural_history', label: 'Natural History Studies', description: 'Capability to conduct longitudinal natural history studies for rare or progressive diseases', category: 'natural_history', itemType: 'capability', required: false, historical: true, documentSupported: true, documentExpires: false, generatesCandidates: true, consumedBy: ['Sponsor Intelligence'], enablesCapabilities: ['Natural History Research'], dependsOn: ['clinical_research'], requiredBy: [] },
  { key: 'custom_capability', label: 'Custom / Other Capability', description: 'Institution-specific capability not covered by standard categories', category: 'custom_capability', itemType: 'capability', required: false, historical: true, documentSupported: false, documentExpires: false, generatesCandidates: false, consumedBy: [], enablesCapabilities: [], dependsOn: [], requiredBy: [] },
]

// ==========================================================================
// CAPABILITY CATEGORY LABELS
// ==========================================================================

export const CAPABILITY_CATEGORY_LABELS: Record<CapabilityCategory, string> = {
  clinical_research: 'Clinical Research',
  biospecimen_collection: 'Biospecimen Collection',
  biospecimen_processing: 'Biospecimen Processing',
  biobanking: 'Biobanking',
  ivd_collections: 'IVD Collections',
  translational_research: 'Translational Research',
  phase1: 'Phase I', phase2: 'Phase II', phase3: 'Phase III', phase4: 'Phase IV',
  healthy_volunteers: 'Healthy Volunteers',
  special_populations: 'Special Populations',
  pediatrics: 'Pediatrics', womens_health: "Women's Health",
  rare_disease: 'Rare Disease', genetics: 'Genetics / Genomics',
  imaging: 'Imaging', infusion: 'Infusion', pkpd: 'PK/PD',
  laboratory_services: 'Laboratory Services',
  shipping: 'Shipping', long_term_storage: 'Long-Term Storage',
  home_visits: 'Home Visits', mobile_research: 'Mobile Research',
  digital_research: 'Digital Research',
  real_world_evidence: 'Real World Evidence',
  patient_registry: 'Patient Registry',
  natural_history: 'Natural History',
  custom_capability: 'Custom Capability',
}

// ==========================================================================
// DOMAIN STATS
// ==========================================================================

export const CAPABILITY_DOMAIN_STATS = {
  totalCapabilities: CAPABILITY_CATALOG.length,
  categories: Object.keys(CAPABILITY_CATEGORY_LABELS).length,
  requiredCapabilities: CAPABILITY_CATALOG.filter((c) => c.required).length,
  capabilitiesWithDependencies: CAPABILITY_CATALOG.filter((c) => c.dependsOn.length > 0).length,
  capabilitiesRequiredByOthers: CAPABILITY_CATALOG.filter((c) => c.requiredBy.length > 0).length,
  rootCapabilities: CAPABILITY_CATALOG.filter((c) => c.dependsOn.length === 0).length,
  leafCapabilities: CAPABILITY_CATALOG.filter((c) => c.requiredBy.length === 0).length,
  consumedByEngines: [...new Set(CAPABILITY_CATALOG.flatMap((c) => c.consumedBy))],
}

// ==========================================================================
// DEPENDENCY GRAPH HELPERS
// ==========================================================================

export function getDependencyTree(capKey: string): { dependsOn: string[]; requiredBy: string[]; allDependencies: string[] } {
  const cap = CAPABILITY_CATALOG.find((c) => c.key === capKey)
  if (!cap) return { dependsOn: [], requiredBy: [], allDependencies: [] }

  const allDeps = new Set<string>()
  function collect(key: string) {
    const c = CAPABILITY_CATALOG.find((x) => x.key === key)
    if (!c || allDeps.has(key)) return
    allDeps.add(key)
    c.dependsOn.forEach(collect)
  }
  cap.dependsOn.forEach(collect)

  return {
    dependsOn: cap.dependsOn,
    requiredBy: cap.requiredBy,
    allDependencies: Array.from(allDeps),
  }
}

// ==========================================================================
// SECTIONS
// ==========================================================================

export const CAPABILITY_SECTIONS = [
  { name: 'Core Research', category: 'clinical_research' as CapabilityCategory, itemKeys: ['clinical_research'] },
  { name: 'Study Phases', category: 'phase1' as CapabilityCategory, itemKeys: ['phase1', 'phase2', 'phase3', 'phase4'] },
  { name: 'Biospecimen Capabilities', category: 'biospecimen_collection' as CapabilityCategory, itemKeys: ['biospecimen_collection', 'biospecimen_processing', 'biobanking', 'ivd_collections', 'translational_research'] },
  { name: 'Population Access', category: 'healthy_volunteers' as CapabilityCategory, itemKeys: ['healthy_volunteers', 'special_populations', 'pediatrics', 'womens_health', 'rare_disease'] },
  { name: 'Specialty Services', category: 'special_populations' as CapabilityCategory, itemKeys: ['genetics', 'imaging', 'infusion', 'pkpd'] },
  { name: 'Infrastructure', category: 'laboratory_services' as CapabilityCategory, itemKeys: ['laboratory_services', 'shipping', 'long_term_storage'] },
  { name: 'Innovative Models', category: 'home_visits' as CapabilityCategory, itemKeys: ['home_visits', 'mobile_research', 'digital_research', 'real_world_evidence', 'patient_registry', 'natural_history'] },
  { name: 'Custom', category: 'custom_capability' as CapabilityCategory, itemKeys: ['custom_capability'] },
]

// ==========================================================================
// OPERATIONS — Auto-detection
// ==========================================================================

export const CAPABILITY_OPERATIONS = {
  criticalChecks: [
    { check: 'missing_dependency', description: 'Capability has unmet dependencies', action: 'Ensure all dependent capabilities are evidenced before claiming this one' },
    { check: 'no_documents', description: 'Capability claimed without supporting documents', action: 'Upload SOPs, certifications, or operational records' },
    { check: 'broken_chain', description: 'Dependency chain is broken — upstream capability not claimed', action: 'Claim prerequisite capabilities first' },
    { check: 'orphan_capability', description: 'Capability not required by any other capability — may be unused', action: 'Review whether this capability is needed or can be removed' },
    { check: 'circular_dependency', description: 'Capability dependency chain contains a cycle', action: 'Resolve circular dependency by restructuring capabilities' },
  ],
}
