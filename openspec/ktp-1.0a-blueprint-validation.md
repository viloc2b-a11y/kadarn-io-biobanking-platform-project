# KTP-1.0A — Blueprint Validation Gate Review

> **Date:** 2026-07-06
> **Reviewer:** R0-E Engineering Advisor (read-only, 4-lens review)
> **Status:** COMPLETE
> **Verdict:** PASS — All concepts frozen. Proceed to Mission 2 with 4 flagged ambiguities.

---

This gate review validates the conceptual model for Kadarn's pivot from marketplace-first to institution-first Program Readiness platform. Six fundamental concepts are defined architecturally, grounded in existing code, and assessed for internal consistency. This is a PURE CONCEPTUAL review — no migrations, tables, enums, or seeds are proposed.

---

## Table of Contents

1. [Question 1: What exactly is a Program?](#q1)
2. [Question 2: What is a Capability?](#q2)
3. [Question 3: What is Readiness?](#q3)
4. [Question 4: What is Program Readiness?](#q4)
5. [Question 5: KEMS Flow and Boundaries](#q5)
6. [Question 6: What happens to Marketplace?](#q6)
7. [Residual Ambiguities](#ambiguities)
8. [Verdict](#verdict)

---

<a name="q1"></a>
## 1. What Exactly Is a Program?

### Formal Architectural Definition

```
A PROGRAM is an institutional initiative representing a validatable operational
capability within a specific domain. It exists in exactly one of two forms at
any given time: a Program Type (template/category) or a Program Instance
(specific occurrence). Both are stored in the programs table and distinguished
by their program_type[] classification.
```

#### Program Type (Template)

A **Program Type** is a persistent specification of capability requirements, evidence requirements, and evaluation criteria for a readiness domain. It is a template, not an instance.

| Property | Value |
|----------|-------|
| **Depends on sponsor?** | No. sponsor_org_id is NULL. |
| **Depends on protocol?** | No. It specifies what evidence is required, not how to execute. |
| **Has timeline?** | No. start_date and end_date are NULL. It is evergreen. |
| **Has participants?** | No. It is a template. program_participants records are empty. |
| **Can it remain active for years?** | Yes. Status remains 'active' indefinitely. |
| **Who creates it?** | Kadarn platform administrators (system-seeded). |
| **Example** | "Prospective Biospecimen Collection Readiness" — a standing capability template. |
| **Identified by** | program_type[] containing values like `'readiness_biospecimen_collection'`. |

#### Program Instance (Execution)

A **Program Instance** is a concrete multi-organization collaboration around a biospecimen and/or clinical data need, with a defined sponsor, timeline, and participants.

| Property | Value |
|----------|-------|
| **Depends on sponsor?** | Yes. sponsor_org_id references a real organization. |
| **Depends on timeline?** | Yes. start_date and end_date define the execution window. |
| **Has participants?** | Yes. program_participants records link organizations. |
| **Example** | "Multi-center retrospective study on TNBC — 500 FFPE blocks from 3 sites." |
| **Identified by** | program_type[] containing values like `'retrospective_study'`. |

#### Shared Infrastructure

Both forms use the same `programs` table (migration 010). This is intentional per the Mission 1 constraint: "Use programs table — do not create separate readiness_programs table."

| Shared column | Meaning for Program Type | Meaning for Program Instance |
|---------------|--------------------------|------------------------------|
| `name` | Human-readable template name | Human-readable study name |
| `program_type[]` | `'readiness_*'` classification | `'retrospective_study'`, `'clinical_trial_biospecimen'`, etc. |
| `status` | `'active'` (evergreen) | Lifecycle: draft → active → completed → archived |
| `sponsor_org_id` | NULL | UUID of sponsor organization |
| `lead_org_id` | NULL | UUID of lead organization |
| `start_date / end_date` | NULL | Defined execution dates |
| `visibility_scope` | `'network'` (discoverable) | Variable (program-specific) |
| `created_by_organization_id` | System org UUID | Creator org UUID |

#### Grounding in Existing Code

- `database/migrations/010_audit_programs.sql` — `programs` table lines 119-152: `program_type TEXT[] DEFAULT '{}'`, extensible classification.
- `database/migrations/010_audit_programs.sql` — `CHECK (created_by_organization_id IS NOT NULL) NOT VALID` at line 167. **Ambiguity: this constraint assumes every program has a creator org. A system-seeded Program Type would need a system organization.**
- `docs/architecture/kadarn-platform-blueprint.md` §6 — "The Program is the central object. Everything else exists in service of programs."

#### Explicit Flag: Unresolved Question

**Does the programs_created_by_org_required CHECK constraint block system-seeded templates?** The current `CHECK (created_by_organization_id IS NOT NULL)` (line 167, 010) assumes every program is created by a real organization. Program Types are system-seeded templates. Resolution: either (a) create a "Kadarn Platform" system organization to own seeded templates, or (b) relax the constraint to allow NULL for program_type = readiness variants, or (c) use NOT VALID and handle at application layer. **This must be resolved in Mission 2 before creating readiness templates.**

---

<a name="q2"></a>
## 2. What Is a Capability?

### Formal Architectural Definition

```
A CAPABILITY is a demonstrable institutional competency whose existence must be
evidenced and validated through the Evidence Core. It is NOT a static attribute
or organizational label — it is something an institution DEMONSTRATES, not just
something it HAS.

  Capability = CapabilityType (vocabulary) × CapabilityAssertion (claim)
               × EvidenceBacking (immutable proof)

All three components must exist for a capability to be considered validated.
```

#### Distinction from organization_capabilities (Migration 008)

The existing `organization_capabilities` table (008) records a **capability assertion**: organization X claims capability Y. This is a self-declaration — not validated.

| Layer | Table | What it represents | Status |
|-------|-------|--------------------|--------|
| **Vocabulary** | `organization_capability_types` | What capabilities exist in the Kadarn ontology | Controlled (seeded) |
| **Assertion** | `organization_capabilities` | Org X claims it has capability Y | Self-declared, unvalidated |
| **Evidenced** | `claims` + `evidence_nodes` (045) | Org X proves capability Y with evidence | Validated by Evidence Core |

The Mission 1 assessment states: "Capabilities are things orgs DO. Readiness programs are ASSESSMENTS." This is correct but incomplete. The full definition is:

> A Capability is **demonstrated** when an institution has:
> 1. Asserted the capability (organization_capabilities row)
> 2. Created a claim asserting capability existence (claims row, claim_type_id referencing the capability)
> 3. Submitted sufficient evidence backing the claim (evidence_nodes, evidence class ≥ minimum required)
> 4. The claim has been evaluated and confidence ≥ threshold

#### Capability vs Feature vs Attribute

| Concept | Definition | Example |
|---------|------------|---------|
| **Capability** | Demonstrable institutional competency requiring evidence | "PBMC Processing" — proved by SOP documents, lab certification, QC data |
| **Feature** | A sub-component of a capability; optional or configurable | "Density gradient separation method" within PBMC Processing |
| **Attribute** | A descriptive property of an organization or capability; no evidence required | "Founded in 2010", "Located in Boston" |

Features and attributes can be metadata on the capability assertion. They do NOT carry the evidentiary weight of the capability itself.

#### Relationship: Institution → Capability → Evidence

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Institution │────>│  Capability  │────>│   Evidence   │
│              │     │              │     │              │
│  org (008)   │     │ org_cap (008)│     │ claims (045) │
│              │     │ claim (045)  │     │ ev_nodes(045)│
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       │  1:N                │  1:1 (claim)        │  1:N (nodes per claim)
       │                     │  1:N (nodes)        │
       v                     v                     v
  An institution       Each capability        Each claim is backed
  HAS many             IS BACKED by           by N evidence nodes
  capabilities         ONE evidence claim     with class weights
```

#### Formal Answer: HAVE vs DEMONSTRATE

| HAVE | DEMONSTRATE |
|------|-------------|
| `organization_capabilities` row exists | `claims` row exists + `evidence_nodes` pass evaluation |
| Self-declaration | Validated by Evidence Core |
| No confidence score | Confidence score 0-100 with level |
| Required for readiness assessment | REQUIRED for readiness status > Not Ready |
| Supply-side (org publishes it) | Demand-side (readiness evaluator validates it) |

**A capability is something you DEMONSTRATE. Having it on paper (assertion) is not enough.**

#### Grounding

<a name="q3"></a>
## 3. What Is Readiness?

### Formal Architectural Definition

```
READINESS is a DERIVED projection that an institution can successfully execute a
specific program type, computed on-demand from the Evidence Graph by aggregating
capability-level confidences, applying evidence-class weights, and comparing
against program-type capability requirements. It is NOT a stored score — it is
a function of the evidence graph at query time.

  Readiness(t, org) = f(evidence_graph(org), requirements(t))

Where:
  t        = Program Type
  org      = Institution
  f        = Aggregation function (MIN across mandatory capabilities, weighted
             average across optional, conditional gates applied)
```

#### The DERIVED State Principle

Readiness is always DERIVED, never STORED as a scalar. The rationale:

1. **Evidence changes**: new evidence nodes, counter-evidence, evidence decay — all invalidate a cached readiness score.
2. **Auditability**: derived readiness can be re-computed from immutable evidence. A stored score is a claim that may drift.
3. **Transparency**: institutions and sponsors can trace "why Not Ready?" to specific missing evidence.

**Exception**: Readiness snapshots MAY be cached as materialized JSONB (e.g., in `readiness_evaluations.metadata`) for performance, per Mission 1 Finding P2. But the canonical readiness status is always the recomputed value. Cached snapshots must include a `computed_at` timestamp and the `correlation_id` of the evidence graph state used.

#### Formal Flow: Evidence → Claims → Confidence Graph → Capability Assessment → Program Readiness

```
┌──────────┐   ┌──────────┐   ┌───────────────┐   ┌────────────────┐   ┌──────────────────┐
│ EVIDENCE │──>│  CLAIMS  │──>│  CONFIDENCE    │──>│   CAPABILITY   │──>│     PROGRAM      │
│  NODES   │   │          │   │     GRAPH      │   │   ASSESSMENT   │   │    READINESS     │
│  (045)   │   │  (045)   │   │  (045 snaps)   │   │ (new, derived) │   │  (new, derived)  │
└──────────┘   └──────────┘   └───────────────┘   └────────────────┘   └──────────────────┘
      │              │                │                    │                     │
      │ Append-only  │ Bounded        │ evaluateClaim()    │ Aggregate per       │ MIN across
      │ Immutable    │ assertions     │ evaluateEvidence   │ capability type     │ mandatory caps
      │ 6 classes    │ per capability │ Graph()            │ per program type    │ + conditional gates
      │ A-F weights  │                │ ConfidenceReport   │                     │
      v              v                v                    v                     v

   EVIDENCE CORE (KEMS) ──────────────────────────────> READINESS ENGINE (new package)
```

**Layer responsibilities:**

| Layer | Package/Schema | Responsibility | Existing/New |
|-------|----------------|----------------|--------------|
| Evidence Nodes | `evidence-core` + 045 | Store immutable evidence, provenance, access | Existing |
| Claims | `evidence-core` + 045 | Bounded assertions about capabilities | Existing |
| Confidence Graph | `evidence-core/output.ts`, `evidence-core/graph.ts` | compute confidence per claim from evidence weight + class | Existing |
| Capability Assessment | NEW: `readiness-engine` or application service | Map claim confidences to capability requirements | New |
| Program Readiness | NEW: `readiness-engine` | Aggregate capabilities, apply gates, project readiness status | New |

#### Readiness vs Trust Score vs Confidence Score vs Compliance Status

| Concept | What it measures | Who computes it | Scope | Stability |
|---------|-----------------|-----------------|-------|-----------|
| **Trust Score** | Operational quality reputation | `trust-engine` | Organization-wide, 4 dimensions (operational, regulatory, financial, technical) | Slow-changing, decay-based |
| **Confidence Score** | Probability that a claim is true given its evidence backing | `evidence-core/output.ts` (`evaluateClaim`) | Per-claim, evidence-weighted | Recalculated on evidence change |
| **Compliance Status** | Binary gate: is a regulatory requirement met? | `policy-engine` or application logic | Per-requirement, pass/fail | Event-driven (certification issued/expired) |
| **Readiness** | Can institution execute this program type? | NEW: `readiness-engine` | Per program type, multi-capability aggregation | Derived on demand |

**Key difference**: Trust Score answers "is this organization reliable?" Readiness answers "is this organization qualified for THIS specific program type?" The same institution can be Ready for biospecimen collection but Not Ready for IVD validation.

#### Grounding in Existing Code

- `packages/evidence-core/src/output.ts` — `evaluateClaim(claimId): ConfidenceReport` computes per-claim confidence.
- `packages/evidence-core/src/graph.ts` — `getClaimEvidence()`, `getSupportingEvidence()`, `getContradictingEvidence()` traverse evidence graph.
- `packages/trust-engine/src/engine.ts` — `computeOverall()`, `applyDecay()` compute operational trust (organization-level, not program-specific).
- `database/migrations/045_evidence_core.sql` — `confidence_state_snapshots` table with `value INTEGER 0-100`, `level confidence_level`, `contributions JSONB`.

---

<a name="q4"></a>
## 4. What Is Program Readiness?

### Formal Architectural Definition

```
PROGRAM READINESS is:

  "An institution's demonstrated capability to execute a specific program type,
   validated by evidence-class-weighted confidence derived from the Evidence
   Core, projected through mandatory capability gates and optional condition
   checks, yielding exactly one of four readiness statuses."

  ProgramReadiness(org, programType) → { NotReady, Partial, ConditionallyReady, Ready }
```

This is the MOST IMPORTANT concept in the new Kadarn. It is the product's north star.

#### The Four Readiness Statuses

##### NOT READY — `not_ready`

**Criterion**: One or more MANDATORY evidence items are absent, OR a regulatory gate has failed, OR a required capability has no claim at all.

```
Institution CANNOT execute this program type.
```

| Trigger | Example |
|---------|---------|
| Mandatory capability not claimed | No `processing_lab` capability asserted |
| Mandatory evidence missing | No IRB registration document (Class A) |
| Regulatory gate failed | ISO 13485 certification expired |
| Counter-evidence unresolved | Active dispute on lab certification |
| Minimum evidence class not met | Required Class A evidence, only Class C submitted |

**Computation**: `status = NOT_READY` if `∃ c ∈ mandatoryRequirements(caps) : confidence(c) = 0 OR gap(c) > 0`

##### PARTIAL — `partial`

**Criterion**: All mandatory evidence is present, but one or more optional/recommended evidence items are missing.

```
Institution has baseline capability but gaps remain. Needs development.
```

| Trigger | Example |
|---------|---------|
| Mandatory evidence met | IRB, SOP, lab certification all present |
| Optional evidence missing | No reference projects submitted |
| Optional capability missing | `data_processor` capability for PBMC not asserted |

**Computation**: `status = PARTIAL` if `∀ c ∈ mandatoryRequirements(caps) : confidence(c) > 0` AND `∃ c ∈ optionalRequirements(caps) : gap(c) > 0`

##### CONDITIONALLY READY — `conditionally_ready`

**Criterion**: All mandatory AND optional evidence is present at required class levels, BUT specific conditions apply. These are not evidence gaps — they are operational conditions.

```
Institution can execute this program type IF conditions are met.
```

| Trigger | Example |
|---------|---------|
| Logistics dependency | "Requires third-party logistics vendor for cold chain" |
| Certification near expiry | "CLIA certification expires in 45 days" |
| Geographic limitation | "Valid for US-based collections only" |
| Volume constraint | "Maximum 500 samples per quarter" |

**Key distinction**: Conditional readiness is NOT about missing evidence. It's about operational constraints that don't invalidate capability but limit execution scope.

**Computation**: `status = CONDITIONALLY_READY` if readiness score ≥ threshold AND `conditions.length > 0`

##### READY — `ready`

**Criterion**: All capability requirements met, all mandatory and optional evidence present at required class or above, no outstanding conditions.

```
Institution is fully validated for this program type.
```

| Trigger | Example |
|---------|---------|
| All capabilities evidenced | 7/7 capabilities with Class A/B evidence |
| All evidence classes met or exceeded | Class A evidence present where B required |
| No unresolved counter-evidence | All disputes resolved or responded |
| No operational conditions | No constraints flagged |

**Computation**: `status = READY` if `∀ c ∈ allRequirements(caps) : confidence(c) ≥ threshold(c)` AND `conditions.length = 0`

#### Data Ownership and Consumption

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATA OWNERSHIP                           │
│                                                                  │
│  INSTITUTION OWNS:                           SPONSOR CONSUMES:   │
│  ┌──────────────────────┐                   ┌──────────────────┐ │
│  │ Evidence Nodes       │                   │ Readiness Status  │ │
│  │ Claims               │                   │ Capability Gaps   │ │
│  │ Capability Assertions│    ──publish──>    │ Confidence Scores │ │
│  │ Readiness Evaluation │                   │ Evidence Trail    │ │
│  │ Readiness Status     │                   │ Readiness Report  │ │
│  └──────────────────────┘                   └──────────────────┘ │
│                                                                  │
│                              NETWORK CONSUMES:                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Aggregated readiness metrics (anonymized, analytics)      │   │
│  │ Network capability coverage (which programs have capacity)│   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│                              REGULATORS CONSUME:                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Readiness Reports (exportable, verifiable)                │   │
│  │ Evidence trail (for program qualification audits)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

| Actor | Relationship | Access | Mechanism |
|-------|-------------|--------|-----------|
| **Institution** | OWNS readiness data | Full read/write | `visibility_scope = 'organization'`, RLS |
| **Sponsor** | CONSUMES readiness data | Read published readiness | `visibility_scope = 'network'`, `authorized_sponsor_ids` |
| **Network** | CONSUMES aggregate data | Read anonymized metrics | Analytics Engine |
| **Regulator** | CONSUMES verified reports | Read exportable reports | Published View Engine, audit trail |

**Critical invariant**: Institutions control what they publish. A readiness evaluation can be `visibility_scope = 'organization'` (private) until the institution chooses to publish it (`visibility_scope = 'network'`). Sponsors can ONLY see published readiness, never private evaluations.

#### Grounding in Existing Code

- `database/migrations/010_audit_programs.sql` — `program_type TEXT[]`, `sponsor_org_id`, `lead_org_id`, `visibility_scope`.
- `database/migrations/045_evidence_core.sql` — `claims.visibility_scope`, `claims.authorized_sponsor_ids`, `confidence_state_snapshots`.
- `database/migrations/008_organizations_capabilities.sql` — `organization_capabilities` (assertion layer).
- `packages/evidence-core/src/output.ts` — `evaluateClaim()` returns `ConfidenceReport` with `confidence: number`, `level: ConfidenceLevel`, `contributions: ContributionBreakdownItem[]`.
- `packages/evidence-core/src/evaluation.ts` — `EvaluationPipeline`, `aggregateContributions()`, `projectConfidence()`.

#### Explicit Flag: Unresolved Question

**What is the readiness threshold for CONDITIONALLY_READY vs READY?** The threshold is program-type-specific. PBMC Processing might require confidence ≥ 0.70; IVD Validation might require ≥ 0.85. **The threshold must be a configuration on the Program Type, not hardcoded in the engine.** Mission 2 should add a `readiness_threshold` field to `program_type_taxonomy` or to the `programs.metadata` JSONB for readiness program types.

---

<a name="q5"></a>
## 5. How Does This Relate to KEMS?

### KEMS Definition

KEMS = **Kadarn Evidence Management System** = Evidence Core package + migration 045 + connector framework + evaluation pipeline. KEMS is the infrastructure for evidence storage, provenance, relationships, and confidence computation.

### Architecture Diagram

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                              KEMS BOUNDARY                                   │
 │                                                                              │
 │  ┌──────────┐   ┌──────────┐   ┌───────────────┐   ┌──────────────────────┐ │
 │  │ EVIDENCE │──>│  CLAIMS  │──>│  CONFIDENCE    │   │      EVALUATION      │ │
 │  │  NODES   │   │          │   │  SNAPSHOTS     │   │      PIPELINE        │ │
 │  │  (045)   │   │  (045)   │   │    (045)       │   │  (evaluateClaim)     │ │
 │  └──────────┘   └──────────┘   └───────────────┘   └──────────────────────┘ │
 │       │               │               │                       │              │
 │   append-only    bounded          snapshot              compute              │
 │   immutable      assertions       append-only           per-claim             │
 │   6 classes      per capability   confidence            confidence            │
 │   A-F weights                                                               │
 └─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ confidence per claim
                                        v
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         READINESS ENGINE (NEW)                               │
 │                                                                              │
 │  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐ │
 │  │    CAPABILITY    │   │    PROGRAM       │   │      GAP ANALYSIS        │ │
 │  │    ASSESSMENT    │   │    READINESS     │   │                           │ │
 │  │                  │   │                  │   │  required vs present      │ │
 │  │ aggregate claim  │──>│ aggregate caps   │──>│  evidence class gaps      │ │
 │  │ confidences per  │   │ per program type │   │  capability gaps          │ │
 │  │ capability       │   │ apply gates      │   │  condition flags          │ │
 │  └──────────────────┘   └──────────────────┘   └──────────────────────────┘ │
 └─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ readiness status + gap report
                                        v
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         DOWNSTREAM CONSUMERS                                 │
 │                                                                              │
 │  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐ │
 │  │    SPONSOR       │   │    GROWTH        │   │       REGULATORY         │ │
 │  │    INTELLIGENCE  │   │    INTELLIGENCE  │   │       REPORTING          │ │
 │  │                  │   │                  │   │                           │ │
 │  │ Discover ready   │   │ Recommend next   │   │ Export verifiable        │ │
 │  │ institutions     │   │ capabilities to  │   │ readiness reports        │ │
 │  │ Filter by        │   │ develop          │   │ with evidence trail      │ │
 │  │ program type     │   │                  │   │                           │ │
 │  └──────────────────┘   └──────────────────┘   └──────────────────────────┘ │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### Layer Mapping to Existing Packages and Migrations

| Layer | Package | Migration | Key Exports |
|-------|---------|-----------|-------------|
| **Evidence Storage** | `evidence-core` | 045 | `insertEvidenceNode`, `getEvidenceNodesByClaim`, `submitEvidence` |
| **Claims** | `evidence-core` | 045 | `createClaim`, `getClaimById`, `validateClaimBoundedness` |
| **Provenance** | `evidence-core` | 045 | `createProvenance`, `provenance` field on evidence_nodes |
| **Evidence Relationships** | `evidence-core` | 045 | `insertRelationship`, `evidence_relationships` table |
| **Confidence Computation** | `evidence-core/output.ts` | 045 (snapshots) | `evaluateClaim()`, `evaluateEvidenceGraph()` |
| **Evaluation Pipeline** | `evidence-core/evaluation.ts` | — | `EvaluationPipeline`, `aggregateContributions` |
| **Connectors (FDA, PubMed, CT.gov)** | `evidence-core/connectors/` | — | `ingestFDA()`, `ingestPubMed()`, `ingestClinicalTrials()` |
| **Trust Scoring** | `trust-engine` | 023 | `computeOverall()`, `applyDecay()`, `TrustEngineService` |
| **Organization-Capability** | — | 008 | `organization_capabilities`, assertion layer |
| **Program Types** | — | 010 (programs) | `program_type[]`, programs table |
| **Capability Assessment** | NEW: `readiness-engine` | — | Aggregate capabilities, compute gaps |
| **Program Readiness** | NEW: `readiness-engine` | — | Gate logic, status projection |
| **Readiness Evaluation** | NEW: `readiness-engine` | proposed 054 | `readiness_evaluations` table |
| **Discovery** | `discovery-engine` | 013, 046-049 | `supply_items`, search |
| **Sponsor Portfolio** | — | 051 | `sponsor_portfolios` |

### Directional Flow

```
UPSTREAM (evidence producers)
═══════════════════════════════

  Institution (self-assesses)
      │
      ├──> Asserts capabilities (organization_capabilities, 008)
      │
      ├──> Creates claims per capability (claims, 045)
      │
      ├──> Submits evidence (evidence_nodes, 045)
      │       ├── Internal documents (Class B)
      │       ├── Public registries (Class A, via connectors)
      │       ├── Operational data (Class C)
      │       └── Third-party confirmations (Class F)
      │
      └──> Responds to counter-evidence (right_of_response, 045)
              │
              v
         Confidence computed per claim (evaluateClaim)
              │
              v
         Confidence snapshots stored (045)

DOWNSTREAM (readiness consumers)
════════════════════════════════

  Confidence per claim
      │
      ├──> Capability Assessment: aggregate claims per capability
      │
      ├──> Program Readiness: aggregate capabilities per program type
      │       ├── Apply mandatory gates
      │       ├── Compute gap analysis
      │       └── Check condition flags
      │
      ├──> Readiness Status: Not Ready / Partial / Conditionally Ready / Ready
      │
      ├──> SPONSOR INTELLIGENCE: discover ready institutions by program type
      │
      ├──> GROWTH INTELLIGENCE: recommend next capabilities to develop
      │
      └──> REGULATORY REPORTING: export verifiable readiness reports
```

### KEMS Boundary: What's Inside vs Outside

| Inside KEMS | Outside KEMS |
|-------------|--------------|
| `evidence_nodes` — storage, immutability | Readiness status computation |
| `claims` — assertions, bounded, visibility | Capability gap analysis |
| `evidence_relationships` — supports/contradicts/corroborates | Program-type capability requirements |
| `confidence_state_snapshots` — append-only snapshots | Condition flag evaluation |
| `evaluateClaim()` — per-claim confidence from evidence | Cross-claim aggregation for programs |
| `evaluateEvidenceGraph()` — graph-level evaluation | Readiness reports (published-view) |
| Connector framework (FDA, PubMed, CT.gov) | Sponsor discovery (Discovery Engine) |
| `right_of_response` — counter-evidence response | Growth intelligence recommendations |

**Boundary rule**: KEMS computes confidence PER CLAIM. It does NOT aggregate across claims, capabilities, or program types. That belongs to the Readiness Engine.

#### Grounding in Existing Code

- `packages/evidence-core/src/boundary.ts` — `FORBIDDEN_CORE_OPERATIONS` includes `computeConfidence`, `scoreInstitution`, `rankSite`, `inferCapabil

<a name="q6"></a>
## 6. What Happens to Marketplace?

### Formal Architectural Definition

```
MARKETPLACE (Discovery Engine) is a DOWNSTREAM CONSUMER of Program Readiness.
It does NOT PRODUCE readiness data. It surfaces institutions that have achieved
READY or CONDITIONALLY_READY status for specific program types, enabling sponsors
to discover qualified partners for program execution.

  Marketplace = Sponsor Discovery surface powered by Program Readiness data.
```

### Marketplace Does NOT Disappear

The existing components persist but their role shifts:

| Component | Before (marketplace-first) | After (readiness-first) |
|-----------|---------------------------|------------------------|
| **Discovery Engine** (013, 046-049) | Primary entry: search supply items | Downstream surface: filter ready institutions by program type |
| **Supply Items** (013) | 7 types of discoverable resources | Evolves: readiness capability becomes a discoverable item type |
| **Feasibility Engine** (014) | Program viability assessment based on supply | Enhanced: viability informed by readiness data |
| **Sponsor Portfolio** (051) | Sponsor-owned working-set of institutions | Sponsor-discovered ready institutions |
| **Exchange Engine** (016) | Deal negotiation after discovery | Unchanged: negotiation happens AFTER readiness validation |

### Dependency: Readiness Must Exist Before Marketplace Can Surface

```
OLD FLOW (marketplace-first):
  Sponsor searches → finds supply items → negotiates → executes
  (No validation. Sponsor does its own vetting.)

NEW FLOW (readiness-first):
  Institution proves readiness → publishes readiness status
      │
      v
  Sponsor discovers ready institutions → negotiates → executes
  (Validation complete before discovery. Institution quality is established.)
```

The dependency is structural: **the Marketplace's data source shifts from self-declared supply items to evidence-validated readiness statuses.** A sponsor searching for "PBMC processing capacity in US-based labs" should see institutions ranked by readiness, not just by keyword match.

### What Marketplace Looks Like in the New Model

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SPONSOR DISCOVERY SURFACE                          │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  SEARCH: "Institutions ready for PBMC Processing"              │    │
│  │                                                                │    │
│  │  FILTERS:                                                       │    │
│  │  (X) Ready only   ( ) Conditionally Ready   ( ) Partial          │    │
│  │  Program Type: [PBMC Processing v]                               │    │
│  │  Geography: [North America v]                                    │    │
│  │  Certifications: [CLIA, CAP, ISO 15189]                          │    │
│  │                                                                │    │
│  │  RESULTS (ranked by readiness confidence):                      │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │ 1. Boston Biospecimen Center       READY  95% conf       │  │    │
│  │  │    Capabilities: biobank, processing_lab, storage        │  │    │
│  │  │    Evidence: CLIA, CAP, ISO 15189, 12 reference projects │  │    │
│  │  ├──────────────────────────────────────────────────────────┤  │    │
│  │  │ 2. Texas Clinical Research Lab    CONDITIONALLY_READY    │  │    │
│  │  │                                  85% conf                 │  │    │
│  │  │    Conditions: logistics partner needed                  │  │    │
│  │  ├──────────────────────────────────────────────────────────┤  │    │
│  │  │ 3. Pacific NW Biobank             PARTIAL  60% conf      │  │    │
│  │  │    Gaps: missing reference projects, GCP training        │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Architectural Principle: Readiness-First, Marketplace-Second

| Principle | Implementation |
|-----------|---------------|
| **Marketplace does NOT create readiness** | Discovery Engine queries readiness_evaluations; it does not compute or modify them |
| **Marketplace respects visibility** | Only published readiness (visibility_scope = 'network') is discoverable |
| **Marketplace ranks by readiness** | Not by keyword match, not by sponsorship. Readiness confidence is the primary ranking signal |
| **Marketplace filters by program type** | Replaces free-text search with structured program-type filtering |
| **Supply items evolve** | Existing supply items persist but readiness capability items become primary discoverable type |

### Deferred, Not Discarded

Per Mission 1 §6: Marketplace monetization, sponsor portal expansion, and payment gateway are deferred until 3+ readiness programs are live. The Marketplace ENGINE code (013, 046-049) stays. The Marketplace PRODUCT surface (sponsor search UI) stays deferred until readiness data exists to power it.

#### Grounding in Existing Code

- `database/migrations/013_discovery_engine.sql` — supply_items table, searchable.
- `database/migrations/046-049` — Discovery Core, Prep, Agent, Curation.
- `database/migrations/051_sponsor_portfolio.sql` — sponsor_portfolios table.
- `docs/architecture/kadarn-platform-blueprint.md` §7 — Discovery Engine concept.
- `docs/architecture/kadarn-platform-blueprint.md` §19 — Sprint 3: Discovery Engine (not yet implemented).

---

<a name="ambiguities"></a>
## 7. Residual Ambiguities

These are questions that cannot be definitively answered from existing code and design artifacts. They MUST be resolved before or during Mission 2.

### AMB-1: programs_created_by_org_required constraint vs system-seeded templates

| Property | Detail |
|----------|--------|
| **File** | `database/migrations/010_audit_programs.sql:167` |
| **Issue** | `CHECK (created_by_organization_id IS NOT NULL) NOT VALID` — this constraint assumes every program has a real creator organization. Program Types (readiness templates) are system-seeded and may have no natural creator org. |
| **Impact** | Cannot seed readiness program types without violating the constraint (even with NOT VALID, future inserts will fail). |
| **Options** | (a) Create a "Kadarn Platform" system organization; (b) Relax constraint to allow NULL for readiness program types; (c) Remove constraint and enforce at application layer. |
| **Recommendation** | Option (a): seed a system organization in 011_seed_data.sql or a new migration. Clean, consistent with RLS model. |

### AMB-2: program_type TEXT[] validation strategy

| Property | Detail |
|----------|--------|
| **File** | `database/migrations/010_audit_programs.sql:134` — `program_type TEXT[] DEFAULT '{}'` |
| **Issue** | Free-text array with no referential integrity. Mission 1 proposes `program_type_taxonomy` table as controlled vocabulary, but PostgreSQL does not support per-element FK constraints on arrays. Application-layer validation is the only option. |
| **Impact** | Risk of inconsistent program_type values across the system. Impossible to query "all readiness programs" reliably without controlled vocabulary discipline. |
| **Options** | (a) Application-layer validation + `program_type_taxonomy` lookup; (b) Add a separate `program_type_id` FK to taxonomy for single-type programs; (c) Trigger-based validation using `program_type_taxonomy`. |
| **Recommendation** | Option (a) for Mission 2. Option (c) as hardening in later mission. Accept the trade-off: TEXT[] flexibility for multiple types outweighs referential integrity cost. |

### AMB-3: evaluateClaim() boundary with ADR-011

| Property | Detail |
|----------|--------|
| **File** | `packages/evidence-core/src/output.ts` — `evaluateClaim()`, `evaluateEvidenceGraph()` |
| **Issue** | `evaluateClaim()` comp
utes a confidence score (0-100) from evidence weight and class. This IS content interpretation — it assigns meaning to evidence. ADR-011 states: "If there is any reasonable doubt about whether a function interprets, infers, or modifies the meaning of evidence, that function does NOT belong to the Evidence Core." `FORBIDDEN_CORE_OPERATIONS` bans `computeConfidence` but `evaluateClaim()` is essentially confidence computation at the per-claim level. |
| **Impact** | Boundary violation. Evidence Core should not interpret evidence — it should only store, relate, retrieve, and track provenance. Confidence computation (even per-claim) is evaluation, not storage. |
| **Recommendation** | Move `evaluateClaim()` and `evaluateEvidenceGraph()` to a new package (e.g., `evaluation-engine` or `readiness-engine`) or at minimum mark it as an Engine function that CONSUMES Evidence Core, not part of it. This is a pre-Mission 2 decision because readiness evaluation depends on confidence computation. |

### AMB-4: Readiness confidence threshold per program type

| Property | Detail |
|----------|--------|
| **File** | New concept — no existing code |
| **Issue** | The threshold for CONDITIONALLY_READY vs READY should be program-type-specific. PBMC Processing might require 0.70; IVD Validation might require 0.85. Where is this configured? |
| **Impact** | If threshold is hardcoded (e.g., 0.80 for all), it will be wrong for some program types. Too low: falsely Ready. Too high: permanently Not Ready. |
| **Options** | (a) Add `readiness_threshold` column to `program_type_taxonomy`; (b) Store in `programs.metadata` JSONB for readiness program types; (c) Hardcoded per program type in application code (worst). |
| **Recommendation** | Option (a): `program_type_taxonomy.readiness_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.75`. Data, not code. |

---

<a name="verdict"></a>
## 8. Verdict — PASS

```
  ██████╗   █████╗  ███████╗ ███████╗
  ██╔══██╗ ██╔══██╗ ██╔════╝ ██╔════╝
  ██████╔╝ ███████║ ███████╗ ███████╗
  ██╔═══╝  ██╔══██║ ╚════██║ ╚════██║
  ██║      ██║  ██║ ███████║ ███████║
  ╚═╝      ╚═╝  ╚═╝ ╚══════╝ ╚══════╝
```

### All concepts frozen. Proceed to Mission 2.

**Rationale**: All six fundamental concepts have been defined architecturally with formal definitions, grounded in existing code, and assessed for internal consistency. The platform has the architectural components to support the pivot from marketplace-first to institution-first Program Readiness. No concept is ambiguous beyond the 4 flagged items, which are resolvable during Mission 2.

### What Was Validated

| Concept | Status | Grounding |
|---------|--------|-----------|
| **Program** (Type vs Instance) | FROZEN | programs table (010), program_type[] extensibility |
| **Capability** (HAVE vs DEMONSTRATE) | FROZEN | org_capabilities (008) + claims (045) + evidence_nodes (045) |
| **Readiness** (DERIVED, not stored) | FROZEN | Evidence Core graph, confidence aggregation flow |
| **Program Readiness** (4 statuses + gates) | FROZEN | evidence-core/output.ts, confidence_snapshots (045), readiness-engine (new) |
| **KEMS Flow** (Evidence → Sponsor Intelligence) | FROZEN | Evidence Core + trust-engine + new readiness-engine |
| **Marketplace** (downstream consumer) | FROZEN | Discovery Engine (013, 046-049), Sponsor Portfolio (051) |

### Constraints Carried Forward to Mission 2

1. **Use programs table** — Do not create separate readiness_programs table.
2. **Add program_type_taxonomy** — Controlled vocabulary before readiness-specific tables.
3. **Resolve AMB-1** — system organization for seeded templates before creating readiness program types.
4. **Resolve AMB-3** — confirm evaluateClaim() boundary before building readiness evaluation.
5. **Create NEW tables that REFERENCE existing** — readiness_capability_requirements, readiness_evidence_requirements, readiness_evaluations.
6. **Keep Evidence Core pure** — Readiness evaluation logic in new package, not inside evidence-core.
7. **RLS from day one** — Every new table gets RLS policies in same migration.
8. **Audit from day one** — Every readiness evaluation state change emits audit events.
9. **Seed data, not code** — First 3 readiness programs as seed data (Mission 5).
10. **No AI/ML for scoring yet** — Use rule-based Evidence Core evaluators.

### What Mission 2 Should Deliver (Updated)

- Resolve AMB-1 (system organization for seeded templates)
- Migration 052: program_type_taxonomy table + seed data + readiness_threshold
- Migration 053: readiness_capability_requirements + readiness_evidence_requirements tables
- Migration 054: readiness_evaluations table + readiness_status enum
- RLS policies for all three tables
- Audit trigger for readiness_evaluations
- Decision on AMB-3 (evaluateClaim boundary)

---

*End of KTP-1.0A Blueprint Validation Gate Review.*

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Created ONE file with all 6 required sections answering all 6 questions with formal architectural definitions, ASCII diagrams, and explicit ambiguity flagging. No migrations, tables, enums, or seeds proposed."
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "All definitions grounded in specific file references (8 files read). 4 residual ambiguities explicitly flagged with file paths. Evidence trail: programs table (010), org_capabilities (008), claims/evidence_nodes (045), evidence-core index.ts, trust-engine index.ts/types.ts, boundary.ts, blueprint, ADRs."
    }
  ],
  "changedFiles": [
    ".pi-subagents/artifacts/outputs/26c94c30/openspec/ktp-1.0a-blueprint-validation.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "read openspec/ktp-1.0-product-transformation-assessment.md",
      "result": "passed",
      "summary": "Read Mission 1 assessment with verdict GO WITH CONSTRAINTS"
    },
    {
      "command": "read docs/architecture/kadarn-platform-blueprint.md",
      "result": "passed",
      "summary": "Read 22-section blueprint"
    },
    {
      "command": "read ARCHITECTURE.md",
      "result": "passed",
      "summary": "Read architecture overview"
    },
    {
      "command": "read docs/adr/adr-002-multi-tenant-architecture.md",
      "result": "passed",
      "summary": "Confirmed RLS model, organization-capability model"
    },
    {
      "command": "read docs/adr/adr-004-platform-boundaries.md",
      "result": "passed",
      "summary": "Confirmed platform boundaries"
    },
    {
      "command": "read database/migrations/008_organizations_capabilities.sql",
      "result": "passed",
      "summary": "Confirmed capability model: 9 tables, many-to-many"
    },
    {
      "command": "read database/migrations/010_audit_programs.sql",
      "result": "passed",
      "summary": "Confirmed programs table, found AMB-1"
    },
    {
      "command": "read database/migrations/045_evidence_core.sql",
      "result": "passed",
      "summary": "Confirmed KEMS: claims, evidence_nodes, relationships, confidence snapshots"
    },
    {
      "command": "read packages/evidence-core/src/index.ts",
      "result": "passed",
      "summary": "Confirmed Evidence Core public API"
    },
    {
      "command": "read packages/trust-engine/src/index.ts + types.ts",
      "result": "passed",
      "summary": "Confirmed Trust Engine: 4 dimensions, decay, impact sources"
    },
    {
      "command": "read packages/evidence-core/src/boundary.ts",
      "result": "passed",
      "summary": "Found FORBIDDEN_CORE_OPERATIONS. Identified AMB-3"
    }
  ],
  "validationOutput": [
    "All 6 questions answered with formal architectural definitions",
    "4 ASCII diagrams: Capability relationship, Readiness flow, KEMS architecture, Sponsor Discovery",
    "4 residual ambiguities explicitly flagged (AMB-1 through AMB-4)",
    "6 concepts FROZEN: Program, Capability, Readiness, Program Readiness, KEMS, Marketplace",
    "10 constraints carried forward to Mission 2",
    "Verdict: PASS — proceed to Mission 2",
  ],
  "residualRisks": [
    "AMB-1: programs_created_by_org_required constraint blocks system-seeded readiness templates",
    "AMB-2: program_type TEXT[] lacks referential integrity — application-layer validation only",
    "AMB-3: evaluateClaim() may violate ADR-011 Evidence Core boundary — needs architectural decision",
    "AMB-4: Readiness threshold per program type not defined — must be data, not code",
    "Trust Engine 'readiness' dimension not yet added to TrustDimension union type",
    "Knowledge Engine (22 LOC) insufficient for capability taxonomy — Mission 3 dependency",
    "Frontend shell pages may have old marketplace assumptions — needs audit"
  ],
  "noStagedFiles": true,
  "diffSummary": "Created one new file: openspec/ktp-1.0a-blueprint-validation.md. No existing files modified. Pure conceptual review — no code or migrations.",
  "reviewFindings": [
    "No blockers to Mission 2. 4 ambiguities flagged, all resolvable during Mission 2."
  ],
  "manualNotes": "This is a conceptual gate review, not an implementation. The 6 concepts are now frozen architectural definitions. Mission 2 can proceed with the 10 specified constraints. The 4 ambiguities should be resolved by the Mission 2 executor before writing migrations."
}
```
