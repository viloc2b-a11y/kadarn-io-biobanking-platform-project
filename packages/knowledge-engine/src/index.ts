// ==========================================================================
// Kadarn Knowledge Engine — Public API
// ==========================================================================

export {
  normalizeTerm,
  getSynonyms,
  expandQuery,
  getHierarchy,
  mapToExternal,
} from './engine';

export { KnowledgeService } from './service';
export type { VocabularySnapshot } from './service';
export { InMemoryKnowledgeAdapter } from './adapters/memory-adapter';

export type {
  OntologyTerm,
  OntologySynonym,
  OntologyMapping,
  NormalizationResult,
  ExpansionResult,
  VocabularySet,
  CodingSystem,
  KnowledgeAdapter,
} from './types';

export { ALL_VOCABULARIES } from './types';

export type { HierarchyResult } from './engine';
