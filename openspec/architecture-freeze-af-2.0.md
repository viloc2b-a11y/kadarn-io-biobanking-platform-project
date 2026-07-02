# Architecture Freeze Record — Baseline AF-2.0

**Date:** 2026-07-02
**Baseline:** AF-2.0 (Architecture Freeze 2.0)
**Status:** RATIFIED
**Supersedes:** AF-1.0 (2026-07-01)

---

## Declaration

Phases 1 through 5 of Kadarn are hereby frozen.

No structural changes, new intelligence engines, new architectural components, or contract modifications may be introduced to Phases 1–5 without a formal Architecture Decision Record (ADR).

Bug fixes and performance improvements that do not alter contracts or introduce new capabilities are permitted without an ADR.

---

## Frozen Baseline

### Phase 1 — Evidence Infrastructure
- Discovery Pipeline
- Institution Reconstruction
- Public Discovery Dashboard
- Layer 0/1 extraction pipeline
- MarkItDown integration
- State machine (KEMS-002A)

### Phase 2 — Institutional Intelligence (6 engines)
- Sprint 21A: Research Assets Enabled (dashboard panel)
- Sprint 21B: Capability Intelligence Engine
- Sprint 21C: Evidence Gap Intelligence Engine
- Sprint 21D: Institutional Capability Assessment Engine
- Sprint 21E: Sponsor Readiness Engine
- Sprint 21F: Recommendation Engine

### Phase 3 — Knowledge Consumption (6 products)
- Sprint 22A: Institution Recognition Report
- Sprint 22B: Executive Institution Profile
- Sprint 22C: Sponsor Capability Search
- Sprint 22D: Continuous Monitoring
- Sprint 22E: Notification Center
- Sprint 22F: Public Institution Profile

### Phase 4 — Trustworthy Evidence Infrastructure (5 layers)
- Sprint 23A: Connector Layer (7 provider adapters)
- Sprint 23B: Identity Resolution Engine
- Sprint 23C: Evidence Firewall
- Sprint 23D: Governance & Explainability
- Sprint 23E: Private Evidence Layer

### Phase 5 — Sponsor Interaction Layer (6 components)
- Sprint 24A: Visibility Policy Engine
- Sprint 24B: Capability Graph
- Sprint 24C: Discovery Workspace
- Sprint 24D: Opportunity Brief Engine
- Sprint 24E: Institutional Consent Engine
- Sprint 24F: Mutual Reveal + Feasibility Passport

---

## Contract Stability

| Contract | Status | Breaking Changes Allowed? |
|---|---|---|
| DiscoveryResult | Frozen | No |
| CapabilityIntelligence | Frozen | No |
| EvidenceGapIntelligence | Frozen | No |
| InstitutionCapabilityAssessment | Frozen | No |
| SponsorReadiness | Frozen | No |
| RecommendationEngineOutput | Frozen | No |
| InstitutionRecognitionReport | Frozen | No |
| ConnectorResponse | Frozen | No |
| CanonicalIdentity | Frozen | No |
| FirewallDecisionOutput | Frozen | No |
| VisibilityPolicy | Frozen | No |
| InstitutionalConsent | Frozen | No |
| FeasibilityPassport | Frozen | No |

---

## Governance

- Any change to a frozen artifact requires an ADR
- No code change may introduce terminology incompatible with KEMS-001 or KEMS-002
- No engine may be added to the Core list without amending this freeze record
- The Evidence Core boundary (ADR-011) remains immutable

---

## Authorization

| Role | Status |
|---|---|
| Architecture Lead | ✅ Ratified |
| Phase 1-5 Artifacts | ✅ All 24 sprints committed |
| Test Suite | ✅ 971 tests, 0 failures |

---

*This document is the final gate before Phase 6 — Commercial Readiness. No pilot deployments may begin before this freeze is ratified.*
