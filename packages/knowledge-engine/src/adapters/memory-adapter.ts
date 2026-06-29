// ==========================================================================
// Knowledge Engine — In-memory adapter (tests + offline runtime)
// ==========================================================================

import type {
  KnowledgeAdapter,
  OntologyTerm,
  OntologySynonym,
  OntologyMapping,
  VocabularySet,
} from '../types';

export class InMemoryKnowledgeAdapter implements KnowledgeAdapter {
  constructor(
    private readonly terms: OntologyTerm[] = [],
    private readonly synonyms: OntologySynonym[] = [],
    private readonly mappings: OntologyMapping[] = [],
  ) {}

  async getTermsByVocabulary(vocabulary: VocabularySet): Promise<OntologyTerm[]> {
    return this.terms.filter(term => term.vocabulary === vocabulary);
  }

  async getSynonymsForTerms(termIds: string[]): Promise<OntologySynonym[]> {
    return this.synonyms.filter(synonym => termIds.includes(synonym.termId));
  }

  async getMappingsForTerms(termIds: string[]): Promise<OntologyMapping[]> {
    return this.mappings.filter(mapping => termIds.includes(mapping.termId));
  }

  async getTermByPreferredLabel(vocabulary: VocabularySet, label: string): Promise<OntologyTerm | null> {
    return this.terms.find(
      term => term.vocabulary === vocabulary && term.preferredLabel === label,
    ) ?? null;
  }

  async getSynonyms(termId: string): Promise<OntologySynonym[]> {
    return this.synonyms.filter(synonym => synonym.termId === termId);
  }

  async getChildren(termId: string): Promise<OntologyTerm[]> {
    return this.terms.filter(term => term.parentId === termId);
  }

  async getMappings(termId: string): Promise<OntologyMapping[]> {
    return this.mappings.filter(mapping => mapping.termId === termId);
  }

  async findTermBySynonym(vocabulary: VocabularySet, synonym: string): Promise<OntologyTerm | null> {
    const match = this.synonyms.find(item => item.synonym.toLowerCase() === synonym.toLowerCase());
    if (!match) return null;
    return this.terms.find(term => term.id === match.termId && term.vocabulary === vocabulary) ?? null;
  }

  async fuzzySearch(vocabulary: VocabularySet, query: string): Promise<OntologyTerm[]> {
    const cleaned = query.toLowerCase();
    return this.terms.filter(
      term => term.vocabulary === vocabulary && term.preferredLabel.toLowerCase().includes(cleaned),
    );
  }
}
