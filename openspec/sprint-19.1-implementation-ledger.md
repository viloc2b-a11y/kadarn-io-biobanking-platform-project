# Implementation Ledger — Sprint 19.1

## ClinicalTrials.gov Connector

**Sprint:** 19.1  
**Phase:** 1 — Evidence Acquisition  
**Baseline:** AF-1.0  
**Depends on:** Sprint 19.0 (Identity Resolution), ACR-001 (Institution → Site)

---

### Baseline requirements implemented

| Requirement | Source |
|-------------|--------|
| Search CT.gov by institution/site name + location | Sprint 19 spec |
| Extract NCT ID, title, sponsor, condition, facility, status, dates, PI | Sprint 19 spec |
| Call /identity/resolve before creating evidence | Sprint 19 spec |
| Resolved → Class A EvidenceNode linked to SiteIdentity | Sprint 19 spec |
| Unresolved → staging record, no EvidenceNode | Sprint 19 spec |
| Map records to Claims conservatively | Sprint 19 spec |
| Raw CT.gov payload preserved for audit | Sprint 19 spec |
| Duplicate NCT ID idempotency | Sprint 19 spec |
| No Trust terminology | ADR-010 |
| No Confidence computation | ADR-011 |

---

### Files created

| File | Purpose |
|------|---------|
| `packages/evidence-core/src/connectors/clinicaltrials/types.ts` | CT.gov study record, search params, ingestion result |
| `packages/evidence-core/src/connectors/clinicaltrials/client.ts` | CT.gov API client (mockable) |
| `packages/evidence-core/src/connectors/clinicaltrials/pipeline.ts` | Ingestion pipeline: search → resolve → create evidence |
| `packages/evidence-core/src/connectors/clinicaltrials/claim-mapper.ts` | Conservative CT.gov → Claim mapping |
| `packages/evidence-core/src/connectors/clinicaltrials/index.ts` | Public API |
| `tests/connectors/clinicaltrials.test.ts` | Full pipeline tests |

---

### Ingestion pipeline

```
CT.gov API
    │
    ▼
Search by name + location
    │
    ▼
Extract study records
    │
    ▼
Call /identity/resolve per study facility
    ├── Resolved → Create Class A EvidenceNode → link to SiteIdentity
    └── Unresolved → Create UnresolvedEvidence staging record
    │
    ▼
Map to Claims (conservative)
    ├── operational.study_completion_history (if completed)
    ├── operational.patient_recruitment (if recruiting)
    ├── operational.phase_I_capable (if Phase 1)
    └── biospecimen.* ONLY if protocol explicitly mentions biospecimens
```

### Claim mapping rules

| CT.gov signal | Mapped Claim | Condition |
|--------------|-------------|-----------|
| Overall status = "Completed" | operational.study_completion_history | Always |
| Overall status = "Recruiting" | operational.patient_recruitment | Always |
| Phase = "Phase 1" or "Phase 1/Phase 2" | operational.phase_I_experience | Always |
| Protocol mentions "biospecimen", "tissue", "biopsy", "FFPE" | biospecimen.processing.* | Only with explicit protocol evidence |

---

### Tests

| Test | Validates |
|------|-----------|
| Successful ingestion | Study record → EvidenceNode created |
| Identity resolved | EvidenceNode linked to SiteIdentity |
| Identity unresolved | Staging record created, no EvidenceNode |
| Class A assignment | EvidenceClass = A |
| Provenance preserved | source = clinicaltrials.gov, external URL |
| Claim mapping conservative | No biospecimen Claim without protocol evidence |
| Duplicate NCT ID | Idempotent — no duplicate EvidenceNode |
| Raw external ID blocked | No EvidenceNode with CT.gov ID as site FK |
| No Confidence computation | Structural scan |
| No retired terminology | Automated scan |

---

### Definition of Done

| Criteria | Status |
|----------|--------|
| CT.gov connector implemented | ✅ |
| Every record passes through identity resolution | ✅ |
| Resolved records create Class A EvidenceNodes | ✅ |
| Unresolved records go to staging | ✅ |
| No Confidence computation introduced | ✅ |
| Tests pass | ✅ |
