// ==========================================================================
// Knowledge Engine — Capability Taxonomy Enrichment (KTP-1.5A)
// ==========================================================================
//
// Consumes capability-intelligence types for taxonomy enrichment.
// Does NOT own capability logic — capability-intelligence is the source of truth.
// ==========================================================================

const CAPABILITY_NAME_MAP: Record<string, string> = {
  // Biospecimen Processing
  'pbmc processing': 'PBMC Processing Lab',
  'pbmc': 'PBMC Processing Lab',
  'plasma processing': 'Biospecimen Collection',
  'serum processing': 'Biospecimen Collection',
  'whole blood processing': 'Biospecimen Collection',
  'ffpe processing': 'FFPE Tissue Processing',
  'tissue processing': 'FFPE Tissue Processing',
  'dna extraction': 'Biospecimen Collection',
  'rna extraction': 'Biospecimen Collection',

  // Laboratory
  'lab': 'Laboratory',
  'laboratory': 'Laboratory',
  'clia lab': 'Laboratory',
  'cap lab': 'Laboratory',
  'iso 15189': 'Laboratory',

  // Storage
  'storage': 'Storage',
  '-80': 'Storage',
  'ln2': 'Storage',
  'liquid nitrogen': 'Storage',
  'cryopreservation': 'Storage',

  // Shipping
  'shipping': 'Cold Chain Logistics',
  'logistics': 'Cold Chain Logistics',
  'cold chain': 'Cold Chain Logistics',
  'transport': 'Cold Chain Logistics',

  // Clinical
  'clinical': 'Clinical Operations',
  'ehr': 'Clinical Data',
  'emr': 'Clinical Data',
  'clinical data': 'Clinical Data',

  // Regulatory
  'irb': 'Regulatory',
  'regulatory': 'Regulatory',
  'fda': 'Regulatory',
  'gcp': 'Regulatory',
  'iso': 'Quality',

  // Quality
  'quality': 'Quality',
  'qms': 'Quality',
  'iso 9001': 'Quality',
  'iso 13485': 'Quality',

  // Personnel
  'personnel': 'Personnel',
  'staff': 'Personnel',
  'training': 'Personnel',

  // Infrastructure
  'infrastructure': 'Infrastructure',
  'facility': 'Infrastructure',
  'bsl-2': 'Infrastructure',
}

const CATEGORY_SIBLINGS: Record<string, string[]> = {
  'Biospecimen Processing': ['Storage', 'Laboratory', 'Shipping'],
  'Laboratory': ['Biospecimen Processing', 'Quality', 'Regulatory'],
  'Storage': ['Biospecimen Processing', 'Shipping', 'Infrastructure'],
  'Shipping': ['Storage', 'Infrastructure', 'Regulatory'],
  'Clinical Operations': ['Clinical Data', 'Regulatory', 'Personnel'],
  'Clinical Data': ['Clinical Operations', 'Digital Pathology', 'Imaging'],
  'Regulatory': ['Quality', 'Clinical Operations', 'Personnel'],
  'Quality': ['Regulatory', 'Laboratory', 'Personnel'],
  'Infrastructure': ['Storage', 'Shipping', 'Laboratory'],
  'Personnel': ['Quality', 'Regulatory', 'Clinical Operations'],
   'Digital Pathology': ['Imaging', 'Clinical Data', 'Laboratory'],
   'Imaging': ['Digital Pathology', 'Clinical Data'],
   'Research Operations': ['Biospecimen Processing', 'Clinical Operations', 'Regulatory'],
   'AI Readiness Foundations': ['Clinical Data', 'Digital Pathology', 'Infrastructure'],
}

/**
 * Normalize a free-text capability name to controlled vocabulary.
 * Deterministic, no AI.
 */
export function normalizeCapabilityName(name: string): string {
  const lower = name.toLowerCase().trim()

  // Direct match
  if (CAPABILITY_NAME_MAP[lower]) return CAPABILITY_NAME_MAP[lower]

  // Partial match
  for (const [key, value] of Object.entries(CAPABILITY_NAME_MAP)) {
    if (lower.includes(key)) return value
  }

  // Fallback: return as-is
  return name
}

/**
 * Get related/sibling capabilities for a given capability name.
 * Useful for suggesting what else an institution might need.
 */
export function getRelatedCapabilities(name: string): string[] {
  const normalized = normalizeCapabilityName(name)
  return CATEGORY_SIBLINGS[normalized] ?? []
}

/**
 * Suggest capabilities an institution may be missing based on what they already have.
 * Consumes capability names the institution has, returns suggestions.
 */
export function suggestMissingCapabilities(existingNames: string[]): string[] {
  const normalized = existingNames.map(normalizeCapabilityName)
  const suggestions = new Set<string>()

  for (const name of normalized) {
    const siblings = getRelatedCapabilities(name)
    for (const sibling of siblings) {
      if (!normalized.includes(sibling)) {
        suggestions.add(sibling)
      }
    }
  }

  return Array.from(suggestions)
}
