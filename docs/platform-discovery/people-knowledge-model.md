# Kadarn MVP People Knowledge Model

Sprint 7 reorganizes People from a staff roster into a claim-support model. The goal is not only to answer "Who works here?" It is to answer:

> Who supports this claim?

People should connect persons, roles, certifications, experience, languages, and evidence to the capability claims they support.

## Target Model

```text
Person
  -> Research Role
  -> Clinical Role
  -> Operational Role
  -> Capability Contribution
  -> Evidence
```

This separates identity from role coverage and separates role coverage from claim support.

## Current Problem

The current `ResearchTeamMember` model stores many concepts on one object:

- identity: name, email, phone
- credentials
- primary role
- location assignment
- employment status
- research roles
- PI flag
- therapeutic expertise
- years of experience
- study counts
- phase experience
- languages
- certifications

This is workable for MVP input, but it does not clearly answer which person supports which claim. A person can be a PI, clinician, lab contributor, recruiter, regulatory owner, language support resource, or capability owner. Those are different knowledge relationships.

## Canonical Objects

| Object | Purpose | Example |
|---|---|---|
| `Person` | Human identity and contact anchor. | Sarah Chen, MD. |
| `ResearchRole` | Research execution responsibility. | PI, Sub-Investigator, Coordinator, Regulatory Specialist. |
| `ClinicalRole` | Licensed clinical function. | Physician, Nurse, Pharmacist, Phlebotomist. |
| `OperationalRole` | Operational capability ownership. | Lab Manager, Recruitment Specialist, Quality Manager, Data Manager. |
| `CapabilityContribution` | Relationship between person and claim/capability. | Sarah supports Clinical Research Operations as PI. |
| `PersonEvidence` | Evidence tied to the person or role. | CV, medical license, GCP certificate, delegation log. |

## Data Model Direction

```typescript
interface Person {
  id: string
  name: PersonName
  contact: PersonContact
  locationAssignments: PersonLocationAssignment[]
  employmentStatus: string
  languages: string[]
}

interface PersonRoleAssignment {
  id: string
  personId: string
  roleType: 'research' | 'clinical' | 'operational'
  role: string
  locationId?: string
  evidenceIds: string[]
}

interface CapabilityContribution {
  id: string
  personId: string
  capabilityClaimId: string
  contributionType: 'accountable' | 'performs' | 'supervises' | 'supports' | 'backup'
  evidenceIds: string[]
  confidence: 'high' | 'medium' | 'low'
}

interface PersonEvidence {
  id: string
  personId: string
  evidenceType: 'CV' | 'License' | 'Certification' | 'Training' | 'Delegation Log' | 'Publication' | 'Other'
  title: string
  issuedBy?: string
  issuedAt?: string
  expiresAt?: string
  status: 'active' | 'expiring' | 'expired' | 'pending'
}
```

The MVP can still store `people_team_members`, but the conceptual model should move toward these separated relationships.

## Current-to-v2 Mapping

| Current field | People Knowledge Model target | Keep as input? | Notes |
|---|---|---:|---|
| `firstName`, `lastName` | `Person.name` | Yes | Person identity. |
| `email`, `phone` | `Person.contact` | Yes | Operational contact. |
| `primaryLocationId` | `PersonLocationAssignment` | Yes | Links person to site/location. |
| `employmentStatus` | `Person.employmentStatus` | Yes | Workforce relationship. |
| `credentials` | `ClinicalRole` or `PersonEvidence` | Prefer extraction | Should come from license/CV where possible. |
| `primaryRole` | Role assignment summary | Yes, but split | Should not be the only role model. |
| `researchRoles[]` | `ResearchRole[]` / `OperationalRole[]` | Yes, but split | Current list mixes research and operational roles. |
| `isPrincipalInvestigator` | `ResearchRole: Principal Investigator` | No separate concept | PI is a role assignment, not a separate boolean. |
| `therapeuticExpertise[]` | `PersonExpertise[]` backed by evidence | Prefer extraction | CV/publications/study history should populate this. |
| `yearsExperience` | `PersonExperience` | Prefer extraction | CV/study history should populate where possible. |
| `completedStudies`, `currentStudies` | `PersonExperience` / `TimelineEvent` | Prefer extraction | 1572, CV, study history can infer. |
| `phaseExperience[]` | `PersonExperience.modalityExperience[]` | Prefer extraction or confirmation | Supports readiness and sponsor matching. |
| `languages[]` | `Person.languages[]` | Yes | May also be evidence-supported. |
| `certifications[]` | `PersonEvidence[]` | Yes, but evidence-first | Certificate uploads should create these. |

## Role Taxonomy

### Research Roles

Research roles answer: "Who is accountable for study conduct?"

Examples:

- Principal Investigator
- Sub-Investigator
- Medical Director
- Scientific Director
- Research Director
- Clinical Research Coordinator
- Regulatory Specialist
- Data Manager
- Project Manager

Claims supported:

- Clinical Research Operations
- Investigator Coverage
- Regulatory Readiness
- Study Execution History
- Source Documentation Readiness

### Clinical Roles

Clinical roles answer: "Who can clinically perform or supervise participant care?"

Examples:

- Physician
- Nurse
- Nurse Practitioner
- Physician Assistant
- Pharmacist
- Phlebotomist
- Infusion Nurse
- Imaging Technician

Evidence:

- Medical license
- Nursing license
- Pharmacy license
- ACLS/BLS/PALS
- CV
- Delegation log

Claims supported:

- Clinical Procedure Capability
- Infusion Capability
- Early Phase Readiness
- Participant Safety Readiness
- Controlled Substance Readiness

### Operational Roles

Operational roles answer: "Who makes the institutional capability work?"

Examples:

- Laboratory Director
- Laboratory Manager
- Biospecimen Technician
- Recruitment Specialist
- Quality Manager
- Operations Manager
- Training Coordinator
- Shipping Coordinator
- Chain-of-Custody Owner

Evidence:

- SOP ownership
- Training records
- Delegation log
- Competency assessments
- Certifications

Claims supported:

- Sample Processing
- Biospecimen Collection
- Biospecimen Storage
- Domestic / International Shipping
- Quality System Maturity
- Patient Recruitment

## Capability Contribution Matrix

| Capability claim | People who can support it | Evidence required |
|---|---|---|
| Clinical Research Operations | PI, Sub-I, CRC, Regulatory Specialist, Project Manager | CV, delegation log, GCP, study history. |
| Patient Recruitment | Recruitment Specialist, CRC, Community Liaison, PI | Recruitment SOP, referral agreements, enrollment metrics. |
| Sample Processing | Laboratory Director, Lab Manager, Biospecimen Technician | CLIA/CAP, lab SOPs, training records, competency assessments. |
| PBMC Processing | Lab Manager, Biospecimen Technician | PBMC SOP, training record, equipment qualification. |
| Molecular Testing | Laboratory Director, Molecular Technologist | CLIA/CAP, molecular validation, equipment records. |
| Biospecimen Collection | Phlebotomist, Nurse, CRC, Biospecimen Technician | Collection SOP, phlebotomy certification, delegation log. |
| Biospecimen Storage | Lab Manager, Biospecimen Technician, Quality Manager | Storage SOP, equipment qualification, temperature logs. |
| Domestic Shipping | Shipping Coordinator, Lab Staff, CRC | Shipping SOP, courier process, training. |
| International Shipping | IATA-certified staff, Shipping Coordinator | IATA certificate, shipping SOP, packaging validation. |
| Early Phase Readiness | PI, Physician, Nurse, Pharmacist, Operations Manager | Medical licenses, emergency procedures, monitoring SOPs, staffing plan. |
| IVD Readiness | Laboratory Director, Quality Manager, Molecular/Lab Staff | CLIA/CAP, validation records, quality manual, lab SOPs. |
| Multi-Site Operations | Operations Manager, Site Leads, Project Manager | Org chart, delegation/coordination SOPs, site rosters. |

## People Page v2 Sections

```text
People v2
  1. People Directory
  2. Research Roles
  3. Clinical Roles
  4. Operational Roles
  5. Capability Contributions
  6. Evidence & Credentials
  7. Derived People Coverage
```

### 1. People Directory

Creates `Person`.

Fields:

- Name
- Contact
- Location assignment
- Employment/affiliation status
- Languages

### 2. Research Roles

Creates `ResearchRole` assignments.

Fields:

- Role
- Location/site
- Accountable person
- Evidence: CV, delegation log, GCP, study history

### 3. Clinical Roles

Creates `ClinicalRole` assignments.

Fields:

- Clinical function
- License/credential evidence
- Expiration/status
- Location/site

### 4. Operational Roles

Creates `OperationalRole` assignments.

Fields:

- Operational function
- Capability area
- SOP/training evidence
- Location/site

### 5. Capability Contributions

Creates `CapabilityContribution`.

This section should be mostly derived from roles and evidence. Users should confirm uncertain assignments rather than manually build everything.

Examples:

- "Sarah Chen supports Clinical Research Operations as Principal Investigator."
- "Ana Rivera supports Biospecimen Collection as CRC with phlebotomy training."
- "Luis Mateo supports International Shipping through IATA certification."

### 6. Evidence & Credentials

Creates `PersonEvidence`.

Documents should populate this first:

- CV
- Medical License
- Nursing License
- GCP/HSP
- IATA
- Board Certification
- Training records
- Delegation log

Manual entry should be fallback only.

### 7. Derived People Coverage

Readonly projection:

- PI coverage
- Coordinator coverage
- Regulatory coverage
- Lab coverage
- Shipping coverage
- Language coverage
- Certification gaps
- Expiring credentials

No manual edits.

## Evidence-First Behavior

| Evidence uploaded | Auto-created or suggested |
|---|---|
| CV | `Person`, credentials, education, experience, publications, therapeutic expertise. |
| Medical License | `ClinicalRole`, license evidence, expiration, state. |
| GCP/HSP Certificate | `PersonEvidence`, research training coverage. |
| IATA Certificate | `PersonEvidence`, shipping capability contribution. |
| Delegation Log | `ResearchRole[]`, capability contributions, study role evidence. |
| FDA 1572 | PI/Sub-I records, site/lab associations, study history. |
| Training Matrix | Training coverage and competency gaps. |
| Publication List | Therapeutic expertise and academic readiness support. |

## Questions to Remove or Reframe

| Current pattern | Decision |
|---|---|
| "Who is your PI?" | Reframe as role assignment: mark a `Person` as PI with supporting evidence. |
| "What research roles do you have?" | Split into Research, Clinical, and Operational role assignments. |
| "What credentials does this person have?" | Prefer extraction from license/CV; ask only if evidence missing. |
| "Which certifications does your team hold?" | Remove institution-level version; certifications belong to people as evidence. |
| "How many years of research experience?" | Prefer extraction from CV/study history; ask for confirmation if unclear. |
| "Which therapeutic areas does this person know?" | Prefer extraction from CV/publications/study history; confirm when needed. |
| "Which capabilities does this person support?" | Derive from role + evidence; ask only to resolve ambiguity. |

## Claim Support Pattern

Every capability claim should be able to answer:

```text
Claim: Sample Processing
  Supported by:
    Person: Lab Manager
      Role: Operational Role / Laboratory Manager
      Evidence: CV, CLIA training, lab SOP training
    Person: Biospecimen Technician
      Role: Operational Role / Biospecimen Technician
      Evidence: Specimen processing training
    Laboratory: Main Lab
      Evidence: CLIA certificate, processing SOP
```

People are not just staff records. They are support nodes in the claim/evidence graph.

## Derived Outputs

| Output | People contribution |
|---|---|
| Capabilities | Shows who supports each capability and with what evidence. |
| Readiness | Scores personnel readiness, training gaps, license gaps, staffing coverage. |
| Passport | Shows current team summary, PI/role coverage, active credentials. |
| Memory | Tracks PI changes, staff additions, training/certification milestones. |
| Roadmap | Recommends missing roles, expired credentials, training gaps. |

## Implementation Notes

1. Keep `people_team_members` for MVP compatibility, but introduce conceptual sub-models in code comments/types.
2. Split `RESEARCH_ROLE_OPTIONS` into research, clinical, and operational role groups.
3. Replace `isPrincipalInvestigator` boolean with a derived role assignment when possible.
4. Treat `certifications` as `PersonEvidence`, not profile attributes.
5. Add capability contribution derivation from role + evidence.
6. Update Capabilities output to eventually show "Supported by" people.
7. Update Roadmap to recommend missing people/roles/evidence, not just missing documents.
8. Update fast-track to check role/evidence coverage from people objects, not flat `people_*` projections.

## Acceptance Check

People Knowledge Model is complete when:

- People page separates identity, research roles, clinical roles, operational roles, capability contributions, and evidence.
- Every person can be connected to one or more claims they support.
- Certifications and licenses are evidence objects tied to people.
- Institution-level people summaries are derived, not manually entered.
- Capabilities can answer "who supports this claim?"
- Roadmap can identify missing roles, missing evidence, and expiring credentials.
