# CLAIM DEPENDENCY MODEL

**Document ID:** KEMS-CLAIM-DEP-001
**Work Order:** WO-KEMS-PROFILE-001

---

## 1. Purpose

Some claims depend on other claims being true. If a parent claim is invalidated, children must degrade. This prevents a site from appearing capable when a critical dependency has failed.

---

## 2. Dependency Types

| Type | Semantics | Degradation Rule |
|---|---|---|
| **ALL_REQUIRED** | All component claims must be true | If ANY component expires/disputed → parent degrades to `evidence_stale` |
| **ANY_SUFFICIENT** | At least one component must be true | If ALL components expire → parent degrades |
| **N_OF_M** | At least N of M components must be true | If fewer than N remain → parent degrades |
| **ENABLES** | Parent claim ENABLES child; child can exist independently | If parent expires → child is unaffected |
| **REQUIRES** | Child REQUIRES parent; child cannot exist without parent | If parent expires → child ALSO expires |

---

## 3. Dependency Graph Examples

### Example 1: PBMC Processing (ALL_REQUIRED)

```yaml
parent_claim: "CAP-001: Can perform PBMC processing"
  dependency_type: ALL_REQUIRED
  components:
    - "CAP-001a: Personnel trained in PBMC processing (GCP + SOP)"
    - "CAP-001b: Equipment available (centrifuge, biosafety cabinet)"
    - "CAP-001c: SOP PBMC-003 active and current"
    - "CAP-001d: -80°C storage validated and monitored"
  degradation:
    if_any_component_expires: "CAP-001 → evidence_stale"
    if_any_component_disputed: "CAP-001 → disputed"
    passport_message: "PBMC processing capability is currently degraded: -80°C storage certification expired."
```

### Example 2: International Shipping (ALL_REQUIRED + ENABLES)

```yaml
parent_claim: "CAP-002: Can ship samples internationally"
  dependency_type: ALL_REQUIRED
  components:
    - "CAP-002a: IATA-certified personnel available"
    - "CAP-002b: Validated cold-chain shipping equipment"
    - "CAP-002c: Export licenses for biological samples"

child_claim: "CAP-003: Can ship to EU countries"
  dependency_type: REQUIRES (requires CAP-002)
  additional_components:
    - "CAP-003a: GDPR-compliant data transfer agreement"
    - "CAP-003b: EU-based receiving partner agreement"
```

### Example 3: Phase I Readiness (N_OF_M)

```yaml
parent_claim: "CAP-004: Phase I study ready"
  dependency_type: N_OF_M
  n_required: 3
  m_total: 5
  components:
    - "CAP-004a: ACLS-certified personnel on site"
    - "CAP-004b: Crash cart with current inspection"
    - "CAP-004c: Emergency response SOP active"
    - "CAP-004d: Overnight observation capability"
    - "CAP-004e: Pharmacy with IP storage"
  degradation:
    if_below_n: "CAP-004 → evidence_stale"
    current_status: "4 of 5 components active"
```

---

## 4. Dependency Resolution Engine

```typescript
interface ClaimDependency {
  parentClaimId: string
  dependencyType: 'ALL_REQUIRED' | 'ANY_SUFFICIENT' | 'N_OF_M' | 'ENABLES' | 'REQUIRES'
  componentClaimIds: string[]
  nRequired?: number  // For N_OF_M
  degradationRule: 'degrade_parent' | 'degrade_child' | 'degrade_both'
}

function resolveDependencies(parentClaim: Claim, componentClaims: Claim[]): DependencyResult {
  const activeComponents = componentClaims.filter(c =>
    c.status === 'verified' || c.status === 'declared_documented'
  )

  switch (parentClaim.dependencyType) {
    case 'ALL_REQUIRED':
      if (activeComponents.length < componentClaims.length) {
        return { action: 'degrade_parent', reason: `${componentClaims.length - activeComponents.length} components inactive` }
      }
      break
    case 'ANY_SUFFICIENT':
      if (activeComponents.length === 0) {
        return { action: 'degrade_parent', reason: 'No active components' }
      }
      break
    case 'N_OF_M':
      if (activeComponents.length < (parentClaim.nRequired || 0)) {
        return { action: 'degrade_parent', reason: `Only ${activeComponents.length} of ${parentClaim.nRequired} required active` }
      }
      break
    case 'REQUIRES':
      if (parentClaim.status === 'expired' || parentClaim.status === 'disputed') {
        return { action: 'degrade_child', reason: `Parent claim ${parentClaim.id} is ${parentClaim.status}` }
      }
      break
  }

  return { action: 'none' }
}
```

---

## 5. Dependency Chain Verification

When a claim is updated, the system must:

1. Identify all claims that depend on this claim (REQUIRES or ALL_REQUIRED)
2. Re-evaluate each dependent claim
3. If degradation triggered → update status + notify site
4. Recalculate readiness for affected entities
5. Update Passport if visible claims changed

---

*CLAIM_DEPENDENCY_MODEL.md — WO-KEMS-PROFILE-001 — 2026-07-30*
