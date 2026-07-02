# Agent Responsibility Matrix — Evidence Discovery

**KEMS-002 artifact**  
**Version:** 0.1  
**Date:** 2026-07-01  
**Depends on:** KEMS-002 §7 (Pipeline Architecture), KEMS-002A (State Machine)  

---

## Rule

> **Agents obey architecture. Agents do not define architecture.**

Every agent listed below operates within the state machine defined by KEMS-002A. No agent may execute a transition that is not explicitly listed. No agent may bypass Curation. No agent may promote evidence.

---

## 1. Document Classifier Agent

| Field | Value |
|-------|-------|
| **ID** | `agent.document-classifier` |
| **Executes transitions** | `DISCOVERED → CLASSIFIED` |
| **Input** | Layer 1 Markdown + metadata (file name, source, size) |
| **Output** | Document type classification (SOP, Calibration, Training, Study Close-out, Shipment Log, Protocol, FDA Letter, etc.) + confidence score |
| **Model** | Any classification-capable LLM (Sonnet recommended) |
| **Temperature** | 0.0 (deterministic classification preferred) |
| **Can do** | Classify document type, assign initial confidence, extract document date |
| **Cannot do** | Extract entities, propose Claims, evaluate evidence quality, override human reclassification |
| **Human oversight** | Reclassification via Curation action |
| **Failure state** | `CLASSIFICATION_FAILED` |

---

## 2. Entity Extractor Agent

| Field | Value |
|-------|-------|
| **ID** | `agent.entity-extractor` |
| **Executes transitions** | `CLASSIFIED → ENTITY_EXTRACTED` |
| **Input** | Layer 1 Markdown + document classification |
| **Output** | Structured entities: investigators, institution names, study IDs, equipment, temperatures, drugs, sponsors, CROs, dates |
| **Model** | Any extraction-capable LLM |
| **Temperature** | 0.0 (extraction must be reproducible) |
| **Can do** | Extract named entities, normalize date formats, link entities to document |
| **Cannot do** | Propose Claims, assess institutional capability, infer relationships outside explicit document content |
| **Human oversight** | Correction via Enrich action |
| **Failure state** | `ENTITY_EXTRACTION_FAILED` |

---

## 3. Relationship Extractor Agent

| Field | Value |
|-------|-------|
| **ID** | `agent.relationship-extractor` |
| **Executes transitions** | `ENTITY_EXTRACTED → CLAIMS_PROPOSED` (feeds into Claim detection) |
| **Input** | Entities extracted + Layer 1 Markdown |
| **Output** | Relationships: "Investigator X led Study Y", "Equipment Z used for Assay W", "Site A participated in Protocol B" |
| **Model** | Any relationship-capable LLM |
| **Temperature** | 0.2 (some inference required for implicit relationships) |
| **Can do** | Link entities based on document evidence, assign relationship confidence |
| **Cannot do** | Propose Claims directly (feeds into Claim Candidate Detector), assert capability, evaluate institutional performance |
| **Human oversight** | Relationship correction via Enrich action |
| **Failure state** | `ENTITY_EXTRACTION_FAILED` (shares state with Entity Extractor) |

---

## 4. Claim Candidate Detector Agent

| Field | Value |
|-------|-------|
| **ID** | `agent.claim-detector` |
| **Executes transitions** | `ENTITY_EXTRACTED → CLAIMS_PROPOSED` |
| **Input** | Entities + relationships + Layer 1 Markdown + Claim Taxonomy (P0-007) |
| **Output** | Claim Candidates: proposed claimTypeId + supporting evidence excerpt + discovery confidence |
| **Model** | Any capable LLM |
| **Temperature** | 0.3 (some judgment required to match document evidence to Claim Taxonomy) |
| **Can do** | Propose Claim Candidates from explicit document evidence, reference evidence excerpts |
| **Cannot do** | Create canonical Claims, assert institutional capability as truth, assign Evidence Class, promote candidates |
| **Human oversight** | Required — Curation action must accept/reject/enrich before promotion |
| **Failure state** | `CLAIM_DETECTION_FAILED` |

---

## 5. Timeline Reconstructor Agent

| Field | Value |
|-------|-------|
| **ID** | `agent.timeline-reconstructor` |
| **Executes transitions** | `ENTITY_EXTRACTED → CLAIMS_PROPOSED` (parallel) |
| **Input** | Entities + relationships + document dates + Layer 1 Markdown |
| **Output** | Chronological timeline: events with dates, descriptions, source references |
| **Model** | Any capable LLM |
| **Temperature** | 0.2 |
| **Can do** | Order events chronologically, detect date gaps, identify temporal inconsistencies |
| **Cannot do** | Fabricate missing dates, assert capability from timeline alone, promote timeline events as evidence |
| **Human oversight** | Timeline correction via Enrich action |
| **Failure state** | `TIMELINE_RECONSTRUCTION_FAILED` |

---

## 6. Gap Detector Agent

| Field | Value |
|-------|-------|
| **ID** | `agent.gap-detector` |
| **Executes transitions** | `CLAIMS_PROPOSED → CURATION` (adds gap findings as metadata) |
| **Input** | Claim Candidates + timeline + entities + Claim Taxonomy |
| **Output** | Gap findings: missing Claims, insufficient evidence periods, document type gaps |
| **Model** | Any capable LLM |
| **Temperature** | 0.3 |
| **Can do** | Identify gaps in coverage, suggest missing document types, estimate evidence coverage percentage |
| **Cannot do** | Demote existing Candidates, block promotion of valid Candidates, assert institutional failure |
| **Human oversight** | Gaps are informational — human decides whether to fill them |
| **Failure state** | Non-fatal — gaps are best-effort |

---

## 7. Evidence Leverage Recommender Agent

| Field | Value |
|-------|-------|
| **ID** | `agent.leverage-recommender` |
| **Executes transitions** | `CLAIMS_PROPOSED → CURATION` (adds recommendation as metadata) |
| **Input** | Claim Candidates + gap findings + current coverage |
| **Output** | One prioritized recommendation: "If the user does one thing today, upload a temperature monitoring log to raise confidence in Cold Chain Shipping" |
| **Model** | Any capable LLM |
| **Temperature** | 0.5 (some creativity in recommendation framing) |
| **Can do** | Recommend highest-leverage next action, explain recommendation in plain language, reference specific Claim |
| **Cannot do** | Lock the user into a single path, hide alternative actions, assert that a recommendation is mandatory |
| **Human oversight** | Recommendation is advisory — human decides next action |
| **Failure state** | Non-fatal — recommendations are best-effort |

---

## 8. Discovery Coordinator Agent (Orchestrator)

| Field | Value |
|-------|-------|
| **ID** | `agent.discovery-coordinator` |
| **Executes transitions** | Orchestrates the full pipeline: `RAW_SOURCE → DISCOVERED → CLASSIFIED → ENTITY_EXTRACTED → CLAIMS_PROPOSED → CURATION` |
| **Input** | Raw source + configuration |
| **Output** | Completed pipeline execution: Evidence Candidates + Claim Candidates + Timeline + Gaps + Recommendation |
| **Model** | Orchestration logic (not AI-dependent — state machine driven) |
| **Can do** | Route artifacts through pipeline stages, manage retry, collect results, generate Candidate IDs, persist provenance |
| **Cannot do** | Classify documents, extract entities, propose Claims, promote evidence, override agent outputs |
| **Human oversight** | Pipeline execution is automated; results always go through Curation |

---

## 9. Evidence Promotion Agent (Core-side)

| Field | Value |
|-------|-------|
| **ID** | `agent.promotion-agent` |
| **Executes transitions** | `READY_FOR_PROMOTION → PROMOTED` |
| **Input** | Evidence Candidate + provenance chain + curation decision |
| **Output** | Canonical Evidence Node in Evidence Core |
| **Model** | Deterministic (no AI required — pure data transformation) |
| **Can do** | Validate promotion criteria (KEMS-002 §11), assign Evidence Class, create EvidenceNode, link to SiteIdentity, record provenance |
| **Cannot do** | Reject a curated candidate, modify evidence content, assert institutional truth, compute Confidence |
| **Human oversight** | Promotion is deterministic — all judgment happens in Curation |

---

## Summary table

| Agent | Transition | AI required? | Human oversight | Failure mode |
|-------|-----------|-------------|-----------------|-------------|
| Document Classifier | DISCOVERED → CLASSIFIED | ✅ | Reclassification | CLASSIFICATION_FAILED |
| Entity Extractor | CLASSIFIED → ENTITY_EXTRACTED | ✅ | Correction via Enrich | ENTITY_EXTRACTION_FAILED |
| Relationship Extractor | ENTITY_EXTRACTED (feeds) | ✅ | Correction via Enrich | ENTITY_EXTRACTION_FAILED |
| Claim Detector | ENTITY_EXTRACTED → CLAIMS_PROPOSED | ✅ | Required (Curation) | CLAIM_DETECTION_FAILED |
| Timeline Reconstructor | ENTITY_EXTRACTED (parallel) | ✅ | Correction via Enrich | TIMELINE_RECONSTRUCTION_FAILED |
| Gap Detector | CLAIMS_PROPOSED → CURATION (metadata) | ✅ | Informational | Non-fatal |
| Leverage Recommender | CLAIMS_PROPOSED → CURATION (metadata) | ✅ | Advisory | Non-fatal |
| Discovery Coordinator | Full pipeline orchestration | ❌ | Automated | Pipeline error |
| Promotion Agent | READY_FOR_PROMOTION → PROMOTED | ❌ | Deterministic | Validation error |

---

## Boundary rules (all agents)

| Rule | Applies to |
|------|------------|
| Never promote evidence | All AI agents |
| Never certify claims | All AI agents |
| Never create institutional truth | All AI agents |
| Never override human curation | All AI agents |
| Never modify canonical EvidenceNodes | All agents |
| Never skip a state | Discovery Coordinator |
| Never bypass Curation | All AI agents |
| Never bypass Promotion | Promotion Agent |
| Never fabricate evidence | All AI agents |

---

## Versioning

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-07-01 | Initial agent matrix aligned with KEMS-002 and KEMS-002A |
