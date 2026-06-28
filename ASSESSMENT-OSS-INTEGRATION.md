# Kadarn OSS Integration Assessment

**Date:** 2026-06-27
**Scope:** Técnico — código existente vs OSS candidatos
**Método:** Auditoría de archivos reales, no blueprints

---

## 1. Estado Real de Kadarn (por capacidad)

### 1.1 Arquitectura General

| Dimensión | Estado Real | Detalle |
|-----------|-------------|---------|
| Stack | Next.js 16 + Supabase + PostgreSQL 17 | API en apps/api (Next.js App Router), planes de frontend en apps/web (vacío) |
| Monorepo | npm workspaces: `apps/*`, `packages/*` | Root package.json define workspaces; packages mayormente sin `package.json` funcional |
| TypeScript | 5.8.x declarado, compilación falla | Typecheck errors en route handlers, body:unknown, layout sin default export |
| Testing | Vitest 3.1, 32 .test.ts files | Dependencias: solo @supabase/supabase-js y vitest. Sin @vitest/coverage-v8, sin test utils compartidos |

### 1.2 Paquetes — Profundidad Real

| Paquete | LOC | package.json | Estado |
|---------|-----|-------------|--------|
| platform-services | 1095 | ✅ | Más implementado. Servicios compartidos |
| operational-twins | 947 | ✅ | Implementación significativa |
| trust-engine | 662 | ✅ | Score, challenges, eventos |
| policy-engine | 530 | ✅ | Políticas, reglas, evaluaciones |
| workflow-engine | 360 | ✅ | Definiciones, instancias, tareas |
| knowledge-engine | 348 | ✅ | Conocimiento, embeddings |
| provenance-graph | 318 | ✅ | Nodos, aristas, consultas |
| ai-layer | 242 | ✅ | Modelos, inferencias |
| graph-query | 223 | ✅ | Query layer |
| domain-events | 217 | ✅ | 16 event types, EventBus interface |
| types | 159 | ✅ | Tipos compartidos |
| auth | 94 | ✅ | Auth helpers |
| kpe-generator | 68 | ✅ | KPE generation |
| matching-engine | 25 | ✅ | Matching stubs |
| financial-engine | 12 | ✅ | Stubs |
| fulfillment-engine | 17 | ✅ | Stubs |
| integration-engine | 12 | ✅ | Stubs |
| intelligence-engine | 8 | ✅ | Stubs |
| config | 0 | ❌ | Vacío |
| db | 0 | ❌ | Vacío |
| ui | 0 | ⚠️ | package.json creado en sesión, vacío |

**Hallazgo crítico:** 5 engines (financial, fulfillment, integration, intelligence, matching) son **stubs** — menos de 25 líneas cada uno. No hay implementación real.

### 1.3 Base de Datos — Migraciones

- **24 migraciones** (008-031) aplican correctamente tras fixes
- **263 RLS policies** totales — cobertura de seguridad excelente
- Schemas: organizations, programs, participants, exchange, processing, logistics, regulatory, analytics, AI, policy, trust, twins, provenance, knowledge, workflow
- **Sin migraciones de datos (data migrations)** — solo schema + seed

### 1.4 API — Endpoints Reales

**67 endpoints** implementados en Next.js App Router:
- Core: health, me, organizations, programs
- v1: collections, exchange/deals, feed, shipments, specimens
- koc: analytics, ecosystem, events, knowledge, logistics, platform-health, policy, twins, workflow
- marketplace: capabilities, feasibility, network, organizations, requests, search, services, specimens, supply-items
- operations: capacity, compliance, exceptions, kpe, provenance, sla, trust
- workspace: active-org, applications, collections, consent, documents, inventory, logistics, navigation, overview, payments, processing, profile, programs, qc, regulatory, requests
- notifications, search

**Problema:** 19 endpoints tienen `body: unknown` sin validación Zod. Ningún endpoint tiene rate limiting, timeouts configurables, ni observabilidad.

### 1.5 Seguridad

| Capa | Estado |
|------|--------|
| RLS a nivel DB | 263 policies — muy buena cobertura |
| Auth JWT vía Supabase | Implementado con SSR |
| Policy Engine (aplicación) | Tabla + evaluaciones, pero sin motor de decisiones externo |
| Audit Trail | Tabla audit_events con trigger function |
| Rate limiting | ❌ No implementado |
| Input validation | Parcial (Zod declarado, no aplicado en 19 endpoints) |
| Secret management | .env.local en API, sin Vault |

### 1.6 Eventos

- **16 event types** en KadarnEventMap (Organization*, Program*, AccessRequest*, AuditEventCreated)
- EventBus interface definida, sin implementación concreta
- Sin broker de mensajes (ni Kafka, ni Rabbit, ni NATS)
- Event Catalog existe como doc pero reclama 62 eventos — **inconsistente**

### 1.7 Testing

- **32 test files**, todos bajo `tests/`
- 7 suites de seguridad (identity, authorization, audit, threat, compliance, concurrency, performance)
- Suites funcionales: core, discovery, exchange, feasibility, programs, processing, logistics, regulatory, analytics, AI, events, + cada engine
- **No corren:** `npm test` falla (tests fuera de workspaces), coverage no configurable, env keys inconsistentes
- 1 error de compilación conocido en audit.test.ts (orgId redeclarado)

### 1.8 Observabilidad

| Componente | Estado |
|------------|--------|
| Logging estructurado | ❌ Solo console.error en handleApiError |
| Métricas | ❌ No implementado |
| Tracing | ❌ No implementado |
| Health endpoint | ✅ /api/health responde |
| KOC metrics dashboard | Endpoints implementados, data real en seed |

### 1.9 Documentación — Consistencia

| Documento | Lo que dice | Lo que realmente hay | Veredicto |
|-----------|-------------|---------------------|-----------|
| `v1-beta-readiness.md` | "259 tests, 13 suites, 0 failures" | Tests no corren, 32 suites, errores conocidos | ❌ Desfasado |
| `current-state-vs-reference-model.md` | "3/9 engines, 62 event types" | 16+ engines (parciales), 16 event types | ❌ Desfasado |
| Blueprint | Arquitectura completa de 22 secciones | Coherente con intención, no con implementación | ⚠️ Guía, no espejo |
| ADR-001 al ADR-021 | Decisiones arquitectónicas | 20 ADRs, mayoría recientes (005-021) | ✅ Buenos, pero no refrendados por código |

---

## 2. Matriz OSS vs Capacidades Kadarn

### 2.1 OPA (Open Policy Agent)

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Policy Decision Point — decide si acción está permitida según reglas declarativas (Rego) |
| **Madurez** | CNCF Graduated, producción en Goldman Sachs, Google Cloud, Netflix |
| **Licencia** | Apache 2.0 |
| **¿Qué capacidad Kadarn duplica?** | Policy Engine en packages/policy-engine (530 LOC). Kadarn tiene tabla de policies + evaluaciones + RLS. OPA es un motor completo con Rego, decision logging, bundles. |
| **¿Qué aporta?** | (1) Lenguaje de políticas Rego (declarativo, testeable), (2) Decision logging automático = audit trail gratis, (3) Bundles que se actualizan sin redeploy, (4) Separación policy/code real |
| **Riesgo** | Bajo si se implementa como capa de negocio, no reemplazo de RLS |
| **Esfuerzo** | Medio: integrar sidecar OPA + migrar políticas existentes a Rego |
| **Recomendación** | **Adopt** — pero como complemento de RLS, no reemplazo |

### 2.2 Temporal

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Durable workflow orchestration — ejecución de procesos multi-paso que sobreviven fallos |
| **Madurez** | Muy alta — Netflix, Coinbase, Snap, Stripe |
| **Licencia** | MIT (Temporalite dev) / BSL (server) |
| **¿Qué capacidad Kadarn duplica?** | Workflow Engine en packages/workflow-engine (360 LOC). Kadarn tiene state machine en DB + workflow_definitions/instances/tasks. Temporal es un orchestrator completo con reintentos, timeouts, señalización. |
| **¿Qué aporta?** | (1) Durable execution: workflows sobreviven crashes, (2) Reintentos automáticos con backoff, (3) Signals para esperar actores externos (días/semanas), (4) Visibilidad del estado de cada workflow |
| **Riesgo** | Bajo si Temporal orquesta pero los estados del dominio siguen en DB de Kadarn |
| **Esfuerzo** | Alto: integrar SDK + refactorizar workflows existentes a actividades Temporal |
| **Recomendación** | **Adopt** — fases: primero procesos nuevos, después migrar existentes |

### 2.3 OpenTelemetry

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Observabilidad: tracing, métricas, logging estandarizado |
| **Madurez** | CNCF Incubating, adopción masiva |
| **Licencia** | Apache 2.0 |
| **¿Qué capacidad Kadarn duplica?** | No existe observabilidad en Kadarn. No hay duplicación. |
| **¿Qué aporta?** | (1) Trazado distribuido entre servicios, (2) Métricas estandarizadas, (3) Logging estructurado, (4) Exporters a cualquier backend (Grafana, Datadog, etc.) |
| **Riesgo** | Muy bajo — no hay nada que romper |
| **Esfuerzo** | Bajo: instrumentar API routes + packages |
| **Recomendación** | **Adopt** — debe ser parte del stack base antes de producción |

### 2.4 Apache Kafka / Event Backbone

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Event streaming backbone — comunicación asíncrona entre servicios |
| **Madurez** | Muy alta |
| **Licencia** | Apache 2.0 |
| **¿Qué capacidad Kadarn duplica?** | EventBus interface en domain-events (sin implementación). No hay duplicación porque no hay broker real. |
| **¿Qué aporta?** | (1) Event backbone con persistencia, (2) Replay de eventos, (3) Garantías de entrega, (4) Separación de servicios vía eventos |
| **Riesgo** | Medio: complejidad operacional alta. No necesario hasta que haya múltiples servicios. |
| **Esfuerzo** | Alto (infraestructura + aplicación) |
| **Recomendación** | **Monitor** — necesario cuando Kadarn crezca a múltiples servicios, prematuro hoy |

### 2.5 FHIR (HL7 FHIR)

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Estándar de interoperabilidad clínica — recursos para specimens, pacientes, consentimientos |
| **Madurez** | Estándar HL7 internacional, mandatory en USA (21st Century Cures), UK, Alemania |
| **Licencia** | Estándar abierto (HL7) |
| **¿Qué capacidad Kadarn duplica?** | Modelo de datos de specimens, collections, consent — Kadarn tiene su propio modelo. FHIR Specimen resource sería un mapping, no un reemplazo. |
| **¿Qué aporta?** | (1) Interoperabilidad con hospitales/biobancos que ya tienen FHIR, (2) Modelo de datos estandarizado para specimens, (3) API REST estándar para consulta |
| **Riesgo** | Bajo: es un mapping de datos, no un reemplazo del backend |
| **Esfuerzo** | Medio: crear translation layer entre modelo Kadarn y recursos FHIR |
| **Recomendación** | **Adopt como estándar de interoperabilidad** — crear Paquete FHIR Translation, no reemplazar modelo interno |

### 2.6 W3C PROV (Provenance)

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Estándar W3C para representación de procedencia de datos |
| **Madurez** | Estándar W3C, implementaciones variadas |
| **Licencia** | Estándar abierto |
| **¿Qué capacidad Kadarn duplica?** | Provenance Graph en packages/provenance-graph (318 LOC). Kadarn tiene nodos/aristas de procedencia. PROV sería un modelo de datos diferente. |
| **¿Qué aporta?** | (1) Vocabulario estandarizado (Entity-Activity-Agent), (2) Serializaciones (PROV-N, PROV-JSON, PROV-O), (3) Interoperabilidad con otros sistemas que usan PROV |
| **Riesgo** | Bajo |
| **Esfuerzo** | Bajo: mapear modelo Kadarn a vocabulario PROV |
| **Recomendación** | **Adopt como estándar de representación** — wrapper PROV sobre modelo existente |

### 2.7 OpenSpecimen

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | LIMS/Biobank management — specimens, collections, containers, shipments |
| **Madurez** | Alta (10+ años, deployed en 60+ países) |
| **Licencia** | AGPL v3 (Community Edition) |
| **¿Qué capacidad Kadarn duplica?** | Modelo de datos de specimens/collections/containers — Kadarn tiene esquema similar en migrations 017/018/024 |
| **¿Qué aporta?** | (1) Modelo de datos probado para biospecímenes, (2) Catálogos curados para discovery, (3) UI completa para gestión de biobancos |
| **Riesgo** | AGPL es riesgosa para un producto cerrado. No se puede integrar código directamente si Kadarn no es AGPL. |
| **Esfuerzo** | Bajo si solo referencia, alto si integra |
| **Recomendación** | **Reference (diseño) + Connector (integración)** — inspirarse en el modelo de datos, construir connector para que biobancos con OpenSpecimen puedan publicar catálogos en Kadarn |

### 2.8 Stripe Connect

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Plataforma de pagos multi-sided: cuentas conectadas, escrow, split payments |
| **Madurez** | Producción masiva |
| **Licencia** | SaaS, no OSS |
| **¿Qué capacidad Kadarn duplica?** | Financial Engine (stub, 12 LOC), Exchange Engine (migration 016 + deals/escrow tables). Kadarn tiene diseño propio de deals + escrow. |
| **¿Qué aporta?** | (1) Multi-party settlement real (no simulado), (2) Onboarding KYC de organizaciones, (3) Split payments automáticos, (4) Compliance fiscal/regulatoria |
| **Riesgo** | Dependencia externa. Stripe no entiende de MTA/DTA — es solo el rail de pagos. |
| **Esfuerzo** | Medio |
| **Recomendación** | **Integrate** — Stripe Connect como rail de pagos, capa Kadarn de MTA/DTA encima |

### 2.9 ERC-8004 / TRUCE

| Dimensión | Evaluación |
|-----------|------------|
| **Propósito** | Trust scoring para redes de actores autónomos — trust vector + action receipts |
| **Madurez** | Emergente (2026), estándar en propuesta |
| **Licencia** | Estándar abierto |
| **¿Qué capacidad Kadarn duplica?** | Trust Engine (662 LOC) — Kadarn tiene trust scores, challenges, eventos. Más avanzado que TRUCE en el dominio de biospecímenes. |
| **¿Qué aporta?** | Concepto de trust vector + action receipts firmados |
| **Riesgo** | Estándar inmaduro, ecosistema pequeño |
| **Recomendación** | **Monitor** — interesante como inspiración para futura evolución de trust, no para hoy |

---

## 3. Mapa de Decisiones

| Proyecto | Decisión | Rationale |
|----------|----------|-----------|
| **OPA** | ✅ **Adopt** | Policy decision point para reglas de negocio. Capa separada de RLS. Complementa, no reemplaza. |
| **Temporal** | ✅ **Adopt** | Durable workflow para procesos multi-actor. Los estados del dominio siguen en Kadarn DB; Temporal orquesta. |
| **OpenTelemetry** | ✅ **Adopt** | Stack base de observabilidad. No hay nada hoy que reemplazar. Bajo esfuerzo, alto impacto. |
| **FHIR** | ✅ **Adopt** | Estándar de interoperabilidad. Translation layer, no backend. Crítico para adopción por hospitales. |
| **W3C PROV** | ✅ **Adopt** | Estándar de representación de procedencia. Wrapper sobre provenance-graph existente. |
| **OpenSpecimen** | 🔗 **Reference + Connector** | Referencia de diseño (modelo de datos LIMS) + connector para interoperar. AGPL incompatible con integración directa. |
| **Stripe Connect** | 🔗 **Integrate** | Rail de pagos. Kadarn mantiene capa de MTA/DTA, términos, y escrow lógico arriba. |
| **Apache Kafka** | 👁 **Monitor** | Necesario cuando Kadarn sea multi-servicio. Hoy monolith/simple-service no lo justifica. |
| **ERC-8004/TRUCE** | 👁 **Monitor** | Interesante como inspiración. Trust Engine de Kadarn está más avanzado en su dominio. |
| **Digital Twin frameworks** | ❌ **Reject** | IP propia — no hay OSS maduro para biospecimen twins. Operational Twins de Kadarn (947 LOC) es el estado del arte. |

---

## 4. Roadmap de Integración

### Fase 0 — Cerrar Brecha de Verificabilidad (semana 1-2)

Antes de integrar cualquier OSS, Kadarn necesita estar en estado verificable:

1. Workspace config: agregar `tests` a workspaces, crear package.json funcional para packages/ui y packages/auth
2. Fix build API: resolver route handler types, body:unknown en 19 endpoints, export default en layout
3. Fix build web: resolver dependencias @kadarn/ui, @kadarn/auth
4. Test harness unificado: .env strategy, jq portátil, fix orgId en audit.test.ts, coverage config
5. Reconciliación doc/código: event catalog, engine status, v1-beta-readiness

### Fase 1 — OpenTelemetry (semana 3)

- Instrumentar API routes con OpenTelemetry
- Exporters a backend de logging/métricas
- Base para tracing entre componentes

### Fase 2 — OPA (semanas 4-6)

- Deploy OPA sidecar / bundle server
- Migrar políticas de negocio existentes a Rego
- Conectar API → OPA para decisiones (MTA scope, export compliance, program eligibility)
- Decision logging = audit trail enriquecido

### Fase 3 — Temporal (semanas 7-10)

- Deploy Temporal server (dev mode: Temporalite)
- Definir actividades para cada paso de workflow existente
- Migrar program lifecycle, exchange lifecycle a Temporal
- Sample lifecycle y chain lifecycle después

### Fase 4 — Estándares (semanas 10-12)

- FHIR Translation Layer: Specimen → FHIR Specimen resource
- W3C PROV wrapper sobre provenance-graph existente

### Fase 5 — Stripe Connect + Connectors (semana 12+)

- Stripe Connect integration para payments reales
- OpenSpecimen connector para catálogos externos

---

## 5. Principio Arquitectónico No Negociable

**RLS sigue siendo la última línea de defensa.**

```
HTTP Request → API Route → Zod Validation → OPA Policy Check → Temporal Workflow → Supabase/PostgreSQL con RLS
                                                                                             ↕
                                                                                      Audit Events (DB trigger)
```

- OPA decide **políticas de negocio** (¿puede este sponsor solicitar esta muestra?)
- RLS decide **acceso a datos** (¿puede este usuario ver esta fila?)
- Temporal orquesta **el proceso** (esperar QC, reintentar envío, notificar partes)
- Audit trail registra **qué pasó** (vía triggers DB + OPA decision log)

Ninguna capa reemplaza a otra. Son ortogonales.

---

## 6. Riesgos No Cubiertos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| 5 engines son stubs (financial, fulfillment, integration, intelligence, matching) | Alto — capacidades prometidas no existen | Roadmap explícito, no prometer lo que no está implementado |
| packages/ui y packages/auth sin package.json funcional | Alto — bloquea build web | Fase 0 urgente |
| 19 endpoints sin validación Zod | Medio — riesgo de datos inválidos | Fase 0 o paralelo |
| Sin rate limiting ni protección DDoS | Medio — riesgo en producción | Agregar antes de producción |
| Dependencia de Supabase local para desarrollo | Medio — developers necesitan Docker + Supabase CLI | Documentar bien, considerar alternatives |
| AGPL de OpenSpecimen | Medio — incompatible con licencia Kadarn | Solo connector, no integración de código |
| Temporal BSL | Medio — cambios futuros de licencia | Temporalite para dev, evaluar alternativas (Dagster, Argo) |
