# PB-2.2 — Product Principles

> **Kadarn Product Book v2.0 — Part I: Vision**
> *The principles that govern every product decision*

---

Kadarn is governed by seven principles. These are not aspirations — they are design constraints. Every feature, every screen, every API contract, and every business rule must be consistent with these principles or justify a formal exception.

---

## Principle 1: Evidence Over Reputation

> *Institutions are evaluated on what they can prove, not what they claim.*

**What it means.** In the current system, sponsors select institutions based on who they know, past relationships, and institutional brand. Kadarn inverts this: the primary selection signal is verifiable evidence. An institution with three well-documented biospecimen collection programs and complete SOP evidence should rank above a prestigious institution with no structured evidence, regardless of reputation.

**Example.** When a sponsor searches for institutions capable of PBMC processing for a multi-center study, Kadarn surfaces institutions based on their demonstrated readiness — evidence of BSL-2 certification, viability assessment protocols, cryopreservation SOPs, and past program outcomes. An institution with incomplete evidence appears lower, with specific gaps identified, regardless of how well-known they are in the field.

---

## Principle 2: Explainable, Not Opaque

> *Every readiness assessment traces to specific evidence. No black boxes. No hidden scoring.*

**What it means.** If Kadarn says an institution is "Conditionally Ready" for IVD validation, the platform must explain exactly why: which capabilities are supported, which evidence is missing, what class of evidence would close the gap, and a concrete recommendation for the next step. Every number, status, and assessment must be traceable back to specific evidence items. No composite scores without decomposition. No "algorithm says so" without justification. Every stakeholder — institution, sponsor, regulator, auditor — must be able to verify the chain of reasoning from readiness status back to source evidence.

**Example.** A sponsor reviewing a Conditionally Ready assessment sees: "Capability 'Storage -80°C' is supported by 3 evidence items (Class A: equipment inventory dated 2025-03, Class B: monitoring logs 90-day, Class B: maintenance records). Gap: no LN2 storage documentation (Class B, mandatory). Recommendation: Submit LN2 storage capacity documentation to achieve Ready status."

---

## Principle 3: Institution-First

> *The institution owns its capability data. Sponsors discover it; they don't control it.*

**What it means.** Kadarn's primary relationship is with the institution. The institution builds its capability profile, uploads evidence, and decides when and to whom its readiness data is visible. Sponsors discover institutions through this data, but they do not own it, modify it, or control its visibility. An institution can withdraw from a sponsor's view. An institution can update its evidence and trigger re-evaluation at any time. The institution, not the sponsor and not Kadarn, is the data controller.

**Example.** An institution that has achieved Ready status for Biospecimen Collection can set its visibility to "Network" — making it discoverable by all sponsors on the platform. If the institution later decides to restrict visibility to specific programs only, it can change this setting and Kadarn respects it immediately. No sponsor retains access to readiness data beyond what the institution currently permits.

---

## Principle 4: Derived, Not Declared

> *Readiness is computed from evidence, never manually set.*

**What it means.** No one — not the institution, not the sponsor, not Kadarn — can declare an institution "Ready." Readiness status is always a computation over the current state of the evidence graph. If evidence changes, readiness changes. If evidence expires, readiness degrades. If new evidence is added, readiness improves. The platform's job is to compute and explain — not to certify or guarantee. This principle protects the integrity of the system: every readiness signal has a verifiable evidence trail.

**Example.** An institution cannot click a button to become "Ready" for a program. It can submit evidence. Kadarn evaluates that evidence against the program's requirements and computes readiness. If all mandatory evidence is present and confidence exceeds the threshold, the institution becomes Ready — but only because the evidence supports it, not because anyone declared it.

---

## Principle 5: Multi-Actor, Single Truth

> *The same evidence graph serves institutions, sponsors, CROs, and regulators — with appropriate visibility controls.*

**What it means.** Kadarn does not maintain separate "views" with separate data. There is one evidence graph. One set of claims. One provenance chain. One readiness computation. What differs is the perspective: an institution sees its own readiness gaps and recommendations; a sponsor sees candidate institutions matching its program requirements; a regulator sees the evidence trail for audit. But the underlying data is identical. This eliminates inconsistency, reduces reconciliation burden, and ensures that every actor is operating from the same factual foundation.

**Example.** When a regulator audits an institution's biospecimen collection capability, they see the same evidence nodes, same confidence scores, and same provenance chain that the institution and its sponsor see. The regulator may have additional access (audit trail, historical snapshots), but the evidence itself is not duplicated or reinterpreted.

---

## Principle 6: Capability Over Certification

> *We assess what institutions can DO, not what certificates they hold.*

**What it means.** A certificate is a snapshot. It says an institution met a standard at a point in time. A capability is a living demonstration — supported by current evidence, verified against requirements, and continuously evaluated. Kadarn prioritizes demonstrated operational capability over static credentials. A CAP certificate is valuable evidence, but it is not sufficient alone to demonstrate readiness. It must be accompanied by operational evidence: SOPs, training records, equipment logs, program outcomes. The question is not "are you certified?" but "can you execute this program today?"

**Example.** Two institutions both hold CLIA certification. Institution A has recent PBMC processing logs, viability assessment data, and a current cryopreservation protocol. Institution B has the certificate but no operational evidence from the past 18 months. Kadarn surfaces Institution A as Ready and Institution B as Conditionally Ready with a specific gap: "CLIA certification present (Class A) but operational evidence >18 months. Submit recent processing logs to demonstrate current capability."

---

## Principle 7: Network Effects Through Quality

> *More evidence → better readiness → more sponsor trust → more programs → more evidence.*

**What it means.** Kadarn is designed for a virtuous cycle. Every program an institution executes generates outcome evidence — which strengthens its readiness for future programs. Every sponsor that finds a qualified institution through Kadarn contributes to the evidence base through program outcomes. Every new institution that joins increases the network's coverage of capabilities. But this cycle only works if quality is maintained: low-quality evidence, unverified claims, or stale data break the cycle. Kadarn's architecture — immutable evidence, derived readiness, explainable assessments — is explicitly designed to prevent quality degradation as the network grows.

**Example.** A biobank that demonstrates readiness for 3 program types and executes 5 programs through Kadarn has a rich, cumulative evidence base. When a 6th program opportunity arises, the biobank is immediately discoverable, its readiness is already assessed, and the sponsor can review 5 prior program outcomes as supporting evidence. The biobank didn't have to "re-prove" anything. The platform's network effect worked in its favor — and the sponsor's.

---

## How These Principles Work Together

The seven principles form a coherent system:

- **Evidence over reputation** (1) and **Explainable, not opaque** (2) define *what* Kadarn produces: evidence-backed, traceable assessments.
- **Institution-first** (3) and **Derived, not declared** (4) define *who controls what*: institutions own their data; readiness is computed, not declared.
- **Multi-actor, single truth** (5) and **Capability over certification** (6) define *how* the platform operates: one graph serving many perspectives, emphasizing demonstrated ability over static credentials.
- **Network effects through quality** (7) defines *why* this works at scale: the system gets stronger, not weaker, as more participants join and more evidence accumulates.

---

*Next: PB-2.3 — Product Architecture*
