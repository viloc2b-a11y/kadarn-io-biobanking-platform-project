# KUX — Kadarn User Experience Specification Series

The KUX series is the canonical documentation of Kadarn's product experience. It is documentation-first: these documents govern design decisions before any implementation exists.

## Authority chain

KUX documents are subordinate to the Architecture Freeze artifacts. In case of conflict: **Lexicon v1.2 > KEMS-001 > ADRs > KUX**. Within the series, KUX-001 is constitutional — every other document must demonstrate compliance with it.

## Structure

```
docs/kux/
  README.md            — this index
  principles/          — constitutional documents (KUX-001, KUX-002)
  architecture/        — structural documents (KUX-003 Information Architecture & Mental Models, KUX-004 Workspace Shell, KUX-005 Navigation Framework)
  workspaces/
    sponsor/           — sponsor workspace specifications
    institution/       — institution workspace specifications
    public/            — public-facing surface specifications
  components/          — reusable experience component specifications
  patterns/            — cross-workspace interaction pattern specifications
  governance/          — review gates, ratification records, change process
```

## Documents

| Document | Location | Status |
|---|---|---|
| KUX-001 — Product Experience Principles | [principles/kux-001-product-experience-principles.md](principles/kux-001-product-experience-principles.md) | Ratified |
| KUX-002 — Product Design Language | [principles/kux-002-product-design-language.md](principles/kux-002-product-design-language.md) | Ratified |
| KUX-003 — Information Architecture & Mental Models | [architecture/kux-003-information-architecture-mental-models.md](architecture/kux-003-information-architecture-mental-models.md) | Ratified — gate passed |
| KUX-004 — Workspace Shell: The Kadarn Operating Environment | [architecture/kux-004-workspace-shell.md](architecture/kux-004-workspace-shell.md) | Ratified — gate passed |
| KUX-005 — Navigation Framework: Movement | [architecture/kux-005-navigation-framework.md](architecture/kux-005-navigation-framework.md) | Ratified — gate passed |
| KUX-006 — Sponsor Workspace | [workspaces/sponsor/kux-006-sponsor-workspace.md](workspaces/sponsor/kux-006-sponsor-workspace.md) | Ratified — gate passed |
| KUX-007 — Portfolio Intelligence Workspace | [workspaces/sponsor/kux-007-portfolio-intelligence.md](workspaces/sponsor/kux-007-portfolio-intelligence.md) | Ratified — gate passed |
| KUX-008 — Institutional Passport Workspace | [workspaces/sponsor/kux-008-institutional-passport.md](workspaces/sponsor/kux-008-institutional-passport.md) | Ratified — gate passed |
| KUX-009 — Feasibility Workspace | [workspaces/sponsor/kux-009-feasibility-workspace.md](workspaces/sponsor/kux-009-feasibility-workspace.md) | Gate pending: Feasibility Approved |
| KUX-010 — Opportunity Discovery Workspace | [workspaces/sponsor/kux-010-opportunity-discovery.md](workspaces/sponsor/kux-010-opportunity-discovery.md) | Ratified (v1.0) — gate passed |
| KUX-011 — Risk Monitoring Workspace | [workspaces/sponsor/kux-011-risk-monitoring.md](workspaces/sponsor/kux-011-risk-monitoring.md) | Ratified — gate passed |
| KUX-012 — Notification & Attention Workspace | [workspaces/sponsor/kux-012-notification-attention.md](workspaces/sponsor/kux-012-notification-attention.md) | Ratified — gate passed |
| KUX-1.0 — Sponsor Product Specification Freeze | [governance/kux-1.0-sponsor-product-specification-freeze.md](governance/kux-1.0-sponsor-product-specification-freeze.md) | **Frozen · Ratified · Ready for Engineering** |

## Design review gates

Every user-facing design is reviewed against, in order:

1. The North Star Test (KUX-001 §11)
2. The Experience Pillars (KUX-001 §4): Confidence, Clarity, Continuity, Explainability, Agency
3. The Decision Framework (KUX-001 §8)
4. The Cognitive Invariants (KUX-003 §12) and the Workspace Integrity Rule (KUX-004 §14)

For workspace documents (KUX-006 onward), the gate adds four executable-spec questions:

1. Does it help the sponsor make a real decision?
2. Does it reduce the time to that decision?
3. Does it make evidence visible without overloading the interface?
4. Could an engineering team implement this workspace without inventing behavior?
