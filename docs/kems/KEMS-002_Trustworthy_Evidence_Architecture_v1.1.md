# KEMS-002 — Trustworthy Evidence Architecture
## Risk Model & Mitigation Framework

**Version:** 1.1  
**Status:** Draft for Ratification  
**Classification:** Architecture Model  
**Date:** 2026-07-03  
**Supersedes:** KEMS-002 v1.0  

**Depends on:**
- Manifesto v1.2
- KRM-RAO v2.0
- KEMS-001 Confidence Graph
- ADR-011 Evidence Core Boundary
- Claim Taxonomy v1.0

---

## 1. Purpose

This document defines the canonical architectural risk model for Kadarn.

Its purpose is not operational risk management.

Its purpose is to ensure that the Evidence Infrastructure remains trustworthy as the platform scales from dozens to hundreds of thousands of institutions.

The document establishes:
- Architectural threats
- Architectural decisions
- Engineering strategies
- Implementation requirements
- Validation criteria
- Governance rules
- Future roadmap implications

The document is normative. Future architectural decisions shall not violate the principles defined herein without a new ADR.

---

## 2. Non-Goals (Scope Boundaries)

This document explicitly does NOT define:
- Confidence algorithm implementation details (covered by KEMS-001)
- UX/UI design specifications
- Pricing or business model
- Legal contracts or terms of service
- Claim Taxonomy structure (covered by separate ADR)
- Database schema design
- API endpoint specifications
- Marketing or go-to-market strategy
- Operational procedures for human reviewers
- Third-party integration contracts

This document focuses exclusively on architectural risk mitigation and evidence trustworthiness.

---

## 3. Design Principles (Constitution)

The following principles constitute the constitutional foundation of Kadarn's evidence architecture. All architectural decisions must comply with these principles.

**Principle 1: Evidence precedes intelligence.**
Never compute confidence without underlying evidence. Intelligence is emergent from evidence, not imposed upon it.

**Principle 2: Identity precedes evidence.**
Evidence cannot be attached to an entity until identity is resolved. Identity resolution is a prerequisite for evidence ingestion.

**Principle 3: Never infer identity.**
Identity must be established through explicit resolution, not algorithmic assumption. When confidence is below threshold, escalate to human review.

**Principle 4: Prefer evidence over declarations.**
Independent, verifiable evidence (publications, trials, certifications) always outweighs self-reported claims. Manual evidence starts with minimal confidence.

**Principle 5: Preserve provenance.**
Every piece of evidence must maintain complete traceability to its source, transformation history, and validation chain. Provenance is immutable.

**Principle 6: Confidence is explainable.**
Every confidence score must be decomposable into its constituent evidence, weights, and inference path. Black-box confidence is prohibited.

**Principle 7: Trust is emergent, never computed.**
Trust is not a single score. Trust emerges from the accumulation of verified evidence, temporal consistency, and cross-source corroboration.

**Principle 8: Identity is versioned.**
Institutional and investigator identities evolve over time. Historical affiliations must be preserved separately from current state.

**Principle 9: Evidence is append-only.**
Evidence cannot be deleted or destructively updated. Corrections are handled through versioning, dispute mechanisms, and archival.

**Principle 10: Temporal consistency first.**
Evidence must be evaluated in temporal context. Recent evidence outweighs historical evidence. Capability drift must be detected and flagged.

**Principle 11: Human overrides are auditable.**
When human reviewers override algorithmic decisions, the override must be logged with justification, timestamp, and reviewer identity.

**Principle 12: Evidence Firewall validates, never interprets.**
The Firewall assesses structural integrity, provenance, and consistency. It does not compute confidence or interpret semantic meaning.

**Principle 13: Failure is expected, recovery is mandatory.**
Every component must have defined failure modes and recovery strategies. Graceful degradation is preferred over system failure.

**Principle 14: Multi-tenant isolation is non-negotiable.**
Evidence from one sponsor or institution must never leak to another without explicit authorization. Tenant boundaries are absolute.

---

## 4. Architectural Model

### 4.1 Component Hierarchy

```
Applications Layer
├─ Sponsor UX
├─ Site UX
├─ API Gateway
└─ Admin Console

Intelligence Layer
├─ Confidence Engine
├─ Explainability Service
└─ Recommendation Engine

Evidence Layer
├─ Confidence Graph
├─ Evidence Core
└─ Private Evidence Layer

Protection Layer
├─ Evidence Firewall
└─ Identity Resolution Engine

Ingestion Layer
├─ Connector Layer
└─ Discovery Connectors

External Sources
├─ ClinicalTrials.gov
├─ PubMed
├─ CrossRef
├─ OpenAlex
├─ FDA
├─ ORCID
├─ ROR
└─ Private Uploads
```

### 4.2 Object Flow Model

The system processes five primary object types through the pipeline:

**Object 1: RawSource**
```
{ source_type: "pubmed" | "clinicaltrials" | "upload" | ...,
  source_id: string,
  raw_content: blob,
  ingestion_timestamp: datetime,
  connector_version: string }
```

**Object 2: DiscoveredEntity**
```
{ entity_type: "institution" | "investigator",
  raw_identifiers: string[],
  extracted_metadata: object,
  discovery_timestamp: datetime,
  confidence: float (0.0 - 1.0) }
```

**Object 3: ResolvedIdentity**
```
{ canonical_id: uuid,
  entity_type: "institution" | "investigator",
  resolved_identifiers: Identifier[],
  aliases: string[],
  timeline: TimelineEntry[],
  identity_confidence: float,
  resolution_timestamp: datetime }
```

**Object 4: EvidenceItem**
```
{ evidence_id: uuid,
  identity_id: uuid,
  evidence_type: "publication" | "trial" | "certification" | "claim" | ...,
  source: SourceReference,
  content: EvidenceContent,
  provenance: ProvenanceChain,
  state: EvidenceState,
  validation_results: ValidationResult[],
  ingestion_timestamp: datetime,
  last_validated: datetime }
```

**Object 5: ConfidenceNode**
```
{ identity_id: uuid,
  capability: Claim,
  confidence_score: float,
  supporting_evidence: uuid[],
  counter_evidence: uuid[],
  inference_path: InferenceStep[],
  temporal_weight: float,
  last_computed: datetime }
```

### 4.3 Pipeline Flow

```
RawSource
    ↓ (Connector Layer)
DiscoveredEntity
    ↓ (Identity Resolution Engine)
ResolvedIdentity
    ↓ (Evidence Firewall)
EvidenceItem [State: Discovered]
    ↓ (Validation)
EvidenceItem [State: Validated]
    ↓ (Corroboration)
EvidenceItem [State: Corroborated]
    ↓ (Ingestion)
Evidence Core
    ↓ (Confidence Engine)
ConfidenceNode
    ↓ (Applications)
User Query Response
```

---

## 5. Evidence Lifecycle & State Model

### 5.1 Evidence States

Every EvidenceItem exists in one of the following states:

- **Discovered**: Evidence ingested, identity resolved, Firewall validation pending
- **Pending**: Passed initial validation, awaiting corroboration
- **Validated**: Passed Firewall, provenance verified, ready for confidence computation
- **Corroborated**: Validated by multiple independent sources, high confidence weight
- **Disputed**: Challenged by institution or third party, confidence reduced pending resolution
- **Archived**: Invalid or obsolete, removed from active computation, preserved immutably

### 5.2 State Transitions

```
Discovered → Pending → Validated → Corroborated
    ↓           ↓          ↓           ↓
 [reject]   [quarantine] [dispute]  [archive]
    ↓           ↓          ↓           ↓
 Archived    Pending    Disputed    Archived
                          ↓
                      [resolved]
                          ↓
                      Validated
```

### 5.3 State Transition Rules

1. Evidence cannot transition from Archived to any other state. Archival is permanent.
2. Disputed evidence can transition to Validated if dispute is resolved in favor of evidence.
3. Evidence in Pending state for >30 days without corroboration automatically transitions to Disputed.
4. All state transitions must be logged with timestamp, actor (system/human), and justification.

---

## 6. Evidence Firewall Specification

### 6.1 Purpose

The Evidence Firewall is a mandatory protection layer that validates evidence before it enters the Evidence Core. Its purpose is to prevent corrupted, fraudulent, or malformed evidence from polluting the trustworthiness of the entire system.

The Firewall operates as a gatekeeper, not an interpreter.

### 6.2 Responsibilities

1. **Identity Validation** — Verify evidence is attached to a resolved identity. Reject ambiguous identity.
2. **Provenance Verification** — Validate complete provenance chain and source authenticity.
3. **Structural Integrity** — Validate format, schema compliance, required fields.
4. **Temporal Consistency** — Validate logical timestamp sequences, detect impossible patterns.
5. **Cross-Source Corroboration** — Compare against existing Evidence Core for contradictions.
6. **Anomaly Detection** — Identify statistical outliers and unusual evidence patterns.
7. **Fraud Detection** — Detect evidence fabrication, duplicates, suspicious metadata.
8. **Quarantine Management** — Isolate failed evidence, maintain review queue, enforce expiration.

### 6.3 Inputs / Outputs / Interfaces

- **Inputs**: EvidenceItem (Discovered), Existing Evidence Core, Validation Rules
- **Outputs**: ValidationResult, State Transition Command, Audit Log
- **Interfaces**: Evidence Ingestion API, Evidence Core Query API, Human Review Queue API, Monitoring & Alerting API

### 6.4 Failure Modes

| Mode | Impact | Recovery | Degradation |
|------|--------|----------|-------------|
| Firewall Unavailable | Ingestion blocked | Queue in Connector Layer, retry | Delayed ingestion |
| Evidence Core Unavailable | Corroboration fails | Skip corroboration, mark Pending | Reduced confidence weight |
| Rules Corrupted | False positives/negatives | Rollback to previous version | Last known good rules |
| Anomaly Model Failure | Detection disabled | Rely on structural validation | Reduced fraud detection |
| Queue Overflow | Reviewers overloaded | Auto-approve low-risk, escalate high | Reduced strictness |

### 6.5 Boundary Enforcement

**What Evidence Firewall DOES:**
- Validate identity resolution
- Verify provenance completeness
- Check structural integrity
- Validate temporal consistency
- Perform cross-source corroboration
- Detect anomalies and fraud
- Manage quarantine queue
- Maintain audit trail

**What Evidence Firewall DOES NOT:**
- Compute confidence scores
- Modify evidence content
- Delete evidence (only archives)
- Interpret semantic meaning
- Make business logic decisions
- Override human review decisions
- Bypass Identity Resolution
- Write directly to Evidence Core

---

## 7. Risk Model

Each risk is structured as: Risk → Architectural Decision → Engineering Strategy → Implementation → Validation.

### DOMAIN I: Identity Risks

**Risk I-01: Fragmented Institutional Identity** (Impact: Very High, Probability: High)
- Decision: Identity Resolution Engine as mandatory pre-Firewall layer
- Strategy: Canonical identity graph (ROR, GRID, NPI), alias tracking, fuzzy matching, human confirmation <90%
- Validation: 1,000 institutions, >95% accuracy, <5% human review

**Risk I-02: Investigator Identity Drift** (Impact: High, Probability: High)
- Decision: Separate Historical Capability from Operational Readiness, investigator timeline
- Strategy: ORCID/Scopus/PubMed affiliation tracking, time-bound evidence attachment
- Validation: Affiliation change simulation, historical evidence preservation

### DOMAIN II: Evidence Integrity

**Risk E-01: Historical Capability Drift** (Impact: Very High, Probability: High)
- Decision: Never mix Historical with Operational. Temporal decay factor.
- Strategy: Separate data models, 3x weight for <12 month evidence, automated drift triggers

**Risk E-02: Evidence Poisoning** (Impact: Critical, Probability: Medium)
- Decision: Evidence Firewall as mandatory layer. 8 validation responsibilities.
- Strategy: Cross-source corroboration, anomaly/fraud detection, quarantine workflow
- Validation: 100 false items injected, >90% detection, <5% false positives

**Risk E-03: Gaming** (Impact: High, Probability: Medium)
- Decision: Manual evidence = minimal confidence. Independent evidence dominates.
- Strategy: Confidence cap, 30% visibility penalty for fraud, random audit sampling

**Risk E-04: Dark Data** (Impact: Medium, Probability: High)
- Decision: Private Evidence Layer. 3-phase: encrypted metadata → crypto signatures → ZKP
- Strategy: Blind validation, generic badges ("3 validated Phase II projects under NDA")

### DOMAIN III: Privacy & Compliance

**Risk P-01: Unauthorized Data Exposure** (Impact: Critical, Probability: Medium)
- Decision: Two-layer consent model. Kadarn attributes data to sources, never claims ownership.
- Strategy: Public/Private separation, Institution Authorization, Policy Engine enforcement

**Risk P-02: Regulatory Evolution** (Impact: High, Probability: High)
- Decision: Governance Versioning with compliance snapshots per regulation version
- Strategy: Versioned policies, automated checks, regulation change alerts

### DOMAIN IV: Platform Risks

**Risk T-01: External API Dependency** (Impact: High, Probability: High)
- Decision: Connector Layer with independent adapters, version abstraction
- Strategy: Health monitoring, automatic failover to cache, graceful degradation

**Risk T-02: Ontology Drift** (Impact: Medium, Probability: High)
- Decision: Versioned Claim Taxonomy with migration workflows
- Strategy: Semantic compatibility checks, deprecated term registry

**Risk T-03: Explainability Failure** (Impact: High, Probability: Medium)
- Decision: Explainability as native capability. Every score decomposable.
- Strategy: Evidence Nodes, Weights, Inference Path, Counter Evidence in <2 seconds

### DOMAIN V: Adoption Risks

**Risk A-01: Sponsor Cold Start** (Impact: High, Probability: High)
- Decision: Design Partners program with sandbox validation
- Strategy: 5 sponsors, 3 CROs, 10 SMOs, 15 Site Directors; historical protocol replay

**Risk A-02: Industry Resistance** (Impact: High, Probability: Medium)
- Decision: Position as "Evidence Infrastructure", not "CRO replacement"
- Strategy: ICH-GCP TMF export, stakeholder-specific value propositions

**Risk A-03: Site Operational Friction** (Impact: Medium, Probability: High)
- Decision: 15-minute onboarding maximum, AI-first discovery
- Strategy: Automated discovery, async communication, mobile-first

### DOMAIN VI: Governance Risks

**Risk G-01: Evidence Governance Failure** (Impact: Critical, Probability: Low)
- Decision: Immutable evidence, Right of Response, complete audit trail
- Strategy: Append-only storage, provenance tracking, dispute workflow

**Risk G-02: Semantic Drift** (Impact: Medium, Probability: Medium)
- Decision: Lexicon Governance. Terminology changes require ADR.
- Strategy: Change request workflow, retired term registry, architecture review board

---

## 8. Failure Scenarios & Recovery

| Scenario | Trigger | Recovery | Validation |
|----------|---------|----------|------------|
| External API Outage | CT.gov unavailable >1hr | Cache failover, queue, alert | No data loss |
| Evidence Poisoning | 100 false items | Quarantine, human review, source penalty | >90% detection |
| Identity Resolution Failure | Confidence <90% | Quarantine, manual review | Queue depth monitoring |
| Evidence Core Corruption | DB corruption | Read replica failover, backup restore | Failover time |
| Sponsor Reports Error | Confidence score dispute | Explainability trace, human analysis, correction | Resolution time |

---

## 9. Distributed Architecture Considerations

- **Federated Evidence**: Logically centralized, physically sharded by identity_id. 10-shard validation.
- **Tenant Isolation**: tenant_id on all records, RLS enforcement, cross-tenant access logged.
- **Multi-Sponsor Visibility**: Public evidence visible to all. Private requires authorization.
- **Cross-Network Evidence**: Explicit consent from evidence owner required for sharing.
- **Evidence Portability**: Institutions own evidence, can export (JSON, CSV, PDF) with full provenance.

---

## 10. Integration with KEMS-001

KEMS-002 extends KEMS-001 by introducing mandatory infrastructure before evidence enters the Evidence Core.

**KEMS-001 defines:** Confidence Graph structure, computation algorithms, Evidence Core data model.

**KEMS-002 adds:** Identity Resolution Engine, Evidence Firewall, lifecycle states, failure scenarios, distributed architecture.

**Integration points:** Firewall → Evidence Core → Confidence Engine → Explainability Service.

---

## 11. Required Future ADRs

- ADR-013 — Identity Resolution Engine
- ADR-014 — Evidence Firewall
- ADR-015 — Private Evidence Architecture
- ADR-016 — Connector Layer Architecture
- ADR-017 — Governance Versioning
- ADR-018 — Explainability Requirements
- ADR-019 — Evidence Poisoning Detection
- ADR-020 — Evidence Lifecycle State Machine
- ADR-021 — Distributed Evidence Core Sharding
- ADR-022 — Multi-Tenant Isolation Strategy

---

## 12. Roadmap Integration

| Sprint | Deliverables |
|--------|-------------|
| Sprint 21 | Identity Resolution, Evidence Firewall MVP, Lifecycle State Machine, Historical/Operational separation, Gaming detection, Consent management, Design Partners, Simplified onboarding, Immutable storage |
| Sprint 22 | Connector Layer, Explainability API, Ontology versioning, TMF export |
| Sprint 23 | Private Evidence Layer, Governance Versioning, Lexicon governance |
| Sprint 24 | Advanced Poisoning Detection, Advanced Identity Graph, Distributed validation |

---

## 13. Ratification

This document requires ratification by the architecture owner before implementation.

Once ratified, all subsequent architectural decisions must comply with the principles and mitigations defined herein.

**Status:** Draft for Ratification  
**Version:** 1.1  
**Next Step:** Review and approve for Sprint 21 planning

---

*Cambios desde v1.0: Risk → Decision → Strategy → Implementation → Validation, Non-Goals, Evidence Firewall completo, Identity Resolution, Object flow model, Evidence states, Failure scenarios, 14 Design Principles, Distributed architecture, Firewall boundaries.*
