# AF-4.0 — Enterprise Readiness Program

**Status:** In progress — Sprint 1 active  
**Baseline:** AF-3.0 (Phase 8 remediation complete, staging PASS)  
**Parallel track:** KEMS-007 / Phase 9 (Gentle AI — Delivery Layer)

---

## Objective

Convert Kadarn into an enterprise-ready platform while Gentle AI completes Phase 9. When both tracks finish, Kadarn has stabilized Phase 8, incorporated the Delivery Layer, and passed AF-4.0 certification.

## Architectural freeze (during AF-4.0)

| Congelado | Owner |
|-----------|-------|
| Evidence Core claim/evidence model | Architecture |
| KEMS-007 delivery implementation | Gentle AI |
| Phase 8 Compatibility Layer | Until post-prod sign-off |

## Sprint roadmap

| Sprint | Name | Gate | Status |
|--------|------|------|--------|
| 1 | Platform Instrumentation Foundation | Correlation ID + error codes + metrics | **PASS** |
| 2 | Observability Platform | Degradation detected before user | **PASS** |
| 3 | Security Hardening | Security scan PASS, zero high vulns | **PASS** |
| 4 | Performance Engineering | Performance report + capacity baseline | **PASS** |
| 5 | Reliability Engineering | Restore + rollback proven | **PASS** |
| 6 | API Excellence | OpenAPI complete + SDK generated | **PASS** |
| 7 | Developer Platform | New dev ready in <15 min | **PASS** |
| 8 | Architecture Compliance | CI architecture gates PASS | **PASS** |
| 9 | Production Operations | Runbooks + SLO/SLA complete | **PASS** |
| 10 | Enterprise Certification | **AF-4.0 Approved / Enterprise Ready** | **CONDITIONAL** |

## Dependencies

```
S1 Instrumentation → S2 Observability, S3 Security, S4 Performance
S2 → S9 Prod Ops → S10 Certification
S3, S4, S5, S6, S7, S8 → S10 Certification
```

## Related documents

| Document | Purpose |
|----------|---------|
| [af-4.0-metric-naming.md](af-4.0-metric-naming.md) | Metric naming conventions |
| [af-4.0-sprint-1-report.md](af-4.0-sprint-1-report.md) | Sprint 1 gate evidence |
| [af-4.0-sprint-2-observability.md](af-4.0-sprint-2-observability.md) | Dashboards + alerts |
| [af-4.0-sprint-3-security.md](af-4.0-sprint-3-security.md) | Security hardening checklist |
| [af-4.0-performance-report.md](af-4.0-performance-report.md) | Sprint 4 baseline |
| [af-4.0-reliability-runbook.md](af-4.0-reliability-runbook.md) | Sprint 5 backup/restore |
| [af-4.0-api-governance.md](af-4.0-api-governance.md) | Sprint 6 API policy |
| [af-4.0-dev-platform.md](af-4.0-dev-platform.md) | Sprint 7 onboarding |
| [af-4.0-architecture-compliance.md](af-4.0-architecture-compliance.md) | Sprint 8 CI gates |
| [af-4.0-production-operations.md](af-4.0-production-operations.md) | Sprint 9 runbooks |
| [af-4.0-certification-report.md](af-4.0-certification-report.md) | Sprint 10 final audit |

---

*AF-4.0 charter — does not replace ADRs or KEMS documents.*
