// ==========================================================================
// ClinicalTrials.gov Connector — Public API
// ==========================================================================
// Baseline AF-1.0. Sprint 19.1.
// ==========================================================================

export { ingestClinicalTrials } from './pipeline.js';
export { createCTGovAdapter, CTGOV_MANIFEST } from './adapter.js';
export type { CTGovApiClient } from './client.js';
export { createMockClient, createCTGovClient } from './client.js';
export { mapStudyToClaims } from './claim-mapper.js';
export type { CTGovStudy, CTGovSearchParams, CTGovIngestionResult, IngestedStudy, UnresolvedStudy } from './types.js';
export type {
  IdentityResolver,
  EvidenceNodeCreator,
  UnresolvedStager,
  DuplicateChecker,
} from './pipeline.js';
