# PB-2.7 — Capability Intelligence

> **Part III — Product Model**
> **Status:** Canonical
> **Purpose:** Define how Kadarn transforms evidence into intelligence without issuing absolute judgments.

---

## Capability Model

In Kadarn, a capability is not what an institution claims to have. It is what an institution can **demonstrate** with verifiable evidence.

```
Capability = CapabilityType (vocabulary)
           × Evidence (proof)
           × Confidence (how strong the proof is)
```

All three components must exist for a capability to be considered validated. An institution that says "we process PBMCs" but has no evidence has a claim — not a capability. An institution that has evidence but the evidence is outdated or low-class has a developing capability — not a strong one.

Kadarn's capability model is the bridge between raw evidence and actionable intelligence. It transforms scattered documents into structured, comparable, verifiable capability profiles.

---

## Capability Taxonomy

Kadarn organizes capabilities into a taxonomy of categories. The taxonomy is extensible — new categories can be added as the platform grows — but the structure provides a consistent language across all institutions and programs.

| Category | What It Covers | Example Capabilities |
|---|---|---|
| **Biospecimen Processing** | Sample collection, processing, and preparation | PBMC isolation, plasma processing, FFPE sectioning, DNA/RNA extraction |
| **Laboratory** | Lab operations, equipment, certification | CLIA/CAP certification, equipment calibration, QC protocols |
| **Storage** | Sample storage and preservation | -80°C storage, LN2 storage, monitored storage, backup systems |
| **Shipping** | Sample transport and logistics | Cold chain shipping, courier partnerships, temperature monitoring |
| **Clinical Operations** | Clinical workflow and patient interaction | Informed consent, sample collection, clinical coordination |
| **Clinical Data** | Data annotation, management, and quality | Clinical data annotation, EMR integration, data dictionaries |
| **Regulatory** | Compliance and regulatory submissions | IRB registration, FDA registration, GCP compliance, ICF templates |
| **Quality** | Quality management systems | ISO 9001, ISO 13485, CAP accreditation, internal audit programs |
| **Personnel** | Staff qualifications and training | GCP training, biosafety training, SOP training records |
| **Infrastructure** | Facilities and equipment | BSL-2 facility, emergency power, environmental monitoring |

Each capability type in the taxonomy has defined evidence requirements. For example, "PBMC Isolation" might require a validated SOP (Class A) plus equipment calibration records (Class B). These requirements are defined at the program level — they specify what Kadarn needs to see to validate the capability for that specific program type.

---

## Capability Categories — In Practice

### Biospecimen Processing
The core of Kadarn's domain. This category covers everything from blood collection to tissue processing to nucleic acid extraction. An institution with strong Biospecimen Processing capabilities can demonstrate: validated SOPs for each sample type, documented processing volumes, quality control data, and equipment maintenance records.

### Laboratory
This category validates that the institution operates under recognized quality standards. Evidence includes: CLIA or CAP certificates, ISO 15189 accreditation, proficiency testing results, and equipment calibration logs. Laboratory capability is foundational — it underpins confidence in every other category.

### Regulatory
Regulatory capability demonstrates that the institution can operate within compliance frameworks. Evidence includes: active IRB registrations, approved ICF templates, GCP training records, and FDA registration where applicable. For IVD validation programs, regulatory capability is weighted 2x in confidence calculations.

---

## The Capability Matrix

The Capability Matrix is Kadarn's primary visualization of institutional capability. For a given program type, it shows:

| Capability | Status | Confidence | Evidence Count | Gaps |
|---|---|---|---|---|
| Processing Lab | Strong | 0.92 | 4 items | 0 |
| PBMC Isolation | Strong | 0.88 | 3 items | 0 |
| Cell Counting | Adequate | 0.75 | 2 items | 1 |
| Viability Assessment | Weak | 0.52 | 1 item | 2 |
| Cryopreservation | Adequate | 0.78 | 3 items | 0 |
| Cold Chain Logistics | Unmet | — | 0 items | 3 |

**For the institution**, the Capability Matrix is a self-assessment dashboard. It shows exactly where they stand, what's strong, and what needs attention.

**For the sponsor**, the Capability Matrix is a comparison tool. It enables side-by-side evaluation of multiple institutions against the same criteria.

**Status definitions:**
- **Strong** (>0.85 confidence): Well-evidenced with high-class evidence
- **Adequate** (0.70–0.85): Sufficiently evidenced, minor gaps
- **Weak** (0.50–0.70): Evidence exists but quality or completeness is low
- **Unmet** (<0.50 or no evidence): Insufficient evidence to validate

---

## Capability Evolution

Capabilities are not static. They improve as institutions invest in quality systems, add new equipment, train staff, and document processes. Kadarn tracks this evolution.

When an institution first uploads evidence for PBMC Isolation, the capability might show as "Weak" — a single SOP document, Class B, no supporting data. Six months later, after adding proficiency testing results, equipment logs, and a second SOP revision, the same capability shows as "Strong" — multiple evidence items across Class A and B.

Kadarn surfaces this trajectory:
- **First evidenced**: When the capability was first validated
- **Last improved**: When evidence was most recently added or upgraded
- **Trend**: Improving, stable, or declining (based on evidence age and additions)

This enables proactive management. An institution with declining capabilities can act before readiness status drops. A sponsor can see not just current state but momentum.

---

## Capability Gaps

A gap in Kadarn is not a judgment. It is a roadmap.

Every gap includes:
- **What capability** it affects
- **What evidence class** would close it (A through F)
- **What impact** closing it would have (advance readiness status, increase confidence)
- **Estimated effort** to close it (low, medium, high)
- **Specific recommendation** for what to submit

Kadarn frames gaps constructively: *"Add Class B evidence for viability assessment. This would advance PBMC Processing from CONDITIONALLY_READY to READY. Estimated effort: Low."*

The language deliberately avoids judgment. Kadarn does not say "this institution fails to meet..." Kadarn says "this evidence would strengthen..."

---

## Improvement Recommendations

Kadarn generates prioritized recommendations based on evidence gaps:

| Priority | Criterion | Example |
|---|---|---|
| **1 — Critical** | Mandatory gap blocking readiness advancement | "Submit IRB approval as Class A evidence for Regulatory capability" |
| **2 — High** | Significant gap reducing confidence | "Add equipment calibration records for Cell Counting capability" |
| **3 — Moderate** | Optional gap or enhancement opportunity | "Consider adding inter-lab QC comparison data" |

Each recommendation is:
- **Specific**: Names the capability, evidence class, and document type
- **Actionable**: Describes exactly what to submit
- **Impact-linked**: Explains what readiness improvement it would unlock
- **Effort-estimated**: Low (hours), Medium (days), High (weeks)

Recommendations are suggestions, not requirements. The institution decides what to prioritize. Kadarn provides the roadmap.

---

## Confidence Distribution

Kadarn does not produce a single institutional score. Instead, it shows **confidence distribution** — how confidence varies across capabilities.

An institution might have:
- Very high confidence in Regulatory (0.95) and Quality (0.92)
- Good confidence in Processing (0.82) and Storage (0.78)
- Lower confidence in Shipping (0.65) and Clinical Data (0.60)

This distribution tells a much richer story than a single number. A sponsor can see: "this institution is excellent on quality systems and regulatory compliance — exactly what I need for an IVD study. Their shipping capability is weaker, but that's not critical for my program."

Confidence distribution enables **risk-informed decision-making**. Sponsors can apply their own weighting based on what matters most for their specific program.

---

## Why Capability is not Reputation

The biospecimen and clinical research industry has historically operated on reputation:

> "We've worked with them before. They're good."
> "Dr. Martinez recommended them."
> "They're a major academic center — they must be capable."

Reputation is:
- **Subjective** — based on personal experience and hearsay
- **Slow to build** — takes years of relationship-building
- **Fragile** — one bad experience can destroy it
- **Non-transferable** — reputation with one sponsor doesn't help with another
- **Opaque** — no way to verify what the reputation is based on

Capability, as Kadarn defines it, is:
- **Objective** — based on verifiable evidence
- **Fast to demonstrate** — as fast as evidence can be submitted
- **Resilient** — built on documented processes, not personal relationships
- **Transferable** — one capability profile serves all sponsors
- **Transparent** — every conclusion traces to specific evidence

Kadarn doesn't eliminate reputation. It provides an evidence-based foundation for it. An institution with strong capabilities AND a good reputation is powerful. An institution with strong capabilities but no reputation can now compete. An institution with a good reputation but weak capabilities will have that gap surfaced.

---

## Capability Intelligence as a Decision Layer

Capability Intelligence sits between Program Readiness and Sponsor Intelligence in Kadarn's product model:

```text
Evidence → Claims → Confidence → Capability → Readiness
                                              → Capability Intelligence
                                              → Sponsor Intelligence
```

Its role is to **interpret without certifying**. It transforms readiness data into:
- **For institutions**: A clear picture of strengths, gaps, and improvement paths
- **For sponsors**: Comparable, evidence-backed capability profiles for decision-making
- **For the network**: A common language for describing institutional capabilities

Capability Intelligence does not make decisions. It provides the structured intelligence that enables better decisions — by institutions, by sponsors, by regulators, and by the market.

---

*Part III continues in PB-2.8 — User Experience.*
