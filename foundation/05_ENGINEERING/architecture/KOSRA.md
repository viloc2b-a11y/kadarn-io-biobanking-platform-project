# KOSRA — KADARN Open Source Reference Architecture

**Versión:** 0.2
**Estado:** Canonical Architectural View
**Propietario:** KADARN Architecture Governance
**Alcance:** Plataforma KADARN
**Principio rector:** Evidence → Capability Intelligence → Decision Intelligence

---

## 0. Relación con la arquitectura existente

KOSRA es una **vista arquitectónica de transformación de valor**, no un reemplazo de la arquitectura funcional existente.

### Múltiples vistas arquitectónicas

KADARN se describe mediante cuatro vistas complementarias. Ninguna invalida a las otras:

| Vista | Propósito | Documento de referencia |
|-------|-----------|------------------------|
| **Functional Engines View** | Descomposición funcional del sistema en engines, servicios y paquetes. | ARCHITECTURE.md, ADR-012, KRM-RAO |
| **Intelligence Layers View** | Transformación de valor desde datos fuente hasta decisiones explicables. | KOSRA (este documento) |
| **Runtime and Observability View** | Salud operativa, rendimiento, disponibilidad y comportamiento en producción. | Definido por Operational Observability (§3.1) |
| **Analytical and Reporting View** | Proyecciones analíticas, dashboards y reporting sobre datos arquitectónicos e institucionales. | Definido por Architecture Intelligence (§3.2) |

Estas vistas son complementarias y no deben interpretarse como implementaciones en competencia.

### Documentos canónicos que rigen la implementación

| Documento | Rol |
|-----------|-----|
| KEMS-001 | Confidence Graph Model |
| KEMS-002 | Trustworthy Evidence Architecture |
| KEMS-003 | Kadarn Product Constitution |
| KEMS-004 | Claim Provenance Architecture |
| ADR-011 | Evidence Core Boundary Rule |
| ADR-012 | Engine Governance (Core/Certified/Private) |
| ARCHITECTURE.md | Implementación funcional |

KOSRA no redefine, duplica ni sustituye ninguno de estos documentos.

---

## 1. Propósito

KOSRA define cómo KADARN aprovecha componentes open source sin delegar en ellos su arquitectura central, su modelo de evidencia ni su diferenciación estratégica.

El documento establece:

* qué capacidades pueden acelerarse mediante software open source;
* qué componentes deben permanecer como propiedad intelectual de KADARN;
* qué repositorios pueden adoptarse, adaptarse o evaluarse;
* qué condiciones deben cumplirse antes de integrar una nueva dependencia;
* cómo evitar duplicidad, sobrearquitectura y dependencia tecnológica innecesaria.

KOSRA no es una autorización automática de implementación. Cada componente clasificado como candidato deberá pasar por una evaluación técnica, jurídica, operativa y de seguridad antes de entrar en producción.

---

## 2. Identidad arquitectónica de KADARN

KADARN es una **Institutional Capability Intelligence Platform** que transforma evidencia institucional en inteligencia explicable de capacidades, readiness y decisiones.

KADARN es una plataforma operativa para programas de biospecímenes, IVD y datos clínicos. Esa capacidad operativa es el dominio inicial sobre el que KADARN construye Institutional Capability Intelligence.

### Lo que KADARN no es

* un EMR o EHR;
* un CTMS;
* un EDC;
* un repositorio documental;
* una plataforma de Business Intelligence;
* un sistema de RAG;
* un knowledge graph aislado;
* un marketplace de sitios;
* una autoridad certificadora.

Ver ADR-004 (Platform Boundaries) para la definición completa de límites.

### Flujo arquitectónico canónico (Intelligence Layers View)

```
APPLICATIONS AND DISTRIBUTION
────────────────────────────────────────────────────────
Institution Passport
Sponsor Passport
Capability Explorer
Readiness Workspace
Evidence Workspace
Sponsor Intelligence
Controlled Sharing
Public and Partner APIs

                          │
                          ▼

DECISION INTELLIGENCE
────────────────────────────────────────────────────────
Matching Engine
Recommendation Engine
Gap Prioritization
Scenario Analysis
Forecasting
Sponsor Intelligence Services

                          │
                          ▼

CAPABILITY INTELLIGENCE
────────────────────────────────────────────────────────
Capability Portfolio
Capability Graph
Readiness Engine
Operational Profile
Research Profile
Infrastructure Profile
People Profile
Compliance Profile

                          │
                          ▼

EVIDENCE INTELLIGENCE
────────────────────────────────────────────────────────
Confidence Engine
Knowledge Engine
Evidence Graph
Claim Resolution
Evidence Linking
Entity Resolution
Evidence Asset Management

                          │
                          ▼

EVIDENCE CORE
────────────────────────────────────────────────────────
Canonical Entities
Claims
Evidence
Provenance
Identity
Policy
Review
Audit
Share Grants

                          │
                          ▼

DATA FABRIC
────────────────────────────────────────────────────────
ClinicalTrials.gov
PubMed
FDA
IRB Sources
Documents
SOPs
Operational Systems
Vilo OS
Partner APIs
Manual Uploads
Future FHIR and HL7 Integrations
```

### Planos transversales

Dos dominios de inteligencia operan como **planos transversales** sobre las capas anteriores, sin reemplazarlas:

**Operational Observability** — Mide la salud en tiempo de ejecución: latencia, disponibilidad, tasa de error, uso de recursos, profundidad de colas, tiempos de respuesta de OPA, fallos de autenticación, tasa de finalización de jobs.

**Architecture Intelligence** — Proyecta el estado de la implementación arquitectónica: madurez por componente, cobertura de ADR, deuda arquitectónica, divergencia documentación-código, estado implementado vs stub vs planificado.

Ambos se definen formalmente en §3.

### Institutional Intelligence como resultado de negocio

**Institutional Intelligence** es el resultado de negocio combinado producido por Evidence Intelligence, Capability Intelligence y Decision Intelligence. No es una capa separada — es la capacidad del sistema de transformar evidencia institucional en representaciones explicables de:

* frescura de evidencia;
* cobertura de provenance;
* madurez de capacidades;
* deriva de confianza;
* evolución de readiness;
* cierre de gaps;
* demostración operativa;
* fiabilidad histórica.

### Flujo conceptual

```
                    ┌──────────┐
                    │   Data   │
                    └────┬─────┘
                         ▼
                    ┌──────────┐
                    │ Evidence │
                    └────┬─────┘
                         ▼
                    ┌──────────┐
                    │  Claims  │
                    └────┬─────┘
                         ▼
                    ┌──────────────────┐
                    │ Verified Knowledge│
                    └───────┬──────────┘
                            ▼
                    ┌──────────────────────┐
                    │   Institutional      │
                    │    Capabilities      │
                    └───────┬──────────────┘
                            ▼
                    ┌──────────────────────┐
                    │  Readiness and Gaps  │
                    └───────┬──────────────┘
                            ▼
                    ┌──────────────────────┐
                    │  Explainable         │
                    │  Decisions           │
                    └──────────────────────┘
```

---

## 3. Los tres dominios de inteligencia

### 3.1 Operational Observability

**Propósito:** Medir la salud en tiempo de ejecución, fiabilidad, rendimiento y comportamiento ante fallos de KADARN, Hermes, Gateway, workers, APIs y servicios de política externos.

**Ejemplos de señales:**
* latencia de endpoints;
* disponibilidad del servicio;
* tasa de error por endpoint;
* uso de recursos de workers (CPU, memoria);
* profundidad de colas de eventos;
* tiempo de respuesta de OPA;
* fallos de autenticación;
* tasa de finalización de jobs.

**Herramientas candidatas:**
* Grafana — visualización de cuadros de mando operativos;
* Prometheus o VictoriaMetrics — almacén de métricas temporal;
* Loki — agregación de logs estructurados.

**Regla fundamental:** La telemetría operacional no debe clasificarse como evidencia institucional ni como provenance semántico.

### 3.2 Architecture Intelligence

**Propósito:** Proporcionar una representación de solo lectura, vinculada a evidencia, del estado de implementación, madurez, consistencia y evolución de la arquitectura de KADARN.

**Ejemplos de proyecciones:**
* Capability Heat Map (matriz estado × madurez por componente);
* Build vs Adopt Matrix;
* estado de componentes KOSRA;
* cobertura de ADRs por capa;
* deuda arquitectónica;
* frescura del baseline;
* implementado vs stub vs planificado;
* divergencia documentación-código.

**Herramientas candidatas:**
* Evidence.dev — dossiers de reporting como código para Architecture Intelligence;
* DuckDB — proyección analítica embebida donde esté justificada.

**Regla fundamental:** Architecture Intelligence es una **proyección de registros canónicos**. No debe convertirse en fuente de verdad arquitectónica ni en superficie de edición de ADRs o registros de governance.

### 3.3 Institutional Intelligence

**Propósito:** Transformar evidencia institucional en representaciones explicables de capacidad, madurez, confianza, readiness, gaps y adecuación para decisiones.

**Conceptos requeridos:**
* **Evidence Freshness** — cuán reciente es la evidencia que respalda un claim;
* **Provenance Coverage** — qué proporción de claims tienen provenance completa;
* **Capability Maturity** — nivel de desarrollo de una capacidad institucional;
* **Confidence Drift** — cambio en el nivel de confianza a lo largo del tiempo;
* **Readiness Evolution** — progreso de readiness institucional para un programa;
* **Gap Closure** — tasa de cierre de brechas identificadas;
* **Operational Demonstration** — evidencia de ejecución real de una capacidad;
* **Historical Reliability** — consistencia histórica en la demostración de capacidades.

**Regla fundamental:** Institutional Intelligence es lógica de dominio propietaria de KADARN. No debe externalizarse a motores de propósito general.

### Relación entre los tres dominios

```
                    ┌─────────────────────────────────────┐
                    │       Institutional Intelligence      │
                    │  (resultado de negocio combinado)     │
                    └─────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   Evidence          │   │   Capability        │   │   Decision          │
│   Intelligence      │   │   Intelligence      │   │   Intelligence      │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   Architecture      │   │   Operational       │   │   (otras fuentes)   │
│   Intelligence      │   │   Observability     │   │                     │
│   (plano transv.)   │   │   (plano transv.)   │   │                     │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

Operational Observability y Architecture Intelligence son **planos transversales**. No reemplazan las capas de dominio. Institutional Intelligence es el **resultado de negocio** producido por la combinación de Evidence, Capability y Decision Intelligence.

---

## 4. Principios arquitectónicos

### 4.1 Evidence-first
Ninguna conclusión relevante debe presentarse sin una relación trazable con evidencia.
*Referencia: ADR-007 (#2 Evidence over Declaration), ADR-011.*

### 4.2 Institution-owned evidence
La institución conserva control sobre sus activos de evidencia y sobre las autorizaciones de distribución.
*Referencia: ADR-002 (RLS multi-tenant), KEMS-003.*

### 4.3 Capability-centered product model
La evidencia no es el producto final. La evidencia sustenta una representación verificable de las capacidades institucionales.
*Referencia: PB-2.7 (Capability Intelligence) — Capability = CapabilityType × Evidence × Confidence.*

### 4.4 Explainability by construction
Los scores, matches, gaps y recomendaciones deben incluir: evidencia utilizada, políticas aplicadas, versión del modelo, transformaciones ejecutadas, factores positivos y negativos, nivel de confianza y limitaciones conocidas.
*Referencia: KEMS-001 §6 (mandatory explanation), ADR-011 (trace).*

### 4.5 Open source as accelerator
Los componentes open source resuelven funciones auxiliares o especializadas. No definen el dominio central de KADARN.
*Referencia: ASSESSMENT-OSS-INTEGRATION.md (evaluación técnica complementaria).*

### 4.6 Minimum necessary dependency
Una nueva dependencia solo debe incorporarse cuando resuelva una necesidad demostrada que no pueda cubrirse razonablemente con el stack existente.
*Principio formalizado por KOSRA.*

### 4.7 PostgreSQL-first
KADARN prioriza PostgreSQL y sus extensiones antes de introducir almacenes especializados adicionales.
*Referencia: ADR-002, ya implementado.*

### 4.8 Human-governed intelligence
Las recomendaciones pueden asistir decisiones, pero no deben sustituir automáticamente las decisiones institucionales, regulatorias o de selección clínica.
*Referencia: ADR-007 (#8 Human-in-the-Loop).*

### 4.9 Metric governance
Toda métrica gobernada debe incluir los metadatos definidos en §9. Los cambios en cálculo o política no deben representarse como cambios genuinos del sujeto sin interpretación consciente de la versión.

---

## 5. Propiedad intelectual central

Los siguientes componentes deben permanecer bajo control arquitectónico directo de KADARN:

### 5.1 Canonical Entity Model
*Referencia: `foundation/01_DOMAIN/016_CANONICAL_ENTITY_SPECIFICATIONS.md`, ADR-002.*

### 5.2 Evidence Core
*Referencia: ADR-011, KEMS-001, KEMS-004, `packages/evidence-core/`.*

### 5.3 Confidence Graph
*Referencia: KEMS-001, `packages/readiness-engine/` (evaluation pipeline).*

### 5.4 Capability Intelligence
*Referencia: PB-2.7 (Capability Intelligence), `packages/institutional-knowledge/`.*

### 5.5 Decision Intelligence
*Parcialmente implementado — ver `KOSRA_IMPLEMENTATION_MAPPING.md` para estado detallado.*

### 5.6 Institutional Intelligence
Lógica de dominio propietaria que transforma evidencia en representaciones de frescura, cobertura, madurez, deriva, evolución, cierre de gaps, demostración operativa y fiabilidad histórica.

---

## 6. Baseline implementado

Los siguientes componentes existen en el repositorio canónico y no deben reconstruirse como iniciativas "por construir" desde KOSRA:

| Componente | Estado | Referencia |
|------------|--------|------------|
| Evidence Core | Implementado | `packages/evidence-core/` (8,156+ LOC, 29 archivos) |
| Provenance Graph | Implementado | `packages/provenance-graph/` + `packages/provenance/` |
| Knowledge Engine | Implementado | `packages/knowledge-engine/` |
| Readiness Engine | Implementado | `packages/readiness-engine/` (1,500+ LOC, pipeline completo) |
| Capability Model | Canónico | PB-2.7 Capability Intelligence |
| Confidence Pipeline | Implementado | `readiness-engine` con evaluadores deterministas |
| MarkItDown Design | Documentado | `docs/engineering/markitdown-document-pipeline.md` |
| Policy Engine | Implementado | `packages/policy-engine/` (530 LOC, ADR-010) |
| OPA Shadow Mode | Integrado | `packages/policy-engine/src/opa/` |

---

## 7. Clasificación de decisiones

Cada tecnología se clasifica en una de las siguientes categorías.

### Adoptar
Componente maduro que resuelve una necesidad inmediata, es compatible con la arquitectura y ha superado validación.

### Adaptar
Componente cuyo diseño, módulo o algoritmo puede reutilizarse, pero que requiere aislamiento o adaptación importante. Incluye integraciones existentes que requieren decisión de promoción.

### Evaluar
Componente candidato para un dominio específico (Operational Observability, Architecture Intelligence, etc.), sin autorización de instalación. Requiere definición de necesidad, evaluación de alternativas y ADR antes de adopción.

### Estudiar
Referencia técnica o conceptual sin autorización de integración.

### Defer
Componente reconocido pero deliberadamente diferido hasta que se cumplan condiciones específicas (escala, interoperabilidad demostrada, caso de uso).

### No incorporar
Tecnología descartada por duplicidad, complejidad, licencia, riesgo o incompatibilidad arquitectónica.

### Experimental
Componente autorizado únicamente dentro de un POC aislado, sin acceso al entorno de producción ni capacidad para modificar el modelo canónico.

---

## 8. Matriz de componentes

### 8.1 Políticas y motor de reglas

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| OPA | **Adapt** — Shadow Mode integrado, promoción pendiente | Policy | Shadow Mode activo |
| Drools | No incorporar | Rules | Cerrado |

### 8.2 Ingestión de documentos

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| MarkItDown | Adoptar sujeto a validación | Document ingestion | Diseño documentado, POC requerido |
| Unstructured | Adaptar | Document ingestion | POC requerido |
| Apache Tika | Estudiar | Document ingestion | No prioritario |

### 8.3 Interoperabilidad

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| HAPI FHIR | Defer | Interoperability | Hasta que exista requisito demostrado |
| Medplum | Estudiar | Interoperability | Diferido |
| Mirth Connect | Estudiar | Legacy integration | Fuera del MVP |

### 8.4 Operational Observability

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| Grafana | **Evaluate** — Operational Observability | Visualización | Sin instalación |
| Prometheus / VictoriaMetrics | **Evaluate** — según requisitos operacionales | Métricas | Sin instalación |
| Loki | **Evaluate** — logging técnico estructurado | Logs | Sin instalación |

### 8.5 Architecture Intelligence

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| Evidence.dev | **Evaluate** — Architecture Intelligence read-only | Reporting | Sin instalación |
| DuckDB | **Evaluate** — proyección analítica embebida | Analytics | Sin instalación |

### 8.6 Lineage y provenance

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| OpenLineage | Experimental | Technical Lineage | POC |
| OpenMetadata | Estudiar | Metadata catalog | Solo si escala |
| Marquez | Estudiar | Lineage server | Alternativa |

### 8.7 Grafos y conocimiento

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| PheKnowLator | Estudiar | Biomedical KG | Referencia |
| Neo4j | Estudiar | Graph database | Sin adopción |
| Microsoft GraphRAG | Experimental | Graph reasoning | POC aislado |

### 8.8 Búsqueda y vectores

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| pgvector | Adaptar | Vector search | Preferido |
| LanceDB | Estudiar | Vector database | Solo con evidencia |

### 8.9 Analytics y reporting

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| Apache Arrow | Adaptar | Data interchange | Diseño requerido |
| Rill | **Study** — Decision Analytics | Analytics | Sin instalación |
| Apache Superset | **Defer** — solo a escala empresarial | Reporting | Sin instalación |
| Metabase | Estudiar | Reporting | No prioritario |

### 8.10 Confianza y calibración

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| scikit-learn calibration | Experimental | Confidence | Dataset requerido |
| NetCal | Estudiar | Confidence | Secundario |

### 8.11 Matching y recomendación

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| TrialGPT | Estudiar | Trial matching | Referencia principal |
| MatchMiner | Estudiar | Trial matching | Referencia |
| TrialMatchAI | Estudiar | Trial matching | Referencia |
| Gorse | Estudiar | Recommendation | No usar en MVP |

### 8.12 IAM y API

| Componente | Clasificación | Dominio | Estado |
|-----------|---------------|---------|--------|
| Keycloak | Estudiar | IAM | Revisar stack actual |
| FastAPI | **Study / conditional** — solo servicio Python especializado mediante ADR | API | **No adoptado** |

### 8.13 Componentes del assessment previo no listados en KOSRA v0.1

| Componente | Clasificación ASSESSMENT-OSS-INTEGRATION.md | Estado KOSRA | Nota |
|-----------|----------------------------------------------|--------------|------|
| OpenTelemetry | Adopt | Pendiente de decisión arquitectónica | Assessment previo lo recomienda |
| Temporal | Adopt | Evaluar cuando existan workflows que superen capacidad actual | Pendiente |
| W3C PROV | Adopt como representación | Pendiente | Estándar para provenance existente |
| OpenSpecimen | Reference + Connector | Pendiente | AGPL — solo connector |
| Stripe Connect | Integrate | Pendiente | Rail de pagos futuro |
| Apache Kafka | Monitor | Pendiente | Cuando KADARN sea multi-servicio |

---

## 9. Metric Governance

Toda métrica gobernada en KADARN debe incluir los siguientes metadatos mínimos:

| Campo | Propósito |
|-------|-----------|
| `metric_key` | Identificador único de la métrica |
| `definition` | Definición formal de qué mide |
| `subject_type` | Tipo de sujeto (institución, claim, engine, API, etc.) |
| `calculation_method` | Algoritmo o fórmula de cálculo |
| `calculation_version` | Versión del método de cálculo |
| `policy_version` | Versión de la política que rige la métrica |
| `source_reference` | Referencia a la fuente de datos canónica |
| `measured_at` | Timestamp de la medición |
| `confidence` | Nivel de confianza en la métrica |
| `owner` | Responsable de la definición y mantenimiento |

**Regla:** Los cambios en cálculo o política no deben representarse como cambios genuinos del sujeto sin interpretación consciente de la versión. Una métrica recalculada con una nueva versión no implica necesariamente que el sujeto haya cambiado.

---

## 10. Evidence and Telemetry Boundaries

### 10.1 Reglas fundamentales

* **Los logs no son provenance semántico.** Los logs operativos registran eventos del sistema. El provenance semántico registra la historia verificable de una entidad de dominio.
* **Las trazas no son evidencia institucional.** Las trazas distribuidas (tracing) pertenecen a la observabilidad operativa, no al modelo de evidencia.
* **Los dashboards no son fuentes canónicas.** Un dashboard es una proyección. La fuente de verdad es el registro canónico subyacente.
* **Las métricas pueden referenciar identificadores canónicos** pero no deben contener contenido de evidencia protegida.
* **PHI, PII, cuerpos de documentos, tokens de acceso y contenido de evidencia en bruto** no deben colocarse en logs operativos.

### 10.2 Separación de dominios

| Artefacto | Pertenece a | No es |
|-----------|-------------|-------|
| Log de aplicación | Operational Observability | Semantic Provenance |
| Traza distribuida | Operational Observability | Institutional Evidence |
| Dashboard operativo | Operational Observability | Canonical Source |
| Dashboard arquitectónico | Architecture Intelligence | Governance Record |
| Provenance Graph | Evidence Core | Technical Log |
| Evidence Node | Evidence Core | Operational Metric |
| Claim | Evidence Core | Dashboard Datapoint |

---

## 11. Límites arquitectónicos importantes

### 11.1 Loki no es el Audit Core
Loki puede almacenar y consultar logs técnicos, pero no sustituye el registro canónico de eventos de dominio.
*Referencia: ADR-014 (provenance vs audit).*

### 11.2 FHIR no es el modelo canónico completo
FHIR debe tratarse como estándar de interoperabilidad, no como sustituto del modelo institucional de KADARN.
*Referencia: ADR-004.*

### 11.3 GraphRAG no es el Knowledge Engine
GraphRAG puede proponer entidades, relaciones y comunidades. Sus resultados deberán entrar como evidencia derivada o candidatos pendientes de validación.
*Referencia: ADR-015 (Knowledge Engine).*

### 11.4 Gorse no es el Decision Engine
Un sistema de recomendación genérico no contiene políticas regulatorias, confidence semantics, readiness, restricciones institucionales, provenance ni explicaciones propias de KADARN.

### 11.5 Evidence.dev no es el Passport
Evidence.dev puede renderizar información. La semántica, permisos, versiones y contratos del Passport pertenecen a KADARN.
*Referencia: KEMS-007 (Evidence Delivery Architecture).*

### 11.6 OpenLineage no sustituye provenance
OpenLineage describe movimientos y transformaciones técnicas (technical lineage). KADARN también necesita provenance semántico y documental.
*Referencia: ADR-014 (Provenance Graph).*

### 11.7 Dashboards no son fuentes canónicas
Ningún dashboard, cuadro de mando o proyección analítica debe tratarse como fuente de verdad arquitectónica o de dominio.

### 11.8 Operational telemetry no es institutional evidence
Las señales de observabilidad operativa (latencia, errores, uso de recursos) no deben incorporarse al modelo de evidencia institucional.

---

## 12. OPA: Shadow Mode Governance

### Estado actual

OPA está integrado en **Shadow Mode** dentro de `packages/policy-engine/src/opa/`. El shadow mode ejecuta evaluación OPA en paralelo con el motor nativo de KADARN, registra decisiones y compara resultados, sin bloquear solicitudes.

### Clasificación

**Adapt** — integración existente en Shadow Mode, pendiente de decisión de promoción.

### Gate para Enforce Mode

Antes de activar OPA en modo enforce (bloqueante), deben existir:

1. **Tasa de paridad** entre motor nativo y OPA — % de decisiones coincidentes sobre un conjunto representativo
2. **Inventario de divergencias** — casos donde OPA y motor nativo discrepan
3. **Clasificación de divergencias** — esperadas (por diseño) vs. defectos
4. **Pruebas de fallback** — comportamiento del sistema cuando OPA no responde
5. **Comportamiento ante indisponibilidad** — timeouts, circuit breaker, degradación
6. **Evidencia de latencia** — impacto en p99 con OPA inline
7. **Política de versionado** — cómo se versionan y despliegan políticas Rego
8. **Rollback probado** — procedimiento verificado de desactivación

### Decisiones posibles

| Opción | Acción |
|--------|--------|
| **Enforce Mode** | OPA como PDP bloqueante en rutas seleccionadas |
| **Continuar Shadow** | Mantener shadow mode para acumular datos de paridad |
| **Retirar** | Eliminar integración OPA, mantener solo motor nativo |

Ninguna opción se ejecuta sin el gate anterior y la correspondiente decisión arquitectónica documentada.

---

## 13. Roadmap de evaluación

### 13.1 Secuencia de governance

El roadmap KOSRA sigue una secuencia de governance, no una secuencia de instalación:

```
Demostrated need → boundary definition → alternative evaluation
→ isolated POC → acceptance criteria → ADR → adopt/adapt/reject
```

Cada evaluación de componente debe pasar por esta secuencia completa antes de cualquier decisión de adopción.

### 13.2 Relación entre roadmaps

| Roadmap | Propósito | Autoridad |
|---------|-----------|-----------|
| **KOSRA Roadmap** | Governance y evolución arquitectónica | Primario |
| **OSS Integration Roadmap** | Evaluación e integración de componentes externos | Subordinado a KOSRA |

Cuando ambos se refieran a la misma tecnología, prevalece:

1. Baseline real
2. ADR vigente
3. KOSRA
4. Assessment previo (ASSESSMENT-OSS-INTEGRATION.md)

### 13.3 Fases

**Fase 0 — Baseline y validación**
*Ejecutada durante la reconciliación (KOSRA_BASELINE_RECONCILIATION_REPORT.md)*

**Fase 1 — Ingestión y políticas**
Evaluaciones candidatas siguiendo la secuencia de governance:
* MarkItDown — validación del diseño documentado
* Unstructured como fallback

**Fase 2 — Confidence calibration**
* Requiere dataset con outcomes observables
* Separación entre confidence epistemic, evidence quality y probability
* Sin dataset válido, scikit-learn y NetCal permanecen como experimentales

**Fase 3 — Knowledge extraction (GraphRAG)**
POC limitado: 10–20 protocolos, extracción de entidades, evaluación manual. Prohibición de escritura directa al grafo canónico.

**Fase 4 — Analytics y reporting**
Evaluar DuckDB, Apache Arrow, Evidence.dev siguiendo la secuencia de governance.

**Fase 5 — Matching y recomendaciones**
El motor de matching debe permanecer propio y operar sobre capacidades institucionales, requerimientos del programa, policies, evidence confidence, disponibilidad, restricciones y explicaciones.

---

## 14. Reglas para Hermes

Hermes tratará KOSRA como una referencia de evaluación, no como backlog automático.

Hermes no podrá:

* instalar un componente solo porque aparece en la matriz;
* modificar el modelo canónico para acomodar una herramienta;
* introducir una nueva base de datos sin ADR aprobado;
* enviar evidencia institucional a servicios externos;
* permitir que resultados de IA escriban directamente en el Evidence Core;
* reemplazar provenance semántico por logs técnicos;
* asumir que una licencia open source permite cualquier uso;
* ejecutar un POC sin criterios de aceptación;
* declarar un dashboard como fuente canónica;
* incorporar telemetría operativa como evidencia institucional.

Toda Work Order de evaluación deberá incluir:

* repositorio objetivo;
* versión o commit;
* licencia;
* alcance del POC;
* datos permitidos;
* aislamiento;
* criterios de aceptación;
* criterios de rechazo;
* evidencia requerida;
* rollback.

---

## 15. Relación con otros documentos

| Documento | Relación |
|-----------|----------|
| `ARCHITECTURE.md` | Arquitectura funcional de implementación. KOSRA es vista complementaria. |
| `ASSESSMENT-OSS-INTEGRATION.md` | Audit técnico detallado. Subordinado a KOSRA para governance. |
| `KOSRA_IMPLEMENTATION_MAPPING.md` | Mapa de correspondencia entre capas KOSRA y engines existentes. |
| `KOSRA_DECISION_REGISTER.md` | Registro de decisiones de clasificación y estado. |
| `KOSRA_V02_VALIDATION_REPORT.md` | Reporte de validación de esta reestructuración. |
| KEMS-001 a KEMS-007 | Modelo de evidencia canónico. KOSRA referencia, no redefine. |
| ADR-001 a ADR-034 | Decisiones arquitectónicas existentes. KOSRA referencia, no duplica. |
| ADR-035 | KOSRA como canonical architectural view. |
| ADR-036 | OPA Shadow-to-Enforce Governance. |
| ADR-037 | Functional Engines and Intelligence Layers Mapping. |
| PB-2.7 | Capability Intelligence — modelo canónico de capacidades. |

---

## 16. Criterio de éxito

KOSRA será exitosa si permite acelerar KADARN sin:

* diluir su modelo de dominio;
* duplicar capacidades existentes;
* aumentar innecesariamente la superficie operativa;
* crear dependencias irreversibles;
* comprometer la trazabilidad;
* convertir experimentos en arquitectura canónica;
* retrasar el Institution-first Readiness MVP;
* confundir planos transversales con capas de dominio;
* tratar proyecciones analíticas como fuentes de verdad.

La regla final es:

> Adoptar infraestructura abierta donde exista una solución madura. Mantener propia la semántica que convierte evidencia institucional en inteligencia de capacidades y decisiones explicables.

---

*Este documento es KOSRA v0.2, establecido como vista arquitectónica de transformación de valor. Ver `KOSRA_IMPLEMENTATION_MAPPING.md` para el mapa de correspondencia con la implementación y `KOSRA_V02_VALIDATION_REPORT.md` para el reporte de validación.*
