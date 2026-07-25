# KADARN v2 — Architecture Complexity Report

**Date:** 2026-07-25
**Method:** Quantify every dimension of the proposed architecture. Compare v2 Blueprint vs. simplified vs. current.

---

## 1. Complexity Metrics

### Entity Count

| Metric | Current (v1) | v2 Blueprint | Simplified | Δ (vs Blueprint) |
|--------|-------------|-------------|------------|------------------|
| Domain entities | ~12 | ~25 | **16** | -9 |
| Database tables | ~18 | ~45 | **32** | -13 |
| Bounded contexts | ~4 (implicit) | 9 | **5** | -4 |
| Aggregate roots | ~6 | ~12 | **8** | -4 |
| Domain events | ~20 | ~30 | **20** | -10 |

### Service Count

| Layer | v2 Blueprint | Simplified | Δ |
|-------|-------------|------------|---|
| Domain services | 10 | **7** | -3 |
| Repositories | ~10 | **~8** | -2 |
| API routes (new) | ~14 | **~10** | -4 |
| API routes (changed) | ~11 | **~8** | -3 |

### Migration Count

| Category | v2 Blueprint | Simplified | Δ |
|----------|-------------|------------|---|
| New migrations | ~18 | **~10** | -8 |
| Tables created | ~27 | **~14** | -13 |
| Tables altered | ~6 | **~8** | +2 (simpler approach: extend existing) |

### Integration Complexity

| Metric | v2 Blueprint | Simplified |
|--------|-------------|------------|
| Cross-context FK references | ~12 | **~4** |
| Service→service calls | ~8 | **~3** |
| Event types (domain) | ~11 | **~8** |
| JSONB columns (vs. tables) | 0 | **~8** |

---

## 2. Complexity-to-Value Analysis

### High Complexity, High Value (KEEP)

| Component | Complexity | Value | Verdict |
|-----------|-----------|-------|---------|
| EvidenceSource + SourceRecord | Medium | Critical (Explainable Confidence) | KEEP |
| Claim versioning | Medium | Critical (Temporal Truth) | KEEP (simplified: columns, not table) |
| Protocol + Assessment | High | Critical (Core v2 question) | KEEP |
| KnowledgeSnapshot | Medium | Critical (Reproducibility) | KEEP |

### High Complexity, Low Value (SIMPLIFY or REMOVE)

| Component | Complexity | Value | Verdict |
|-----------|-----------|-------|---------|
| AcquisitionRun table | Low | Minimal (transient) | **REMOVE** → JSONB |
| Observations table | Medium | Low (transient) | **REMOVE** → JSONB |
| CapabilityState table | Medium | Low (can be columns) | **REMOVE** → columns |
| ClaimVersion table | High | Medium (can be columns) | **REMOVE** → columns |
| ProvenanceRecord table | Medium | Low (audit_events covers) | **REMOVE** → audit_events |
| EvidenceLink table | Medium | Low (JSONB sufficient) | **REMOVE** → JSONB |
| RequirementRule table | Medium | Low (defer to Phase 2) | **REMOVE** → DEFER |
| AssessmentResult table | Medium | Low (JSONB sufficient) | **REMOVE** → JSONB |
| Gaps table | Low | Very low (computed) | **REMOVE** → computed |
| Mitigations table | Low | Very low (JSONB) | **REMOVE** → JSONB |

---

## 3. Versioning Strategy Analysis

The most impactful simplification decision is whether to use separate tables for versioned entities or temporal columns.

### Option A: Separate ClaimVersion table (Blueprint)

**Pros:**
- Clean schema, no nullable columns
- Easy to query history
- No risk of update anomalies

**Cons:**
- Every claim read needs JOIN or subquery
- Double the tables (claim + claim_version, capability + capability_state)
- Backfill required for existing data
- More migrations, more code

**Net complexity:** High (2 new tables + backfill + JOINs)

### Option B: Temporal columns on Claim/Capability tables (Simplified)

**Pros:**
- Same table, same APIs
- No backfill needed (existing rows get default temporal values)
- Single query for current + historical data
- No new migrations for the core entity

**Cons:**
- Wider tables with nullable temporal columns
- History queries use COALESCE/WHERE clauses instead of JOINs
- Version ordering logic in application code

**Net complexity:** Low

### Recommendation: Option B for MVP

PostgreSQL temporal tables or soft versioning via columns is sufficient for the first three vertical slices. A dedicated ClaimVersion table can be introduced in Phase 2 if query performance or snapshot reproducibility requires it.

---

## 4. Simplification Impact on Development Effort

| Area | v2 Blueprint (tables) | Simplified (JSONB + columns) | Savings |
|------|----------------------|------------------------------|---------|
| Migrations | 18 | **10** | -8 migrations |
| Types (Zod) | ~20 new | **~10 new** | -10 types |
| API routes | ~14 new | **~10 new** | -4 routes |
| Tests | ~80 new | **~50 new** | -30 tests |
| Documentation | 8 specs | **5 specs** | -3 specs |
| **Est. developer days** | **73** | **~45** | **~28 days (38%)** |

---

## 5. Risk Impact

| Risk | Blueprint | Simplified | Notes |
|------|-----------|------------|-------|
| Schema migration failure | More tables = more risk | Fewer tables = less risk | 18→10 migrations |
| Backfill corruption | High (claim_versions) | Low (columns nullable) | No backfill needed |
| JSONB query perf | N/A | Moderate risk | Mitigation: GIN indexes |
| Developer onboarding | Higher (45 tables) | Lower (32 tables) | Significant reduction |
| Future expansion | Easy (schema ready) | Moderate (may need extraction) | Acceptable risk for MVP |

---

## 6. What-if Analysis

### What if we removed ALL new tables and only extended existing ones?

**Minimum viable new tables:**
1. `evidence_sources` (new — needed for Source Authority)
2. `source_records` (new — needed for provenance)
3. `protocols` (new — needed for assessment)
4. `protocol_versions` (new — needed for assessment)
5. `assessments` (new — needed for assessment)
6. `knowledge_snapshots` (new — needed for reproducible publication)
7. `claim_evidence_links` (new — needed for supports/contradicts)
8. `audit_events` (new — compliance)

**Everything else:**
- Extend `claims` with valid_from/until, version, epistemic_type
- Extend `capabilities` with valid_from/until, conditions, availability
- Extend `evidence_nodes` with source_id, source_record_id
- JSONB for observations, assessment_results, mitigations
- Keep `published_knowledge` as `packages` (rename only)
- Keep `readiness_scores` as assessment cache

**Total new tables: 8** (vs. 27 in Blueprint — **70% fewer**)
