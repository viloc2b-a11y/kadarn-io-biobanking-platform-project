// ==========================================================================
// Connector Framework — Orchestrator
// ==========================================================================
// Baseline AF-1.0. Sprint 19.4A.
//
// All connectors run through this orchestrator. No connector may bypass it.
// Flow:
//   search → retry → rate limit → identity resolve → normalize →
//   map → ingest → audit
// ==========================================================================

import type { EvidenceConnector, ConnectorSearchParams, ExternalRecord, NormalizedRecord, ConnectorIngestResult } from './types.js';
import { withRetry } from './retry.js';
import { RateLimiter } from './rate-limiter.js';
import { buildProvenance } from './provenance.js';
import type { IdempotencyStore } from './idempotency.js';
import { InMemoryIdempotencyStore } from './idempotency.js';
import type { IdentityResolution, ExternalIdentifier } from '../../identity/types.js';

export interface OrchestratorDeps {
  identityResolver: {
    resolve(params: { name: string; externalIds: ExternalIdentifier[]; city?: string; state?: string; country?: string }): Promise<IdentityResolution>;
  };
  evidenceCreator: {
    createEvidenceNode(params: NormalizedRecord): Promise<{ id: string }>;
  };
  counterEvidenceCreator: {
    createCounterEvidence(params: NormalizedRecord): Promise<{ id: string }>;
  };
  stager: {
    stage(params: { externalId: string; sourceName: string; source: string; context: Record<string, unknown> }): Promise<{ stagingId: string }>;
  };
  idempotencyStore?: IdempotencyStore;
  actorId: string;
  organizationId: string;
  correlationId: string;
}

// --------------------------------------------------------------------------
// Log entry
// --------------------------------------------------------------------------

export interface ConnectorLogEntry {
  connector: string;
  phase: string;
  status: 'ok' | 'error' | 'skipped';
  detail: string;
  timestamp: string;
}

export class ConnectorOrchestrator {
  private rateLimiters = new Map<string, RateLimiter>();
  private logs: ConnectorLogEntry[] = [];
  private idempotencyStore: IdempotencyStore;

  constructor(private deps: OrchestratorDeps) {
    this.idempotencyStore = deps.idempotencyStore ?? new InMemoryIdempotencyStore();
  }

  private log(connector: string, phase: string, status: 'ok' | 'error' | 'skipped', detail: string): void {
    this.logs.push({ connector, phase, status, detail, timestamp: new Date().toISOString() });
  }

  getLogs(): ConnectorLogEntry[] {
    return [...this.logs];
  }

  async ingest(connector: EvidenceConnector, params: ConnectorSearchParams): Promise<ConnectorIngestResult> {
    const sourceName = connector.manifest.name;
    const rateLimiter = this.getRateLimiter(sourceName);

    let totalFound = 0;
    let ingested = 0;
    let counterEvidenceCreated = 0;
    let unresolved = 0;
    let duplicatesSkipped = 0;
    let errors = 0;

    this.log(sourceName, 'search', 'ok', `Searching ${sourceName} with ${JSON.stringify(params)}`);

    // 1. Search (with retry + rate limit)
    let records: ExternalRecord[];
    try {
      await rateLimiter.acquire();
      records = await withRetry(() => connector.search(params));
      totalFound = records.length;
      this.log(sourceName, 'search', 'ok', `Found ${totalFound} records`);
    } catch (err) {
      this.log(sourceName, 'search', 'error', `Search failed: ${err}`);
      throw err;
    }

    // 2. Process each record
    for (const record of records) {
      // 3. Idempotency check
      if (await this.idempotencyStore.isImported(record.sourceRecordId)) {
        duplicatesSkipped++;
        this.log(sourceName, 'dedup', 'skipped', `Duplicate: ${record.sourceRecordId}`);
        continue;
      }

      // 4. Identity resolution
      let resolution: IdentityResolution | null = null;
      if (connector.manifest.identityRequired) {
        await rateLimiter.acquire();
        try {
          resolution = await this.deps.identityResolver.resolve({
            name: record.institutionName,
            externalIds: [{ type: sourceName as any, value: record.sourceRecordId, label: record.sourceRecordId, confidence: 'high', verifiedAt: null, verifiedBy: 'automated' }],
            city: record.institutionCity,
            state: record.institutionState,
            country: record.institutionCountry,
          });
        } catch (err) {
          this.log(sourceName, 'identity', 'error', `Identity resolution failed for ${record.sourceRecordId}: ${err}`);
          errors++;
          continue;
        }

        this.log(sourceName, 'identity', 'ok', `Identity resolved: ${record.sourceRecordId} → ${resolution?.site?.siteId ?? 'unknown'}`);

      if (!resolution || resolution.identityConfidence !== 'high' || !resolution.institution || !resolution.site) {
          // Stage unresolved
          await rateLimiter.acquire();
          try {
            await this.deps.stager.stage({
              externalId: record.sourceRecordId,
              sourceName: record.institutionName,
              source: sourceName,
              context: { sourceRecordId: record.sourceRecordId, rawPayload: record.rawPayload },
            });
          } catch { /* continue */ }
          unresolved++;
          this.log(sourceName, 'identity', 'skipped', `Unresolved: ${record.sourceRecordId}`);
          continue;
        }
      }

      // 5. Normalize
      let normalized: NormalizedRecord;
      try {
        normalized = connector.normalize(record, resolution);
      } catch (err) {
        this.log(sourceName, 'normalize', 'error', `Normalization failed for ${record.sourceRecordId}: ${err}`);
        errors++;
        continue;
      }

      // 6. Ingest
      try {
        if (record.isNegativeFinding) {
          await rateLimiter.acquire();
          await this.deps.counterEvidenceCreator.createCounterEvidence(normalized);
          counterEvidenceCreated++;
        } else {
          await rateLimiter.acquire();
          await this.deps.evidenceCreator.createEvidenceNode(normalized);
          ingested++;
        }
      } catch (err) {
        this.log(sourceName, 'ingest', 'error', `Ingest failed for ${record.sourceRecordId}: ${err}`);
        errors++;
        continue;
      }

      await this.idempotencyStore.markImported(record.sourceRecordId);
      this.log(sourceName, 'ingest', 'ok', `Ingested: ${record.sourceRecordId}`);
    }

    // 7. Callback
    const result: ConnectorIngestResult = {
      totalFound, ingested, counterEvidenceCreated, unresolved, duplicatesSkipped, errors,
      ingestedAt: new Date().toISOString(),
    };

    if (connector.onIngested) {
      await connector.onIngested(result);
    }

    this.log(sourceName, 'done', 'ok', `Completed: ${ingested} ingested, ${counterEvidenceCreated} CE, ${unresolved} unresolved, ${duplicatesSkipped} dupes, ${errors} errors`);

    return result;
  }

  private getRateLimiter(source: string): RateLimiter {
    if (!this.rateLimiters.has(source)) {
      this.rateLimiters.set(source, new RateLimiter(source));
    }
    return this.rateLimiters.get(source)!;
  }
}
