# Phase 8 — Gap Analysis

**Status:** Living document (reorganized 2026-07-03)  
**Prerequisite to:** Sprint 28A code  
**Sources:** Code audit, [phase-8-evidence-evolution-architecture.md](phase-8-evidence-evolution-architecture.md), KEMS-004/005/006, AF-2.1 registry

---

## Executive summary

Kadarn has substantial Discovery Workbench and engine wiring progress, but Phase 8 target architecture is **not yet implemented in production**. The gap is structural: lineage objects, immutable Claims with Provenance, Published Views, and integration boundaries exist as design or isolated spikes — not as wired production code.

**Implementation order:** Domain Freeze → Contracts → Tests → Migration. Do not migrate before domain freeze.

**Transition:** Compatibility Layer (Read Adapter Only) in 28D; cutover in 28K after Legacy Equivalence Validation Gate.

---

## Gap map — current vs Phase 8 target

| Area (current) | Current state | Phase 8 target | Gap | Sprint |
|----------------|---------------|----------------|-----|--------|
| **Domain contracts** | Draft in `packages/types/src/phase8/` (partial) | Frozen, exported, contract-tested | Medium | 28A |
| **Layer 0/1 artifacts** | Discovery tables; read-only provenance API | Source → SourceVersion → Artifact | High | 28B |
| **Agent outputs** | `discovery_agent_outputs` JSON | ExtractionRun + typed ExtractedFact | High | 28B |
| **Claim candidates** | Provisional Discovery output | ClaimCandidate engine + promotion | Medium | 28C |
| **Evidence Core claims** | Phase 1 table; limited UPDATE | ClaimInstance + ClaimVersion immutable | High | 28G, 28I |
| **Claim Provenance** | Spike in evidence-lineage only | ClaimProvenance co-created (KEMS-004) | Critical | 28E |
| **RECONSTRUCT** | Not implemented | Core read service (KEMS-004 §7) | Critical | 28E |
| **Published Views** | Dashboard reads engines directly | View projection only (ADR-030) | Critical | **28D** |
| **Compatibility Layer** | Not implemented | LegacyReadAdapter read-only | Critical | **28D** |
| **Evidence Pack** | Stub in evidence-lineage | Auto-generated per Claim (ADR-031) | High | **28F** |
| **Connector Layer** | Framework exists | Source ingestion + real providers | Medium | 28J |
| **Confidence** | Stored on continuity claims | Derived in Published Views (ADR-029) | Medium | 28H |
| **External integration API** | No Outbound Evidence API | Published View outbound only | High | 28J |
| **Indexing** | Ad-hoc SQL | Hybrid BTREE/GIN/MATVIEW (ADR-032) | Medium | 28K |
| **Legacy equivalence tests** | None | Golden parity gate | Critical | Gate |

---

## Code inventory (2026-07-03)

| Package / area | Exists | Wired to API | Phase 8 need |
|----------------|--------|--------------|--------------|
| `packages/evidence-lineage` | Yes (52 tests) | No | Evolve with repos; stay independent |
| `packages/evidence-core` | Yes | Yes | Frozen; adapters only |
| `packages/evidence-discovery` | Yes | Yes (dashboard) | Align to Facts pipeline (28B) |
| `packages/published-view` | Shell only | No | 28D Compatibility Layer |
| `packages/types/src/phase8` | Partial copy | No export | 28A freeze |
| `packages/provenance` | Yes (W3C) | No | Keep separate from KEMS-004 |
| ClaimProvenance repository | No | — | 28E |
| Published View service | No | — | 28D |
| Evidence Pack generator | Stub | — | 28F |
| Legacy equivalence tests | No | — | Gate |

---

## Runtime hot spots (legacy reads to eliminate)

| Location | Pattern | Target sprint |
|----------|---------|---------------|
| `apps/api/.../continuity/passport/**` | Direct `continuity_experience_claims` | 28D (via adapter) |
| `apps/api/src/lib/continuity-claim-service.ts` | 15+ legacy table refs | 28D read / 28K write cutover |
| `apps/api/src/lib/dashboard-engines.ts` | Recalculates engines per request | 28D (feed view builders) |
| `apps/api/.../institution/public/**` | Engine aggregation | 28D |
| `apps/api/.../discovery/dashboard` | Engine aggregation | 28D |

Passport example (unchanged as of audit):

```text
continuity_experience_claims → map in route handler → JSON
```

Target:

```text
continuity_experience_claims → LegacyReadAdapter → PublishedView → JSON
```

After 28K:

```text
Evidence Core v2 → PublishedViewEngine → JSON
```

---

## Integrity blockers (parallel track)

Resolve before Phase 8 production pilot merge to `main`:

| ID | Finding | Impact | Remediation |
|----|---------|--------|-------------|
| C-003 | KEMS reconciliation `docs/kems/` vs `vendor/kems/` | Design authority drift | Architecture Review |
| C-004 | Commercial flow incomplete | Published Views need consent/Mutual Reveal | Phase 5 or scoped 28D gate |
| C-006 | Supabase tests skipped | Immutability triggers unverified | CI Supabase gate |

---

## Sprint dependency graph

```text
28A (contracts)
  → 28B (facts) → 28C (claims)
  → 28D (views + compatibility layer)  ← first prod value
  → 28E (provenance) → 28F (evidence pack)
  → 28G → 28H → 28I → 28J
  → Gate (equivalence)
  → 28K (cutover + index)
  → 28L (AF-3.0)
```

**Phase 9 hard gate:** 28D + 28F in production before 29B+ merge.

---

## KEMS / ADR status

| Document | Status | Implementation sprint |
|----------|--------|----------------------|
| KEMS-004 | Ratified v1.0 | 28E, 28F |
| KEMS-005 | Ratified v1.0 | 28I |
| KEMS-006 | Ratified v1.0 | 28J |
| ADR-027 Fact/Claim separation | Proposed | 28B, 28C |
| ADR-028 Claim immutability | Proposed | 28G |
| ADR-029 Confidence derived | Proposed | 28H |
| ADR-030 Published View boundary | Proposed | **28D** |
| ADR-031 Evidence Pack contract | Proposed | **28F** |
| ADR-032 Hybrid indexing | Proposed | 28K |

---

*Updated 2026-07-03 to reflect reorganized sprint order and Compatibility Layer strategy.*
