// ==========================================================================
// Kadarn Knowledge Engine — Public API
// ==========================================================================

export {
  normalizeTerm,
  getSynonyms,
  expandQuery,
  getHierarchy,
} from './engine.js'

// Taxonomy enrichment (KTP-1.5A — consumes Capability Intelligence types)
export {
  normalizeCapabilityName,
  getRelatedCapabilities,
  suggestMissingCapabilities,
} from './taxonomy.js'

export type {
  OntologyTerm,
  OntologySynonym,
  OntologyMapping,
  NormalizationResult,
  ExpansionResult,
  VocabularySet,
  CodingSystem,
  KnowledgeAdapter,
  HierarchyResult,
} from './types.js'
