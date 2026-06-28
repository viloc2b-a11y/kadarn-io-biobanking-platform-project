# KPV-10 — Platform Readiness Review

**Status:** Final  
**Date:** 2026-06-27  
**Question:** ¿Puede Kadarn operar una red real de biobancos?

---

## Total de pruebas

```
Main test suite:    21 files,  297 tests ✅
packages/provenance: 1 file,    29 tests ✅
packages/telemetry:  1 file,    17 tests ✅
packages/workflow-engine: 1 file, 20 tests ✅
──────────────────────────────────────────
TOTAL               24 files,  363 tests ✅
```

`tsc --noEmit` → 0 errors ✅  
`npm run build -w apps/api` → Build OK ✅  
Working tree → CLEAN ✅

---

## 1. Score por Engine

Cada motor se puntúa en: **Implementación** (lo que existe) y **Integración** (lo que está conectado a rutas reales).

| Engine | Implementación | Integración | Score | Estado |
|---|---|---|---|---|
| **Policy Engine** | 10/10 | 7/10 | **8.5/10** | ✅ Shadow mode funcional. Feature flags. 2 políticas. 1 ruta integrada. Falta: conectar a más rutas, HttpOpaClient, persistence. |
| **Provenance Engine** | 10/10 | 8/10 | **9/10** | ✅ W3C PROV mapping. Append-only. 6 triggers. Correction pattern. Integrado en 4+ helpers. |
| **Workflow Engine (Temporal PoC)** | 7/10 | 4/10 | **5.5/10** | ⚠️ Tipos Temporal-compatibles. Activities stubs. Workflow Exchange Request definido. Sin SDK Temporal real. Sin workers. |
| **Telemetry** | 9/10 | 6/10 | **7.5/10** | ✅ `withTracing`/`withAsyncTracing`. Noop + real tracer. 15+ rutas envueltas. Falta: conectar a OpenTelemetry real exporter. |
| **Domain Events** | 8/10 | 5/10 | **6.5/10** | ✅ 20+ tipos de evento. Envelope con correlationId. Sin EventBus implementation. Eventos se loggean, no se publican. |
| **Exchange Engine** | 8/10 | 7/10 | **7.5/10** | ✅ Routes + helpers integrados. Request/deal/approval conectados. |
| **Logistics Engine** | 7/10 | 6/10 | **6.5/10** | ✅ Shipments + twins. Trust stub. Temperature tracking. Sin route de QC dedicada. |
| **Processing Engine** | 6/10 | 3/10 | **4.5/10** | ⚠️ Tablas existen. QC status. Sin route para actualizar qc_status. No integrado. |
| **Financial Engine** | 2/10 | 1/10 | **1.5/10** | ❌ Stub. Sin settlement real. Escrow existe en DB pero no hay engine. |
| **Discovery Engine** | 8/10 | 7/10 | **7.5/10** | ✅ Search, catalog, specimens browse conectados. Supply items. |
| **Trust Engine** | 4/10 | 2/10 | **3/10** | ⚠️ Package existe. Tablas en DB. Sin integración real. Stub en logistics. |
| **Analytics Engine** | 6/10 | 5/10 | **5.5/10** | ⚠️ KOC dashboard endpoint. Snapshots. Sin métricas en tiempo real. |
| **Audit** | 6/10 | 4/10 | **5/10** | ⚠️ `audit_events` schema existe. Eventos definidos. Emisión incompleta. |
| **Auth / RLS** | 9/10 | 9/10 | **9/10** | ✅ Supabase JWT + RLS en 50+ tablas. Org-scoped. Multi-tenant probado. |

---

## 2. Score por Flujo

| Flujo | Sprint | Score | Estado |
|---|---|---|---|
| **Biobank Onboarding** | KPV-01 | **9/10** | ✅ Org→Users→Capabilities→Collections→Discovery Ready. Todos los engines participan. |
| **Prospective Collection** | KPV-02 | **7/10** | ⚠️ Exchange Request→Deal→Collection→Shipment→QC→Settlement. QC sin route. Settlement es stub. |
| **Retrospective Request** | KPV-03 | **8/10** | ✅ Catalog→Search→Availability→Request→Approval→Shipment→Payment. Approval PATCH agregado. Payment stub. |
| **Hospital Onboarding** | KPV-04 | **8/10** | ✅ Hospital→Org→Users→Capabilities→Collections→Discovery Ready. |
| **Research Sponsor** | KPV-05 | **8/10** | ✅ Sponsor→Program→Discovery→Request→Negotiation→Agreement→Collection→Logistics→QC→Analytics. QC y Analytics parciales. |
| **Failure & Recovery** | KPV-07 | **9/10** | ✅ Workflow cancel, lost shipment, failed QC, policy deny, compensation, retries, corrections. |
| **Multi-Tenant** | KPV-08 | **9/10** | ✅ 4 tenants aislados. RLS, policy, events, telemetry verificados. |
| **Performance** | KPV-09 | **10/10** | ✅ Todos los engines sub-milisegundo. Sin cuellos de botella. |

**Score general de flujos: 8.25/10**

---

## 3. Paquetes del Monorepo

### Con conectividad a rutas reales

| Package | Routes conectadas |
|---|---|
| `@kadarn/policy-engine` | `organizations/route.ts` GET |
| `@kadarn/telemetry` | 15+ rutas via `withAsyncTracing` |
| `@kadarn/provenance` | 3 helpers (onboarding, exchange, logistics) |
| `@kadarn/domain-events` | Eventos loggeados desde 4+ rutas |

### Existentes sin conectar a rutas

| Package | Potencial |
|---|---|
| `@kadarn/trust-engine` | Para evaluación de confianza entre organizaciones |
| `@kadarn/financial-engine` | Stub — necesario para settlement real |
| `@kadarn/integration-engine` | Para conectividad con sistemas externos |
| `@kadarn/intelligence-engine` | AI/ML sobre datos de la red |
| `@kadarn/fulfillment-engine` | Cumplimiento de acuerdos |
| `@kadarn/matching-engine` | Matching oferta-demanda de especímenes |

---

## 4. Gaps Restantes

### 🔴 Bloqueantes para v1.0

| Gap | Engine | Solución propuesta |
|---|---|---|
| Sin settlement real | Financial Engine | Implementar engine o integrar Stripe/Adyen |
| QC sin route dedicada | Processing Engine | Agregar `PATCH /api/v1/processing/aliquots/:id` para qc_status |
| GDPR Art.17 (right to erasure) | Auth/RLS | Implementar soft-delete pattern (`status=deleted`) |
| Sin emergency access | Auth | Break-glass endpoint con audit trail obligatorio |
| Consent management pasivo | Provenance | Workflow de consentimiento con withdrawal/expiración |

### 🟡 Importantes

| Gap | Engine | Solución propuesta |
|---|---|---|
| Temporal SDK no instalado | Workflow Engine | Instalar `@temporalio/*` y conectar worker |
| OpenTelemetry no exporta | Telemetry | Conectar `setTracer()` a OTel SDK exporter |
| Audit events no se emiten todos | Domain Events | Pasar las rutas restantes con emisión de audit |
| HttpOpaClient no implementado | Policy Engine | Implementar para cuando OPA server esté disponible |
| Policy decisions no persistidas | Policy Engine | KPE-02 pendiente — escribir a `policy_evaluations` |

### 🟢 Deseables

| Gap | Engine | Solución propuesta |
|---|---|---|
| FHIR adapter no implementado | — | Mapping documentado, falta código |
| Trust engine no conectado | Trust Engine | Evaluación de confianza en flujo de deals |
| No hay dashboard de monitoreo | — | Conectar telemetry a Grafana/Datadog |
| No hay rate limiting | API | Agregar middleware de rate limiting |

---

## 5. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Financial Engine stub bloquea settlement | Alta | Medio | Usar escrow DB existente + webhook manual |
| GDPR right to erasure como blocker legal | Media | Alto | Implementar soft-delete antes de producción |
| QC sin route dedicada | Media | Medio | Ruta `PATCH /api/v1/processing/aliquots/:id` es ~50 líneas |
| Temporal SDK integration effort | Media | Bajo | Workflow types ya definidos, solo conectar |
| Sin experiencia operativa en biobancos | Alta | Alto | Pilot con 1 biobanco real antes de red completa |

---

## 6. Prioridades para v1.0-beta

### Must-have (antes de tag v1.0.0-beta)

1. ✅ **KPV-01 a KPV-09 completados** — 9 sprints de validación
2. ✅ **363 tests pasando** — Suite de regresión
3. ✅ **Multi-tenant isolation verificado** — RLS, policy, events
4. ✅ **Failure scenarios probados** — 14 tests de recovery
5. ✅ **Performance validada** — Todos sub-ms
6. ✅ **Regulatory checklist** — Gaps documentados
7. 🔲 **Financial engine MVP** — Settlement básico para deals
8. 🔲 **QC route** — PATCH para qc_status
9. 🔲 **GDPR soft-delete** — Status=deleted pattern

### Should-have (post-beta, pre-v1.0.0)

10. 🔲 Audit event emission completa
11. 🔲 Temporal SDK integration (sin workers todavía)
12. 🔲 OpenTelemetry exporter configurable
13. 🔲 Trust engine integrado en flujo de deals

### Nice-to-have (post-v1.0.0)

14. 🔲 FHIR API exposure
15. 🔲 Policy decisions persistentes (KPE-02)
16. 🔲 Dashboard de monitoreo
17. 🔲 Rate limiting

---

## 7. Roadmap Completo

### Fase KAA — Arquitectura (Completada)
```
KAA-001    Policy Engine Architecture        ✅
KAA-002    Workflow Engine Architecture       ✅
KAA-003    Provenance Engine Architecture     ✅
```

### Fase KPE — Platform Engineering (Completada)
```
KPE-01     OPA Shadow Mode Foundation        ✅  2eef7b1
KPE-02     Policy Decision Persistence       🔲  Diferido
KPE-03     OPA External Adapter              🔲  Diferido
KPE-04     PROV Runtime Validation           ✅  7cf038e
KPE-05     PROV Semantic Mapping             ✅  bcac010
KPE-06     Temporal Readiness Map            ✅  83b287a
KPE-07     Temporal PoC Foundation           ✅  b4bbf80
KPE-08     OpenTelemetry Baseline            ✅  ef5563d
KPE-09     FHIR Mapping Readiness            ✅  2078f3c
KPE-10     Integration Review                ✅  f513a26
KPE-11     Engine Integration Review         ✅  fb12da0
```

### Fase KPV — Platform Validation (Completada)
```
KPV-01     Biobank Onboarding                ✅  94d4bb7
KPV-02a    Prospective: Exchange→Deal        ✅  fa15c9d
KPV-02b    Prospective: Collection→Settlement ✅  5a10d67
KPV-03     Retrospective Sample Request      ✅  dc159f9
KPV-04     Hospital Onboarding               ✅  8654a75
KPV-05     Research Sponsor                  ✅  96f1d9a
KPV-06     Regulatory Validation             ✅  78036f6
KPV-07     Failure & Recovery                ✅  b61e696
KPV-08     Multi-Tenant Validation           ✅  3207e21
KPV-09     Performance Validation            ✅  7fa8ba6
KPV-10     Platform Readiness Review         ✅  presente
```

### Fase v1.0 — Production (Pendiente)
```
v1.0.0-a1  Financial Engine MVP              🔲
v1.0.0-a2  QC Route + Processing Engine      🔲
v1.0.0-a3  GDPR Soft-Delete                  🔲
v1.0.0-b1  Audit Events Completo             🔲
v1.0.0-b2  Temporal SDK Integration          🔲
v1.0.0-b3  OTel Exporter                     🔲
v1.0.0-rc  Hardening + Pilot                 🔲
v1.0.0     Release                           🔲
```

---

## 8. Respuesta Final

**¿Puede Kadarn operar una red real de biobancos?**

**Sí, con reservas.**

Kadarn tiene:

- ✅ **Arquitectura sólida** — 21 packages, engines desacoplados, interfaces claras
- ✅ **363 tests de regresión** — 0 fallos, typecheck y build verdes
- ✅ **5 flujos de negocio validados** — Onboarding, colección, request, sponsor, hospital
- ✅ **Multi-tenant isolation probado** — 4 organizaciones simultáneas
- ✅ **Failure scenarios cubiertos** — Cancelación, pérdida, fallo, compensación, corrección
- ✅ **Performance validada** — Todos los engines sub-milisegundo
- ✅ **Marco regulatorio documentado** — Gaps conocidos contra 21 CFR 11, HIPAA, GDPR, ISO 20387
- ✅ **Working tree limpio** — 20+ commits sin deuda técnica nueva

**Pero requiere antes de producción real:**

1. **Financial Engine MVP** — El settlement no existe. Sin settlement, la red no puede liquidar transacciones.
2. **QC route** — Sin endpoint para actualizar qc_status, el control de calidad no cierra el ciclo.
3. **GDPR Art.17** — Soft-delete necesario para cumplimiento legal en Europa.
4. **Pilot con 1 biobanco real** — La validación técnica está hecha. La validación operativa requiere usuarios reales.

**Score final de plataforma: 7.5/10** — Lista para pilot, no para producción sin los 3 blockers above.
