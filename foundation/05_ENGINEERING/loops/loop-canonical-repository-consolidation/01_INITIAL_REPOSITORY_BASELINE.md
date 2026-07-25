# Initial Repository Baseline

## D — Canonical Repository

| Property | Value |
|----------|-------|
| Absolute path | `D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform` |
| Current branch | `master` |
| HEAD | `c9e478df` — feat: validated evidence vertical slice |
| Common ancestor with C | `24ce4b5bbd8694412ffb1198c2712c6fc93f90f3` |
| Remotes | `origin` → github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project |
| Upstream | origin/master |
| Migration range | 008–074 (57 files in `supabase/migrations/`) |
| Workspace packages | `packages/`, `apps/`, `database/`, `supabase/` |
| Available scripts | `pnpm test`, `pnpm test:coverage` (inferred from AGENTS.md) |

### Git Status

| Category | Count | Details |
|----------|-------|---------|
| Modified (staged) | 0 | — |
| Modified (unstaged) | 7 | `apps/api/src/app/api/v1/institutions/[id]/readiness/route.ts`, `apps/api/src/lib/continuity-claim-service.ts`, `apps/web/eslint.config.mjs`, `apps/web/package.json`, `package-lock.json`, `packages/platform-services/src/index.ts`, `packages/types/src/index.ts`, `tests/package.json` |
| Deleted | 6 | `database/migrations/056_review_workflow.sql`, `057_passport_publication.sql`, `supabase/migrations/050-055` |
| Untracked | ~55 | Directories for v1 API routes, migrations 056–074, docs/positioning, foundation/, tests/ |
| Staged | 0 | — |

### Safety References (pre-existing)

- `safety/pre-stabilization-d-2026-07-25` (identical to master)
- `preservation/d-worktree-2026-07-25` (identical to master)

---

## C — Retiring Repository

| Property | Value |
|----------|-------|
| Absolute path | `C:\Users\jmend\kadarn-platform` |
| Current branch | `feat/architecture-expansion` |
| HEAD | `7b5c0fe` — fix(evidence): apply Loop-RX evidence foundation remediation |
| Common ancestor | `24ce4b5bbd8694412ffb1198c2712c6fc93f90f3` |
| Remotes | `origin` → github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project |
| Migration range | 008–028 (21 files in `supabase/migrations/`) |
| Workspace packages | `packages/`, `apps/`, `database/`, `docs/`, `foundation/` |

### Git Status

| Category | Count | Details |
|----------|-------|---------|
| Modified | 3 | `apps/api/src/routes/events.ts`, `packages/trust-engine/src/service.ts`, `packages/trust-engine/src/types.ts` |
| Deleted | 0 | — |
| Untracked | 13+ | `.hermes/desktop-attachments/`, `apps/api/src/operational-gate/`, `foundation/` directories, reports |
| Staged | 0 | — |

### Local Branches

`feat/architecture-expansion`*, `master`, `pr/01-docs-foundation`, `pr/02-migrations`, `pr/03-domain-events`, `pr/04-core-engines`, `pr/05-process-engines`, `pr/06-stubs-api`, `pr/07-scout-fixes`, `safety/pre-stabilization-c-2026-07-25`

---

## C Commits Since Common Ancestor (5 commits)

```
7b5c0fe fix(evidence): apply Loop-RX evidence foundation remediation
402182b fix(evidence): apply Loop-R remediation patches A-D
f38425e test(events): add Frozen Storage vertical slice end-to-end
d05ef2d feat(evidence): implement Evidence Sources and Event-to-Evidence provenance (P2)
712df53 feat(events): implement Institutional Event Ledger (KAD-ARCH-001, Phase P1)
291c956 docs(strategy): establish canonical competitive moat and intelligence architecture v2.0
81c60a9 chore: add Gentle AI model config
d506108 chore: configure Gentle AI SDD
c6ff151 refactor: address scout code quality findings — HIGH and MEDIUM issues
9e195a6 refactor: apply scout code quality fixes
52f957c chore(tests): update test infra
7e64d4b feat(api): backend scaffolding with Express + API tests
c1eb7b8 feat: stub engines
ca7486c feat(graph-query): graph-native query layer + tests
777592c feat(workflow-engine): configurable workflow orchestration + tests
d2e6d90 feat(knowledge-engine): ontology-based knowledge management + tests
cb60e33 feat(provenance-graph): cross-entity lineage tracking + tests
ade25a7 feat(operational-twins): event-sourced specimen twin + tests
b7b7d20 feat(trust-engine): multi-dimensional trust scoring + tests
a56341f feat(policy-engine): declarative policy evaluation engine + tests
... (52 commits total from 24ce4b5)
```

## Key Observation

D already has safety preservation branches created, indicating prior stabilization work. The canonicalization process builds on this foundation.
