# Phase 0 Execution Backlog — Kadarn Master Work Plan v2.0

> **Regla de arquitectura:** Ningún cambio de código podrá introducir terminología o conceptos incompatibles con KEMS-001 o con un ADR ratificado.
>
> **Flujo de trabajo:** Un artefacto por vez. Secuencial. Sin mezclar documentación con implementación.

## Backlog

| ID | Artefacto | Prioridad | Depende de | Impacto | Reutilización | Criterio de aceptación | Riesgo si no se completa | Bloquea |
|----|-----------|-----------|------------|---------|---------------|------------------------|--------------------------|---------|
| P0-001 | **Architecture Freeze Checklist** | P0 | — | Gobernanza | Nuevo | `openspec/architecture-freeze-checklist.md` — checklist aprobado con PASS/FAIL, evidencia, bloqueos, y gate rules. Todos los items de Phase 0 listados. | No hay visibilidad del progreso de Phase 0. Los artifacts se producen sin marco. | Toda Phase 0 |
| P0-002 | **Ratificación KEMS-001 v1.0** | P0 | P0-001 | Documentación | Ya escrito (KEMS-001.md) | Documento ratificado formalmente por architecture lead. Linkeado desde KRM-RAO §3.14. Todos sus términos reflejados en Lexicon v1.2. | El fundamento epistemológico de Kadarn no está formalmente adoptado. Cualquier ADR posterior se apoya en terreno no firme. | ADR-010, ADR-011, ADR-012, Claim Taxonomy, Lexicon, KRM-RAO, KRM-BNO |
| P0-003 | **ADR-010: Trust Engine retirement → Confidence Engine** | P0 | P0-002 | Arquitectura | Nuevo (reemplaza ADR-011 actual) | Trust Score retirado formalmente. Trust Level Gold/Silver/Bronze retirado. Trust Engine renombrado a Confidence Engine. Todos los términos del Retired Terms Registry (KEMS §10, WP §Retired Terms) declarados obsoletos en la jerarquía documental. | El código y la documentación siguen usando terminología Trust que KEMS declara retirada. El equipo nuevo aprenderá el modelo viejo. | Lexicon v1.2 (términos bloqueados), KRM-RAO v2.0, KRM-BNO v1.2, Sprint 17 |
| P0-004 | **ADR-011: Evidence Core boundary rule** | P0 | P0-003 | Arquitectura | Nuevo (el ADR-011 actual es Trust Engine, será reemplazado) | Five-condition test definido y codificable como CI check. Límite claro entre lo que pertenece al Evidence Core vs. los Engines. Process state vs. semantic truth distinction documentada. | No hay regla para decidir qué va en el Evidence Core y qué en un Engine. El modelo de datos de Evidence Nodes crece sin gobierno. | ADR-012, KRM-RAO v2.0, Evidence Core build (Phase 1) |
| P0-005 | **ADR-012: Engine governance (Core / Certified / Private)** | P0 | P0-004 | Arquitectura | Nuevo | Core Engines para v1 enumerados. Certified y Private diferidos a Year 2 explícitamente. Ningún Engine fuera de la lista v1 se diseña sin enmendar este ADR. | Cualquier equipo puede construir un "Engine" sin pasar por governance. La arquitectura se descentraliza sin control. | KRM-RAO v2.0, Phase 3/4 engine roadmap |
| P0-006 | **Lexicon v1.2** | P0 | P0-003, P0-004, P0-005 | Documentación | Actualizar (v1.1 existe) | Todos los términos de KEMS-001 agregados. Todos los términos retirados (Trust Score, Trust Engine, Trust Graph, Trust Fabric, Verified, Certification) removidos. Changelog actualizado. CI terminology lint pasa contra todos los documentos de arquitectura. | La documentación dice "Trust Score", KEMS dice "Confidence State". Ingeniería escribe código con un vocabulario, arquitectura escribe docs con otro. Deriva terminológica asegurada. | KRM-RAO v2.0, KRM-BNO v1.2, toda la documentación downstream, CI lint pipeline |
| P0-007 | **Claim Taxonomy v1.0** | P0 | P0-002 (KEMS) | Modelo de dominio | Nuevo | Mínimo 12 Claims para el dominio Biospecimen. Cada Claim tiene: nombre, descripción, Evidence Classes relevantes (A-F), natural decay rate, ejemplos de Evidence Nodes. Ningún Claim es una label de reputación. | No hay un vocabulario estándar de capacidades institucionales. El Confidence Graph no puede poblarse si no hay Claims que instanciar. | Phase 1 Milestone 1 (Evidence Model), Phase 2 Onboarding, Phase 3 Sponsor Intelligence |
| P0-008 | **KRM-RAO v2.0** | P0 | P0-003, P0-004, P0-005, P0-006 | Arquitectura | Actualizar (v1.0 existe, requiere refactor) | Evidence Core como capa explícita. Evidence Twin agregado al modelo de Operational Twins. Lista de Engines reestructurada (Core vs. pending). §3.14 Evidence Core Boundary Rule. Sin referencia a Trust Engine sin cita a ADR-010. Todos los eventos Evidence en PascalCase. | KRM-RAO v1.0 es el reference model vigente pero expresa el paradigma Trust. Cualquier equipo que lo lea recibe el modelo equivocado. | KRM-BNO v1.2, toda decisión arquitectónica que referencie KRM-RAO |
| P0-009 | **KRM-BNO v1.2** | P0 | P0-008 | Arquitectura | Actualizar (v1.1 existe) | Competitive boundary §4.10 agregado. Evidence Source Map para biospecímenes §4.11 agregado. Framing actualizado por KEMS-001. Ninguna afirmación de que Kadarn compite con Slope, SiteVault o Florence en su terreno primario. Evidence Class C source es Vilo OS, explicitado. | KRM-BNO perfila el dominio BNO pero con terminología obsoleta. El modelo de referencia para specimens no está alineado con KEMS. | Phase 1 Evidence Model (específicamente modelo de datos de specimens) |
| P0-010 | **Competitive Boundary doc** | P0 | — | Estrategia | Nuevo | Mapa de competidores verificado: Inato, Veeva, Slope, Florence, CRIO, IQVIA (partial). Cada celda verificada con fuente o marcada "unverifed — pending". IQVIA Site Intelligence abierto — marcado explícitamente. | Kadarn no tiene una posición competitiva documentada. Decisiones de producto se toman sin marco competitivo. Riesgo de construir en dirección equivocada. | Phase 3 Go-To-Market, positioning docs |
| P0-011 | **Architecture Validation Audit** | P0.5 | P0-001 al P0-010 | Gobernanza | Nuevo | Auditoría formal con 4 preguntas (Q1 contradicción, Q2 vocabulario retirado, Q3 duplicación, Q4 dependencia circular) aplicada a cada par de documentos. Matriz de auditoría completa. Resultado binario: PASS / FAIL. | Phase 0 produce artifacts que pueden ser inconsistentes entre sí. El Architecture Freeze Certificate no se apoya en datos objetivos. | Architecture Freeze Certificate |
| P0-012 | **Architecture Freeze Certificate** | Gate | P0-011 | Gobernanza | Nuevo | Certificate firmado por architecture lead. Fecha. Resultado PASS. Si FAIL, lista de blockers adjunta. Sin este certificado, Sprint 17 no comienza (por definición del WP §0.5). | Sprint 17 arranca sin que Phase 0 esté cerrada. Se construye código sobre fundamentos no congelados. Garantía de inconsistency futura. | **Sprint 17** — toda Phase 1 |

## Resumen de reutilización por artefacto

| Categoría | % | Componentes |
|-----------|---|-------------|
| Reutilizable directamente | ~45% | provenance-graph (traversal), provenace (append-only), operational-twins (Class C source), policy-engine, domain-events, knowledge-engine, intelligence-engine, migrations no-trust, tests de infraestructura |
| Reutilizable con cambios | ~30% | continuity-claim-service, continuity migrations, graph-query, lexicon v1.1, KRM-RAO v1.0, KRM-BNO v1.1, manifesto v1.0 |
| Reescritura necesaria | ~15% | Evidence Core (Claims + EvidenceNodes + Relationship model), Confidence State computation, Claim Taxonomy |
| Obsoleto — migrar | ~10% | trust-engine package (algoritmos de decay/weighting reusable, rename + refactor), trust migration 023, trust route, trust tests |

## Mapa de dependencias (grafo simplificado)

```
P0-001 Checklist
 └── P0-002 KEMS Ratificación
      ├── P0-003 ADR-010 (Trust retirement)
      │    └── P0-006 Lexicon v1.2
      │         └── P0-008 KRM-RAO v2.0
      │              └── P0-009 KRM-BNO v1.2
      ├── P0-004 ADR-011 (Evidence Core boundary)
      │    └── P0-005 ADR-012 (Engine governance)
      └── P0-007 Claim Taxonomy
           └── [Phase 1 — Milestone 1]
P0-010 Competitive Boundary (independiente)
P0-011 Validation Audit ← todos los anteriores
P0-012 Freeze Certificate ← P0-011
     └── Sprint 17
```

## Reglas de ejecución

1. **Un artifact por vez.** No abrir dos ADRs simultáneamente.
2. **No mezclar documentación con implementación.** Track A (architecture) completa su artifact antes de que Track B (engineering) toque código relacionado.
3. **Cada artifact completado actualiza el backlog.** No avanzar al siguiente sin marcar el anterior como "Done".
4. **Criterios de aceptación binarios.** Cada artifact pasa o no pasa. No hay "casi listo".
5. **Regla de arquitectura vigente desde ahora:** Ningún cambio de código podrá introducir terminología o conceptos incompatibles con KEMS-001 o con un ADR ratificado.

## Estado actual

| Item | Status |
|------|--------|
| KEMS-001 v1.0 | ✅ Escrito — pendiente ratificación formal |
| Manifesto v1.0 | Existe — requiere §2.8, §2.9, §2.10 |
| Lexicon v1.1 | Existe — requiere actualización |
| KRM-RAO v1.0 | Existe — requiere refactor |
| KRM-BNO v1.1 | Existe — requiere actualización |
| Trust Engine (código) | Existe — pendiente de migración |
| Evidence Core (código) | **No existe** — debe construirse en Phase 1 |
| Claim Taxonomy | **No existe** — debe crearse en Phase 0 |
| Competitive Boundary | **No existe** — debe crearse en Phase 0 |
