# Kadarn Provenance Graph

**Version:** 1.0  
**Status:** Accepted  
**Canonical:** `docs/domain/provenance-graph.md`

---

## 1. Purpose

The Provenance Graph is Kadarn's cross-entity lineage system. It tracks
the complete, verifiable history of every Research Asset — from donor
consent through collection, processing, shipment, and data publication.

Unlike the **audit trail** (who did what, when), provenance answers:
"How did this entity come to be, and can the chain be trusted?"

---

## 2. Data Model

### 2.1 Nodes

Nodes represent entities or events in the provenance chain.

| Node Type | Description |
|-----------|-------------|
| `specimen` | A biospecimen or aliquot |
| `aliquot` | A derived portion of a specimen |
| `consent` | A donor consent record |
| `protocol` | A collection or processing protocol |
| `processing_event` | A processing step (centrifugation, aliquoting, etc.) |
| `qc_result` | A quality control result |
| `shipment` | A physical shipment |
| `temperature_log` | A temperature reading or excursion |
| `receipt` | A shipment receipt confirmation |
| `dataset` | A research dataset derived from specimens |
| `document` | An evidence document (MTA, IRB, certification) |
| `organization` | A participating organization |
| `program` | A research program |
| `access_request` | A specimen access request |
| `policy_evaluation` | A policy evaluation decision |

### 2.2 Edges

Edges are directed, typed relationships between nodes.

| Edge Type | Cardinality | Example |
|-----------|-------------|---------|
| `derived_from` | Many-to-one | Aliquot → Specimen, Dataset → Specimen |
| `authorized_by` | Many-to-one | Collection → Consent, Shipment → IRB |
| `processed_by` | Many-to-one | Specimen → ProcessingEvent |
| `verified_by` | Many-to-one | QCResult → Document (QC report) |
| `shipped_with` | Many-to-one | Specimen → Shipment |
| `linked_to` | Many-to-many | Dataset ↔ Specimen |
| `generated_from` | One-to-many | Dataset → AssayRun |
| `requested_by` | Many-to-one | Fulfillment → AccessRequest |
| `approved_by` | Many-to-one | AccessRequest → PolicyEvaluation |
| `owned_by` | Many-to-one | Specimen → Organization |

### 2.3 Evidence

Evidence links nodes to verifiable artifacts. Each evidence record
references an external document or hash.

---

## 3. Query Patterns

### 3.1 Forward Trace

Starting from a donor consent, trace forward to see all specimens
collected under it, their shipments, and derived datasets.

### 3.2 Backward Trace

Starting from a published dataset, trace backward through assay runs,
QC results, processing steps, collection events, and back to the donor
consent.

### 3.3 Evidence Chain

For a given shipment, find all evidence documents: temperature logs,
chain of custody records, customs documentation, and receipt
confirmations.
