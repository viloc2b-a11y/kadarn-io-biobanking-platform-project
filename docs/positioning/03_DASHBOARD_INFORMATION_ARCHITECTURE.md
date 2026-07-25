# Homepage / Dashboard Information Architecture

**Goal:** The first screen answers "What does a sponsor see if they evaluate us today?"

## Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Institution Profile — [Institution Name]          [Edit] [View] │
│  as a Sponsor                                                  │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌────────────────────────────────────┐ │
│ │  OVERALL TRUST SCORE │ │  DISCOVERY READINESS               │ │
│ │                      │ │  Score: 72/100  ▲ +5 this month    │ │
│ │        ████████      │ │  Profile: 85%   Evidence: 68%      │ │
│ │       88/100         │ │  Currency: 92%  Credentials: 55%   │ │
│ │                      │ │  ┌──────────────────────────────┐  │ │
│ └──────────────────────┘ │  │ Improve: Evidence gaps in    │  │ │
│ ┌──────────────────────┐ │  │ PBMC processing, IATA cert   │  │ │
│ │  CREDENTIALS STATUS  │ │  └──────────────────────────────┘  │ │
│ │  ✅ 8 of 12 active   │ └────────────────────────────────────┘ │
│ │  ⚠️ 2 expiring soon  │                                        │
│ │  ❌ 2 missing        │                                        │
│ └──────────────────────┘                                        │
├──────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ Institution │ │ Capability  │ │ Operational │ │ Recruitment ││
│ │ Passport    │ │ Profile     │ │ Readiness   │ │ Strength    ││
│ │ Published   │ │ 12 verified │ │ 4 active    │ │ 340 pts     ││
│ │ Last: 2d ago│ │ Last review │ │ studies     │ │ Diversity   ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  EVIDENCE GAPS                                     [View All]│ │
│ │                                                              │ │
│ │  🔴 Hybrid Trial Readiness — Remote Monitoring     No ev.   │ │
│ │  🟡 PBMC Processing — IATA Certification           Expiring  │ │
│ │  🟡 Biospecimen Storage — Temperature Logs         Gap       │ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  UPCOMING EXPIRATIONS                              [View All]│ │
│ │  IATA Cert — Sep 2026     GCP Training — Nov 2026           │ │
│ │  Medical License — Dec 2026                                  │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Design Principles

1. **Sponsor-first** — Every section answers "what would a sponsor see"
2. **Evidence-backed** — Every number links to its supporting evidence
3. **Action-oriented** — Gaps and expirations include "Fix" or "Add evidence" CTAs
4. **Live** — All metrics reflect current state, not a point-in-time snapshot
5. **Progressive disclosure** — Overview first, drill-down on interaction

## Navigation Structure (Updated)

```
Dashboard (NEW — Institution Profile focus)
├── Institution Profile
│   ├── Overview (the dashboard above)
│   ├── People
│   ├── Locations
│   ├── Credentials
│   └── Operational Metrics
├── Capabilities (was Claims)
│   ├── All Capabilities
│   ├── Evidence
│   └── Review
├── Passport
│   ├── Published Passport
│   └── Share Grants
├── Discovery Readiness (NEW)
│   ├── Score Breakdown
│   ├── Evidence Coverage
│   └── Improvement Plan
└── Settings
    ├── Organization
    ├── Members
    └── Integrations
```

## Key Changes from Current Navigation

| Current | New | Rationale |
|---------|-----|-----------|
| Dashboard (operational) | Dashboard (Institution Profile) | Sponsor-first view |
| Claims | Capabilities | Product language — sponsors care about capabilities |
| Discovery (old) | Discovery Readiness | Reframed as readiness, not raw discovery |
| Workspace tabs | Profile-driven navigation | Profile is the canonical entity |
