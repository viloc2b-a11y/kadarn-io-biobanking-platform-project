# AF-2.1 — Canonical Documents Registry

**Version:** 1.0
**Status:** Frozen
**Date:** 2026-07-02
**Supersedes:** AF-2.0

---

## Purpose

This document registers all canonical Kadarn artifacts that are permanently frozen.

No document listed here may be modified without: Architecture Review, a formal ADR, and Major Version Approval.

---

## Canonical Product Documents

| ID | Document | Version | Status |
|---|---|---|---|
| KEMS-001 | Confidence Graph Model | v1.0 | Frozen |
| KEMS-002 | Trustworthy Evidence Architecture | v1.0 | Frozen |
| KEMS-003 | Kadarn Product Constitution | v1.0 | Frozen |

**RC-0.2 Reconstruction Note (2026-07-03):** KEMS-001 was found absent from its registered location (`vendor/kems/KEMS-001_Confidence_Graph_Model_v1.0.md`, per `openspec/ratificacion-kems-001.md`). File reconstructed 2026-07-03 as Canonical Draft pending ratification (original absent from repository), sourced from citing artifacts (`docs/domain/claim-taxonomy-v1.0.md`, `database/migrations/045_evidence_core.sql`, `packages/evidence-core/src/confidence-state.ts`, `docs/adr/adr-010-trust-engine-retirement.md`).

A separate, earlier reconstruction of KEMS-001 and KEMS-002 already exists at `docs/kems/` (added in commit `f32fdbd4`, "chore(rc-0.2): Architecture Recovery"). That reconstruction predates this note, lives outside the registered `vendor/kems/` path, and its Evidence Class weights do not match `database/migrations/045_evidence_core.sql`. It has not been modified or deleted as part of this note — reconciling `docs/kems/` with `vendor/kems/` is flagged here as unresolved and requires Architecture Review before either copy is treated as sole canonical source. KEMS-002 was NOT reconstructed at `vendor/kems/` in this pass to avoid creating a second, conflicting "canonical" version alongside the existing `docs/kems/KEMS-002_Trustworthy_Evidence_Architecture_v1.1.md` (a substantially different Risk Model & Mitigation Framework, "Draft for Ratification").

**RC-0.3 Consolidation Note (2026-07-03):** KEMS-003 and KEMS-007 moved from `vendor/kems/` to `docs/kems/` (byte-identical move, no content change) so canonical docs live tracked and `vendor/` holds only third-party content. KEMS-001 reconciliation between `docs/kems/` and `vendor/kems/` was attempted in this pass but STOPPED: the `docs/kems/` version contains substantive sections ("Architectural Boundaries", "Relationship to KEMS-003") entirely absent from the `vendor/kems/` version, so the divergence is more than the weights table + reconstruction header. Both KEMS-001 copies remain in place (`docs/kems/` and `vendor/kems/`) pending Architecture Review — this reaffirms and does not resolve the unresolved-reconciliation flag above.

**PENDING ARCHITECTURE REVIEW:** two divergent files exist at `docs/kems/` for KEMS-002 (v1.0 Trustworthy Evidence Architecture; v1.1 Risk Model & Mitigation Framework). Canonical status unresolved; do not treat either as ratified until reviewed.

### Locations

| ID | Location |
|---|---|
| KEMS-001 | `docs/kems/` (also unreconciled duplicate at `vendor/kems/` — see RC-0.3 note above; pending Architecture Review) |
| KEMS-002 | `docs/kems/` (v1.0 and v1.1 both present — pending Architecture Review, see note above) |
| KEMS-003 | `docs/kems/` |
| KEMS-004 | `docs/kems/` |
| KEMS-005 | `docs/kems/` |
| KEMS-006 | `docs/kems/` |
| KEMS-007 — Evidence Delivery Architecture — v0.1 — Draft pending ratification — `docs/kems/` |

---

## Canonical Architecture Documents

| ID | Document | Version | Status |
|---|---|---|---|
| AF-1.0 | Architecture Freeze Baseline | 1.0 | Frozen |
| AF-2.0 | Architecture Freeze (Phases 1-5) | 2.0 | Frozen |
| ADR-010 | Trust Engine Retirement → Confidence Engine | 1.0 | Frozen |
| ADR-011 | Evidence Core Boundary Rule | 1.0 | Frozen |
| ADR-012 | Engine Governance (Core/Certified/Private) | 1.0 | Frozen |

---

## Frozen Contracts

| Contract | Status |
|---|---|
| DiscoveryResult | Frozen |
| CapabilityIntelligence | Frozen |
| EvidenceGapIntelligence | Frozen |
| InstitutionCapabilityAssessment | Frozen |
| SponsorReadiness | Frozen |
| RecommendationEngineOutput | Frozen |
| InstitutionRecognitionReport | Frozen |
| ConnectorResponse | Frozen |
| CanonicalIdentity | Frozen |
| FirewallDecisionOutput | Frozen |
| VisibilityPolicy | Frozen |
| InstitutionalConsent | Frozen |
| FeasibilityPassport | Frozen |

---

## Change Process

Any modification to a frozen document requires:

1. Architecture Review — full assessment of impact
2. ADR — Architecture Decision Record explaining the change
3. Major Version Approval — new version number assigned

No document may be modified informally or without traceability.

---

## Phase 8 / Phase 9 Planning Documents (not frozen)

These documents guide implementation toward AF-3.0 and Phase 9. They are **not** frozen artifacts.

| Document | Path |
|---|---|
| Phase 8 — Evidence Evolution (reorganized) | `openspec/phase-8-evidence-evolution-architecture.md` |
| Phase 8 Gap Analysis | `openspec/phase-8-gap-analysis.md` |
| Phase 8 → 9 Gap Analysis | `openspec/phase-8-to-phase-9-gap-analysis.md` |
| Phase 8 Legacy Equivalence Gate | `openspec/phase-8-legacy-equivalence-gate.md` |
| Phase 9 — Evidence Delivery | `openspec/phase-9-evidence-delivery-architecture.md` |
| Phase 8 ADR drafts | `openspec/drafts/adrs/adr-027` … `adr-033` |

**Phase 8 implementation order:** Domain Freeze → Contracts → Tests → Migration. Compatibility Layer (Read Adapter Only) at Sprint 28D; cutover at 28K after Legacy Equivalence Gate.

---

## Registry Maintenance

This registry itself is frozen. Adding new frozen documents requires the same change process.

---

*This registry is the authoritative index of Kadarn's frozen architectural and product artifacts.*
