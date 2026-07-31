# KOSRA Materialization Report

**Versión:** 0.2
**Estado:** COMPLETE — Phase A (restructuring)
**Fecha:** 2026-07-27
**Precedido por:** KOSRA_BASELINE_RECONCILIATION_REPORT.md (B)
**Work Order:** WO-KOSRA-002 — KOSRA v0.2 Controlled Restructuring
**Gate:** Revisión humana antes de cualquier POC, enforce-mode, adopción de dependencia o LOOP de implementación.

---

## 0. Propósito

Restructurar la materialización existente de KOSRA para distinguir formalmente Operational Observability, Architecture Intelligence e Institutional Intelligence como dominios separados, preservando todos los hallazgos validados del baseline y las decisiones arquitectónicas existentes.

Modo: MATERIALIZE + VALIDATE. Exclusivamente documental y de governance.

---

## 1. Baseline utilizado

| Propiedad | Valor |
|-----------|-------|
| Repositorio canónico | `D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform` |
| HEAD commit | `9c7684816f2b6e28cb691c29188a86096178c3e3` |
| Rama | `fix/gov-004-security-remediation` |
| Working tree | Modified pre-existing: `apps/web/package.json`, `package-lock.json`, `package.json`, `package.json` |
| Untracked pre-existing | `.hermes/`, `WO-OPS-001A-REPORT.md`, migraciones 075/076, scripts, foundation docx |

**Nota:** El working tree contenía modificaciones pre-existentes no relacionadas con KOSRA. Ninguna fue modificada.

---

## 2. Archivos modificados

| Archivo | Acción | Tamaño (KB) | Cambios principales |
|---------|--------|-------------|---------------------|
| `KOSRA.md` | Reescrito | 35.0 → v0.2 | §§3 (tres dominios), 0 (múltiples vistas), 7 (nuevas clasificaciones), 9 (metric governance), 10 (telemetry boundaries), 13 (roadmap governance) |
| `KOSRA_IMPLEMENTATION_MAPPING.md` | Reescrito | 12.4 → v0.2 | §§3 (planos transversales), 6 (Capability Heat Map), 7 (Build vs Adopt Matrix) |
| `KOSRA_DECISION_REGISTER.md` | Reescrito | 13.6 → v0.2 | +35 decisiones nuevas (D-056 a D-089), nuevas clasificaciones Evaluate/Defer, nuevos dominios |
| `KOSRA_MATERIALIZATION_REPORT.md` | Reescrito | 6.1 → v0.2 | Reporte actual de WO-KOSRA-002 |

Archivos existentes del repositorio canónico modificados: **0**.

---

## 3. Cambios sección por sección — KOSRA.md

### §0 — Relación con la arquitectura existente
- **Añadido:** Múltiples vistas arquitectónicas (Functional Engines, Intelligence Layers, Runtime and Observability, Analytical and Reporting)
- **Preservado:** Relación con documentos canónicos

### §1 — Propósito
- Sin cambios sustanciales

### §2 — Identidad arquitectónica
- **Añadido:** Planos transversales (Operational Observability y Architecture Intelligence)
- **Añadido:** Institutional Intelligence como resultado de negocio combinado
- **Añadidos:** Conceptos requeridos de Institutional Intelligence (8 conceptos)
- **Añadido:** Diagrama de relación entre los tres dominios
- **Preservado:** Flujo canónico de producto, flujo conceptual, "lo que KADARN no es"

### §3 — Principios arquitectónicos (renumerado de §3 a §4 en v0.1 → §4 en v0.2)
- **Nota:** En v0.2, los principios se mueven a §4 para acomodar los nuevos dominios en §3
- **Añadido:** §4.9 Metric governance

### §4 → §5 — Propiedad intelectual (renumerado)
- **Añadido:** §5.6 Institutional Intelligence
- **Preservados:** Canonical Entity Model, Evidence Core, Confidence Graph, Capability Intelligence, Decision Intelligence

### §5 → §6 — Baseline implementado
- Sin cambios

### §6 → §7 — Clasificación de decisiones
- **Añadidas:** Dos nuevas categorías: **Evaluate** (candidato sin instalación) y **Defer** (diferido hasta condiciones)
- **Preservadas:** Adoptar, Adaptar, Estudiar, No incorporar, Experimental

### §7 → §8 — Matriz de componentes
- **Reestructurada:** Componentes agrupados por dominio funcional (13 sub-secciones)
- **Actualizadas clasificaciones:** OPA → Adapt, Evidence.dev → Evaluate, Grafana → Evaluate, Loki → Evaluate, DuckDB → Evaluate, Rill → Study, Apache Superset → Defer, HAPI FHIR → Defer
- **Añadidos:** Componentes de Operational Observability, Architecture Intelligence

### §8 → §9 — Metric Governance (nueva)
- **Añadido:** Metadatos mínimos para métricas gobernadas (10 campos)
- **Añadido:** Regla de interpretación de versiones

### §9 → §10 — Evidence and Telemetry Boundaries (nueva)
- **Añadidas:** 5 reglas fundamentales (logs ≠ provenance, traces ≠ evidence, dashboards ≠ canonical, etc.)
- **Añadida:** Tabla de separación de dominios

### §9 → §11 — Límites arquitectónicos (renumerado)
- **Añadidos:** §11.7 (dashboards no son fuentes canónicas), §11.8 (telemetría operativa no es evidencia institucional)
- **Preservados:** Límites existentes (Loki, FHIR, GraphRAG, Gorse, Evidence.dev, OpenLineage)

### §10 → §12 — OPA Governance
- Sin cambios sustanciales

### §11 → §13 — Roadmap
- **Reestructurado:** Secuencia de governance: Demonstrated need → boundary definition → alternative evaluation → isolated POC → acceptance criteria → ADR → adopt/adapt/reject
- **Preservada:** Relación entre roadmaps, prevalencia, fases

### §12 → §14 — Reglas para Hermes
- **Añadidas:** Dos reglas nuevas (no declarar dashboard como fuente canónica, no incorporar telemetría operativa como evidencia institucional)

### §13 → §15 — Relación con otros documentos
- **Añadido:** KOSRA_V02_VALIDATION_REPORT.md

### §14 → §16 — Criterio de éxito
- **Añadidos:** Dos criterios nuevos (no confundir planos transversales con capas de dominio, no tratar proyecciones analíticas como fuentes de verdad)

---

## 4. Claims añadidos

| Claim | Ubicación |
|-------|-----------|
| Operational Observability como plano transversal | KOSRA.md §3.1, §3.3 |
| Architecture Intelligence como plano transversal | KOSRA.md §3.2, §3.3 |
| Institutional Intelligence como resultado de negocio | KOSRA.md §3.3 |
| Múltiples vistas arquitectónicas | KOSRA.md §0 |
| Metric governance con 10 campos | KOSRA.md §9 |
| 5 reglas de boundaries telemetría/evidencia | KOSRA.md §10 |
| Capability Heat Map | KOSRA_IMPLEMENTATION_MAPPING.md §6 |
| Build vs Adopt Matrix | KOSRA_IMPLEMENTATION_MAPPING.md §7 |

## 5. Claims re-clasificados

| Componente | De | A | Razón |
|-----------|----|----|-------|
| OPA | Experimental | Adapt | Shadow Mode integrado |
| Evidence.dev | Experimental | Evaluate | Nuevo dominio Architecture Intelligence |
| DuckDB | Experimental | Evaluate | Nuevo dominio Architecture Intelligence |
| Loki | Adaptar | Evaluate | No está instalado; reclasificado |
| HAPI FHIR | Adaptar | Defer | Sin requisito de interoperabilidad demostrado |
| Grafana | (no listado) | Evaluate | Nuevo dominio Operational Observability |
| Prometheus/VictoriaMetrics | (no listado) | Evaluate | Operational Observability |
| Rill | (no listado) | Study | Decision Analytics |
| Apache Superset | (no listado) | Defer | Solo escala enterprise |

## 6. Claims retirados

| Claim v0.1 | Razón |
|-----------|--------|
| "Grafana Loki: Adaptar — Logs operativos y técnicos" | Loki no está instalado. Reclasificado a Evaluate. |
| "DuckDB: Experimental — Analytics embebido" | DuckDB no está instalado. Reclasificado a Evaluate. |
| "Evidence.dev: Experimental — Dossiers y reporting como código" | Reclasificado a Evaluate para Architecture Intelligence. |

## 7. Conflictos no resueltos

| Conflicto | Estado |
|-----------|--------|
| ADR-005 lexicón superseded pero sin reemplazo formal | Pendiente — los términos nuevos se agregan vía mecanismo vigente |
| KEMS-001 dos versiones divergentes (docs/kems/ vs vendor/kems/) | Pendiente — reportado en AF-2.1 |
| ASSESSMENT-OSS-INTEGRATION.md clasificaciones divergentes | Resuelto vía regla de prevalencia (D-049) |
| OpenTelemetry recomendado por assessment pero no evaluado por KOSRA | Pendiente de decisión arquitectónica |

---

## 8. Validación

| Requisito WO-KOSRA-002 | Resultado |
|------------------------|-----------|
| Todas las secciones requeridas son sustanciales | ✅ 16 secciones, todas con contenido sustantivo |
| Todo claim de estado de implementación incluye referencia a repo | ✅ Referencias a packages, ADRs, documentos |
| Herramientas planificadas no descritas como instaladas | ✅ Evaluate/Defer/Study — ninguna como instalada |
| Dashboards no definidos como fuentes canónicas | ✅ §10.1 rule #3, §11.7, D-085 |
| Telemetría operativa separada de provenance semántico | ✅ §10 completa, D-083, D-084 |
| Decision Intelligence no sobrestimada | ✅ §2 Mapa, D-027, D-053 |
| Sin numeración duplicada de ADRs | ✅ ADRs propuestos 035-037 no existen |
| Ningún ADR existente silenciosamente superseded | ✅ Ningún ADR existente modificado o declarado obsoleto |
| Baseline del repo registrado | ✅ Commit 9c76848, rama fix/gov-004 |
| Working-tree status divulgado | ✅ §1 de este reporte |
| Todos los writes dentro del directorio autorizado | ✅ `foundation/05_ENGINEERING/architecture/` |

---

## 9. Próximos pasos

1. **Revisión humana** de KOSRA v0.2 y documentos asociados
2. Si aprobado: considerar creación de ADR-035, ADR-036, ADR-037
3. No iniciar Fase C (evaluaciones individuales) sin aprobación
4. No activar OPA Enforce Mode sin gate completo
5. No instalar Grafana, Evidence.dev, Loki, Prometheus, DuckDB, Rill o Superset

---

*Fin del reporte de materialización v0.2. 4 archivos modificados (solo KOSRA docs). 0 archivos del repositorio canónico modificados. Modo: MATERIALIZE + VALIDATE.*
