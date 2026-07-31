# KOSRA Decision Register

**Versión:** 0.2
**Estado:** Canonical
**Propósito:** Registro de todas las decisiones de clasificación, estado y resolución derivadas de KOSRA.
**Actualizado:** 2026-07-27

---

## 1. Decisiones de identidad

| ID | Decisión | Resolución | Fuente |
|----|----------|-----------|--------|
| D-001 | Identidad canónica de KADARN | "Institutional Capability Intelligence Platform" — transforma evidencia institucional en inteligencia explicable de capacidades, readiness y decisiones. KADARN sigue siendo plataforma operativa para biospecímenes, IVD y datos clínicos como dominio inicial. | Vilo (Jul 27) |
| D-002 | KOSRA como documento | Vista arquitectónica de transformación de valor. No reemplaza la arquitectura funcional por engines (ARCHITECTURE.md, ADR-012). Ambas coexisten mediante mapa de correspondencia. | Vilo (Jul 27) |
| D-056 | Múltiples vistas arquitectónicas | KADARN se describe mediante cuatro vistas complementarias: Functional Engines, Intelligence Layers, Runtime and Observability, Analytical and Reporting. Ninguna invalida a las otras. | WO-KOSRA-002 |
| D-057 | Tres dominios de inteligencia | Operational Observability (salud runtime), Architecture Intelligence (proyección arquitectónica), Institutional Intelligence (resultado de negocio combinado). Los dos primeros son planos transversales. El tercero es resultado combinado de Evidence + Capability + Decision Intelligence. | WO-KOSRA-002 |

---

## 2. Decisiones de clasificación de componentes

| ID | Componente | Clasificación anterior (KOSRA v0.1) | Clasificación actual | Estado | Justificación |
|----|-----------|--------------------------------------|----------------------|--------|---------------|
| D-003 | **OPA** | Experimental / POC prioritario | **Adapt** — Shadow Mode integrado, pendiente decisión de promoción | **Shadow Mode activo** | Baseline demostró integración existente en `packages/policy-engine/src/opa/` con client, shadow mode runner, local evaluator y policies predefinidas. |
| D-004 | **FastAPI** | Adaptar | **Study / conditional** — solo servicio Python especializado mediante ADR | **No adoptado** | Sin caso de uso actual demostrado. |
| D-005 | **MarkItDown** | Adoptar sujeto a validación | **Adoptar sujeto a validación** — diseño documentado | Diseño en `docs/engineering/` | Sin cambios. POC requerido. |
| D-006 | **Neo4j** | Estudiar | Estudiar | Sin adopción | Sin cambios. |
| D-007 | **GraphRAG** | Experimental | Experimental | POC aislado | Sin cambios. |
| D-008 | **Drools** | No incorporar | No incorporar | Cerrado | Sin cambios. |
| D-009 | **OpenTelemetry** | No listado | **Adopt pendiente** — assessment previo recomienda Adopt | Pendiente | Pendiente de decisión arquitectónica. |
| D-010 | **Temporal** | No listado | **Monitor** — assessment previo recomienda Adopt | Evaluar cuando exista necesidad | Pendiente. |
| D-011 | **W3C PROV** | No listado | **Adopt como representación** | Pendiente | Para provenance existente. |
| D-012 | **OpenSpecimen** | No listado | **Reference + Connector** | Pendiente | AGPL — solo connector. |
| D-013 | **Stripe Connect** | No listado | **Integrate** | Pendiente | Rail de pagos futuro. |
| D-014 | **Apache Kafka** | No listado | **Monitor** | Pendiente | Cuando KADARN sea multi-servicio. |
| D-058 | **Evidence.dev** | Experimental | **Evaluate** — Architecture Intelligence read-only | Sin instalación | Nuevo dominio: Architecture Intelligence. No es herramienta de reporting general. |
| D-059 | **Grafana** | No listado | **Evaluate** — Operational Observability | Sin instalación | Nuevo dominio: Operational Observability. |
| D-060 | **Prometheus / VictoriaMetrics** | No listado | **Evaluate** — según requisitos operacionales | Sin instalación | Evaluación basada en necesidades operativas. |
| D-061 | **Loki** | Adaptar | **Evaluate** — logging técnico estructurado | Sin instalación | Reclasificado de Adaptar a Evaluate. No está instalado. No sustituye audit ledger. |
| D-062 | **DuckDB** | Experimental | **Evaluate** — proyección analítica embebida | Sin instalación | Reclasificado de Experimental a Evaluate. Nuevo dominio: Architecture Intelligence. |
| D-063 | **Rill** | No listado | **Study** — Decision Analytics | Sin instalación | Nuevo componente. Solo estudio. |
| D-064 | **Apache Superset** | No listado | **Defer** — solo a escala empresarial | Sin instalación | Diferido hasta que exista necesidad de escala enterprise. |
| D-065 | **HAPI FHIR** | Adaptar | **Defer** — hasta requisito de interoperabilidad demostrado | Sin instalación | Reclasificado de Adaptar a Defer. |

---

## 3. Decisiones sobre el baseline implementado

| ID | Decisión | Resolución | Evidencia |
|----|----------|-----------|-----------|
| D-015 | Evidence Core | **Reconocido como implementado** — no reconstruir | `packages/evidence-core/` (8,156+ LOC, 29 archivos), ADR-011 |
| D-016 | Provenance Graph | **Reconocido como implementado** — no reconstruir | `packages/provenance-graph/` + `packages/provenance/` |
| D-017 | Knowledge Engine | **Reconocido como implementado** — no reconstruir | `packages/knowledge-engine/` (348 LOC) |
| D-018 | Readiness Engine | **Reconocido como implementado** — no reconstruir | `packages/readiness-engine/` (1,500+ LOC, pipeline completo) |
| D-019 | Capability Model | **Reconocido como canónico** — no reconstruir | PB-2.7 (Capability Intelligence) |
| D-020 | Confidence Pipeline | **Reconocido como implementado** — no reconstruir | readiness-engine evaluators + projectConfidence() |
| D-021 | MarkItDown Design | **Reconocido como documentado** — POC pendiente | `docs/engineering/markitdown-document-pipeline.md` |
| D-022 | Policy Engine | **Reconocido como implementado** — no reconstruir | `packages/policy-engine/` (530 LOC), ADR-010 |

---

## 4. Decisiones de madurez

| ID | Capa | Estado real | Clasificación KOSRA |
|----|------|-------------|---------------------|
| D-023 | Data Fabric | ✅ Implementado | Persistencia completa. Sin ingestion pipeline automatizado. |
| D-024 | Evidence Core | ✅ Implementado | ADR-011, evidence-core package, KEMS-001/004. |
| D-025 | Evidence Intelligence | ✅ Sustancialmente implementado | Readiness Engine, Knowledge Engine, Policy Engine + OPA Shadow. Confidence Engine no es Core Engine. |
| D-026 | Capability Intelligence | ⚠️ Parcial | PB-2.7 canónico. Capability Graph no implementado. Institutional Knowledge no verificado. |
| D-027 | Decision Intelligence | ❌ Incompleto | Matching Engine: stub (25 LOC). Recommendation Engine: no demostrado. Gap Intelligence: parcial. Forecasting/Scenario: no demostrado. |
| D-028 | Applications | ✅ Parcial | Delivery domain, published views, API routes, UX docs. |
| D-066 | Operational Observability | 🔴 No implementado | Sin herramientas instaladas. Dominio nuevo. |
| D-067 | Architecture Intelligence | 🔴 No implementado | Sin herramientas instaladas. Dominio nuevo. |
| D-068 | Institutional Intelligence | 🟡 Conceptual | Resultado combinado de tres capas existentes. Conceptos definidos pero no implementados como métricas gobernadas. |

---

## 5. Decisiones sobre ADRs

| ID | Decisión | Resolución |
|----|----------|-----------|
| D-029 | Numeración ADR KOSRA | Usar próxima disponible del registro real (035+. Verificar drafts 027-033). |
| D-030 | ADR-035 necesario | **Sí** — KOSRA Governance and Scope (establece KOSRA como vista canónica, resuelve relación con documentos existentes). |
| D-031 | ADR-036 necesario | **Sí** — OPA Shadow-to-Enforce Governance (gate, condiciones, decisión). |
| D-032 | ADR-037 necesario | **Sí** — Functional Engines and Intelligence Layers Mapping (correspondencia formal entre vistas). |
| D-033 | ADR-038 (Document Ingestion) | **No** — cubierto por ADR-035 + KOSRA matriz. Crear solo si POC revela decisión vinculante. |
| D-034 | ADR-039 (Technical Lineage vs Semantic Provenance) | **No** — cubierto por ADR-014 existente + KOSRA §11.6. |
| D-035 | ADR-040 (Confidence Calibration) | **No** — diferir hasta que exista dataset con outcomes observables. |
| D-036 | ADR-041 (Graph Store Threshold) | **No** — cubierto por clasificación "Estudiar". Crear solo si se decide adoptar. |
| D-037 | ADR-042 (Reporting != Source of Truth) | **No** — cubierto por ADR-004 + KOSRA §11.7. |

---

## 6. Decisiones sobre el lexicón

| ID | Término KOSRA | Acción | Mecanismo |
|----|--------------|--------|-----------|
| D-038 | Evidence Intelligence | Agregar al lexicón activo | ADR-005 está superseded por KEMS-001/002/003 + AF-2.x. Los términos nuevos se agregan al léxico activo vía el mecanismo vigente. |
| D-039 | Capability Intelligence | Agregar al lexicón activo | Ya existe en PB-2.7. Formalizar. |
| D-040 | Decision Intelligence | Agregar al lexicón activo | Nuevo término KOSRA. |
| D-041 | Institutional Capability Intelligence | Agregar al lexicón activo | Identidad canónica de KADARN. |
| D-042 | Evidence Asset | Agregar al lexicón activo | Concepto KOSRA. |
| D-043 | Confidence Projection | Agregar al lexicón activo | Ya implementado en readiness-engine. |
| D-044 | Semantic Provenance | Agregar al lexicón activo | Distinguir de Technical Lineage. |
| D-045 | Technical Lineage | Agregar al lexicón activo | OpenLineage. |
| D-046 | Shadow Mode | Agregar al lexicón activo | OPA evaluation mode. |
| D-047 | Enforce Mode | Agregar al lexicón activo | OPA evaluation mode. |
| D-069 | Operational Observability | Agregar al lexicón activo | Nuevo dominio transversal KOSRA v0.2. |
| D-070 | Architecture Intelligence | Agregar al lexicón activo | Nuevo dominio transversal KOSRA v0.2. |
| D-071 | Institutional Intelligence | Agregar al lexicón activo | Resultado de negocio combinado KOSRA v0.2. |
| D-072 | Evidence Freshness | Agregar al lexicón activo | Concepto Institutional Intelligence. |
| D-073 | Provenance Coverage | Agregar al lexicón activo | Concepto Institutional Intelligence. |
| D-074 | Capability Maturity | Agregar al lexicón activo | Concepto Institutional Intelligence. |
| D-075 | Confidence Drift | Agregar al lexicón activo | Concepto Institutional Intelligence. |
| D-076 | Readiness Evolution | Agregar al lexicón activo | Concepto Institutional Intelligence. |
| D-077 | Gap Closure | Agregar al lexicón activo | Concepto Institutional Intelligence. |
| D-078 | Operational Demonstration | Agregar al lexicón activo | Concepto Institutional Intelligence. |
| D-079 | Historical Reliability | Agregar al lexicón activo | Concepto Institutional Intelligence. |

**Nota:** Ningún término funcional existente (Discovery, Feasibility, Program, etc.) debe reemplazarse. Los términos KOSRA operan en un nivel de abstracción superior.

---

## 7. Decisiones sobre roadmaps

| ID | Decisión | Resolución |
|----|----------|-----------|
| D-048 | Relación entre roadmaps | KOSRA Roadmap = governance y evolución arquitectónica. OSS Integration Roadmap = evaluación e integración de componentes externos. El segundo subordinado al primero. |
| D-049 | Prevalencia en caso de conflicto | 1) Baseline real, 2) ADR vigente, 3) KOSRA, 4) Assessment previo. |
| D-080 | Secuencia de governance | Toda evaluación sigue: Demonstrated need → boundary definition → alternative evaluation → isolated POC → acceptance criteria → ADR → adopt/adapt/reject. No secuencia de instalación. |

---

## 8. Decisiones sobre métricas y telemetría

| ID | Decisión | Resolución |
|----|----------|-----------|
| D-081 | Metric governance | Toda métrica gobernada debe incluir: metric_key, definition, subject_type, calculation_method, calculation_version, policy_version, source_reference, measured_at, confidence, owner. |
| D-082 | Cambios de cálculo vs cambios del sujeto | Los cambios en cálculo o política no deben representarse como cambios genuinos del sujeto sin interpretación consciente de la versión. |
| D-083 | Logs no son provenance | Logs operativos ≠ semantic provenance. |
| D-084 | Trazas no son evidencia institucional | Trazas distribuidas pertenecen a observabilidad operativa, no al modelo de evidencia. |
| D-085 | Dashboards no son fuentes canónicas | Ningún dashboard debe tratarse como fuente de verdad arquitectónica o de dominio. |
| D-086 | PHI/PII fuera de logs | PHI, PII, cuerpos de documentos, tokens de acceso y contenido de evidencia en bruto no deben colocarse en logs operativos. |

---

## 9. Prohibiciones activas

| ID | Prohibición | Vigente desde |
|----|------------|---------------|
| D-050 | OPA Enforce Mode no activado | Jul 27 — hasta cumplir gate KOSRA §12 |
| D-051 | FastAPI no introducido | Jul 27 — hasta ADR que demuestre caso de uso |
| D-052 | No reconstruir engines existentes | Jul 27 — perpetuo |
| D-053 | No declarar Decision Intelligence completa | Jul 27 — perpetuo |
| D-054 | No duplicar ADRs existentes | Jul 27 — perpetuo |
| D-055 | No modificar Project History Registry | Jul 27 — salvo autorización separada |
| D-087 | No instalar Grafana, Evidence.dev, Loki, Prometheus, DuckDB, Rill o Superset | Jul 27 — sin evaluación y ADR |
| D-088 | No declarar dashboards como fuentes canónicas | Jul 27 — perpetuo |
| D-089 | No incorporar telemetría operativa como evidencia institucional | Jul 27 — perpetuo |

---

*Este registro se actualiza con cada decisión arquitectónica derivada de KOSRA. Versión 0.2 — incorpora tres dominios de inteligencia, metric governance, y boundaries de telemetría.*
