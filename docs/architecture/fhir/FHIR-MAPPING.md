# Kadarn FHIR Mapping Inventory

**Status:** Draft  
**Sprint:** KPE-09  
**Purpose:** Prepare interoperability mapping without implementing FHIR server or API exposure.

---

## Scope

This document defines how Kadarn's core domain concepts map to FHIR R4 resources.
It is a **mapping inventory**, not an implementation spec. Each mapping:

- Identifies the source Kadarn table and fields
- Maps to the target FHIR resource and elements
- Notes cardinality, optionality, and gaps (fields with no FHIR equivalent)

---

## 1. Organization → FHIR Organization

### Source

**Table:** `organizations` (migration `008_organizations_capabilities.sql`)

### Mapping

| Kadarn Field | FHIR Organization Element | Card. | Notes |
|---|---|---|---|
| `id` | `.identifier[0].value` | 1..1 | Kadarn UUID as identifier |
| — | `.identifier[0].system` | 1..1 | Fixed: `https://kadarn.io/org` |
| `name` | `.name` | 1..1 | Primary display name |
| `legal_name` | `.alias[0]` | 0..1 | Registered legal entity name |
| `tax_id` | `.identifier[1].value` | 0..1 | EIN / VAT |
| — | `.identifier[1].system` | 1..1 | Fixed: `https://kadarn.io/org/tax-id` |
| `country` | `.address[0].country` | 1..1 | ISO 3166-1 alpha2 |
| `region` | `.address[0].state` | 0..1 | State / province |
| `city` | `.address[0].city` | 0..1 | |
| `address_line1` | `.address[0].line[0]` | 0..1 | |
| `address_line2` | `.address[0].line[1]` | 0..1 | |
| `postal_code` | `.address[0].postalCode` | 0..1 | |
| `email` | `.contact[0].telecom[0].value` | 0..1 | System: `email` |
| `phone` | `.contact[0].telecom[1].value` | 0..1 | System: `phone` |
| `website` | `.contact[0].telecom[2].value` | 0..1 | System: `url` |
| `description` | `.description` | 0..1 | |
| `is_active` | `.active` | 1..1 | |
| `certifications` | `.qualification` | 0..* | Each cert → `.qualification[].code` |

### FHIR Gaps (Kadarn fields with no FHIR equivalent)

| Kadarn Field | Note |
|---|---|
| `logo_url` | FHIR Organization has no logo element. Store as `Organization.extension` or inline `DocumentReference`. |
| `metadata` (JSONB) | Extensions per Kadarn domain. Store as `Organization.extension` with Kadarn namespace. |
| `visibility_scope` | Kadarn-specific access control. Not in FHIR. Store as extension. |
| `created_by` | Audit field. FHIR has `Meta.lastUpdated` but not creator provenance at resource level. |

### FHIR Gaps (FHIR elements with no Kadarn equivalent)

| FHIR Element | Action |
|---|---|
| `.identifier[].period` | Not tracked. Omit or populate from `created_at`. |
| `.contact[].period` | Not tracked. Omit. |
| `.endpoint` | Not implemented. Future: link to Kadarn API endpoint. |

---

## 2. Provenance Specimen → FHIR Specimen

### Source

**Table:** `provenance_nodes` WHERE `node_type = 'specimen'`
**Supporting:** `provenance_evidence` (linked evidence), `provenance_edges` (lineage)

### Mapping

| Kadarn Field | FHIR Specimen Element | Card. | Notes |
|---|---|---|---|
| `provenance_nodes.id` | `.identifier[0].value` | 1..1 | Kadarn provenance node UUID |
| — | `.identifier[0].system` | 1..1 | Fixed: `https://kadarn.io/provenance/node` |
| `provenance_nodes.external_id` | `.identifier[1].value` | 0..1 | Original source ID (e.g., specimen ID from `processing_samples`) |
| — | `.identifier[1].system` | 1..1 | Fixed: `https://kadarn.io/specimen` |
| `provenance_nodes.label` | `.type.text` | 0..1 | Human-readable specimen description |
| — | `.type.coding[0]` | 0..1 | Future: map `node_type` to FHIR `specimen-type` value set |
| `provenance_nodes.organization_id` | `.subject.display` | 1..1 | Reference to FHIR Organization (resolved) |
| — | `.subject.reference` | 1..1 | `Organization/{org-id}` |
| `provenance_evidence[].reference` | `.note[].text` | 0..* | Evidence links as narrative |
| `provenance_nodes.recorded_at` | `.receivedTime` | 1..1 | When the specimen was registered in Kadarn |
| `provenance_nodes.properties -> collection_date` | `.collection.collected[x]DateTime` | 0..1 | From JSONB properties |
| `provenance_nodes.properties -> tissue_type` | `.collection.bodySite.text` | 0..1 | From JSONB properties |
| `provenance_nodes.properties -> container` | `.container[0].type.text` | 0..1 | From JSONB properties |

### FHIR Gaps (Kadarn fields)

| Kadarn Field | Note |
|---|---|
| `provenance_nodes.properties` (full JSONB) | Rich domain properties. Store as FHIR extensions per property key. |
| Edge lineage (parent specimens, derived aliquots) | FHIR Specimen has `.parent[]` for immediate parent. Deeper lineage → `Provenance` resource. |
| `provenance_evidence[].hash` | For integrity verification. FHIR Specimen has no hash field. Extension needed. |

### FHIR Gaps (FHIR Specimen elements without Kadarn equivalent)

| FHIR Element | Action |
|---|---|
| `.accessionIdentifier` | Not applicable. Kadarn uses UUIDs, not lab accession numbers. |
| `.condition` | Not tracked. Omit. |
| `.request` | Not linked. Future: connect to `ServiceRequest` or `ResearchStudy`. |

---

## 3. Program → FHIR ResearchStudy

### Source

**Table:** `programs` (migration `010_audit_programs.sql`)
**Supporting:** `program_milestones`, `program_participants`

### Mapping

| Kadarn Field | FHIR ResearchStudy Element | Card. | Notes |
|---|---|---|---|
| `programs.id` | `.identifier[0].value` | 1..1 | Kadarn program UUID |
| — | `.identifier[0].system` | 1..1 | Fixed: `https://kadarn.io/program` |
| `programs.program_identifier` | `.identifier[1].value` | 0..1 | External ID (NCT number, grant ID) |
| `programs.name` | `.title` | 1..1 | |
| `programs.short_name` | `.label` | 0..1 | |
| `programs.description` | `.description` | 0..1 | |
| `programs.status` | `.status` | 1..1 | Map: `draft` → `active`? See status mapping below |
| `programs.sponsor_org_id` | `.sponsor.reference` | 0..1 | `Organization/{id}` |
| `programs.lead_org_id` | `.principalInvestigator.reference` | 0..1 | `Organization/{id}` |
| `programs.start_date` | `.period.start` | 0..1 | |
| `programs.end_date` | `.period.end` | 0..1 | |
| `programs.therapeutic_areas` | `.condition[].coding[].display` | 0..* | Therapeutic area codes |
| `programs.diseases` | `.condition[].coding[].code` | 0..* | Disease/ICD codes from JSONB |
| `programs.allow_commercial_use` | `.extension` | 0..1 | Kadarn-specific. Store as `https://kadarn.io/allow-commercial-use` |
| `programs.require_ethics_approval` | `.extension` | 0..1 | Store as `https://kadarn.io/require-ethics-approval` |
| `program_milestones[].status` | `.progress[].milestone` | 0..* | See milestone mapping below |

### Status Mapping

| Kadarn `programs.status` | FHIR `ResearchStudy.status` |
|---|---|
| `draft` | `active` (draft is active from FHIR perspective) |
| `active` | `active` |
| `completed` | `completed` |
| `cancelled` | `withdrawn` |
| `archived` | `administratively-completed` |

### Milestone → ResearchStudy.progress Mapping

| `program_milestones` Field | FHIR `ResearchStudy.progress` |
|---|---|
| `milestone_type` (name) | `.progress[].name` |
| `status` | `.progress[].subjectState` |
| `actual_date` | `.progress[].subjectDate` |
| `notes` | `.progress[].note[]` |

### FHIR Gaps

| Kadarn Field | Note |
|---|---|
| `program_type` (TEXT[]) | Store as FHIR extension: `https://kadarn.io/program-type` |
| `default_data_scope` | Kadarn-specific sharing scope. FHIR ResearchStudy has no equivalent. Extension. |
| `program_participants` | FHIR has `.site[]` for locations, not org participants. Extension or `ResearchStudy.extension`. |
| `created_by_organization_id` | Audit extension. |

---

## 4. Provenance Evidence → FHIR DocumentReference

### Source

**Table:** `provenance_evidence`
**Linked to:** `provenance_nodes` (the entity the evidence supports)

### Mapping

| Kadarn Field | FHIR DocumentReference Element | Card. | Notes |
|---|---|---|---|
| `provenance_evidence.id` | `.identifier[0].value` | 1..1 | |
| — | `.identifier[0].system` | 1..1 | `https://kadarn.io/provenance/evidence` |
| `provenance_evidence.evidence_type` | `.type.coding[0].code` | 1..1 | Maps to FHIR `document-reference-type` value set where possible |
| `provenance_evidence.reference` | `.content[0].attachment.url` | 1..1 | URL, file path, or external reference |
| `provenance_evidence.hash` | `.content[0].attachment.hash` | 0..1 | Content integrity hash (direct FHIR match) |
| `provenance_evidence.description` | `.description` | 0..1 | |
| `provenance_evidence.node_id` | `.context.related[0].reference` | 1..1 | Reference to the FHIR resource the evidence supports |
| `provenance_evidence.recorded_at` | `.date` | 1..1 | |
| — | `.status` | 1..1 | Fixed: `current` |
| — | `.content[0].attachment.contentType` | 0..1 | Inferred from `evidence_type`, e.g. `mta_pdf` → `application/pdf` |

### Evidence Type Mapping

| Kadarn `evidence_type` | FHIR `DocumentReference.type.coding[].code` | Content Type |
|---|---|---|
| `mta_pdf` | `application/pdf` | MTA agreement document |
| `temperature_log` | `application/json` | Temperature monitoring data |
| `qc_report` | `application/pdf` | Quality control report |
| `consent_document` | `application/pdf` | Consent form |
| `shipping_manifest` | `application/pdf` | Carrier documentation |
| `audit_report` | `application/json` | Regulatory/compliance audit |
| `dataset_provenance` | `application/json` | Dataset lineage metadata |

### FHIR Gaps

| Kadarn Field | Note |
|---|---|
| `provenance_evidence.hash` with algorithm | FHIR has `.content[].attachment.hash` (base64). Kadarn stores hex. Convert on serialization. |
| Linked entity's `node_type` | Not in DocumentReference. Use `.context.related[].display` for context. |

---

## 5. QC Result → FHIR Observation

### Source

**Table:** `processing_aliquots.qc_status` (type: `TEXT` constrained to `pending / pass / fail / borderline`)
**Supporting:** `processing_aliquots` fields (quantity, concentration, storage_condition)

### Mapping

| Kadarn Field | FHIR Observation Element | Card. | Notes |
|---|---|---|---|
| `processing_aliquots.id` | `.identifier[0].value` | 1..1 | Aliquot UUID |
| — | `.identifier[0].system` | 1..1 | `https://kadarn.io/aliquot` |
| `processing_aliquots.qc_status` | `.valueCodeableConcept.coding[0].code` | 1..1 | `pass` / `fail` / `borderline` |
| — | `.valueCodeableConcept.coding[0].system` | 1..1 | `https://kadarn.io/qc-status` |
| — | `.status` | 1..1 | Fixed: `final` when QC complete, `preliminary` when pending |
| `processing_aliquots.aliquot_id` | `.code.coding[0].code` | 1..1 | Observation: what was observed? Default: `kadarn-qc-result` |
| `processing_aliquots.sample_id` | `.subject.reference` | 1..1 | `Specimen/{specimen-id}` (resolved via `provenance_nodes`) |
| `processing_aliquots.program_id` | `.focus[0].reference` | 0..1 | `ResearchStudy/{program-id}` |
| `processing_aliquots.quantity` / `concentration` | `.component[].valueQuantity` | 0..* | Additional quantitative observations |
| `processing_aliquots.storage_condition` | `.extension` | 0..1 | Kadarn-specific. `https://kadarn.io/storage-condition` |
| `processing_aliquots.state_changed_at` | `.effectiveDateTime` | 0..1 | When QC was performed |
| `processing_aliquots.state_changed_by` | `.performer[0].reference` | 0..1 | `Practitioner/{user-id}` |
| `processing_aliquots.metadata` | `.note[].text` | 0..1 | Free-text from JSONB metadata |

### QC Status → FHIR Observation.valueCodeableConcept

| Kadarn `qc_status` | FHIR Interpretation |
|---|---|
| `pending` | `.status` = `preliminary`, no `.valueCodeableConcept` |
| `pass` | `.valueCodeableConcept.coding[].code` = `pass`, `.interpretation` = `valid` |
| `fail` | `.valueCodeableConcept.coding[].code` = `fail`, `.interpretation` = `abnormal` |
| `borderline` | `.valueCodeableConcept.coding[].code` = `borderline`, `.interpretation` = `out-of-range` |

### FHIR Gaps

| Kadarn Field | Note |
|---|---|
| `processing_aliquots.metadata` (full JSONB) | Free-form. Selectively promote to FHIR `component[]` or store as extensions. |
| `processing_aliquots.barcode` | Not in FHIR Observation. Used for lab tracking, not clinical observation. |
| Link to `provenance_evidence` | FHIR Observation has no direct evidence link. Use `Observation.derivedFrom[]` or `Provenance` resource. |
| `current_state` (sample_state, e.g. `stored`, `consumed`) | Kadarn-specific lifecycle. FHIR `Observation.status` covers only the observation itself, not the specimen state. |

---

## Summary

| FHIR Resource | Kadarn Source | Readiness |
|---|---|---|
| `Organization` | `organizations` | High — comprehensive field mapping |
| `Specimen` | `provenance_nodes` WHERE `node_type = 'specimen'` | Medium — propertiesJSONB requires extension design |
| `ResearchStudy` | `programs` + `program_milestones` | Medium — status mapping needs validation, participant model differs |
| `DocumentReference` | `provenance_evidence` | High — near-direct field mapping |
| `Observation` | `processing_aliquots.qc_status` | Medium — multiple Kadarn tables feed one FHIR resource |

### Next Steps (Post-KPE-09)

1. Validate status mappings with domain experts
2. Design FHIR extension URLs for Kadarn-specific fields (`https://kadarn.io/fhir/StructureDefinition/*`)
3. Create FHIR `ImplementationGuide` skeleton when API exposure begins
4. Consider `Medication` / `BiologicallyDerivedProduct` for advanced specimen types
5. Evaluate `Provenance` resource for chain-of-custody (parallel to PROV mapping in KPE-05)

### References

- [FHIR R4 Organization](https://hl7.org/fhir/R4/organization.html)
- [FHIR R4 Specimen](https://hl7.org/fhir/R4/specimen.html)
- [FHIR R4 ResearchStudy](https://hl7.org/fhir/R4/researchstudy.html)
- [FHIR R4 DocumentReference](https://hl7.org/fhir/R4/documentreference.html)
- [FHIR R4 Observation](https://hl7.org/fhir/R4/observation.html)
