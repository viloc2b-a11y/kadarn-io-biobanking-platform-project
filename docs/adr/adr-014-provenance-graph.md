# ADR-014: Provenance Graph — Cross-Entity Lineage

**Status:** Accepted  
**Date:** 2026-06-26  
**Deciders:** Kadarn Architecture  

---

## Context

Kadarn has an audit trail — who did what, when. But audit trails answer
accountability questions, not lineage questions. The KRM-RAO reference
model (§2.6, §4.2) defines **Provenance** as the complete, verifiable
history of an entity, distinct from audit.

Provenance answers:
- "What is the complete chain from this dataset back to the donor consent?"
- "Which processing steps produced this QC failure?"
- "What evidence supports this shipment's chain of custody?"

Without provenance, regulatory submissions and publications rest on
unverifiable claims.

---

## Decision: Build a Provenance Graph as a DAG of Nodes and Edges

### 1. Data Model

**Nodes** represent entities (specimens, aliquots, consents, shipments,
datasets, documents) or events (processing steps, QC results, temperature
readings). Each node has:
- `id` (UUID), `node_type`, `external_id`, `label`, `properties` (JSONB)

**Edges** represent directed, causal relationships between nodes:

| Edge Type | Meaning | Example |
|-----------|---------|---------|
| `derived_from` | Entity B was derived from entity A | Aliquot derived from specimen |
| `authorized_by` | Action was authorized by a consent/IRB | Collection authorized by consent |
| `processed_by` | Entity was processed by a process/event | Specimen processed by processing step |
| `shipped_with` | Entity was shipped in a shipment | Specimen shipped in shipment XYZ |
| `verified_by` | Claim is verified by evidence | QC result verified by QC report |
| `linked_to` | Entity is semantically linked to another | Dataset linked to specimen |
| `generated_from` | Entity was generated from a process | Dataset generated from assay |

**Evidence** links nodes to verifiable artifacts (documents, hashes,
external references).

### 2. Query Service

The Provenance Graph exposes:

- `traceForward(nodeId)` — all descendants from this node
- `traceBackward(nodeId)` — all ancestors to this node
- `fullLineage(nodeId)` — complete subgraph of ancestors + descendants
- `evidenceFor(nodeId)` — all evidence linked to this node
- `lineageAt(nodeId, timestamp)` — lineage as it existed at time T

### 3. Backfill Strategy

Existing data from processing, logistics, and regulatory tables is
backfilled into the provenance graph through a one-time migration
script. After backfill, all new events feed into the graph in real time.

---

## Consequences

### Positive

- Complete, traceable lineage for every entity
- Supports regulatory audit and publication reproducibility
- Evidence linked to every provenance claim

### Negative

- Graph storage adds write overhead
- Backfill requires careful mapping from relational tables

### Neutral

- Provenance graph complements, does not replace, the audit trail
- Both are needed — they answer different questions
