# Critical Fix List — Sprint 25A

**Date:** 2026-07-02
**Priority:** Must fix before pilot deployments

---

## Critical (P0) — Block Pilot Deployment

| ID | Issue | Affected Component | Fix |
|---|---|---|---|
| C-001 | Dashboard API does not serve engine outputs | `apps/api/discovery/dashboard/route.ts` | Add capabilityIntelligence, gapIntelligence, assessmentIntelligence, sponsorReadiness, recommendations fields to dashboard response |
| C-002 | Report generation endpoint missing | `apps/api/discovery/report/` | Create endpoint that runs InstitutionRecognitionReportGenerator and returns JSON/HTML |
| C-003 | Sponsor Search uses hardcoded sample data | `apps/web/sponsor-search.tsx` | Wire to CapabilityGraphEngine.search() via API endpoint |
| C-004 | Executive Profile renders empty | `apps/web/executive-profile.tsx` | Wire to DashboardData with engine outputs |
| C-005 | Evidence Firewall not in Discovery path | `packages/evidence-discovery/src/orchestrator.ts` | Insert firewall.process() before orchestrator accepts artifacts |

---

## High (P1) — Should Fix Before Pilots

| ID | Issue | Affected Component | Fix |
|---|---|---|---|
| H-001 | Connector Layer adapters use `fetch()` with no actual URL reachability | 7 adapter files | Verify ClinicalTrials.gov and PubMed adapters make real HTTP calls with error handling |
| H-002 | Identity Resolution not connected to Connector Layer | `identity-resolution/engine.ts` | Add `resolveFromConnector()` method that consumes ConnectorRegistry output |
| H-003 | Public Profile has no data path | `apps/web/public-profile.tsx` | Create public API endpoint serving sanitized institution data |
| H-004 | Recognition Report generator not callable from UI | `report-generation-cta.tsx` | Enable button, wire to API endpoint |
| H-005 | Continuous Monitoring orchestrator not triggered | `continuous-monitoring/orchestrator.ts` | Add trigger on session creation / artifact upload |

---

## Medium (P2) — Nice to Have

| ID | Issue | Affected Component | Fix |
|---|---|---|---|
| M-001 | Notification delivery channel missing | `notification-center/center.ts` | Add in-app notification display component |
| M-002 | Visibility Inspector UI missing | New component | Create kadarn-internal visibility debug panel |
| M-003 | Identity Status panel missing | New component | Create kadarn-internal identity resolution status panel |
| M-004 | Firewall Status panel missing | New component | Create kadarn-internal firewall status dashboard |
| M-005 | Private Evidence metadata persistence | `private-evidence/engine.ts` | Add storage adapter for PrivateEvidenceRecord |

---

## Dependency Order

```
C-001 (Dashboard API) → enables C-004 (Executive Profile), H-004 (Report)
C-002 (Report endpoint) → enables H-004 (Report button)
C-003 (Sponsor Search) → independent
C-005 (Firewall in Discovery) → protects all downstream engines
H-001 (Connector HTTP) → enables H-002 (Identity Resolution)
H-003 (Public Profile API) → independent
```

Recommended fix order: C-005 → C-001 → C-002 → C-004 → C-003 → H-001 → H-002 → H-003 → M-001 through M-005

---

*This list should be reviewed and updated after each fix. Mark items as resolved with commit reference.*
