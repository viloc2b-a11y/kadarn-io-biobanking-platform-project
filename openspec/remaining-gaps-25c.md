# Remaining Integration Gap Report — Sprint 25C

**Date:** 2026-07-02
**Status:** Post-wiring gap analysis

---

## What 25C Resolves

After executing the API wiring specified in `api-integration-report-25c.md`:

| Gap | Before 25C | After 25C |
|---|---|---|
| Dashboard engine outputs | ❌ Agent only | ✅ Engine outputs in API |
| Report generation | ❌ No endpoint | ✅ `GET /api/v1/discovery/report` |
| Sponsor Search | ❌ Sample data | ✅ `POST /api/v1/sponsor/search` |
| Executive Profile | ❌ No data | ✅ Via dashboard API (engine fields) |
| Public Profile | ❌ No endpoint | ✅ `GET /api/v1/institution/public/{slug}` |
| Discovery Workspace | ❌ No endpoint | ✅ `POST /api/v1/sponsor/workspace` |
| Opportunity Brief | ❌ No endpoint | ✅ `POST /api/v1/opportunity/brief` |
| Institutional Consent | ❌ No endpoint | ✅ `POST/GET/PUT /api/v1/consent` |
| Feasibility Passport | ❌ No endpoint | ✅ `GET /api/v1/passport` |

**Resolved: 9 critical gaps.**

---

## What Remains After 25C

These gaps require work beyond API wiring — they involve infrastructure, external systems, or new UI:

| Gap | Category | Required Sprint |
|---|---|---|
| Evidence Firewall in Discovery path | Infrastructure | 25D |
| Connector Layer real HTTP calls | External integration | 25D |
| Identity Resolution → Connector wiring | Infrastructure | 25D |
| Continuous Monitoring triggers | Infrastructure | 25D |
| Private Evidence metadata persistence | Infrastructure | 25E |
| Notification delivery UI | Frontend | 25E |
| Admin dashboards (Visibility, Firewall, Identity) | Frontend | 25E |
| Collaboration Workspace beyond shell | Frontend | Post-pilot |
| Opportunity Brief UI | Frontend | 25D |
| Consent UI | Frontend | 25D |
| Passport UI | Frontend | 25D |
| Rate limiting | Security | 25D |
| Audit logging | Security | 25D |
| CORS configuration | Security | 25D |
| Dependency audit | Security | 25D |

---

## Integration Status After 25C (Projected)

| Layer | ✅ | ⚠️ | ❌ | Total |
|---|---|---|---|---|
| Dashboard | 10 | 0 | 0 | 10 |
| Reports | 1 | 0 | 0 | 1 |
| Profiles | 2 | 0 | 0 | 2 |
| Sponsor Products | 6 | 0 | 0 | 6 |
| APIs | 17 | 0 | 0 | 17 |
| Infrastructure | 1 | 2 | 3 | 6 |
| Security | 0 | 0 | 4 | 4 |
| Frontend UI | 6 | 0 | 4 | 10 |

**Projected after 25C: 43 wired, 2 partial, 11 not wired**

---

## Path to 100% Wired

```
25C: API wiring (9 endpoints) → 43/56 components wired
25D: Infrastructure + Security + UI (Firewall, Connector, Brief UI, Consent UI, Passport UI)
25E: Remaining UI (Notifications, Admin dashboards, Private Evidence persistence)
```

After 25E: All 56 components fully wired. Ready for pilots.

---

*This is the last gap report before production hardening. Update after 25D.*
