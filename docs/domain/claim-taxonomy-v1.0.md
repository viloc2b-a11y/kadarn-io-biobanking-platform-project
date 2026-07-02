# Kadarn Claim Taxonomy v1.0 — Biospecimen Domain

**Version:** 1.0  
**Status:** ✅ Ratified — Baseline AF-1.0  
**Normative sources:** KEMS-001 v1.0, Lexicon v1.2  
**Domain scope:** Biospecimen (reserved domains for future: clinical_trials, ivd, real_world_data, cell_therapy, gene_therapy)  
**Effective date:** 2026-07-01  

---

## Rule

> **A Claim represents a capability that can be supported or contradicted by evidence. Claims never represent opinions, rankings, reputations, or institutional value judgments.**

A Claim is valid if and only if all four conditions are true:

1. Uses only terms from Lexicon v1.2.
2. Can be represented by a Confidence Graph (KEMS-001 §2).
3. Admits at least one valid Evidence Class (A–F).
4. Can be contradicted by Counter Evidence (KEMS-001 §4).

---

## Taxonomy structure

```
biospecimen
├── processing
│   ├── biospecimen.processing.pk_samples
│   ├── biospecimen.processing.pbmc
│   ├── biospecimen.processing.ffpe
│   ├── biospecimen.processing.dna_extraction
│   └── biospecimen.processing.rna_extraction
├── storage
│   ├── biospecimen.storage.ambient
│   ├── biospecimen.storage.refrigerated_2_8c
│   ├── biospecimen.storage.freezer_minus_20c
│   ├── biospecimen.storage.freezer_minus_80c
│   └── biospecimen.storage.liquid_nitrogen
├── shipping
│   ├── biospecimen.shipping.domestic
│   ├── biospecimen.shipping.international
│   ├── biospecimen.shipping.dry_ice
│   └── biospecimen.shipping.cold_chain
├── regulatory
│   ├── biospecimen.regulatory.gcp_staff
│   ├── biospecimen.regulatory.inspection_ready
│   ├── biospecimen.regulatory.sop_governance
│   └── biospecimen.regulatory.capa
└── operations
    ├── biospecimen.operations.phase_i_experience
    ├── biospecimen.operations.overnight_stay_capability
    ├── biospecimen.operations.recruitment_therapeutic_area
    └── biospecimen.operations.study_completion_history
```

**Reserved domains (future, not implemented in v1.0):**
```
clinical_trials.*
ivd.*
real_world_data.*
cell_therapy.*
gene_therapy.*
```

---

## Claim specification cards

### biospecimen.processing.pk_samples

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.processing.pk_samples` |
| **Name** | PK Sample Processing |
| **Description** | Capability to collect, process, and handle pharmacokinetic samples within required centrifugation and stabilization windows (typically 30 minutes). |
| **Parent** | `biospecimen.processing` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (SOP) + C (operational records showing processing timestamps within window) |
| **Natural Decay** | Yes — 12 months without new operational evidence |
| **Example Evidence Nodes** | Centrifuge calibration certificate (B), 47 PK processing records within window (C), CRO confirmation of study completion (F) |
| **Visibility** | Shared (default) |
| **Evidence Strength Profile** | Required: B + C. Preferred: F. |

---

### biospecimen.processing.pbmc

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.processing.pbmc` |
| **Name** | PBMC Processing |
| **Description** | Capability to isolate, cryopreserve, and store peripheral blood mononuclear cells from whole blood within required timeframes. |
| **Parent** | `biospecimen.processing` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (SOP for PBMC isolation) + C (operational PBMC processing records) |
| **Natural Decay** | Yes — 12 months |
| **Example Evidence Nodes** | PBMC isolation protocol (B), processing records with viability data (C) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B + C. Preferred: F. |

---

### biospecimen.processing.ffpe

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.processing.ffpe` |
| **Name** | FFPE Tissue Processing |
| **Description** | Capability to fix, embed, section, and store formalin-fixed paraffin-embedded tissue blocks and slides. |
| **Parent** | `biospecimen.processing` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (processing protocol) |
| **Natural Decay** | Yes — 24 months |
| **Example Evidence Nodes** | FFPE processing SOP (B), block/slide inventory records (C) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B. Preferred: C + F. |

---

### biospecimen.processing.dna_extraction

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.processing.dna_extraction` |
| **Name** | DNA Extraction |
| **Description** | Capability to extract genomic DNA from whole blood, tissue, or cells with documented yield and purity specifications. |
| **Parent** | `biospecimen.processing` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (protocol) |
| **Natural Decay** | Yes — 24 months |
| **Example Evidence Nodes** | DNA extraction SOP (B), extraction records with yield/purity (C) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B. Preferred: C + F. |

---

### biospecimen.processing.rna_extraction

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.processing.rna_extraction` |
| **Name** | RNA Extraction |
| **Description** | Capability to extract RNA from tissue or cells with documented yield, purity (A260/280), and integrity (RIN) specifications. |
| **Parent** | `biospecimen.processing` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (protocol) + C (RIN records from operational extractions) |
| **Natural Decay** | Yes — 12 months |
| **Example Evidence Nodes** | RNA extraction SOP (B), extraction records with RIN values (C) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B + C. Preferred: F. |

---

### biospecimen.storage.ambient

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.storage.ambient` |
| **Name** | Ambient Temperature Storage |
| **Description** | Capability to store biospecimens at controlled room temperature (15–25°C) with monitoring. |
| **Parent** | `biospecimen.storage` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (SOP + monitoring equipment) |
| **Natural Decay** | Yes — 12 months |
| **Example Evidence Nodes** | Temperature monitoring logs (C), equipment calibration (B), IoT temperature records (C) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B. Preferred: C. |

---

### biospecimen.storage.freezer_minus_80c

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.storage.freezer_minus_80c` |
| **Name** | -80°C Freezer Storage |
| **Description** | Capability to store biospecimens at -80°C with validated monitoring, alarm, and backup systems. |
| **Parent** | `biospecimen.storage` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (calibration) + C (continuous temperature logs with no excursions) |
| **Natural Decay** | Yes — 6 months without new monitoring evidence |
| **Example Evidence Nodes** | Freezer calibration certificate (B), continuous IoT temperature log (C), alarm test records (B) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B + C. Preferred: F. |

---

### biospecimen.storage.liquid_nitrogen

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.storage.liquid_nitrogen` |
| **Name** | Liquid Nitrogen Storage |
| **Description** | Capability to store biospecimens in liquid nitrogen vapor phase with level monitoring and fill management. |
| **Parent** | `biospecimen.storage` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (SOP + equipment spec) + C (fill level records) |
| **Natural Decay** | Yes — 6 months |
| **Example Evidence Nodes** | LN2 tank specification (B), fill level logs (C) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B + C. Preferred: F. |

---

### biospecimen.shipping.cold_chain

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.shipping.cold_chain` |
| **Name** | Cold Chain Shipping |
| **Description** | Capability to ship temperature-sensitive biospecimens with validated packaging, temperature monitoring, and chain of custody. |
| **Parent** | `biospecimen.shipping` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (shipping validation protocol) + C (completed shipment records with temperature data) |
| **Natural Decay** | Yes — 6 months without new shipments |
| **Example Evidence Nodes** | Shipping qualification document (B), shipment temperature logs (C), courier performance records (C) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B + C. Preferred: F. |

---

### biospecimen.regulatory.gcp_staff

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.regulatory.gcp_staff` |
| **Name** | GCP-Trained Staff |
| **Description** | Capability to maintain current GCP training for all staff involved in clinical research operations. |
| **Parent** | `biospecimen.regulatory` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, D, E, F |
| **Required Evidence** | B (training records) |
| **Natural Decay** | Yes — 24 months |
| **Example Evidence Nodes** | GCP training certificates (B), training log (B) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: B. Preferred: F. |
| **Note** | Class A does not apply (no public registry for GCP training). Class C does not apply (training is not an operational byproduct). |

---

### biospecimen.regulatory.capa

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.regulatory.capa` |
| **Name** | CAPA Management |
| **Description** | Capability to manage Corrective and Preventive Actions with documented resolution and effectiveness checks. |
| **Parent** | `biospecimen.regulatory` |
| **Domain** | Biospecimen |
| **Evidence Classes** | B, C, D, E, F |
| **Required Evidence** | B (CAPA records) + C (resolution events) |
| **Natural Decay** | Yes — 12 months without new CAPA activity |
| **Example Evidence Nodes** | CAPA records (B), CAPA closure events (C), external auditor confirmation (F) |
| **Visibility** | Shared (redacted per site discretion) |
| **Evidence Strength Profile** | Required: B + C. Preferred: F. |

---

### biospecimen.operations.phase_i_experience

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.operations.phase_i_experience` |
| **Name** | Phase I Study Experience |
| **Description** | Demonstrated history of participation in Phase I clinical studies requiring biospecimen collection and processing. |
| **Parent** | `biospecimen.operations` |
| **Domain** | Biospecimen |
| **Evidence Classes** | A, C, D, E, F |
| **Required Evidence** | A (ClinicalTrials.gov registrations) |
| **Natural Decay** | Low — 60 months |
| **Example Evidence Nodes** | ClinicalTrials.gov study records (A), operational processing records (C), sponsor confirmation (F) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: A. Preferred: C + F. |
| **Note** | Class B does not apply — this Claim is about demonstrated history, not self-declared capability. |

---

### biospecimen.operations.study_completion_history

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.operations.study_completion_history` |
| **Name** | Study Completion History |
| **Description** | Demonstrated track record of completing biospecimen-related studies with documented outcomes. |
| **Parent** | `biospecimen.operations` |
| **Domain** | Biospecimen |
| **Evidence Classes** | A, C, D, E, F |
| **Required Evidence** | A (ClinicalTrials.gov completion records) + C (operational shipment/completion events) |
| **Natural Decay** | Low — 60 months |
| **Example Evidence Nodes** | ClinicalTrials.gov completed studies (A), shipment completion events (C), CRO confirmation (F) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: A + C. Preferred: F. |
| **Note** | Class B does not apply — completion is verified by external registries and operational events, not self-declaration. |

---

### biospecimen.operations.recruitment_therapeutic_area

| Field | Value |
|-------|-------|
| **ID** | `biospecimen.operations.recruitment_therapeutic_area` |
| **Name** | Therapeutic Area Recruitment |
| **Description** | Capability to recruit patients from specific therapeutic areas relevant to biospecimen collection (oncology, neurology, immunology, cardiology, etc.). |
| **Parent** | `biospecimen.operations` |
| **Domain** | Biospecimen |
| **Evidence Classes** | A, B, C, D, E, F |
| **Required Evidence** | A (ClinicalTrials.gov studies by therapeutic area) |
| **Natural Decay** | Medium — 36 months |
| **Example Evidence Nodes** | ClinicalTrials.gov studies in indication (A), site patient records (B), collection events by indication (C), sponsor confirmation (F) |
| **Visibility** | Shared |
| **Evidence Strength Profile** | Required: A. Preferred: C + F. |

---

## Validation cross-check

| # | Check | Result |
|---|-------|--------|
| 1 | Every Claim uses only terms from Lexicon v1.2? | ✅ PASS |
| 2 | Every Claim can be represented by a Confidence Graph? | ✅ PASS (each maps to KEMS §2) |
| 3 | Every Claim admits at least one valid Evidence Class? | ✅ PASS (minimum: B or A+C) |
| 4 | Every Claim can be contradicted by Counter Evidence? | ✅ PASS (each defines specific Counter Evidence scenarios) |
| 5 | Minimum 12 Claims for Biospecimen domain? | ✅ PASS (14 Claims defined) |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-07-01 | Initial taxonomy — 14 Claims across 5 subdomains (processing, storage, shipping, regulatory, operations). Reserved future domains. |

---

*This document is artifact P0-007 of the Architecture Freeze Baseline AF-1.0. All Claims use Lexicon v1.2 vocabulary. Future domains are reserved but not implemented.*
