// ==========================================================================
// Kadarn Knowledge Engine — Service Layer
// ==========================================================================

import {
  normalizeTerm,
  expandQuery,
  mapToExternal,
  getHierarchy,
} from './engine';
import type {
  KnowledgeAdapter,
  OntologyTerm,
  OntologySynonym,
  OntologyMapping,
  NormalizationResult,
  ExpansionResult,
  VocabularySet,
  CodingSystem,
} from './types';

export interface VocabularySnapshot {
  terms: OntologyTerm[];
  synonyms: OntologySynonym[];
  mappings: OntologyMapping[];
}

export class KnowledgeService {
  constructor(private readonly adapter: KnowledgeAdapter) {}

  async loadVocabulary(vocabulary: VocabularySet): Promise<VocabularySnapshot> {
    const terms = await this.adapter.getTermsByVocabulary(vocabulary);
    const termIds = terms.map(term => term.id);
    const [synonyms, mappings] = await Promise.all([
      this.adapter.getSynonymsForTerms(termIds),
      this.adapter.getMappingsForTerms(termIds),
    ]);
    return { terms, synonyms, mappings };
  }

  async normalize(
    vocabulary: VocabularySet,
    term: string,
    snapshot?: VocabularySnapshot,
  ): Promise<NormalizationResult> {
    const loaded = snapshot ?? await this.loadVocabulary(vocabulary);
    return normalizeTerm(vocabulary, term, loaded.terms, loaded.synonyms);
  }

  async expand(
    vocabulary: VocabularySet,
    term: string,
    snapshot?: VocabularySnapshot,
  ): Promise<ExpansionResult> {
    const loaded = snapshot ?? await this.loadVocabulary(vocabulary);
    return expandQuery(term, loaded.terms, loaded.synonyms, vocabulary);
  }

  async externalMappings(
    termId: string,
    snapshot: VocabularySnapshot,
    codingSystem?: CodingSystem,
  ): Promise<OntologyMapping[]> {
    return mapToExternal(termId, snapshot.mappings, codingSystem);
  }

  async hierarchyForTerm(termId: string, snapshot: VocabularySnapshot) {
    return getHierarchy(termId, snapshot.terms);
  }
}
