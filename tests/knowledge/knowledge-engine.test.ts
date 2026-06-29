// ==========================================================================
// Kadarn Knowledge Engine — Unit Tests
// ==========================================================================
// Tests cover: exact match, synonym resolution, fuzzy match, unknown terms,
// query expansion, hierarchy resolution.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  normalizeTerm,
  getSynonyms,
  expandQuery,
  getHierarchy,
} from '../packages/knowledge-engine/src/engine.js';

import type {
  OntologyTerm,
  OntologySynonym,
} from '../packages/knowledge-engine/src/types.js';

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

const specimenTerms: OntologyTerm[] = [
  { id: 't-1', vocabulary: 'specimen_type', preferredLabel: 'whole_blood', displayName: 'Whole Blood', sortOrder: 1 },
  { id: 't-2', vocabulary: 'specimen_type', preferredLabel: 'plasma', displayName: 'Plasma', sortOrder: 2 },
  { id: 't-3', vocabulary: 'specimen_type', preferredLabel: 'ffpe', displayName: 'FFPE Tissue', sortOrder: 3 },
  { id: 't-4', vocabulary: 'specimen_type', preferredLabel: 'pbmc', displayName: 'PBMC', sortOrder: 4 },
  { id: 't-5', vocabulary: 'specimen_type', preferredLabel: 'serum', displayName: 'Serum', sortOrder: 5, parentId: 't-2' },
];

const specimenSynonyms: OntologySynonym[] = [
  { id: 's-1', termId: 't-1', synonym: 'WB', isAbbreviation: true },
  { id: 's-2', termId: 't-1', synonym: 'Blood (venous)', isAbbreviation: false },
  { id: 's-3', termId: 't-1', synonym: 'EDTA whole blood', isAbbreviation: false },
  { id: 's-4', termId: 't-3', synonym: 'Formalin-fixed paraffin-embedded', isAbbreviation: false },
  { id: 's-5', termId: 't-3', synonym: 'FFPET', isAbbreviation: true },
  { id: 's-6', termId: 't-4', synonym: 'Peripheral blood mononuclear cell', isAbbreviation: false },
];

// --------------------------------------------------------------------------
// normalizeTerm()
// --------------------------------------------------------------------------

describe('normalizeTerm()', () => {
  it('should find exact match by preferred label', () => {
    const result = normalizeTerm('specimen_type', 'whole_blood', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('whole_blood');
    expect(result.displayName).toBe('Whole Blood');
    expect(result.confidence).toBe(1.0);
  });

  it('should be case-insensitive', () => {
    const result = normalizeTerm('specimen_type', 'Whole_Blood', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('whole_blood');
  });

  it('should resolve synonyms', () => {
    const result = normalizeTerm('specimen_type', 'WB', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('whole_blood');
    expect(result.confidence).toBe(0.9);
  });

  it('should resolve longer synonyms', () => {
    const result = normalizeTerm('specimen_type', 'Formalin-fixed paraffin-embedded', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('ffpe');
  });

  it('should resolve abbreviation synonyms', () => {
    const result = normalizeTerm('specimen_type', 'FFPET', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('ffpe');
  });

  it('should fuzzy match with Levenshtein distance ≤ 2', () => {
    // "plasma" with small typo → "plasma" (distance 1: replace 's' with 'z')
    const result = normalizeTerm('specimen_type', 'plazma', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('plasma');
    expect(result.confidence).toBe(0.7);
  });

  it('should pass through unknown terms', () => {
    const result = normalizeTerm('specimen_type', 'unknown_specimen_type', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(false);
    expect(result.normalized).toBe('unknown_specimen_type');
    expect(result.confidence).toBe(0);
  });

  it('should not fuzzy match with distance > 2', () => {
    const result = normalizeTerm('specimen_type', 'something_completely_different', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(false);
  });

  it('should handle empty string', () => {
    const result = normalizeTerm('specimen_type', '', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(false);
    expect(result.normalized).toBe('');
  });

  it('should handle whitespace padding', () => {
    const result = normalizeTerm('specimen_type', '  whole_blood  ', specimenTerms, specimenSynonyms);
    expect(result.found).toBe(true);
    expect(result.normalized).toBe('whole_blood');
  });
});

// --------------------------------------------------------------------------
// getSynonyms()
// --------------------------------------------------------------------------

describe('getSynonyms()', () => {
  it('should return all synonyms for a term', () => {
    const synonyms = getSynonyms('t-1', specimenSynonyms);
    expect(synonyms).toHaveLength(3);
    expect(synonyms).toContain('WB');
    expect(synonyms).toContain('Blood (venous)');
    expect(synonyms).toContain('EDTA whole blood');
  });

  it('should return empty array for terms with no synonyms', () => {
    const synonyms = getSynonyms('t-2', specimenSynonyms);
    expect(synonyms).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// expandQuery()
// --------------------------------------------------------------------------

describe('expandQuery()', () => {
  it('should expand a term with its synonyms', () => {
    const result = expandQuery('whole_blood', specimenTerms, specimenSynonyms);
    expect(result.original).toBe('whole_blood');
    expect(result.expanded).toContain('whole_blood');
    expect(result.expanded).toContain('WB');
    expect(result.synonyms).toHaveLength(3);
  });

  it('should return only the original term if no synonyms', () => {
    const result = expandQuery('plasma', specimenTerms, specimenSynonyms);
    expect(result.expanded).toEqual(['plasma']);
    expect(result.synonyms).toHaveLength(0);
  });

  it('should return only the original term if not found', () => {
    const result = expandQuery('nonexistent', specimenTerms, specimenSynonyms);
    expect(result.expanded).toEqual(['nonexistent']);
  });
});

// --------------------------------------------------------------------------
// getHierarchy()
// --------------------------------------------------------------------------

describe('getHierarchy()', () => {
  it('should return parent and children for a term', () => {
    // serum (t-5) has parent plasma (t-2)
    const result = getHierarchy('t-5', specimenTerms);
    expect(result).not.toBeNull();
    expect(result!.parent?.preferredLabel).toBe('plasma');
    expect(result!.children).toHaveLength(0);
  });

  it('should return children for a parent term', () => {
    // plasma (t-2) has child serum (t-5)
    const result = getHierarchy('t-2', specimenTerms);
    expect(result).not.toBeNull();
    expect(result!.parent).toBeNull();
    expect(result!.children).toHaveLength(1);
    expect(result!.children[0].preferredLabel).toBe('serum');
  });

  it('should return null for unknown term', () => {
    const result = getHierarchy('unknown', specimenTerms);
    expect(result).toBeNull();
  });
});
