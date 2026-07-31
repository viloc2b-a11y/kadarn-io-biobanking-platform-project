# CLAIM ADMISSION AND BOUNDEDNESS RULES

**Document ID:** KEMS-CLAIM-ADMISSION-001
**Work Order:** WO-KEMS-PROFILE-001
**Baseline:** WO-KEMS-DOC-001 ACCEPTED, WO-KEMS-DOC-002 ACCEPTED

---

## 1. Claim Admission Pipeline

Every claim entering KADARN must pass through this pipeline:

```
User submits claim
  → 1. DUPLICATE DETECTION
  → 2. TERMINOLOGY REVIEW
  → 3. BOUNDEDNESS TEST
  → 4. CONTRADICTION TEST
  → 5. TAXONOMY APPROVAL
  → Claim ADMITTED or REJECTED
```

---

## 2. Duplicate Detection

Before admission, compare against existing claims:

| Check | Method | Action on Match |
|---|---|---|
| Exact text match | String comparison on `canonical_statement` | REJECT — "This exact claim already exists." |
| Semantic similarity | Cosine similarity on claim embedding > 0.95 | FLAG — "A very similar claim exists. Are you updating it?" |
| Same entity + capability | Same `entity_scope` + same `capability_id` | REJECT — "This capability is already claimed for this entity." |

---

## 3. Terminology Review

Claims must use KADARN Lexicon terms. Non-lexicon terms trigger review:

| Rule | Example | Result |
|---|---|---|
| All terms in Lexicon | "Can process PBMC samples" | PASS |
| Unknown term detected | "Can do next-gen sequencing" | FLAG — "next-gen sequencing" not in Lexicon; suggest "NGS" |
| Generic superlative | "We are experts" | REJECT — superlatives are not claims |
| Marketing language | "World-class facility" | REJECT — marketing language is not evidence-based |
| Absolute without context | "Fully compliant" | REJECT — must specify what, under what standard |

---

## 4. Boundedness Test

Every claim must answer 8 dimensions. Score: 0-2 per dimension. Minimum 10/16 to pass.

| # | Dimension | Score 0 | Score 1 | Score 2 |
|---|---|---|---|---|
| 1 | **WHO** — asserting entity | Missing | Role stated | Specific person + role |
| 2 | **WHAT** — capability | Vague ("we do research") | General area ("oncology trials") | Specific ("Phase II oncology trials with RECIST assessment") |
| 3 | **WHERE** — entity scope | Missing | Institution-level | Specific location/equipment/person |
| 4 | **CONTEXT** — conditions | Missing | General context | Specific SOP, protocol, or standard |
| 5 | **SINCE** — effective date | Missing | Year only | Full date |
| 6 | **UNTIL** — validity | Missing | Open-ended | Specific date or condition |
| 7 | **VOLUME/CAPACITY** — limits | N/A | Approximate | Specific number with units |
| 8 | **LIMITATIONS** — exclusions | Missing | Generic disclaimer | Specific exclusions with rationale |

### Examples

**REJECTED (score 3/16):**
> "We have Phase I capabilities."

| Dimension | Score |
|---|---|
| WHO: ❌ | 0 |
| WHAT: Phase I (too broad) | 1 |
| WHERE: ❌ | 0 |
| CONTEXT: ❌ | 0 |
| SINCE: ❌ | 0 |
| UNTIL: ❌ | 0 |
| VOLUME: N/A | 1 |
| LIMITATIONS: ❌ | 0 |

**ACCEPTED (score 14/16):**
> "Location Houston-01 (PI: Dr. Smith) can support overnight observation for up to 12 participants under protocols not requiring ICU-level care, per SOP OBS-003, effective 2025-06-01, reviewed annually."

| Dimension | Score |
|---|---|
| WHO: Dr. Smith, PI | 2 |
| WHAT: Overnight observation, non-ICU | 2 |
| WHERE: Location Houston-01 | 2 |
| CONTEXT: SOP OBS-003 | 2 |
| SINCE: 2025-06-01 | 2 |
| UNTIL: Reviewed annually | 1 |
| VOLUME: Up to 12 participants | 2 |
| LIMITATIONS: Not ICU-level | 1 |

---

## 5. Contradiction Test

Before admission, check against existing claims:

```yaml
contradiction_rules:
  - check: "Does this claim contradict any existing claim for the same entity?"
    action: "FLAG — INTERNAL_CONSISTENCY_CONFLICT"
  - check: "Does this claim contradict institutional profile data?"
    action: "FLAG — PROFILE_CONFLICT"
  - check: "Does this claim contradict an uploaded document?"
    action: "FLAG — CLAIM_VS_DOCUMENT_CONFLICT"
```

Conflicts do NOT block admission. They flag for human review. The claim is admitted with `consistency_status: CONFLICT_DETECTED`.

---

## 6. Taxonomy Approval

### Catalog Claim

Claims matching the canonical taxonomy are auto-admitted with status `declared_unsupported`.

### Custom Claim Proposal

Claims NOT in the catalog enter the custom pipeline:

```
proposed
  → terminology_review (24h auto or manual)
  → duplicate_detection
  → boundedness_test (score ≥ 10)
  → contradiction_test
  → taxonomy_review (human: KADARN reviewer)
  → approved OR rejected
```

Custom claims that pass are added to the taxonomy as `CUSTOM_CLAIM_PROPOSAL` type and remain in `proposed` status until taxonomy reviewer approves.

---

## 7. Admission Decision Matrix

| Test Result | Action |
|---|---|
| All PASS | ADMIT — status: `declared_unsupported` |
| Boundedness < 10 | REJECT — "Claim is too vague. Please specify who, what, where, context, since." |
| Duplicate detected | REJECT — "This claim already exists." |
| Superlative/marketing | REJECT — "Claims must be specific and verifiable." |
| Contradiction detected | ADMIT with flag — status includes `INTERNAL_CONSISTENCY_CONFLICT` |
| Custom, not in catalog | ADMIT as `proposed` — requires taxonomy reviewer approval |

---

## 8. Claim → Capability Projection

The canonical pipeline from raw input to published capability:

```
Answer (raw user input)
  ↓
Fact (structured data point)
  ↓
Claim Candidate (passes boundedness test)
  ↓
Claim (admitted to system)
  ↓
Capability Projection (published on Passport/Portfolio)
```

Not all claims become capabilities. A claim must be:
- `declared_documented` or higher
- Not `disputed`
- Not `expired`
- Entity scope resolves to a published entity
- Visibility allows publication

---

*CLAIM_ADMISSION_AND_BOUNDEDNESS_RULES.md — WO-KEMS-PROFILE-001 — 2026-07-30*
