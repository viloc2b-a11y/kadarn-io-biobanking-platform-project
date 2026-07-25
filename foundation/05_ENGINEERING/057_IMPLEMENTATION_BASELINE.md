# KADARN Implementation Baseline

**Document:** 057_IMPLEMENTATION_BASELINE.md
**Date:** 2026-07-24
**Version:** 1.0
**Status:** Active — Implementation Program

---

## Declaration

The KADARN Implementation Program officially starts on this date.

Concept Discovery is completed.

Foundation Library is approved.

Architecture Reconciliation is completed.

Existing Code Audit is completed.

Foundation Remediation PASS.

**The current architecture is accepted as the implementation baseline.**

No rewrite is authorized.

No new architectural concept (engine, graph, twin, package) may be introduced without an ADR demonstrating that no existing boundary can responsibly contain the required behavior.

---

## Repository Status at Baseline

| Component | Status | Evidence |
|-----------|--------|----------|
| Build | ✅ Green | `npm run build` — 10.7s |
| Typecheck | ✅ Green | 3 projects |
| Tests | ✅ Accepted baseline | 1313/1363 passing, 11 accepted failures |
| Database migrations | ✅ Clean install | `supabase db reset` 001→061 |
| Authentication | ✅ Working | Supabase Auth + JWT |
| RLS | ✅ Operational | Organization-scoped on all evidence tables |
| Protected vertical slice | ✅ Verified | Claim → Evidence → Review → Confidence → Passport → ShareGrant |
| Passport pipeline | ✅ Verified | Publication + Share Grants |
| API server | ✅ Operational | ~110 routes, healthy |
| Marketplace dependencies | ✅ Quarantined | Isolated from MVP core |
| Lint | 🟡 Accepted | 71 warnings (pre-existing, approved) |

---

## Frozen Architectural Decisions

The following architectural decisions are now frozen unless formally superseded by a new ADR:

1. **Evidence Graph** — Claim → Evidence → Review → Confidence → Passport → Share Grant is the canonical trust chain
2. **Package architecture** — 36 existing packages with dispositions assigned per register 055
3. **No new engines, graphs, twins, or packages** without approved ADR
4. **database/migrations/** is the canonical migration source
5. **evidence-core** is the sole canonical authority for claims, evidence, review, and state
6. **Supabase + RLS** is the authentication and authorization model
7. **Monorepo with packages/apps** is the repository structure
8. **No rewrite** — all implementation work extends, consolidates, or retires existing code within the accepted architecture

---

## Implementation Order

| Priority | Story | Description |
|----------|-------|-------------|
| 0 | KAD-001.5 | Canonical Entity Specifications ✅ Complete |
| 1 | KAD-002A | Person model |
| 2 | KAD-002B | Location model |
| 3 | KAD-002C | Institution Relationships (Membership, Role) |
| 4 | KAD-002D | Repositories |
| 5 | KAD-002E | API |
| 6 | KAD-002F | UI |
| 7 | KAD-002G | Validation |
| 8 | KAD-003 | Capability model |
| 9 | KAD-004 | Claim consolidation |
| 10 | KAD-005 | Evidence pipeline (consolidation) |
| 11 | KAD-006 | Review workflow (hardening) |
| 12 | KAD-007 | Confidence computation (completion) |
| 13 | KAD-008 | Knowledge publication |
| 14 | KAD-009 | Passport (hardening) |
| 15 | KAD-010 | Vilo Pilot |

---

## Decision Framework

Every discussion, proposal, and story must answer at least one of:

| Question | Governs |
|----------|---------|
| Does this implement the domain model? | KAD-002 through KAD-009 |
| Does this reduce technical debt? | Remediation backlog |
| Does this increase evidence (tests, validation)? | Quality gates |
| Does this bring us closer to the Vilo Pilot? | KAD-010 |

If a proposal answers none of these four questions, it should not enter the MVP backlog.

---

## Signatures

**Reviewed by:**
OpenAI ChatGPT (Architecture Review)

**Approved by:**
Project Owner

**Implementation Authority:**
KADARN Foundation Governance

**Date:** 2026-07-24

*This document marks the transition from Concept Discovery to Implementation Program. It is the point after which all project decisions are governed by implementation discipline rather than architectural exploration.*
