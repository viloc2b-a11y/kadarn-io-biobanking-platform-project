// ==========================================================================
// FDA Inspection Connector — Public API
// ==========================================================================
// Baseline AF-1.0. Sprint 19.3.
// ==========================================================================

export { ingestFDA } from './pipeline.js';
export { createFDAAdapter, FDA_MANIFEST } from './adapter.js';
export type { FDAApiClient } from './client.js';
export { createMockFDAClient, createFDAClient } from './client.js';
export type {
  FDAInspection, FDAForm483, FDAWarningLetter,
  FDASearchParams, FDAIngestionResult, InspectionClassification,
} from './types.js';
