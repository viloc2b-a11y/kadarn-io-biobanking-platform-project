# PB-2.6 — Program Readiness

> **Part III — Product Model**
> **Status:** Canonical
> **Purpose:** Define the heart of the Kadarn product. This is the chapter that product, design, sales, and clients will reference most.

---

## What is Program Readiness?

Kadarn defines **Program Readiness** as:

> An institution's demonstrated capability to execute a specific program type, validated by evidence-class-weighted confidence derived from verifiable, explainable evidence.

Program Readiness is not a score. It is not a certification. It is a **derived state** — computed from the evidence an institution has submitted, never manually declared.

When Kadarn says an institution is "Ready for Prospective Biospecimen Collection," it means: *every mandatory capability for that program type has been evidenced with sufficient quality, and the confidence derived from that evidence exceeds the program's threshold.*

When Kadarn says "Conditionally Ready," it means: *mandatory requirements are met, but some optional evidence is missing. The institution is close.*

When Kadarn says "Partial," it means: *foundational evidence exists, but critical gaps remain before the institution can claim readiness.*

---

## Readiness is Derived, Never Declared

No one can manually set an institution to "Ready" in Kadarn. No admin override. No backdoor. No exception.

Readiness is always computed from the current state of the evidence graph. If evidence changes — new documents are added, existing ones expire, claims are challenged — readiness is recalculated. The institution's status reflects what can be proven *right now*, not what was proven six months ago.

This is the fundamental difference between Kadarn and a certification body. A certification says "trust us, they passed." Kadarn says "here is the evidence. Verify it yourself."

Every readiness assessment in Kadarn includes:
- **What evidence** supports each capability claim
- **What class** that evidence belongs to (A through F, reflecting regulatory weight)
- **What confidence** Kadarn derives from that evidence
- **What gaps** remain before the next readiness level
- **A verifiable provenance trail** linking every conclusion to specific evidence items

---

## The Readiness Lifecycle

Readiness is not a gate. It is a cycle.

```text
No Evaluation
     │
     ▼
Institution selects a Program Type
     │
     ▼
Kadarn shows required capabilities + evidence
     │
     ▼
Institution submits evidence for each capability
     │
     ▼
Kadarn derives Readiness Status
     │
     ├── NOT_READY → add mandatory evidence → re-evaluate
     ├── PARTIAL → address remaining gaps → re-evaluate
     ├── CONDITIONALLY_READY → add optional evidence → READY
     └── READY → maintain, update, evolve
     │
     ▼
Institution publishes readiness to network
     │
     ▼
Sponsors discover and review
     │
     ▼
New evidence or expiring evidence → re-evaluation
     │
     └── (cycle continues)
```

An institution that reaches READY doesn't stop. Evidence ages. Capabilities evolve. New program types become available. Kadarn is designed for continuous improvement, not one-time qualification.

---

## Readiness Dimensions

Kadarn does not reduce readiness to a single number. Readiness has four dimensions:

| Dimension | What It Means | Example |
|-----------|---------------|---------|
| **Capability Coverage** | Which required capabilities have evidence | "4 of 7 capabilities evidenced" |
| **Evidence Quality** | The regulatory weight of submitted evidence | "Class A: IRB letter. Class B: SOP document." |
| **Confidence** | How strongly evidence supports each capability | "PBMC Processing: 0.82 confidence" |
| **Completeness** | Mandatory vs optional evidence coverage | "All mandatory met. 2 of 4 optional." |

These dimensions together give a complete picture. A sponsor can see not just *whether* an institution is ready, but *why* — and what the risk profile looks like.

---

## Readiness vs Qualification

| | Qualification | Readiness |
|---|---|---|
| **Nature** | Binary (qualified / not) | Graduated (4 states) |
| **Source** | Manual assessment | Derived from evidence |
| **Duration** | Expires, must renew | Evolves continuously |
| **Evidence** | Checklist-based | Evidence graph with provenance |
| **Transparency** | Opaque (pass/fail) | Explainable (what, why, gaps) |

Qualification asks: "Did someone check the boxes?" Readiness asks: "What can this institution prove, right now, with verifiable evidence?"

Kadarn does not replace qualification processes. It provides the evidence infrastructure that makes qualification faster, more transparent, and continuously verifiable.

---

## Readiness vs Certification

Kadarn explicitly does **not** certify institutions. This is a core product decision.

Certification says: "We have evaluated this institution and they meet our standard."

Readiness says: "Here is the evidence this institution has submitted. Here is the confidence Kadarn derives from it. Here are the gaps. You decide."

Why this matters:
- **Certification creates liability.** If Kadarn certifies an institution and something goes wrong, Kadarn is responsible.
- **Readiness enables decision-making.** Sponsors retain control over their risk tolerance.
- **Certification is static.** Readiness evolves with new evidence.
- **Certification is a gate.** Readiness is a continuous improvement tool.

Kadarn's position: *Surface evidence. Enable decisions. Never certify.*

---

## Readiness States

Kadarn uses four readiness states. Each has explicit, verifiable criteria:

### NOT_READY
- **What it means:** Critical mandatory evidence is missing for one or more required capabilities.
- **What's needed:** Submit the missing evidence. Kadarn identifies exactly what's missing and what class of evidence is required.
- **What it enables:** Nothing yet. The institution sees a clear gap analysis and roadmap.

### PARTIAL
- **What it means:** Some mandatory evidence exists, but gaps remain. The institution has started the journey.
- **What's needed:** Address the remaining mandatory gaps before optional evidence.
- **What it enables:** Internal tracking. The institution can see progress. Not yet visible to sponsors.

### CONDITIONALLY_READY
- **What it means:** All mandatory evidence is present and validated. Some optional evidence is missing.
- **What's needed:** Submit optional evidence to reach READY. Or publish as-is and let sponsors evaluate.
- **What it enables:** Network visibility. Sponsors can discover the institution and assess the optional gaps themselves.

### READY
- **What it means:** All mandatory AND optional evidence is present. Confidence exceeds the program threshold.
- **What's needed:** Maintain evidence. Update as capabilities evolve. Monitor for expiring evidence.
- **What it enables:** Full sponsor discovery. The institution appears at the top of program matching results.

---

## Readiness Evolution Over Time

Readiness is not a snapshot — it is a trajectory. Kadarn tracks:

- **When** each readiness state was first achieved
- **What changed** between evaluations (evidence added, updated, challenged)
- **Trend direction**: improving, stable, or declining
- **Evidence freshness**: when evidence was last updated, when it may expire

An institution that was READY six months ago but hasn't updated evidence will show a declining trend. Kadarn surfaces this proactively — to the institution (so they can act) and to sponsors (so they can assess currency).

---

## Evidence Gaps

A gap in Kadarn is not a failure. It is a roadmap.

Every evidence gap includes:
- **What capability** it affects
- **What evidence class** is missing (A through F)
- **Why it matters** — the impact on readiness
- **How to address it** — specific, actionable guidance
- **Estimated effort** — low, medium, or high

Kadarn frames gaps as opportunities: "Add Class B evidence for viability assessment to advance from CONDITIONALLY_READY to READY."

The language is always constructive, never judgmental. Kadarn does not say "this institution is deficient." Kadarn says "this evidence would strengthen the readiness assessment."

---

## Explainability Rules

Every readiness conclusion in Kadarn must satisfy three questions:

1. **Why this status?** — Trace to specific capability requirements and whether they are met.
2. **What evidence?** — Link to specific evidence items with their class and confidence contribution.
3. **What's missing?** — Identify specific gaps with actionable recommendations.

No black boxes. No hidden weights. No opaque scoring. Every stakeholder — institution, sponsor, regulator — can trace any readiness conclusion back to its evidence foundation.

---

## Sponsor Consumption Model

Sponsors interact with readiness through their portfolio:

1. **Portfolio view** — See all institutions evaluated for a program type, grouped by readiness
2. **Drill-down** — Click any institution to see capability-by-capability breakdown
3. **Evidence inspection** — Review specific evidence items backing each capability
4. **Comparison** — Compare institutions side-by-side on readiness dimensions
5. **Decision support** — Kadarn provides structured data; the sponsor makes the decision

Kadarn does not tell sponsors which institution to choose. It surfaces the evidence they need to make an informed choice.

---

## Institution Consumption Model

Institutions interact with readiness through their workspace:

1. **Dashboard** — See current readiness across all selected program types
2. **Capability breakdown** — Per program: which capabilities are strong, adequate, weak, unmet
3. **Gap analysis** — What's missing, what to add next, estimated effort
4. **Recommendations** — Prioritized actions to reach the next readiness level
5. **Progress tracking** — Readiness history, trend direction, milestone achievement

The institution owns its readiness data. It decides what to publish. It controls visibility. Kadarn provides the tools; the institution controls the narrative.

---

*Part III continues in PB-2.7 — Capability Intelligence.*
