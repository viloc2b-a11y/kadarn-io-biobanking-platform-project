# ORP-1.6 — Read Model Inventory (FROZEN)

**Date:** 2026-07-07
**Status:** Contracts frozen. Read Models will not change their public interfaces after ORP-1.6.

---

## Architecture

```
Canonical Objects (Institution, Location, Person, Equipment, Laboratory,
                   Document, Evidence, TimelineEvent, Claim)
        │
        ▼
KnowledgeContext (claims, evidence, provenance, + reserved slots)
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                    DERIVED READ MODELS                       │
│                                                              │
│  derivePassportReadModel                                     │
│  └─► deriveCapabilityReadModel                               │
│  └─► deriveReadinessReadModel                                │
│                                                              │
│  deriveRoadmapReadModel                                      │
│  └─► consumes PassportData + canonical objects               │
└──────────────────────────────────────────────────────────────┘
```

---

## Inventory

### 1. derivePassportReadModel

| Attribute | Value |
|-----------|-------|
| **File** | `passport-read-model.ts` (526 lines) |
| **Purpose** | Central read model. Derives full institutional passport from canonical objects. |
| **Input** | `PassportReadModelInput`: institutionId, institutionName, answers (Record), uploadedDocs?, knowledge? |
| **Output** | `PassportData`: institution, evidence, capabilities, readiness, nextSteps, enrichment? |
| **Pure** | ✅ Same input → same output |
| **Deterministic** | ⚠️ Uses `Date.now()` for `generatedAt` — acceptable (timestamp metadata, not computation input) |
| **Stateless** | ✅ No side effects, no state mutation |
| **Idempotent** | ✅ Repeated calls with same input yield same output |
| **Canonical sources** | `people_team_members`, `infra_location_infrastructure`, `org_locations`, `org_type`, `org_founded_year`, `org_mission`, `org_website`, `org_languages`, `org_therapeutic_areas`, `org_research_focus`, `org_operational_coverage` |
| **Legacy flat keys** | ❌ NEVER reads `LEGACY_FLAT_PROJECTION_KEYS` (28 keys) |
| **Enrichment** | `knowledge?: KnowledgeContext` → `enrichment?: ReadModelEnrichment` |
| **Delegates to** | `deriveCapabilityReadModel`, `deriveReadinessReadModel` |

### 2. deriveCapabilityReadModel

| Attribute | Value |
|-----------|-------|
| **File** | `capability-read-model.ts` (355 lines) |
| **Purpose** | Derives institutional capabilities from canonical infrastructure and research data. |
| **Input** | `CapabilityReadModelInput`: researchFocus, organizationType, infrastructure, labCertifications, shippingCapability, knowledge? |
| **Output** | `PassportCapability[]` with supportingEvidence, supportingClaimIds?, supportingEvidenceIds? |
| **Pure** | ✅ |
| **Deterministic** | ✅ |
| **Stateless** | ✅ |
| **Idempotent** | ✅ |
| **Canonical sources** | `LocationInfrastructure[]` (laboratoryPresent, biospecimenOperations, storageEquipment, backupPower, temperatureMonitoring, shippingCapability) |
| **Enrichment** | `knowledge?: KnowledgeContext` → `supportingClaimIds`, `supportingEvidenceIds` on each capability |

### 3. deriveReadinessReadModel

| Attribute | Value |
|-----------|-------|
| **File** | `readiness-read-model.ts` (459 lines) |
| **Purpose** | Derives institutional readiness profile from canonical object completeness + evidence coverage. |
| **Input** | `ReadinessReadModelInput`: capabilities, evidence, locations, teamMembers, infrastructure, hasBackupPower, hasTemperatureMonitoring, hasDigitalCustody, hasPriorStudies, knowledge? |
| **Output** | `PassportReadiness`: overallScore, dimensions (6), eligiblePrograms, partialPrograms, claimContributions? |
| **Pure** | ✅ |
| **Deterministic** | ✅ |
| **Stateless** | ✅ |
| **Idempotent** | ✅ |
| **Canonical sources** | Location count, team member count, infrastructure count, document coverage, capability strength |
| **Enrichment** | `knowledge?: KnowledgeContext` → `claimContributions` (contribution items from claim references) |

### 4. deriveRoadmapReadModel

| Attribute | Value |
|-----------|-------|
| **File** | `roadmap-read-model.ts` (579 lines) |
| **Purpose** | Derives institutional roadmap actions from passport + canonical gaps. |
| **Input** | `RoadmapReadModelInput`: passport, locations, teamMembers, infrastructure, strategicGoals, knowledge? |
| **Output** | `InstitutionRoadmap`: currentReadinessLevel, targetReadinessLevel, actions[], claimGaps?, evidenceGaps? |
| **Pure** | ✅ |
| **Deterministic** | ✅ |
| **Stateless** | ✅ |
| **Idempotent** | ✅ |
| **Canonical sources** | `InstitutionalLocation[]`, `ResearchTeamMember[]`, `LocationInfrastructure[]`, `PassportData` (itself a read model) |
| **Enrichment** | `knowledge?: KnowledgeContext` → `claimGaps`, `evidenceGaps` (gaps detected from low-confidence claims and expired evidence) |

---

## Enrichment Contract (KnowledgeContext)

```typescript
interface KnowledgeContext {
  claims?: ClaimReference[]        // from Claim Engine (future)
  evidence?: EvidenceReference[]   // from Evidence Engine (future)
  provenance?: ProvenanceReference[] // from Evidence Lineage
  confidence?: ConfidenceContext   // @reserved
  limitations?: LimitationContext[] // @reserved
  quality?: QualityContext         // @reserved
  refreshedAt?: string
}
```

**Reserved slots** (not implemented):
- `confidence`: Confidence engine assessment
- `limitations`: Known knowledge gaps
- `quality`: Quality engine assessment

**Behavior**: When `knowledge` is absent or has no claims/evidence, output is identical to ORP-1.3 baseline.

---

## Type Inventory

| Type | Location | Status |
|------|----------|--------|
| `PassportReadModelInput` | passport-read-model.ts | FROZEN |
| `CapabilityReadModelInput` | capability-read-model.ts | FROZEN |
| `ReadinessReadModelInput` | readiness-read-model.ts | FROZEN |
| `RoadmapReadModelInput` | roadmap-read-model.ts | FROZEN |
| `KnowledgeContext` | types.ts | FROZEN |
| `ClaimReference` | types.ts | FROZEN |
| `EvidenceReference` | types.ts | FROZEN |
| `ProvenanceReference` | types.ts | FROZEN |
| `ConfidenceContext` | types.ts | @reserved |
| `LimitationContext` | types.ts | @reserved |
| `QualityContext` | types.ts | @reserved |
| `ReadModelEnrichment` | types.ts | FROZEN |
| `PassportData` | passport-assembler.ts | STABLE (legacy reference) |

---

## Contract Guarantees

1. **Pure**: Every read model is a pure function. Same input → same output. No side effects.
2. **Deterministic**: No randomness. No `Math.random()`. `Date.now()` used only for metadata timestamps.
3. **Stateless**: Read models do not mutate inputs or write to external state.
4. **Non-persistent**: Read models return data. They never write to storage, onboarding state, or canonical objects.
5. **Idempotent**: Repeated calls with identical input produce identical output.
6. **Extension-safe**: KnowledgeContext is the single enrichment point. New knowledge dimensions are added to KnowledgeContext without changing read model signatures.
7. **Legacy-free**: Read models never read from `LEGACY_FLAT_PROJECTION_KEYS`.
8. **Publication-free**: No publication metadata, package ids, disclosure, or delivery concepts.

---

## Test Coverage

| Contract | Tests |
|----------|-------|
| Purity (same input → same output) | ✅ |
| Determinism (no randomness) | ✅ |
| Legacy-free (no flat key reads) | ✅ |
| Non-persistence (no write-back) | ✅ |
| Output shape stability (matches PassportData) | ✅ |
| Empty input → sensible defaults | ✅ |
| KnowledgeContext absent → identical output | ✅ |
| KnowledgeContext present → enrichment appears | ✅ |
| No publication metadata leakage | ✅ |
| buildEnrichment null safety | ✅ |
| **Total** | **31 tests** |

---

## Future Consumers

Read Models are now ready to be consumed by:

- **A10 Publication & Delivery Domain** — Package Definitions, Publication API, Delivery API
- **Sponsor Portal** — Sponsor-facing passport, capabilities, readiness views
- **Marketplace** — Institution discovery and matching
- **Analytics** — Aggregate readiness and capability intelligence
- **ORP-1.x** — Claim Engine, Evidence Engine, Confidence Engine (will populate KnowledgeContext)

**Dependency direction**: A10 depends on Read Models. Read Models do NOT depend on A10.
