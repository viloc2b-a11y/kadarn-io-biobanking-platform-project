# WO-MVP-00A — Baseline Verification Report

**Status:** COMPLETE
**Classification:** `BASELINE_DIVERGED`
**Execution mode:** Read-only. No files, branches, metadata, or configuration were modified.

---

## 1. Executive Summary

| Property | Value |
|---|---|
| Repository | viloc2b-a11y/kadarn-io-biobanking-platform-project |
| Local path | `D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform` |
| HEAD commit | `9c7684816f2b6e28cb691c29188a86096178c3e3` |
| Branch | `fix/gov-004-security-remediation` |
| Remote origin | `https://github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project.git` |
| Canonical baseline | `kadarn-canonical-baseline-2026-07-25` (reachable — ancestor of HEAD) |
| Working tree | **DIRTY** — 3 modified, 20 untracked |
| Submodules | None |

The canonical baseline (`kadarn-canonical-baseline-2026-07-25`) exists and is reachable from HEAD. However, the repository exhibits **divergence** in three areas: local/remote branch staleness, migration numbering collisions, and a dirty working tree with overlapped migration filenames. Classification: **BASELINE_DIVERGED**.

---

## 2. Repository Identity & Remote

- **Remote:** Single origin at `github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project.git`
- **HEAD branch (remote):** `master`
- **HEAD (local):** `9c768481` on `fix/gov-004-security-remediation`
- **origin/HEAD:** `origin/master` = `9c768481` — HEAD matches remote master exactly
- **origin/main:** `ea352b43` — **190 commits behind origin/master**, 15 ahead (heavily divergent)

**Observed:** The remote `main` branch has not been synced with `master` for a significant period. Any CI/CD pipeline configured to use `main` as default would operate on stale content.

---

## 3. HEAD & Working Tree

### HEAD anatomy
```
9c768481 (HEAD -> fix/gov-004-security-remediation, origin/master)
Merge commit. Parents:
  parent 1: 4b0ce3f8 (local master)
  parent 2: afeeaf80 (from fix/gov-003-migration-parity-phase8)
Author: viloc2b-a11y, committer: GitHub (signed via GPG — verified key)
Message: LOOP-GOV-003: fix(tests): migration-parity expects 058 to exist (restored in KAD-002-012)
```

### Working tree state
| Type | Count | Details |
|---|---|---|
| Staged changes | 0 | Clean index |
| Unstaged modifications | 3 | `apps/web/package.json`, `package-lock.json`, `package.json` (77 insertions, 50 deletions) |
| Untracked files | 20 | See §7 |

**Computed diff (unstaged):**
```
 apps/web/package.json |   4 +-
 package-lock.json     | 121 +++++++++++++++++++++---------------------
 package.json          |   2 +-
 3 files changed, 77 insertions(+), 50 deletions(-)
```

**Observation:** The three modified files suggest a recent `npm install` or dependency version change that was not committed. The diff is structurally consistent (lockfile + workspace manifests) but cannot be confirmed without execution.

---

## 4. Refs Inventory

### Local branches (26 total)
- `backup/mvp-document-workflow-2026-07-10`
- `codex/migrate-architecture-expansion` (worktree at `C:\Users\jmend\Documents\ANTIGRAVITY FOLDER\kadarn-platform-migration`)
- `feat/continuity-clean`, `feat/continuity-verification`
- `feat/governance-gate-templates`, `feat/governance-gate-templates-clean`
- `feat/loop-2-evidence`, `feat/loop-3-claims`, `feat/loop-4-confidence`, `feat/loop-5-passport-integration`
- `feat/ui-evidence-integration`
- `fix/gov-002-architecture-terminology`, `fix/gov-003-migration-parity-phase8`, `* fix/gov-004-security-remediation`
- `fix/jd-audit`, `fix/jd-misc`, `fix/jd-rate-limit`, `fix/jd-security`, `fix/jd-trust`
- `fix/kad-loop-003-session-tenant-contract`
- `fix/loop-5-persisted-vertical-slice`
- `integration/canonicalization-and-forward-port`
- `master`
- `preservation/d-worktree-2026-07-25`, `safety/pre-stabilization-d-2026-07-25`
- `wip/jd-round1-original`

### Remote-tracking branches (origin, 22 + HEAD)
All 22 remote branches are tracked. Notable:
- `origin/master` = `9c768481` (same as HEAD)
- `origin/main` = `ea352b43` (190 commits behind master)

### Additional remote
- `architecture-source/feat/architecture-expansion` at `81c60a96`

### Tags (19)
```
kadarn-canonical-baseline-2026-07-25   -> fd6bb756  [CANONICAL CUTOVER — 2026-07-25]
kux-v1.0                               -> 615e740a
kux-foundation-v1]                     -> b17e3f18  [TRAILING BRACKET — possible typo]
mvp-document-workflow-vilo-pre-sync    -> c7cae8ac
v1.0.0-ici, v1.0.0-beta, v1.0.0-alpha, v1.0.0-alpha.2
v0.12.0-rc through v0.1.0-foundation-validated
```

### Stash
```
stash@{0}: fix/gov-003-migration-parity-phase8: sprint-2-uncommitted-1785162450
stash@{1}: master: feat(continuity): Institutional Continuity Infrastructure — Sprint 5
```

---

## 5. Branch Divergence

| Comparison | Ahead | Behind | Status |
|---|---|---|---|
| `master` vs `origin/master` | 0 | **3** | Local master is out of date |
| `origin/main` vs `origin/master` | 15 | **190** | Main is heavily stale |
| HEAD vs `master` | 3 | 0 | HEAD ahead of local master |
| HEAD vs `origin/master` | 0 | 0 | **SYNCED** |

**Key finding:** HEAD is synced with `origin/master` but local `master` is 3 commits behind `origin/master`. Any operation depending on the local `master` ref (merge-base comparisons, rebase onto master, etc.) will produce different results than expected.

---

## 6. Migration Inventory

### database/migrations/ (files 008–088)
- Tracked: 60 files (008–088 with gaps)
- **Numeric collisions:**
  - `036_domain_events_runtime.sql` + `036_ext_visibility.sql` (duplicate prefix 036)
  - `055_discovery_staging_seed.sql` + `055_hybrid_trial_readiness.sql` (duplicate prefix 055)
  - `075_institutional_event_ledger.sql` + `075_sprint2_claim_evidence_links.sql` (UNTACKED — naming collision risk)
  - `076_source_record_supersession.sql` + `076_sprint2_evidence_extend.sql` (UNTACKED — naming collision risk)
- **Gaps:** 001–007, 035, 037–041, 057

### supabase/migrations/ (files 008–088)
- Tracked: 50+ files (008–088)
- Notable difference from database/: **lacks `076_source_record_supersession.sql`** entirely
- Same collisions at 036, 055, 075, 076

### Risk: Migration naming collisions
The untracked files `075_sprint2_claim_evidence_links.sql` and `076_sprint2_evidence_extend.sql` exist in both `database/migrations/` and `supabase/migrations/` with the same prefix as tracked migrations. Migrating these (`git add`) would create a naming collision within a single directory. Additionally, supabase is missing `076_source_record_supersession.sql` entirely, creating a drift between the two migration directories.

---

## 7. Untracked Files (Full Inventory)

```
.hermes/preservation/01_KADARN_Constitucion_Arquitectonica_v2.0.docx
.hermes/preservation/02_KADARN_Implementation_Blueprint_v2.0.docx
.hermes/preservation/03_KADARN_Plan_Maestro_Realineacion_v2.0.docx
.hermes/preservation/foundation-docs.sha256
.hermes/preservation/health-route.patch
.hermes/preservation/health-route.sha256
.hermes/preservation/openspec-config.patch
.hermes/preservation/openspec-config.sha256
.hermes/vertical-slice-flat.sql
.hermes/vertical-slice-validate.sql
.hermes/vertical-slice.sql
.hermes/vslice-schema-correct.sql
database/migrations/075_sprint2_claim_evidence_links.sql
database/migrations/076_sprint2_evidence_extend.sql
foundation/00_ROOT_AUTHORITY/v2/01_KADARN_Constitucion_Arquitectonica_v2.0.docx
foundation/00_ROOT_AUTHORITY/v2/02_KADARN_Implementation_Blueprint_v2.0.docx
foundation/00_ROOT_AUTHORITY/v2/03_KADARN_Plan_Maestro_Realineacion_v2.0.docx
packages/types/src/claim-evidence-link.ts
scripts/audit-deps.sh
supabase/migrations/075_sprint2_claim_evidence_links.sql
supabase/migrations/076_sprint2_evidence_extend.sql
```

---

## 8. Worktrees (6 total)

| Path | HEAD | Branch/State |
|---|---|---|
| `.../kadarn-platform` (main repo) | `9c768481` | `fix/gov-004-security-remediation` |
| `.../kadarn-platform-migration` | `f8e1f11f` | `codex/migrate-architecture-expansion` |
| `.../worktrees/loop-3-build-remediation` | `9ed1873f` | `fix/kad-loop-003-session-tenant-contract` |
| `.../20260726-170449/validation-local-master` | `9ed1873f` | **detached HEAD** |
| `.../20260726-170449/validation-origin-master` | `c9e478df` | **detached HEAD** |
| `.../20260726-170449/validation-worktree` | `c9e478df` | **detached HEAD** |

---

## 9. Foundation Documents

Three v2.0 .docx files exist in **two locations** with identical SHA-256 hashes:

| File | SHA-256 |
|---|---|
| `01_KADARN_Constitucion_Arquitectonica_v2.0.docx` | `a9786528...` |
| `02_KADARN_Implementation_Blueprint_v2.0.docx` | `3b758843...` |
| `03_KADARN_Plan_Maestro_Realineacion_v2.0.docx` | `c1c0110f...` |

The `.hermes/preservation/` copies are exact duplicates with matching checksums — no content divergence.

---

## 10. GPG Signature Status

Only the HEAD merge commit (`9c768481`, authored via GitHub UI) carries a valid GPG signature (`E` = verified). The 10 most recent prior commits — including the first parent chain — are **unsigned** (`N`).

| Commit | GPG | Notes |
|---|---|---|
| `9c768481` | ✅ `E` | GitHub-signed merge |
| `afeeaf80` | ❌ `N` | Unsigned |
| `860c36fa` | ❌ `N` | Unsigned |
| `4b0ce3f8` | ❌ `N` | Unsigned (merge) |
| `9b4f6da6` | ❌ `N` | Unsigned |
| All prior (10 checked) | ❌ `N` | Unsigned |

---

## 11. Risks, Ambiguities & Blockers

### HIGH — Migration naming collisions (075, 076)
Untracked files with the same numeric prefix as tracked migrations exist in both `database/` and `supabase/` directories. Adding them would create duplicate migration numbers. The supabase directory is also missing `076_source_record_supersession.sql`, causing drift between the two migration directories.

### MEDIUM — Local master out of date
`refs/heads/master` is 3 commits behind `origin/master`. Operations relying on local master will reference `4b0ce3f8` instead of `9c768481`.

### MEDIUM — Main branch heavily stale
`origin/main` is 190 commits behind `origin/master`. If CI/CD, deployment, or any automation uses `main` as the default branch, it operates on content that is approximately 2+ days stale.

### MEDIUM — Dirty working tree
3 modified package files and 20 untracked files. The package diffs suggest uncommitted dependency changes.

### LOW — Duplicate prefix in tracked migrations (036, 055)
`036_ext_visibility.sql` and `055_hybrid_trial_readiness.sql` share numeric prefixes with other tracked migrations. While currently co-existing, this is a naming hygiene issue and could cause confusion in migration runners.

### LOW — Foundation docs duplicated
Three .docx files exist in two locations with identical content. Not a functional risk, but represents storage duplication.

### LOW — Tag naming anomaly
Tag `kux-foundation-v1]` has a trailing bracket — likely a typo from shell quoting.

### INFO — 6 active worktrees
Three are in detached HEAD state (preservation/validation snapshots). This is normal for preservation worktrees.

### INFO — No GPG signing on regular commits
Only the GitHub-UI merge commit is signed. Regular `viloresearch@gmail.com` commits are unsigned. This is a policy observation, not a technical blocker.

---

## 12. Classification

```
BASELINE_DIVERGED
```

**Rationale:** The canonical baseline (`kadarn-canonical-baseline-2026-07-25`) is reachable from HEAD and the cutover lineage is intact. However, the repository is not in a single coherent state:

1. Working tree is dirty with modifications that may affect dependency resolution
2. Migration numbering has collisions between tracked and untracked files
3. Local master is stale relative to the branch HEAD tracks
4. `main` remote branch is heavily divergent from `master` by 190 commits
5. Migration directories (database/ vs supabase/) have drifted from each other

A `BASELINE_CURRENT` classification would require: clean working tree, no migration naming collisions, local master synced with origin/master, and diagnostic clarity on the `main`/`master` split.

---

## 13. State Change Verification

**No state changes were made during this inspection.** Confirmed:

- No checkout, switch, reset, or restore
- No fetch, pull, push, merge, rebase, or cherry-pick
- No commit, tag, or stash operation
- No file writes or Git metadata modifications
- No builds, tests, or code execution
- No issue, label, or configuration changes

All commands executed were read-only (`git rev-parse`, `git status`, `git log`, `git diff`, `git branch`, `git tag`, `git remote`, `git worktree`, `git ls-files`, `ls`, `sha256sum`, `wc`).

---

*Report generated by Hermes — WO-MVP-00A — 2026-07-27*
*Next: Awaiting GPT Work audit and human gate approval before next LOOP.*
