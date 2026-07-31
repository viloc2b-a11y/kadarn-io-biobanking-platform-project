# CLAIM CORRECTION AND SUPERSESSION POLICY

**Document ID:** KEMS-CLAIM-CORR-001
**Work Order:** WO-KEMS-PROFILE-001

---

## 1. Purpose

Sites must be able to correct claims without silently overwriting history. Every version is preserved. Every correction has an auditable reason. The Passport always reflects the current version; the audit trail preserves all prior versions.

---

## 2. Correction Types

| Type | Example | Creates New Version? | Preserves Old? |
|---|---|---|---|
| **Factual correction** | "Capacity changed from 12 to 20 participants" | ✅ Yes (v1 → v2) | ✅ v1 marked `superseded` |
| **Scope update** | "Now also available at Location B" | ✅ Yes | ✅ v1 retained for Location A |
| **Withdrawal** | "Capability no longer available" | ✅ Yes | ✅ v1 preserved as history |
| **Evidence update** | "New certification linked" | ❌ No (same claim, more evidence) | N/A |
| **Typo fix** | "Fixed spelling of 'centrifuge'" | ❌ No (minor edit) | N/A |
| **Dispute resolution** | "Counter-evidence resolved" | ❌ No (status change only) | N/A |

---

## 3. Supersession Flow

```
Claim v1 (active)
  ↓
User submits correction with reason
  ↓
System creates Claim v2
  ↓
v2 inherits: claim_id, entity_scope, claim_type
v2 updates: canonical_statement, limitations, valid_until
  ↓
v1 marked: status=superseded, superseded_by=v2.id
v2 marked: status=declared_unsupported (re-enters lifecycle)
  ↓
Evidence from v1 is preserved and linked to v2
Passport now shows v2
Audit trail shows v1 → v2 chain
```

---

## 4. Correction Record

```yaml
correction:
  original_claim_id: "uuid:claim-001"
  new_claim_id: "uuid:claim-001-v2"
  corrected_by: "uuid:person:dr-smith"
  corrected_by_role: "Principal Investigator"
  correction_reason: "Updated capacity from 12 to 20 participants after facility expansion"
  correction_type: "factual_correction"
  corrected_at: "2026-03-15T14:00:00Z"
  fields_changed:
    - field: "capacity_limit"
      old_value: "12"
      new_value: "20"
  impact:
    readiness_affected: true
    passport_updated: true
    sponsor_packages_affected: true
    notification_sent_to: ["sponsor-a", "cro-b"]
```

---

## 5. What Cannot Be Corrected

| Operation | Allowed? | Alternative |
|---|---|---|
| Delete a claim | ❌ | Withdraw it (preserved as history) |
| Change claim owner | ❌ | Create new claim under correct owner; withdraw old |
| Change claim type | ❌ | Withdraw old; submit new under correct type |
| Remove evidence link | ❌ | Add counter-evidence or mark evidence as superseded |
| Edit without reason | ❌ | Reason is mandatory for all corrections |

---

## 6. Passport and Readiness Impact

When a claim is superseded:

| Change | Readiness Impact | Passport Impact |
|---|---|---|
| Capacity increased | Recalculate readiness (may improve) | Show updated capacity |
| Capacity decreased | Recalculate readiness (may degrade) | Show updated capacity; flag if below threshold |
| Scope narrowed | Affected locations lose the capability | Show per-location status |
| Withdrawn | Capability removed from readiness | Show as "Previously available: [date range]" |
| Minor edit (typo) | No impact | No visible change |

---

## 7. Audit Trail Requirements

Every claim must maintain:

```yaml
claim_audit_trail:
  versions:
    - version: 1
      status: superseeded
      created_at: "2026-01-01"
      superseded_at: "2026-03-15"
      superseded_by: "uuid:claim-001-v2"
    - version: 2
      status: declared_documented
      created_at: "2026-03-15"
      supersedes: "uuid:claim-001"
  corrections:
    - corrected_by: "uuid:person:dr-smith"
      reason: "Updated capacity from 12 to 20 participants"
      at: "2026-03-15T14:00:00Z"
  hash_chain:  # Provenance chain (Attestix pattern)
    - version: 1
      claim_hash: "sha256:abc123..."
      previous_hash: "0" * 64
    - version: 2
      claim_hash: "sha256:def456..."
      previous_hash: "sha256:abc123..."
```

---

*CLAIM_CORRECTION_AND_SUPERSESSION_POLICY.md — WO-KEMS-PROFILE-001 — 2026-07-30*
