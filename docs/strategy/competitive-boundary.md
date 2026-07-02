# Kadarn Competitive Boundary v1.0

**Version:** 1.0  
**Status:** ✅ Ratified — Baseline AF-1.0  
**Effective date:** 2026-07-01  
**Purpose:** Define the external boundary of the Kadarn platform — what problems it solves and what problems it will not solve.

---

## 1. Category Definition

> **Kadarn is an evidence infrastructure platform for institutional capabilities. It does not replace operational, laboratory, or study management systems.**

Kadarn organizes, structures, and navigates evidence about institutional capabilities. It does not execute clinical trials, manage laboratory operations, or replace site management systems. Its output is the Confidence Graph — a structured, explainable, evidence-based representation of specific institutional capabilities.

---

## 2. Capability Boundaries

| Capability | Kadarn | External | Notes |
|------------|--------|----------|-------|
| Evidence infrastructure | ✅ | | Store, provenance, relations, access, process state |
| Institutional Claim taxonomy | ✅ | | Standardized ontology of institutional capabilities |
| Confidence Graphs per Claim | ✅ | | Computed, explainable, per-Capability |
| Multi-actor visibility | ✅ | | Site-controlled, policy-governed |
| Vilo OS Class C evidence generation | ✅ | | Operational evidence as execution byproduct |
| Clinical trial management (CTMS) | | ✅ | Veeva, Florence, Medidata |
| Investigator Site File (eISF) | | ✅ | Veeva Vault eISF, Florence eISF |
| Laboratory management (LIMS) | | ✅ | CRIO, LabVantage, Watson LIMS |
| Sponsor study execution | | ✅ | IQVIA, Parexel, PPD |
| Sample marketplace | | ✅ | iSpecimen, Discovery Life Sciences |
| Site payment management | | ✅ | ClinCard, Greenphire |
| Protocol writing | | ✅ | Sponsor/CRO function |
| Regulatory submission | | ✅ | Veeva Vault RIM |
| Patient recruitment | | ✅ | Antidote, TrialSpark |
| AI site recommendations | | ✅ | Inato, Slope |

---

## 3. Competitive Mapping

### 3.1 Evidence Infrastructure

| Company | What they do | Kadarn relationship |
|---------|-------------|---------------------|
| **Inato** | AI-powered site recommendations based on trial matching | Complementary — Inato matches studies to sites; Kadarn provides evidence infrastructure for institutional capabilities |
| **Slope** | Site intelligence for clinical trial feasibility | Complementary — Slope focuses on trial-level feasibility; Kadarn focuses on institutional capability evidence |
| **IQVIA Site Intelligence** | Site performance benchmarking | Open — pending full competitive verification. May occupy the portable evidence space. |

### 3.2 Operational Infrastructure

| Company | What they do | Kadarn relationship |
|---------|-------------|---------------------|
| **Veeva (Platform + Vault)** | CTMS, eISF, RIM, QMS | Complementary — Veeva manages study operations; Kadarn provides capability evidence that complements operational data |
| **Florence Healthcare** | eISF, remote monitoring, site connectivity | Complementary — Florence manages site operations; Kadarn provides institutional evidence across studies |
| **CRIO** | LIMS for biobanks and labs | Complementary — CRIO manages lab operations; Kadarn surfaces capability evidence from operational data |

### 3.3 Marketplace and Fulfillment

| Company | What they do | Kadarn relationship |
|---------|-------------|---------------------|
| **iSpecimen** | Biospecimen marketplace + fulfillment | Not a competitor — Kadarn provides evidence infrastructure. Kadarn can connect iSpecimen as a supply source. |
| **Discovery Life Sciences** | Biospecimen procurement + services | Not a competitor — Kadarn can connect DLS as a service provider. |

### 3.4 Verification status

| Competitor | Status | Source | Confidence |
|-----------|--------|--------|------------|
| Inato | Verified — complementary | Public documentation | High |
| Veeva | Verified — complementary | Public documentation + industry knowledge | High |
| Florence | Verified — complementary | Public documentation + industry knowledge | High |
| Slope | Verified — complementary | Public documentation | Medium |
| CRIO | Verified — complementary | Public documentation | Medium |
| IQVIA Site Intelligence | **Open — pending verification** | Market intelligence | Low — requires dedicated analysis |
| iSpecimen | Verified — not competitor | Public documentation | High |
| Discovery Life Sciences | Verified — not competitor | Public documentation | High |

**IQVIA Site Intelligence — open item:** requires full competitive verification to determine whether it occupies the portable evidence space. Marked as pending for dedicated strategic analysis.

---

## 4. Why customers buy Kadarn

| Problem | Kadarn solution | Value |
|---------|----------------|-------|
| Institutional evidence is lost between studies | Portable Evidence Graph that persists across studies and programs | Historical capability evidence is preserved and reusable |
| Capability is difficult to demonstrate objectively | Claims supported by structured evidence (6 Evidence Classes) | Sponsors see evidence, not declarations |
| Sponsors cannot understand site history at a glance | Confidence Graph with mandatory explainable inference | Site capability is navigable, not opaque |
| Institutional knowledge is trapped in siloed systems | Evidence that is neutral, portable, and multi-actor visible | Knowledge outlives individual systems and studies |
| Site-sponsor trust is based on relationships, not data | Evidence-based confidence replaces relationship-dependent assessment | Objective capability assessment at scale |

---

## 5. Scope Guardrails

> **Any future feature proposal that crosses these boundaries requires an ADR and an explicit scope review before implementation.**

Kadarn will not:

| # | Will not become | Rationale |
|---|----------------|----------|
| 1 | A CTMS | Clinical trial management is a mature market with established vendors (Veeva, Florence, Medidata). Kadarn provides evidence infrastructure for site selection — it does not manage study operations. |
| 2 | A LIMS | Laboratory operations are outside Kadarn's scope. Operational Twins serve confidence evidence, not sample tracking. |
| 3 | An eISF | Investigator Site File management is a distinct product category. Kadarn references regulatory evidence but does not manage document workflows. |
| 4 | A sponsor execution platform | Kadarn does not execute clinical trials. It provides infrastructure for evidence-based capability assessment. |
| 5 | A document repository | Evidence Nodes are structured objects with provenance, not document storage. Document management belongs to specialized platforms. |
| 6 | A clinical decision support system | Kadarn does not interpret clinical data, make diagnoses, or recommend treatment. It represents evidence about institutional capabilities. |
| 7 | A marketplace for specimens | Kadarn does not list or transact specimens. It organizes evidence about institutional capabilities. |
| 8 | An AI recommendation engine | AI recommendations (site matching, feasibility) are Engine concerns, not Core. They may be built as Service Engines per ADR-012, but are not part of Kadarn's architectural identity. |

---

## 6. Relationship to KRM-BNO v1.2

The competitive boundary defined in KRM-BNO v1.2 §3 is a **domain-specific subset** of this document. KRM-BNO states what Kadarn is not for the Biospecimen domain. This document states what Kadarn is and is not for its entire platform scope.

---

*This document is artifact P0-010 of the Architecture Freeze Baseline AF-1.0. It defines the external boundary of the Kadarn platform. Any feature crossing these boundaries requires an ADR and scope review.*
