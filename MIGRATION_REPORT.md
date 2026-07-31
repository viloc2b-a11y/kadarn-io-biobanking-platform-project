# MIGRATION REPORT — WO-KEMS-PRODUCTION-001

**Date:** 2026-07-30
**Environment:** Supabase Local (Docker, PostgreSQL 17.6, port 55432)

---

## Migration Execution Summary

| Migration | Tables | Status | Notes |
|---|---|---|---|
| 095 | claims_ext, claim_versions, claim_attestations, claim_dependencies, claim_conflicts, claim_reconfirmations | ✅ APPLIED | All tables + policies created |
| 096 | site_profiles, site_profile_versions, profile_attestations, profile_publications | ✅ APPLIED | All tables + policies created |
| 097 | evidence_authenticity_signals, evidence_entity_relationships, evidence_conflicts, evidence_review_events | ✅ APPLIED | All tables + policies created |
| 098 | capability_instances, capability_claim_links, capability_dependency_status, capability_activation_events, document_taxonomy_rules | ⚠️ PARTIAL | Syntax error in ENUM definition prevented table creation. Tables created manually. 48 taxonomy seeds inserted correctly. |
| 099 | RLS policies (18), triggers (17), helper functions (6) | ✅ APPLIED | All policies + triggers created |

---

## Seed Data

| Seed | Result |
|---|---|
| 48 taxonomy rules | ✅ 48/48 inserted, idempotent (ON CONFLICT DO NOTHING) |
| Pilot Vilo Research | ❌ Schema mismatch — organizations.created_by NOT NULL, claims.created_by_actor_id NOT NULL |

---

## Row Counts (post-migration)

| Table | Rows |
|---|---|
| site_profiles | 1 |
| document_taxonomy_rules | 48 |
| evidence_sources | 4 |
| capability_instances | 0 |
| claims | 0 |

---

## Known Issues

1. **Migration 098 syntax**: ENUM `capability_activation_state` definition has a syntax error that prevents table creation. Tables were manually created successfully. The migration file needs repair.
2. **Pilot seed**: Organizations table has `created_by NOT NULL`; claims has `created_by_actor_id NOT NULL`. Seed needs to provide valid user UUIDs or seed must run after auth setup.
3. **RLS verification**: `authenticator` role not present in local Supabase — RLS compilation verified but runtime tenant isolation test not executable without auth layer.

---

*MIGRATION_REPORT.md — WO-KEMS-PRODUCTION-001 — 2026-07-30*
