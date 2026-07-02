# Implementation Ledger — Sprint 19.5

## Evidence Acquisition Validation

**Sprint:** 19.5  
**Phase:** 1 — Evidence Acquisition  
**Baseline:** AF-1.0  
**Role:** Implementation engineer. No new connectors. No new architecture.

---

### Baseline requirements validated

| Requirement | Source | Validated? |
|-------------|--------|------------|
| Identity resolution is mandatory for all connectors | Sprint 19 spec | ✅ |
| Unresolved records always go to staging | Sprint 19 spec | ✅ |
| EvidenceNodes only created with valid SiteIdentity | ACR-001 | ✅ |
| Provenance is complete and standardized | Sprint 19.4A | ✅ |
| sourceRecordId idempotency across all connectors | Sprint 19.4A | ✅ |
| Duplicate records skipped deterministically | Sprint 19 spec | ✅ |
| Connector logs are complete | Sprint 19.4A | ✅ |
| Class A evidence mapping is consistent | KEMS-001 §3 | ✅ |
| CounterEvidence for FDA OAI / Warning Letters | KEMS-001 §4 | ✅ |
| No connector bypasses ConnectorOrchestrator | Sprint 19.4A | ✅ |
| No retired terminology | ADR-010 | ✅ |

---

### Files created

| File | Purpose |
|------|---------|
| `packages/evidence-core/src/connectors/framework/metrics.ts` | Metrics module — counters, rates, latency |
| `packages/evidence-core/tests/connectors/validation.test.ts` | Unified validation harness for all 3 connectors |

---

### Metrics module

| Metric | Type | Description |
|--------|------|-------------|
| `connector_calls` | Counter | Total connector invocations |
| `records_found` | Counter | Total records found by search |
| `records_resolved` | Counter | Records with high-confidence identity |
| `records_staged` | Counter | Records staged due to low identity confidence |
| `evidence_created` | Counter | EvidenceNodes created |
| `counter_evidence_created` | Counter | CounterEvidence nodes created |
| `duplicates_skipped` | Counter | Duplicate records skipped |
| `identity_success_rate` | Gauge | ratio records_resolved / records_found |
| `duplicate_rate` | Gauge | ratio duplicates_skipped / records_found |
| `ingest_latency_ms` | Histogram | Per-ingest latency |
| `connector_error_rate` | Gauge | ratio errors / records_found |

---

### Validation tests

| Test | What it validates |
|------|-------------------|
| CT.gov → identity required | identityRequired=true enforced |
| PubMed → identity required | identityRequired=true enforced |
| FDA → identity required | identityRequired=true enforced |
| Unresolved → staging | All connectors stage unresolved |
| EvidenceNode → SiteIdentity | All EvidenceNodes reference siteId |
| Provenance structure | createdByActorId, correlationId, summary |
| Idempotency | Same record ingested once |
| CounterEvidence: FDA OAI | OAI creates CounterEvidence |
| CounterEvidence: FDA Warning Letter | WL creates CounterEvidence |
| No bypass | All connectors implement EvidenceConnector |
| Class A mapping | CT.gov, FDA Class A assigned correctly |
| Connector logs emitted | Every step produces a log entry |
| Metrics collected | All metrics populated after ingest |

---

### Definition of Done

| Criteria | Status |
|----------|--------|
| CT.gov, PubMed, FDA pass same validation harness | ✅ |
| All connectors use ConnectorOrchestrator | ✅ |
| All EvidenceNodes reference SiteIdentity | ✅ |
| Unresolved records are staged | ✅ |
| Provenance is complete | ✅ |
| Idempotency works | ✅ |
| Metrics are emitted | ✅ |
| Tests pass | ✅ |
| **Sprint 19 complete** | **✅** |
