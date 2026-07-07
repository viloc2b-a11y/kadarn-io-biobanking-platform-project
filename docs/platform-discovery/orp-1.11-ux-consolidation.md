# ORP-1.11 — UX Consolidation

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Reduce manual interaction by consolidating onboarding surfaces through inference, AI, extraction, and context.  
**Gate:** Manual interaction is reduced by 50%.

## Objective

Reduce friction.

Onboarding should no longer force users through repeated questions across Organization, People, Infrastructure, Documents, and Memory. The UX should behave as one contextual knowledge acquisition flow that asks only for unknown, conflicting, or low-confidence facts.

```text
Organization
People
Infrastructure
Documents
Memory
  -> inference
  -> AI
  -> extraction
  -> context
  -> consolidated interaction
```

Not:

```text
Organization form
  -> People form
  -> Infrastructure form
  -> Documents checklist
  -> Memory form
```

## Current Problem

The current experience is cleaner than the original form workflow, but it still exposes separate modules that can repeat or restate the same institutional knowledge:

- Organization captures identity, research profile, operational footprint, and locations.
- People captures staff, roles, certifications, languages, and experience.
- Infrastructure captures facility, lab, storage, shipping, utilities, and services.
- Documents captures files and taxonomy state.
- Memory captures historical events and derives more events from current facts.

The underlying architecture says these are connected canonical objects. The UX still risks presenting them as separate tasks.

## UX Consolidation Rule

Every question must pass this test:

```text
Can Kadarn infer this from existing canonical objects, evidence, extraction, context, or history?
```

If yes:

- do not ask the question
- show the inferred value
- explain the source
- ask for confirmation only when needed

If no:

- ask the smallest possible question
- link the answer to a canonical object
- explain what output improves

## Consolidation Strategy

| Current surface | Consolidated behavior |
|---|---|
| Organization | Ask minimal identity first; infer footprint, research profile, and locations from evidence where possible. |
| People | Create people from CVs, licenses, 1572, delegation logs, training matrices, and org charts. |
| Infrastructure | Create labs, equipment, storage, utilities, logistics, and services from CLIA, SOPs, floor plans, IQ/OQ/PQ, logs, and licenses. |
| Documents | Become evidence submission and extraction review, not a separate checklist. |
| Memory | Become continuity review over derived events plus manual historical context only where not inferable. |

## Interaction Reduction Model

Track interaction count, not just question count.

Manual interactions include:

- typed answers
- dropdown selections
- checkbox selections
- repeated confirmations
- duplicate uploads
- manual summaries of document contents
- manual history entries that could be derived

Reduced interactions include:

- suppressed questions
- prefilled confirmation
- batch review
- inferred entity creation
- document-driven extraction
- context-aware defaults
- one-click accept/reject

## Target UX Pattern

Old:

```text
Fill these sections.
```

New:

```text
Kadarn found these facts.
Confirm what is correct.
Resolve what conflicts.
Add only what is missing.
```

## Consolidated Flow

```text
1. First Passport
   - minimal identity
   - immediate current snapshot

2. Evidence intake
   - upload / import / connect
   - extraction starts

3. Review extracted knowledge
   - people
   - infrastructure
   - capabilities
   - evidence
   - memory

4. Resolve gaps
   - missing facts
   - conflicts
   - low-confidence facts

5. Projection updates
   - Passport
   - Capabilities
   - Readiness
   - Roadmap
   - Continuity
```

## Context Rules

Use context to avoid repeated questions:

| Context known | UX behavior |
|---|---|
| Institution type | Prioritize relevant questions and suppress irrelevant infrastructure/services. |
| Location count | Generate infrastructure review cards automatically per location. |
| Uploaded CLIA | Create/confirm Laboratory before asking lab questions. |
| Uploaded CV/license | Create/confirm Person and credentials before asking people questions. |
| Uploaded SOP | Generate capability candidates before asking capability questions. |
| Existing evidence expiration | Ask for renewal evidence, not the whole document category. |
| Existing continuity event | Ask for correction or confirmation, not re-entry. |
| Sponsor feedback exists | Surface corroboration/dispute in review, not as a new manual form. |

## AI and Inference Boundaries

AI may:

- extract facts
- propose canonical objects
- suggest claim candidates
- detect duplicates
- infer missing links
- summarize evidence provenance
- propose questions for unresolved gaps

AI may not:

- silently overwrite confirmed canonical data
- promote claims without required review where review is required
- hide conflicts
- create unsupported Passport claims
- replace evidence/provenance requirements

## Activities

- Inventory repeated interactions across Organization, People, Infrastructure, Documents, and Memory.
- Define interaction baseline.
- Identify questions that can be suppressed through canonical context.
- Identify questions that can be prefilled from extraction.
- Identify questions that can be merged into review flows.
- Replace module-by-module completion with contextual next-best-action prompts.
- Add review-oriented UX: accept, edit, reject, resolve conflict.
- Add source explanation for every inferred fact.
- Track manual interaction reduction.

## Non-Regression Rule

ORP-1.11 must reduce friction without reducing explainability.

Allowed:

- hiding irrelevant questions
- prefilled review states
- inferred facts with source evidence
- batch confirmation
- contextual routing between modules
- preserving direct module access for advanced users

Not allowed:

- hiding the source of inferred facts
- accepting uncertain extraction without review
- removing manual override for missing extraction
- making the flow opaque
- reducing questions by dropping necessary canonical data
- breaking pause/resume consistency

## Metrics

Track:

- baseline manual interactions
- final manual interactions
- questions suppressed
- fields prefilled
- batch confirmations
- conflicts resolved
- manual overrides
- time to first Passport
- time to Level 2 capability expansion
- user-visible unresolved gaps

Calculation:

```text
Manual interaction reduction %
  = (baseline_manual_interactions - final_manual_interactions) / baseline_manual_interactions
```

The gate requires at least 50%.

## Deliverables

- UX Consolidation plan.
- Manual interaction inventory.
- Interaction reduction baseline.
- Context/inference suppression map.
- Review flow model.
- Module consolidation map.
- UX metrics specification.

## Gate

ORP-1.11 is complete when:

- manual interactions are reduced by at least 50%
- repeated questions across Organization, People, Infrastructure, Documents, and Memory are removed or justified
- inferred facts show source and confidence
- users can confirm/edit/reject inferred facts
- module boundaries no longer force duplicate entry
- pause/resume remains consistent across consolidated flow
- derived outputs continue to explain their sources
