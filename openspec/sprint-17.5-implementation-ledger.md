# Implementation Ledger — Sprint 17.5

## Internal Evidence Core APIs

**Sprint:** 17.5  
**Baseline:** AF-1.0  
**Role:** Implementer. No new concepts.  
**Uses:** Sprint 17.1 (domain), 17.2 (persistence), 17.3 (lifecycle), 17.4 (boundary)

---

### Baseline requirements implemented

| Requirement | Source |
|-------------|--------|
| createClaim API | KEMS-001 §1 |
| submitEvidence API | KEMS-001 §2 |
| submitCounterEvidence API | KEMS-001 §4 |
| submitRightOfResponse API | KEMS-001 §8 |
| createEvidenceRelationship API | KEMS-001 §2 Component C |
| updateProcessState API | KEMS-001 §2 |
| queryEvidenceGraph API | KEMS-001 §2 |
| queryClaimEvidence API | KEMS-001 §2 |
| Request/response validation (Zod) | Engineering standard |
| Boundary enforcement on all APIs | ADR-011 |

---

### Files created

| File | Purpose |
|------|---------|
| `packages/evidence-core/src/schemas.ts` | Zod validation schemas for all API inputs |
| `packages/evidence-core/src/api.ts` | Internal API contracts — request/response types + service adapters |
| `apps/api/src/app/api/v1/evidence-core/claims/route.ts` | POST createClaim, GET queryClaims |
| `apps/api/src/app/api/v1/evidence-core/evidence/route.ts` | POST submitEvidence, GET queryEvidence |
| `apps/api/src/app/api/v1/evidence-core/counter-evidence/route.ts` | POST submitCounterEvidence |
| `apps/api/src/app/api/v1/evidence-core/responses/route.ts` | POST submitRightOfResponse |
| `apps/api/src/app/api/v1/evidence-core/relationships/route.ts` | POST createRelationship |
| `apps/api/src/app/api/v1/evidence-core/process-state/route.ts` | POST updateProcessState |
| `packages/evidence-core/tests/api.test.ts` | Tests for all API contracts |

---

### API operations

| Operation | Method | Path | Calls lifecycle |
|-----------|--------|------|----------------|
| createClaim | POST | /api/v1/evidence-core/claims | createClaim |
| queryClaims | GET | /api/v1/evidence-core/claims | getClaimById |
| submitEvidence | POST | /api/v1/evidence-core/evidence | submitEvidence |
| queryEvidence | GET | /api/v1/evidence-core/evidence | getEvidenceNodesByClaim |
| submitCounterEvidence | POST | /api/v1/evidence-core/counter-evidence | submitCounterEvidence |
| submitRightOfResponse | POST | /api/v1/evidence-core/responses | submitRightOfResponse |
| createRelationship | POST | /api/v1/evidence-core/relationships | insertRelationship |
| updateProcessState | POST | /api/v1/evidence-core/process-state | updateProcessState |

---

### Boundary compliance

| API | Store | Provenance | Relations | Access | Process | Core? |
|-----|-------|------------|-----------|--------|---------|-------|
| createClaim | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| submitEvidence | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| submitCounterEvidence | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| submitRightOfResponse | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| createRelationship | ✅ | ✅ | ✅ | — | — | ✅ |
| updateProcessState | ✅ | ✅ | — | — | ✅ | ✅ |

---

### Tests

| Test | Validates |
|------|-----------|
| createClaim API | Request/response, validation, boundary |
| submitEvidence API | Request/response, validation, boundary |
| submitCounterEvidence API | Negative weight, immutable |
| submitRightOfResponse API | CE unchanged, response linked |
| createRelationship API | Relationship created, no self-ref |
| updateProcessState API | Validates status transitions |
| Zod schemas reject invalid input | Validation |
| No forbidden operations in APIs | Structural scan |
| No retired terminology | Automated scan |

---

### Sprint 17 completion

| Increment | Status | Tests |
|-----------|--------|-------|
| 17.1 Domain Model | ✅ | 21 |
| 17.2 Persistence | ✅ | 28 |
| 17.3 Lifecycle | ✅ | 42 |
| 17.4 Boundary | ✅ | 59 |
| 17.5 Internal APIs | ✅ | +14 = 73 |
| **Total** | **✅** | **73** |
