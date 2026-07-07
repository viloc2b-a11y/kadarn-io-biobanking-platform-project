# OCP-3 — Readiness Wiring & Evidence-Aware Completion

**Sprint:** OCP-3
**Date:** 2026-07-07
**Status:** Complete

---

## Objective

Wire existing readiness/completion infrastructure into the onboarding journey so Kadarn can distinguish between evidence-backed and self-declared states, and prevent misleading readiness outputs.

---

## Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `derived-read-models/types.ts` | +140 lines | EvidenceSupport type, conditional requirements, getActiveConditionalRequirements() |
| `derived-read-models/index.ts` | +5 lines | Export new types and functions |
| `derived-read-models/capability-read-model.ts` | +25 lines | evidenceSupport on each capability; uploadedDocLabels input |
| `derived-read-models/passport-read-model.ts` | +1 line | Pass uploadedDocLabels to capability read model |
| `tests/onboarding/ocp-3-evidence-aware.test.ts` | NEW (+280 lines) | 14 tests |
| `docs/onboarding/ocp-3-readiness-wiring-evidence-aware-completion.md` | NEW | This document |

---

## Readiness States Supported

| State | Meaning | Example |
|-------|---------|---------|
| `SUPPORTED_BY_EVIDENCE` | Capability backed by uploaded documents | CLIA cert uploaded + lab declared |
| `DECLARED_ONLY` | Institution declared this but no evidence | Lab declared, no docs uploaded |
| `NEEDS_EVIDENCE` | Critical evidence missing | Lab declared, CLIA not uploaded |
| `PARTIALLY_SUPPORTED` | Some evidence exists but gaps remain | 1 of 2 required docs uploaded |
| `UNKNOWN` | Not yet collected — do not treat as absent | Biospecimen fields empty |
| `NOT_APPLICABLE` | Explicitly marked irrelevant | "We don't handle biospecimens" |
| `NEEDS_REVIEW` | Evidence exists but is aging | Certification expiring soon |
| `EXPIRED_OR_OUTDATED` | Evidence was present but is now expired | Expired license |

## Conditional Rules Added

| Condition | Requirement | Evidence Class |
|-----------|-------------|---------------|
| Lab/testing declared | CLIA Certificate (or CAP, COLA) | A |
| Biospecimen shipping declared | IATA Dangerous Goods Certification | B |
| IP handling declared | Pharmacy license or IP SOP | A |
| Early phase declared | Overnight/stay capacity docs | B |
| Biospecimen ops declared | Chain of custody documentation | B |

**Key rule:** Conditional requirements are only active when the condition is met. CLIA is not required if no lab is declared. IATA is not required if no shipping is declared.

---

## Behavior Before

- Capabilities showed "Strong/Moderate/Available/Not available" based on infrastructure declarations only
- No distinction between "declared" and "evidenced" — a lab declared without documents showed as "Moderate"
- Conditional requirements (CLIA, IATA) treated as universal — shown even when irrelevant
- Readiness score based on flat counts, not evidence quality
- No "unknown vs no" distinction

## Behavior After

- Each capability has an `evidenceSupport` field (SUPPORTED_BY_EVIDENCE, DECLARED_ONLY, etc.)
- Lab declared without CLIA → capability shows as "DECLARED_ONLY"
- Lab declared with CLIA uploaded → capability shows as "SUPPORTED_BY_EVIDENCE"
- Biospecimen fields empty → UNKNOWN (not "No biospecimen capability")
- CLIA only required when lab is declared (conditional)
- IATA only required when shipping is declared (conditional)
- Completion gate distinguishes draft Passport (DECLARED_ONLY) from evidence-backed Passport (SUPPORTED_BY_EVIDENCE)

---

## Tests Run

```
tests/onboarding/ocp-3-evidence-aware.test.ts — 14 tests
tests/onboarding/derived-read-models.test.ts    — 31 tests
tests/onboarding/completion-gate.test.ts         — 20 tests
Total: 65 tests passed
```

### OCP-3 Specific Tests (14)

| Test | Result |
|------|--------|
| Unknown ≠ absent (empty infra → no fake capabilities) | ✅ |
| Declared-only ≠ strong (lab declared, no docs → DECLARED_ONLY) | ✅ |
| SUPPORTED_BY_EVIDENCE when docs present | ✅ |
| Biospecimen DECLARED_ONLY without evidence | ✅ |
| CLIA required only when lab declared | ✅ |
| CLIA NOT required when no lab | ✅ |
| IATA required only when shipping declared | ✅ |
| IATA NOT required when no shipping | ✅ |
| Conditional reqs satisfied when docs uploaded | ✅ |
| Draft Passport available with declared capabilities, no evidence | ✅ |
| Full Passport with sufficient evidence | ✅ |
| Does not overstate readiness with missing evidence | ✅ |
| Vilo Research partial evidence → honest readiness | ✅ |
| Vilo Research full evidence → READY_FOR_PASSPORT | ✅ |

---

## Known Limitations

1. **Document matching is label-based**: Evidence support uses document label matching (e.g., "CLIA" in label). A more robust matching uses document taxonomy in OCP-2's document-taxonomy.ts.
2. **No expiry date checking**: The `NEEDS_REVIEW` and `EXPIRED_OR_OUTDATED` states are defined but not yet wired to actual date comparisons. This requires OCP-7 (Historical Acquisition).
3. **Conditional requirements are declarative**: The `CONDITIONAL_REQUIREMENTS` list is hardcoded. A full implementation would query from program type requirements in the readiness engine.
4. **Readiness read model not yet evidence-aware**: The `deriveReadinessReadModel` still computes readiness from canonical object completeness. Full evidence-awareness in readiness scoring requires the readiness engine integration (OCP-3 backlog).

---

## Post-Pilot Backlog

| Item | Sprint |
|------|--------|
| Readiness engine full wiring | OCP-3 backlog |
| Expiry date checking for evidence | OCP-7 |
| Auto-classification of documents → evidence matching | OCP-2 backlog |
| Program-type-specific conditional requirements | Post-pilot |

---

## Validation Commands

```bash
npx vitest run tests/onboarding/ocp-3-evidence-aware.test.ts
npx vitest run tests/onboarding/
# Result: 65 tests passed
```
