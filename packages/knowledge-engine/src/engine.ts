// ==========================================================================
// Kadarn Knowledge Engine — Normalization Engine
// ==========================================================================
// Pure functions for term normalization, synonym resolution, and query
// expansion. Stateless — all term data is passed in.
// ==========================================================================

import type {
  OntologyTerm,
  OntologySynonym,
  NormalizationResult,
  ExpansionResult,
  VocabularySet,
} from './types.js';

// --------------------------------------------------------------------------
// normalizeTerm — find canonical form for a term
// --------------------------------------------------------------------------
// Strategy:
// 1. Exact match against preferred_label
// 2. Case-insensitive match
// 3. Match against synonyms
// 4. Fuzzy match (Levenshtein distance ≤ 2)
// 5. Pass through unchanged if not found
// --------------------------------------------------------------------------

export function normalizeTerm(
  vocabulary: VocabularySet,
  term: string,
  terms: OntologyTerm[],
  synonyms: OntologySynonym[],
): NormalizationResult {
  const cleaned = term.trim().toLowerCase();

  // 1. Exact match against preferred_label
  const exactMatch = terms.find(
    (t) => t.preferredLabel.toLowerCase() === cleaned,
  );
  if (exactMatch) {
    return {
      original: term,
      normalized: exactMatch.preferredLabel,
      displayName: exactMatch.displayName,
      vocabulary,
      found: true,
      confidence: 1.0,
    };
  }

  // 2. Case-insensitive match
  const caseMatch = terms.find(
    (t) => t.preferredLabel.toLowerCase() === cleaned,
  );
  if (caseMatch) {
    return {
      original: term,
      normalized: caseMatch.preferredLabel,
      displayName: caseMatch.displayName,
      vocabulary,
      found: true,
      confidence: 0.95,
    };
  }

  // 3. Match against synonyms
  const synonymTermId = findTermBySynonym(synonyms, cleaned);
  if (synonymTermId) {
    const matchedTerm = terms.find((t) => t.id === synonymTermId);
    if (matchedTerm) {
      return {
        original: term,
        normalized: matchedTerm.preferredLabel,
        displayName: matchedTerm.displayName,
        vocabulary,
        found: true,
        confidence: 0.9,
      };
    }
  }

  // 4. Fuzzy match (Levenshtein distance)
  const fuzzyMatch = fuzzySearch(terms, cleaned);
  if (fuzzyMatch) {
    return {
      original: term,
      normalized: fuzzyMatch.preferredLabel,
      displayName: fuzzyMatch.displayName,
      vocabulary,
      found: true,
      confidence: 0.7,
    };
  }

  // 5. Not found — pass through
  return {
    original: term,
    normalized: term,
    vocabulary,
    found: false,
    confidence: 0,
  };
}

// --------------------------------------------------------------------------
// getSynonyms — get all synonyms for a term
// --------------------------------------------------------------------------

export function getSynonyms(
  termId: string,
  allSynonyms: OntologySynonym[],
): string[] {
  return allSynonyms
    .filter((s) => s.termId === termId)
    .map((s) => s.synonym);
}

// --------------------------------------------------------------------------
// expandQuery — expand a term with synonyms
// --------------------------------------------------------------------------

export function expandQuery(
  term: string,
  terms: OntologyTerm[],
  allSynonyms: OntologySynonym[],
): ExpansionResult {
  const matchedTerm = terms.find(
    (t) => t.preferredLabel.toLowerCase() === term.toLowerCase(),
  );

  if (!matchedTerm) {
    return { original: term, expanded: [term], synonyms: [] };
  }

  const synonyms = getSynonyms(matchedTerm.id, allSynonyms);

  return {
    original: term,
    expanded: [matchedTerm.preferredLabel, ...synonyms],
    synonyms,
  };
}

// --------------------------------------------------------------------------
// getHierarchy — get parent/child relationships
// --------------------------------------------------------------------------

export interface HierarchyResult {
  term: OntologyTerm;
  parent: OntologyTerm | null;
  children: OntologyTerm[];
}

export function getHierarchy(
  termId: string,
  allTerms: OntologyTerm[],
): HierarchyResult | null {
  const term = allTerms.find((t) => t.id === termId);
  if (!term) return null;

  const parent = term.parentId
    ? allTerms.find((t) => t.id === term.parentId) ?? null
    : null;

  const children = allTerms.filter((t) => t.parentId === termId);

  return { term, parent, children };
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function findTermBySynonym(
  synonyms: OntologySynonym[],
  query: string,
): string | null {
  const match = synonyms.find((s) => s.synonym.toLowerCase() === query);
  return match?.termId ?? null;
}

function fuzzySearch(
  terms: OntologyTerm[],
  query: string,
): OntologyTerm | null {
  let bestMatch: OntologyTerm | null = null;
  let bestDistance = 3; // max Levenshtein distance

  for (const term of terms) {
    const dist = levenshteinDistance(
      term.preferredLabel.toLowerCase(),
      query,
    );
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = term;
    }
  }

  return bestMatch;
}

/**
 * Levenshtein distance between two strings.
 * Minimal edit distance (insertions, deletions, substitutions).
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return dp[m][n];
}
