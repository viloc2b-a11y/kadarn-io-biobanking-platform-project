# NEGATIVE AND UNKNOWN CLAIM POLICY

**Document ID:** KEMS-CLAIM-NEG-001
**Work Order:** WO-KEMS-PROFILE-001

---

## 1. Purpose

Define the semantics and treatment of claims where the site:
- Explicitly declares absence of a capability (NEGATIVE)
- Has not been asked (NOT_COLLECTED)
- Has been asked but doesn't know (UNKNOWN)
- Is awaiting confirmation (PENDING_CONFIRMATION)
- Has stated the capability does not apply (NOT_APPLICABLE)

---

## 2. State Definitions

| State | Meaning | User Action | System Behavior |
|---|---|---|---|
| **NOT_COLLECTED** | Question not yet presented | — | Show as gap in profile; prompt during next onboarding step |
| **UNKNOWN** | User asked; user doesn't know | "I don't know" | Escalate to appropriate role; mark for follow-up |
| **PENDING_CONFIRMATION** | Answer given; awaiting institutional confirmation | "Submitted for review" | Visible as pending; does not contribute to readiness |
| **DECLARED_YES** | Confirmed positive claim | "Yes, we can do this" | Standard claim lifecycle |
| **EXPLICIT_NO** | Confirmed negative ("We do NOT have this") | "No, we don't have this" | Record as NEGATIVE_DECLARATION |
| **NOT_APPLICABLE** | Capability doesn't apply to this entity type | "N/A — we're a CRO, not a lab" | Excluded from readiness; never prompts again |

---

## 3. NEGATIVE_DECLARATION Policy

### 3.1 Valid Uses

| Scenario | Example |
|---|---|
| Absence declaration | "We do NOT have onsite pharmacy." |
| Scope limitation | "We do NOT process samples requiring BSL-3." |
| Phase limitation | "We do NOT conduct Phase I studies." |

### 3.2 Evidence for Negative Claims

Negative claims require LESS evidence than positive claims:

```yaml
negative_claim_evidence_policy:
  organizational_structure: "Accepted — org chart showing no pharmacy dept"
  facility_inventory: "Accepted — equipment list showing no -80°C freezer"
  self_attestation: "Accepted — authorized role confirms absence"
  external_reference: "Optional — public profile confirming scope"
  evidence_weight: 0.3  # Lower than positive claims (0.5-1.0)
```

### 3.3 Benefits of Negative Declarations

- Prevents repeated queries from sponsors ("Do you have a pharmacy?")
- Reduces irrelevant feasibility requests
- Improves matching accuracy (don't send pharmacy studies to non-pharmacy sites)
- Builds trust through transparency

---

## 4. UNKNOWN Handling

When a user responds UNKNOWN:

```
1. Record as UNKNOWN with timestamp
2. Identify the appropriate role to answer (Lab Director for lab questions, etc.)
3. Create a follow-up task for that role
4. After 7 days: remind
5. After 30 days: escalate to Site Admin
6. After 90 days: mark as STALE_UNKNOWN
```

STALE_UNKNOWN is treated as NOT_APPLICABLE for readiness calculation but remains visible as a gap.

---

## 5. NOT_COLLECTED vs UNKNOWN vs NOT_APPLICABLE

| | NOT_COLLECTED | UNKNOWN | NOT_APPLICABLE |
|---|---|---|---|
| **Prompted?** | Not yet | Yes | Yes |
| **User responded?** | No | Yes ("I don't know") | Yes ("N/A") |
| **Will be prompted again?** | Yes (next session) | Yes (after follow-up) | No (excluded) |
| **Affects readiness?** | No | No | No |
| **Visible to sponsors?** | As "not assessed" | As "under review" | As "N/A" |

---

## 6. State Transition Rules

```
NOT_COLLECTED → UNKNOWN (user asked, doesn't know)
NOT_COLLECTED → DECLARED_YES (user answered yes)
NOT_COLLECTED → EXPLICIT_NO (user answered no)
NOT_COLLECTED → NOT_APPLICABLE (user says N/A)

UNKNOWN → PENDING_CONFIRMATION (escalated to right role)
UNKNOWN → DECLARED_YES (role confirmed yes)
UNKNOWN → EXPLICIT_NO (role confirmed no)
UNKNOWN → STALE_UNKNOWN (90 days no response)

PENDING_CONFIRMATION → DECLARED_YES (institution confirmed)
PENDING_CONFIRMATION → EXPLICIT_NO (institution denied)
PENDING_CONFIRMATION → UNKNOWN (confirmation expired, back to unknown)

EXPLICIT_NO → DECLARED_YES (capability acquired later; new claim created)

DECLARED_YES → EXPLICIT_NO (capability lost; claim withdrawn, new negative recorded)
```

---

*NEGATIVE_AND_UNKNOWN_CLAIM_POLICY.md — WO-KEMS-PROFILE-001 — 2026-07-30*
