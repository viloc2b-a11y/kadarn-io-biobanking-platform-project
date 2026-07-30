# CANONICAL MVP SCOPE — KADARN Institution-First MVP

**Document ID:** KADARN-MVP-SCOPE-001  
**Version:** 1.0  
**Date:** 2026-07-30  
**Status:** Canonical — Active  
**Authority:** KPO (KADARN Program Office)  
**Supersedes:** KADARN-PLAN-MVP-002 (absorbed), CEP Phase 0 roadmaps (consolidated), KIMP Program scope (MVP-filtered)  
**Human Gate:** Pending Vilo approval  

---

## 1. PURPOSE

This document is the **single source of truth** for what constitutes the KADARN Institution-First MVP. It replaces the ambiguity created by five parallel roadmaps (CEP, KIMP, Master Roadmap v2, RC-13, PCP-1/2) with one binding scope.

**Principle:** If it's not in this document, it's not in the MVP.

---

## 2. CANONICAL DOCUMENTS — BINDING FOR MVP

The following documents govern the MVP. Any conflict between them is resolved by the precedence order listed.

### TIER 1 — CONSTITUTIONAL (supersedes all others)

| Document | ID | Version | Status | Role in MVP |
|---|---|---|---|---|
| KADARN Product Constitution | KEMS-003 | v1.0 | Canonical | Defines what KADARN IS and IS NOT |
| Confidence Graph Model | KEMS-001 | v1.0 | Canonical | Evidence → Confidence semantics |
| Trustworthy Evidence Architecture | KEMS-002 | v1.1 | **Canonical** (v1.0 superseded) | Evidence architecture |
| Claim Provenance Architecture | KEMS-004 | v1.0 | Canonical | Provenance model |
| Evidence Delivery Architecture | KEMS-007 | v1.0 | Frozen | Passport delivery contracts |

### TIER 2 — ARCHITECTURAL

| Document | ID | Version | Status | Role in MVP |
|---|---|---|---|---|
| KOSRA — Open Source Reference Architecture | — | v0.2 | Canonical | 6 layers, 3 domains, OSS matrix, 10 Hermes prohibitions |
| Architecture Alignment Audit v2 | AAM-001 | v2.0 | Canonical | Bridge: governance → code. Per-domain gap analysis |
| KOSRA Implementation Mapping | — | v0.2 | Canonical | Layer → package mapping |

### TIER 3 — STRATEGIC (MVP-filtered)

| Document | ID | Version | Status | MVP scope |
|---|---|---|---|---|
| Canonical Execution Plan | KADARN-CEP-001 | v1.0 | Phase 0-3 only | Phases 4-6 deferred |
| Implementation Master Plan | KADARN-KIMP-001 | v1.0 | Programs 1-4 only | Programs 5-6 deferred |

### TIER 4 — CONTROL

| Document | ID | Version | Status | Role in MVP |
|---|---|---|---|---|
| ICO Charter | KADARN-ICO-001 | v1.0 | Canonical | Gate model, evidence requirements |
| KPO Practical Execution Policy | — | v1.0 | Canonical | 7 always-on blocks, 6 warnings |
| KPO Governance Profile | — | v1.0 | Canonical | 3 modes: advisory/required/protected |

### TIER 5 — IMPLEMENTATION (active for MVP)

| Document | ID | Version | Status | Role in MVP |
|---|---|---|---|---|
| 057_IMPLEMENTATION_BASELINE | — | v1.0 | Frozen | Accepted architecture baseline |
| Architecture Freeze AF-2.0 | — | v2.0 | Ratified | 24 sprints frozen, 971 tests |
| KADARN-PLAN-MVP-003 | HERMES-PLAN-001 | v1.0 | Active | THIS unified execution plan |

---

## 3. DOCUMENTS MARKED HISTORICAL (NOT BINDING FOR MVP)

These documents exist in the repository but do NOT govern MVP execution. They are preserved for institutional memory only.

| Document | Reason |
|---|---|
| kadarn-platform-blueprint.md (2026-06-26) | Pre-governance. Superseded by KOSRA v0.2 + Architecture Alignment Audit v2 |
| ASSESSMENT-OSS-INTEGRATION.md | Technical audit. Subordinated to KOSRA for governance decisions |
| Master Roadmap v2 (Phases F-I) | Protocol, Assessment, Sharing, Hardening — deferred post-MVP |
| RC-13 (full 13 sprints) | Only RC-13.0-13.3 relevant to MVP. Rest deferred |
| PCP-1.2 (Membership Management) | Deferred. PCP-1.1 (Identity Provisioning) partially active |
| CEP Phases 4-6 | Decision Analytics, OSS Evolution, Enterprise Scale — ALL deferred |
| KIMP Programs 5-6 | OSS Evolution, Production & Scale — ALL deferred |
| LOOP 2-4 charters | Completed their cycle. Evidence preserved. No new work |
| Phase 8 Production Cutover | Staging PASS. Production NOT authorized for MVP scope |
| Phase 9 Evidence Delivery | Blocked until Phase 8 production |
| PDF-1.0 (all 8 sprints) | Product Definition Freeze deferred until post-MVP validation |
| AF-3.0 ratification | 3 KEMS pending + 6 ADRs unsigned. Not blocking MVP |
| KTP-2.0 (all missions) | Transformation complete. Reference only |
| ADR-001 (missing file) | Referenced but absent. Not binding |
| ADR 018-025 (Phase 8 stubs) | Marked "Accepted" but content is "[To be completed...]". Superseded by this scope |

---

## 4. ADR COLLISIONS — RESOLVED

The following ADR ID collisions are resolved for MVP purposes:

| ADR ID | Files in conflict | MVP Resolution |
|---|---|---|
| **ADR-010** | `adr-010-policy-engine.md` vs `adr-010-trust-engine-retirement.md` | **BOTH ACTIVE.** policy-engine governs Policy Engine. trust-engine-retirement documents the paradigm shift Trust→Confidence |
| **ADR-011** | `adr-011-evidence-core-boundary.md` vs `adr-011-trust-engine.md` | **evidence-core-boundary ACTIVE.** trust-engine is HISTORICAL (Trust paradigm retired per ADR-010-trust-engine-retirement) |
| **ADR-012** | `adr-012-engine-governance.md` vs `adr-012-operational-twins.md` | **BOTH ACTIVE.** Different domains |
| **ADR-018** | `adr-018-matching-engine.md` vs `adr-018-phase-8.md` | **matching-engine ACTIVE.** phase-8 is stub — SUPERSEDED |
| **ADR-019** | `adr-019-fulfillment-engine.md` vs `adr-019-phase-8.md` | **fulfillment-engine HISTORICAL** (out of MVP). phase-8 SUPERSEDED |
| **ADR-020** | `adr-020-financial-engine.md` vs `adr-020-phase-8.md` | **financial-engine HISTORICAL** (out of MVP). phase-8 SUPERSEDED |
| **ADR-021** | `adr-021-intelligence-engine.md` vs `adr-021-phase-8.md` | **intelligence-engine HISTORICAL** (out of MVP). phase-8 SUPERSEDED |

---

## 5. DUPLICATE FILES — CONSOLIDATION

| SHA-256 | Files | Action |
|---|---|---|
| `076935...` | 4 agreement templates (BAA, DPA, DUA, MTA) | Consolidate into single template with variants. Delete 3 duplicates |
| `50d4913...` | 8 ADR phase-8 stubs | All 8 marked SUPERSEDED by this scope. Delete duplicates |
| `72645d0b...` | `release-readiness-framework.md` + `Kadarn_Readiness_and_Governance_Pack_v1.0_English.md` | Preserve `release-readiness-framework.md` in `docs/lexicon/`. Delete duplicate in `governance/lexicon/` |

---

## 6. KEMS VERSION CLARIFICATION

| KEMS | Versions | MVP Resolution |
|---|---|---|
| **KEMS-001** | v1.0 only | **Active.** Confidence Graph Model |
| **KEMS-002** | v1.0 + v1.1 | **v1.1 is canonical.** v1.0 is superseded. Update GOVERNANCE_INDEX.md |
| **KEMS-003** | v1.0 | **Active.** Product Constitution |
| **KEMS-004** | v1.0 | **Active.** Claim Provenance |
| **KEMS-005** | v1.0 | **Active.** Evidence Core |
| **KEMS-006** | v1.0 | **Active.** Capability Model |
| **KEMS-007** | v1.0 | **Frozen.** Delivery Architecture — binding for Passport contracts |

---

## 7. GOVERNANCE AUTHORITY — KPO

The KPO (KADARN Program Office) is the governing authority for MVP execution. Until the KPO Charter is materialized (WO-KPO-001 Stage B), the following artifacts serve as executable governance:

- **KPO Practical Execution Policy** — 7 always-on blocks, 6 warnings, Human Gate requirements
- **KPO Governance Profile** — 3 modes: advisory/required/protected
- **ICO Charter** — Gate model: Intake → Baseline → Authorization → Execution → Verification → Human acceptance → Closure

### Human Gate Requirements (from KPO Policy)

**ALWAYS REQUIRED:** push, PR, merge, release, deploy, security changes, migrations, destructive operations, evidence acceptance, content publication.

**NOT REQUIRED:** read/discovery, local drafts, tests, Work Order proposals, non-authoritative reports.

---

## 8. MVP EXECUTION AUTHORITY

| Role | Authority | Tool Mapping |
|---|---|---|
| **Vilo** | Strategic decisions, editorial gates, Human Gate approval | Direct |
| **Hermes** | Plan, inspect, assign, govern, verify, document | Hermes Agent |
| **Gentle AI** | Bounded technical execution, test evidence, implementation | delegate_task (leaf role) |
| **GPT Work** | Planning, drafting Work Orders, reviewing reports (advisory) | Available if needed |

---

## 9. VALIDITY

This document is valid from the date of Vilo's approval. Any change requires a documented decision in `09_DECISION_LOG.md` (KMI) or equivalent KPO decision register.

The next document to produce is the IN-SCOPE / OUT-OF-SCOPE / FROZEN specification (Block 00C).

---

*Canonicalized by Hermes under KPO governance. All 129 foundation documents reviewed. 5 roadmaps consolidated. 7 ADR collisions resolved. 14 duplicates identified. KEMS version ambiguity clarified.*

---

# APPENDIX A: IN-SCOPE / OUT-OF-SCOPE / FROZEN (Block 00C)

> **Status:** Active — approved by Vilo as part of Block 00C  
> **Date:** 2026-07-30

## A.1 IN-SCOPE — What the MVP DELIVERS

### Products (what the institution receives)

| # | Product | Definition | Source of Truth |
|---|---|---|---|
| 1 | **Capability Portfolio** | Structured representation of what an institution can do: services, infrastructure, personnel, therapeutic areas, operations, biospecimen capabilities. Each capability linked to claims and evidence | KOSRA §2 — Capability Explorer |
| 2 | **Readiness Assessment** | Multi-dimensional evaluation: evidence freshness, provenance coverage, capability maturity, confidence drift, gaps, recommendations. Distinguishes 6 states: no informado / no disponible / no aplicable / declarado / documentado / verificado | KOSRA §2 — Readiness Workspace |
| 3 | **Institution Passport** | Governed projection of capabilities, claims, evidence, confidence, and readiness. Not a free-form profile. Shareable via ShareGrants with scope control | KOSRA §2 — Institution Passport |

### Capabilities (what the system DOES)

| # | Capability | Description |
|---|---|---|
| C1 | **Institution Registration** | Organization profile, locations, people, roles with temporal tracking (valid_from/until) |
| C2 | **Source Intelligence** | Register evidence sources, ingest source records, track acquisition and extraction |
| C3 | **Evidence Ingestion** | Document upload → MarkItDown extraction → evidence nodes with epistemic type (direct/derived/inferred) |
| C4 | **Provenance Tracking** | Full chain: source → record → extraction → evidence → claim. W3C PROV-aligned |
| C5 | **Claim Management** | Versioned claims, evidence links (supports/contradicts/qualifies), conflict detection |
| C6 | **Capability Modeling** | Capabilities with temporal states, linked to claims, with conditions/quantity/value |
| C7 | **Assessment Engine** | Structured assessments against institution capabilities, gap detection, mitigation suggestions |
| C8 | **Passport Generation** | Projection from claims + evidence + confidence. Snapshot-based for reproducibility |
| C9 | **Guided Onboarding** | ~10 screen wizard: identity → type → research focus → therapeutic areas → locations → people → infrastructure → capabilities → documents → results |
| C10 | **ShareGrant Control** | Institution controls who sees what in their Passport. Scoped by program/purpose |

### Packages ACTIVE for MVP

| Package | Action | Purpose |
|---|---|---|
| `evidence-core` | EXTEND | Add source_id, epistemic_type. Foundation of all claims |
| `evidence-discovery` | PRESERVE + EXTEND | Most mature. Base for Capability Intelligence |
| `readiness-engine` | REFACTOR → Assessment Engine | From scoring pipeline to structured assessment |
| `institutional-knowledge` | REFACTOR | 12 knowledge domains → capability model aligned |
| `platform-services` | EXTEND | SourceRegistryService, event bus |
| `document-intake` | EXTEND | Connect to Source Intelligence + MarkItDown |
| `delivery-domain` | PRESERVE | DDD for sharing policies |
| `published-view` | EXTEND | Institution Passport + knowledge_snapshots |
| `policy-engine` | PRESERVE | OPA Shadow Mode sufficient |
| `provenance` | REFACTOR | Align to v2 schema. Consolidate with evidence-core |
| `domain-events` | EXTEND | New event types for v2 domains |
| `types` | EXTEND | v2 types: EvidenceSource, CapabilityState, Assessment, etc. |
| `auth` | PRESERVE | Sufficient as-is |

### Migrations ACTIVE for MVP

Preserve 001-072. New migrations 073-090 as defined in Architecture Alignment Audit §5.3:

| Block | Migration Range | Tables |
|---|---|---|
| Sources | 073-075 | evidence_sources, evidence_producers, source_records, acquisition_runs, extraction_runs |
| Provenance | 076-078 | provenance_records (v2), observations, evidence_links |
| Claims v2 | 079-081 | claim_versions, claim_evidence_links, claim_conflicts |
| Capability | 082-083 | capability_states, capability_claim_links |
| Assessment | 086-087 | assessments, assessment_results, gaps, mitigations |
| Publication | 088-089 | knowledge_snapshots, package_snapshot_links |
| Governance | 090 | audit_events (formal) |

**Protocol (084-085) DEFERRED to post-MVP.**

### Endpoints PRESERVED

~30 endpoints from the 179 existing, covering: people, locations, institutions/*, capabilities/*, evidence-core/*, claims/*, passport-entries/*, readiness/*.

### Endpoints NEW

12 new endpoints as defined in Architecture Alignment Audit §4.3: sources, source-records, extraction-runs, evidence review, claims v2, assessments, packages, share-grants.

---

## A.2 OUT-OF-SCOPE — Explicitly EXCLUDED

| # | Item | Reason | When |
|---|---|---|---|
| 1 | **Marketplace** | Post-MVP. Requires network of verified institutions first | Post-MVP |
| 2 | **Sponsor Portal (full)** | RC-12 Sponsor Passport sufficient for MVP | Post-MVP |
| 3 | **Protocol Intelligence** | Entirely new domain (0% alignment). Not needed for Institution→Passport | Post-MVP |
| 4 | **Matching Engine** | Requires dataset + protocol requirements. Deferred per KOSRA §13.5 | Post-MVP |
| 5 | **Recommendation Engine** | Requires historical readiness data. No data yet | Post-MVP |
| 6 | **Financial Engine** | Marketplace dependency. KIMP Program 6 | Post-MVP |
| 7 | **Fulfillment Engine** | Marketplace dependency. KIMP Program 6 | Post-MVP |
| 8 | **Integration Engine** | Stub. No MVP use case | Post-MVP |
| 9 | **Intelligence Engine** | Stub. Absorbed into Assessment + Decision | Post-MVP |
| 10 | **AI Layer (beyond extraction)** | No concrete MVP use case. KOSRA §14: Hermes cannot allow AI to write to Evidence Core | Post-MVP |
| 11 | **Operational Observability** | Grafana/Prometheus/Loki. Does not block functionality. RC-13 covers later | Post-MVP |
| 12 | **Phase 8 Production Cutover** | Staging PASS. Production requires 2-week monitoring window | Week 16+ |
| 13 | **Phase 9 Evidence Delivery** | Blocked until Phase 8 production | Post-MVP |
| 14 | **RC-13 sprints 4-9** | Observability, Alerting, Security hardening. Not blocking | Post-MVP |
| 15 | **PDF-1.0 (Product Definition Freeze)** | Freeze product AFTER MVP validation, not before | Post-MVP |
| 16 | **KPE Generator** | Stub. No MVP use case | Post-MVP |
| 17 | **Sponsor Intelligence** | Post-MVP. Requires multiple institutions with readiness data | Post-MVP |
| 18 | **Operational Twins** | Not needed for single-institution MVP | Post-MVP |
| 19 | **Trust Engine (legacy)** | Retired per ADR-010-trust-engine-retirement | Never |
| 20 | **Continuity Engine (legacy)** | Deprecated per Architecture Alignment Audit §3.3 | Never |

---

## A.3 FROZEN — Do NOT Modify

These packages, endpoints, and migrations MUST NOT be modified during MVP execution.

### Packages FROZEN

| Package | Reason |
|---|---|
| `financial-engine` | Out of scope |
| `fulfillment-engine` | Out of scope |
| `integration-engine` | Out of scope |
| `intelligence-engine` | Out of scope |
| `matching-engine` | Out of scope |
| `ai-layer` | Only extraction (already in document-intake) |
| `sponsor-intelligence` | Post-MVP |
| `kpe-generator` | Out of scope |
| `cli` | Stub — not needed |
| `sdk` | Stub — not needed |
| `ui` | Rebuilt in PCP-2 when applicable |
| `trust-engine` | Retired |
| `operational-twins` | Not needed |
| `telemetry` | Not needed for MVP |
| `graph-query` | Not needed for MVP |
| `knowledge-engine` | Consolidated into institutional-knowledge |
| `workflow-engine` | Only if review queues need it — evaluate during 02-E |

### Endpoints FROZEN (DO NOT MODIFY)

All `/api/v1/continuity/*` (10+ routes) — Legacy. Deprecated.  
All `/api/v1/discovery/*` — Deferred to post-MVP.  
All `/api/v1/matching/*` — Deferred to post-MVP.  

### Migrations FROZEN

001-061: Platform foundation. No changes.  
062-072: KAD-001→012 implementation. PRESERVE with extensions only (no destructive changes).  

### Database Tables FROZEN

All existing tables in 001-072. New tables ONLY via new migrations 073-090.  
**No ALTER TABLE on existing tables except:** `evidence_nodes` (add source_id, source_record_id, epistemic_type as NULLABLE), `claims` (add valid_from/until), `organizations` (no changes — use views for rename), **`locations`, `organization_memberships`, `membership_roles`, `people`** (add temporal columns valid_from/valid_until and alias_resolution_attributes as NULLABLE — approved by Vilo 2026-07-30).

---

## A.4 THE END-TO-END PATH (Golden Case)

```
1. INSTITUTION enters → Onboarding wizard (10 screens)
2. Registers: identity, locations, people, roles
3. Declares capabilities: "We do IHC staining", "We collect FFPE blocks", "We run NGS sequencing"
4. Uploads evidence: 3-5 documents (certifications, SOPs, outcome reports)
5. SYSTEM processes:
   a. MarkItDown extracts text from documents
   b. Source records created (tracing origin)
   c. Evidence nodes created with epistemic_type
   d. Claims versioned and linked to evidence
   e. Capabilities linked to claims
   f. Assessment executed: gaps detected, readiness computed
   g. 6-state distinction applied (declarado ≠ verificado)
6. INSTITUTION receives:
   a. CAPABILITY PORTFOLIO — what we can do, with evidence status
   b. READINESS ASSESSMENT — how ready we are, with gaps and recommendations
   c. INSTITUTION PASSPORT — governed projection, shareable
7. VERIFICATION:
   a. Full traceability: source → record → evidence → claim → capability → readiness → passport
   b. No inflation: capability without evidence = "declarado", not "verificado"
   c. Time to first Passport: < 60 minutes
```

---

*Block 00C complete. The frozen scope is now binding. Any work outside this scope requires a documented exception approved by Vilo.*
