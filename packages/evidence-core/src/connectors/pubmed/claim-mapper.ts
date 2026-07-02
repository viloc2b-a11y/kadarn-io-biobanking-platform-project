// ==========================================================================
// PubMed — Conservative Claim Mapper
// ==========================================================================
// Baseline AF-1.0. Sprint 19.2.
//
// Rules:
// - PubMed supports research participation, not operational execution
// - Publication does NOT automatically prove operational capability
// - Biospecimen Claims ONLY if abstract explicitly supports it
// ==========================================================================

import type { PubMedArticle } from './types.js';

const BIOSPECIMEN_KEYWORDS = [
  'biospecimen', 'tissue', 'biopsy', 'ffpe', 'paraffin',
  'frozen section', 'blood draw', 'plasma', 'serum',
  'biobank', 'specimen collection', 'tumor sample',
];

function mentionsBiospecimen(article: PubMedArticle): boolean {
  const searchText = `${article.title} ${article.meshTerms.join(' ')} ${article.publicationType.join(' ')}`.toLowerCase();
  return BIOSPECIMEN_KEYWORDS.some(kw => searchText.includes(kw));
}

function isClinicalStudy(article: PubMedArticle): boolean {
  const clinicalTypes = ['clinical trial', 'clinical study', 'observational study', 'randomized controlled trial'];
  return article.publicationType.some(pt =>
    clinicalTypes.some(ct => pt.toLowerCase().includes(ct)),
  ) || article.referencesClinicalStudy;
}

export interface ClaimMapping {
  claimTypeId: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export function mapArticleToClaims(article: PubMedArticle): ClaimMapping[] {
  const mappings: ClaimMapping[] = [];

  // Publication history — always
  mappings.push({
    claimTypeId: 'biospecimen.operations.study_completion_history',
    confidence: 'medium',
    reason: `PubMed article ${article.pmid} published in ${article.journal}. Supports research publication history.`,
  });

  // Clinical study completion — only if article clearly references a clinical study
  if (isClinicalStudy(article)) {
    mappings.push({
      claimTypeId: 'biospecimen.operations.study_completion_history',
      confidence: 'medium',
      reason: `Article ${article.pmid} is a clinical study publication. Supports study completion history.`,
    });
  }

  // Biospecimen — ONLY if abstract or MeSH terms explicitly mention it
  if (mentionsBiospecimen(article)) {
    mappings.push({
      claimTypeId: 'biospecimen.processing.ffpe',
      confidence: 'low',
      reason: `Article ${article.pmid} mentions biospecimen-related terms. Supports biospecimen capability (low confidence).`,
    });
  }

  return mappings;
}
