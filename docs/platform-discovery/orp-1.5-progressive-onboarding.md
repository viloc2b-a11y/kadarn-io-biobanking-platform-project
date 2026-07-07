# ORP-1.5 — Progressive Onboarding

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Replace the long single-session onboarding flow with progressive levels of institutional knowledge maturity.  
**Gate:** First Passport generated in less than 10 minutes.

## Objective

Eliminate the 102-minute onboarding model.

Onboarding should not require the user to complete Organization, People, Infrastructure, Documents, and Memory before receiving value. Kadarn should generate a first Passport quickly, then deepen capabilities, evidence, readiness, continuity, and automation over time.

## Level Model

```text
Level 1
  Identity
  -> Initial Passport

Level 2
  People
  Infrastructure
  -> Capabilities

Level 3
  Evidence
  -> Readiness

Level 4
  Memory
  -> Continuity

Level 5
  Automation
  -> APIs
  -> Feedback
  -> Historical ingestion
```

## Current Problem

Current onboarding metadata still presents a mostly linear path:

```text
Welcome
  -> Organization
  -> People
  -> Infrastructure
  -> Documents
  -> Memory
  -> Capabilities
  -> Readiness
  -> Passport
  -> Roadmap
```

The current estimated journey is too long for MVP value. The old fast-track also depends on flat legacy fields such as:

- `people_pi_name`
- `people_pi_experience`
- `people_roles`
- `people_certs`
- `infra_has_lab`
- `infra_has_biospecimen`
- `infra_backup_power`
- `docs_uploaded_count`

ORP-1.5 must replace this with canonical maturity levels.

## Level Definitions

| Level | Input focus | Output | Time target | Gate |
|---|---|---|---:|---|
| Level 1 | Identity | Initial Passport | < 10 minutes | Institution identity and minimal research profile can produce Passport. |
| Level 2 | People + Infrastructure | Capabilities | ~15 minutes | People/infrastructure objects support initial claims. |
| Level 3 | Evidence | Readiness | User-paced | Evidence objects support or weaken claims. |
| Level 4 | Memory | Continuity | Over weeks | Continuity events link to claims, evidence, people, or infrastructure. |
| Level 5 | Automation | APIs + Feedback + Historical ingestion | Continuous | Authorized sources generate candidates without manual data entry. |

## Level 1 — Identity → Initial Passport

Purpose:

Create value immediately.

Minimum canonical inputs:

- `Institution.name`
- `Institution.type`
- minimal research profile
- primary location or operating region
- contact / owner

Output:

- Initial Passport
- initial gaps
- next recommended level

Not required:

- full people roster
- infrastructure inventory
- document upload
- memory/history
- full readiness scoring

## Level 2 — People + Infrastructure → Capabilities

Purpose:

Expand from identity into credible capability claims.

Canonical inputs:

- `Person`
- `PersonRoleAssignment`
- `Facility`
- `Laboratory`
- `Equipment`
- `Storage`
- `Utilities`
- `Logistics`
- `OperationalService`

Output:

- capability candidates
- person-supported claims
- infrastructure-supported claims
- gaps for evidence expansion

## Level 3 — Evidence → Readiness

Purpose:

Turn assertions into evidence-backed readiness.

Canonical inputs:

- `EvidenceSource`
- `EvidenceObject`
- `ExtractedFact`
- `ClaimCandidate`
- `ClaimProvenance`

Output:

- evidence-backed readiness
- missing evidence gaps
- weak/unsupported claims
- renewal and expiration gaps

## Level 4 — Memory → Continuity

Purpose:

Build historical intelligence over time.

Canonical inputs:

- `TimelineEvent`
- `ContinuityEvent`
- event-to-evidence links
- event-to-claim impacts

Output:

- continuity timeline lenses
- capability evolution
- evidence history
- people changes
- inspection / sponsor / relationship history
- temporal continuity signals

## Level 5 — Automation → APIs + Feedback + Historical Ingestion

Purpose:

Enrich the institution without manual sessions.

Canonical inputs:

- API connector candidates
- sponsor feedback
- CT.gov evidence
- PubMed evidence
- public registry evidence
- historical ingestion candidates
- integration events

Output:

- automatic evidence candidates
- new or strengthened claim candidates
- external corroboration
- feedback-driven review tasks
- continuous Passport / Capabilities / Readiness / Roadmap updates

## Progressive Gate Model

Replace legacy question gates with canonical maturity gates.

| Old gate pattern | New gate pattern |
|---|---|
| Count answered form fields. | Check canonical object completeness. |
| Require PI flat fields. | Require at least one relevant `Person` / role when entering Level 2. |
| Require lab yes/no. | Require `Laboratory` or infrastructure object when deriving lab claims. |
| Require document count. | Require `EvidenceObject` support for evidence/readiness levels. |
| Treat roadmap as final output. | Treat roadmap as continuously updated from gaps. |

## Product Behavior

The user experience should ask:

```text
What can we demonstrate today?
What evidence is missing to demonstrate the rest?
What is the next smallest step to improve the institutional asset?
```

Not:

```text
Complete every form section.
```

Each level should show:

- what Kadarn already knows
- what Kadarn inferred
- what remains unproven
- what output improves if the user continues
- estimated time to next level

## Activities

- Replace linear onboarding progress with level-aware metadata.
- Replace `PASSPORT_LEVEL1_CRITICAL` legacy questions with canonical Level 1 checks.
- Define level-specific completion gates.
- Update UI copy from form completion to institutional knowledge maturity.
- Make Passport available after Level 1.
- Make Capabilities expand after Level 2.
- Make Readiness strengthen after Level 3 evidence.
- Make Continuity mature after Level 4 memory.
- Make automation enter through Level 5 connectors and feedback.

## Non-Regression Rule

ORP-1.5 must not block users who already completed more detailed onboarding data.

Allowed:

- migrate existing answers into highest eligible level
- show compatibility progress during migration
- preserve direct links to existing pages
- keep derived outputs available at all levels, with confidence/gap labels

Not allowed:

- hiding Passport until all modules are complete
- requiring documents for Level 1
- requiring memory for Passport
- treating form completion percentage as institutional maturity
- requiring legacy flat fields for level progress

## Deliverables

- Progressive Onboarding plan.
- Level model.
- Canonical maturity gate map.
- Fast-track replacement map.
- Level-to-output projection map.

## Gate

ORP-1.5 is complete when:

- first Passport can be generated in less than 10 minutes
- Level 1 requires only identity/minimal research profile
- Level 2 expands capabilities through People and Infrastructure
- Level 3 strengthens readiness through Evidence
- Level 4 builds Continuity through Memory
- Level 5 accepts automation, APIs, feedback, and historical ingestion
- onboarding progress is based on canonical maturity, not form completion percentage
