# Phase 1 — Source Acquisition Report

## 1. SourceRecord Field Validation

The Loop 2 spec requires SourceRecord to support these fields. Here is the field-by-field audit:

| # | Required Field | DB Column | Status | Notes |
|---|----------------|-----------|--------|-------|
| 1 | institution | `institution_id` UUID FK | ✅ Present | 074 |
| 2 | tenant | `institution_id` serves as tenant | ✅ Implicit | RLS uses institution_id for tenant isolation |
| 3 | source system | `evidence_source_id` UUID FK | ✅ Present | 074, FK to evidence_sources |
| 4 | document | `record_type` TEXT | ✅ Present | 074, free-text type |
| 5 | API | `evidence_source_id` + `source_type=api_endpoint` | ✅ Via source | EvidenceSource has source_type enum |
| 6 | manual observation | `acquisition_method=manual_entry` | ✅ Via source | EvidenceSource.acquisition_method |
| 7 | external registry | `source_type=registry` | ✅ Via source | EvidenceSource.source_type |
| 8 | event | `evidence_source_id` + event_pattern | ✅ Via source | Event ledger (075) feeds generation |
| 9 | measurement | `record_type` = 'measurement' | ✅ Via record_type | Free-text, flexible |
| 10 | attachment | `locator_uri` TEXT | ✅ Present | 074, URI to stored attachment |
| 11 | hash | `content_hash` TEXT | ✅ Present | 074, SHA-256 or similar |
| 12 | mime type | `raw_metadata->>mime_type` | ✅ Via JSONB | Flexible metadata storage |
| 13 | version | `source_version` TEXT | ✅ Present | 074 |
| 14 | external identifier | `external_record_id` TEXT | ✅ Present | 074 |
| 15 | acquired timestamp | `acquired_at` TIMESTAMPTZ | ✅ Present | 074, NOT NULL, default now() |
| 16 | observed timestamp | `observed_at` TIMESTAMPTZ | ✅ Present | 074, nullable |
| 17 | effective period | `valid_from` + `valid_until` | ✅ Present | 074, both nullable TIMESTAMPTZ |
| 18 | supersession | `superseded_by` UUID self-FK | ✅ Present | 076, self-referential |
| 19 | invalidated | `invalidation_status` TEXT | ✅ Present | 076, CHECK(active/superseded/invalidated) |
| 20 | storage locator | `locator_uri` TEXT | ✅ Present | 074 |
| 21 | ownership | `institution_id` FK | ✅ Present | 074, determines RLS ownership |
| 22 | status | `acquisition_status` enum | ✅ Present | 074, pending/acquired/verified/invalidated/superseded |

**Result: 22/22 fields supported. ZERO schema gaps.**

---

## 2. RLS Audit

### source_records (074)
- **RLS Enabled:** ✅
- **Policies:** 4 (select, insert, update, service_role)
- **Pattern:** institution-scoped (NULL = global, or membership check via organization_memberships)
- **Verdict:** ✅ Production-ready

### evidence_sources (073)
- **RLS Enabled:** ✅
- **Policies:** 4 (select, insert, update, service_role)
- **Pattern:** institution-scoped + global sources visible to all authenticated
- **Verdict:** ✅ Production-ready

### institutional_events (075)
- **RLS Enabled:** ✅
- **Policies:** 0 — **GAP: NO RLS POLICIES DEFINED**
- **Risk:** Any authenticated user can read/write all institutional events
- **Fix:** Migration 080 — add tenant-scoped policies matching the pattern used in source_records

---

## 3. API Audit

### Existing SourceRecord APIs

| Route | Methods | Status | Notes |
|-------|---------|--------|-------|
| `/api/v1/evidence-sources` | GET, POST | ✅ | List + create sources |
| `/api/v1/evidence-sources/[id]` | GET, PATCH, DELETE | ✅ | Single source CRUD |
| `/api/v1/evidence-sources/[id]/records` | GET, POST | ✅ | List + create records for a source |
| `/api/v1/source-records/[id]` | GET | ✅ | Single record fetch |

**Missing APIs (for Loop 2 Phase 9):**
- `POST /api/v1/source-records` — create without source context (convenience)
- `PATCH /api/v1/source-records/[id]` — update status (acquire/supersede/invalidate)
- `POST /api/v1/source-records/[id]/supersede` — explicit supersession action
- `POST /api/v1/source-records/[id]/invalidate` — explicit invalidation action

**Verdict:** Core acquisition APIs exist. Supersession/invalidation actions need explicit endpoints.

---

## 4. Repository Audit

### Existing
- No `SourceRecordRepository` exists
- No `EvidenceSourceRepository` exists
- API routes use Supabase client directly (no repository abstraction)

### Gap
The Loop 2 spec requires reproducible evidence generation. A `SourceRecordRepository` is needed for:
- Deterministic acquisition (hash, verify, store)
- Supersession chaining (traverse superseded_by)
- Integration with generation pipeline (provide inputs)

---

## 5. Type Audit

### SourceRecord types (`sources.ts`)
- `SourceRecordSchema`: ✅ Complete, matches DB
- `CreateSourceRecordSchema`: ✅ Complete, matches DB
- `UpdateSourceRecordSchema`: ❌ MISSING — no update schema defined
- Supersession fields: ❌ MISSING from types — `superseded_by`, `supersession_reason`, `invalidation_status` not in `SourceRecordSchema`

### EvidenceSource types (`sources.ts`)
- `EvidenceSourceSchema`: ✅ Complete
- `CreateEvidenceSourceSchema`: ✅ Complete
- `UpdateEvidenceSourceSchema`: ✅ Complete

### InstitutionalEvent types (`events.ts`)
- Uses plain TypeScript interface, not Zod schema
- Missing: `CreateInstitutionalEventSchema`, validation

---

## 6. Gap Summary for Phase 1

| # | Gap | Severity | Fix | Migration |
|---|-----|----------|-----|-----------|
| 1 | `institutional_events` has no RLS policies | HIGH | Add tenant-scoped policies | 080 |
| 2 | `SourceRecordSchema` missing supersession fields | MEDIUM | Add `superseded_by`, `supersession_reason`, `invalidation_status` to Zod schema | None (types only) |
| 3 | No `UpdateSourceRecordSchema` | MEDIUM | Create update schema for status transitions | None (types only) |
| 4 | No `SourceRecordRepository` | MEDIUM | Create DB-backed repository | None (code only) |
| 5 | No supersede/invalidate API endpoints | LOW | Add explicit action endpoints | None (code only) |
| 6 | `InstitutionalEvent` uses interface not Zod | LOW | Convert to Zod schema with create/update | None (types only) |
| 7 | No `EventRepository` DB-backed implementation | MEDIUM | Replace in-memory stub with Supabase-backed repository | None (code only) |

---

## 7. Source Acquisition Design Decisions

### Decision 1: institutional_events RLS (migration 080)
Add 4 policies matching source_records pattern:
- `ie_select_tenant`: SELECT WHERE tenant_id IN (org memberships) OR service_role
- `ie_insert_tenant`: INSERT WITH CHECK same condition
- `ie_update_tenant`: UPDATE same condition
- `ie_all_service`: ALL for service_role

### Decision 2: SourceRecord types extension (no migration)
Extend `SourceRecordSchema` in `sources.ts` to include:
- `superseded_by: z.string().uuid().optional().nullable()`
- `supersession_reason: z.string().optional().nullable()`
- `invalidation_status: z.enum(['active', 'superseded', 'invalidated']).default('active')`

Add `UpdateSourceRecordSchema` for status transitions:
- `acquisition_status: AcquisitionStatus.optional()`
- `invalidation_status: z.enum(['active', 'superseded', 'invalidated']).optional()`
- `superseded_by: z.string().uuid().optional()`
- `supersession_reason: z.string().optional()`

### Decision 3: SourceRecordRepository (code only)
Create `packages/platform-services/src/repositories/source-record-repository.ts`:
- `findById(id)`
- `findByEvidenceSource(sourceId, pagination)`
- `create(input)`
- `supersede(id, supersededById, reason)`
- `invalidate(id, reason)`
- `findSupersessionChain(id)` — traverse superseded_by

### Decision 4: EventRepository (code only)
Replace in-memory stub with DB-backed implementation:
- `appendEvent(event)` — INSERT into institutional_events
- `findById(id)` — SELECT by id
- `findByCorrelationId(correlationId)` — SELECT by correlation
- `findByOrganization(orgId, pagination)` — SELECT by organization_id

### Decision 5: InstitutionalEvent Zod schemas (types only)
Convert `events.ts` from plain interface to Zod:
- `InstitutionalEventSchema` (full)
- `CreateInstitutionalEventSchema` (for API input)
- Validate: idempotency_key required, actor_type CHECK, payload JSONB

---

## 8. Verdict

**SourceRecord schema is production-ready.** All 22 required fields are supported. The table has proper RLS, indexes, triggers, and constraints.

**Gaps to fix in implementation:**
1. `institutional_events` RLS policies (migration 080) — blocking for tenant safety
2. Type extensions for supersession fields (no migration)
3. Repository implementations (code only)
4. API action endpoints for supersede/invalidate (code only)

**No schema changes needed for source_records itself.** The table is complete.
