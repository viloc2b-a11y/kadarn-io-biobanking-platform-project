# WO-KEMS-001 — KEMS-001 Progressive Interview + RAG Document Vault

**Work Order ID:** WO-KEMS-001
**Status:** REPORT_READY — awaiting Human Gate evidence review
**Authority:** KPO (KADARN Program Office)
**Parent PR:** https://github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project/pull/29

---

## 1. REPOSITORY COORDINATES

| Coordenada | Valor |
|---|---|
| **Canonical repository** | `D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform` |
| **Remote origin** | `https://github.com/viloc2b-a11y/kadarn-io-biobanking-platform-project.git` |
| **Canonical base branch** | `master` |
| **Working branch** | `fix/gov-004-security-remediation` |
| **Merge base** | `f2364ef250f88469e2be2b70c4f366d876f05980` |
| **Full HEAD** | `9307acad9beb9d787ee2424521ee142df6c559e8` |
| **Working tree** | CLEAN |
| **Files changed** | 119 files, +18,894 / −197 lines |

---

## 2. COMMITS IN SCOPE

```
9307acad feat: KEMS-001 progressive interview + RAG document vault
8f50b830 fix: improve wizard step navigation
4e54ccb5 fix: resolve onboarding route conflict
a2772360 feat: KADARN-PLAN-MVP-003 — MVP completo (19/19 bloques)
```

---

## 3. MIGRATION 094 — SCHEMA

### Tables created (5)

| Table | Rows | Purpose |
|---|---|---|
| `evidence_sources` | — | Document uploads: file metadata, extracted text, processing pipeline status |
| `document_chunks` | — | Chunked text with pgvector(1536) embeddings for semantic search |
| `claims` | — | KEMS-aligned claims with hash dedup, 6 confidence levels, version tracking |
| `claim_evidence_links` | — | Typed relationships (supports/contradicts/corroborates) with evidence class A-F |
| `questionnaire_templates` | 4 seed rows | Progressive interview modules: Identity, Clinical, Lab, Quality |

### Indexes (6)
- `idx_document_chunks_embedding` — ivfflat(vector_cosine_ops) with 100 lists
- `idx_claims_institution`, `idx_claims_hash`, `idx_claims_category`, `idx_claims_confidence`
- `idx_evidence_sources_institution`, `idx_document_chunks_source`
- `idx_claim_evidence_links_claim`, `idx_questionnaire_templates_level`

### RLS Policies (12)
- Tenant isolation via `auth.uid()` → `organization_memberships`
- INSERT/UPDATE/DELETE policies on all 5 tables
- `questionnaire_templates` is read-only (public templates)

---

## 4. CODE DELIVERABLES

### 4.1 Types (`packages/types/src/kems-claim.ts`)

| Export | Purpose |
|---|---|
| `KemsClaim`, `KemsClaimSchema` | Progressive interview claim entity |
| `KemsConfidenceLevel` | 6-value enum: declared→documented→verified→expired→contradicted→unknown |
| `KemsEvidenceSource`, `KemsEvidenceSourceSchema` | Document upload tracking |
| `DocumentChunk`, `DocumentChunkSchema` | RAG chunk with similarity score |
| `KemsClaimEvidenceLink`, `EvidenceRelationshipType` | Typed claim-evidence relationships |
| `QuestionnaireTemplate`, `QuestionnaireField` | Dynamic progressive modules with `activates_evidence` |
| `ConfidenceState`, `ConfidenceContribution` | KEMS-001 §2 Component D shape |
| `EVIDENCE_CLASSES` | A-F with decay months and default weights |
| `CONFIDENCE_LABELS` | Color-coded badges (📝/📄/✅/⏰/⚠️/—) |

### 4.2 API Endpoints (3)

**`POST/GET /api/v1/claims`**
- POST: Creates claim with SHA-256 hash dedup. Returns existing if duplicate.
- GET: Lists claims by institution_id + optional category filter.

**`POST /api/v1/documents/upload`** + **`GET /api/v1/documents/search?q=`**
- Upload: file → PyPDF2/DOCX/TXT extraction → chunk (1000 char, 200 overlap) → OpenAI embedding (1536 dims) → Supabase storage
- Search: query → embedding → pgvector cosine similarity → top-5 results with scores

**`GET /api/v1/questionnaire-templates?level=N`**
- Returns progressive interview modules with full JSONB schema.

### 4.3 UI Component

**`ProgressiveInterview`** (`apps/web/src/components/onboarding/progressive-interview.tsx`)
- 4-level wizard: Identity → Clinical → Lab (conditional) → Quality
- Field types: text, textarea, boolean, select, multi_select, file
- `activates_evidence` flag triggers Document Vault on "Yes" answers
- ClaimBadge with color-coded confidence indicators
- localStorage draft persistence

---

## 5. TYPE CHECK

```
$ npm run typecheck
> packages/types     — PASS (0 errors)
> instrumentation   — PASS (0 errors)
> apps/api          — PASS (0 errors)
```

---

## 6. END-TO-END WALKTHROUGH

```
1. User opens /onboarding/wizard
2. Selects "Hospital" (Level 1 — Identity)
3. Answers "Yes" to "Do you have -80°C storage?" (Level 3 — Lab)
4. System creates Claim:
   {
     claim_hash: SHA256("Do you have -80°C storage?::true"),
     question_text: "Do you have -80°C storage?",
     answer_value: "true",
     category: "infrastructure",
     confidence_level: "declared"
   }
5. Document Vault opens
6. User uploads "freezer_calibration_2025.pdf"
7. API extracts text via PyPDF2
8. Text chunked: system splits into ~1000-char overlapping segments
9. OpenAI generates 1536-dim embeddings per chunk
10. Chunks stored in document_chunks with vector index
11. Claim evidence link created:
    {
      claim_id: <uuid>,
      source_id: <uuid>,
      relationship_type: "supports",
      evidence_class: "B"
    }
12. Claim status updated: confidence_level → "documented"
13. Future query: GET /api/v1/documents/search?q=freezer calibration
    Returns top-5 chunks with cosine similarity > 0.7
```

---

## 7. KEMS-001 IMPLEMENTATION STATUS

| KEMS-001 Component | Status | Notes |
|---|---|---|
| **§1 Claim** — bounded assertion | ✅ Implemented | Hash dedup, answer_type, category |
| **§2 Component A** — Claim entity | ✅ Implemented | KemsClaimSchema |
| **§2 Component B** — Evidence Node (immutable, append-only) | ❌ Not yet | DB table exists but no immutability trigger |
| **§2 Component C** — Evidence Relationship (typed) | 🟡 Partial | `claim_evidence_links` exists; missing `support_strength`, `extracted_fact_id` |
| **§2 Component D** — Confidence State (emergent, explainable) | ❌ Not yet | Interface defined, no computation engine |
| **§3 Evidence Classes A-F** | 🟡 Partial | Constants defined; DB inserts use class 'B' only |
| **§4 Counter Evidence** | ❌ Not yet | `is_counter_evidence` flag exists, no negative weight pipeline |
| **§5 Confidence Algorithm** | ❌ Not yet | Explicitly deferred per KEMS-001 |
| **§6 Explainability** | ❌ Not yet | `explanation` field exists, not populated |
| **§7 Evidence Node immutability** | ❌ Not yet | No `wasRevisionOf`/`supersedes` triggers |
| **§8 Right of Response** | ❌ Not yet | `response_to_claim_id` column exists, no flow |

**Overall: ~40-50% of KEMS-001 specification implemented.**

---

## 8. RISK REGISTER

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| **R1** | OpenAI embeddings process document text externally — PII/PHI exposure | 🔴 HIGH | Requires BAA with OpenAI OR local embedding fallback (all-MiniLM-L6-v2 already in codebase as fallback). Redaction pipeline needed before sending. |
| **R2** | RAG search returns chunks without verifying institutional ownership | 🟡 MEDIUM | Future: add `institution_id` filtering in search query. Currently scoped to `site_id`. |
| **R3** | Auto-upgrade from `declared` → `documented` on any file upload — no reviewer gate | 🟡 MEDIUM | Future: add `review_status` column, require reviewer approval before status change. |
| **R4** | Missing immutability triggers on evidence_nodes | 🟡 MEDIUM | Future: migration to add `wasRevisionOf`, append-only constraint. |
| **R5** | No expiration cron — `expired` status never auto-applied | 🟡 MEDIUM | Future: cron job scanning `expiration_date` on evidence_sources. |

---

## 9. FUNCTIONAL ASSESSMENT

| Layer | Completion |
|---|---|
| **Technical vertical slice** (answer→claim→upload→extract→link→search) | **~70-80%** |
| **Evidence Core MVP** (per KEMS-001 full spec) | **~40-50%** |

### What this IS:
A working first vertical slice that proves the pipeline: user answers → claim creation → document ingestion → text extraction → semantic search. The old wizard (localStorage flat form) has been replaced by a claim-driven progressive interview with document vault integration.

### What this IS NOT:
A complete KEMS-001 implementation. Missing: Confidence Graph computation, Provenance tracking, Counter Evidence handling, Evidence Node immutability, expiration automation, entity/location/asset granularity, and publication access controls.

---

*Generated by Hermes under KPO governance — WO-KEMS-001 — 2026-07-30*
