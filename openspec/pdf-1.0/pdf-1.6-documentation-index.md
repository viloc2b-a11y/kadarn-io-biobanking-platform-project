# PDF-1.6 — Kadarn 1.0 Documentation Index

**Sprint:** PDF-1.6  
**Gate:** Documentation Structure Approved  
**Status:** Draft for approval  
**Sign-off role:** Product

Official index for Kadarn 1.0 product, release, and operations documentation.

---

## Kadarn 1.0 — Master index

```
Kadarn 1.0
├── Product Definition (PDF-1.0)          ← openspec/pdf-1.0/
├── Architecture
├── Operations
├── Administration
├── API
├── Deployment
├── Evidence
├── Security
├── Disaster Recovery
├── Compliance
└── Validation
```

---

## 1. Product Definition

| Document | Path | Status |
|----------|------|--------|
| PDF-1.0 Program README | [openspec/pdf-1.0/README.md](README.md) | Draft |
| Product Scope (PDF-1.1) | [pdf-1.1-product-scope.md](pdf-1.1-product-scope.md) | Draft |
| Capability Matrix (PDF-1.2) | [pdf-1.2-capability-matrix.md](pdf-1.2-capability-matrix.md) | Draft |
| Stable API Catalog (PDF-1.3) | [pdf-1.3-stable-api-catalog.md](pdf-1.3-stable-api-catalog.md) | Draft |
| Supported Workflows (PDF-1.4) | [pdf-1.4-supported-workflows.md](pdf-1.4-supported-workflows.md) | Draft |
| Product Boundaries (PDF-1.5) | [pdf-1.5-product-boundaries.md](pdf-1.5-product-boundaries.md) | Draft |
| GA Definition (PDF-1.7) | [pdf-1.7-ga-definition.md](pdf-1.7-ga-definition.md) | Draft |
| **Product Definition Freeze (PDF-1.8)** | [pdf-1.8-product-definition-freeze.md](pdf-1.8-product-definition-freeze.md) | Draft |

---

## 2. Architecture

| Document | Path |
|----------|------|
| Phase 8 Evidence Evolution | [openspec/phase-8-evidence-evolution-architecture.md](../phase-8-evidence-evolution-architecture.md) |
| Phase 9 Delivery Architecture | [openspec/phase-9-evidence-delivery-architecture.md](../phase-9-evidence-delivery-architecture.md) |
| AF-3.0 Architecture Freeze | [openspec/architecture-freeze-af-3.0-checklist.md](../architecture-freeze-af-3.0-checklist.md) |
| AF-4.0 Enterprise Readiness | [openspec/af-4.0-enterprise-readiness-program.md](../af-4.0-enterprise-readiness-program.md) |
| Lexicon | [docs/architecture/lexicon.md](../../docs/architecture/lexicon.md) |
| KRM / RAO | [docs/architecture/krm-rao.md](../../docs/architecture/krm-rao.md) |
| ADRs | [docs/adr/](../../docs/adr/) |
| KEMS (canonical) | [docs/kems/](../../docs/kems/) |

**Key ADRs for 1.0:** ADR-030 (Published View), ADR-029 (Confidence derived), ADR-010 (Trust retired), ADR-011 (Evidence Core boundary)

---

## 3. Operations

| Document | Path |
|----------|------|
| AF-4.0 Production Operations | [openspec/af-4.0-production-operations.md](../af-4.0-production-operations.md) |
| AF-4.0 Reliability Runbook | [openspec/af-4.0-reliability-runbook.md](../af-4.0-reliability-runbook.md) |
| Phase 8 Cutover Runbook | [openspec/phase-8-cutover-runbook.md](../phase-8-cutover-runbook.md) |
| Phase 8 Staging Report | [openspec/phase-8-staging-cutover-report.md](../phase-8-staging-cutover-report.md) |
| AF-4.0 Observability | [openspec/af-4.0-sprint-2-observability.md](../af-4.0-sprint-2-observability.md) |
| Metric naming | [openspec/af-4.0-metric-naming.md](../af-4.0-metric-naming.md) |

---

## 4. Administration

| Document | Path |
|----------|------|
| KOC experience (code) | `apps/web/src/app/(koc)/koc/` |
| Phase 8 cutover ops API | `GET /api/v1/operations/phase8-cutover` |
| Org / invite APIs | `/api/organizations/*` |
| Workspace consent | `/api/v1/workspace/consent` |

*RC-1 will add: Installation Guide, Admin Runbook, Role Matrix.*

---

## 5. API

| Document | Path |
|----------|------|
| Stable API Catalog (PDF-1.3) | [pdf-1.3-stable-api-catalog.md](pdf-1.3-stable-api-catalog.md) |
| OpenAPI v1 | [apps/api/openapi-v1.yaml](../../apps/api/openapi-v1.yaml) |
| API Governance (AF-4.0 S6) | [openspec/af-4.0-api-governance.md](../af-4.0-api-governance.md) |
| SDK | [packages/sdk/](../../packages/sdk/) |
| Swagger UI | `GET /api/docs` |
| Error catalog | [packages/types/src/errors.ts](../../packages/types/src/errors.ts) |

---

## 6. Deployment

| Document | Path |
|----------|------|
| Dev platform (AF-4.0 S7) | [openspec/af-4.0-dev-platform.md](../af-4.0-dev-platform.md) |
| CLI | [packages/cli/](../../packages/cli/) |
| Environment templates | `apps/api/.env.example`, Supabase migrations |

*RC-1 will add: Deployment Guide, Environment Matrix, Upgrade Path.*

---

## 7. Evidence

| Document | Path |
|----------|------|
| KEMS-001 Confidence Graph | [docs/kems/KEMS-001_Confidence_Graph_Model_v1.0.md](../../docs/kems/KEMS-001_Confidence_Graph_Model_v1.0.md) |
| KEMS-002 Trustworthy Evidence | [docs/kems/KEMS-002_Trustworthy_Evidence_Architecture_v1.0.md](../../docs/kems/KEMS-002_Trustworthy_Evidence_Architecture_v1.0.md) |
| KEMS-004 Claim Provenance | [docs/kems/KEMS-004_Claim_Provenance_Architecture_v1.0.md](../../docs/kems/KEMS-004_Claim_Provenance_Architecture_v1.0.md) |
| KEMS-007 Delivery (RC) | [docs/kems/KEMS-007_Evidence_Delivery_Architecture_v0.1.md](../../docs/kems/KEMS-007_Evidence_Delivery_Architecture_v0.1.md) |
| Published View package | [packages/published-view/](../../packages/published-view/) |
| Evidence lineage | [packages/evidence-lineage/](../../packages/evidence-lineage/) |
| Phase 8 legacy equivalence | [openspec/phase-8-legacy-equivalence-gate.md](../phase-8-legacy-equivalence-gate.md) |

---

## 8. Security

| Document | Path |
|----------|------|
| AF-4.0 Security (S3) | [openspec/af-4.0-sprint-3-security.md](../af-4.0-sprint-3-security.md) |
| Architecture compliance CI | [openspec/af-4.0-architecture-compliance.md](../af-4.0-architecture-compliance.md) |
| CI security workflow | [.github/workflows/security.yml](../../.github/workflows/security.yml) |

---

## 9. Disaster Recovery

| Document | Path |
|----------|------|
| AF-4.0 Reliability Runbook | [openspec/af-4.0-reliability-runbook.md](../af-4.0-reliability-runbook.md) |
| Backup/restore procedures | Same runbook — Sprint 5 evidence |

*RC-1 will add: DR test results, RTO/RPO targets.*

---

## 10. Compliance

| Document | Path |
|----------|------|
| AF-4.0 Architecture Compliance | [openspec/af-4.0-architecture-compliance.md](../af-4.0-architecture-compliance.md) |
| Canonical doc registry | [openspec/canonical-documents-registry-af-2.1.md](../canonical-documents-registry-af-2.1.md) |
| GDPR / data erasure API | `/api/v1/account/erasure` |

---

## 11. Validation

| Document | Path |
|----------|------|
| Phase 8 staging smoke | [openspec/phase-8-staging-cutover-report.md](../phase-8-staging-cutover-report.md) |
| Gate 28JK report | [openspec/phase-8-gate-28JK-report.md](../phase-8-gate-28JK-report.md) |
| AF-4.0 Certification | [openspec/af-4.0-certification-report.md](../af-4.0-certification-report.md) |
| Performance report | [openspec/af-4.0-performance-report.md](../af-4.0-performance-report.md) |
| GA Definition (PDF-1.7) | [pdf-1.7-ga-definition.md](pdf-1.7-ga-definition.md) |

*RC-1 / RC-2 will add: Installation validation checklist, operational validation evidence.*

---

## Documentation gaps (to close in RC-1)

| Gap | Owner | Target |
|-----|-------|--------|
| Release Notes 1.0 | Release Eng | RC-1 |
| Installation Guide | Release Eng | RC-1 |
| Upgrade / migration guide | Release Eng | RC-1 |
| Operator blind-test protocol | Release Eng | RC-2 |
| KEMS-003 on-disk canonical copy | Architecture | **GA blocker** (not RC-1) |

---

## Gate: Documentation Structure Approved

- [x] Ten-section index defined
- [x] Existing docs mapped to sections
- [x] Gaps identified for RC-1/RC-2
- [ ] **Product sign-off**
