# Kadarn MVP Canonical Data Model Mapping

Sprint 2 converts onboarding from form capture into progressive institutional knowledge acquisition. A question is valid only if it creates or updates a canonical object, a capability claim, an evidence object, or a timeline event.

## Operating Rule

```text
Question -> Canonical Object or Claim -> Evidence Link -> Derived Projection
```

If a question does not create one of these, it should not exist:

- `Institution`
- `Location`
- `Person`
- `Equipment`
- `Laboratory`
- `Capability Claim`
- `Evidence`
- `Timeline Event`

Documents are not the unit of truth. Forms are not the unit of truth. The operational unit is a claim about an institution, site, person, lab, equipment, or capability, supported by evidence.

## Canonical Object Model

| Object | Purpose | Created by | Not created by | Derived projections |
|---|---|---|---|---|
| `Institution` | Legal/institutional identity and operating profile. | Organization identity questions. | Passport, Readiness, Capabilities. | Passport identity, sponsor profile, roadmap sponsor qualification, memory founding event. |
| `Location` | Physical or operational unit where work happens. | Institutional Locations editor. | Infrastructure summary fields. | Primary location, location count, multi-site readiness, location history. |
| `Person` | Research team member, PI, coordinator, lab staff, regulatory staff, etc. | Research Team editor. | Flat PI fields or team summary fields. | PI projection, team summary, certification gaps, people readiness. |
| `Equipment` | Operational device, freezer, storage unit, monitoring system, or infrastructure asset. | Location infrastructure details. | Global storage/equipment summary. | Equipment readiness, biospecimen storage capability, renewal tasks. |
| `Laboratory` | Location-scoped lab or processing capability. | Location infrastructure details. | Global `infra_has_lab` flag. | Lab capability, IVD readiness, sample processing claims. |
| `Capability Claim` | Assertion that the institution/site/person/lab can do something. | Derivation from canonical objects plus supporting evidence. | Direct user input on Capabilities page. | Capability map, Passport capabilities, Readiness, Roadmap. |
| `Evidence` | Document, extracted fact, certification, license, or record that supports or weakens a claim. | Document upload, staff certification, license metadata, future extraction pipeline. | Capability or readiness score alone. | Evidence coverage, proof list, missing evidence, document history. |
| `Timeline Event` | Historical fact that explains institutional evolution. | Explicit Memory event or derived event from canonical changes. | Passport snapshot. | Institutional Memory only. |

## Screen-to-Object Mapping

| Current screen | Valid canonical objects created | Derived objects it must not directly capture |
|---|---|---|
| Organization | `Institution`, `Location`, initial research experience claims, operational footprint claims. | Passport identity, readiness score, capability strength, location count. |
| People | `Person`, person-scoped certifications as `Evidence`, person-role claims. | PI summary, total team count, institutional certifications. |
| Infrastructure | `Location`-scoped `Laboratory`, `Equipment`, infrastructure claims. | Global lab flag, global biospecimen flag, global storage summary. |
| Documents | `Evidence`; eventually extracted facts and candidate claim support. | Capability result, readiness score, Passport section content. |
| Memory | `Timeline Event`; may link existing `Evidence`. | Current Passport identity or readiness. |
| Capabilities | No primary objects. Read-only projection of `Capability Claim[]`. | New inputs. |
| Readiness | No primary objects. Read-only projection from claims and evidence. | New inputs. |
| Passport | No primary objects. Current snapshot projection. | New inputs or historical narrative. |
| Roadmap | No primary objects by default. Future `StrategicGrowthGoal` may be a primary planning object. | Claims, evidence, readiness scores. |

## Question Validity Test

Every onboarding question should pass all four checks:

1. **Object:** Which canonical object does this create or update?
2. **Claim:** What claim can be derived from this answer?
3. **Evidence:** What evidence supports, weakens, or is required for the claim?
4. **Projection:** Which derived surfaces consume it?

If the answer to check 1 is "none" and the answer to check 2 is also "none", remove the question.

## Current Input Mapping

### Organization

| Current input | Canonical target | Claim created or enabled | Evidence needed | Derived consumers |
|---|---|---|---|---|
| `org_name` | `Institution.name` | Institution exists under this name. | Business registration, operating license. | Passport, Evidence, Memory, Roadmap. |
| `org_dba` | `Institution.aliases[]` | Institution may operate under alternate name. | DBA registration. | Passport, evidence matching. |
| `org_type` | `Institution.type` | Institution belongs to an operating category. | Business registration, license, profile evidence. | Passport, eligibility, roadmap. |
| `org_mission` | `Institution.profile.mission` | Institution declares mission. | Optional public profile or institutional document. | Passport narrative only. |
| `org_founded_year` | `Institution.foundedDate` | Institution has historical continuity. | Incorporation record, institutional profile. | Memory, Passport identity. |
| `org_research_focus` | `Capability Claim` seed on `Institution` | Institution actively performs selected research programs/capabilities. | Program records, contracts, IRB approvals, SOPs. | Capabilities, Readiness, Passport, Roadmap. |
| `org_therapeutic_areas` | `InstitutionResearchExperience.therapeuticAreas` | Institution has experience in selected therapeutic areas. | Study history, publications, sponsor records. | Passport, sponsor matching, Memory. |
| `org_research_modalities` | `InstitutionResearchExperience.modalities` | Institution can execute selected research modalities. | Protocol history, registry records, program documents. | Capabilities, Readiness, Roadmap. |
| `org_locations` | `Location[]` | Institution operates from these locations. | Site license, address proof, facility documents. | Infrastructure, Passport, Memory, Roadmap. |
| `org_operational_coverage` | `InstitutionOperationalFootprint.coverage` | Institution operates at this geographic scale. | Recruitment records, site network documents. | Readiness, Roadmap, sponsor matching. |
| `org_active_regions` | `InstitutionOperationalFootprint.regions[]` | Institution can operate in selected regions. | Recruitment logs, contracts, site network evidence. | Readiness, Roadmap. |
| `org_countries` | `InstitutionOperationalFootprint.countries[]` | Institution can support work in selected countries. | Regulatory licenses, operational records. | Sponsor matching, logistics readiness. |
| `org_recruitment_reach` | `Capability Claim` seed | Institution can recruit from selected populations/channels. | Recruitment metrics, referral agreements. | Capabilities, Readiness, Roadmap. |
| `org_sample_logistics` | `Capability Claim` seed | Institution can coordinate sample logistics. | Courier contracts, SOPs, IATA certificates. | Capabilities, Roadmap. |
| `org_operational_assets` | `Capability Claim` seed | Institution has selected operational assets. | Asset records, contracts, equipment records. | Capabilities, Readiness. |
| `org_languages` | `Institution.languageCoverage[]` | Institution can operate in selected languages. | Staff language records, translation SOPs. | Passport, readiness, sponsor matching. |
| `org_time_zones` | `InstitutionOperationalFootprint.timeZones[]` | Institution can coordinate across selected time zones. | Location records. | Logistics readiness, sponsor matching. |

Fields such as `org_street`, `org_city`, `org_state`, `org_country`, `org_zip`, `org_time_zone`, and `org_geographic_reach` should be projections from `Location[]` and operational footprint, not primary inputs.

### People

| Current input | Canonical target | Claim created or enabled | Evidence needed | Derived consumers |
|---|---|---|---|---|
| `people_research_leadership_role` | `Institution.researchLeadershipModel` or `Person.role` context | Institution has a leadership model for research operations. | Organizational chart, CVs. | Passport, Readiness. |
| `people_team_members[].firstName/lastName` | `Person.name` | Person exists as part of the institutional research team. | CV, HR roster, delegation log. | Passport team, Memory, Roadmap. |
| `people_team_members[].credentials` | `Person.credentials` | Person has professional credentials. | License, CV, credential document. | Passport, people readiness. |
| `people_team_members[].primaryRole` | `Person.primaryRole` | Person performs this role. | Delegation log, job description. | Capability derivation, readiness. |
| `people_team_members[].email/phone` | `Person.contact` | Person is contactable for research operations. | Internal roster. | Operations only. |
| `people_team_members[].primaryLocationId` | `Person.locationAssignment` | Person is associated with a location. | Staff roster, delegation log. | Location readiness, Passport. |
| `people_team_members[].languages` | `Person.languages[]` | Person supports selected languages. | Staff profile, certification where applicable. | Language coverage, readiness. |
| `people_team_members[].researchRoles` | `Person.researchRoles[]` | Institution has coverage for these research roles. | Delegation log, CVs. | Capabilities, Readiness, Passport. |
| `people_team_members[].isPrincipalInvestigator` | `Person.roleFlag` | Person can be projected as PI. | CV, license, delegation log. | Passport PI summary, sponsor qualification. |
| `people_team_members[].therapeuticExpertise` | `Person.expertise[]` | Person has therapeutic expertise. | CV, publications, study history. | Sponsor matching, readiness. |
| `people_team_members[].yearsExperience` | `Person.experience` | Person has research experience. | CV, study records. | PI projection, readiness. |
| `people_team_members[].phaseExperience` | `Person.phaseExperience[]` | Person has phase/modal experience. | Study history, delegation logs. | Readiness, Roadmap. |
| `people_team_members[].certifications[]` | `Evidence` attached to `Person` | Person holds a certification/license/training record. | Certificate, license, expiration metadata. | Compliance, Passport evidence, Roadmap renewals. |

Fields such as `people_pi_name`, `people_pi_experience`, `people_roles`, `people_certs`, `people_languages`, and `people_total_team` should be projections from `Person[]`.

### Infrastructure

| Current input | Canonical target | Claim created or enabled | Evidence needed | Derived consumers |
|---|---|---|---|---|
| `infra_location_infrastructure[].locationId` | Link to `Location` | Infrastructure belongs to a location. | Location record. | All infrastructure projections. |
| `facilityType` | `Location.operationalFacilityType` | Location supports this facility function. | Facility license, lease, photos, inspection. | Passport, Readiness. |
| `dedicatedResearchSpace` | `Location.researchSpace` | Location has research space. | Floor plan, SOP, photos. | Operational readiness. |
| `examRooms` | `Location.clinicalCapacity.examRooms` | Location has exam capacity. | Facility inventory. | Clinical trial readiness. |
| `infusionCapability` | `Capability Claim` on `Location` | Location can support infusion. | SOP, equipment records, staff qualifications. | Capability map, early phase readiness. |
| `procedureRooms` | `Location.clinicalCapacity.procedureRooms` | Location has procedure capacity. | Facility inventory. | Readiness. |
| `overnightEarlyPhaseCapacity` | `Capability Claim` on `Location` | Location can support early phase overnight requirements. | Protocols, staffing, emergency readiness evidence. | Strategic Growth Roadmap. |
| `backupPower` | `Equipment` or `InfrastructureAsset` | Location has backup power. | Maintenance records, generator/UPS records. | Operational readiness, biospecimen reliability. |
| `laboratoryPresent` | `Laboratory` | Location contains a laboratory. | CLIA/CAP/COLA, lab license. | Lab capabilities, IVD readiness. |
| `pharmacyPresent` | `LocationService` or `Capability Claim` | Location can support pharmacy operations. | Pharmacy license, SOP. | Study readiness. |
| `imagingPresent` | `LocationService` or `Capability Claim` | Location can support imaging. | Equipment records, imaging agreements. | Capability matching. |
| `biospecimenProcessingPresent` | `Laboratory.processingCapability` | Lab can process biospecimens. | SOP, training records. | Biospecimen readiness. |
| `storageEquipment[]` | `Equipment[]` | Location has storage assets. | Equipment qualification, calibration, maintenance. | Storage capability, Roadmap. |
| `temperatureMonitoring` | `Equipment.monitoring` | Storage has monitoring controls. | Monitoring logs, alarm validation. | Biospecimen readiness. |
| `shippingCapability` | `Capability Claim` on `Location` | Location can ship samples. | Courier contracts, IATA certificate, SOP. | Logistics capability, Roadmap. |
| `biospecimenOperations[]` | `Capability Claim[]` | Location can collect/process/store/ship/track biospecimens. | SOPs, logs, equipment, training. | Biospecimen capability, Readiness. |

Fields such as `infra_has_lab`, `infra_has_biospecimen`, `infra_backup_power`, `infra_storage_equip`, `infra_temp_monitoring`, `infra_specimen_types`, and `infra_location_count` should be projections.

### Documents

| Current input | Canonical target | Claim created or enabled | Evidence needed | Derived consumers |
|---|---|---|---|---|
| Uploaded file | `Evidence` | Evidence exists and can support one or more claims. | File metadata, extracted text, source/version, provenance. | Passport, Capabilities, Readiness, Memory, Roadmap. |
| `UploadedDoc.label` | `Evidence.title` | Evidence can be referenced. | File name or user label. | Evidence library, Passport. |
| `UploadedDoc.type` | `Evidence.type` | Evidence category is known. | Taxonomy classification. | Document taxonomy, readiness. |
| `UploadedDoc.expiresAt` | `Evidence.validity.expiresAt` | Evidence may expire. | Certificate/license metadata. | Renewal calendar, Roadmap. |
| `UploadedDoc.evidenceClass` | `Evidence.class` | Evidence has trust strength. | KEMS/evidence classification. | Confidence, Passport proof. |
| `UploadedDoc.proves` | `Evidence.supports[]` | Evidence supports claim categories. | Extraction/linking review. | Claim support, Readiness. |
| `UploadedDoc.markdown` | `EvidenceArtifact.extractedText` | Evidence has machine-readable content. | Conversion pipeline. | Future Fact -> ClaimCandidate chain. |

`docs_uploaded_count` should be calculated from `Evidence[]`.

### Memory

| Current input | Canonical target | Claim created or enabled | Evidence needed | Derived consumers |
|---|---|---|---|---|
| `memory_events[].date` | `TimelineEvent.date` | A historical event occurred at a point in time. | Optional linked evidence. | Institutional Memory. |
| `memory_events[].title` | `TimelineEvent.title` | Historical event can be referenced. | Optional linked evidence. | Institutional Memory. |
| `memory_events[].domain` | `TimelineEvent.domain` | Event belongs to a knowledge domain. | Optional linked evidence. | Memory filters. |
| `memory_events[].description` | `TimelineEvent.description` | Historical context is captured. | Optional linked evidence. | Memory narrative. |
| `memory_events[].linkedEvidence` | `TimelineEvent.evidenceLinks[]` | Event is supported by evidence. | Evidence object references. | Memory confidence. |

Memory should not create Passport identity, current readiness, or current capabilities. It is a historical layer.

## Capability Claim Mapping

Capability claims should not be free-form form answers. They should be assertions derived from canonical objects and evidence.

| Capability claim | Subject | Derived from | Required evidence examples |
|---|---|---|---|
| Clinical Research Operations | `Institution` | `org_research_focus`, `Person[]`, staff roles | Delegation log, study history, SOPs. |
| Patient Recruitment | `Institution` or `Location` | operational footprint, recruitment reach, research space | Recruitment metrics, referral agreements. |
| Sample Processing | `Laboratory` | lab presence, biospecimen processing, processing operations | CLIA/CAP/COLA, SOPs, processing logs. |
| PBMC Processing | `Laboratory` | biospecimen operations + processing detail | PBMC SOP, training record, equipment record. |
| Flow Cytometry | `Laboratory` | lab capability/equipment | Instrument records, SOP, validation. |
| Molecular Testing | `Laboratory` | molecular/PCR/DNA/RNA capability | Validation records, lab license, equipment records. |
| Biospecimen Storage | `Location` or `Equipment[]` | storage equipment, backup power, monitoring | Equipment qualification, temperature logs. |
| Biospecimen Collection | `Location` | biospecimen operations | Collection SOP, staff training, chain-of-custody logs. |
| Domestic Shipping | `Location` | shipping capability | Courier SOP, shipping records. |
| International Shipping | `Location` | international shipping + IATA evidence | IATA certificates, carrier agreements. |
| Multi-Site Operations | `Institution` | multiple `Location[]` with infrastructure/person coverage | Location records, staffing, SOPs. |
| IVD Readiness | `Laboratory` + `Institution` | molecular/sample processing + quality docs | Quality manual, validation records, lab certificates. |
| Early Phase Readiness | `Location` | early phase capacity, staffing, monitoring, emergency readiness | Protocols, equipment, medical oversight, emergency SOPs. |

## Evidence Blueprint Alignment

The onboarding path should eventually align with this chain:

```text
Evidence Source
  -> Evidence Artifact
  -> Extracted Fact
  -> Claim Candidate
  -> Capability Claim
  -> Published View / Passport / Readiness / Roadmap
```

MVP onboarding can still be local-state based, but the mental model should match the future architecture:

| MVP object | Evidence Blueprint equivalent |
|---|---|
| `uploadedDocs[]` | Evidence Source + Evidence Artifact |
| `UploadedDoc.markdown` | Extracted artifact text |
| User-entered canonical facts | Manual extracted facts pending review |
| Derived capability | Claim Candidate / Capability Claim |
| Supporting evidence list | Evidence node relationships |
| Passport | Published View |
| Readiness | Confidence/readiness projection |
| Roadmap | Gap/action projection from claim state |
| Memory | Timeline projection with evidence links |

## Questions That Should Be Removed or Reframed

| Current pattern | Decision |
|---|---|
| "What is your team count?" | Remove. Derive from `Person[]`. |
| "Who is your PI?" as a separate flat answer | Reframe. Mark a `Person` as PI. |
| "Which certifications does your institution hold?" | Remove. Certifications belong to `Person`, `Laboratory`, `Equipment`, or `Institution` evidence. |
| "How many locations do you have?" | Remove. Derive from `Location[]`. |
| "Do you operate a lab?" | Reframe. Create a `Laboratory` at a `Location`. |
| "Do you have backup power?" globally | Reframe. Add backup power as location-scoped `Equipment` or infrastructure asset. |
| "Do you handle biospecimens?" globally | Reframe. Add biospecimen operations at a `Location` or `Laboratory`. |
| "How many documents uploaded?" | Remove. Derive from `Evidence[]`. |
| Any field only used to fill Passport text | Remove. Passport is a projection. |
| Any field only used to fill Readiness text | Remove. Readiness is a projection. |

## Target State Shape

The MVP does not need to implement this exact storage shape immediately, but this is the canonical mental model:

```typescript
interface InstitutionalKnowledgeBase {
  institution: Institution
  locations: Location[]
  people: Person[]
  laboratories: Laboratory[]
  equipment: Equipment[]
  evidence: Evidence[]
  capabilityClaims: CapabilityClaim[]
  timelineEvents: TimelineEvent[]
}
```

```typescript
interface CapabilityClaim {
  id: string
  subjectType: 'Institution' | 'Location' | 'Person' | 'Laboratory' | 'Equipment'
  subjectId: string
  capability: string
  status: 'candidate' | 'supported' | 'weak' | 'unsupported'
  supportingEvidenceIds: string[]
  missingEvidence: string[]
  derivedFrom: string[]
}
```

## Implementation Order

1. Introduce canonical model names in code and documentation.
2. Split persisted onboarding state into canonical objects and derived projections.
3. Replace flat `people_*`, `infra_*`, and `docs_*` progress checks with object completion checks.
4. Convert legacy flat answer keys into a compatibility adapter only.
5. Make every visible question declare its canonical target and claim/evidence effect.
6. Keep Capabilities, Readiness, Passport, Memory, and Roadmap as projections.

## Acceptance Check

Sprint 2 is complete when reviewers can inspect any onboarding question and answer:

- Which canonical object does this create or update?
- Which claim can Kadarn derive from it?
- Which evidence supports or is required for that claim?
- Which downstream projection consumes it?

If any question cannot answer those four questions, it should be removed or reframed.
