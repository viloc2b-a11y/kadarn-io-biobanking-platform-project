# ORP-1.6 — Automatic Knowledge Extraction

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Reduce manual questions by extracting canonical knowledge from evidence sources.  
**Gate:** At least 40% of onboarding questions are eliminated, suppressed, or downgraded to confirmation.

## Objective

Reduce questions.

Kadarn should extract institutional knowledge automatically whenever evidence can answer the question with acceptable confidence.

```text
Evidence source
  -> extraction
  -> canonical object
  -> evidence object
  -> claim candidate
  -> review only when needed
```

Not:

```text
Ask user
  -> ask again
  -> ask user to summarize uploaded evidence
```

## Extraction Targets

| Source evidence | Extracted knowledge |
|---|---|
| CLIA | `Laboratory` |
| CV | `People`, `Credentials`, `Experience` |
| FDA Form 1572 | `Investigators` |
| Medical License | `Credentials` |
| Equipment IQ/OQ/PQ | `Equipment` |
| SOP | `Capabilities` |
| Shipping SOP | `Shipping` |
| Historical Study | `Research Memory` |

## Extraction Matrix

| Evidence source | Canonical objects created or updated | Questions eliminated or downgraded |
|---|---|---|
| CLIA Certificate | `Laboratory`, `Location`, `EvidenceObject`, `ClaimCandidate` | Do you have a laboratory? Which lab certifications? CLIA number? Expiration? Testing category? |
| CV | `Person`, `PersonRoleAssignment`, `PersonEvidence`, `ClaimCandidate` | Who has experience? Credentials? Education? Board certification? Years of experience? Therapeutic expertise? |
| FDA Form 1572 | `Person[]`, `Location[]`, `Laboratory`, `EvidenceObject`, `ClaimCandidate` | Who are the investigators? Which locations/labs are involved? What study history exists? |
| Medical License | `Person`, `PersonEvidence`, `ClinicalRole`, `ClaimCandidate` | What credentials does this person have? Is the license active? When does it expire? |
| Equipment IQ/OQ/PQ | `Equipment`, `EvidenceObject`, `ClaimCandidate` | What equipment exists? Is it qualified? What is the qualification status/date? |
| SOP | `CapabilityClaim`, `EvidenceObject`, `OperationalService` where relevant | What capabilities do you have? Which process controls exist? |
| Shipping SOP | `Logistics`, `EvidenceObject`, `ClaimCandidate` | Can you ship samples? Domestic/international? Chain of custody? Packaging controls? |
| Historical Study | `TimelineEvent` / `ContinuityEvent`, `InstitutionResearchExperience`, `ClaimCandidate` | What studies have you completed? Which sponsors/CROs/phases/therapeutic areas? |

## Question Suppression Rules

| Extraction confidence | Behavior |
|---|---|
| High | Suppress the manual question and show extracted value as accepted unless review is required. |
| Medium | Pre-fill the answer and ask for confirmation. |
| Low | Ask the question, but show the evidence snippet that triggered uncertainty. |
| Conflict | Do not overwrite. Ask the user to resolve the conflict. |
| Expired evidence | Extract the object, but mark related claim weak/expired and request renewal evidence. |
| Missing required field | Ask only for the missing field, not the whole form section. |

## Extraction Flow

```text
Document / API / historical source
  -> OCR / conversion
  -> classification
  -> extraction
  -> confidence assignment
  -> entity resolution
  -> canonical object update
  -> evidence object creation
  -> claim candidate creation
  -> question suppression / confirmation / review
  -> projection update
```

## Manual Question Reduction Model

ORP-1.6 should track eliminated questions by canonical domain.

| Domain | High-value suppression examples |
|---|---|
| Organization | legal name, DBA, registration year, operating license, insurance, IRB/FWA where present. |
| People | credentials, licenses, certifications, role history, experience, therapeutic expertise, investigator roles. |
| Infrastructure | lab existence, equipment, storage, backup power, monitoring, rooms where floor plans support extraction. |
| Documents / Evidence | document type, taxonomy ID, expiration, linked entity, evidence class. |
| Memory / Continuity | study history, sponsor history, inspection/audit events, document lifecycle events. |
| Capabilities | SOP-backed capabilities, shipping, lab operations, biospecimen handling, recruitment. |

## Metrics

Track:

- total questions before ORP-1.6
- suppressed questions
- pre-filled confirmation questions
- questions still requiring manual entry
- extraction confidence distribution
- conflict count
- review completion rate
- question reduction percentage

Calculation:

```text
Question reduction %
  = (suppressed + downgraded_to_confirmation) / baseline_manual_questions
```

The gate requires at least 40%.

## UI Requirements

The user should see:

- "Kadarn extracted this from your evidence."
- source document or API source
- confidence level
- source snippet or page reference where possible
- accept / edit / reject controls
- related object and claim impact

The user should not be forced to retype information already found in evidence.

## Non-Regression Rule

ORP-1.6 must not silently mutate canonical data.

Allowed:

- suppressing high-confidence questions
- pre-filling medium-confidence fields
- asking targeted low-confidence questions
- routing conflicts to review
- marking extracted evidence as expired or weak

Not allowed:

- overwriting user-confirmed facts without review
- accepting low-confidence extraction as truth
- hiding conflicts
- removing manual entry when extraction is unavailable
- treating extracted claims as canonical without review or acceptance when required

## Deliverables

- Automatic Knowledge Extraction plan.
- Evidence-to-object extraction map.
- Question suppression rules.
- Extraction confidence policy.
- Question reduction metrics.
- Review UI requirements.

## Gate

ORP-1.6 is complete when:

- at least 40% of baseline onboarding questions are eliminated, suppressed, or downgraded to confirmation
- CLIA can create/update `Laboratory`
- CV can create/update `Person`, credentials, and experience
- FDA Form 1572 can identify investigators
- Medical License can update credentials
- Equipment IQ/OQ/PQ can create/update `Equipment`
- SOPs can create capability claim candidates
- Shipping SOP can create/update `Logistics`
- Historical Study evidence can create/update research memory
- extracted facts preserve evidence links and provenance
