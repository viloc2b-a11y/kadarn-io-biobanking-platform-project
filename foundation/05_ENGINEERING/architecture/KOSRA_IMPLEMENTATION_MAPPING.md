# KOSRA Implementation Mapping

**Versión:** 0.2
**Estado:** Canonical
**Propósito:** Mapa de correspondencia formal entre las capas de transformación de valor de KOSRA y los componentes funcionales existentes en el repositorio canónico de KADARN.
**Depende de:** KOSRA.md, ARCHITECTURE.md, ADR-012

---

## 1. Principio de correspondencia

KOSRA describe **cómo el valor se transforma** a través de capas de inteligencia. La arquitectura por engines (ADR-012, KRM-RAO) describe **cómo el sistema se descompone** funcionalmente.

KADARN se describe mediante cuatro vistas complementarias. Esta correspondencia cubre las cuatro:

| Vista | Documento | Naturaleza |
|-------|-----------|------------|
| Functional Engines View | ARCHITECTURE.md, ADR-012, KRM-RAO | Descomposición funcional |
| Intelligence Layers View | KOSRA.md | Transformación de valor |
| Runtime and Observability View | KOSRA.md §3.1 | Salud operativa |
| Analytical and Reporting View | KOSRA.md §3.2 | Proyecciones analíticas |

Esta correspondencia es 1:N — una capa KOSRA puede corresponder a varios engines, y un engine puede operar en múltiples capas.

---

## 2. Mapa Intelligence Layers → componentes existentes

### DATA FABRIC

Responsabilidad: Ingestión y unificación de fuentes de datos heterogéneas.

| Componente existente | Tipo | Estado | Notas |
|--------------------|------|--------|-------|
| PostgreSQL 17 + Supabase | Persistence | ✅ Producción | Alma del Data Fabric |
| `packages/*` connectors | Paquete | ⚠️ Parcial | Integration Engine es stub |
| Migraciones 008-031 | DB | ✅ 24 migraciones | Esquema completo |
| RLS (263 políticas) | Seguridad | ✅ Cobertura completa | Aislamiento multi-tenant |
| API routes (67 endpoints) | API | ✅ Implementados | Next.js 16 App Router |
| MarkItDown pipeline design | Documento | ⚠️ Diseño existente | `docs/engineering/markitdown-document-pipeline.md` |

**Gaps:** Sin ingestion pipeline automatizado. Sin OpenTelemetry. Sin rate limiting.

---

### EVIDENCE CORE

Responsabilidad: Sistema de registro canónico para Claims, Evidence, Provenance, Identity, Policy, Review, Audit, Share Grants.

| Componente existente | Tipo | Estado | LOC | Notas |
|--------------------|------|--------|-----|-------|
| `packages/evidence-core/` | Paquete | ✅ Implementado | ~8,156+ | 29 archivos fuente |
| `packages/provenance/` | Paquete | ✅ Implementado | — | Append-only PROV |
| `packages/provenance-graph/` | Paquete | ✅ Implementado | 318 | DAG de procedencia |
| ADR-011 | Governance | ✅ **Frozen** | — | Evidence Core Boundary Rule |
| KEMS-001 | Modelo | ⚠️ Canonical Draft | — | Confidence Graph Model |
| KEMS-004 | Modelo | ✅ Canonical | — | Claim Provenance Architecture |
| DB migrations | Infra | ✅ 24 migraciones | — | evidence_core tables |
| Canonical Entities spec | Documento | ✅ Canónico | — | `foundation/01_DOMAIN/016_*` |

**Límites:** El Core es intencionalmente aburrido (ADR-011). No contiene scoring, inferencia ni lógica de negocio.

---

### EVIDENCE INTELLIGENCE

Responsabilidad: Transformación de evidencia cruda en inteligencia estructurada — confidence, conocimiento, entidades resueltas.

| Componente existente | Tipo | Estado | LOC | Notas |
|--------------------|------|--------|-----|-------|
| `packages/readiness-engine/` | Paquete | ✅ Implementado | ~1,500+ | Pipeline de evaluación de confianza |
| `packages/knowledge-engine/` | Paquete | ✅ Implementado | 348 | Ontología, taxonomía |
| `packages/policy-engine/` | Paquete | ✅ Implementado | 530 | ADR-010, motor declarativo |
| `packages/policy-engine/src/opa/` | Integración | ✅ Shadow Mode | — | OPA evaluando en paralelo |
| `packages/evidence-core/` evaluators | Paquete | ✅ | — | Evaluadores deterministas |
| EvaluationPipeline | Clase | ✅ | — | `readiness-engine/src/evaluation.ts` |
| projectConfidence() | Función | ✅ | — | Proyección determinista 0-100 |

**Gaps:** Confidence Engine no es Core Engine (ADR-012 lo deja abierto). Calibración estadística pendiente de dataset.

---

### CAPABILITY INTELLIGENCE

Responsabilidad: Representación verificable de capacidades institucionales derivadas de evidencia.

| Componente existente | Tipo | Estado | Notas |
|--------------------|------|--------|-------|
| PB-2.7 | Documento | ✅ **Canónico** | Capability = CapabilityType × Evidence × Confidence |
| `packages/institutional-knowledge/` | Paquete | ⚠️ Existe, no inspeccionado | Verificar profundidad |
| `packages/readiness-engine/` | Paquete | ✅ | Readiness reports, capability evaluation |
| Capability taxonomy | Documento | ✅ | PB-2.7 §Capability Taxonomy (10 categorías) |
| Frozen contracts | API | ✅ | CapabilityIntelligence, EvidenceGapIntelligence, InstitutionCapabilityAssessment |

**Gaps:** Capability Graph no está implementado como grafo explícito. Capability Portfolio no tiene implementación dedicada identificada.

---

### DECISION INTELLIGENCE

Responsabilidad: Matching, recomendaciones, gap prioritization, escenarios, forecasting.

| Componente existente | Tipo | Estado | LOC | Notas |
|--------------------|------|--------|-----|-------|
| `packages/sponsor-intelligence/` | Paquete | ⚠️ Parcial | — | No inspeccionado en profundidad |
| `packages/matching-engine/` | Paquete | ❌ **Stub** | 25 | Sin implementación real |
| ADR-018 | Governance | ✅ Accepted | — | Matching Engine design approved |
| Frozen contracts | API | ✅ | — | SponsorReadiness, RecommendationEngineOutput |
| `packages/institutional-knowledge/` | Paquete | ⚠️ | — | Posible gap intelligence parcial |

**Gaps críticos:**
- Matching Engine: **stub** (25 LOC)
- Recommendation Engine: **no demostrado**
- Forecasting / Scenario Analysis: **no demostrado**
- Gap Intelligence: posiblemente parcial en `institutional-knowledge/`

**Esta es la capa con menor madurez real.** KOSRA no debe interpretarse como inventario funcional para Decision Intelligence.

---

### APPLICATIONS AND DISTRIBUTION

Responsabilidad: Puntos de interacción con actores del ecosistema — passports, workspaces, APIs.

| Componente existente | Tipo | Estado | Notas |
|--------------------|------|--------|-------|
| `packages/delivery-domain/` | Paquete | ✅ Implementado | Canales, distribución, rendering |
| `packages/published-view/` | Paquete | ⚠️ | Published views engine |
| UX architecture | Documentos | ✅ | `docs/kux/` — workspaces, navegación |
| Workspace ADRs | Governance | ✅ | ADR-033 (membership), ADR-034 (workspace) |
| API routes | API | ✅ | 67 endpoints en apps/api/ |
| Sponsor workspace specs | Documentos | ✅ | kux-006 a kux-012 |

---

## 3. Planos transversales

### OPERATIONAL OBSERVABILITY

Propósito: Medir la salud en tiempo de ejecución. No produce evidencia institucional.

| Componente candidato | Clasificación KOSRA | Estado |
|---------------------|---------------------|--------|
| Grafana | Evaluate — Operational Observability | Sin instalación |
| Prometheus / VictoriaMetrics | Evaluate — según requisitos operacionales | Sin instalación |
| Loki | Evaluate — logging técnico estructurado | Sin instalación |

**Regla:** La telemetría operacional no debe clasificarse como evidencia institucional ni como provenance semántico.

### ARCHITECTURE INTELLIGENCE

Propósito: Proyección de solo lectura del estado arquitectónico. No es fuente de verdad.

| Componente candidato | Clasificación KOSRA | Estado |
|---------------------|---------------------|--------|
| Evidence.dev | Evaluate — Architecture Intelligence read-only | Sin instalación |
| DuckDB | Evaluate — proyección analítica embebida | Sin instalación |

**Regla:** Architecture Intelligence es una proyección de registros canónicos. No debe convertirse en fuente de verdad arquitectónica ni en superficie de edición de ADRs.

---

## 4. Mapa engine → capas KOSRA

| Engine / Paquete | LOC | Capa(s) KOSRA principal(es) | Plano transversal | Estado |
|-----------------|-----|------------------------------|-------------------|--------|
| evidence-core | 8,156+ | Evidence Core | — | ✅ Implementado |
| readiness-engine | 1,500+ | Evidence Intelligence, Capability Intelligence | — | ✅ Implementado |
| policy-engine | 530 | Evidence Intelligence | — | ✅ Implementado (+ OPA Shadow) |
| provenance-graph | 318 | Evidence Core, Evidence Intelligence | — | ✅ Implementado |
| provenance | — | Evidence Core | — | ✅ Implementado |
| knowledge-engine | 348 | Evidence Intelligence | — | ✅ Implementado |
| institutional-knowledge | — | Capability Intelligence | — | ⚠️ No verificado |
| sponsor-intelligence | — | Decision Intelligence | — | ⚠️ Parcial |
| matching-engine | 25 | Decision Intelligence | — | ❌ Stub |
| delivery-domain | — | Applications | — | ✅ Implementado |
| published-view | — | Applications | — | ⚠️ |
| trust-engine | 662 | — | — | ❌ Retirado (ADR-010) |
| operational-twins | 947 | Data Fabric (fuente Clase C) | — | ✅ Implementado |
| workflow-engine | 360 | Transversal | — | ✅ Implementado |
| graph-query | 223 | Transversal | — | ✅ Implementado |
| ai-layer | 242 | Evidence Intelligence (transversal) | — | ⚠️ Parcial |
| intelligence-engine | 8 | — | — | ❌ Stub |
| financial-engine | 12 | — | — | ❌ Stub |
| fulfillment-engine | 17 | — | — | ❌ Stub |
| integration-engine | 12 | — | — | ❌ Stub |
| (Grafana) | — | — | Operational Observability | Sin instalar |
| (Prometheus/VictoriaMetrics) | — | — | Operational Observability | Sin instalar |
| (Loki) | — | — | Operational Observability | Sin instalar |
| (Evidence.dev) | — | — | Architecture Intelligence | Sin instalar |
| (DuckDB) | — | — | Architecture Intelligence | Sin instalar |

---

## 5. Correspondencia ADRs ↔ capas KOSRA

| ADR | Capa(s) KOSRA | Plano transversal | Relación |
|-----|---------------|-------------------|----------|
| ADR-002 | Data Fabric | — | Multi-tenancy, RLS, organización |
| ADR-004 | Transversal | — | Límites de plataforma |
| ADR-005 | Transversal | — | Lexicón — superseded por KEMS |
| ADR-006 | Transversal | — | Ecosistema-first |
| ADR-007 | Transversal | — | 8 principios permanentes |
| ADR-011 | Evidence Core | — | Boundary rule — 5-condition test |
| ADR-012 | Transversal | — | Engine governance |
| ADR-013 | Transversal | — | Event-first platform |
| ADR-014 | Evidence Core, Data Fabric | — | Provenance Graph |
| ADR-015 | Evidence Intelligence | — | Knowledge Engine |
| ADR-018 | Decision Intelligence | — | Matching Engine (design) |
| ADR-033 | Data Fabric, Applications | — | Organization Membership |
| ADR-034 | Applications | — | Unified Workspace |
| ADR-035 | Transversal | — | KOSRA como vista canónica |
| ADR-036 | Evidence Intelligence | — | OPA Shadow-to-Enforce Governance |
| ADR-037 | Transversal | — | Mapa de correspondencia funcional |

---

## 6. Mapa de madurez (Capability Heat Map)

| Capacidad | Estado | Madurez | Evidencia | Próxima acción |
|-----------|--------|---------|-----------|----------------|
| Evidence Core | ✅ | Alta | ADR-011, 8,156+ LOC | Mantener |
| Provenance | ✅ | Alta | Implementado | Optimizar |
| Confidence | 🟡 | Media | Determinístico | Calibrar |
| Capability Intelligence | ✅ | Alta | PB-2.7 | Expandir |
| Readiness | ✅ | Alta | Implementado | Refinar |
| Matching | 🟡 | Baja | Stub (25 LOC) | Implementar |
| Recommendation | 🔴 | Baja | No demostrado | Diseñar |
| Forecasting | 🔴 | Baja | No existe | Investigar |
| Sponsor Intelligence | 🟡 | Media | Parcial | Consolidar |

---

## 7. Build vs Adopt Matrix

| Componente | Build | Adopt | Estado |
|-----------|-------|-------|--------|
| Evidence Core | ✅ | ❌ | Propio |
| Capability Model | ✅ | ❌ | Propio |
| Confidence Graph | ✅ | ❌ | Propio |
| Passport | ✅ | ❌ | Propio |
| MarkItDown | ❌ | ✅ | Evaluar |
| OPA | ❌ | 🟡 | Shadow Mode |
| Grafana | ❌ | 🟡 | Evaluar |
| Loki | ❌ | 🟡 | Evaluar |
| GraphRAG | ❌ | 🟡 | POC |
| DuckDB | ❌ | 🟡 | Evaluar |

---

*Este mapa se actualizará a medida que nuevos componentes sean evaluados, implementados o retirados. Refleja el estado del repositorio canónico al 2026-07-27 (commit 9c7684816f2b).*
