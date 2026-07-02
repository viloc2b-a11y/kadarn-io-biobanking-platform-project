# Implementation Ledger — Sprint 17.3

## Evidence Core Lifecycle

**Sprint:** 17.3  
**Baseline:** AF-1.0  
**Role:** Implementer. No new concepts.  
**Uses:** Sprint 17.1 (domain model) + Sprint 17.2 (persistence)

---

### Baseline requirements implemented

| Requirement | Source |
|-------------|--------|
| Create Claim with provenance | KEMS-001 §1 |
| Submit Evidence Node (immutable) | KEMS-001 §2 Component B |
| Link Evidence Node to Claim | KEMS-001 §2 Component C |
| Create Evidence Relationship | KEMS-001 §2 Component C |
| Submit Counter Evidence | KEMS-001 §4 |
| Submit Right of Response | KEMS-001 §8 |
| Update process state (disputes/responses) | KEMS-001 §2 Component E |
| Preserve provenance for every action | KEMS-001 §2 Component B |
| Preserve audit trail for every action | ADR-011 condition 2 |
| Enforce immutability (no modification after record) | KEMS-001 §4 |
| Enforce visibility metadata | KEMS-001 §7 |

---

### Files created

| File | Purpose |
|------|---------|
| `packages/evidence-core/src/lifecycle.ts` | Lifecycle service — all create/submit/update operations |
| `packages/evidence-core/src/audit.ts` | Audit trail recorder (append-only event log for lifecycle actions) |
| `packages/evidence-core/tests/lifecycle.test.ts` | Tests for all lifecycle operations + forbidden mutations |

---

### Lifecycle operations

| Operation | Invariants enforced |
|-----------|-------------------|
| `createClaim` | Provenance recorded. Valid evidence classes. |
| `submitEvidence` | Immutable after creation. Provenance + visibility metadata. |
| `linkEvidenceToClaim` | Relationship created. No self-reference. |
| `submitCounterEvidence` | Negative weight enforced. Immutable. |
| `submitRightOfResponse` | Attached to Counter Evidence. Does not modify CE. |
| `updateProcessState` | Only process state — not content. Audit trail preserved. |

---

### Tests

| Test | Validates |
|------|-----------|
| Create claim with provenance | Provenance recorded, claim retrievable |
| Submit evidence node | Node created, immutable |
| Submit counter evidence | Negative weight, immutable |
| Attach right of response | CE unchanged, response linked |
| Link evidence via relationship | Relationship created |
| Update process state | Status changes, content untouched |
| Cannot modify evidence node | Structural invariant |
| Cannot delete evidence node | Structural invariant |
| No confidence computation in lifecycle | Scan |

---

### Definition of Done

| Criteria | Status |
|----------|--------|
| Claim can be created | ✅ |
| Evidence can be submitted and linked | ✅ |
| Counter Evidence can be submitted | ✅ |
| Right of Response can be attached | ✅ |
| Lifecycle state changes are audited | ✅ |
| Provenance preserved | ✅ |
| Evidence immutability enforced | ✅ |
| No Confidence computation | ✅ |
| No APIs or UI | ✅ |
| Tests pass | ✅ |
