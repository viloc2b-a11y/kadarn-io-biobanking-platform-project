# Judge A - Round 2 Re-Judgment Report

**Target:** Kadarn Platform - re-verification of 6 fixed issues + residual scan  
**Review type:** Independent, blind adversarial re-review  
**Date:** 2026-06-28  

---

## Fixed Issues - Verification Status

### 1. Rate limiter - unbounded Map growth [RESOLVED]
**Files:** apps/api/src/middleware.ts, apps/api/src/lib/rate-limit.ts

Both modules now include MAX_BUCKETS=10000, setInterval cleanup every 5 min, and evictIfNeeded() two-pass eviction. The fix is correct and prevents OOM.

### 2. TrustEngine.resolveChallenge - hardcoded 0.5 [RESOLVED]
**File:** packages/trust-engine/src/service.ts

Fetches current OrganizationTrust and uses actual dimension scores for non-challenged dimensions. The fix is correct.

### 3. Audit resource_type always other [PARTIALLY RESOLVED]
**File (fixed):** apps/api/src/lib/audit.ts (line 41) - p_resource_type: event.resourceType [OK]
**File (NOT fixed - regression):** apps/api/src/app/api/v1/operations/exceptions/[id]/route.ts (line 107) [FAIL]

Same class bug present in exceptions route. See Finding #1 below.

### 4. Organization capabilities - broken RBAC [RESOLVED]
**File:** apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts

POST handler now queries membership_roles -> organization_roles(key) and checks for org_admin. The fix is correct.

### 5. Graph fabric - non-existent column [RESOLVED]
**File:** apps/api/src/lib/graph-fabric-runtime.ts

Changed to proper join through organization_capability_types. The fix is correct.

### 6. .env.example - real credentials [RESOLVED]
**File:** .env.example (+ apps/web/.env.example, apps/api/.env.example)

All Supabase credentials replaced with placeholders. All 3 files are clean.

---

## NEW / REMAINING FINDINGS

### Finding #1 - CRITICAL: Audit resource_type hardcoded to other in exceptions route (regression)

**File:** apps/api/src/app/api/v1/operations/exceptions/[id]/route.ts (line 107)

**Description:** The route calls emit_audit_event RPC directly with p_resource_type: sourceTable === trust_challenges ? other : other. Both branches return other - the ternary is a no-op. Every audit event from exceptions is logged with resource_type=other.

This is the same bug class that was supposedly fixed in audit.ts but was missed in this separate route.

**Suggested fix:** Use the actual source type as the resource type.

### Finding #2 - WARNING (real): GET /api/v1/organizations/:id/capabilities lacks RBAC

**File:** apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts (GET handler, lines 15-47)

**Description:** GET handler uses withAuth but does NOT check organization membership. Any authenticated user can list capabilities for any org. POST handler correctly checks org_admin.

**Suggested fix:** Add org membership check in GET handler.

### Finding #3 - WARNING (real): Rate limiter race condition on shared Map

**Files:** apps/api/src/middleware.ts (lines 66-76), apps/api/src/lib/rate-limit.ts (lines 51-61)

**Description:** While Map growth is fixed, the race condition between concurrent requests from the same IP persists. The comment about atomic V8 is misleading for Edge Runtime.

**Suggested fix:** Use Redis for exact counts.

### Finding #4 - SUGGESTION: evictIfNeeded() O(n log n) sort on request path

**Files:** apps/api/src/middleware.ts (lines 28-42), apps/api/src/lib/rate-limit.ts (lines 28-42)

**Description:** When Map reaches MAX_BUCKETS, every new IP triggers evictIfNeeded() which sorts all entries O(n log n). Latency spike risk under burst traffic.

**Suggested fix:** Replace with O(1) eviction.

### Finding #5 - WARNING (real): GET capabilities and GET specimens lack org-scoped access control

**File:** apps/api/src/app/api/v1/organizations/[id]/capabilities/route.ts (GET)
**File:** apps/api/src/app/api/v1/specimens/route.ts (GET, already Round 1)

**Description:** Both return org-scoped data without verifying caller authorization.

---

### Round 1 Issues NOT Addressed

15 issues from Round 1 remain open (not in fix scope):
- CRITICAL: SQL injection via .or() interpolation (2 locations)
- WARNING (real): Fire-and-forget audit drops events
- WARNING (real): GET specimens without org scope
- WARNING (real): Missing UUID validation
- WARNING (real): Duplicate createCorrelationId export
- WARNING (real): Active org from user_metadata (client-settable)
- WARNING (real): NULLS NOT DISTINCT requires PG 15+
- WARNING (real): Missing CORS headers
- WARNING (theoretical): N+1 provenance status
- WARNING (theoretical): Provenance recorder silently fails
- WARNING (real): No pagination on search
- WARNING (real): Marketplace search public
- WARNING (real): Swallowed errors in event-runtime
- WARNING (real): Trust event createdAt epoch fallback
- WARNING (real): Feasibility program_id undefined

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL (new) | 1 |
| WARNING (real, new) | 3 |
| SUGGESTION (new) | 1 |
| Round 1 issues still open | 15 |
| FIXES VERIFIED | 5 of 6 fully resolved, 1 partial with regression |

Key finding: The audit p_resource_type bug was fixed in audit.ts but the exceptions route has the exact same issue.

Skill Resolution: none - no project-specific skills mapped in registry.

---

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Independent adversarial re-review of 6 fixed issues plus residual scan."
    },
    {
      "id": "criterion-2",
      "status": "satisfied",
      "evidence": "5 of 6 fixes verified, 1 partial with regression. 5 new findings."
    }
  ],
  "changedFiles": [],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "read, grep, bash - static analysis of fix targets + full-project scan",
      "result": "passed",
      "summary": "Verified 6 fixes, found 1 CRITICAL regression"
    }
  ],
  "validationOutput": [
    "6 fixes verified: 5 resolved, 1 partial",
    "5 new issues: 1 CRITICAL, 3 WARNING (real), 1 SUGGESTION",
    "15 Round 1 issues remain open"
  ],
  "residualRisks": [
    "SQL injection via .or() interpolation still present",
    "15 Round 1 issues not addressed",
    "Full dynamic analysis not performed",
    "Supabase RLS policies not runtime-verified"
  ],
  "noStagedFiles": true,
  "diffSummary": "Read-only adversarial re-review. No files changed.",
  "reviewFindings": [
    "blocker: exceptions route:107 - p_resource_type always other (CRITICAL regression)",
    "blocker: capabilities GET handler lacks RBAC check (WARNING)",
    "major: middleware.ts, rate-limit.ts - Race condition on shared Map (WARNING)",
    "minor: middleware.ts, rate-limit.ts - evictIfNeeded() O(n log n) sort (SUGGESTION)",
    "major: capabilities GET handler lacks org scope (WARNING)"
  ],
  "manualNotes": "Judge A Round 2 re-judgment. Regression in exceptions route must be fixed."
}
```
