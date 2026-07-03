# KADARN — Code Integrity Validation — CLAUDE Agent Report

**Agent:** Claude
**Date:** 2026-07-02
**Repo:** kadarn-platform @ `master` / HEAD `b98350b5`
**Method:** Read-only audit across 12 mandated sections, executed by three parallel read-only sub-auditors, synthesized and spot-verified by Claude. No files modified.
**Note:** This is the Claude report only. The combined `KADARN_CODE_INTEGRITY_TRIANGULATION_REPORT.md` is pending the Cursor and Antigravity reports (see final section).

---

## 1. EXECUTIVE VERDICT: **FAIL**

The codebase is **NOT pilot-ready**. Two independent build-breaking / security-critical defects and a large gap between documented architecture and wired reality prevent a passing grade.

| Section | Verdict |
|---|---|
| 1. Build Integrity | **FAIL** |
| 2. Architecture Integrity | PASS WITH ISSUES |
| 3. Canonical Pipeline Integrity | PASS WITH ISSUES (pipeline largely unwired) |
| 4. API Integrity | PASS WITH ISSUES |
| 5. Frontend Integrity | PASS WITH ISSUES (borderline FAIL) |
| 6. Security Integrity | **FAIL** |
| 7. Data Integrity | PASS WITH ISSUES |
| 8. Test Integrity | PASS WITH ISSUES |
| 9. Terminology Integrity | **FAIL** |
| 10. Commercial Flow Integrity | **FAIL** |
| 11. Performance / Reliability | **FAIL** |
| 12. Documentation Integrity | **FAIL** |

**Spot-verified by Claude directly (not taken on faith):**
- Build-breaking syntax error at `apps/web/src/components/discovery/sponsor-readiness-summary.tsx:150` (stray `}`) — CONFIRMED.
- No `/api/v1/*` route invokes any rate limiter — CONFIRMED.
- Repo **is** a git repo (HEAD `b98350b5`) — one sub-auditor's "no .git" claim was FALSE and is discarded.

---

## 2. CRITICAL FINDINGS (block pilots — P0)

**C-1 — `apps/web` does not build.** `sponsor-readiness-summary.tsx:150` has a dangling `}` → `TS1128`/`TS1005`; type-check and production build both fail. Nothing ships until this is fixed.
Evidence: `npm run type-check -w apps/web`; file lines 133–150.

**C-2 — 13 unauthenticated routes in the production tree.** `api/v1/workspace/{applications,collections,consent,documents,inventory,logistics,payments,processing,programs,qc,regulatory,requests}` + `api/v1/operations/{compliance,kpe/generate}` use bare handlers with **no `withAuth`**, several trusting a client-spoofable `x-org-id` header (textbook IDOR). Payloads are inert mocks today, but the surface is live and one wiring commit away from an unauthenticated data leak.
Evidence: `workspace/consent/route.ts:4`; route table in §4.

**C-3 — No rate limiting on any `/api/v1/*` route.** Two limiter implementations exist (`rate-limit.ts`, `rate-limiter.ts`) and are referenced in comments as if active; **neither is applied to a single route**, and `middleware.ts` explicitly skips v1 paths. Entire modern API is an open abuse/DoS surface.
Evidence: zero matches for `withRateLimit(`/`checkRateLimit(` under `apps/api/src/app/api/v1` (Claude-verified).

**C-4 — Sponsor Search auth/role bypass.** `sponsor/search/route.ts` is `withAuth` only (no org/role gate), hardcodes the visibility actor to `'sponsor'` regardless of the caller's real role, and pulls all orgs unfiltered. Inert today only because `capabilities: []` is hardcoded; becomes cross-tenant capability exposure the moment it is wired.
Evidence: `sponsor/search/route.ts:12,24-26,46,51`.

**C-5 — Live retired "Trust Score" in production.** Routed screen `koc/trust` ("Overall Trust Score"), nav entry "Trust Index", `TrustBadge` component in two marketplace routes ("Trust Score Breakdown" user-facing), and live API `/api/v1/operations/trust`. This is post-ADR-010 (2026-07-01) continued investment in a retired concept, and a direct violation of the AF-2.0 terminology-freeze rule.
Evidence: `koc/trust/page.tsx`, `koc-shell.tsx:15`, `marketplace/trust-badge.tsx`, `operations/trust/route.ts`.

**C-6 — Foundational canonical docs missing.** `KEMS-001` and `KEMS-002` are registered "Frozen" in AF-2.1 but **do not exist on disk**; `vendor/kems/` holds only KEMS-003. The freeze registry's authority cannot be verified.
Evidence: `openspec/canonical-documents-registry-af-2.1.md:23`; filesystem.

---

## 3. HIGH FINDINGS (fix before pilots — P1)

**H-1 — Canonical pipeline is unwired.** Identity Resolution, Evidence Firewall, Connector Registry, Institutional Consent, Feasibility Passport, Mutual Reveal exist as unit-tested library code with **zero consumers outside their own tests**. `identity/resolve` is an honest `501`. The "External Providers → Connector → Identity → Firewall → Discovery → Engines → Products" chain is not connected end-to-end. (This is the single most consequential architectural finding; it is CRITICAL for completeness but produces no active exploit, so classified P1.)

**H-2 — `evidence-discovery` fails typecheck (31 errors).** Duplicate barrel exports (`GapSeverity`, `ReviewItem`, `AuthorizationState`, `TimelineEvent`), a genuine broken import `snapshot.ts:11` (`../orchestrator.js` → should be `./`), and iterator/`.map()` misuse. `apps/api` depends on this package. `npm run typecheck` (root) is red.

**H-3 — RLS cross-tenant read via bare `is_org_admin()`.** Any org_admin of any org can SELECT all `exchange_deals`/`programs`/`organizations` platform-wide (counts/existence, not escrow amounts — those are correctly scoped). Backs the ungated `koc/analytics` route.
Evidence: `009_rls_foundation.sql:179-193,330-338`; `016_exchange_engine.sql:293-297`.

**H-4 — Public institution profile can leak private-evidence refs.** `institution/public/[slug]` passes `buildAllEngineOutputs` capability/assessment output (incl. `supporting_evidence` IDs) with no `VisibilityPolicyEngine`/`PrivateEvidenceService` filter. Safe today only because nothing is classified private yet. Gaps/recommendations ARE correctly nulled.

**H-5 — Rules-of-Hooks violation in `koc-shell.tsx`.** Hooks called after an early return (`:75` then `:82-104`) → runtime "rendered more hooks" crash risk on auth-state transitions. Also surfaces as 6 `react-hooks/rules-of-hooks` lint errors.

**H-6 — KPE report route lacks authorization (possible IDOR).** `report/kpe/[id]/page.tsx` fetches any program's KPE by ID with no ownership/role check visible.

**H-7 — Dashboard route under-delivers engine data.** `discovery/dashboard/route.ts` imports `buildAllEngineOutputs` but never calls it (only `buildDiscoveryMetrics`), while sibling routes (`institution/profile`, `public/[slug]`, `discovery/report`) do call it — response-shape divergence vs. what the dashboard UI's tabs expect. Needs a targeted contract diff.

**H-8 — Stale entry-point + reference docs.** `README.md`/`ARCHITECTURE.md` describe a Sprint-1 skeleton ("apps pending", "migrations 008-012", roadmap Discovery = sprint 3 ⬜); `kadarn-platform-blueprint.md` and `krm-rao.md` still teach a superseded engine taxonomy and the retired Trust Engine with no supersession banner. Broken ADR-001 reference.

**H-9 — Orphaned schema domains.** Regulatory (no `api/v1/regulatory/` at all), most Analytics, AI layer, and Logistics detail tables exist in migrations + tests but have no production API surface.

**H-10 — Zero-auth production concern feeds terminology + continuity.** Separate ADR-undocumented `continuity` badge system (`badge_level: kadarn_verified`, migration 044) reintroduces "Verified" as an institutional label outside the terminology-lint's coverage.

---

## 4. MEDIUM FINDINGS (pilot-prep window — P2)

- M-1 `@kadarn/evidence-core` is an **undeclared** dependency of `apps/api` (works only by npm hoisting).
- M-2 Dead duplicate connector implementation in `packages/evidence-core/src/connectors/*` (~2000 LOC, zero consumers).
- M-3 UI fallbacks duplicating canonical logic (`lib.ts` `assessSponsorReadiness`, "Research Assets Enabled") — documented and non-arithmetic, but drift risk; add telemetry when fallback fires.
- M-4 Weak anonymization: `anon:${id.slice(0,8)}` unsalted + exact city/state, correlatable against public marketplace directory.
- M-5 18 test files **fail hard** (throw on missing Supabase) instead of skipping → noisy CI signal indistinguishable from real regressions.
- M-6 `matching-engine` and `dashboard-engines.ts` aggregator are weakly/untested; some "dashboard" tests are source-text grep assertions, not behavioral.
- M-7 Migration numbering gaps (035, 037–041); dead types in `packages/types` (~1/3 unused).
- M-8 No caching anywhere on the 5-engine recompute routes; public `institution/public/[slug]` recomputes per view; no client data layer (no SWR/React Query).
- M-9 `rate-limiter.ts` cleanup interval not `.unref()`'d (process-liveness risk in non-serverless).
- M-10 ADR-011 numbering collision (`adr-011-trust-engine.md` still `Status: Accepted`, no superseded banner); ADR-012 collision.
- M-11 `apps/api` has **no lint config** — 96 routes unlinted.
- M-12 Marketplace/organizations fetch swallows errors (no `.catch()`); consent page conflates error and empty states.
- M-13 No infra liveness/readiness health endpoint (middleware carves out `/api/health` but no such route exists).

## 5. LOW FINDINGS
- Fixed-grid responsive pattern across ~20 KOC screens (no breakpoints).
- Structured domain-event logs emit `userId`/`organizationId` to stdout (no secrets/PHI).
- `koc-shell.tsx.bak` stray file committed.
- Doc duplication across `docs/lexicon` and `governance/lexicon`.
- Sponsor Search UI component (`sponsor-search.tsx`) is 100% hardcoded sample data — mitigated by being unmounted/unreachable.

---

## 6. FALSE POSITIVES / ACCEPTABLE EXCEPTIONS
- **"Promotion"/"promote"/"PROMOTED"** (~50 hits): legitimate Evidence-Candidate state-machine transition per KEMS-002, NOT marketing/tier promotion. Recommend refining the forbidden-terms matcher. **Not violations.**
- **"Broker"** (~11 hits): all negation ("not a broker") or unrelated technical sense (message broker). **Not violations.**
- **"platform to find biospecimens"** (3 hits): all correctly cited as historical/superseded framing.
- **Gold/Silver/Bronze**: zero live hits (only negation comments + enforcing tests). The retired *tier labels* did not survive — but their numeric Trust Score equivalent did (C-5).
- **Confidence arithmetic** in discovery agents (`relationship-extractor`, `claim-candidate/detector`, `timeline/engine`): extraction confidence, upstream of and distinct from Evidence Core `ConfidenceState`. Engines may compute. **Not a violation.**
- **`is_org_admin()` on reference tables** (`organization_roles`, `capability_types`): self-documented acknowledged TODO — distinct from the un-acknowledged H-3 instance.
- **Evidence Core boundary**: zero writes outside the package; confidence passthrough respected. **Genuine PASS.**
- **"not a git repo"** claim by one sub-auditor: FALSE (Claude-verified HEAD `b98350b5`). Discarded.

---

## 7. EVIDENCE / COMMANDS RUN
- `git status --short` → only tooling artifacts dirty (`.atl/`, `.pi/`, `.pi-subagents/`, `output.txt`); no source/test/migration drift.
- `npm run typecheck` (root) → **FAIL, 31 errors** in `packages/evidence-discovery`.
- `npm run type-check -w apps/web` → **FAIL**, `TS1128`/`TS1005` at `sponsor-readiness-summary.tsx:150`.
- `npm run lint -w apps/web` → 132 problems (127 errors, 5 warnings): 106 `no-explicit-any`, 8 `set-state-in-effect`, 6 `rules-of-hooks`, 6 `no-unescaped-entities`, 4 `no-unused-vars`, 1 `exhaustive-deps`.
- `cd tests && npx vitest run` → 39 files / 711 tests pass; 18 files fail (all Supabase/API-infra-gated, not code defects); 1 skipped file; 267 skipped tests; 4 infra ECONNREFUSED failures.
- Route enumeration (96 `/api/v1/*` handlers), terminology grep (repo-wide), mock/placeholder grep, rate-limiter usage grep, Evidence Core `.from()` grep, canonical-pipeline consumer grep.

---

## 8. RECOMMENDED REMEDIATION PLAN

### P0 (before any pilot — merge blockers)
1. Fix `sponsor-readiness-summary.tsx:150` syntax; restore green web build (C-1).
2. Add `withAuth` (+ real org derivation, drop `x-org-id` header trust) to all 13 unauth routes, or move mocks out of the production route tree behind a flag (C-2).
3. Apply a rate limiter to `/api/v1/*` (wire `withRateLimit` or `checkRateLimit`); prioritize `sponsor-search`, `discovery-report`, `institution-public` (C-3).
4. Gate `sponsor/search` by role; derive actor from the authenticated user, not a hardcode (C-4).
5. Remove live Trust Score surfaces (screen, nav, `TrustBadge`, `/operations/trust`) or formally re-scope them; reconcile with ADR-010 (C-5).
6. Restore or correctly locate KEMS-001/KEMS-002, or amend AF-2.1 to reflect reality (C-6).

### P1 (before Pilot Alpha)
7. Fix `evidence-discovery` typecheck (dup exports + `snapshot.ts` import) so root typecheck is green (H-2).
8. Decide the pipeline story: either wire Identity Resolution/Firewall/Consent/Passport end-to-end or explicitly mark them non-pilot scope in the docs so the freeze registry stops implying they're live (H-1).
9. Introduce a real `platform_admin`/`kadarn_internal` role; restrict cross-tenant RLS branches (H-3); add role gate to `koc/analytics`.
10. Add a visibility/private-evidence filter before public routes emit engine output (H-4).
11. Fix `koc-shell.tsx` hook order (H-5); add authorization to `report/kpe/[id]` (H-6).
12. Resolve dashboard-route engine-output contract (H-7).
13. Update README/ARCHITECTURE/blueprint/krm-rao to current reality; add supersession banners (H-8).

### P2 (during pilot prep)
14. Declare `@kadarn/evidence-core` dep; delete dead connector duplicate; add `apps/api` lint config; convert hard-failing infra tests to `skipIf`; add caching to engine routes; salt anonymization; cover `matching-engine`/aggregator; clean migration numbering + dead types; fix ADR numbering banners.

---

## 9. FINAL PILOT READINESS STATEMENT

**NOT READY. Ready only after all P0 items and the P1 security/typecheck items are resolved.**

The core Evidence domain (Evidence Core boundary discipline, confidence passthrough, the 5 canonical intelligence engines and their unit tests, private-evidence/consent logic *in isolation*) is genuinely sound and well-tested. But the product cannot ship a pilot with a non-building web app, 13 unauthenticated routes, zero rate limiting, a role-bypassed commercial entry point, live retired-terminology surfaces, and a canonical pipeline that is mostly library code never wired into a running request path. The gap is not the engines — it is the **wiring, the access control, and the honesty between docs and reality**.

---

## 10. TRIANGULATION STATUS

This Claude report is **1 of 3**. The combined `KADARN_CODE_INTEGRITY_TRIANGULATION_REPORT.md` (consensus findings, disagreements, agent-specific findings, confirmed blockers, final go/no-go) requires the **Cursor** and **Antigravity** reports, which are produced independently outside this session. Once both are available, provide them and the triangulated report can be assembled. Per the Definition of Done, the codebase is not pilot-ready until all three agents reach PASS / PASS-WITH-NON-BLOCKING-ISSUES and all consensus P0 findings are resolved — the Claude verdict is currently **FAIL**, so that bar is not yet met.
