# Pilot Blockers Report — Sprint 25B

**Date:** 2026-07-02
**Based on:** End-to-End Integration Matrix

---

## Critical (P0) — Must Fix Before Any Pilot

| ID | Blocker | Impact | Fix Sprint |
|---|---|---|---|
| B-001 | Evidence Firewall not in Discovery ingestion path | All evidence enters unvalidated. Cannot claim "trustworthy evidence" to sponsors. | 25C |
| B-002 | Dashboard API does not serve engine outputs | Executive Profile, Sponsor Readiness, Research Assets, Gaps show stale/agent-only data. | 25C |
| B-003 | Report generation endpoint missing | "Generate Report" button permanently disabled. Cannot demo core product. | 25C |
| B-004 | Sponsor Search uses hardcoded sample data | Cannot demo anonymous capability search with real data. | 25C |
| B-005 | Executive Profile renders without data | Cannot demo institutional profile to sponsors or sites. | 25C |
| B-006 | Public Profile has no data path | Cannot demo public institution page. | 25D |
| B-007 | Opportunity Brief has no UI | Cannot demo the core sponsor-to-site workflow. | 25D |
| B-008 | Institutional Consent has no UI | Cannot demo consent-gated access. | 25D |

---

## High (P1) — Should Fix Before Pilots

| ID | Issue | Impact | Fix Sprint |
|---|---|---|---|
| B-101 | Connector Layer not making real HTTP calls | No live external data. Demo depends entirely on synthetic data. | 25D |
| B-102 | Identity Resolution not connected to Connector Layer | Cannot resolve real institution identities. | 25D |
| B-103 | Continuous Monitoring not triggered | No automatic refresh when new data arrives. | 25D |
| B-104 | Recommendation data not in dashboard API | "Recommended Next Actions" shows nothing. | 25C |
| B-105 | Private Evidence metadata not persisted | Cannot demo private evidence contribution. | 25E |

---

## Medium (P2) — Nice to Have

| ID | Issue | Impact | Fix Sprint |
|---|---|---|---|
| B-201 | Notification delivery UI missing | Notifications generated but invisible. | 25E |
| B-202 | Visibility Inspector UI missing | Cannot demo policy enforcement to Kadarn Internal. | 25E |
| B-203 | Firewall Status dashboard missing | Cannot show firewall metrics. | 25E |
| B-204 | Identity Status dashboard missing | Cannot show identity resolution status. | 25E |
| B-205 | Collaboration Workspace is shell only | No document sharing in demo. | Post-pilot |

---

## Low (P3) — Defer to Post-Pilot

| ID | Issue |
|---|---|
| B-301 | Monitoring dashboard UI |
| B-302 | Connector health dashboard |
| B-303 | Full Connector Layer activation (all 7 providers) |
| B-304 | Zero Knowledge Proof for Private Evidence |
| B-305 | Email/push notification delivery |

---

## Blocker Resolution Order

```
Week 1 (25C): B-001 → B-002 → B-003 → B-004 → B-005 → B-104
Week 2 (25D): B-006 → B-007 → B-008 → B-101 → B-102 → B-103
Week 3 (25E): B-105 → B-201 → B-202 → B-203 → B-204
```

After Week 3: Kadarn is demo-ready with real data paths for all critical flows.

---

*This report drives Sprint 25C-25E prioritization. Update after each sprint.*
