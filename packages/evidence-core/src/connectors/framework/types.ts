// ==========================================================================
// Connector Framework — Core Interface & Types
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
//
// Every external evidence connector implements this interface.
// No connector may bypass the framework.
// ==========================================================================

import type { IdentityResolution } from '../../identity/types.js';

// --------------------------------------------------------------------------
// Connector Manifest
// --------------------------------------------------------------------------

export interface ConnectorManifest {
  /** Connector name (e.g. 'clinicaltrials') */
  name: string;
  /** Evidence Class this connector produces */
  evidenceClass: 'A' | 'B';
  /** Whether identity resolution is required before ingest */
  identityRequired: boolean;
  /** Whether incremental sync is supported */
  supportsIncremental: boolean;
  /** Whether retry is supported */
  supportsRetry: boolean;
  /** Whether historical backfill is supported */
  supportsBackfill: boolean;
  /** Whether webhooks are supported */
  supportsWebhook: boolean;
  /** Human-readable description */
  description: string;
}

// --------------------------------------------------------------------------
// Connector search params
// --------------------------------------------------------------------------

export interface ConnectorSearchParams {
  institutionName?: string;
  investigatorName?: string;
  fei?: string;
  externalId?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  maxResults?: number;
}

// --------------------------------------------------------------------------
// External record (raw data from source)
// --------------------------------------------------------------------------

export interface ExternalRecord {
  /** Source-specific identifier (NCT ID, PMID, FEI, etc.) */
  sourceRecordId: string;
  /** Human-readable content summary */
  content: string;
  /** Source name */
  source: string;
  /** Date of this record */
  date: string;
  /** Institution name as recorded by the source */
  institutionName: string;
  /** Institution city */
  institutionCity: string;
  /** Institution state */
  institutionState: string;
  /** Institution country */
  institutionCountry: string;
  /** Optional structured attributes (evaluation layer consumes these) */
  attributes: Record<string, unknown>;
  /** Raw payload preserved for audit */
  rawPayload: Record<string, unknown>;
  /** External URL */
  externalUrl: string;
  /** Whether this record represents a negative finding (→ CounterEvidence) */
  isNegativeFinding: boolean;
}

// --------------------------------------------------------------------------
// Normalized record (after identity resolution)
// --------------------------------------------------------------------------

export interface NormalizedRecord {
  /** Source-specific identifier */
  sourceRecordId: string;
  /** Kadarn site ID (resolved) */
  siteId: string;
  /** Evidence Class */
  evidenceClass: 'A' | 'B';
  /** Human-readable content */
  content: string;
  /** Source */
  source: string;
  /** Date */
  date: string;
  /** Whether this should be CounterEvidence instead of EvidenceNode */
  isCounterEvidence: boolean;
  /** Provenance */
  provenance: {
    createdByActorId: string;
    createdByOrganizationId: string;
    correlationId: string;
    summary: string;
  };
  /** Raw payload */
  rawPayload: Record<string, unknown>;
  /** External URL */
  externalUrl: string;
}

// --------------------------------------------------------------------------
// Ingest result
// --------------------------------------------------------------------------

export interface ConnectorIngestResult {
  totalFound: number;
  ingested: number;
  counterEvidenceCreated: number;
  unresolved: number;
  duplicatesSkipped: number;
  errors: number;
  ingestedAt: string;
}

// --------------------------------------------------------------------------
// Connector interface — all connectors implement this
// --------------------------------------------------------------------------

export interface EvidenceConnector {
  /** Connector manifest */
  manifest: ConnectorManifest;

  /** Search the external source for records */
  search(params: ConnectorSearchParams): Promise<ExternalRecord[]>;

  /** Fetch a single record by source ID */
  fetch(sourceRecordId: string): Promise<ExternalRecord | null>;

  /** Normalize an external record into Kadarn's model */
  normalize(record: ExternalRecord, resolution: IdentityResolution | null): NormalizedRecord;

  /** Map a normalized record to a Claim type ID (optional — returns null if no mapping) */
  mapToClaim?(record: NormalizedRecord): string | null;

  /** Callback for after-ingest processing */
  onIngested?(result: ConnectorIngestResult): Promise<void>;
}
