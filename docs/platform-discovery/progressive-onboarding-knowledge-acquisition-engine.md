# Kadarn MVP Progressive Onboarding

Sprint 10 converts onboarding from a long form-completion session into a progressive Knowledge Acquisition Engine. The institution should not be asked to complete everything before receiving value. Kadarn should produce a first Passport quickly, then enrich the institutional asset over time through people, infrastructure, documents, memory, APIs, public evidence, sponsor signals, and feedback.

Target model:

```text
Level 1: Identity
  -> First Passport
  -> 5 minutes

Level 2: People + Infrastructure
  -> Capability Expansion
  -> 15 minutes

Level 3: Documents
  -> Evidence Expansion
  -> When the user has time

Level 4: Memory
  -> Historical Intelligence
  -> Over weeks

Level 5: Automatic Evidence
  -> APIs + Sponsors + CT.gov + PubMed + Feedback
  -> Without user intervention
```

This is the operating model that turns the previous nine sprints into one product direction: onboarding is not a form. It is progressive institutional knowledge acquisition.

## Design Rule

```text
Minimum user input
  -> First useful institutional read model
  -> Progressive enrichment
  -> Evidence extraction
  -> Historical continuity
  -> Automatic evidence acquisition
  -> Continuously improving Passport / Capabilities / Readiness / Roadmap
```

Never:

```text
Ask everything
  -> Wait 102 minutes
  -> Generate value only after completion
```

Kadarn should ask only what it cannot infer from evidence, prior knowledge, documents, APIs, public sources, sponsor interactions, or historical continuity.

## Current Problem

The current onboarding journey still behaves like a single-session interview. The modules are organized as:

- Welcome
- Organization
- People
- Infrastructure
- Documents
- Memory
- Capabilities
- Readiness
- Passport
- Roadmap

The structure is cleaner than the original form set, but it still implies a large completion burden before the institution feels "done." Even the fast-track layer still names legacy projection fields like `people_pi_name`, `people_roles`, `people_certs`, `infra_has_lab`, `infra_has_biospecimen`, and `docs_uploaded_count`.

That mental model conflicts with the Evidence Blueprint:

- documents can infer objects
- evidence can generate claims
- memory can produce continuity signals
- APIs can enrich the profile
- derived pages should update continuously
- users should confirm only uncertainty and missing facts

## Progressive Levels

| Level | User input | Time target | Output | Product meaning |
|---|---|---:|---|---|
| Level 1 | Identity | 5 minutes | First Passport | Kadarn knows who the institution is and can generate a minimal current snapshot. |
| Level 2 | People + Infrastructure | 15 minutes | Capability Expansion | Kadarn can identify early capability claims and staffing/infrastructure support. |
| Level 3 | Documents | User-paced | Evidence Expansion | Kadarn turns source files into evidence objects, extracted facts, and claim candidates. |
| Level 4 | Memory | Over weeks | Historical Intelligence | Kadarn reconstructs temporal continuity across the institution. |
| Level 5 | Automatic Evidence | No manual session | Continuous Enrichment | Kadarn ingests external/public/sponsor/feedback signals automatically. |

## Level 1 — Identity to First Passport

Goal: generate the first useful Passport in five minutes.

Level 1 should capture only the minimum identity needed to create a current institutional snapshot.

Inputs:

- institution name
- institution type
- primary location or operating region
- research portfolio summary
- contact / owner
- optional website or public identifier

Outputs:

- Passport Level 1
- basic institution identity
- initial research portfolio label
- initial roadmap gaps
- clear next action

Do not ask:

- full people roster
- full infrastructure inventory
- full document taxonomy
- detailed certifications
- memory history
- equipment details

Level 1 is success when the institution can see:

> This is my first Kadarn institutional asset.

## Level 2 — People + Infrastructure to Capability Expansion

Goal: expand from identity into capability claims in about 15 minutes.

Level 2 should capture enough people and infrastructure information to infer initial capabilities, but not attempt to complete every field.

Inputs:

- key research leadership
- minimal team coverage
- role coverage by function
- primary facility/lab/storage/logistics signals
- major operational services
- known gaps

Outputs:

- early capability map
- people-supported claims
- infrastructure-supported claims
- readiness starter profile
- roadmap actions for missing roles/evidence

This level uses Sprint 7 and Sprint 8:

```text
Person
  -> Research / Clinical / Operational Role
  -> Capability Contribution

Facility
  -> Laboratory / Equipment / Storage / Utilities / Logistics / Services
  -> Capability Support
```

Do not ask users to prove everything yet. Ask for enough to create a useful map, then tell them which evidence will strengthen it.

## Level 3 — Documents to Evidence Expansion

Goal: let users enrich the institution when they have time.

Level 3 is not a Dropbox. It is the Evidence Pipeline from Sprint 5.

Inputs:

- source documents
- optional document metadata
- review/confirmation of extracted facts
- conflict resolution when needed

Outputs:

- evidence sources
- machine-readable artifacts
- extracted facts
- entity resolution candidates
- evidence objects
- claim candidates
- confidence graph relationships
- evidence-backed Passport updates

Core behavior:

```text
Upload
  -> OCR / Conversion
  -> Extraction
  -> Evidence Objects
  -> Extracted Facts
  -> Claim Candidates
  -> Confidence Graph
  -> Derived outputs
```

Manual questions should be suppressed when documents answer them with high confidence.

## Level 4 — Memory to Historical Intelligence

Goal: build institutional continuity over weeks, not in a single session.

Level 4 uses Sprint 9's Institution Continuity Model. Memory should not be a required onboarding burden. It should become historical intelligence that accumulates through user input, documents, sponsor interactions, inspections, and system events.

Inputs:

- historical context
- timeline corrections
- confirmation of derived continuity events
- inspection/audit outcomes
- sponsor/study history
- relationship milestones

Outputs:

- institution timeline
- capability timeline
- evidence timeline
- document timeline
- people timeline
- relationship timeline
- sponsor timeline
- inspection timeline
- technology timeline
- growth timeline

Continuity signals:

- stable over time
- recently established
- renewed recently
- decay risk
- contradicted
- remediated
- externally confirmed
- continuity gap

Level 4 is success when Kadarn can explain how the institution became what it is today.

## Level 5 — Automatic Evidence to Continuous Enrichment

Goal: enrich the institutional asset without requiring user sessions.

Level 5 turns Kadarn from onboarding software into an institutional evidence acquisition engine.

Sources:

- Kadarn APIs
- sponsor feedback
- sponsor qualification activity
- ClinicalTrials.gov
- PubMed
- Crossref / OpenAlex
- ORCID / ROR
- FDA / public registries
- inspection and accreditation sources where available
- CTMS / eReg / LIMS / EMR integrations where authorized
- marketplace and relationship signals

Outputs:

- new evidence candidates
- updated claims
- continuity events
- sponsor corroboration signals
- public evidence links
- roadmap updates
- confidence explanations

User role:

- review conflicts
- confirm uncertain matches
- authorize integrations
- respond to counter-evidence

Kadarn should do the rest.

## Knowledge Acquisition Engine

The final onboarding model after Sprint 10:

```text
User answers only unknowns
Documents produce evidence
Evidence produces facts
Facts produce canonical objects
Objects produce claims
Claims produce capabilities
Capabilities produce readiness
Readiness produces roadmap
Continuity explains change over time
APIs continuously enrich the graph
Passport remains the current snapshot
```

This replaces:

```text
Organization form
  -> People form
  -> Infrastructure form
  -> Documents checklist
  -> Memory list
  -> Derived pages
```

with:

```text
Progressive acquisition
  -> Evidence graph
  -> Continuously improving institutional asset
```

## Level-to-Sprint Alignment

| Level | Depends on | Sprint alignment |
|---|---|---|
| Level 1 | Identity, Organization v2, first Passport | Sprint 6 plus Passport current snapshot work. |
| Level 2 | People Knowledge Model, Infrastructure Graph | Sprint 7 and Sprint 8. |
| Level 3 | Evidence Pipeline, Automatic Extraction | Sprint 4 and Sprint 5. |
| Level 4 | Institution Continuity Model | Sprint 9. |
| Level 5 | Master plan evidence connectors, external APIs, sponsor feedback | PCP master plan, Evidence Core, Discovery, connector backlog. |

## Page Model

The product should stop presenting onboarding as one long checklist. It should present levels of institutional maturity.

```text
Start
  -> Create First Passport
  -> Expand Capabilities
  -> Add Evidence
  -> Build Continuity
  -> Connect Automatic Evidence
```

Each level should show:

- what Kadarn already knows
- what Kadarn inferred
- what needs confirmation
- what evidence is missing
- what output improves after completion
- how long the next step should take

## Fast-Track Replacement

The current fast-track should move away from legacy flat fields.

Replace:

- `people_pi_name`
- `people_pi_experience`
- `people_roles`
- `people_certs`
- `infra_has_lab`
- `infra_has_biospecimen`
- `infra_backup_power`
- `docs_uploaded_count`

With level gates:

| Gate | Canonical check |
|---|---|
| First Passport | `Institution` identity exists and has minimal research profile. |
| Capability Expansion | At least one `PersonRoleAssignment` and one infrastructure object support claims. |
| Evidence Expansion | At least one `EvidenceObject` or accepted extracted fact supports a claim. |
| Historical Intelligence | At least one `ContinuityEvent` links to a claim, evidence, person, or infrastructure object. |
| Automatic Evidence | At least one authorized connector/integration/public source contributes candidates. |

## Product Copy Model

Old:

> Complete onboarding.

New:

> Build your institution's evidence asset in stages.

Old:

> Answer all questions.

New:

> Answer only what Kadarn cannot infer.

Old:

> Upload documents.

New:

> Add evidence sources so Kadarn can extract facts and strengthen claims.

Old:

> Finish your profile.

New:

> Improve your Passport, capabilities, readiness, and roadmap over time.

## Derived Outputs by Level

| Output | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
|---|---|---|---|---|---|
| Passport | First snapshot | Better team/facility detail | Evidence-backed | Continuity context | Automatically refreshed |
| Capabilities | Initial inferred list | People/infrastructure support | Evidence-backed support | Maturity over time | External corroboration |
| Readiness | Rough starter profile | Operational starter profile | Evidence-based gaps | Continuity risk/maturity | Live readiness updates |
| Roadmap | Next obvious gaps | Role/facility/service gaps | Evidence gaps | Renewal/history gaps | Connector/API-driven actions |
| Memory | Not required | Not required | Document lifecycle seeds | Continuity graph | Automatic continuity updates |

## Implementation Plan

### Slice 1 — Document the level model

Create this Progressive Onboarding architecture document and align future onboarding changes to it.

### Slice 2 — Update journey metadata

Change `ONBOARDING_JOURNEY` from a linear module list into level-aware metadata:

- level
- time target
- primary output
- required canonical checks
- optional enrichment paths

### Slice 3 — Replace fast-track gates

Update `fast-track.ts` to stop checking projection fields and instead evaluate canonical objects and evidence graph read models.

### Slice 4 — Add level-aware UI

Show:

- Level 1: Create First Passport
- Level 2: Expand Capabilities
- Level 3: Add Evidence
- Level 4: Build Continuity
- Level 5: Connect Automatic Evidence

### Slice 5 — Suppress inferable questions

Use the Automatic Extraction Matrix to suppress, prefill, or confirm questions based on evidence confidence.

### Slice 6 — Add connector-ready backlog

Prepare Level 5 around authorized evidence sources:

- CT.gov
- PubMed
- ROR / ORCID
- sponsor feedback
- accreditation and inspection sources
- internal APIs/integrations

## Acceptance Check

Progressive Onboarding is complete when:

- The first useful Passport can be generated in about 5 minutes.
- People and Infrastructure expand capability claims without requiring full completion.
- Documents are optional evidence expansion, not a blocking checklist.
- Memory is long-running historical intelligence, not a required onboarding step.
- Automatic evidence can enrich the graph without user data entry.
- Onboarding progress is measured by institutional knowledge maturity, not percent of form completion.
- Users answer only unknowns, conflicts, and low-confidence facts.
- Capabilities, Readiness, Passport, Roadmap, and Continuity improve continuously as evidence arrives.

## Final Sprint Outcome

After Sprints 1-10, Kadarn onboarding should no longer be a 102-minute form.

It should be a Knowledge Acquisition Engine:

```text
First value in 5 minutes.
Capability expansion in 15 minutes.
Evidence expansion when available.
Historical intelligence over weeks.
Automatic enrichment continuously.
```

The institution builds an evidence-based institutional asset instead of completing a questionnaire.
