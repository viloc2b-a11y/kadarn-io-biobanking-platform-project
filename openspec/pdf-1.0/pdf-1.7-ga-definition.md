# PDF-1.7 — GA Definition (Kadarn 1.0)

**Sprint:** PDF-1.7  
**Gate:** GA Criteria Approved  
**Status:** Draft for approval  
**Sign-off roles:** Product, Architecture, Operations

Defines what **General Availability (GA)** means for Kadarn 1.0 — distinct from RC-1 (installable) and RC-2 (operationally proven).

---

## What GA means

**Kadarn 1.0 GA** is the state where:

1. Product definition is frozen (PDF-1.0 approved)
2. Core capabilities marked GA in PDF-1.2 are production-proven
3. Stable APIs (PDF-1.3) are contract-frozen and documented
4. Supported workflows (PDF-1.4) execute end-to-end in production
5. Enterprise readiness baseline (AF-4.0) is fully certified — not conditional
6. An independent operator can install, validate, and operate without author assistance (RC-1 + RC-2)

GA is **not** "all code merged." GA is **product + operations proven in production**.

---

## GA blockers (required before GA 1.0 — not RC-1)

These items **do not block RC-1** (Installation & Validation). They **do block GA 1.0**.

| Blocker | Status | Evidence | Notes |
|---------|--------|----------|-------|
| **KEMS-003** — Kadarn Product Constitution | **Required before GA 1.0** | Canonical doc on disk + AF-2.1 ratification | Registered in AF-2.1; **not currently on disk**. Blocks **governance**, not code. Does not block RC-1. |

**RC-1 may proceed** while KEMS-003 ratification is in flight. **GA 1.0 may not** until KEMS-003 is ratified and referenced as authoritative in the product definition.

---

## GA checklist

### A. Product definition

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| A1 | PDF-1.0 Product Definition Freeze approved | PDF-1.8 signed | [ ] |
| A2 | Scope, boundaries, capabilities frozen | PDF-1.1–1.5 | [ ] Draft |
| A3 | Workflows officially documented | PDF-1.4 | [ ] Draft |
| A4 | **KEMS-003 ratified (GA blocker)** | AF-2.1 + on-disk canonical | [ ] **Required before GA** |

### B. Architecture

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| B1 | AF-3.0 architecture freeze maintained | AF-3.0 checklist | [ ] |
| B2 | Published View boundary enforced (ADR-030) | Integration guard + smoke | [x] Staging |
| B3 | Evidence Core frozen (adapters only) | Phase 1 gate | [x] |
| B4 | No Trust Engine surfaces (ADR-010) | Lexicon + CI | [x] |
| B5 | Phase 8 prod cutover executed | Cutover report | [ ] Pending prod |

### C. Evidence core & surfaces

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| C1 | Passport public read validated | Staging smoke | [x] |
| C2 | Institution public profile validated | Staging smoke | [x] |
| C3 | Discovery dashboard + report validated | Staging smoke | [x] |
| C4 | Legacy equivalence gate passed | 28JK 13/13 | [x] |
| C5 | Compatibility Layer sign-off for removal | Post-GA review | [ ] Deferred |

### D. API stability

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| D1 | Official APIs in OpenAPI v1 | openapi-v1.yaml | [x] |
| D2 | SDK covers stable surfaces | @kadarn/sdk smoke | [x] |
| D3 | Unified error envelope + KadarnErrorCode | AF-4.0 S1/S6 | [x] |
| D4 | API Contract Freeze approved | PDF-1.3 sign-off | [ ] |

### E. Documentation

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| E1 | Documentation index approved | PDF-1.6 | [ ] Draft |
| E2 | Release Notes 1.0 published | RC-1 deliverable | [ ] |
| E3 | Deployment / Installation Guide | RC-1 deliverable | [ ] |
| E4 | Operator runbooks complete | AF-4.0 S9 + RC-1 | [ ] Partial |

### F. Security

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| F1 | Security scan — zero high vulnerabilities | AF-4.0 S3 | [x] |
| F2 | Security headers on API + Web | next.config.ts | [x] |
| F3 | Rate limiting on public routes | AF-4.0 S3 | [x] |
| F4 | Security sign-off for GA | AF-4.0 S10 | [ ] Conditional |

### G. Performance

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| G1 | Performance baseline established | AF-4.0 S4 report | [x] |
| G2 | Capacity model documented | AF-4.0 S4 | [x] |
| G3 | Production load validation | RC-2 | [ ] |

### H. Operations

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| H1 | Health / readiness / metrics operational | AF-4.0 S1 | [x] |
| H2 | Backup / restore proven | AF-4.0 S5 | [x] |
| H3 | Rollback procedure documented | AF-4.0 S5 | [x] |
| H4 | SLO/SLA + incident playbooks | AF-4.0 S9 | [x] |
| H5 | RC-1 installation validation passed | RC-1 program | [ ] |
| H6 | RC-2 blind operator test passed | RC-2 program | [ ] |

### I. Validation

| # | Criterion | Evidence | Status |
|---|-----------|----------|--------|
| I1 | Staging cutover PASS | phase-8-staging-cutover-report | [x] |
| I2 | Production cutover PASS | Prod smoke | [ ] |
| I3 | AF-4.0 Enterprise Certification (full) | certification report | [ ] Conditional |
| I4 | Validation sign-off | RC-2 evidence pack | [ ] |

### J. Delivery capabilities — not required for Kadarn 1.0 GA

Individual delivery capabilities are **Planned for 1.x** (PDF-1.2). None block core GA.

| # | Capability | GA required for 1.0? | Status |
|---|------------|----------------------|--------|
| J1 | Delivery Engine | **No** | Planned 1.x / Under Development |
| J2 | Evidence Packages | **No** | Planned 1.x / Stub |
| J3 | PDF / webhook / email channels | **No** | Planned 1.x |

If delivery capabilities ship before GA, each promotes to GA via PDF-1.2 amendment — independently, not as a monolithic "KEMS-007 release."

---

## Release sequence (reminder)

```
PDF-1.0  ← define product (this program)
RC-1     ← install + validate (4 domains)
RC-2     ← operational proof (blind operator)
GA 1.0   ← all checklist items green
LTS 1.0  ← future maintenance strategy
```

---

## GA approval roles

| Role | Responsibility |
|------|----------------|
| Product | Scope, workflows, boundaries match GA promise |
| Architecture | ADR/KEMS compliance, boundary enforcement |
| Engineering | Technical checklist complete |
| Operations | RC-1 + RC-2 evidence |
| Security | F4 sign-off |

---

## Gate: GA Criteria Approved

- [x] GA definition stated
- [x] Checklist with evidence links
- [x] GA blockers documented (KEMS-003 — GA only, not RC-1)
- [x] Delivery capabilities explicitly non-blocking for core GA
- [x] RC-1 / RC-2 dependency clarified
- [ ] **Product sign-off**
- [ ] **Architecture sign-off**
- [ ] **Operations sign-off**

**Upon approval:** RC-1 may begin; GA date is set only when all checklist items are green.
