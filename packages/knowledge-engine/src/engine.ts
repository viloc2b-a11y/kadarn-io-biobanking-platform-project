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
  HierarchyResult,
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
  input: string,
  allTerms: OntologyTerm[],
  allSynonyms: OntologySynonym[],
): NormalizationResult {
  const trimmed = input.trim();

  // 1. Exact match against preferred_label
  const exact = allTerms.find(
    (t) => t.vocabulary === vocabulary && t.preferredLabel === trimmed,
  );
  if (exact) return { original: trimmed, normalized: exact.preferredLabel, displayName: exact.displayName, vocabulary, found: true, confidence: 1.0 };

  // 2. Case-insensitive match
  const caseInsensitive = allTerms.find(
    (t) => t.vocabulary === vocabulary && t.preferredLabel.toLowerCase() === trimmed.toLowerCase(),
  );
  if (caseInsensitive) return { original: trimmed, normalized: caseInsensitive.preferredLabel, displayName: caseInsensitive.displayName, vocabulary, found: true, confidence: 0.95 };

  // 3. Match against synonyms
  const synMatch = allSynonyms.find((s) => s.synonym.toLowerCase() === trimmed.toLowerCase());
  if (synMatch) {
    const term = allTerms.find((t) => t.id === synMatch.termId);
    if (term) return { original: trimmed, normalized: term.preferredLabel, displayName: term.displayName, vocabulary, found: true, confidence: 0.9 };
  }

  // 4. Fuzzy match (Levenshtein distance ≤ 2)
  const fuzzy = allTerms
    .filter((t) => t.vocabulary === vocabulary)
    .map((t) => ({ term: t, dist: levenshtein(trimmed.toLowerCase(), t.preferredLabel.toLowerCase()) }))
    .filter((x) => x.dist <= 2)
    .sort((a, b) => a.dist - b.dist)[0];
  if (fuzzy) return { original: trimmed, normalized: fuzzy.term.preferredLabel, displayName: fuzzy.term.displayName, vocabulary, found: true, confidence: 0.7 };

  // 5. Pass through
  return { original: trimmed, normalized: trimmed, vocabulary, found: false, confidence: 0 };
}

// --------------------------------------------------------------------------
// expandQuery — expand a query with synonyms and related terms
// --------------------------------------------------------------------------

export function expandQuery(
  termIdOrLabel: string,
  allTerms: OntologyTerm[],
  allSynonyms: OntologySynonym[],
): ExpansionResult {
  // Match by ID first, then by preferredLabel
  const term = allTerms.find((t) => t.id === termIdOrLabel || t.preferredLabel === termIdOrLabel);
  if (!term) return { original: termIdOrLabel, expanded: [termIdOrLabel], synonyms: [] };

  const synonyms = allSynonyms
    .filter((s) => s.termId === term.id)
    .map((s) => s.synonym);

  // Children are not included automatically — only direct synonyms + the term itself
  const expanded = [term.preferredLabel, ...synonyms];

  return { original: term.preferredLabel, expanded, synonyms };
}

// --------------------------------------------------------------------------
// getSynonyms — get all synonym strings for a term
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
// getHierarchy — get parent/child relationships
// --------------------------------------------------------------------------

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
// getTermsByVocabulary — get all terms in a vocabulary set
// --------------------------------------------------------------------------

export function getTermsByVocabulary(
  vocabulary: VocabularySet,
  allTerms: OntologyTerm[],
): OntologyTerm[] {
  return allTerms.filter((t) => t.vocabulary === vocabulary);
}

// --------------------------------------------------------------------------
// levenshtein — compute edit distance between two strings
// --------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
