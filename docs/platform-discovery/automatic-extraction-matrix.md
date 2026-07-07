# Kadarn MVP Automatic Extraction Matrix

Sprint 4 reduces onboarding friction by moving work from the user to Kadarn. If a document can produce a canonical object, field, claim, or evidence link, Kadarn should extract it instead of asking the user to type it manually.

## Operating Rule

```text
Upload Evidence -> Extract Facts -> Create/Update Canonical Objects -> Derive Claims -> Ask only for confirmation or missing facts
```

Not:

```text
Ask user -> Ask user again -> Ask user to summarize document -> Ask user to restate capability
```

The user should not be asked a question when the answer can be inferred from uploaded evidence with reasonable confidence.

## Friction Reduction Principle

| If Kadarn has... | Do not ask... | Instead extract... |
|---|---|---|
| A valid CLIA Certificate | "Do you have a laboratory?" | Laboratory, CLIA number, expiration, testing category. |
| A Medical License | "What are your credentials?" | Person credential, license number, state, expiration, specialty where available. |
| A CV | "What is your education / board certification / experience?" | Education, board certification, roles, therapeutic areas, publications, study experience. |
| FDA Form 1572 | "Who are your investigators / locations / labs?" | Investigators, roles, facility locations, IRB, laboratories. |
| SOPs | "What capabilities do you have?" | Capability claims and required evidence. |
| Equipment IQ/OQ/PQ | "What equipment do you have?" | Equipment inventory, qualification status, validation dates. |
| Shipping SOP | "Can you ship samples?" | Shipping capability, chain-of-custody process, packaging controls. |

## Extraction Pipeline

| Stage | Current MVP equivalent | Target behavior |
|---|---|---|
| Upload | `UploadedDoc` in onboarding state | Create `EvidenceSource` / `EvidenceArtifact`. |
| Convert | MarkItDown conversion to markdown | Preserve extracted text and source metadata. |
| Classify | Document taxonomy match by label | Classify document type, linked entity, capability area, expiration relevance. |
| Extract facts | Not yet formalized in onboarding | Extract structured fields and candidate entities. |
| Resolve entity | Manual today | Match or create `Institution`, `Location`, `Person`, `Laboratory`, `Equipment`. |
| Generate claims | Partially in `assemblePassport()` | Produce `CapabilityClaim` candidates with evidence links. |
| Ask confirmation | Manual form questions today | Ask only when confidence is low or conflicts exist. |
| Derive outputs | Passport/Capabilities/Readiness/Roadmap | Update readonly projections from confirmed facts and evidence. |

## Automatic Extraction Matrix

| Evidence type | Extracted canonical objects | Extracted fields | Claims enabled | Questions to suppress or downgrade |
|---|---|---|---|---|
| Business Registration | `Institution` | Legal name, DBA, registration number, jurisdiction, effective date, status. | Institution exists as legal entity. | Institution legal name, DBA, founded/registration year when present. |
| Operating License | `Institution`, `Location` | License type, license number, jurisdiction, expiration, licensed location. | Institution/location has operating authority. | Institution operating authority, location license status. |
| Certificate of Good Standing | `Institution` | Legal name, jurisdiction, status date, good-standing status. | Institution is currently active/good standing. | Current legal standing. |
| Business / Professional Liability Insurance | `Institution`, `Evidence` | Carrier, policy number, coverage type, limits, expiration. | Institution has active risk coverage. | Insurance presence, expiration, coverage summary. |
| Organizational Chart | `Institution`, `Person` | Leadership roles, departments, reporting structure, named personnel. | Institution has governance and research leadership structure. | Research leadership model, some team role coverage. |
| IRB Registration / Approval Letters | `Institution`, `Location`, `Evidence` | IRB name, registration number, protocol, approval dates, expiration, institution/site references. | Ethics oversight exists for current or historical research. | IRB presence, some study history, regulatory readiness inputs. |
| FWA Registration | `Institution` | FWA number, institution name, expiration/status, responsible official. | Federal assurance exists. | FWA presence and number. |
| State Research Licenses | `Institution`, `Location` | License number, jurisdiction, expiration, scope. | Institution/location authorized for research operations. | State license presence, expiration. |
| DEA Registration | `Person`, `Location`, `Evidence` | DEA number, registrant, schedules, address, expiration. | Controlled-substance capability exists for a person/location. | DEA credential, controlled substance readiness. |
| Medical License | `Person`, `Evidence` | Name, credential, license number, state, specialty, issue date, expiration, status. | Person has active professional qualification. | Credentials, professional license, license expiration. |
| Nursing / Pharmacy License | `Person`, `Evidence` | Credential, license number, state, expiration, status. | Person has role-specific qualification. | Credentials and role qualification. |
| Medical Board Certification | `Person`, `Evidence` | Specialty, board, certification date, expiration/status. | Person has specialty expertise. | Board certification, therapeutic/specialty expertise when available. |
| CV | `Person` | Education, credentials, positions, investigator roles, study history, publications, therapeutic areas, board certifications. | Person has experience and expertise. | Education, experience years, therapeutic expertise, publications, investigator history. |
| GCP / HSP Certificates | `Person`, `Evidence` | Name, certificate type, issuer, completion date, expiration. | Person has required research training. | GCP/HSP certification questions. |
| IATA Certificate | `Person`, `Evidence` | Name, issuer, training level, completion date, expiration. | Person can support regulated sample shipping. | IATA training status, shipping staff readiness. |
| Training Records / Matrix | `Person[]`, `Evidence` | Staff names, courses, completion dates, expiration, competency status. | Staff training coverage exists. | Individual training completion where matrix is complete. |
| Delegation Log / Delegation Procedures | `Person[]`, `Capability Claim` | Investigators, coordinators, delegated roles, start/end dates, signatures. | Research role coverage exists. | Team roles, PI/sub-I/coordinator coverage. |
| FDA Form 1572 | `Person[]`, `Location[]`, `Laboratory`, `Evidence` | Investigators, facilities, labs, IRB, protocol, sponsor, site address. | Institution has study execution history and named research team. | Investigators, roles, locations, labs, first sponsor/study where present. |
| Site Profile | `Institution`, `Location[]`, `Person[]`, `Capability Claim[]` | Site overview, experience, equipment, population, staff, contact details. | Sponsor-facing site capability profile exists. | Many Organization/People/Infrastructure summary questions. |
| Study History | `Institution`, `Timeline Event[]`, `Capability Claim[]` | Completed studies, sponsors, CROs, phases, therapeutic areas, enrollment, dates. | Institution has research track record. | Studies completed, sponsors, CROs, therapeutic areas, modalities. |
| Publication List | `Person[]`, `InstitutionResearchExperience` | Authors, topics, journals, dates, therapeutic areas. | Academic/research expertise exists. | Publications and some therapeutic expertise. |
| Sponsor References / Performance Metrics | `Institution`, `Capability Claim[]` | Sponsor names, performance measures, enrollment, cycle times, quality metrics. | Sponsor qualification and performance history exists. | Sponsor history, performance readiness. |
| CLIA Certificate | `Laboratory`, `Location`, `Evidence` | CLIA number, lab name, address, certificate type, specialties/testing categories, effective/expiration date. | Laboratory exists and has regulated testing authority. | "Do you have a laboratory?", lab certification, testing category, expiration. |
| CAP Accreditation | `Laboratory`, `Evidence` | CAP number, lab name, accreditation status, inspection/expiration dates. | Laboratory has accreditation. | Lab accreditation/certification questions. |
| Clinical Laboratory License | `Laboratory`, `Location`, `Evidence` | License number, license type, location, scope, expiration. | Laboratory is licensed. | Lab licensure questions. |
| Laboratory SOPs | `Laboratory`, `Capability Claim[]`, `Evidence` | Lab processes, sample handling procedures, QC controls, required equipment. | Lab operations and processing capabilities exist. | Lab processing capability checklist where SOP is clear. |
| Specimen Processing SOP | `Laboratory`, `Capability Claim` | Specimen types, processing steps, aliquoting, centrifugation, PBMC, storage conditions. | Sample processing and biospecimen processing capabilities exist. | Specimen processing, specimen type coverage. |
| Chain of Custody SOP | `Location`, `Laboratory`, `Capability Claim` | Custody steps, identifiers, handoffs, logs, reconciliation process. | Specimen traceability capability exists. | Chain-of-custody method questions. |
| Collection SOPs | `Location`, `Capability Claim` | Collection methods, specimen types, patient workflow, labeling controls. | Biospecimen collection capability exists. | Biospecimen collection yes/no and specimen types. |
| Storage SOPs | `Equipment[]`, `Capability Claim` | Storage temperatures, equipment types, monitoring requirements, excursion process. | Biospecimen storage capability exists. | Storage capability summary. |
| Shipping SOP / Shipping SOPs | `Location`, `Capability Claim`, `Evidence` | Domestic/international scope, carriers, packaging, dry ice, IATA requirements, chain of custody. | Domestic/international shipping capability exists. | Shipping capability questions. |
| Shipping Validation / Packaging Validation | `Capability Claim`, `Evidence` | Lane validation, packaging type, duration, temperature range, pass/fail. | Validated shipping capability exists. | Shipping validation questions. |
| Equipment Inventory | `Equipment[]`, `Location` | Equipment type, serial number, location, manufacturer, model, status. | Equipment inventory exists. | Equipment list / storage equipment questions. |
| IQ / OQ / PQ | `Equipment`, `Evidence` | Equipment ID, qualification type, date, result, protocol/report number, next due date. | Equipment is qualified and operationally ready. | Equipment qualification status. |
| Calibration Records | `Equipment`, `Evidence` | Equipment ID, calibration date, due date, result, vendor. | Equipment is calibrated. | Calibration status and renewal dates. |
| Maintenance Records / Preventive Maintenance | `Equipment`, `Evidence` | Equipment ID, maintenance date, next due, service vendor, status. | Equipment maintenance is current. | Equipment maintenance questions. |
| Temperature Logs | `Equipment`, `Evidence` | Equipment ID, temperature range, monitoring frequency, excursions, date range. | Cold chain monitoring exists. | Temperature monitoring questions. |
| Freezer / Refrigerator Qualification | `Equipment`, `Evidence` | Equipment ID, temperature range, qualification date, result, location. | Storage equipment is qualified. | Freezer/refrigerator qualification status. |
| Floor Plans / Facility Photos | `Location`, `Evidence` | Rooms, functional areas, research space, lab space, storage areas. | Facility has documented research space. | Exam/procedure room count where extractable; research space questions. |
| Emergency Plans | `Location`, `Capability Claim` | Emergency procedures, backup workflows, contact roles, response coverage. | Operational continuity capability exists. | Emergency preparedness questions. |
| Backup Generator Documentation | `Equipment`, `Location`, `Capability Claim` | Generator/UPS type, capacity, location, maintenance schedule. | Backup power capability exists. | Backup power questions. |
| Environmental Monitoring | `Location`, `Equipment`, `Evidence` | Monitoring system, parameters, locations, alerting, date range. | Facility/environment monitoring capability exists. | Monitoring coverage questions. |
| Recruitment SOP | `Institution`, `Capability Claim` | Recruitment channels, screening workflow, outreach methods, populations. | Patient/community recruitment capability exists. | Recruitment reach questions. |
| Enrollment Metrics | `Institution`, `Capability Claim` | Enrollment counts, timelines, screen-fail rate, completion metrics. | Recruitment performance evidence exists. | Performance/recruitment history questions. |
| Referral Agreements / Community Partnerships | `Institution`, `Capability Claim` | Partner names, coverage, populations, effective dates. | Referral/community recruitment network exists. | Community reach and partnership questions. |
| EMR / CTMS / eSource / EDC Documentation | `Institution`, `Capability Claim`, `Evidence` | Systems used, validation status, data capture workflows. | Technology readiness exists. | Technology platform questions. |
| System Validation | `Institution`, `Evidence` | System name, validation date, validation status, scope. | Validated system capability exists. | System validation questions. |
| Quality Manual | `Institution`, `Capability Claim`, `Evidence` | Quality system scope, governance, roles, CAPA/deviation/document control references. | Quality system maturity exists. | Quality maturity questions. |
| SOP Master Index | `Institution`, `Capability Claim[]`, `Evidence` | SOP titles, effective dates, owners, domains covered. | Procedure coverage exists across capabilities. | SOP coverage and capability checklist questions. |
| SOPs | `Capability Claim[]`, `Evidence` | Procedure domain, scope, operational steps, required roles/equipment. | Capabilities exist or require evidence confirmation. | Manual capability self-attestation. |
| CAPA / Deviation Logs / Audit Reports / Inspection Reports | `Timeline Event[]`, `Evidence`, `Capability Claim` | Event type, date, finding, severity, resolution status. | Quality/inspection history exists. | Audit/inspection history questions. |
| Insurance Certificates | `Institution`, `Evidence` | Carrier, policy, coverage, expiration. | Current insurance evidence exists. | Insurance presence and expiration. |
| Leases / Occupancy Certificate | `Location`, `Evidence` | Address, control period, expiration, occupancy type. | Location control/facility legitimacy exists. | Location proof questions. |

## Question Suppression Rules

| Rule | Behavior |
|---|---|
| High confidence extraction | Suppress the manual question and show the extracted value for review. |
| Medium confidence extraction | Pre-fill the answer and ask for confirmation. |
| Low confidence extraction | Ask the question, but show the document snippet that caused uncertainty. |
| Conflicting evidence | Do not overwrite. Show conflict: source A vs source B, ask user to resolve. |
| Expired evidence | Extract the object but mark the claim weak or expired. Ask for renewal evidence. |
| Missing required field | Ask only for the missing field, not the whole form section. |

## Examples

### CLIA Certificate

```text
Upload CLIA Certificate
  -> Evidence: CLIA Certificate
  -> Laboratory: lab name + address
  -> Fields: CLIA number, certificate type, expiration, testing category
  -> Claims: Laboratory Operations, Clinical Testing, IVD Readiness seed
  -> Suppress: "Do you have a laboratory?", "Which lab certifications do you have?"
```

### Medical License

```text
Upload Medical License
  -> Evidence: Medical License
  -> Person: clinician identity
  -> Fields: credential, license number, state, expiration, status
  -> Claims: PI Qualification, Personnel Readiness
  -> Suppress: "What are your credentials?", "Do you have a medical license?"
```

### CV

```text
Upload CV
  -> Evidence: CV
  -> Person: investigator/staff profile
  -> Fields: education, roles, experience, board certification, publications, therapeutic areas
  -> Claims: Investigator Expertise, Therapeutic Experience, Academic Readiness
  -> Suppress: "How many years of experience?", "Which therapeutic areas does this person know?"
```

### FDA Form 1572

```text
Upload 1572
  -> Evidence: FDA Form 1572
  -> People: investigators and roles
  -> Locations: facilities and labs
  -> Fields: protocol, sponsor, IRB, site address
  -> Claims: Study Execution History, Investigator Coverage, Site Operations
  -> Suppress: repeated investigator, role, location, lab questions
```

### SOP

```text
Upload SOP
  -> Evidence: SOP
  -> Extracted facts: process scope, roles, equipment, controls
  -> Claims: capability candidates
  -> Suppress: manual capability checklist items when procedure evidence is clear
```

## Object Creation Rules

| Extracted fact | Create/update |
|---|---|
| Legal name / DBA / incorporation | `Institution` |
| Address / site / facility | `Location` |
| Named individual / investigator / coordinator | `Person` |
| License/certification tied to person | `Evidence` linked to `Person` |
| CLIA/CAP/lab license | `Laboratory` + `Evidence` |
| Freezer/refrigerator/centrifuge/system | `Equipment` |
| IQ/OQ/PQ/calibration/maintenance | `Evidence` linked to `Equipment` |
| Procedure supports an operation | `Capability Claim` candidate |
| Study/sponsor/audit/inspection date | `Timeline Event` |
| Expiration date | Renewal calendar / Roadmap action |

## Human Review Rules

Automatic extraction should reduce typing, not silently create unquestioned truth.

| Condition | User experience |
|---|---|
| New entity extracted | "We found this new location/person/lab. Confirm?" |
| Existing entity matched | "We matched this evidence to Dr. Smith / Main Lab. Confirm?" |
| Multiple possible matches | "Which person/location does this evidence belong to?" |
| Conflicting value | "This document says expiration is X, another says Y. Which is current?" |
| Low-confidence claim | "This SOP may support Sample Processing. Confirm capability?" |
| High-confidence claim with evidence | "Added as supported claim. View evidence." |

## Prioritized Extraction Backlog

| Priority | Extraction target | Why first |
|---|---|---|
| P0 | CLIA/CAP/Lab License -> Laboratory | Removes core lab questions and unlocks high-value readiness/capability derivation. |
| P0 | Medical Licenses/CVs -> Person | Removes credential and PI/staff profile friction. |
| P0 | Uploaded document classification -> Evidence type/entity/capability | Required before reliable suppression or prefill. |
| P1 | FDA Form 1572 -> investigators/locations/labs | Collapses many People + Location questions. |
| P1 | GCP/HSP/IATA certificates -> Person certifications | Removes certification entry work and powers renewal calendar. |
| P1 | Equipment inventory + IQ/OQ/PQ -> Equipment | Removes equipment inventory and qualification questions. |
| P1 | SOP Master Index/SOPs -> Capability claims | Converts procedure documents into claim candidates. |
| P2 | Shipping SOP/Validation -> Shipping capability | Removes logistics questions and strengthens biospecimen readiness. |
| P2 | Study history/site profile -> research history | Reduces therapeutic/modality/history questions. |
| P2 | Audit/inspection/CAPA/deviation logs -> timeline and quality maturity | Strengthens Memory and Readiness. |

## Implementation Recommendation

1. Keep document upload as the first low-friction entry point.
2. Classify uploaded documents against `DOCUMENT_TAXONOMY`.
3. Extract facts into a review buffer, not directly into final truth.
4. Resolve facts to canonical objects.
5. Generate capability claim candidates with evidence links.
6. Suppress or prefill questions that the extraction answers.
7. Ask only for missing, conflicting, or low-confidence facts.

## Acceptance Check

Sprint 4 is complete when:

- Uploading a high-value document can create or update canonical objects.
- Onboarding can suppress or prefill questions based on extracted evidence.
- Extracted facts link back to source evidence.
- Capability claims are generated from extracted facts, not manual self-attestation alone.
- Users confirm uncertain facts instead of retyping known information.
- The product visibly shifts work from the user to Kadarn's extraction pipeline.
