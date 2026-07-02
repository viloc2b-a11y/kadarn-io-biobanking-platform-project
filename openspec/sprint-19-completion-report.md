# Sprint 19 Completion Report — Evidence Acquisition

**Date:** 2026-07-01  
**Baseline:** AF-1.0  
**Sprints:** 19.0 → 19.0A → 19.1 → 19.2 → 19.3 → 19.4A → 19.5  

---

## Executive Summary

Sprint 19 completes the **Evidence Acquisition** layer of Kadarn. The platform can now resolve external institutions to canonical identities, ingest public evidence from three major sources, and produce Class A EvidenceNodes linked to operational SiteIdentity records — all through a unified Connector Framework with standardized retry, rate limiting, provenance, idempotency, logging, and metrics.

---

## Test results

| Metric | Value |
|--------|-------|
| Test files | **16** |
| Total tests | **213** |
| Failures | **0** |
| TS errors | **0** |
| Retired terms in source | **0** |

## Connectors implemented

| Connector | Evidence Class | Identity required | CounterEvidence | Source |
|-----------|---------------|-------------------|-----------------|--------|
| ClinicalTrials.gov | A | ✅ | — | Public registry |
| PubMed/NLM | A | ✅ (high confidence only) | — | Publication DB |
| FDA Inspection | A / B (Form 483) | ✅ | OAI + Warning Letters | Government DB |

## Identity Infrastructure

| Component | Status |
|-----------|--------|
| InstitutionIdentity (legal entity) | ✅ ACR-001 |
| SiteIdentity (operational unit) | ✅ ACR-001 |
| InstitutionAlias (Tier 2 matching) | ✅ 19.0A |
| ExternalIdentifierHistory (append-only) | ✅ 19.0A |
| IdentityConfidence (high/medium/low) | ✅ 19.0A |
| 4-tier resolution pipeline | ✅ Tier 1–4 |
| FK enforcement (requireSiteId) | ✅ ACR-001 |

## Connector Framework

| Component | Status |
|-----------|--------|
| EvidenceConnector interface | ✅ All 3 connectors implement it |
| ConnectorOrchestrator | ✅ All ingest runs through it |
| withRetry (exponential backoff) | ✅ |
| RateLimiter (per-source config) | ✅ clinicaltrials:10/s, pubmed:5/s, fda:30/s |
| buildProvenance (standardized) | ✅ |
| InMemoryIdempotencyStore | ✅ |
| MetricsCollector (11 metrics) | ✅ |
| ConnectorLog (per-step audit) | ✅ |

## Validation results

| Invariant | Result |
|-----------|--------|
| Identity resolution mandatory | ✅ All 3 connectors |
| Unresolved → staging | ✅ Never silently discarded |
| EvidenceNodes → SiteIdentity | ✅ No raw external identifiers |
| Provenance complete | ✅ Standardized across connectors |
| Idempotency by sourceRecordId | ✅ Deterministic dedup |
| CounterEvidence for OAI/WL | ✅ Per KEMS-001 §4 |
| No connector bypass | ✅ All use ConnectorOrchestrator |
| No retired terminology | ✅ Verified in all source files |

## Metrics available

| Metric | Source |
|--------|--------|
| `connector_calls` | MetricsCollector |
| `records_found` | MetricsCollector |
| `records_resolved` | MetricsCollector |
| `records_staged` | MetricsCollector |
| `evidence_created` | MetricsCollector |
| `counter_evidence_created` | MetricsCollector |
| `duplicates_skipped` | MetricsCollector |
| `identity_success_rate` | MetricsCollector |
| `duplicate_rate` | MetricsCollector |
| `ingest_latency_ms` | MetricsCollector |
| `connector_error_rate` | MetricsCollector |

## Risks and open items

| Risk | Severity | Mitigation |
|------|----------|------------|
| PubMed affiliation strings are weak identity signals | Medium | Only high-confidence resolves auto-ingest; medium/low → staging |
| CT.gov API rate limits (10 req/s) | Low | RateLimiter enforces per-source config |
| FDA data quality varies by inspection district | Low | Raw payload preserved for audit; manual review queue available |
| IQVIA Site Intelligence competitive position | Low | Marked as open item in Competitive Boundary doc |
| No production database backing identity store | Medium | In-memory for Sprint 19; migration required for Sprint 20 |

---

## Evidence Core — full state

```
packages/evidence-core/
├── src/
│   ├── types.ts, evidence-class.ts, claim.ts, evidence-node.ts,
│   │   evidence-relationship.ts, counter-evidence.ts,
│   │   right-of-response.ts, confidence-state.ts,
│   │   evidence-graph.ts, provenance.ts, visibility.ts,
│   │   temporal.ts, invariants.ts
│   ├── db.ts, repository.ts, audit.ts
│   ├── lifecycle.ts
│   ├── boundary.ts (ADR-011)
│   ├── api.ts, schemas.ts
│   ├── explainability.ts
│   ├── graph.ts
│   ├── evaluation.ts, evaluators.ts, policy.ts
│   ├── output.ts
│   ├── identity/ (types, resolver, conflicts)
│   └── connectors/
│       ├── framework/ (types, retry, rate-limiter, provenance,
│       │               idempotency, orchestrator, metrics)
│       ├── clinicaltrials/ (client, adapter, claim-mapper)
│       ├── pubmed/ (client, adapter, claim-mapper)
│       └── fda/ (client, adapter)
├── tests/ (16 files, 213 tests)
└── database/migrations/045_evidence_core.sql
```

---

## Sprint 20 authorized

**Evidence Onboarding MVP** is the next program increment.

Objective: validate that Kadarn can transform real public evidence into useful Confidence Graphs for real sites.

Scope:
1. Create 5–10 real SiteIdentity records (pilot institutions)
2. Run CT.gov, PubMed, FDA connectors against real searches for those sites
3. Generate first real Evidence Graphs
4. Review staging/unresolved records
5. Validate that Confidence Reports produce meaningful output
6. Produce first internal Evidence Passport per site
7. No new connectors
8. No sponsor UI yet

---

*This report closes Sprint 19. Baseline AF-1.0 remains in effect. All Phase 1 contracts are fulfilled.*
