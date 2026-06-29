# Sprint 14 — Production Readiness Audit

**Document:** S14-PRA-01  
**Status:** Final  
**Version audited:** `1.0.0-hardening.11`  
**Date:** 2026-06-28  
**Method:** Multi-perspective audit (architecture, implementation, production, observability, security)  
**Evidence baseline:** `npm test` → **576 passed**, 38 skipped (614 total) · 41 test files · typecheck + build in CI gate

---

## 1. Executive Summary

Kadarn ha completado **11 sprints de hardening** (S1–S11) sobre una base KPV con **23 ADRs**, **34 migraciones** (008–041), **76 rutas API v1**, orquestador de **12 pipelines × 11 stages**, y runtimes reales para trust, financial, knowledge, workflow y eventos.

La auditoría Sprint 14 concluye:

| Dimensión | Puntuación | Veredicto |
|---|---:|---|
| **Architecture** | **9.2 / 10** | Coherente, documentada, engine-boundaries claros |
| **Implementation** | **8.9 / 10** | Runtimes reales, gate sólido; gaps en CI profundo y auth API |
| **Production** | **7.6 / 10** | Bootstrap y migraciones maduros; sin artefactos de deploy ni validación operacional cerrada |
| **Observability** | **8.7 / 10** | Health / ready / metrics + paquete telemetry; OTEL y stack central opcionales |
| **Security** | **8.5 / 10** | RLS extensivo + suites de seguridad; enforcement parcial en CI y GRANTs |
| **Overall** | **8.6 / 10** | **Ready with constraints** — apto para beta controlada, no para GA desatendida |

**Distancia al objetivo 9.5+:** ~0.9 puntos. El techo actual lo limitan producción operacional (Sprint 13 incompleto), CI sin security/integration, y auth API vs. pilotos — no la calidad del diseño arquitectónico.

---

## 2. Metodología — Tres perspectivas de auditoría

Se sintetizaron tres lentes (equivalente a invitar Claude, Cursor y GPT) sobre el mismo corpus de evidencia:

| Perspectiva | Enfoque | Peso en veredicto |
|---|---|---|
| **Arquitectura (Claude)** | ADRs, boundaries, event-first, multi-tenant, orquestación | 25% |
| **Implementación (Cursor)** | Código, tests, runtimes, API, migraciones, drift docs/scripts | 30% |
| **Producción & seguridad (GPT)** | CI/CD, deploy, ops, RLS, auth, observabilidad, pilotos | 45% |

Consenso unánime en tres hallazgos:

1. La **deuda de hardening S1–S11 está resuelta en código** para trust, financial, knowledge y workflow — no son stubs.
2. La **brecha producción** está en operación (deploy, pilotos JWT, CI profundo), no en diseño.
3. El documento **KPV-10** (`docs/architecture/KPV-10-PLATFORM-READINESS-REVIEW.md`) está **obsoleto** respecto a S9–S11 (363 tests → 576; financial/trust ya no son stubs).

---

## 3. Architecture — 9.2 / 10

### Fortalezas

| Evidencia | Ubicación |
|---|---|
| 23 ADRs aceptados (multi-tenant → integraciones externas) | `docs/adr/adr-002` … `adr-023` |
| Blueprint program-centric, RLS-by-default, audit desde Sprint 0 | `docs/architecture/kadarn-platform-blueprint.md` |
| Event-first: envelope canónico, idempotency, correlation | `docs/adr/adr-013-event-first-platform.md`, `packages/domain-events/` |
| 21 paquetes de dominio desacoplados | `packages/*-engine/`, `packages/telemetry/` |
| Orquestador: 12 pipelines, 11 stages (discovery → telemetry) | `apps/api/src/lib/engine-orchestrator.ts`, `orchestration/pipelines.ts` |
| Event runtime con persistencia Postgres + fallback memoria | `apps/api/src/lib/event-runtime.ts`, `036_domain_events_runtime.sql` |
| Decisiones explícitas: Temporal/Stripe/FHIR deferidos con ADR | `adr-022`, `adr-023` |

### Deducciones (−0.8)

| Gap | Impacto |
|---|---|
| KPV-10 y README aún reflejan estado pre-S9 | Confusión en readiness reviews |
| OPA shadow en **una** ruta (`organizations`) | Policy engine no homogéneo en API |
| Realtime Supabase acotado a notificaciones KOC | Integración narrow, no plataforma-wide |

**Nota:** Un 9.8 requeriría OPA shadow en rutas críticas de exchange/program, documentación de readiness al día, y federación BBMRI evaluada con ADR de cierre.

---

## 4. Implementation — 8.9 / 10

### Fortalezas

| Evidencia | Resultado |
|---|---|
| Gate offline | **576 tests passed**, 38 skipped |
| Verify pipeline | `typecheck && build && test && check:secrets` |
| Sprint gate tests S2–S11 | `tests/hardening/sprint*.test.ts` |
| Trust runtime Supabase + decay + settlement evidence | `apps/api/src/lib/trust-runtime.ts`, S9 report |
| Financial runtime invoices/payments/reconciliation | `packages/financial-engine/src/runtime/`, `039_*.sql` |
| Knowledge fabric + semantic discovery + graph | `knowledge-runtime.ts`, `040_*.sql`, S10 report |
| Workflow dispatcher + exchange-request definition | `038_workflow_runtime.sql`, S8 report |
| API v1 | **76** route handlers bajo `/api/v1/` |
| Legacy 308 redirect | `apps/api/src/lib/legacy-redirect.ts` |

### Deducciones (−1.1)

| Gap | Severidad |
|---|---|
| `tests/api/` (12) y `tests/security/` (7, ~95 casos) **fuera del CI gate** | Alta |
| Auth API **cookie-only**; pilotos y `access-context.test.ts` usan Bearer sin handler | Alta |
| `tests/api/*` mayormente contra Supabase REST, no rutas Next.js Kadarn | Media |
| Intelligence engine adapter fino (1 test significativo) | Media |
| Migraciones 039–040: RLS sí, **GRANT authenticated** inconsistente vs 016 | Alta |

**Nota:** Un 9.6 requeriría Bearer o cookie documentado y unificado, security+integration en CI, y GRANT audit automatizado en migraciones nuevas.

---

## 5. Production — 7.6 / 10

### Fortalezas

| Evidencia | Ubicación |
|---|---|
| 34 migraciones versionadas (008–041) | `supabase/migrations/`, `database/migrations/` |
| Seeds: demo (011), auth users (030), operational (031), alpha pilot | `scripts/seed-pilot.sql`, `seed-pilot-users.ts` |
| Runbook operacional biobank | `docs/pilots/FIRST-BIOBANK-PILOT-RUNBOOK.md` |
| APF-04 validación post-fix | `docs/pilots/ALPHA-PILOT-FIX-VALIDATION.md` — **9/10** (con service role) |
| 5 scripts de piloto + README | `scripts/run-pilot-{1..5}.sh` |
| Secret scanner en verify | `scripts/check-secrets.mjs` |
| Env templates | `apps/api/.env.example`, `docs/ops/SUPABASE-SECRETS-SETUP.md` |

### Deducciones (−2.4)

| Gap | Severidad |
|---|---|
| **Sprint 13 no cerrado** — pilotos execution gate con drift (usuarios, org IDs, Bearer vs cookie) | Blocker operacional |
| Sin Dockerfile / IaC / manifest de deploy en repo | Blocker GA |
| CI sin Supabase service container | Blocker gate profundo |
| Stripe/real payments deferidos (ADR-023) | Esperado para beta |
| `[db.seed] enabled = false` en `supabase/config.toml` | Fricción bootstrap local |
| Trust/financial persistencia requiere `SUPABASE_SERVICE_ROLE_KEY`; fallback in-memory si falta | Major |

**Nota:** Un 9.4 requeriría Sprint 13 PASS 5/5 con JWT-only, artefactos de deploy (container + env prod), y CI con migraciones + SIT-01.

---

## 6. Observability — 8.7 / 10

### Fortalezas

| Componente | Evidencia |
|---|---|
| Liveness | `GET /api/health` — version, uptime, observability flags |
| Readiness | `GET /api/health/ready` — DB + event runtime + observability |
| Prometheus metrics | `GET /api/metrics` |
| Paquete `@kadarn/telemetry` | counters, histograms, structured logs, tracing hooks |
| Bootstrap | `apps/api/src/instrumentation.ts` |
| Métricas por pipeline/stage | `engine-orchestrator.ts`, `stage-handlers.ts` |
| Stack local opcional | `observability/docker-compose.yml` (Prometheus + Grafana) |
| Gate tests S7 | `tests/hardening/sprint7-observability.test.ts` |

### Deducciones (−1.3)

| Gap | Impacto |
|---|---|
| OTEL export opt-in; noop por defecto | Sin trazas centralizadas en prod |
| Loki/Tempo deferidos (S7) | Log aggregation manual |
| `KADARN_METRICS_TOKEN` opcional → metrics abiertos si unset | Riesgo en prod |
| `checkEventRuntime()` stub en readiness | Señal limitada |

**Nota:** Un 9.5 requeriría OTEL obligatorio en prod, metrics auth required, y dashboards Grafana versionados.

---

## 7. Security — 8.5 / 10

### Fortalezas

| Control | Evidencia |
|---|---|
| RLS deny-by-default + helpers | `009_rls_foundation.sql` (~40 policies en archivo base) |
| ~193 políticas RLS (validación ops) | `docs/ops/SUPABASE-INFRASTRUCTURE-VALIDATION.md` |
| Append-only compliance/provenance | `035_compliance_append_only.sql`, `032_provenance_append_only.sql` |
| Auth Supabase + JWT claims + experience routing | `packages/auth/src/index.ts` |
| API: anon key + session cookie → RLS enforced | `apps/api/src/lib/supabase-server.ts` |
| 7 suites security (~95 casos) | `tests/security/*.test.ts` |
| Threat model tests activos | `tests/security/threat.test.ts` |
| OPA shadow non-blocking + HttpOpaClient | `packages/policy-engine/src/opa/` |
| Secret scan bloquea keys en repo | `check-secrets.mjs` |
| ADR-023: BBMRI reject, OPA integrate shadow, enforce off | `adr-023-external-integrations-decision.md` |

### Deducciones (−1.5)

| Gap | Severidad |
|---|---|
| Security tests **no en CI** | Blocker |
| `organizations_select`: `is_org_admin()` sin scope de org | Major (TODO en 009) |
| `GRANT ALL TO anon, authenticated` en tablas engine (AI, logistics, etc.) | Major — least privilege |
| GRANTs faltantes en tablas 039–040 para rol `authenticated` | Major — API falla antes de RLS |
| Rate limit in-memory (120/min) — no Redis | Major multi-réplica |
| Pilotos validados con service role (APF-04), no JWT end-user puro | Major |

**Nota:** Un 9.6 requeriría security suite en CI, RLS scope fix, GRANT hardening migration, pen test Sprint 12, y métricas auth required.

---

## 8. Scorecard comparativo

### vs. objetivo aspiracional (usuario)

| Dimensión | Objetivo | Auditado | Δ |
|---:|---:|---:|---:|
| Architecture | 9.8 | 9.2 | −0.6 |
| Implementation | 9.6 | 8.9 | −0.7 |
| Production | 9.4 | 7.6 | −1.8 |
| Observability | 9.5 | 8.7 | −0.8 |
| Security | 9.6 | 8.5 | −1.1 |
| **Overall** | **9.5+** | **8.6** | **−0.9** |

### vs. KPV-10 (2026-06-27, pre-hardening)

| Métrica | KPV-10 | Sprint 14 |
|---|---|---|
| Tests automatizados | 363 | **576** (+58%) |
| Trust engine | Stub | **Runtime Supabase** |
| Financial engine | Stub | **Invoices/payments/reconciliation** |
| Knowledge fabric | Parcial | **Auto-feed + semantic search** |
| Integraciones | N/A | **OPA shadow, Realtime narrow** |
| Supabase integration tests | ⛔ Ninguno | SIT-01 + security (existen, no CI) |
| Decisión | Ready with constraints | **Ready with constraints (refinado)** |

---

## 9. Top 10 hallazgos (priorizados)

| # | Hallazgo | Dimensión | Severidad |
|---|---|---|---|
| 1 | CI gate offline-only; security/integration excluidos | Production / Security | Blocker |
| 2 | Sprint 13 operacional no cerrado (5 pilotos JWT) | Production | Blocker |
| 3 | Sin artefactos de deploy (container/IaC) | Production | Blocker |
| 4 | Auth API cookie-only vs Bearer en pilotos/tests | Implementation | Major |
| 5 | GRANT `authenticated` inconsistente en migraciones 039–040 | Security | Major |
| 6 | Trust/financial silent degrade sin service role key | Production | Major |
| 7 | KPV-10, TEST-MATRIX, README desactualizados | Architecture | Minor |
| 8 | OPA shadow solo en `organizations` | Architecture | Minor |
| 9 | Metrics endpoint sin token por defecto | Observability | Minor |
| 10 | Compliance tests parcialmente stubbed | Security | Minor |

---

## 10. Camino a 9.5+ (exit criteria propuestos)

| # | Acción | Sprint sugerido | Impacto en overall |
|---|---|---|---|
| 1 | Cerrar Sprint 13: 5/5 pilotos con sesión cookie/JWT, reporte scorecard | S13 | +0.4 Production |
| 2 | CI job: Supabase + `test:security` + `test:integration` | S14b | +0.3 Security, +0.2 Production |
| 3 | Migración GRANT audit (039–041 + revoke anon over-grants) | S12 | +0.2 Security, +0.1 Implementation |
| 4 | Unificar auth API: Bearer header **o** documentar cookie flow en pilotos | S14b | +0.2 Implementation |
| 5 | Dockerfile + env prod template + health probes K8s | S15 | +0.5 Production |
| 6 | OTEL required + metrics token required en prod | S12 | +0.2 Observability |
| 7 | Actualizar KPV-10 / TEST-MATRIX post-S11 | S14 | +0.1 Architecture |

**Proyección:** completar 1–4 eleva overall a **~9.2**; añadir 5–7 alcanza **9.5+**.

---

## 11. Veredicto final

```
╔══════════════════════════════════════════════════════════════╗
║  KADARN PRODUCTION READINESS — SPRINT 14                     ║
║                                                              ║
║  Architecture      ████████████████████░  9.2 / 10           ║
║  Implementation    ███████████████████░░  8.9 / 10           ║
║  Production        ███████████████░░░░░  7.6 / 10           ║
║  Observability     █████████████████░░░░  8.7 / 10           ║
║  Security          █████████████████░░░░  8.5 / 10           ║
║  ─────────────────────────────────────────────────────────   ║
║  OVERALL           █████████████████░░░░  8.6 / 10           ║
║                                                              ║
║  DECISION:  READY WITH CONSTRAINTS                           ║
║  TAG:       v1.0.0-beta candidate (post S13 + CI security)   ║
╚══════════════════════════════════════════════════════════════╝
```

**Kadarn es arquitectónicamente de clase producción (9+) y de implementación madura (high-8).**  
**No alcanza aún 9.5 global** porque producción operacional y enforcement de seguridad en CI/deploy no están al nivel del diseño.

Recomendación: **no taggear `v1.0.0-beta` hasta Sprint 13 PASS + CI security job**. El hardening S1–S11 **sí** justifica congelar features y centrarse en operación.

---

## 12. Referencias

| Documento | Relevancia |
|---|---|
| `docs/engineering/SPRINT-9-ENGINEERING-REPORT.md` | Trust & financial runtime |
| `docs/engineering/SPRINT-10-ENGINEERING-REPORT.md` | Knowledge fabric |
| `docs/engineering/SPRINT-11-EXTERNAL-INTEGRATIONS-EVALUATION.md` | OPA, Realtime, deferrals |
| `docs/adr/adr-023-external-integrations-decision.md` | Decisiones integración |
| `docs/engineering/TEST-MATRIX.md` | Matriz de tests (actualizar) |
| `docs/architecture/KPV-10-PLATFORM-READINESS-REVIEW.md` | Baseline pre-hardening (obsoleto) |
| `docs/pilots/ALPHA-PILOT-FIX-VALIDATION.md` | Validación piloto alpha |
| `.github/workflows/ci.yml` | Gate actual |

---

*Auditoría Sprint 14 — Kadarn Platform `1.0.0-hardening.11`*
