// ==========================================================================
// PubMed — Mockable API Client
// ==========================================================================
// Baseline AF-1.0. Sprint 19.2.
// ==========================================================================

import type { PubMedArticle, PubMedSearchParams } from './types.js';

export interface PubMedApiClient {
  searchByInstitution(params: PubMedSearchParams): Promise<PubMedArticle[]>;
  getArticleByPmid(pmid: string): Promise<PubMedArticle | null>;
}

export function createMockPubMedClient(mockArticles: PubMedArticle[]): PubMedApiClient {
  return {
    async searchByInstitution(params: PubMedSearchParams): Promise<PubMedArticle[]> {
      const name = params.institutionName.toLowerCase();
      return mockArticles.filter(a => {
        const affiliationMatch = a.affiliations.some(af => af.toLowerCase().includes(name));
        const authorMatch = !params.investigatorName ||
          a.authors.some(au => au.toLowerCase().includes(params.investigatorName!.toLowerCase()));
        return affiliationMatch && authorMatch;
      }).slice(0, params.limit ?? 50);
    },

    async getArticleByPmid(pmid: string): Promise<PubMedArticle | null> {
      return mockArticles.find(a => a.pmid === pmid) ?? null;
    },
  };
}

export function createPubMedClient(baseUrl?: string): PubMedApiClient {
  return createMockPubMedClient([]);
}
