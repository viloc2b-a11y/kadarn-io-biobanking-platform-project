# CANONICAL DOCUMENT INVENTORY

**Document ID:** KADARN-INVENTORY-001  
**Status:** WO-KPO-001 STAGE A — READ-ONLY DISCOVERY  
**Date Generated:** 2026-07-28  
**Scope:** governance/, foundation/, docs/, .hermes/, openspec/  
**Mode:** Read-only inspection, no modifications  
**Total Documents Inventoried:** 446 Markdown files  

---

## EXECUTIVE SUMMARY

This inventory documents the current state of KADARN's canonical, strategic, and supporting documentation. It identifies:

- **334 governance/foundation/docs files** with metadata
- **3 major duplicate sets** (exact hash matches)
- **7 ADR ID collisions** (multiple files with same number)
- **KEMS version ambiguity** (v1.0 and v1.1 of same KEMS-002)
- **Undeclared status** on 200+ documents
- **Broken or ambiguous relationships** between layers

---

## PART 1: CRITICAL FINDINGS

### 1.1 Exact Duplicates (Same SHA-256 Hash)

| Hash | Files | Count | Issue |
|------|-------|-------|-------|
| `076935...` | `governance/compliance/agreement-templates/*` (BAA, DPA, DUA, MTA) | 4 | All 4 agreement templates contain identical content. Likely a generic template that was not differentiated. |
| `50d4913...` | `docs/adr/adr-{018,019,020,021,022,023,024,025}-phase-8.md` | 8 | All 8 "phase-8" ADRs are byte-for-byte identical. Suggests copy-paste error or generated placeholder. |
| `72645d0b...` | `docs/lexicon/release-readiness-framework.md` + `governance/lexicon/Kadarn_Readiness_and_Governance_Pack_v1.0_English.md` | 2 | Identical content in two locations. One should be canonical. |

**Impact:** 14 files are redundant copies. Consolidation required.

---

### 1.2 ADR ID Collisions

These ADR numbers have multiple definitions:

| Number | Files | Status | Action Required |
|--------|-------|--------|-----------------|
| **ADR-010** | `adr-010-policy-engine.md` + `adr-010-trust-engine-retirement.md` | CONFLICT | Two different decisions with same ID. Must renumber one. |
| **ADR-011** | `adr-011-evidence-core-boundary.md` + `adr-011-trust-engine.md` | CONFLICT | Two different decisions with same ID. Must renumber one. |
| **ADR-012** | `adr-012-engine-governance.md` + `adr-012-operational-twins.md` | CONFLICT | Two different decisions with same ID. Must renumber one. |
| **ADR-018** | `adr-018-matching-engine.md` + `adr-018-phase-8.md` | CONFLICT | One appears substantive, one is copy-paste phase-8 placeholder. |
| **ADR-019** | `adr-019-fulfillment-engine.md` + `adr-019-phase-8.md` | CONFLICT | Same issue as ADR-018. |
| **ADR-020** | `adr-020-financial-engine.md` + `adr-020-phase-8.md` | CONFLICT | Same issue. |
| **ADR-021** | `adr-021-intelligence-engine.md` + `adr-021-phase-8.md` | CONFLICT | Same issue. |

**Impact:** 14 ADRs cannot coexist with these collisions. Renumbering or supersession necessary.

---

### 1.3 KEMS Version Ambiguity

| Document | Versions | Status | Clarification Needed |
|----------|----------|--------|----------------------|
| **KEMS-002** | v1.0 + v1.1 | UNCLEAR | Does v1.1 supersede v1.0 completely? Are they compatible? Registry does not specify. |
| **KEMS-001** | v1.0 only | CLEAR | Foundational; relationship to KEMS-002 not formally defined. |

**Files:**
- `docs/kems/KEMS-001_Confidence_Graph_Model_v1.0.md`
- `docs/kems/KEMS-002_Trustworthy_Evidence_Architecture_v1.0.md`
- `docs/kems/KEMS-002_Trustworthy_Evidence_Architecture_v1.1.md`

**Impact:** GOVERNANCE_INDEX.md lists KEMS-002 v1.0/v1.1 as "Pending Review" but does not clarify whether v1.1 is approved, which version is binding, or whether both coexist.

---

## PART 2: DOCUMENT CLASSIFICATION

### 2.1 Governance (Foundation of Authority)

These documents establish the rules of governance itself.

| Document | Location | Version | Status | Authority |
|----------|----------|---------|--------|-----------|
| GOVERNANCE_INDEX.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |
| DOCUMENT_PRECEDENCE.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |
| DOCUMENT_RELATIONSHIP_MAP.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |
| GOVERNANCE_CHANGELOG.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |
| GOVERNANCE_INTEGRATION_REPORT.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |
| GOVERNANCE_VALIDATION_REPORT.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |
| IMPLEMENTATION_PROGRAM_INDEX.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |
| CANONICAL_REPOSITORY.md | `foundation/00_GOVERNANCE/` | — | Active | KAD-LOOP |
| WORK_ORDER_CATALOG.md | `foundation/00_GOVERNANCE/` | — | Canonical | KPO |

**Status:** These 9 documents form the governance framework. All are marked Canonical.

---

### 2.2 Constitutional Level (Level 1)

These define what KADARN IS and what it DOES.

| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md | 1.0 | Canonical | Programs, work streams, delivery waves (KIMP) |
| KADARN_IMPLEMENTATION_CONTROL_OFFICE_CHARTER_v1.0.md | 1.0 | Canonical | Portfolio controls, compliance gates, evidence requirements (ICO) |
| KOSRA.md | v0.2 | Canonical Architectural View | Architecture, OSS governance, intelligence views |
| KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md | 1.0 | Canonical | Phase sequence and gates (CEP) |
| KOSRA_IMPLEMENTATION_MAPPING.md | — | Supporting | Layer-to-engine correspondence |
| KOSRA_DECISION_REGISTER.md | — | Supporting | Decision classification |
| KOSRA_MATERIALIZATION_REPORT.md | — | Supporting | Phase A materialization record |
| KOSRA_V02_VALIDATION_REPORT.md | — | Supporting | v0.2 validation evidence |

**Status:** KOSRA, CEP, KIMP, ICO Charter exist and are canonical. **Missing:** MVP Execution Plan v2.0 (proposed in your veredicto ejecutivo but not yet materialized).

---

### 2.3 Product Constitution (KEMS)

These define the Evidence Model, Confidence Graph, and Claim semantics.

| Document | Version | Status | Purpose |
|----------|---------|--------|---------|
| KEMS-001_Confidence_Graph_Model | v1.0 | Canonical Draft | Defines Claims, Evidence Nodes, Confidence, Provenance |
| KEMS-002_Trustworthy_Evidence_Architecture | v1.0 | Pending Review | Evidence architecture; relationship to v1.1 unclear |
| KEMS-002_Trustworthy_Evidence_Architecture | v1.1 | Pending Review | Revised evidence architecture; supersession status unclear |
| KEMS-003_Kadarn_Product_Constitution | v1.0 | Canonical | Product rules and principles |
| KEMS-004_Claim_Provenance_Architecture | v1.0 | Canonical | Provenance model |
| KEMS-005_Schema_Evolution_Standard | v1.0 | — | Schema versioning |
| KEMS-006_Systems_Integration_Standard | v1.0 | — | Integration rules |
| KEMS-007_Evidence_Delivery_Architecture | v0.1 | Draft | Evidence publication |

**Issues:**
- KEMS-002 v1.0 vs v1.1: **STATUS UNCLEAR**
- KEMS-005, KEMS-006, KEMS-007: **Status not specified in governance index**

---

### 2.4 Architecture Decisions (ADRs)

**Total ADR files:** 36  
**Collisions (ID conflicts):** 7 numbers with duplicates = 14 files  
**Unique decisions:** ~22 (after removing identical phase-8 copies)

#### Collision Details

| ID | Conflict | Resolution Needed |
|----|----------|-------------------|
| 010 | policy-engine vs trust-engine-retirement | Renumber or clarify which is active |
| 011 | evidence-core-boundary vs trust-engine | Renumber or clarify precedence |
| 012 | engine-governance vs operational-twins | Renumber or clarify precedence |
| 018–025 | substantive ADRs vs identical phase-8 placeholders | Remove or renumber all phase-8 variants |

#### Non-Colliding ADRs (Sample)

| ID | Title | Status |
|----|-------|--------|
| 001 | Institution-Site Hierarchy | Accepted |
| 002 | Multi-Tenant Architecture | Accepted |
| 003 | Processing Engine Philosophy | Accepted |
| 004 | Platform Boundaries | Accepted |
| 005 | Architectural Lexicon | Accepted |
| 026 | Trust Surface Decommission | — |
| 033 | Organization Membership Model | — |
| 034 | Unified Workspace Experience | — |

---

### 2.5 Sprint and Implementation Structure (foundation/00_ROOT_AUTHORITY/v2)

These document the execution path for v2 of KADARN.

**Subfolder: `implementation/sprint-0/`** (10 files)
- Bootstrap, baseline verification, schema inventory, reconciliation, migration sequence

**Subfolder: `implementation/sprint-1/`** (5 files)
- Compact deliverables, authority model, baseline failure registry, skill disclosure

**Subfolder: `realignment/`** (multiple files)
- Architecture audit, gap analysis, impact matrix, migration strategy, backlog
- **Sub-subfolder: `review/`** – domain simplification, entity justification, architecture complexity
- **Sub-sub-subfolder: `final-gate/`** – claim/evidence decisions, provenance, observation policy, versioning, JSONB governance, minimal schema

**Assessment:** Detailed implementation trail; appears to document historical decision process. Relationship to current MVP execution plan unclear.

---

### 2.6 Engineering and Implementation

#### Loops (foundation/05_ENGINEERING/loops/)

| Loop | Files | Status | Purpose |
|------|-------|--------|---------|
| Loop 2: Evidence Acquisition | 13 | Documented | Evidence ingestion pipeline |
| Loop 3: Institutional Claims | 5 | Documented | Claims and capability model |
| Loop 4: Confidence Engine | 17 | Documented | Confidence calculation and governance |
| Canonical Repository Consolidation | 14 | Documented | Repository consolidation process |

**Total loop files:** 49  
**Status:** Historical documentation of implementation cycles. Relationship to current MVP work streams unclear.

#### KAD Implementations (foundation/05_ENGINEERING/)

| Document | Count | Purpose |
|----------|-------|---------|
| KAD-002A through KAD-002G | 7 | Phased implementation reports for KAD-002 |
| KAD-003 through KAD-012 | 10 | Individual implementation reports |

**Status:** Detailed records of completed or historical work.

---

### 2.7 Product Design (docs/)

#### docs/architecture/ (60+ files)

| Subdomain | Files | Status | Assessment |
|-----------|-------|--------|------------|
| Core Architecture | ARCHITECTURE.md, Blueprint, Manifesto | Supporting | Functional decomposition |
| Event Architecture | event-catalog.md | — | Event schema |
| KAA (Knowledge/Agent/Architecture) | CROSS-VALIDATION, KAA-001–003, KPE-INTEGRATION | Supporting | Integration reviews |
| KRM (Reference Model) | KRM-RAO, KRM-BNO-profile, lexicon, lexicon-changelog | Supporting | Reference models |
| Readiness and Validation | KPR, KPV, KPE reviews | Supporting | Validation reports |
| UX Architecture | ux-architecture.md | Supporting | User experience design |
| Workflows | WORKFLOW-CANDIDATES.md | — | Future workflows |

**Assessment:** Comprehensive architecture documentation. Much appears supportive to canonical documents.

#### docs/domain/ (6 files)

| Document | Status | Purpose |
|----------|--------|---------|
| claim-taxonomy-v1.0 | Draft | Claim classification (v1.0) |
| claim-taxonomy-v1.1-hybrid-trial | Draft | Claim classification (v1.1 for pilot) |
| knowledge-engine.md | — | Knowledge processing |
| policy-catalog.md | — | Policy definitions |
| provenance-graph.md | — | Provenance structure |
| integration-reference.md | — | Integration patterns |

**Assessment:** Domain models exist but status is unclear.

#### docs/kux/ (20+ files)

| Subfolder | Files | Purpose |
|-----------|-------|---------|
| architecture/ | 5 | Mental models, workspace shell, navigation |
| principles/ | 2 | Product experience principles, design language |
| governance/ | 3 | Sponsor spec freeze, README |
| workspaces/ | 9 | Institution, Public, Sponsor (6 sponsor-specific docs) |
| patterns/, components/ | 4 | Design patterns and components |

**Assessment:** KUX is well-documented as a product design framework.

#### docs/positioning/ (9 files)

| Document | Status | Assessment |
|----------|--------|------------|
| 01_PRODUCT_POSITIONING | — | Positioning document |
| 02_ARCHITECTURE_OVERVIEW_NARRATIVE | — | Architecture narrative |
| 03_DASHBOARD_INFORMATION_ARCHITECTURE | — | Dashboard design |
| 04_INSTITUTION_PROFILE_CONCEPTUAL_MODEL | — | Profile model |
| 05_DISCOVERY_READINESS_SPECIFICATION | — | Discovery spec |
| 06_CREDENTIAL_REGISTRY_SPECIFICATION | — | Credential registry |
| 07_OPERATIONAL_METRICS_SPECIFICATION | — | Metrics |
| 08_DOCUMENTATION_UPDATE_MAP | — | Doc map |

**Status:** Marked as "positioning" documents. **Assessment:** This folder appears to document a product positioning phase. May be historical relative to Institution-first doctrine. Requires classification: ACTIVE, HISTORICAL, or ARCHIVED.

#### docs/platform-discovery/ (50+ files)

| Category | Files | Status |
|----------|-------|--------|
| Data/Model Discovery | automatic-extraction-matrix, data-redundancy, canonical-data-model | Research |
| ORP (Onboarding Refactoring Program) | orp-1.0 through orp-1.12 | Detailed investigation |
| PCP (People/Platform Completion) | pcp-1.1, pcp-1.2, pcp-2 | Detailed investigation |
| Infrastructure and Knowledge | infrastructure-graph, knowledge-model, organization-v2 | Research |

**Assessment:** "platform-discovery" folder contains extensive research and audit reports. These appear to document a **discovery/audit phase** that informed later decisions. They are not canonical documents but **evidence of analysis**. Should be classified as HISTORICAL EVIDENCE or RESEARCH INPUT, not deleted.

#### docs/onboarding/ (8 files)

| Document | Purpose |
|----------|---------|
| ocp-0 through ocp-7 | Onboarding completion program, step by step |

**Assessment:** Appears to document an onboarding flow. Status relative to current FTUX and KADARN-PLAN-MVP-002 unclear.

#### docs/pilots/ (5 files)

| Document | Purpose |
|----------|---------|
| ALPHA_PILOT_FIX_VALIDATION | Pilot validation |
| ALPHA_SEED_DATA | Seed data for pilot |
| FIRST_BIOBANK_PILOT_RUNBOOK | Pilot operations |
| FIRST_PILOT_REPORT | Pilot results |
| vilo-hybrid-trial-checklist | Vilo validation |

**Assessment:** Pilot evidence from alpha and early trials. Classified as VALIDATION EVIDENCE, not canonical product spec.

#### docs/bootstrap/ (2 files)

| Document | Purpose |
|----------|---------|
| bootstrap-01-environment-audit | Environment setup |
| day-0-startup-guide | Getting started |

**Assessment:** Operational documentation.

---

### 2.8 Compliance and Governance (governance/)

| Subfolder | Files | Status | Purpose |
|-----------|-------|--------|---------|
| agreements/ | 4 | ⚠️ Identical | BAA, DPA, DUA, MTA templates (all same content) |
| compliance/ | 12 | Draft | HIPAA, ISO, SOC2, quality, privacy, information security assessments |
| hipaa/ | 1 | Draft | HIPAA gap assessment |
| lexicon/ | 2 | Canonical | Kadarn Lexicon v1.1, Readiness & Governance Pack |

**Assessment:** Compliance framework is present but draft status. Agreement templates are identical (consolidation needed).

---

### 2.9 OpenSpec (openspec/)

The `openspec/` folder contains SDD (Spec-Driven Development) artifacts, product book drafts, phase completions, and sprint ledgers.

#### Product Book (openspec/product-book/)

| Document | Version | Purpose |
|----------|---------|---------|
| kadarn-product-book-v2 | — | Main product book |
| pb-2.1 through pb-2.10 | — | Product book chapters |
| pbf-2.0-product-book-freeze | — | Freeze record |
| pdr-001-004-product-decisions | — | Product decision records |

**Assessment:** Product Book v2 is documented with full chapter structure and frozen status.

#### Architecture Freezes (openspec/)

| Document | Purpose |
|----------|---------|
| architecture-freeze-af-2.0 through af-4.0 | Multiple architecture freeze declarations |
| architecture-compliance, certification-report | Freeze validation |

**Assessment:** Multiple "freeze" documents suggest iterative architecture checkpoints (v2.0, v3.0, v4.0).

#### Phase and Sprint Documentation (openspec/)

| Category | Examples | Assessment |
|----------|----------|------------|
| Phase 8 | phase-8-cutover-runbook, migration-parity, gap-analysis | Detailed phase documentation |
| Phase 9 | phase-9-evidence-delivery-architecture | Evolution documentation |
| Sprints | sprint-17.x through sprint-20 ledgers | Detailed implementation records |

**Assessment:** Comprehensive sprint and phase tracking. Appears to document a mature implementation cycle.

#### Design Drafts (openspec/drafts/)

| Document | Count | Status |
|----------|-------|--------|
| ADRs 027–033 | 7 | Draft status |
| phase-8-contracts | Multiple | Draft |

**Assessment:** Proposed future ADRs; not yet frozen.

#### KTP (KADARN Transformation Program) (openspec/)

| Document | Purpose |
|----------|---------|
| ktp-1.0a through ktp-1.9 | Transformation program documentation |

**Assessment:** Records KTP missions and decisions.

---

### 2.10 External/Attached Documents (9 files from your upload)

These were provided as reference but are NOT currently in the repository canonical structure:

| Document | Type | Status |
|----------|------|--------|
| KADARN_CANONICAL_GOVERNANCE_DOCUMENT_SET_INDEX_v1.1.md | Governance Index | EXTERNAL |
| KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md | Strategic Plan | EXTERNAL |
| KADARN_MVP_Execution_Plan_v2.0_CANONICAL.docx | MVP Plan (your veredicto) | **NOT YET MATERIALIZED** |
| KADARN_PROGRAM_PASSPORT_SPECIFICATION_v1.0.docx | Program Specification | EXTERNAL |
| KADARN_PROGRAM_OFFICE_CHARTER_v1.0.docx | KPO Charter | EXTERNAL |
| KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.docx | KIMP | EXTERNAL |
| deep-research-report (2,3,4,5).md | Research | EXTERNAL |
| Vilo Audit | Validation Evidence | EXTERNAL |
| KEMS.zip, Master Work Plan.zip, Evidence Blueprint | Core Specs | EXTERNAL |

**Finding:** Your MVP Execution Plan v2.0 has been **proposed but not materialized** in the canonical repository.

---

## PART 3: CONFLICT MATRIX

### Conflict 1: ADR Numbering

**Severity:** HIGH  
**Scope:** 14 files affected  
**Recommendation:** Immediate renumbering required.

```
RESOLUTION PATH:

Step 1: Identify which ADR is active (Accepted vs Proposed)
  adr-010: policy-engine vs trust-engine-retirement
  adr-011: evidence-core-boundary vs trust-engine
  adr-012: engine-governance vs operational-twins
  adr-018–025: substantive ADR vs phase-8 placeholder

Step 2: Renumber phase-8 variants to new numbers (ADR-050+)
  adr-018-phase-8 → adr-050-phase-8-reserved or DELETE

Step 3: Verify ADR precedence in GOVERNANCE_INDEX.md
  Confirm which decision is active, which is superseded

Step 4: Update ADRREGISTER and links
```

### Conflict 2: KEMS Versioning

**Severity:** MEDIUM  
**Scope:** KEMS-002 v1.0 vs v1.1  
**Recommendation:** Explicit supersession record required.

```
RESOLUTION PATH:

Current state:
  KEMS-002 v1.0 exists and is listed in index as "Pending Review"
  KEMS-002 v1.1 exists and is listed in index as "Pending Review"
  No document states which supersedes which

Required:
  1. Confirm v1.1 was approved by Architecture Governance
  2. Document supersession in GOVERNANCE_CHANGELOG.md
  3. Mark v1.0 as SUPERSEDED if appropriate
  4. Or, if both coexist, clarify their scope separation
```

### Conflict 3: Exact File Duplicates

**Severity:** MEDIUM  
**Scope:** 14 files  
**Recommendation:** Consolidate and maintain single source of truth.

```
DUPLICATES:

1. Agreement Templates (4 files, identical)
   governance/compliance/agreement-templates/baa-template.md
   governance/compliance/agreement-templates/dpa-template.md
   governance/compliance/agreement-templates/dua-template.md
   governance/compliance/agreement-templates/mta-template.md
   
   ACTION: Create single GENERIC_AGREEMENT_TEMPLATE.md
           Point BAA/DPA/DUA/MTA to it
           Mark redundant copies as ARCHIVED

2. Phase-8 ADR Placeholders (8 files, identical)
   docs/adr/adr-{018,019,020,021,022,023,024,025}-phase-8.md
   
   ACTION: Delete or rename to placeholder
           Renumber to 050+ range if needed
           Keep ONE as reference only

3. Lexicon Duplication (2 files, identical)
   docs/lexicon/release-readiness-framework.md
   governance/lexicon/Kadarn_Readiness_and_Governance_Pack_v1.0_English.md
   
   ACTION: Determine canonical location
           Delete or archive copy
           Update GOVERNANCE_INDEX.md
```

### Conflict 4: Missing MVP Execution Plan v2.0

**Severity:** CRITICAL  
**Finding:** Your veredicto ejecutivo proposes KADARN_MVP_Execution_Plan_v2.0 with sequence WO-MVP-00A→06B, but this document does not exist in the repository.

**Current state:**
- KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md ✅ (Exists, Level 2 Strategic)
- KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md ✅ (Exists, Level 3 Implementation)
- KADARN_MVP_Execution_Plan_v2.0_CANONICAL.md ❌ (MISSING)

**Required action:**
- Materialize KADARN_MVP_Execution_Plan_v2.0_CANONICAL.md in `foundation/00_GOVERNANCE/` or `foundation/05_ENGINEERING/`
- Link it to WO-KPO-001
- Register it in GOVERNANCE_INDEX.md as Level 2 or 3
- Clarify relationship to CEP v1.0 (does v2.0 supersede or refine?)

---

## PART 4: CLASSIFICATION SUMMARY

### By Document Type

| Type | Count | Status | Action |
|------|-------|--------|--------|
| Governance (framework) | 9 | ✅ Canonical | KEEP |
| ADR | 36 | ⚠️ 7 ID collisions | RENUMBER / CONSOLIDATE |
| KEMS | 8 | ⚠️ v1.1 ambiguity | CLARIFY SUPERSESSION |
| Architecture | 60+ | ✅ Supporting | KEEP |
| KUX/Design | 20+ | ✅ Active | KEEP |
| Domain Models | 6 | ? Status unclear | CLASSIFY |
| Onboarding | 8 | ? Vs FTUX | ALIGN WITH MVP |
| Platform Discovery | 50+ | 📚 Historical | ARCHIVE / REFERENCE |
| Positioning | 9 | ? Institution-first only | AUDIT FOR RELEVANCE |
| Pilots | 5 | ✅ Validation Evidence | KEEP |
| Loops | 49 | 📚 Implementation History | ARCHIVE / REFERENCE |
| Sprints/Phases | 100+ | 📚 Implementation History | ARCHIVE / REFERENCE |
| Compliance | 12+ | ⚠️ Draft | ACTIVATE OR RETIRE |
| OpenSpec SDD | 100+ | 📚 Transformation Records | ORGANIZE |

**Legend:**
- ✅ = Keep as-is
- ⚠️ = Requires action before next phase
- ? = Status unclear, requires classification
- 📚 = Archive or reference; not current operational documents

---

## PART 5: RECOMMENDATIONS FOR HUMAN GATE

### 5.1 Immediate Actions (WO-KPO-001 STAGE B)

**Priority 1: Resolve Critical Conflicts**

1. **ADR Renumbering**
   - Renumber 8 identical phase-8 ADRs to 050–057 range (or mark DEPRECATED)
   - Renumber colliding ADR-010, 011, 012 to new numbers (036–038 or equivalent)
   - Update all references and registries
   - **Time estimate:** 2–4 hours

2. **KEMS-002 Versioning**
   - Obtain approval decision for KEMS-002 v1.1 (does it supersede v1.0?)
   - Update GOVERNANCE_INDEX.md with explicit status
   - Register in GOVERNANCE_CHANGELOG.md
   - **Time estimate:** 1 hour

3. **Consolidate Duplicates**
   - Merge 4 identical agreement templates into 1 + metadata
   - Delete or archive 8 identical phase-8 ADR copies
   - Merge 2 identical lexicon files
   - **Time estimate:** 1–2 hours

**Priority 2: Materialize Missing Documents**

4. **Materialize MVP Execution Plan v2.0**
   - Convert your veredicto ejecutivo into `KADARN_MVP_Execution_Plan_v2.0_CANONICAL.md`
   - Place in `foundation/00_GOVERNANCE/` or `foundation/05_ENGINEERING/`
   - Document Work Order sequence (WO-MVP-00A→06B)
   - Register in GOVERNANCE_INDEX.md
   - **Time estimate:** 3–4 hours (using your existing text)

5. **Classify Platform Discovery**
   - Mark all 50+ docs in `docs/platform-discovery/` as `[HISTORICAL — DISCOVERY EVIDENCE]`
   - Create index of key findings
   - Archive folder or move to `archive/discovery-reports/`
   - **Time estimate:** 1–2 hours

6. **Classify Positioning**
   - Audit each of 9 positioning docs for Institution-first alignment
   - Keep documents that support current doctrine
   - Mark or archive Institution-independent marketplace docs
   - **Time estimate:** 1–2 hours

### 5.2 Secondary Actions (WO-KPO-001 STAGE B+)

7. **Loop Status**
   - Determine if loops (Loop 2, 3, 4, canonical-repo) are active or historical
   - If historical: archive to `archive/implementation-history/loops/`
   - If active: link to current Work Order structure
   - **Time estimate:** 2 hours

8. **Domain Model Clarification**
   - Clarify status of claim-taxonomy v1.0 vs v1.1
   - Approve domain models or mark as reference
   - **Time estimate:** 1 hour

9. **Compliance Framework**
   - Activate HIPAA, ISO, SOC2 assessments or mark DEFERRED
   - Update compliance roadmap
   - **Time estimate:** 2 hours

10. **Governance Index Update**
    - Add entries for all reclassified documents
    - Add entries for MVP Execution Plan v2.0
    - Add entries for archived or reference documents
    - **Time estimate:** 2 hours

---

## PART 6: PROPOSED REPOSITORY STRUCTURE (POST-CONSOLIDATION)

```
foundation/
  00_GOVERNANCE/
    CANONICAL_REPOSITORY.md
    DOCUMENT_PRECEDENCE.md
    DOCUMENT_RELATIONSHIP_MAP.md
    GOVERNANCE_CHANGELOG.md
    GOVERNANCE_INDEX.md ← MUST INCLUDE ALL 446 DOCS
    GOVERNANCE_INTEGRATION_REPORT.md
    GOVERNANCE_VALIDATION_REPORT.md
    IMPLEMENTATION_PROGRAM_INDEX.md
    WORK_ORDER_CATALOG.md
    KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md
    KADARN_IMPLEMENTATION_CONTROL_OFFICE_CHARTER_v1.0.md
    KADARN_MVP_EXECUTION_PLAN_v2.0_CANONICAL.md ← NEW

  01_DOMAIN/
    016_CANONICAL_ENTITY_SPECIFICATIONS.md

  05_ENGINEERING/
    architecture/
      KOSRA.md
      KOSRA_IMPLEMENTATION_MAPPING.md
      KOSRA_DECISION_REGISTER.md
      KOSRA_MATERIALIZATION_REPORT.md
      KOSRA_V02_VALIDATION_REPORT.md
      KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md
    implementation-reports/
      KAD-002A through KAD-012 reports
    loops/
      [ARCHIVE FOLDER OR KEEP WITH STATUS LABELS]

docs/
  adr/
    [RENUMBERED AND DEDUPLICATED]
  architecture/
    [KEEP: 60+ supporting docs]
  domain/
    [CLASSIFIED AND VERSIONED]
  kems/
    [KEMS-002 versioning clarified]
  kux/
    [KEEP: 20+ active design docs]
  pilots/
    [MARKED: VALIDATION EVIDENCE]
  bootstrap/
  ops/

governance/
  agreements/
    [CONSOLIDATED: single template + variants]
  compliance/
    [STATUS ACTIVATED OR DEFERRED]
  lexicon/
    [DEDUPLICATED]
  risk/

openspec/
  product-book/
  architecture-freezes/
  phase-8/ through phase-9/
  sprints/
  ktp/
  drafts/

archive/
  discovery-reports/
    [FORMER: docs/platform-discovery/]
  implementation-history/
    [FORMER: foundation/05_ENGINEERING/loops/ if decommissioned]
  deprecated-adrs/
    [FORMER: adr-018-025-phase-8 and others]
  superseded-docs/
```

---

## PART 7: NEXT STEPS

### Immediate (This Session)

1. ✅ **Inventory complete** — This document (WO-KPO-001 STAGE A)
2. ⏳ **Human Gate decision required** — Do you approve the classifications and recommendations above?

### Phase B (Post-Human Gate Approval)

3. **Execute consolidations** — Merge duplicates, renumber ADRs, clarify KEMS
4. **Materialize missing documents** — Convert veredicto to MVP Plan v2.0
5. **Update registries** — GOVERNANCE_INDEX.md with all 446 documents
6. **Reorganize folders** — Archive, consolidate, create index
7. **Validation** — Verify all links, references, registries

### Phase C (Post-Consolidation)

8. **Repository cutover** — Switch to consolidated structure
9. **Hand off to implementation** — WO-MVP-00A (Repository Baseline Verification)

---

## APPENDIX A: DOCUMENT COUNT BY FOLDER

| Folder | Count | Status |
|--------|-------|--------|
| governance/ | 24 | ✅ Canonical/Compliance |
| foundation/00_GOVERNANCE/ | 11 | ✅ Governance |
| foundation/00_ROOT_AUTHORITY/v2/ | 38 | 📚 Implementation History |
| foundation/01_DOMAIN/ | 1 | ? Classified |
| foundation/05_ENGINEERING/ | 49 | 📚 Implementation + Loops |
| docs/adr/ | 36 | ⚠️ Collisions |
| docs/architecture/ | 60+ | ✅ Supporting |
| docs/domain/ | 6 | ? Status unclear |
| docs/kems/ | 8 | ⚠️ Version ambiguity |
| docs/kux/ | 20+ | ✅ Active |
| docs/lexicon/ | 2 | ⚠️ Duplicate |
| docs/onboarding/ | 8 | ? Align with MVP |
| docs/ops/ | 2 | ✅ Operational |
| docs/pilots/ | 5 | ✅ Validation |
| docs/positioning/ | 9 | ? Audit relevance |
| docs/platform-discovery/ | 50+ | 📚 Historical |
| docs/bootstrap/ | 2 | ✅ Operational |
| docs/validation/ | 2 | — |
| docs/releases/ | 1 | — |
| docs/strategy/ | 1 | — |
| docs/ux/ | 3 | ✅ Supporting |
| .hermes/ | 1 | ✅ Work Order Report |
| openspec/ | 100+ | 📚 SDD Artifacts |

**TOTAL:** 446 Markdown files inventoried.

---

## APPROVAL RECORD

| Role | Decision | Name | Date |
|------|----------|------|------|
| KPO | PENDING | — | — |
| Human Gate | PENDING | — | — |

---

**Document Status:** WO-KPO-001 STAGE A COMPLETE — AWAITING HUMAN GATE REVIEW

**Next deliverable:** STAGE B actions (consolidation) pending approval.
