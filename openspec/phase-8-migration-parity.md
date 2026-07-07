# Phase 8 Migration Parity — Source of Truth

**Status:** Active (Remediation S-2)  
**Authority:** `supabase/migrations/` is the **only apply path** for local dev, CI, and staging/prod via Supabase CLI.

---

## Dual tree policy

| Directory | Role |
|-----------|------|
| [`supabase/migrations/`](../supabase/migrations/) | **Apply** — `npx supabase db reset` / `supabase migration up` |
| [`database/migrations/`](../database/migrations/) | **Reference mirror** — parity tests for shared prefixes; not applied by Supabase CLI |

Do **not** run `database/migrations/` directly against Supabase unless explicitly mirroring a fix back to `supabase/`.

---

## Numbering collision matrix (046–050)

| Version | `database/migrations/` | `supabase/migrations/` |
|---------|------------------------|-------------------------|
| **046** | `046_discovery_core.sql` | `046_evidence_lineage.sql` (Phase 8) |
| **047** | `047_discovery_preparation.sql` | `047_phase8_claims_and_views.sql` |
| **048** | `048_discovery_agent_outputs.sql` | `048_phase8_hybrid_index.sql` |
| **049** | `049_discovery_curation.sql` | `049_phase8_staging_cutover_seed.sql` |
| **050** | `050_validation_notes.sql` | `050_discovery_core.sql` (Discovery renumber) |

**046–048 in cutover docs** refers to **Phase 8** migrations in `supabase/` only.

Discovery DDL for local Supabase lives at **050–054** in `supabase/migrations/`.

---

## Supabase-only migrations

| Version | Purpose |
|---------|---------|
| 035 | Append-only helpers stub |
| 041 | Domain events runtime (renumber from database 036) |
| 049 | Phase 8 staging passport seed |
| 055 | Discovery staging seed |
| 056 | Public read grants (discovery, memberships) |
| 057 | GoTrue seed user compatibility |
| 058 | Phase 8 RLS + Evidence Core grants |

---

## Gap: database 035

`database/migrations/036_domain_events_runtime.sql` depends on `035_compliance_append_only` which **does not exist** in `database/`. Supabase uses `035_append_only_helpers.sql`.

---

## Verification commands

```bash
# Apply full chain
npx supabase db reset

# Parity + RLS source tests
npm run test -w tests -- tests/integration/migration-parity-phase8.test.ts
npm run test -w tests -- tests/integration/rls-coverage-045-049.test.ts

# Staging cutover smoke
npm run staging:cutover-smoke -w tests
```

---

*Remediation plan S-2 — do not edit numbering without updating this matrix.*
