# PB-2.6A — Program Readiness Scenarios

> **Part III — Product Model**
> **Status:** Canonical
> **Purpose:** Make Program Readiness concrete through two complete, end-to-end scenarios.

---

## Scenario 1: An Institution Pursues PBMC Processing Readiness

### The Institution

University Medical Center (UMC) is an academic hospital with an active research program. They process approximately 500 PBMC samples per month for internal studies. They want to attract external sponsors who need PBMC processing capabilities.

Today, when a sponsor asks "can you process PBMCs?", UMC sends a PDF with their lab certifications and hopes it's enough. There's no standard way to demonstrate readiness.

### Step 1: Selecting a Program Type

The UMC lab director logs into Kadarn and navigates to the Program Readiness section. Kadarn shows available readiness program types:

- Prospective Biospecimen Collection
- **PBMC / Specialty Sample Processing** ← selects this
- IVD / Diagnostic Validation
- Biobanking Operations

Kadarn displays the program description: *"Validates that an institution can process PBMCs: density gradient separation, cell counting, viability assessment, cryopreservation."*

### Step 2: Understanding Requirements

Kadarn shows what capabilities UMC needs to demonstrate:

| Capability | Required Evidence Class | Mandatory? |
|---|---|---|
| Processing Lab | Class A — Lab certification (CLIA, CAP, ISO) | Yes |
| PBMC Isolation | Class A — Validated SOP | Yes |
| Cell Counting | Class B — Equipment + protocol | Yes |
| Viability Assessment | Class B — QC protocol | Yes |
| Cryopreservation | Class B — LN2 storage + protocol | Yes |
| Biosafety Level 2 | Class A — BSL-2 certification | Yes |
| Cold Chain Logistics | Class C — Shipping validation | No (optional) |

Seven capabilities. Six mandatory. One optional.

### Step 3: Submitting Evidence

UMC checks what they already have. Their lab manager uploads:

- ✅ CLIA certification (Class A) — covers Processing Lab
- ✅ PBMC isolation SOP v3.1 (Class A) — covers PBMC Isolation
- ✅ Cell counting protocol (Class B) — covers Cell Counting
- ✅ BSL-2 certification (Class A) — covers Biosafety Level 2
- ✅ LN2 storage monitoring logs, 30-day (Class B) — covers Cryopreservation
- ❌ Viability assessment protocol — missing
- ❌ Cold chain shipping validation — missing (optional)

### Step 4: Kadarn Derives Readiness

Kadarn evaluates the evidence:

- 5 of 6 mandatory capabilities evidenced → all mandatory met? No.
- Wait — viability assessment is missing and it's mandatory.

Kadarn derives: **PARTIAL**

The lab director sees:
- "5 of 7 capabilities evidenced"
- "1 mandatory gap: Viability Assessment"
- "1 optional gap: Cold Chain Logistics"
- "Confidence: 0.71 (evidence quality is good where present)"

### Step 5: Kadarn Recommends

Kadarn surfaces a specific recommendation:

> *"Submit a viability assessment protocol as Class B evidence. This is a mandatory requirement for PBMC Processing Readiness. Estimated effort: Low. Expected impact: Advances from PARTIAL to CONDITIONALLY_READY."*

The lab director realizes they have a viability assessment protocol — it was just never formalized as a standalone document. They spend an afternoon documenting it and upload.

### Step 6: Re-evaluation

UMC clicks "Re-evaluate Readiness." Kadarn processes the new evidence:

- All 6 mandatory capabilities now evidenced
- 1 optional gap remains (Cold Chain Logistics)
- Overall confidence: 0.78

Kadarn derives: **CONDITIONALLY_READY**

The lab director sees the option to publish to the network. They choose to publish. UMC is now discoverable by sponsors searching for PBMC-capable institutions.

### Step 7: Continuous Improvement

A month later, UMC partners with a courier service and documents their cold chain validation process. They upload the evidence. Kadarn re-evaluates:

- All 7 capabilities evidenced
- Overall confidence: 0.84

Kadarn derives: **READY**

UMC appears at the top of sponsor search results for PBMC Processing programs.

---

## Scenario 2: A Sponsor Searches for IVD Validation Institutions

### The Sponsor

NovaDx is a diagnostics company developing a new blood-based cancer screening test. They need 3-5 institutions for clinical validation: institutions that can collect characterized samples, annotate clinical data, and operate under ISO 13485 quality management.

Today, NovaDx's clinical operations team spends 6-8 weeks per site doing manual qualification: emailing RFPs, reviewing PDFs, scheduling calls, verifying certifications one by one.

### Step 1: Opening the Sponsor Workspace

The NovaDx program manager opens Kadarn and navigates to the Sponsor Workspace. They select the program type: **IVD / Diagnostic Validation Readiness**.

### Step 2: Portfolio View

Kadarn shows:

| Status | Count |
|---|---|
| READY | 4 institutions |
| CONDITIONALLY_READY | 3 institutions |
| PARTIAL | 5 institutions |
| NOT_READY | 8 institutions |

20 institutions have been evaluated for this program type. The program manager filters to READY + CONDITIONALLY_READY: 7 candidates.

### Step 3: Reviewing Candidates

Kadarn shows the 7 candidates ranked by readiness. For each, the sponsor sees:

**Institution A — READY (0.91)**
- All 8 capabilities evidenced
- Strong on: Quality Management (ISO 13485), Clinical Data Annotation, Sample Characterization
- Evidence highlights: ISO 13485 certificate (Class A), 3 IVD reference projects (Class B), GCP training records (Class C)
- Trend: Stable (READY for 4 months)

**Institution B — CONDITIONALLY_READY (0.82)**
- 7 of 8 capabilities evidenced
- Optional gap: Statistical Analysis support
- Evidence highlights: CLIA certification (Class A), IRB registration (Class A), LIMS documentation (Class B)
- Trend: Improving (was PARTIAL 2 months ago)

**Institution C — READY (0.88)**
- All 8 capabilities evidenced
- Strong on: Regulatory, Biosafety, Quality
- Concern: Evidence for Clinical Data Annotation is Class C only
- Trend: Stable

### Step 4: Drilling Into Evidence

The program manager clicks on Institution A to review their evidence in detail. Kadarn shows the capability breakdown:

| Capability | Status | Confidence | Evidence |
|---|---|---|---|
| Quality Management (ISO 13485) | Strong | 0.95 | ISO 13485 certificate (Class A) |
| Clinical Data Annotation | Strong | 0.88 | Annotation SOP (Class B), Data dictionary (Class B) |
| Sample Characterization | Adequate | 0.78 | Characterization SOP (Class A), 2 reference projects (Class B) |
| Specimen Traceability | Adequate | 0.75 | LIMS documentation (Class B) |
| Regulatory Body | Strong | 0.92 | IRB registration (Class A), FDA registration (Class A) |
| Biostatistics Support | Adequate | 0.72 | Biostatistician CV (Class C) |

The program manager can click any evidence item to see the actual document or verification record.

### Step 5: Comparison

The program manager selects Institution A, Institution C, and Institution D for side-by-side comparison. Kadarn shows a comparison matrix:

| Dimension | Institution A | Institution C | Institution D |
|---|---|---|---|
| Readiness | READY | READY | CONDITIONALLY_READY |
| Confidence | 0.91 | 0.88 | 0.82 |
| Capabilities Met | 8/8 | 8/8 | 7/8 |
| Evidence Quality | High (avg Class A/B) | Medium (mixed A-C) | High where present |
| Key Strength | Quality + Data | Regulatory | Sample Processing |
| Key Gap | None | Clinical Data (Class C) | Statistics support |

### Step 6: Decision

The program manager exports evidence-backed readiness reports for Institutions A and C. These reports include:
- Readiness summary
- Capability-by-capability evidence trail
- Confidence distribution
- Verifiable provenance references

They share the reports with their medical director. Together, they decide to initiate contact with both institutions.

Kadarn didn't make the decision. Kadarn provided the evidence to make it.

### Step 7: Ongoing Monitoring

The program manager adds Institutions A and C to their monitored portfolio. Kadarn will alert them if:
- Readiness status changes (improves or declines)
- New evidence is added or existing evidence expires
- New institutions reach READY for this program type

Three months later, Kadarn alerts: "Institution D advanced from CONDITIONALLY_READY to READY." The program manager reviews and adds them to the shortlist.

---

*These scenarios illustrate how Kadarn transforms evidence into actionable intelligence — for both institutions demonstrating readiness and sponsors making informed decisions.*
