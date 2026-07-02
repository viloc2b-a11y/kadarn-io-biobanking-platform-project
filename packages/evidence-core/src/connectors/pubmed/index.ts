// ==========================================================================
// PubMed Connector — Public API
// ==========================================================================
// Baseline AF-1.0. Sprint 19.2.
// ==========================================================================

export { ingestPubMed } from './pipeline.js';
export { createPubMedAdapter, PUBMED_MANIFEST } from './adapter.js';
export type { PubMedApiClient } from './client.js';
export { createMockPubMedClient, createPubMedClient } from './client.js';
export { mapArticleToClaims } from './claim-mapper.js';
export type { PubMedArticle, PubMedSearchParams, PubMedIngestionResult, IngestedArticle, StagedArticle } from './types.js';
