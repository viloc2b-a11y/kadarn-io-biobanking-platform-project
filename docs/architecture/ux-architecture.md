# Kadarn UX Architecture — Three Experiences, One Platform

**Version:** 1.0  
**Status:** Architectural Vision  
**Supersedes:** Module-based application organization  

---

## 1. The Shift

Kadarn is no longer organized by software modules. It is organized by
**experiences** — distinct interfaces for distinct moments in the
biospecimen lifecycle.

```
                     Kadarn Platform
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
 Marketplace          Workspace          Operations Center
 (Discover)            (Execute)            (Operate)
        │                   │                   │
        └───────────────────┼───────────────────┘
                    Shared Platform Fabric
        Identity • Exchange • Trust • Provenance
        Policy • Knowledge • Analytics • AI
        Logistics • Processing • Settlement
```

Users work inside a **Workspace**, not inside modules. Applications are
enabled by capabilities, policies, and permissions. All experiences run
on the same platform engine.

---

## 2. The Three Experiences

### 2.1 Marketplace Experience (Discover)

**Purpose:** Discover and connect — specimens, services, and network
partners.

**Three marketplaces:**

| Marketplace | Purpose | Powered By |
|-------------|---------|------------|
| **Research Marketplace** | Find available specimens and collections | Matching Engine, Knowledge Engine |
| **Service Marketplace** | Find processing, logistics, and assay partners | Matching Engine, Trust Engine |
| **Network Marketplace** | Find biobanks, labs, CROs, sites, couriers, and data providers | Network Graph, Trust Engine |

**Key user actions:**
- Search specimens by type, diagnosis, consent scope, location
- Filter by trust score, governance requirements, availability
- View supplier profiles with trust trajectory
- Initiate access requests

### 2.2 Workspace Experience (Execute)

**Definition:** A configurable work environment enabled by organizational
capabilities — not by organization type.

**Capability-driven, not role-driven:**

```
Workspace
├── Organization Profile
├── Capabilities Enabled
├── Applications Enabled
└── Policies Applied
```

**Example configurations:**

| Organization | Capabilities | Applications Visible |
|-------------|--------------|-------------------|
| Biobank | storage, processing, qc, exchange | Inventory, Collections, QC, Processing, Exchange, Analytics |
| Sponsor | programs, discovery, finance | Programs, Discovery, Exchange, Analytics, Payments |
| Site | collection, consent | Collections, Consent Management, Shipments |
| Lab | processing, assay | Processing, Assay Management, QC, Analytics |
| Courier | logistics | Shipments, Temperature Monitoring, Chain of Custody |
| Regulatory Body | oversight | Compliance, Audit, Provenance |

**Powered by:** Workflow Engine, Policy Engine, Operational Twins,
Provenance Graph, Financial Engine.

### 2.3 Kadarn Operations Center (Operate)

**Name:** Kadarn Operations Center (KOC)

**Purpose:** Network-wide visibility and control — the institutional
command center for platform operations.

**Dashboards:**

| Dashboard | Description | Powered By |
|-----------|-------------|------------|
| **Network Health** | Active organizations, transactions, fulfillment pipeline | Graph Query Layer |
| **Trust** | Org trust scores, trajectories, challenges, decay alerts | Trust Engine |
| **Provenance** | Cross-entity lineage explorer, evidence chains | Provenance Graph |
| **Compliance** | Policy violations, consent gaps, expired accreditations | Policy Engine |
| **Capacity** | Network-wide utilization, bottlenecks, forecasts | Matching Engine, Intelligence Engine |
| **KPE** | Key Platform Entities — programs, collections, shipments | Operational Twins |
| **AI Insights** | Anomaly detection, predictive alerts, recommendations | Intelligence Engine |
| **Exceptions** | Blocked workflows, disputed shipments, breach events | Workflow Engine |

---

## 3. Engine-to-Experience Mapping

Every engine we've built maps to one or more experiences:

| Engine | Marketplace | Workspace | Operations Center |
|--------|:-----------:|:---------:|:-----------------:|
| Policy Engine | ✅ | ✅ | ✅ |
| Trust Engine | ✅ | ✅ | ✅ |
| Knowledge Engine | ✅ | ✅ | — |
| Matching Engine | ✅ | — | — |
| Workflow Engine | — | ✅ | ✅ |
| Fulfillment Engine | — | ✅ | — |
| Financial Engine | — | ✅ | ✅ |
| Intelligence Engine | ✅ | ✅ | ✅ |
| Integration Engine | ✅ | ✅ | ✅ |
| Provenance Graph | — | ✅ | ✅ |
| Operational Twins | — | ✅ | ✅ |
| Network Graph | ✅ | — | ✅ |
| Graph Query Layer | ✅ | ✅ | ✅ |

---

## 4. Platform Fabric

The engines rest on a shared **Platform Fabric** — the cross-cutting
capabilities that all experiences depend on:

```
Platform Fabric
├── Identity Fabric    (auth, orgs, roles, capabilities)
├── Exchange Fabric    (transactions, fulfillment, settlement)
├── Trust Fabric       (scores, attestations, risk)
├── Provenance Fabric  (lineage, evidence, audit)
├── Knowledge Fabric   (vocabularies, semantics, ontologies)
├── Policy Fabric      (declarative rules, evaluation)
├── Execution Fabric   (workflows, tasks, state machines)
├── Analytics Fabric   (metrics, dashboards, reporting)
├── AI Fabric          (classification, prediction, nlp)
├── Logistics Fabric   (shipments, tracking, temperature)
└── Settlement Fabric  (fees, escrow, distribution)
```

---

## 5. Architectural Invariant

**Users switch between Workspaces, not modules.**

Applications are enabled by capabilities, policies, and permissions. All
experiences run on the same platform engine. No organization type is
hardcoded — any organization can have any combination of capabilities.

This is the final evolution of the Kadarn architecture: from feature-based
roadmap, to capability-based engines, to experience-based products.
