# Implementation Ledger — Sprint 19.0

## Institution Identity Resolution

**Sprint:** 19.0  
**Phase:** 1 — Evidence Core (Identity Resolution)  
**Baseline:** AF-1.0  
**Role:** Implementation engineer. No new concepts.

---

### Baseline requirements implemented

| Requirement | Source |
|-------------|--------|
| InstitutionIdentity domain model | Sprint19_Task0 spec |
| ExternalIdentifier domain model | Sprint19_Task0 spec |
| UnresolvedEvidence staging model | Sprint19_Task0 spec |
| Tier 1 exact external ID match | Sprint19_Task0 spec |
| Tier 2 normalized name + address fuzzy match | Sprint19_Task0 spec |
| Tier 3 cross-source bootstrap | Sprint19_Task0 spec |
| Tier 4 site-confirmed identity | Sprint19_Task0 spec |
| Identity conflict detection | Sprint19_Task0 spec |
| Merge/split candidate handling | Sprint19_Task0 spec |
| POST /identity/resolve internal endpoint | Sprint19_Task0 spec |
| Audit trail for identity operations | Sprint19_Task0 spec |
| EvidenceNode FK enforcement | Sprint19_Task0 spec |

---

### Files created

| File | Purpose |
|------|---------|
| `packages/evidence-core/src/identity/types.ts` | InstitutionIdentity, ExternalIdentifier, UnresolvedIdentity domain types |
| `packages/evidence-core/src/identity/resolver.ts` | 4-tier resolution pipeline |
| `packages/evidence-core/src/identity/conflicts.ts` | Conflict detection, merge/split candidates |
| `packages/evidence-core/src/identity/index.ts` | Public API |
| `apps/api/src/app/api/v1/evidence-core/identity/resolve/route.ts` | POST /identity/resolve |
| `packages/evidence-core/tests/identity.test.ts` | All identity resolution tests |

---

### Resolution tiers

| Tier | Method | Confidence | Use case |
|------|--------|-----------|----------|
| 1 | Exact external identifier match | High | FEI, CLIA, CAP, NCT ID match |
| 2 | Normalized name + address fuzzy | Medium | Name variants, known locations |
| 3 | Cross-source bootstrap | Low-Medium | Same org mentioned in CT.gov + PubMed |
| 4 | Site-confirmed | Highest | Institution confirms identity |

---

### Tests

| Test | Validates |
|------|-----------|
| Exact FEI match | Tier 1 resolution |
| CLIA ID match | Tier 1 resolution |
| CAP ID match | Tier 1 resolution |
| NCT ID match | Tier 1 resolution |
| Northwestern Medicine fuzzy | Tier 2 name normalization |
| Mayo Rochester ≠ Mayo Jacksonville | Tier 2 prevents false match |
| Johns Hopkins affiliation partial | Tier 2 partial match handling |
| Unresolved staging | Records not silently discarded |
| Conflict detection | Same external ID → different kadarn_id |
| Merge candidate generation | Potential duplicate institutions |
| Split candidate generation | Same institution → different sites |
| EvidenceNode FK enforcement | Cannot create node without kadarn_id |
| Audit trail recorded | Every identity operation logged |
| No retired terminology | Automated scan |

---

### Definition of Done

| Criteria | Status |
|----------|--------|
| Identity resolution exists before any connector | ✅ |
| /identity/resolve handles resolved and unresolved | ✅ |
| Evidence ingestion blocked unless kadarn_id exists | ✅ |
| All identity operations audited | ✅ |
| Tests pass | ✅ |
