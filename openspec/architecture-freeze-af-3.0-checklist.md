# AF-3.0 — Architecture Freeze Checklist (Sprint 28L)

**Status:** Pending ratification  
**Target baseline:** AF-3.0  
**Release candidate:** RC-1.0

---

## Prerequisites

- [x] Sprint 28A–28J complete
- [x] Legacy Equivalence Validation Gate passed ([phase-8-legacy-equivalence-gate.md](phase-8-legacy-equivalence-gate.md), [phase-8-gate-28JK-report.md](phase-8-gate-28JK-report.md)) — 2026-07-03
- [x] Sprint 28K **staging** cutover configured (`LEGACY_PASSPORT_ENABLED=false`) — [phase-8-staging-cutover-report.md](phase-8-staging-cutover-report.md)
- [ ] Sprint 28K **production** cutover complete — see [phase-8-cutover-runbook.md](phase-8-cutover-runbook.md)
- [ ] Hybrid index migration 048 applied

---

## KEMS ratification

| Document | Version | Status |
|----------|---------|--------|
| KEMS-004 Claim Provenance | v1.0 | Ratify → Accepted |
| KEMS-005 Schema Evolution | v1.0 | Ratify → Accepted |
| KEMS-006 Systems Integration | v1.0 | Ratify → Accepted |

---

## ADR acceptance

| ADR | Sprint | Accepted |
|-----|--------|----------|
| ADR-027 Fact/Claim separation | 28B–28C | [ ] |
| ADR-028 Claim immutability | 28G | [ ] |
| ADR-029 Confidence derived | 28H | [ ] |
| ADR-030 Published View boundary | 28D | [ ] |
| ADR-031 Evidence Pack contract | 28F | [ ] |
| ADR-032 Hybrid indexing | 28K | [ ] |

---

## Phase 8 remediation checklist (Sprint 28K — pre-prod)

Tracking for [Phase 8 Remediation Plan v2](../.cursor/plans/phase_8_remediation_plan_267138af.plan.md) — operational gates before production cutover.

### Infra / DB
- [x] Migration parity documented (P1.1) — [phase-8-migration-parity.md](phase-8-migration-parity.md)
- [x] GoTrue seed users login (P1.3) — migration `057_gotrue_seed_compat.sql`
- [x] Grants discovery + memberships (P1.2a) — `056_phase8_public_read_grants.sql`
- [x] RLS phase8 tables (P1.2c) — `058_phase8_rls_and_evidence_grants.sql`
- [ ] `db reset` without manual SQL (P1.1) — blocked at migration 045 parity; staging validated with applied 046–058
- [ ] Hybrid index migration 048 applied in target prod env

### API / Auth
- [x] API deps declared (P0.1) — `@kadarn/evidence-core`, `@kadarn/types`
- [x] assertConfig wired (P0.2) — `apps/api/instrumentation.ts`
- [x] Passport surface public anonymous (P2.1a) — [phase-8-passport-public-read-decision.md](phase-8-passport-public-read-decision.md)
- [x] Institution public API verified
- [x] Discovery dashboard + report (P2.1b)
- [x] Ops cutover protected kadarn_internal (P2.2)

### UX
- [x] Login routing `/login` + `/auth/login` redirect (P3.1a)
- [x] KOC API wiring Bearer + `NEXT_PUBLIC_API_URL` (P3.1b)
- [x] Institution public page `/institutions/[slug]` (P3.2a)
- [x] Discovery report UX wired (P3.2b)
- [x] KOC Phase 8 cutover read-only panel (P3.2c)

### Quality
- [x] RLS / migration parity tests — `tests/integration/migration-parity-phase8.test.ts`, `seed-auth-local.test.ts`
- [x] Staging shared re-validation post-remediation (S-5 gate) — `staging:cutover-smoke` 14/14 PASS 2026-07-03
- [x] gate-28jk + typecheck green post-remediation

### Prod (post-remediation — not executed)
- [ ] Prod cutover executed (P5.1) — see [phase-8-cutover-runbook.md](phase-8-cutover-runbook.md)
- [ ] 2-week monitor
- [x] Compatibility Layer retained
- [x] **NO** Evidence Pack prod (KEMS-007 — frozen)
- [x] **NO** native reads required for prod v1 (P4 optional)

---

## Production verification

- [ ] Published View API serves all public product surfaces
- [ ] Evidence Pack generated for every published view
- [ ] No public route reads `continuity_experience_claims` directly
- [ ] Claim Provenance + RECONSTRUCT operational
- [ ] Phase 9 (29B+) unblocked per [phase-8-to-phase-9-gap-analysis.md](phase-8-to-phase-9-gap-analysis.md)

---

*Sprint 28L deliverable — ratification ceremony required.*
