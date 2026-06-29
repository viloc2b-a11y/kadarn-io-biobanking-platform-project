# Kadarn Architecture Assessment — Official Template

**Format:** KAA-XXX — [Engine Name]  
**Subtitle:** Kadarn [Engine Name] Architecture — [Technology] Adoption Assessment  
**Status:** Draft | Review | Approved  
**Version:** 1.0

---

> **Governance Rule:** No strategic component enters Kadarn without an approved KAA.
> This applies to every OSS technology, managed service, or infrastructure primitive
> that introduces a new architectural boundary, a new runtime dependency, or a new
> operational concern. A KAA must be approved before any Technical Design document
> (KAA-XXX-B) is written.

---

## 1. Why This Capability Exists

*The problem the engine solves. What happens without it. Why it is not optional.*

*Be specific to Kadarn — not generic. Name the actual tables, handlers, or processes
that are broken today. This section must make the reader feel the pain before
offering the solution.*

---

## 2. Responsibility Stack

*The complete layer table. The new engine enters at its exact position. No layer
does another layer's work. This table must be identical across all KAA documents —
only the highlighted row changes.*

| Layer | Owner | Question it answers |
|---|---|---|
| Identity | Auth (Supabase JWT) | Who is this actor? |
| Policy | Policy Engine (OPA) | Can this actor perform this action? |
| Workflow Orchestration | Workflow Engine (Temporal) | What steps run, in what order, with what guarantees? |
| **[This engine]** | **[Technology]** | **[Its question]** |
| Data Authorization | PostgreSQL RLS | Can this actor see these rows? |
| Business Logic | Kadarn Engines | What does the system do within each step? |
| Persistence | PostgreSQL | Where do the data live? |
| Audit | Audit Engine | What business actions occurred? |
| Events | Event Bus | What changed in system state? |

---

## 3. Why Not Build It Ourselves?

*Honest evaluation of the internal alternative. Why it was rejected. Not as a
disclaimer — as a documented decision with reasoning.*

*Cover: maturity, operational cost, ecosystem, what it would take to replicate
the capability, and most importantly — where Kadarn's engineering effort should
actually go.*

---

## 4. Scope of Authority

*What this engine decides. What it never decides. An explicit boundary to prevent
God Service creep.*

**This engine may:**
- ...

**This engine never:**
- ...

---

## 5. Technology Selected

*Justification for the specific technology within the category. High-level flow
diagram showing its position in a request or process lifecycle.*

---

## 6. Core Concepts

*The two or three primitives from the technology that the team needs to understand
in order to work with it correctly. Not a tutorial — only what changes how you
think about the problem.*

---

## 7. Interaction with Kadarn Data

*How it relates to PostgreSQL and RLS. What it writes, what it reads, what it
never touches. The contract between this engine and the data layer.*

---

## 8. Interaction with Other Engines

*Explicit relationship with OPA, Temporal, PROV, FHIR, OpenTelemetry — whichever
apply. What happens before, during, and after each interaction.*

---

## 9. Ownership Boundaries

*Who owns each process, policy, or record. The engine executes. The owning Engine
remains responsible.*

| Process / Policy / Record | Owner |
|---|---|
| ... | ... |

---

## 10. Granularity

*The criterion for deciding what deserves to be a first-class concept in this engine
vs. a step inside something larger. One clear rule, concrete examples of both sides.*

---

## 11. Taxonomy

*Classification of the types of processes, policies, events, or traces this engine
handles. This organizes the future backlog.*

---

## 12. Compensation and Failure Handling

*What the engine does when something goes wrong. Compensation, rollback, escalation.
Kadarn-specific examples — not generic patterns.*

---

## 13. Risks and Mitigations

*Real risks of adopting this technology in Kadarn's context. Not generic — specific
to the codebase, team, and operational environment.*

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ... | ... | ... | ... |

---

## 14. Exit Strategy

*What happens if Kadarn needs to replace this component in five years. How much of
the current investment is preserved. What the migration path looks like.*

*Every KAA must demonstrate that Kadarn's business logic, policies, and data remain
owned by Kadarn — not by the technology vendor.*

Questions to answer:
- What belongs to Kadarn and survives a replacement?
- What is coupled to the technology's SDK or format?
- What would a migration to an alternative look like?
- Is the coupling acceptable given the benefits?

---

## 15. Future Capabilities

*What can be done later without committing to implement it now. Table or list.
Items here feed the product and architecture backlog.*

---

## 16. Future Integrations

*Surface diagram. How this engine connects to the others in the final architecture.*

```
[diagram]
```

---

## 17. Architectural Decision

*One or two sentences. What is adopted, for what purpose, with what non-negotiable
constraints. This is the record that gets referenced in code reviews, RFCs, and
onboarding.*
