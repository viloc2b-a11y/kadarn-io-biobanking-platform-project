# Demo Flow Map — Sprint 25A

**Date:** 2026-07-02
**Purpose:** Govern all demonstrations, pilots, and sales conversations.

---

## Flow 1: Sponsor Discovers Institution (Anonymous)

```
1. Sponsor opens Kadarn
        ↓
2. Sponsor Search: "PBMC + Phase I + Texas"
        ↓
3. Capability Graph returns anonymous matches (identity hidden)
        ↓
4. Sponsor sees: "5 institutions match. 0 names. 0 contacts."
        ↓
5. Each card shows: matched capabilities, research assets,
   readiness label, strengths, evidence summary
        ↓
6. Sponsor clicks "Request Discovery Workspace"
```

**Actors:** Sponsor, CRO
**Visibility:** Anonymous — no institution identity
**Engines:** Visibility Policy, Capability Graph, Assessment

---

## Flow 2: Sponsor Creates Structured Opportunity

```
1. Sponsor opens Discovery Workspace
        ↓
2. Fills structured form: study title, phase, therapeutic area,
   sample needs, data needs, capabilities, geography, budget
        ↓
3. System runs compatibility analysis via Capability Graph
        ↓
4. Sponsor reviews candidate pool (anonymous)
        ↓
5. Sponsor clicks "Generate Opportunity Brief"
```

**Actors:** Sponsor
**Visibility:** Anonymous candidates
**Engines:** Discovery Workspace, Capability Graph, Visibility Policy

---

## Flow 3: Institution Reviews Opportunity

```
1. Site Director logs in
        ↓
2. Notification: "New Opportunity Brief received"
        ↓
3. Opens Opportunity Brief:
   - Study summary (sponsor hidden or partial)
   - Required capabilities
   - Required research assets
   - Workload estimate
   - Compensation range
   - "Why Kadarn matched you"
   - Known gaps
   - Requested visibility access
        ↓
4. Site Director reviews and decides
```

**Actors:** Site Director
**Visibility:** Sponsor identity hidden or partial
**Engines:** Opportunity Brief, Visibility Policy, Recommendation

---

## Flow 4: Institution Grants Consent

```
1. Site Director clicks "Review Access Request"
        ↓
2. Sees requested Claims, Research Assets, Private Evidence
        ↓
3. Options: Grant Full / Grant Partial / Decline / Request Clarification
        ↓
4. Selects scope, duration (default 90 days)
        ↓
5. Clicks "Grant Consent"
        ↓
6. Audit event recorded
```

**Actors:** Site Director
**Visibility:** Institution controls access
**Engines:** Institutional Consent, Visibility Policy, Private Evidence

---

## Flow 5: Mutual Reveal + Passport

```
1. Consent granted → Automatic Mutual Reveal initiation
        ↓
2. Both parties notified
        ↓
3. Identities revealed (sponsor sees institution name, site sees sponsor name)
        ↓
4. Living Feasibility Passport auto-created:
   - Capabilities
   - Research Assets
   - Supporting Claims
   - Readiness Summary
   - Recommendations
   - Known Gaps
   - Version 1
        ↓
5. Collaboration Workspace opens with 7 sections
```

**Actors:** Both
**Visibility:** Mutual — identities revealed
**Engines:** Feasibility Passport, Institutional Consent, Assessment, Recommendation

---

## Flow 6: Institution Generates Recognition Report

```
1. Site Director opens Executive Profile
        ↓
2. Clicks "Generate Institution Recognition Report"
        ↓
3. Report generated from all canonical engines
        ↓
4. Sections: Executive Summary, Institution Overview,
   Institutional Story, Capabilities, Research Assets,
   Evidence Highlights, Evidence Gaps, Sponsor Readiness,
   Recommendations, Appendix
        ↓
5. Export/save as needed
```

**Actors:** Site Director, Kadarn Internal
**Engines:** Recognition Report, all 6 canonical engines

---

## Flow 7: Public Visitor Views Institution

```
1. Public visitor navigates to kadarn.io/institutions/{slug}
        ↓
2. Public Profile renders:
   - Institution name and story
   - Stats (anonymous — no internal IDs)
   - Sponsor Readiness label
   - Capabilities (public view — no private evidence)
   - Research Assets
   - Evidence Highlights (public only)
   - Priority Improvements (public only)
        ↓
3. No identity exposure. No private evidence. No internal engine names.
```

**Actors:** Public
**Visibility:** Public only — no restricted data
**Engines:** Public Profile, Visibility Policy, Assessment

---

## Demo Institution Profiles

| Institution | Type | Story |
|---|---|---|
| Vilo Research Center | Academic Medical Center | 8 capabilities, 5 research assets, Presentation Ready |
| Coastal Clinical Research | Phase I Unit | 5 capabilities, 3 research assets, Presentation Ready |
| Midwest Biospecimen Bank | Biobank | 6 capabilities, 8 research assets, Presentation Ready |
| Community General Hospital | Community Hospital | 3 capabilities, 2 research assets, Needs Additional Evidence |
| Lone Star SMO Network | SMO | 10+ capabilities, 8+ assets, varies by site |

---

*This map governs all demonstrations. Update as new flows are added.*
