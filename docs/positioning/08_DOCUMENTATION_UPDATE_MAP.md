# Documentation Update Map — Product Positioning v2.0

**Goal:** Identify all documentation pages that reference Kadarn in the old evidence-repository narrative and should be updated to reflect the Institutional Trust Infrastructure positioning.

---

## Priority 1: Core Identity Documents

These documents define Kadarn's identity and must be updated first.

| Document | Current Narrative | Target Narrative | Effort |
|----------|-------------------|------------------|--------|
| `docs/kems/KEMS-003_Kadarn_Product_Constitution_v1.0.md` | "Institutional Evidence Intelligence Platform" | Add "Institutional Trust Infrastructure" as primary identity; keep Evidence Intelligence as secondary | 2h |
| `docs/foundation/KADARN-DOCTRINE.md` | "The Institutional Continuity Infrastructure for Life Sciences" | Update to "The Institutional Trust Infrastructure for Clinical Research" | 2h |
| `docs/foundation/KADARN-CATEGORY-MANIFESTO.md` | Evidence repository positioning | Trust infrastructure positioning | 1h |
| `docs/architecture/kadarn-manifesto.md` | Platform infrastructure framing | Trust infrastructure framing | 1h |
| `docs/architecture/kadarn-platform-blueprint.md` | Technical architecture | Add narrative layer describing Institution Profile as canonical output | 3h |

## Priority 2: Product Description Pages

These documents describe the product and are frequently seen by new stakeholders.

| Document | Update Needed | Effort |
|----------|---------------|--------|
| `README.md` (repo root) | Update tagline and description | 30m |
| `apps/web/src/app/page.tsx` | Landing page copy — emphasize trust, not evidence repository | 1h |
| `apps/web/src/app/(workspace)/workspace/page.tsx` | Workspace dashboard — reframe around Institution Profile | 2h |
| `docs/README.md` | Update product description | 30m |

## Priority 3: Architecture Documentation

These documents explain the architecture and should include the narrative layer.

| Document | Update Needed | Effort |
|----------|---------------|--------|
| `docs/architecture/krm-rao.md` | Add Institution Profile as Layer 3 output | 2h |
| `docs/architecture/ecosystem-reference-architecture.md` | Reframe engines as profile generators | 2h |
| `docs/architecture/ux-architecture.md` | Update to Institution Profile-first navigation | 2h |
| `docs/architecture/current-state-vs-reference-model.md` | Add new product concepts to gap analysis | 1h |
| `docs/architecture/traceability-matrix.md` | Add Institution Profile, Discovery Readiness, Credential Registry, Operational Metrics | 1h |

## Priority 4: Domain and KEMS Documents

These documents define the domain model and should include new concepts.

| Document | Update Needed | Effort |
|----------|---------------|--------|
| `docs/domain/claim-taxonomy-v1.1-hybrid-trial.md` | Add note that claims feed Institution Profile | 30m |
| `docs/kems/KEMS-001_Confidence_Graph_Model_v1.0.md` | Add Discovery Readiness as consumer of confidence scores | 1h |
| `docs/kems/KEMS-002_Trustworthy_Evidence_Architecture_v1.1.md` | Reframe trust as earned through evidence | 1h |
| `docs/kems/KEMS-004_Claim_Provenance_Architecture_v1.0.md` | Add Institution Profile as provenance consumer | 30m |

## Priority 5: UX Documentation

These documents guide the user experience and should reflect the new positioning.

| Document | Update Needed | Effort |
|----------|---------------|--------|
| `docs/kux/principles/kux-001-product-experience-principles.md` | Add trust-first principle | 1h |
| `docs/kux/architecture/kux-004-workspace-shell.md` | Update navigation IA | 2h |
| `docs/kux/architecture/kux-005-navigation-framework.md` | Reframe navigation around Institution Profile | 2h |

## Priority 6: Pilot and Validation Documents

These documents describe real-world usage and should use updated language.

| Document | Update Needed | Effort |
|----------|---------------|--------|
| `docs/pilots/ALPHA-PILOT-FIX-VALIDATION.md` | Use new product language in context | 30m |
| `docs/pilots/FIRST-PILOT-REPORT.md` | Reframe findings in trust/readiness terms | 1h |
| `docs/architecture/KPR-05-PILOT-REPORT.md` | Update narrative | 1h |

## Priority 7: New Positioning Documents (Created)

These documents are new and contain the updated positioning.

| Document | Status |
|----------|--------|
| `docs/positioning/01_PRODUCT_POSITIONING.md` | ✅ Created |
| `docs/positioning/02_ARCHITECTURE_OVERVIEW_NARRATIVE.md` | ✅ Created |
| `docs/positioning/03_DASHBOARD_INFORMATION_ARCHITECTURE.md` | ✅ Created |
| `docs/positioning/04_INSTITUTION_PROFILE_CONCEPTUAL_MODEL.md` | ✅ Created |
| `docs/positioning/05_DISCOVERY_READINESS_SPECIFICATION.md` | ✅ Created |
| `docs/positioning/06_CREDENTIAL_REGISTRY_SPECIFICATION.md` | ✅ Created |
| `docs/positioning/07_OPERATIONAL_METRICS_SPECIFICATION.md` | ✅ Created |
| `docs/positioning/08_DOCUMENTATION_UPDATE_MAP.md` | ✅ Created (this file) |

## Summary

| Priority | Files to Update | Estimated Effort |
|----------|----------------|------------------|
| P1 — Core Identity | 5 files | 9h |
| P2 — Product Description | 4 files | 4h |
| P3 — Architecture | 5 files | 8h |
| P4 — Domain / KEMS | 4 files | 3h |
| P5 — UX | 3 files | 5h |
| P6 — Pilot / Validation | 3 files | 2.5h |
| **Total** | **24 files** | **~31.5h** |

## Automation Strategy

For files that are purely narrative (docs/positioning, README, landing page), updates can be applied directly. For architectural documents (KEMS, ADRs, architecture specs), updates should be reviewed by the architect to ensure technical accuracy is preserved.
