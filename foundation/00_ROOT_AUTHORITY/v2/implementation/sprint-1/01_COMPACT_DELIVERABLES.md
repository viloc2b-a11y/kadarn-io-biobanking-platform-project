# Sprint 1 — Domain Decisions, Schema, Security, APIs, Tests

## 01_DOMAIN_DECISIONS.md

| Decision | Outcome |
|----------|---------|
| Source vs SourceRecord | Source = logical producer (stable). SourceRecord = acquired instance (per acquisition). |
| Global vs institutional sources | `institution_id` nullable. NULL = global/public source. Non-NULL = institution-owned. |
| Source uniqueness | `canonical_name` UNIQUE across all sources. |
| Authority levels | 6 levels: regulatory → authoritative_registry → transactional_system → institutional_record → human_attestation → inferred_or_generated |
| Freshness policies | 5 policies: no_expiration, fixed_duration, source_defined, event_driven, manual_review. Config via JSONB. |
| SourceRecords mutable? | Only `acquisition_status` and `raw_metadata`. Core fields are immutable after creation. |
| Evidence integration | Deferred to Sprint 2. `evidence_nodes.source_record_id` will be added as nullable FK. |

## 02_SCHEMA_IMPLEMENTATION.md

**evidence_sources** (073): id (PK), institution_id (FK→orgs, nullable), source_type (enum), canonical_name (UNIQUE), producer_type (enum), producer_name, authority_level (enum), acquisition_method (enum), freshness_policy (JSONB), verification_policy, base_uri, external_system_identifier, active, metadata (JSONB), created_at, updated_at. 3 indexes. RLS: global sources visible to all; institutional sources scoped by membership.

**source_records** (074): id (PK), evidence_source_id (FK→sources), institution_id (FK→orgs, nullable), external_record_id, record_type, source_version, acquired_at, observed_at, valid_from, valid_until, content_hash, locator_uri, acquisition_status (enum), raw_metadata (JSONB), created_at, updated_at. 5 indexes. Same RLS pattern.

## 04_SECURITY_AND_TENANCY.md

- Global sources (institution_id IS NULL): visible to ALL authenticated users.
- Institutional sources (institution_id IS NOT NULL): visible only to members of that institution.
- Service role bypasses all RLS.
- SourceRecords inherit tenancy from their source (no independent tenancy).
- Private operational knowledge: publication requires explicit promotion to Evidence + governance.

## 05_API_CONTRACTS.md

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/v1/evidence-sources` | List sources (filterable) | Required |
| POST | `/api/v1/evidence-sources` | Create source | Required |
| GET | `/api/v1/evidence-sources/[id]` | Read source | Required |
| PATCH | `/api/v1/evidence-sources/[id]` | Update source | Required |
| GET | `/api/v1/evidence-sources/[id]/records` | List records for source | Required |
| POST | `/api/v1/evidence-sources/[id]/records` | Create record | Required |
| GET | `/api/v1/source-records/[id]` | Read single record (with source join) | Required |

All responses: `{data, error}`. Errors: `{data: null, error, details?}`. Pagination via `?limit=&offset=`.

## 06_TEST_AND_VALIDATION_REPORT.md

**Sprint 1 tests:** 15 passed, 0 failed.
- EvidenceSource: create global/list/filter/reject invalid/update/create institutional/reject duplicate (8)
- SourceRecord: create/list by source/read by ID/reject invalid FK/supersede (5)
- RLS: site reads own / sponsor blocked / both read global (3)

**Full suite:** 1337 passed, 19 failed (baseline unchanged). 76 suites passed (+1). 0 regressions.
