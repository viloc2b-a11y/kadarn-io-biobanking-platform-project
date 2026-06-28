# KPE-11 — Engine Integration Review

**Status:** Final  
**Sprint:** KPE-11  
**Date:** 2026-06-27

---

## 1. Engine API Inspection Summary

| Package | Public API | Runtime Deps | Events | Tracing | Correlation |
|---|---|---|---|---|---|
| `@kadarn/policy-engine` | 3 functions + 15 types + OPA wrappers | 0 | ❌ | ⚠️ via `withTracing` | `actorId`, `organizationId` |
| `@kadarn/provenance` | 8 functions + 13 types | 0 | ❌ | ⚠️ via `withTracing` | Ninguno (usa externalId) |
| `@kadarn/workflow-engine` | 10 functions + 11 types (temporal) | 0 | ❌ | ⚠️ via `withTracing` | `workflowId`, `requestId` |
| `@kadarn/telemetry` | 7 functions + 9 types + 5 constants | 0 | ❌ | ✅ Es el paquete de tracing | `TraceContext` |
| `@kadarn/domain-events` | `EventBus` interface + `DomainEvent` + 16 event types | 0 | ✅ Define eventos | ❌ | `actorId`, `organizationId`, `programId`, `correlationId`* |

* `correlationId` agregado en KPE-11.

---

## 2. Cross-Engine Flow Design

### Flow diagram

```
Policy Engine                     Workflow Engine                  Provenance Engine
┌──────────────────┐              ┌──────────────────┐             ┌──────────────────┐
│ evaluatePolicy() │──────┐       │ step.execute()   │─────┐       │ toProvDocument() │
│ → decision       │      │       │ → activityResult │     │       │ → PROV-JSON      │
└──────────────────┘      │       └──────────────────┘     │       └──────────────────┘
                          │                                │
                          ▼                                ▼
                    ┌──────────────────────────────────────────────────────┐
                    │              Telemetry (withTracing)                  │
                    │  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │
                    │  │ policy.eval│  │workflow  │  │ provenance.corr  │ │
                    │  └────────────┘  └──────────┘  └──────────────────┘ │
                    └──────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                    Domain Events (future bus)
                                    ┌─────────────────────┐
                                    │ PolicyEvaluated      │
                                    │ WorkflowStepCompleted│
                                    │ ProvenanceRecorded   │
                                    └─────────────────────┘
```

### Tested flow (8 integration tests)

| Step | Engine | What happens |
|---|---|---|
| 1 | Policy | `evaluate()` produces decision with `correlationId` |
| 2 | Workflow | Activity completes, result carries `correlationId` |
| 3 | Provenance | `toProvDocument()` records the action with `correlationId` |
| 4 | Telemetry | `withTracing` wraps policy + provenance, records spans |
| 5 | Event | All entities linked by `correlationId` → observable flow |

**Test file:** `tests/integration/cross-engine.test.ts` — 8 tests, all passing.

---

## 3. Correlation Model

### Gap found

| ID type | Used by | Problem |
|---|---|---|
| `correlationId` | ❌ No existe en ningún engine | No hay forma de linkear eventos cross-engine |
| `actorId` | DomainEvent, PolicyDecision | ✅ |
| `organizationId` | DomainEvent, PolicyDecision | ✅ |
| `programId` | DomainEvent | ✅ |
| `traceId` / `spanId` | Telemetry | ⚠️ Existe en TraceContext pero es no-op por defecto |
| `eventId` | DomainEvent | ✅ |
| `workflowId` | WorkflowEngine | ✅ Solo dentro de workflow |

### Fix applied

**`correlationId` agregado a `DomainEvent` envelope** (`packages/domain-events/src/index.ts`):

```typescript
export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  actorId: string;
  organizationId: string | null;
  programId: string | null;
  correlationId: string | null;  // ← NUEVO
  payload: T;
}
```

Este campo permite linkear: `PolicyDecision → WorkflowStep → ProvenanceRecord → DomainEvent` en un solo flujo.

### Recomendación

No crear un paquete compartido de tipos de correlación todavía. El `correlationId` en `DomainEvent` es suficiente para el corto plazo. Cuando los engines empiecen a emitir eventos reales, se puede evaluar un `CorrelationContext` compartido.

---

## 4. EventEnvelope Alignment

### Lo que existe

`packages/domain-events/src/index.ts` define:

- `DomainEvent<T>` — envelope canónico con 8 campos (incluyendo `correlationId`)
- `KadarnEventMap` — 16 tipos de eventos definidos
- `EventBus` — interfaz publish/subscribe (sin implementación)

### Gaps

| Gap | Impacto |
|---|---|
| **Ningún engine produce eventos** | Policy, provenance, workflow no emiten `DomainEvent`. Son pure functions. |
| **No hay EventBus implementation** | La interfaz existe pero no está conectada a nada. |
| **Provenance engine no usa DomainEvent** | `toProvDocument()` produce PROV-JSON, no `DomainEvent`. Son modelos conceptualmente distintos. |
| **Workflow activities son stubs** | Las activities registradas devuelven `{success, output}`, no emiten eventos. |

### Veredicto

Los engines no están diseñados para producir eventos directamente. Esto es aceptable para la etapa actual: los engines son **funciones puras** que transforman datos. La emisión de eventos corresponde a una capa de aplicación (routes, workers, future Temporal activities) que orqueste estos engines.

---

## 5. Telemetry Integration Check

### Status

✅ **Telemetry puede wrap policy evaluation, provenance mapping, workflow execution.**

Demostrado en tests:

```
withTracing(evaluate, SPAN_POLICY_EVALUATION)
  → mismo resultado que evaluate() → span registrado si hay tracer activo

withTracing(toProvDocument, SPAN_PROVENANCE_CORRECTION)
  → mismo resultado que toProvDocument() → span registrado si hay tracer activo
```

### Lo que falta

| Missing hook | Impacto |
|---|---|
| `withTracing` no está conectado a ninguna ruta real | No hay spans en producción porque nadie llama a `setTracer()` ni envuelve handlers |
| No hay `withAsyncTracing` en las routes de API | Las routes de Next.js son async — wrapping manual requerido |

No se necesita más infraestructura. El mecanismo existe. Falta la conexión en las routes.

---

## 6. Provenance + Workflow Integration

### Status

✅ **Workflow activity output es compatible con provenance mapping.**

Demostrado en tests:

```
workflow activity completa → produce provenance-compatible data
  → toProvDocument() puede mapearlo a PROV-JSON
  → correction de workflow (compensation) → wasRevisionOf en provenance
```

### Regla validada

> Original business state remains external to workflow.

Los tests confirman: `workflowId`, `requestId`, `specimenId` son del business layer. Provenance solo registra lo que ocurrió, no es dueña del estado.

---

## 7. Policy + Workflow Integration

### Status

✅ **Workflow puede consultar policy engine para permisos.**

Demostrado en tests:

```
workflow step prepara contexto → evaluate() produce decisión
  → workflow observa outcome → continúa
  → shadow mode: policy deny no bloquea workflow
  → decisión es observable (match/mismatch detectable)
```

### Regla validada

> OPA evaluates before high-impact steps. Shadow mode never blocks.

---

## 8. Integration Gaps Summary

| Gap | Priority | Action |
|---|---|---|
| Sin `correlationId` cross-engine | 🔴 Alta | ✅ **Resuelto** — agregado a DomainEvent |
| Sin eventos emitidos por engines | 🟡 Media | Aceptado por ahora. Los engines son pure functions. |
| Sin conexión de telemetry a routes | 🟡 Media | `withTracing` existe. Falta wrapping en routes API. |
| Sin `EventBus` implementation | 🟢 Baja | Diferido hasta que haya un subscriber real. |
| Sin `TemporalEngine` implementation | 🟢 Baja | Diferido hasta instalación de Temporal SDK. |
| Sin FHIR adapter | 🟢 Baja | Mapping documentado en KPE-09. |

---

## 9. Code Changes in KPE-11

| File | Change | Type |
|---|---|---|
| `packages/domain-events/src/index.ts` | Agregado `correlationId` a `DomainEvent` | 🔧 No-breaking |
| `tests/integration/cross-engine.test.ts` | 8 tests de integración cross-engine | ✅ Nuevo |

Zero cambios en: API routes, RLS, auth, migrations, schemas, paquetes existentes.

---

## 10. Verification

```
npm test                → 236 passed (+8 integration tests)
tsc --noEmit (global)   → 0 errors
npm run build -w apps/api → Build OK

Package-level:
  @kadarn/provenance    → 29 tests ✅
  @kadarn/telemetry     → 17 tests ✅
  @kadarn/workflow-engine → 20 tests ✅
```

---

## 11. Recommended Next Sprints

### Inmediato

**KPE-02 — Policy Decision Persistence**
- Natural después de KPE-01
- Persistir decisiones de shadow mode en `policy_evaluations` (usando `context` JSONB)
- Sin schema changes

### Corto plazo

**KPE-03 — OPA External Adapter (HttpOpaClient)**
- Baja prioridad hasta que haya OPA server

**Wire Telemetry a routes existentes**
- Envolver `organizations/route.ts` con `withTracing`
- Envolver `ShadowModeRunner.evaluate` con `SPAN_POLICY_EVALUATION`
- Envolver `provenance_node_integrity_status` con `SPAN_INTEGRITY_RESOLUTION`

### Medio plazo

- **EventBus implementation** (cuando haya subscribers)
- **Temporal SDK integration** (instalar `@temporalio/*` y conectar actividades reales)
- **FHIR adapter** (cuando se expongan endpoints FHIR)
