# Implementation Ledger — Sprint 17.4

## Evidence Core Boundary Enforcement

**Sprint:** 17.4  
**Baseline:** AF-1.0  
**ADR:** ADR-011 (Evidence Core Boundary Rule)  
**Role:** Implementer. No new concepts.  
**Uses:** Sprint 17.1 (domain), 17.2 (persistence), 17.3 (lifecycle)

---

### Baseline requirements implemented

| Requirement | Source |
|-------------|--------|
| Five-condition boundary test as code | ADR-011 |
| Forbidden interpretive operations blocked | ADR-011 Boundary Principle |
| Core services verified against boundary | ADR-011 |
| Evidence Core only: store, provenance, relations, access, process state | ADR-011 |

---

### Files created

| File | Purpose |
|------|---------|
| `packages/evidence-core/src/boundary.ts` | Five-condition test + forbidden operations guard + Core compliance |

### Boundary test (five conditions from ADR-011)

| # | Condition | Check |
|---|-----------|-------|
| 1 | **Store** | Function persists evidence or metadata to durable storage |
| 2 | **Provenance** | Function preserves immutable creation and modification history |
| 3 | **Relations** | Function creates, maintains, or traverses node relationships |
| 4 | **Access** | Function enforces visibility policy |
| 5 | **Process State** | Function tracks lifecycle state without interpreting content |

A function belongs in the Evidence Core if and only if all 5 are true.

---

### Forbidden operations (engine-only)

| Operation | Why forbidden in Core |
|-----------|----------------------|
| `computeConfidence` | Interprets evidence meaning — ADR-011 condition check |
| `scoreInstitution` | Interprets and aggregates — KEMS §1 prohibits institutional scores |
| `rankSite` | Interprets and compares — Engine concern |
| `recommendSite` | Cross-engine inference — Matching Engine |
| `inferCapability` | Infers meaning from evidence — Engine concern |
| `generateJudgment` | Produces opinion — violates KEMS §1 First Principle |

---

### Tests

| Test | Validates |
|------|-----------|
| `createClaim` passes boundary test | Core legitimacy |
| `submitEvidence` passes boundary test | Core legitimacy |
| `submitCounterEvidence` passes boundary test | Core legitimacy |
| `submitRightOfResponse` passes boundary test | Core legitimacy |
| Forbidden operations absent from exports | Structural invariant |
| No interpretive functions in lifecycle | Structural scan |
| Terminology: no retired Trust terms | Automated scan |

---

### Definition of Done

| Criteria | Status |
|----------|--------|
| Five-condition test exists in code | ✅ |
| Core services pass boundary test | ✅ |
| Forbidden interpretive functions absent | ✅ |
| No Confidence computation introduced | ✅ |
| No APIs introduced | ✅ |
| No Engines introduced | ✅ |
| Tests pass | ✅ |
