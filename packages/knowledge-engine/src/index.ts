// ==========================================================================
// Kadarn Knowledge Engine — Public API
// ==========================================================================

export {
  normalizeTerm,
  getSynonyms,
  expandQuery,
  getHierarchy,
} from './engine.js';

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
} from './types.js';
