# PDF-1.4 — Supported Workflows

**Sprint:** PDF-1.4  
**Gate:** Workflow Freeze  
**Status:** Draft for approval  
**Sign-off role:** Product

Only workflows listed here are **officially supported** in Kadarn 1.0. All others are experimental, partial, or out of scope.

---

## Workflow 1 — Institution onboarding (Site)

**Actor:** Site Director / Institution admin  
**Experience:** Workspace (`/workspace`)

```
Institution signup / org creation
        ↓
Profile & consent configuration
        ↓
Connector setup (inbound evidence sources)
        ↓
Discovery session initiated
        ↓
Evidence intake → Facts → Claims (Evidence Core)
        ↓
Claim review / curation (human-in-the-loop)
        ↓
Published View projection
        ↓
Evidence Passport live (public or visibility-governed)
```

**Supported APIs:** Workspace internal routes, Evidence Core writes, Discovery curation, Published View reads.

**Not supported in 1.0:** Automated institution verification badges; push notification delivery.

---

## Workflow 2 — Institutional discovery (Site + KOC)

**Actor:** Site Director (initiate), KOC operator (govern)  
**Experiences:** Workspace, KOC (`/koc`)

```
Discovery session created
        ↓
Connectors ingest documents / structured sources
        ↓
Discovery agents (capability detection, firewall)
        ↓
Candidate claims surfaced
        ↓
KOC curation queue (approve / reject / defer)
        ↓
Claims promoted to Evidence Core
        ↓
Dashboard + Recognition Report available
```

**Stable read surfaces:**

- `GET /api/v1/discovery/dashboard?sessionId=…`
- `GET /api/v1/discovery/report?sessionId=…`

---

## Workflow 3 — Evidence claim lifecycle

**Actor:** Site Director, KOC (oversight)  
**Experience:** Workspace continuity

```
Claim draft (from discovery or manual)
        ↓
Evidence attached (provenance recorded)
        ↓
Submit for review
        ↓
Verify / reject (KOC or policy)
        ↓
Promote to published claim
        ↓
Counter-evidence / right-of-response (if challenged)
        ↓
Published View refresh → Passport update
```

**Governance:** Visibility Policy + Institutional Consent on sensitive reads.

---

## Workflow 4 — Public Passport consumption (anonymous)

**Actor:** Any visitor (sponsor, auditor, public)  
**Decision:** [phase-8-passport-public-read-decision.md](../phase-8-passport-public-read-decision.md)

```
Visitor requests Passport URL (/site-passport/{slug})
        ↓
GET /api/v1/continuity/passport/{slug}
        ↓
Published View (visibility-filtered claims)
        ↓
Passport rendered (no auth required for public claims)
```

**Rule:** Passport reads never bypass Published View boundary (ADR-030).

---

## Workflow 5 — Sponsor evaluation

**Actor:** Sponsor user  
**Experience:** Marketplace (`/marketplace`)

```
Sponsor login
        ↓
Search institutions / capabilities
        ↓
Institution profile review
        ↓
Passport deep-dive (read-only)
        ↓
Discovery report request (session-scoped)
        ↓
Save / request follow-up (marketplace requests)
```

```
Sponsor
    ↓
Search
    ↓
Institution
    ↓
Passport
    ↓
Evidence context (via Published View — not raw Evidence Core)
```

**Not supported in 1.0:** Sponsor-side CTMS integration; specimen ordering; contract execution.

---

## Workflow 6 — Institution public profile

**Actor:** Public / Sponsor  
**Experience:** `/institutions/[slug]`

```
GET /api/v1/institution/public/{slug}
        ↓
Published View (capabilities summary)
        ↓
Public institution page
```

---

## Workflow 7 — Kadarn Operations (KOC)

**Actor:** Kadarn operator (internal role)  
**Experience:** KOC (`/koc`)

```
Evidence queue monitoring
        ↓
Discovery review & curation
        ↓
Connector / pipeline health
        ↓
Phase 8 cutover status (`/api/v1/operations/phase8-cutover`)
        ↓
Policy / SLA / exception handling
        ↓
Analytics & ecosystem oversight
```

**Not a workflow product:** KOC is governance infrastructure, not a customer-facing SKU.

---

## Workflow 8 — Phase 8 cutover operations

**Actor:** Platform operator  
**Pre-GA gate**

```
Staging: LEGACY_PASSPORT_ENABLED=false
        ↓
Smoke: 4 external routes + equivalence gate
        ↓
Ops endpoint confirms published_view_path=active
        ↓
Production cutover (pending authorization)
        ↓
Compatibility Layer retained until post-GA sign-off
```

*Reference:* [phase-8-staging-cutover-report.md](../phase-8-staging-cutover-report.md)

---

## Workflow 9 — Evidence Pack (RC — not GA prod)

**Actor:** Integrator / future delivery consumer  
**Status:** Stub only in 1.0

```
Published View (claim scope)
        ↓
Evidence Pack compile (stub API)
        ↓
[Phase 9] Delivery Engine → Channel
```

**Frozen rule:** Never `Evidence Core → PDF`. Always `Published View → Delivery Artifact → Channel`.

KEMS-007 completion (Gentle AI) enables RC delivery workflows; they are **not** GA until PDF-1.7 + RC-2 criteria met.

---

## Explicitly unsupported workflows

| Workflow | Reason |
|----------|--------|
| CTMS study startup | Out of product category (PDF-1.5) |
| Specimen marketplace transaction | Out of scope |
| LIMS sample processing | Experimental engine only |
| Email/PDF auto-delivery to sponsor | Phase 9 RC |
| Vilo OS as mandatory bootstrap | Kadarn standalone required |
| Trust badge / Gold-Silver-Bronze verification | Retired (ADR-010) |

---

## Gate: Workflow Freeze

- [x] Site onboarding → Passport chain documented
- [x] Discovery → Curation → Claims documented
- [x] Sponsor search → Passport documented
- [x] KOC ops workflow documented
- [x] Phase 8 cutover ops documented
- [x] RC delivery workflow marked non-GA
- [ ] **Product sign-off**

**Upon approval:** new end-to-end workflows require PDF-1.4 amendment before GA marketing.
