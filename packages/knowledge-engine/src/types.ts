// ==========================================================================
// Kadarn Knowledge Engine — Type Definitions
// ==========================================================================
// ADR-015: Knowledge Engine — Semantic Understanding Layer
// KRM-RAO §4.3 (Knowledge Graph)
// ==========================================================================

export type VocabularySet =
  | 'specimen_type'
  | 'processing_method'
  | 'storage_condition'
  | 'container_type'
  | 'regulatory_doc_type'
  | 'diagnosis';

export type CodingSystem = 'icd10' | 'icd11' | 'snomed_ct' | 'loinc' | 'ncit' | 'mondo' | 'fhir';

// --------------------------------------------------------------------------
// Vocabulary term
// --------------------------------------------------------------------------

export interface OntologyTerm {
  id: string;
  vocabulary: VocabularySet;
  preferredLabel: string;
  displayName: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
}

// --------------------------------------------------------------------------
// Synonym
// --------------------------------------------------------------------------

export interface OntologySynonym {
  id: string;
  termId: string;
  synonym: string;
  source?: string;
  isAbbreviation: boolean;
}

// --------------------------------------------------------------------------
// External mapping
// --------------------------------------------------------------------------

export interface OntologyMapping {
  id: string;
  termId: string;
  codingSystem: CodingSystem;
  externalCode: string;
  externalLabel?: string;
}

// --------------------------------------------------------------------------
// Normalization result
// --------------------------------------------------------------------------

export interface NormalizationResult {
  /** The original input term */
  original: string;
  /** The canonical form (preferred label) */
  normalized: string;
  /** Display name */
  displayName?: string;
  /** Vocabulary set */
  vocabulary: VocabularySet;
  /** Whether the term was found in the vocabulary */
  found: boolean;
  /** Confidence score for fuzzy matches (0.0-1.0) */
  confidence: number;
}

// --------------------------------------------------------------------------
// Query expansion result
// --------------------------------------------------------------------------

export interface ExpansionResult {
  original: string;
  expanded: string[];
  synonyms: string[];
}

// --------------------------------------------------------------------------
// Adapter interface
// --------------------------------------------------------------------------

export interface KnowledgeAdapter {
  getTermByPreferredLabel(vocabulary: VocabularySet, label: string): Promise<OntologyTerm | null>;
  getSynonyms(termId: string): Promise<OntologySynonym[]>;
  getChildren(termId: string): Promise<OntologyTerm[]>;
  getMappings(termId: string): Promise<OntologyMapping[]>;
  findTermBySynonym(vocabulary: VocabularySet, synonym: string): Promise<OntologyTerm | null>;
  fuzzySearch(vocabulary: VocabularySet, query: string): Promise<OntologyTerm[]>;
}
