# Kadarn Graph-Native Query Layer

**Version:** 1.0  
**Status:** Accepted  
**Canonical:** `docs/architecture/graph-native-query-layer.md`

---

## 1. Purpose

The Graph Query Layer provides unified access across Kadarn's four graphs:
Network, Provenance, Knowledge, and Trust. It composes existing graph
engines into cross-domain queries without requiring application code to
orchestrate multiple packages.

---

## 2. Graphs

| Graph | Source | Content |
|-------|--------|---------|
| **Network** | `organizations` + `user_organizations` | Organization relationships, capabilities, memberships |
| **Provenance** | `provenance_nodes` + `provenance_edges` | Entity lineage and evidence chains |
| **Knowledge** | `ontology_terms` + `ontology_synonyms` + `ontology_mappings` | Controlled vocabularies and semantic mappings |
| **Trust** | `organization_trust` + `trust_events` | Trust scores per dimension, trajectory |

---

## 3. Query Catalog

### specimenFullProvenance(specimenId)
Returns complete lineage: consent → collection → processing → QC → shipment → dataset.
Assembles data from Provenance Graph traceBackward/traceForward.

### organizationTrustHistory(orgId)
Returns trust score trajectory with contributing events.
Assembles data from Trust Engine.

### matchingSuppliers({ specimenType, diagnosis, minTrustScore })
Cross-graph query:
1. Knowledge Graph: expand specimenType + diagnosis to synonyms
2. Trust Graph: find orgs with trust >= minTrustScore
3. Network Graph: filter by relevant capabilities
4. Return ranked results

### shipmentRegulatoryEvidence(shipmentId)
Returns all evidence documents linked to a shipment's provenance chain.
Assembles from Provenance Graph evidenceFor().
