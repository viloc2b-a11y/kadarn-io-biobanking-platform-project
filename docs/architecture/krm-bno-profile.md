# KRM-BNO: Kadarn Reference Model for Biospecimen Network Orchestration

**Version:** 1.0  
**Status:** Accepted  
**Profile of:** KRM-RAO v1.0  

---

## 1. Introduction

KRM-BNO is the domain-specific profile of KRM-RAO for biospecimen network
orchestration. Where KRM-RAO defines abstract concepts (Research Asset,
Operational Twin, Graph), KRM-BNO specializes them for the biospecimen
domain: what types of Research Assets exist in a biobanking network, what
lifecycles they follow, and how existing Kadarn modules map to the
reference model.

This profile does **not** modify KRM-RAO abstractions. It specializes
them.

---

## 2. Biospecimen Network Orchestration Defined

Biospecimen Network Orchestration is the coordinated management of the
complete lifecycle of biological specimens — from discovery and request
through governance, collection, processing, logistics, and settlement —
across the independent organizations that participate in biomedical
research.

It is **not** a LIMS (which manages specimens within one organization).
It is **not** a CTMS (which manages studies within one sponsor or CRO).
It is **not** a logistics platform (which tracks shipments within one
courier's system).

Biospecimen Network Orchestration connects these systems and organizations,
providing the network-level capabilities that no single system can provide:

- **Cross-organizational discovery** of specimens
- **Cross-organizational governance** (policies that span biobank, sponsor,
  and regulator)
- **Cross-organizational provenance** (a specimen's history from collection
  to data publication across multiple systems)
- **Cross-organizational trust** (evidence-based assessment of
  counterparty reliability)

---

## 3. Research Asset Specialization

In KRM-BNO, the abstract Research Asset specializes into five concrete types:

```
KRM-RAO: Research Asset
    │
    ├── Biospecimen        (physical biological material)
    ├── Aliquot            (derived portion of a biospecimen)
    ├── Collection         (set of specimens collected under a protocol)
    ├── Dataset            (data derived from biospecimens)
    └── Shipment           (physical transfer of biospecimens)
```

### 3.1 Biospecimen

**Definition:** Biological material collected from a living organism for
research purposes. The primary physical asset.

**KRM-RAO mapping:** Research Asset (concrete)

**Properties specific to KRM-BNO:**
- **Collection method:** Venipuncture, biopsy, surgical resection, autopsy,
  etc.
- **Collection container:** SST, EDTA, citrate, PAXgene, cryovial, slide,
  block, etc.
- **Preservation type:** FFPE, fresh frozen (OCT, cryoprotected), RNA_later,
  formalin, frozen plasma, frozen serum, dried blood spot
- **Storage temperature:** Ambient, 4°C, -20°C, -80°C, LN2 vapor phase,
  LN2 liquid phase
- **Specimen type:** Whole blood, plasma, serum, tissue (with subtype),
  urine, saliva, CSF, stool, bone marrow, DNA, RNA, protein, etc.
- **Collection protocol reference:** Links to the protocol under which it
  was collected
- **Consent reference:** Links to the consent governing its use

### 3.2 Aliquot

**Definition:** A precisely measured portion of a parent biospecimen,
created for a specific use.

**KRM-RAO mapping:** Research Asset (concrete), derived from parent
Biospecimen

**Properties specific to KRM-BNO:**
- **Parent specimen:** The biospecimen from which this aliquot was derived
- **Volume/quantity:** Amount (mL, mg, units)
- **Container:** Cryovial, Eppendorf, microwell plate position, slide, etc.
- **Freeze-thaw count:** Number of freeze-thaw cycles experienced
- **Remaining volume:** After all previous uses
- **Aliquot type:** Primary, daughter, working

### 3.3 Collection

**Definition:** A set of biospecimens collected under a single protocol,
IRB approval, and consent framework.

**KRM-RAO mapping:** Research Asset (aggregate)

**Properties specific to KRM-BNO:**
- **Collection protocol:** The scientific and operational protocol
- **IRB reference:** Applicable IRB approval(s)
- **Consent model:** Opt-in, opt-out, broad consent, specific consent,
  deferred consent, waiver
- **Target enrollment:** Planned donor/participant count
- **Target specimens per donor:** What specimens are collected per
  participant
- **Inclusion/exclusion criteria:** Who can contribute
- **Governance model:** Who can request, under what conditions
- **Collection period:** Start and planned end dates
- **Status:** Planned, active, paused, completed, closed

### 3.4 Dataset

**Definition:** Structured data derived from biospecimens, including assay
results, clinical annotations, and derived analyses.

**KRM-RAO mapping:** Research Asset (digital)

**Properties specific to KRM-BNO:**
- **Data type:** Clinical data, assay results, genomic data, imaging data,
  derived features
- **Data standard:** CDISC SDTM, FHIR, GA4GH, DICOM, ISA-Tab
- **Source specimens:** The specimens from which data was derived
- **Access model:** Open, registered, controlled (dbGaP categories)
- **Data Use Ontology (DUO) terms:** Permitted uses coded in DUO
- **Publication status:** Raw, processed, QC'd, published, under embargo

### 3.5 Shipment

**Definition:** A physical transfer of one or more specimens between
organizations.

**KRM-RAO mapping:** Research Asset (process)

**Properties specific to KRM-BNO:**
- **Contained specimens:** The specimens/aliqots in this shipment
- **Courier:** Logistics provider
- **Tracking number:** Carrier tracking ID
- **Temperature range:** Required storage temperature range
- **Temperature monitor:** Device IDs, telemetry source
- **Chain of custody:** Sequential custody events (handled by → handled to)
- **Customs documentation:** For international shipments
- **Regulatory docs:** Export permits, import permits, CITES, CDC permits
- **Status:** Packed, picked_up, in_transit, customs_hold, delivered,
  accepted, rejected, disputed, lost

---

## 4. Operational Twin Specialization

### 4.1 Specimen Twin

**KRM-RAO:** Operational Twin → Specimen Twin

**Domain:** A single biospecimen or aliquot.

**Event stream examples:**
- `SpecimenCollected` — initial collection event
- `AliquotCreated` — from parent specimen
- `QCPerformed` — with result (pass/fail/pending) and evidence
- `FreezeThawCycle` — freeze-thaw event with temperature profile
- `VolumeAdjusted` — volume reduction after use
- `TransferInitiated` — en route to another organization
- `Consumed` — specimen fully used
- `Destroyed` — specimen disposed

**Derived state examples:**
- Current location (organization, freezer, rack, box, position)
- Remaining volume/quantity
- Freeze-thaw count
- Current consent status
- Current QC status
- Current governance status

### 4.2 Transaction Twin

**KRM-RAO:** Operational Twin → Transaction Twin

**Domain:** A fulfillment transaction (MTA, DUA, transfer agreement).

**Event stream examples:**
- `TransactionInitiated` — request submitted
- `GovernanceReviewStarted` — policy evaluation begun
- `PolicyApproved` — all applicable policies satisfied
- `PolicyDenied` — one or more policies blocked
- `MTASigned` — material transfer agreement executed
- `IRBChecked` — IRB coverage verified
- `PaymentEscrowed` — funds placed in escrow
- `FulfillmentStarted` — specimens released for shipment
- `FulfillmentCompleted` — recipient confirmed receipt
- `SettlementCompleted` — funds distributed
- `DisputeRaised` — recipient disputed condition
- `DisputeResolved` — dispute adjudicated

### 4.3 Organization Twin

**KRM-RAO:** Operational Twin → Organization Twin

**Domain:** A participating organization (biobank, lab, CRO, sponsor,
site, courier).

**Event stream examples:**
- `OrganizationRegistered` — joined the Kadarn network
- `AccreditationAdded` — new CAP, CLIA, ISO certification
- `AccreditationExpired` — certification lapsed
- `TrustScoreUpdated` — recomputed trust score
- `ComplianceIncident` — regulatory or policy incident
- `AgreementExecuted` — new MTA or DUA with another organization
- `OrganizationSuspended` — temporary network suspension
- `OrganizationReinstated` — suspension lifted

**Derived state examples:**
- Current trust scores (per dimension)
- Active accreditations
- Active agreements with other organizations
- Compliance status (good, pending_review, suspended)
- Network participation metrics (total fulfillments, on-time rate,
  breach rate)

### 4.4 Shipment Twin

**KRM-RAO:** Operational Twin → Shipment Twin

**Domain:** A physical shipment of specimens.

**Event stream examples:**
- `ShipmentScheduled` — pickup arranged
- `ContainerPrepared` — dry shipper or cold pack prepared
- `SpecimensPacked` — specimens added to shipment
- `PickedUp` — courier collected
- `CustomsSubmitted` — customs documentation filed
- `CustomsCleared` — customs approved
- `LocationUpdated` — GPS ping (periodic)
- `TemperatureReading` — internal temperature (periodic)
- `TemperatureBreach` — temperature exceeded threshold
- `ChainOfCustodyEvent` — custody transfer
- `Delivered` — recipient signed
- `Accepted` — recipient confirmed condition
- `Disputed` — recipient disputed condition or breach

**Derived state examples:**
- Current location (lat/lng)
- Temperature excursion count and severity
- Estimated time of arrival
- Custody chain status
- Customs clearance status

### 4.5 Collection Twin

**KRM-RAO:** Operational Twin → Collection Twin

**Domain:** A collection protocol with its enrolled donors and collected
specimens.

**Event stream examples:**
- `CollectionProtocolRegistered`
- `DonorEnrolled` — participant consented
- `DonorWithdrawn` — consent withdrawn
- `SpecimenCollected` — new specimen added to collection
- `CollectionPaused` — temporary halt
- `CollectionClosed` — completed
- `GovernanceRuleUpdated` — policy change affecting this collection

**Derived state examples:**
- Enrollment progress (actual vs target)
- Specimen inventory by type
- Donor demographics (de-identified aggregate)
- Consent status per donor

---

## 5. Biospecimen Lifecycle

The biospecimen lifecycle in KRM-BNO spans 19 phases:

```
Discovery
    │
    ▼
Feasibility
    │
    ▼
Access Request
    │
    ▼
Governance Review
    │
    ├── Consent Verification
    ├── IRB/Ethics Review
    └── MTA/DUA
    │
    ▼
Reservation
    │
    ▼
Collection
    │
    ▼
Processing
    │
    ├── Aliquoting
    └── QC
    │
    ▼
Storage
    │
    ▼
Shipment Preparation
    │
    ├── Temperature Monitoring
    └── Chain of Custody
    │
    ▼
Receipt
    │
    ▼
Acceptance
    │
    ▼
Data Linkage
    │
    ▼
Settlement
    │
    ▼
(Collaborative Analysis / Publication)
```

### Phase Details

| Phase | Description | KRM-RAO Component | Existing Module |
|-------|-------------|-------------------|-----------------|
| **Discovery** | Search for available specimens across biobanks | Matching Engine | Discovery |
| **Feasibility** | Assess if study requirements can be met | Intelligence Engine | Feasibility |
| **Access Request** | Formal request with study context | Service → Transaction Twin | (new) |
| **Governance Review** | Policy evaluation across applicable rules | Policy Engine | Regulatory |
| **Consent Verification** | Confirm consent covers intended use | Policy Engine + Specimen Twin | (new) |
| **IRB/Ethics Review** | Human-in-the-loop IRB check | Workflow Engine | Regulatory |
| **MTA/DUA** | Agreement execution | Workflow Engine + Transaction Twin | (new) |
| **Reservation** | Hold specimens pending fulfillment | Fulfillment Engine | Exchange |
| **Collection** | Physical specimen collection at site | Service → Specimen Twin | (new) |
| **Processing** | Primary processing (centrifugation, etc.) | Service → Specimen Twin | Processing |
| **Aliquoting** | Creating derived portions | Service → Specimen Twin | Processing |
| **QC** | Quality control assessment | Service → Specimen Twin | Processing |
| **Storage** | Freezer/inventory management | Specimen Twin (state) | (LIMS integration) |
| **Shipment Preparation** | Packing with temperature monitoring | Shipment Twin | Logistics |
| **Temperature Monitoring** | In-transit telemetry ingestion | Shipment Twin | (new) |
| **Chain of Custody** | Custody transfer recording | Shipment Twin + Provenance Graph | (new) |
| **Receipt** | Physical receipt and inspection | Shipment Twin | Logistics |
| **Acceptance** | Formal acceptance or dispute | Fulfillment Engine | Exchange |
| **Data Linkage** | Linking specimens to clinical/research data | Knowledge Graph | (new) |
| **Settlement** | Financial completion | Financial Engine | (new) |

---

## 6. Existing Module Mapping

| Module | KRM-RAO Role | KRM-BNO Specialization | Status |
|--------|-------------|------------------------|--------|
| Foundation | Identity Fabric + Data Fabric | Multi-tenant organization auth | ✅ Core |
| Core API | Services | Baseline REST API | ✅ Core |
| Platform Services | Services | 17 service contracts | ✅ Core |
| Discovery | Matching Engine (target) | Cross-biobank specimen discovery | ⚡ Transition to Engine |
| Feasibility | Intelligence Engine (target) | Study feasibility assessment | ⚡ Transition to Engine |
| Program Engine | Workflow Engine (partial) | Multi-site program management | ⚡ Partial coverage |
| Exchange | Service (transaction) | Exchange transaction management | ✅ Existing |
| Processing | Service (processing) | Processing order management | ✅ Existing |
| Logistics | Service (logistics) + Shipment Twin | Shipment management | ⚡ Twin missing |
| Regulatory | Governance Fabric + Policy Engine | Regulatory tracking | ⚡ Policy Engine missing |
| Analytics | Service → Intelligence Engine | Dashboards and reporting | ✅ Existing |
| AI Layer | Intelligence Engine (transversal) | AI-assisted platform | ⚡ Needs refactor |

---

## 7. Gap Analysis

Gaps are classified as **specification gaps** (concept not yet modeled in architecture docs) or **implementation gaps** (modeled but not yet built in code). These are distinct risks — a specification gap means the team cannot build it yet; an implementation gap means the team knows what to build but hasn't built it.

| Concept | Specification gap (not yet modeled) | Implementation gap (modeled, not built) | Priority |
|---------|-------------------------------------|-----------------------------------------|----------|
| **Policy Engine** | — | ✅ Defined in KRM-RAO §5.2, KRM-BNO §5; not yet built | **P0** |
| **Trust Engine** | — | ✅ Defined in KRM-RAO §5.4, KRM-BNO §5; not yet built | **P0** |
| **Knowledge Engine** | — | ✅ Defined in KRM-RAO §5.1; not yet built | **P1** |
| **Operational Twins** | — | ✅ Defined in KRM-RAO §3.4, KRM-BNO §4; runtime not yet built | **P0** |
| **Provenance Graph** | — | ✅ Defined in KRM-RAO §4.2; not yet built | **P0** |
| **Knowledge Graph** | — | ✅ Defined in KRM-RAO §4.3; not yet built | **P1** |
| **Trust Graph** | — | ✅ Defined in KRM-RAO §4.4; not yet built | **P1** |
| **Network Graph** | — | ✅ Defined in KRM-RAO §4.1; not yet built | **P1** |
| **Workflow Engine 2.0** | — | ✅ Defined in KRM-RAO §5.3 (dynamic, policy-driven); existing Workflow Engine covers basic case | **P1** |
| **Fulfillment Engine** | — | ✅ Defined in KRM-RAO §5.6, KRM-BNO §5; not yet built | **P2** |
| **Financial Engine** | — | ✅ Defined in KRM-RAO §5.7; not yet built | **P2** |
| **Intelligence Engine** | — | ✅ Defined in KRM-RAO §5.8, Capability Sequence §6.2; currently scoped as AI Layer (needs refactor) | **P2** |
| **Matching Engine** | — | ✅ Defined in KRM-RAO §5.5; currently scoped as Discovery Service (needs refactor) | **P2** |

### Cross-check: Operational Twins vs KRM-RAO

Per KRM-BNO sprint rule: every Operational Twin used in this profile must exist in KRM-RAO's base model.

| KRM-BNO Twin | Exists in KRM-RAO? | Status |
|--------------|-------------------|--------|
| Specimen Twin (§4.1) | ✅ KRM-RAO §2.2 (subtypes) | ✅ Match |
| Transaction Twin (§4.2) | ✅ KRM-RAO §2.2 (subtypes) | ✅ Match |
| Organization Twin (§4.3) | ✅ KRM-RAO §2.2 (subtypes) | ✅ Match |
| Shipment Twin (§4.4) | ✅ KRM-RAO §2.2 (subtypes) | ✅ Match |
| Collection Twin (§4.5) | ✅ KRM-RAO §2.2 (subtypes) | ✅ Match |

**Result:** Zero discrepancies. No Twin named in KRM-BNO is absent from KRM-RAO.

---

## 8. KRM-BNO Compliance

A Kadarn deployment is KRM-BNO compliant when:

1. **Research Assets** are identifiable, typed, and traceable according
   to the biospecimen taxonomy (Biospecimen, Aliquot, Collection, Dataset,
   Shipment)
2. **Specimen Lifecycle** events are recorded as immutable events for
   every tracked phase
3. **Governance** decisions are policy-evaluated, not hardcoded
4. **Trust** is computed from evidence, not manually assigned
5. **Provenance** is traceable from any end-state back to origin
6. **Existing modules** are mapped to KRM-RAO categories (no orphan
   modules)
7. **Gap components** are either implemented or explicitly deferred with
   a documented impact assessment
8. **Integration** follows the federation principle — existing systems
   are not replaced
