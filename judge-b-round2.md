# Judge B - Round 2 Re-Judgment Report

**Date:** 2026-06-28
**Scope:** Verify Round 1 fixes, find any remaining or new issues.

---

## Fix Verification Results

### Fix 1: Rate limiter - unbounded Map growth [VERIFIED]
**Files:** apps/api/src/middleware.ts, apps/api/src/lib/rate-limit.ts

Both files now implement MAX_BUCKETS=10_000, setInterval cleanup every 5 min, and evictIfNeeded() with two-pass cleanup.

### Fix 2: TrustEngine.resolveChallenge - hardcoded 0.5 [VERIFIED]
**File:** packages/trust-engine/src/service.ts

resolveChallenge() now fetches current OrganizationTrust and uses actual scores for non-challenged dimensions.

### Fix 3: Audit resource_type always other [VERIFIED]
**File:** apps/api/src/lib/audit.ts

p_resource_type: event.resourceType is now correctly used instead of hardcoded other.

### Fix 4: Organization capabilities - broken RBAC [VERIFIED]
**File:** apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts

POST handler now queries membership_roles -> organization_roles(key) and checks for org_admin role.

### Fix 5: Graph fabric - non-existent capability column [VERIFIED]
**File:** apps/api/src/lib/graph-fabric-runtime.ts

findOrganizationsByCapability() now uses organization_capability_types!inner(key) join correctly.

### Fix 6: .env.example - real Supabase credentials [VERIFIED]
**File:** .env.example

All values are now placeholders. No real credentials remain.

---

## Findings

### Finding 1 - CRITICAL: Hardcoded other still present in exceptions audit route

**File:** apps/api/src/app/api/v1/operations/exceptions/[id]/route.ts (line 107)

A second call site for emit_audit_event still hardcodes p_resource_type to other via a dead ternary. Both branches return the same value - the ternary is a no-op. Every audit event from this route is logged with resource_type = other regardless of source table. This is the same bug class that was fixed in audit.ts, but left unresolved at this call site.

**Suggested fix:** Replace with a mapping that uses the actual source table to determine the resource type.

### Finding 2 - WARNING (real): Missing lastEventAt / lastDecayAt in resolveChallenge

**File:** packages/trust-engine/src/service.ts (lines 216-232)

resolveChallenge() calls upsertOrganizationTrust with only the challenged dimension score and overallScore, omitting lastEventAt and lastDecayAt. Impact: 1) lastDecayAt stays at pre-resolution value, so freshly-set score decays immediately. 2) lastEventAt not updated, so resolution does not appear as recent activity.

**Suggested fix:** Add lastEventAt and lastDecayAt to the upsertOrganizationTrust call in resolveChallenge.

### Finding 3 - WARNING (theoretical): EvictIfNeeded sorts entire map under DoS

**Files:** apps/api/src/middleware.ts (lines 33-44), apps/api/src/lib/rate-limit.ts (lines 33-44)

evictIfNeeded() sorts all entries (O(n log n) on 10,000 entries) each time a new IP arrives at capacity. Under sustained DoS: every new attacker IP triggers full sort and removal of 2,000 entries; each call allocates new sorted array creating GC pressure; setInterval in middleware.ts is unreliable in Vercel Edge runtime.

**Suggested fix:** Use random eviction instead of sorting; remove setInterval from edge middleware.

### Finding 4 - WARNING (real): .single() error silently discarded in capabilities RBAC query

**File:** apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts (lines 66-78)

The POST handler queries membership with .single() but does not check the Supabase error object. If .single() returns a non-PGRST116 error, the error is silently dropped and a 403 returned even for infrastructure errors.

**Suggested fix:** Check the Supabase error object explicitly and log it.

### Finding 5 - WARNING (real): No validation for event.resourceType against DB enum

**File:** apps/api/src/lib/audit.ts (line 41)

emitAuditEvent passes event.resourceType (plain string) directly to p_resource_type which maps to the audit_resource_type PostgreSQL enum. Invalid values cause silent RPC failure since function is fire-and-forget.

**Suggested fix:** Add input validation or normalization against the valid enum values.

### Finding 6 - SUGGESTION: Capabilities GET endpoint lacks membership check

**File:** apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts (lines 20-51)

The GET handler lists capabilities for any authenticated user without verifying membership.

**Suggested fix:** Add a membership check similar to the POST handler.

---

## Summary

| Issue | Severity | File | Status |
|-------|----------|------|--------|
| Finding 1 | CRITICAL | exceptions/[id]/route.ts:107 | New - same bug class as Fix 3 |
| Finding 2 | WARNING (real) | trust-engine/service.ts:216-232 | New - missing timestamps |
| Finding 3 | WARNING (theoretical) | middleware.ts, rate-limit.ts | New - evictIfNeeded perf |
| Finding 4 | WARNING (real) | capabilities/route.ts:66-78 | New - silent error discard |
| Finding 5 | WARNING (real) | audit.ts:41 | New - unvalidated resourceType |
| Finding 6 | SUGGESTION | capabilities/route.ts:20-51 | New - GET missing check |

---

## Acceptance Report
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "All 6 Round 1 fixes verified as correctly implemented. Each fix addresses the original issue without scope widening."
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "Files read, source code analyzed, database enum definitions verified, git diff inspected. 1 CRITICAL remaining issue and 4 WARNING issues documented with file paths, line numbers, severity, and suggested fixes."
    }
  ],
  "changedFiles": [
    "apps/api/src/middleware.ts",
    "apps/api/src/lib/rate-limit.ts",
    "packages/trust-engine/src/service.ts",
    "apps/api/src/lib/audit.ts",
    "apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts",
    "apps/api/src/lib/graph-fabric-runtime.ts",
    ".env.example"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "grep searches for emit_audit_event, p_resource_type, .single(), handleApiError, audit_resource_type enum",
      "result": "passed",
      "summary": "Verified 2 call sites for emit_audit_event: one fixed (audit.ts), one still hardcoded (exceptions route). Verified DB enum has 17 valid resource types."
    },
    {
      "command": "git log and git diff HEAD --name-only",
      "result": "passed",
      "summary": "Verified 6 fixed files are present in working tree diff."
    }
  ],
  "validationOutput": [
    "All 6 Round 1 fixes verified as correctly implemented.",
    "1 CRITICAL finding: exceptions audit route still hardcodes p_resource_type=other (dead ternary).",
    "4 WARNING findings: missing lastEventAt/lastDecayAt in resolveChallenge, silent .single() error discard, missing resource_type enum validation, theoretical evictIfNeeded perf under DoS.",
    "1 SUGGESTION: GET capabilities endpoint missing membership check."
  ],
  "residualRisks": [
    "CRITICAL: Exceptions route audit events always logged as other - same bug class as Round 1 Fix 3, but at a different call site.",
    "WARNING: resolveChallenge accepted-scores decay immediately from old lastDecayAt - trust score drift over time.",
    "WARNING: Unvalidated resource_type strings cause silent RPC failures in fire-and-forget audit emit.",
    "WARNING: evictIfNeeded O(n log n) sort under DoS could add latency; setInterval unreliable in edge runtime."
  ],
  "noStagedFiles": true,
  "diffSummary": "6 fixed files verified. One CRITICAL issue found in a separate call site (exceptions route) that was not addressed by Round 1 fix scope.",
  "reviewFindings": [
    "CRITICAL: apps/api/src/app/api/v1/operations/exceptions/[id]/route.ts:107 - hardcoded other via dead ternary, same bug class as Fix 3",
    "WARNING: packages/trust-engine/src/service.ts:216-232 - resolveChallenge missing lastEventAt/lastDecayAt in upsert",
    "WARNING: apps/api/src/lib/audit.ts:41 - no validation of event.resourceType against DB enum, silent RPC failure",
    "WARNING: apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts:66-78 - .single() error silently discarded",
    "WARNING (theoretical): apps/api/src/middleware.ts:33-44 and rate-limit.ts:33-44 - evictIfNeeded O(n log n) sort under DoS",
    "SUGGESTION: apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts:20-51 - GET endpoint lacks membership check"
  ],
  "manualNotes": "Finding 1 (exceptions route hardcoded other) is the most urgent - it is a direct continuation of Round 1 Fix 3 scope. Finding 2 (trust engine resolveChallenge timestamps) affects score decay correctness and should be addressed before trusted operations rely on challenge resolutions."
}
```

Skill Resolution: none - no project-specific skills mapped in registry.