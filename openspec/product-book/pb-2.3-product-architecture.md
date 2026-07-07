# PB-2.3 — Product Architecture

> **Kadarn Product Book v2.0 — Part II: Conceptual Model**
> *How the product works — in business terms, not technical ones*

---

This chapter explains the conceptual architecture of Kadarn. It describes the building blocks of the product and how they relate, using business language accessible to anyone — regardless of technical background.

---

## The Evidence Stack

Kadarn is organized as a layered platform. Each layer depends on the one below it, creating a clear chain of reasoning from raw proof to business intelligence.

```
┌─────────────────────────────────────────────────────────┐
│                   SPONSOR INTELLIGENCE                    │
│           "Who is ready for my program?"                 │
│                                                          │
│  ─ Portfolio views  ─ Program matching  ─ Decision views │
├─────────────────────────────────────────────────────────┤
│                 CAPABILITY INTELLIGENCE                   │
│           "What can this institution do?"                │
│                                                          │
│  ─ Capability matrix  ─ Gap analysis  ─ Recommendations   │
├─────────────────────────────────────────────────────────┤
│                    PROGRAM READINESS                      │
│        "Is this institution ready for Program X?"        │
│                                                          │
│  ─ Readiness evaluation  ─ Confidence scoring           │
│  ─ Evidence gap identification  ─ Readiness reports     │
├─────────────────────────────────────────────────────────┤
│                     EVIDENCE CORE                         │
│                  "What proof exists?"                     │
│                                                          │
│  ─ Evidence submission  ─ Claims management              │
│  ─ Provenance tracking  ─ Counter-evidence              │
│  ─ Confidence computation (per-claim)                   │
└─────────────────────────────────────────────────────────┘
```

**Evidence Core** is the foundation. It stores evidence, manages claims, and tracks where every piece of information came from. It does not interpret evidence — it records and relates it.

**Program Readiness** evaluates what the evidence means for a specific program type. Given an institution's evidence and a program's capability requirements, it computes readiness: Ready, Conditionally Ready, Partial, or Not Ready. Every status is traceable to specific evidence items that support or are missing.

**Capability Intelligence** interprets readiness across the institution. It builds a capability matrix, identifies patterns, surfaces gaps, and generates recommendations. It answers the question: "What can this institution demonstrate across all its capabilities?"

**Sponsor Intelligence** inverts the question. Instead of "what can this institution do?", it asks "which institutions can do what I need?" It matches programs to institutions based on demonstrated readiness, generates decision views for sponsors, and monitors changes over time.

---

## The Dual View Model

Kadarn's most powerful architectural feature is its ability to answer two fundamentally different questions from the same evidence graph:

### Institution View

> *"What can we demonstrate?"*

The institution perspective:
- What capabilities do we have?
- What evidence backs each capability?
- What programs are we ready for?
- What's missing?
- What should we improve next?

Example: A biobank director logs in and sees: "You have demonstrated readiness for Biospecimen Collection (Ready) and PBMC Processing (Conditionally Ready). Your gaps are: LN2 storage documentation, viability QC protocol. Recommended next step: Submit LN2 capacity documentation to reach Ready for PBMC Processing."

### Program View

> *"Who can execute this program?"*

The sponsor perspective:
- Which institutions meet my program's capability requirements?
- How strong is their evidence?
- What gaps exist and how significant are they?
- How has their readiness changed since my last review?

Example: A CRO program manager selects "IVD Clinical Validation Readiness" and sees 5 candidate institutions. Two are Ready, two are Conditionally Ready with specific gaps listed, and one is Partial. Each assessment includes evidence highlights and gap analysis. The sponsor can review evidence directly and make an informed decision — without asking any institution to send documents.

**The same evidence. The same readiness computation. Two different navigation paths.** No data duplication. No inconsistency. One truth, surfaced two ways.

---

## The Readiness Loop

Kadarn is not a one-time assessment tool. It is designed for continuous improvement. Evidence grows over time. Readiness evolves. The platform tracks and surfaces that evolution.

```
                    ┌─────────────────┐
                    │   NEW EVIDENCE   │
                    │  is submitted    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   READINESS     │
                    │   is recomputed │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
           ┌──────────────┐  ┌──────────────┐
           │  GAPS FOUND  │  │  READINESS   │
           │  surfaced to │  │  IMPROVES to │
           │  institution │  │  next level  │
           └──────┬───────┘  └──────┬───────┘
                  │                 │
                  ▼                 ▼
           ┌──────────────┐  ┌──────────────┐
           │ INSTITUTION  │  │  INSTITUTION │
           │ addresses    │  │  becomes     │
           │ gaps         │  │  discoverable│
           └──────┬───────┘  └──────┬───────┘
                  │                 │
                  ▼                 ▼
           ┌──────────────┐  ┌──────────────┐
           │ MORE EVIDENCE│  │   SPONSOR    │
           │ is submitted │  │   DISCOVERS  │
           └──────┬───────┘  │  institution │
                  │          └──────┬───────┘
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  PROGRAM    │
                    │  EXECUTED   │
                    │  → Outcome  │
                    │  evidence   │
                    │  created    │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  MORE       │
                    │  EVIDENCE   │
                    │  added to   │
                    │  graph      │
                    └─────────────┘
                           │
                           ▼
                    (loop continues)
```

This loop has powerful compounding effects:

- **For institutions:** Each program executed generates evidence that strengthens readiness for future programs. The more programs an institution runs, the easier it becomes to demonstrate readiness for new ones.
- **For sponsors:** The more institutions on the platform, the richer the evidence base. Sponsor confidence increases because decisions are backed by more data.
- **For the network:** Quality compounds. Better evidence attracts better programs, which generate better outcomes, which strengthen evidence further.

---

## The Boundaries That Matter

Kadarn's architecture has explicit boundaries that define what each layer does — and does not do:

| Layer | Does | Does NOT |
|-------|------|----------|
| **Evidence Core** | Stores and relates evidence | Interprets what evidence means |
| **Program Readiness** | Evaluates readiness against program requirements | Certifies or guarantees readiness |
| **Capability Intelligence** | Surfaces patterns, gaps, and recommendations | Tells institutions what to do |
| **Sponsor Intelligence** | Matches programs to institutions, monitors changes | Makes selection decisions for sponsors |

These boundaries ensure that:

- No layer oversteps its responsibility
- Evidence remains the single source of truth
- Interpretations are always traceable back to source data
- The platform explains without certifying

---

*Next: PB-2.4 — Actors & Personas*
