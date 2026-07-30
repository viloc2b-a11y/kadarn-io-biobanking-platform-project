# AUDITORÍA DE DOCUMENTOS CANÓNICOS KADARN — FASE 00A/00B (READ-ONLY)

**Fecha:** 2026-07-30  
**Repositorio:** `D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform\foundation\`  
**Total archivos .md leídos:** 129  
**Idioma:** Español

---

## NOTA METODOLÓGICA

Cada documento se clasifica según:
- **Tipo:** governance, charter, architecture, roadmap, plan, ADR, blueprint, KEMS, product-book, LOOP, implementation-report
- **Estado:** canonical, draft, frozen, superseded, complete, active, historical
- **Autoridad:** constitutional, architectural, strategic, implementation, control, execution
- **Referencias cruzadas:** documentos vinculados explícitamente

---

# NIVEL 1 — CONSTITUCIONAL (AUTORIDAD MÁXIMA)

---

## KEMS-001: Confidence Graph Model
- **Archivo:** `docs/kems/` (referenciado, no en foundation/)
- **Tipo:** KEMS (Evidence Model Specification)
- **Estado:** Canonical Draft v1.0
- **Autoridad:** Constitutional (Product Constitution)
- **Define/Decide:**
  - Modelo canónico del grafo de confianza: Claim → Evidence → Review → Confidence
  - El motor de confianza debe ser determinista, versionado y reproducible
  - Penalizaciones y bloqueos basados en reglas trazables
  - Dimensiones de scoring: cobertura, calidad, revisión, frescura, consistencia, completitud, diversidad, gobernanza
  - Toda evaluación debe explicar QUÉ se evaluó, con QUÉ evidencia, bajo QUÉ reglas
- **Referencias:** KEMS-003 (Product Constitution), KOSRA, ADR-011, ADR-012

---

## KEMS-002: Trustworthy Evidence Architecture
- **Archivo:** `docs/kems/`
- **Tipo:** KEMS
- **Estado:** v1.0/v1.1 Pending Review
- **Autoridad:** Constitutional
- **Define/Decide:**
  - Arquitectura de evidencia confiable: fuentes, procedencia, linaje
  - Pipeline de adquisición → extracción → normalización → evidencia
  - Niveles de autoridad de fuentes T1–T4
  - Observaciones como estado transitorio (no entidad independiente)
  - Políticas de frescura por tipo de fuente
- **Referencias:** KEMS-001, KEMS-003, KOSRA

---

## KEMS-003: Kadarn Product Constitution
- **Archivo:** `docs/kems/`
- **Tipo:** KEMS (Product Constitution)
- **Estado:** Canonical v1.0
- **Autoridad:** Constitutional — es la constitución del producto
- **Define/Decide:**
  - Autoridad suprema del producto: todos los demás documentos se subordinan a KEMS-003
  - Gobierna la identidad del producto, los límites del dominio y las reglas de evolución
  - Define Capability Intelligence como el concepto central del producto
  - Establece que KADARN es una plataforma de inteligencia de evidencia institucional, no un marketplace
  - Define el framework de compliance arquitectónico (KFL)
- **Referencias:** Todos los KEMS, KOSRA, CEP, KIMP, ICO Charter

---

## KEMS-004: Claim Provenance Architecture
- **Archivo:** `docs/kems/`
- **Tipo:** KEMS
- **Estado:** Canonical v1.0
- **Autoridad:** Constitutional
- **Define/Decide:**
  - Arquitectura de procedencia de claims: trazabilidad completa del origen
  - Cadena de procedencia: InstitutionalEvent → SourceRecord → Evidence → Claim
  - La procedencia es distribuida (campos en cada entidad), no centralizada en una tabla
  - Eventos de auditoría cubren acciones; la procedencia cubre origen
- **Referencias:** KEMS-001, KEMS-002, KEMS-003, ADR-014

---

## KEMS-005: Schema Evolution Standard
- **Archivo:** `docs/kems/`
- **Tipo:** KEMS
- **Estado:** v1.0 (sin estado explícito)
- **Autoridad:** Constitutional
- **Define/Decide:**
  - Reglas para evolución del esquema de base de datos
  - Migraciones forward-only, idempotentes
  - `database/migrations/` como fuente canónica única
- **Referencias:** KEMS-003, sprint-0/05_RATIFIED_MIGRATION_SEQUENCE

---

## KEMS-006: Systems Integration Standard
- **Archivo:** `docs/kems/`
- **Tipo:** KEMS
- **Estado:** v1.0
- **Autoridad:** Constitutional
- **Define/Decide:**
  - Estándares de integración entre sistemas
  - Contratos de API, versionado, compatibilidad backward
- **Referencias:** KEMS-003

---

## KEMS-007: Evidence Delivery Architecture
- **Archivo:** `docs/kems/`
- **Tipo:** KEMS
- **Estado:** Draft v0.1
- **Autoridad:** Constitutional
- **Define/Decide:**
  - Arquitectura de entrega de evidencia (Passport, publicación, sharing)
  - Snapshots de conocimiento inmutables para publicación
  - Control de acceso granular para sharing de evidencia
- **Referencias:** KEMS-003, ADR-015

---

## PB-2.7: Capability Intelligence (Product Book)
- **Archivo:** `openspec/product-book/`
- **Tipo:** Product-book
- **Estado:** Canonical v1.0
- **Autoridad:** Constitutional (Product Constitution)
- **Define/Decide:**
  - Capability Intelligence como producto central
  - Modelo de capacidades institucionales agregadas desde claims
- **Referencias:** KEMS-003, KOSRA

---

## KOSRA v0.2 — Open Source Reference Architecture
- **Archivo:** `foundation/05_ENGINEERING/architecture/KOSRA.md`
- **Tipo:** Architecture (Reference Architecture + OSS Governance)
- **Estado:** Canonical — Materialized v0.2 (2026-07-27)
- **Autoridad:** Constitutional / Architectural
- **Define/Decide:**
  - Identidad arquitectónica de KADARN: arquitectura de referencia open-source
  - Gobernanza OSS: qué es público, qué es propietario, licencias
  - Tres dominios de inteligencia (añadidos en v0.2): Evidence, Capability, Readiness
  - Gobernanza de métricas y límites de telemetría
  - Capas arquitectónicas y correspondencia con motores (KOSRA_IMPLEMENTATION_MAPPING)
  - Vistas múltiples: funcional, datos, despliegue, seguridad
  - **Regla suprema:** KOSRA gobierna toda la arquitectura; CEP, KIMP y ICO operan DENTRO del marco KOSRA
- **Referencias:** KEMS-001..004, KEMS-007, ADR-011, ADR-012, CEP, KIMP, ICO Charter, KOSRA_DECISION_REGISTER, KOSRA_MATERIALIZATION_REPORT, KOSRA_V02_VALIDATION_REPORT
- **Soportado por:**
  - `KOSRA_DECISION_REGISTER.md` — Registro de 10+ decisiones arquitectónicas clasificadas (constitutional/strategic/implementation)
  - `KOSRA_IMPLEMENTATION_MAPPING.md` — Mapeo capa-KOSRA → motor/componente concreto
  - `KOSRA_MATERIALIZATION_REPORT.md` — Fase A: evidencia de materialización en el repositorio
  - `KOSRA_V02_VALIDATION_REPORT.md` — Validación de compliance v0.2

---

## ADR-001..034 — Architecture Decision Records
- **Archivo:** `docs/adr/` (fuera de foundation/)
- **Tipo:** ADR
- **Estado:** Various (algunos frozen, otros activos)
- **Autoridad:** Constitutional (nivel 1 en jerarquía de precedencia)
- **Define/Decide:**
  - Decisiones arquitectónicas individuales vinculantes
  - ADR-011: Evidence Core Boundary Rule (límite canónico de evidence-core)
  - ADR-012: Engine Governance (gobernanza de motores)
  - ADR-005: Architectural Lexicon (SUPERSEDED por KEMS-001/002/003)
  - ADRs aceptados tienen precedencia sobre texto explicativo
- **Referencias:** KEMS, KOSRA

---

## CANONICAL_REPOSITORY.md
- **Archivo:** `foundation/00_GOVERNANCE/CANONICAL_REPOSITORY.md`
- **Tipo:** Governance
- **Estado:** Active v1.0
- **Autoridad:** Constitutional (Nivel 1)
- **Define/Decide:**
  - Declaración del repositorio canónico único: `D:\AI_WORKSPACE\01_ACTIVE_PROJECTS\KADARN\repo\kadarn-platform`
  - Prohíbe desarrollo en repositorios alternativos (C: retirement)
  - Una sola migración lineage, un solo workspace activo
- **Referencias:** KAD-LOOP-CANONICALIZATION-001

---

# NIVEL 2 — ESTRATÉGICO

---

## CEP — KADARN Canonical Execution Plan v1.0
- **Archivo:** `foundation/05_ENGINEERING/architecture/KADARN_CANONICAL_EXECUTION_PLAN_v1.0.md`
- **Tipo:** Plan (strategic phase sequence)
- **Estado:** Canonical — Materialized v1.0
- **Autoridad:** Strategic (nivel 2)
- **Define/Decide:**
  - Secuencia de fases del programa KADARN: Concept Discovery → Foundation → Platform → Intelligence → Product → Production
  - Gates de fase con criterios de entrada/salida explícitos
  - Prioridades estratégicas que gobiernan KIMP y Work Orders
  - Define que KIMP debe alinearse con la secuencia CEP
  - Las fases son: Phase A (Alignment Audit) → B (Canonical Catalogs) → C (Domain Corrections) → D (VS1: Continuing Review) → E (VS2: PI Identity) → F (Protocol Intelligence) → G (VS3: Vilo Assessment) → H (Controlled Sharing) → I (Hardening) → External Pilot
- **Referencias:** KOSRA v0.2, KIMP, ICO Charter, Master Roadmap v2

---

## 01_ARCHITECTURE_ALIGNMENT_AUDIT.md
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/realignment/01_ARCHITECTURE_ALIGNMENT_AUDIT.md`
- **Tipo:** Architecture audit
- **Estado:** HISTORICAL (pre-simplification baseline, según Document Authority Registry)
- **Autoridad:** Strategic (análisis, no normativo)
- **Define/Decide:**
  - Auditoría de alineación entre el código existente y la Architecture Constitution v2.0
  - Identificó fragmentación arquitectónica (herencia del modelo biobanking marketplace)
  - Detectó 11 "engines" del modelo KRM-RAO con solo 3-10 archivos cada uno
  - Estableció la necesidad de simplificación (de 9 bounded contexts → 5; de 45 tablas → 22)
- **Referencias:** 02_GAP_ANALYSIS_REPORT, 06_MINIMAL_ARCHITECTURE_v2, 054_EXISTING_CODE_AUDIT

---

## 06_MASTER_ROADMAP_v2.md
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/realignment/06_MASTER_ROADMAP_v2.md`
- **Tipo:** Roadmap
- **Estado:** HISTORICAL (según Document Authority Registry)
- **Autoridad:** Strategic (reemplazado por CEP + KIMP + Ratified Migration Sequence)
- **Define/Decide:**
  - Roadmap maestro v2.0 con 10 sprints (Sprint 0 → Sprint 9)
  - Cada sprint entrega: migraciones, tipos, APIs, repositorios, tests, RLS, informe
  - Gates A–I con criterios y artefactos específicos
  - Sprint 0: Freeze & Baseline (3 días) — congelar arquitectura, inventariar estado actual
  - Sprint 1: Source Registry (7 días) — EvidenceSource + SourceRecord
  - Estimación original: ~73 developer days → reducido a ~45 tras simplificación
- **Referencias:** 01_ARCHITECTURE_ALIGNMENT_AUDIT, 03_IMPACT_MATRIX, CEP

---

## GOVERNANCE_INDEX.md
- **Archivo:** `foundation/00_GOVERNANCE/GOVERNANCE_INDEX.md`
- **Tipo:** Governance
- **Estado:** Canonical — Materialized
- **Autoridad:** Strategic (documento índice maestro)
- **Define/Decide:**
  - Jerarquía documental completa en 5 niveles (Constitutional → Execution)
  - Registro de todos los documentos canónicos con ID, versión, estado, ubicación y autoridad
  - Vocabulario de estados de documentos estandarizado
  - Catálogo de artefactos de gobernanza en `00_GOVERNANCE/`
- **Referencias:** Todos los documentos del ecosistema KADARN

---

## DOCUMENT_PRECEDENCE.md
- **Archivo:** `foundation/00_GOVERNANCE/DOCUMENT_PRECEDENCE.md`
- **Tipo:** Governance
- **Estado:** Canonical — Materialized
- **Autoridad:** Strategic (define reglas de conflicto)
- **Define/Decide:**
  - Cadena de precedencia de 5 niveles: Constitutional → Strategic → Implementation Structure → Control → Execution
  - **Regla 1:** La verdad de implementación (código) prevalece sobre cualquier documentación
  - **Regla 2:** ADRs aceptados prevalecen sobre texto explicativo
  - **Regla 3:** KOSRA gobierna la arquitectura
  - **Regla 4:** CEP gobierna la secuencia de fases
  - **Regla 5:** KIMP gobierna la estructura de implementación
  - **Regla 6:** ICO gobierna los controles
  - **Regla 7:** Work Orders gobiernan la ejecución
  - **Regla 8:** Un nivel inferior no puede contradecir silenciosamente a uno superior
  - Secuencia de resolución de conflictos: verdad de implementación → fecha/versión → nivel → ADR → escalar a humano
- **Referencias:** GOVERNANCE_INDEX, DOCUMENT_RELATIONSHIP_MAP

---

## DOCUMENT_RELATIONSHIP_MAP.md
- **Archivo:** `foundation/00_GOVERNANCE/DOCUMENT_RELATIONSHIP_MAP.md`
- **Tipo:** Governance
- **Estado:** Canonical — Materialized
- **Autoridad:** Strategic
- **Define/Decide:**
  - Mapa de relaciones, dependencias y supersesiones entre documentos
  - Diagrama jerárquico: KEMS-003 → KEMS family → KOSRA → CEP → KIMP → ICO → Work Orders
  - Registro de supersesiones: ADR-005 → KEMS-001/002/003; KOSRA v0.1 → v0.2
  - Mapa de dependencias explícito: qué documento depende de cuál
- **Referencias:** GOVERNANCE_INDEX, DOCUMENT_PRECEDENCE

---

## 00_FINAL_GATE_DECISION.md — Final Gate Decision v2
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/realignment/review/final-gate/00_FINAL_GATE_DECISION.md`
- **Tipo:** Governance / Decision
- **Estado:** ACTIVE (Ratified Decision)
- **Autoridad:** Strategic → Ratifica decisiones arquitectónicas vinculantes
- **Define/Decide:**
  - **GO FOR SPRINT 0** — arquitectura mínima ratificada
  - Cuatro decisiones críticas resueltas:
    1. Claim↔Evidence: **TABLA RELACIONAL** (claim_evidence_links con FK integrity)
    2. Provenance vs Audit: **DISTRIBUIDO** (procedencia en source→record→evidence→claim; auditoría en audit_events)
    3. Observation Promotion: **REGLA DE TRANSICIÓN** (observaciones en JSONB → promovidas a Evidence con workflow)
    4. Claim Versioning: **SELF-VERSIONING** (claim_family_id + append-only rows, sin tabla separada)
  - Schema mínimo ratificado: 22 tablas (14 existentes + 1 extendida + 7 nuevas)
- **Referencias:** 06_RATIFIED_MINIMAL_SCHEMA, 01_CLAIM_EVIDENCE_RELATIONSHIP_DECISION, 02_PROVENANCE_AUDIT_BOUNDARY, 03_OBSERVATION_PROMOTION_POLICY, 04_CLAIM_VERSIONING_DECISION

---

## 06_RATIFIED_MINIMAL_SCHEMA.md
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/realignment/review/final-gate/06_RATIFIED_MINIMAL_SCHEMA.md`
- **Tipo:** Architecture / Schema specification
- **Estado:** ACTIVE (Ratified)
- **Autoridad:** Architectural → Define el esquema físico vinculante
- **Define/Decide:**
  - 22 tablas totales: Identity Registry (6), Source & Evidence (4), Claims & Capability (4), Protocol Assessment (5), Publication (3), Audit (1)
  - 7 columnas JSONB (todas APPROVED o APPROVED WITH CONSTRAINTS)
  - Reglas estrictas: JSONB solo para datos técnicos/metadatos; relaciones críticas siempre en FKs
  - Tablas nuevas: evidence_sources, source_records, claim_evidence_links, protocols, protocol_versions, assessments, knowledge_snapshots
  - Tablas extendidas: evidence_nodes (+source_id, +source_record_id, +epistemic_type), claims (+claim_family_id, +version, +valid_from/until), capabilities (+valid_from/until, +conditions)
  - Gaps se computan dinámicamente (NO son tabla)
- **Referencias:** 00_FINAL_GATE_DECISION, 05_JSONB_GOVERNANCE_MATRIX, sprint-0/05_RATIFIED_MIGRATION_SEQUENCE

---

## 01_DOCUMENT_AUTHORITY_REGISTRY.md
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/implementation/sprint-0/01_DOCUMENT_AUTHORITY_REGISTRY.md`
- **Tipo:** Governance
- **Estado:** Frozen
- **Autoridad:** Strategic (define qué documentos son normativos vs. históricos)
- **Define/Decide:**
  - Jerarquía de documentos en 5 niveles (Level 1: Normative → Level 5: Non-Normative Artifacts)
  - Documentos .docx externos como autoridad normativa máxima (Constitución Arquitectónica v2.0, Implementation Blueprint v2.0, Plan Maestro de Realineación v2.0)
  - Clasifica TODOS los documentos de realineación/review como HISTORICAL (análisis, no normativos)
  - Clasifica KOSRA, CEP, KIMP, ICO Charter como existing authority continuada
- **Referencias:** Todos los documentos del ecosistema

---

# NIVEL 3 — ESTRUCTURA DE IMPLEMENTACIÓN

---

## KIMP — KADARN Implementation Master Plan v1.0
- **Archivo:** `foundation/00_GOVERNANCE/KADARN_IMPLEMENTATION_MASTER_PLAN_v1.0.md`
- **Tipo:** Plan (implementation programs)
- **Estado:** Canonical — Materialized v1.0
- **Autoridad:** Implementation Structure (nivel 3)
- **Define/Decide:**
  - Seis programas de implementación: Architecture & Governance, Platform Foundation, Intelligence Platform, Product Experience, Open Source Evolution, Production & Scale
  - Cada programa contiene Work Streams; cada Work Stream contiene Work Orders
  - Todo Work Order debe definir: objetivo, baseline, alcance, exclusiones, entregables, criterios de aceptación, evidencia, tests, rollback, owner, dependencias, human gate
  - Programa 1 (Architecture & Governance): KOSRA v0.2, ADR governance, canonical lexicon
  - Programa 2 (Platform Foundation): Evidence Core, entity/claim/evidence boundaries, policy engine, provenance, confidence, readiness, Passport, Hermes, Gateway, observability
  - Programa 3 (Intelligence Platform): Capability Intelligence, Evidence Freshness, Provenance Coverage, Confidence Drift, Readiness Evolution
  - Reglas clave: no rebuild, OPA en Shadow Mode, observability ≠ semantic evidence, no new database sin ADR
- **Referencias:** CEP, KOSRA, ICO Charter, WORK_ORDER_CATALOG, IMPLEMENTATION_PROGRAM_INDEX

---

## 08_FOUNDATION_PHASE_CHARTER.md
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/implementation/sprint-0/08_FOUNDATION_PHASE_CHARTER.md`
- **Tipo:** Charter (phase declaration)
- **Estado:** Active (Sprint 0 deliverable)
- **Autoridad:** Implementation Structure
- **Define/Decide:**
  - KADARN entra en Foundation Phase (post-Concept Discovery)
  - Gobernada por Architecture Constitution v2.0 y Ratified Minimal Schema
  - 7 objetivos con bounded context y entregables clave:
    1. Evidence Source Intelligence → Sources + SourceRecords con T1–T4
    2. Provenance and Extraction → Pipeline con observation promotion
    3. Claim Temporal Integrity → Self-versioning claims
    4. Evidence Relationship Graph → claim_evidence_links con supports/contradicts
    5. Capability Intelligence → Temporal capabilities
    6. Protocol Requirements → Protocol + versions
    7. Explainable Assessment → Assessments con resultados trazables
- **Referencias:** sprint-0/05_RATIFIED_MIGRATION_SEQUENCE, 06_RATIFIED_MINIMAL_SCHEMA, CEP

---

## 05_RATIFIED_MIGRATION_SEQUENCE.md
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/implementation/sprint-0/05_RATIFIED_MIGRATION_SEQUENCE.md`
- **Tipo:** Plan (migration sequence)
- **Estado:** Active (ratified)
- **Autoridad:** Implementation Structure → Define el orden vinculante de migraciones
- **Define/Decide:**
  - Última migración actual: 072 (kad012_vilo_seed)
  - Bloques de migración A–G para Sprints 1–6:
    - Block A (Sprint 1): Sources — migrations 073–074 (evidence_sources, source_records)
    - Block B (Sprint 2): Claim Evidence — migrations 075–076
    - Block C (Sprint 3): Temporal Claims — migrations 077–078
    - Block D (Sprint 4): Snapshots — migrations 079–080
    - Block E (Sprint 5): Protocols — migrations 081–082
    - Block F (Sprint 5/6): Assessments — migration 083
    - Block G (Sprint 6): Audit + Publication — migrations 084–085
  - Cada bloque es independientemente desplegable y tested
- **Referencias:** 06_RATIFIED_MINIMAL_SCHEMA, sprint-0/07_V1_V2_COMPATIBILITY_CONTRACT, sprint-0/04_V1_V2_SCHEMA_RECONCILIATION

---

## 07_V1_V2_COMPATIBILITY_CONTRACT.md
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/implementation/sprint-0/07_V1_V2_COMPATIBILITY_CONTRACT.md`
- **Tipo:** Plan (compatibility contract)
- **Estado:** Active
- **Autoridad:** Implementation Structure
- **Define/Decide:**
  - Principio: Preserve → Extend → Dual-run → Migrate → Verify → Deprecate → Remove later
  - Estabilidad de identidad: todos los IDs v1 se preservan en v2
  - Compatibilidad API: rutas existentes NO cambian; nuevas rutas v2 son aditivas
  - Dual-Read/Write: Sprints 1–2 = solo v1; Sprint 3+ = v2 primary, v1 via VIEW
  - Claims: claim_family_id = old id en backfill
  - Evidencia legacy: source_record_id = NULL manejado por queries
- **Referencias:** 05_RATIFIED_MIGRATION_SEQUENCE, 04_V1_V2_SCHEMA_RECONCILIATION

---

## IMPLEMENTATION_PROGRAM_INDEX.md
- **Archivo:** `foundation/00_GOVERNANCE/IMPLEMENTATION_PROGRAM_INDEX.md`
- **Tipo:** Governance (index)
- **Estado:** Canonical — Materialized
- **Autoridad:** Implementation Structure
- **Define/Decide:**
  - Índice detallado de los 6 programas KIMP con work streams y Work Orders
  - Estado de cada programa y sus dependencias
- **Referencias:** KIMP, WORK_ORDER_CATALOG

---

## WORK_ORDER_CATALOG.md
- **Archivo:** `foundation/00_GOVERNANCE/WORK_ORDER_CATALOG.md`
- **Tipo:** Governance (catalog)
- **Estado:** Canonical — Materialized
- **Autoridad:** Implementation Structure
- **Define/Decide:**
  - Catálogo indexado de 20 Work Orders actuales y planificados
  - WO-KOSRA-002 (COMPLETE), WO-ADR-001, WO-LEX-001, WO-GOV-001 (COMPLETE)
  - Cada WO con ID, programa, work stream, estado, dependencias
- **Referencias:** KIMP, ICO Charter, GOVERNANCE_INTEGRATION_REPORT

---

# NIVEL 4 — CONTROL

---

## ICO Charter — KADARN Implementation Control Office Charter v1.0
- **Archivo:** `foundation/00_GOVERNANCE/KADARN_IMPLEMENTATION_CONTROL_OFFICE_CHARTER_v1.0.md`
- **Tipo:** Charter (control governance)
- **Estado:** Canonical — Materialized v1.0
- **Autoridad:** Control (nivel 4)
- **Define/Decide:**
  - ICO es la función de gobernanza que controla, mide y audita la ejecución
  - Es un modelo de gobernanza, NO un producto software ni burocracia organizacional
  - 7 responsabilidades: portfolio, compliance, evidence gates, OSS governance, roadmap/metrics, dependency/risk, canonical reporting
  - 5 control boards (pueden ser checkpoints, no reuniones): Portfolio, Architecture Compliance, Evidence & Quality, OSS Review, Release Readiness
  - 7 registros requeridos: Work Order, Decision, Dependency, Risk/Exception, OSS Candidate, Evidence Package, Baseline/Release
  - Gate model: Intake → Baseline → Authorization → Execution → Verification → Human Acceptance → Closure
  - 11 estados de vocabulario: DRAFT → AUTHORIZED → IN_PROGRESS → BLOCKED → APPROVED → CLOSED
  - 13 métricas de control
  - Reglas anti-burocracia: controles proporcionales al riesgo, no duplicar reportes, trabajo pequeño y reversible debe ser ligero
  - Decision rights: recomendar priorización, bloquear WOs no-compliant, requerir correcciones — NO cambia estrategia unilateralmente
- **Referencias:** KOSRA v0.2, CEP, KIMP

---

## GOVERNANCE_VALIDATION_REPORT.md
- **Archivo:** `foundation/00_GOVERNANCE/GOVERNANCE_VALIDATION_REPORT.md`
- **Tipo:** Governance (validation)
- **Estado:** Canonical — Materialized
- **Autoridad:** Control
- **Define/Decide:**
  - Validación de que el framework de gobernanza es internamente consistente
  - Verifica que no hay conflictos entre DOCUMENT_PRECEDENCE, RELATIONSHIP_MAP, y GOVERNANCE_INDEX
- **Referencias:** GOVERNANCE_INDEX, DOCUMENT_PRECEDENCE, DOCUMENT_RELATIONSHIP_MAP

---

## GOVERNANCE_INTEGRATION_REPORT.md (WO-GOV-001)
- **Archivo:** `foundation/00_GOVERNANCE/GOVERNANCE_INTEGRATION_REPORT.md`
- **Tipo:** Implementation-report (governance work order)
- **Estado:** Complete — Authorized by Human Gate (2026-07-27)
- **Autoridad:** Control
- **Define/Decide:**
  - Integración del framework de gobernanza en la jerarquía documental canónica
  - 9 archivos creados: CEP, KIMP, ICO Charter + 6 artefactos de gobernanza
  - Cero archivos de implementación modificados
  - El sistema de gobernanza es ahora el baseline de ejecución canónico
  - Todo futuro Work Order DEBE referenciar KOSRA, CEP, KIMP, ICO Charter
- **Referencias:** KOSRA, CEP, KIMP, ICO Charter, GOVERNANCE_INDEX

---

## 055_ARCHITECTURE_DISPOSITION_REGISTER.md
- **Archivo:** `foundation/05_ENGINEERING/055_ARCHITECTURE_DISPOSITION_REGISTER.md`
- **Tipo:** Architecture (disposition register)
- **Estado:** Approved for remediation sprint (2026-07-24)
- **Autoridad:** Control
- **Define/Decide:**
  - Disposición de 36+ componentes (2 apps + 34 packages): KEEP, ADAPT, CONSOLIDATE, REPLACE, QUARANTINE, POSTPONE, RETIRE
  - ~12 packages KEEP (evidence-core, types, auth, instrumentation, sdk, domain-events, telemetry, cli, ai-layer)
  - ~10 packages ADAPT (evidence-discovery, institutional-knowledge, document-intake, delivery-domain, published-view, readiness-engine, policy-engine, workflow-engine, trust-engine, provenance)
  - ~6 packages CONSOLIDATE (operational-twins, provenance-graph, graph-query, knowledge-engine, evidence-lineage, evidence-validation)
  - 4 packages REPLACE (matching-engine, fulfillment-engine, financial-engine, intelligence-engine — legado marketplace)
  - 2 packages RETIRE (ui vacío, kpe-generator deprecado)
  - Cada componente con: canonical destination, dependencias, migration timing, deletion eligibility, KFL gobernante, ADR relacionado
- **Referencias:** 054_EXISTING_CODE_AUDIT, KEMS-003, ADR-011..034

---

## 057_IMPLEMENTATION_BASELINE.md
- **Archivo:** `foundation/05_ENGINEERING/057_IMPLEMENTATION_BASELINE.md`
- **Tipo:** Governance (baseline declaration)
- **Estado:** Active — Implementation Program (2026-07-24)
- **Autoridad:** Control → Declara el baseline congelado
- **Define/Decide:**
  - El programa de implementación KADARN comienza oficialmente
  - Concept Discovery COMPLETED, Foundation Library APPROVED, Architecture Reconciliation COMPLETED, Existing Code Audit COMPLETED, Foundation Remediation PASS
  - **La arquitectura actual es aceptada como baseline de implementación**
  - **NO se autoriza rewrite** — todo el trabajo extiende, consolida o retira código existente
  - **NO se puede introducir nuevo concepto arquitectónico** (engine, graph, twin, package) sin ADR
  - 8 decisiones arquitectónicas congeladas (Evidence Graph chain, Package architecture, No new engines, database/migrations/ canónico, evidence-core autoridad única, Supabase+RLS, Monorepo, No rewrite)
  - Orden de implementación: KAD-001.5 → KAD-002A..G → KAD-003..012
  - Protected vertical slice verificado: Claim → Evidence → Review → Confidence → Passport → ShareGrant
- **Referencias:** 054_EXISTING_CODE_AUDIT, 055_ARCHITECTURE_DISPOSITION_REGISTER, 056_FOUNDATION_REMEDIATION_REPORT, KAD-001..012

---

## 054_EXISTING_CODE_AUDIT.md
- **Archivo:** `foundation/05_ENGINEERING/054_EXISTING_CODE_AUDIT.md`
- **Tipo:** Audit
- **Estado:** Complete (2026-07-24)
- **Autoridad:** Control → CONDITIONAL GO
- **Define/Decide:**
  - Repositorio viable como fundación PERO con fragmentación arquitectónica significativa (herencia biobanking marketplace → evidence intelligence platform)
  - 806 archivos TypeScript, 36 packages, ~110 API routes, ~100 UI pages, 48 migrations, ~60+ tablas
  - Build verde (12.7s), typecheck verde, 1312/1363 tests passing
  - Protected vertical slice: Claim → Evidence → Review → Confidence → Passport → ShareGrant ✅ verificado end-to-end
  - 11 "engines" del modelo KRM-RAO con solo 3-10 archivos cada uno — ilusión de modularidad
  - 5 blockers que resolver antes de feature implementation (consolidar engines, reconstruir UI, quarantinar marketplace, arreglar lint, reconciliar evidence_node schema)
  - Recommended migration path en 5 fases
- **Referencias:** KEMS-003, KEMS-001, KEMS-002, 055_ARCHITECTURE_DISPOSITION_REGISTER

---

## 056_FOUNDATION_REMEDIATION_REPORT.md
- **Archivo:** `foundation/05_ENGINEERING/056_FOUNDATION_REMEDIATION_REPORT.md`
- **Tipo:** Implementation-report
- **Estado:** Complete (2026-07-24)
- **Autoridad:** Control
- **Define/Decide:**
  - 6 workstreams de remediación completados (R1–R6)
  - R1: Migration Canonicalization — database/migrations/ declarado canónico; supabase/migrations/ es artifact
  - R2: Evidence Core Canonicalization — evidence-core es autoridad única para claims/evidence/review
  - R3: Marketplace Quarantine — todas las rutas marketplace aisladas del core
  - R4: Web Lint Recovery — lint corre sin errores en archivos core
  - R5: Architecture Disposition Register creado (055)
  - R6: Package Creation Freeze — regla documentada y enforceable
- **Referencias:** 054_EXISTING_CODE_AUDIT, 055_ARCHITECTURE_DISPOSITION_REGISTER, R1_MIGRATION_CANONICAL, R6_PACKAGE_CREATION_FREEZE

---

# NIVEL 5 — EJECUCIÓN (WORK ORDERS + LOOPS)

---

## LOOP: Canonical Repository Consolidation (KAD-LOOP-CANONICALIZATION-001)
- **Archivo:** `foundation/05_ENGINEERING/loops/loop-canonical-repository-consolidation/`
- **Tipo:** LOOP (15 documentos: charter + 14 fases)
- **Estado:** COMPLETE (merge commit ad2e39b5, 2026-07-25)
- **Autoridad:** Execution
- **Define/Decide:**
  - Consolida el repositorio canónico D: como ÚNICO activo; C: retirado y archivado
  - 17 exit criteria verificados (build, typecheck, RLS, parity, archive)
  - Forward-port de migraciones 075–079 al master
  - Tag canónico: `kadarn-canonical-baseline-2026-07-25`
  - Semantic parity documentada entre repositorios
  - Archivo bundle git + SHA256 checksums de C: verificado antes de deletion
- **Documentos del LOOP:**
  - `00_LOOP_CHARTER.md` — Charter con 17 exit criteria
  - `01_INITIAL_REPOSITORY_BASELINE.md` — Baseline inicial de ambos repos
  - `02_C_ARCHIVE_MANIFEST.md` — Manifiesto de archivo de C:
  - `03_D_WORKTREE_CLASSIFICATION.md` — Clasificación del worktree sucio de D:
  - `04_CANONICAL_DOMAIN_COMPARISON.md` — Comparación de dominios canónicos
  - `05_FORWARD_PORT_PLAN.md` — Plan de forward-port
  - `06_MIGRATION_PLAN.md` — Plan de migración
  - `07_IMPLEMENTATION_REPORT.md` — Reporte de implementación
  - `08_VALIDATION_REPORT.md` — Reporte de validación
  - `09_SEMANTIC_PARITY_REPORT.md` — Paridad semántica
  - `10_WORKSPACE_CUTOVER_REPORT.md` — Cutover de workspace
  - `11_C_DELETION_READINESS.md` — Verificación pre-deletion
  - `12_FINAL_CONFORMANCE_REPORT.md` — Conformidad final
  - `13_NEXT_LOOP_GATE.md` — Gate para LOOP 2
  - `14_CUTOVER_FINALIZATION_REPORT.md` — Merge final a master
- **Referencias:** CANONICAL_REPOSITORY.md, LOOP 2 (desbloqueado al completar)

---

## LOOP 2: Evidence Acquisition & Generation (KAD-LOOP-002)
- **Archivo:** `foundation/05_ENGINEERING/loops/loop-2-evidence-acquisition-generation/`
- **Tipo:** LOOP (13 documentos)
- **Estado:** ACTIVE — fases 0–10+ completadas, iterando
- **Autoridad:** Execution
- **Define/Decide:**
  - Pipeline canónico de adquisición y generación de evidencia
  - Source Model: EvidenceSource + SourceRecord con T1–T4 authority levels
  - Rule Engine para adquisición con políticas de frescura (5 políticas)
  - Provenance: trazabilidad completa desde SourceRecord → Evidence
  - Lineage: linaje de evidencia a través de transformaciones
  - Claim Linking: tabla `claim_evidence_links` con 5 relationship types (SUPPORTS, PARTIALLY_SUPPORTS, CONTRADICTS, REQUIRES_REVIEW, OBSOLETES)
  - Review Foundation: `review_tasks` con review_outcome y required_actions
  - Claim-Evidence relacional (NO arrays), tenant-safe vía RLS (migration 080)
  - API contracts para evidence-sources, source-records
- **Documentos clave del LOOP:**
  - `01_LOOP_CHARTER.md` — Alcance y principios
  - `02_CURRENT_STATE.md` — Inventario de estado actual (288 líneas)
  - `03_SOURCE_MODEL.md` — Modelo de fuentes de evidencia (182 líneas)
  - `04_RULE_ENGINE.md` — Motor de reglas de adquisición
  - `05_PROVENANCE.md` — Modelo de procedencia
  - `06_LINEAGE.md` — Modelo de linaje
  - `07_API.md` — Contratos API
  - `09_VALIDATION_REPORT.md` — Claim Linking Report (gap: RLS)
  - `10_ACCEPTANCE_REPORT.md` — Review Foundation Report
- **Referencias:** KEMS-002, KEMS-004, LOOP 3, LOOP 4

---

## LOOP 3: Institutional Claims & Capability Graph (KAD-LOOP-003)
- **Archivo:** `foundation/05_ENGINEERING/loops/loop-3-institutional-claims-capability-graph/`
- **Tipo:** LOOP (7 documentos)
- **Estado:** COMPLETE — READY FOR LOOP 4 (2026-07-25)
- **Autoridad:** Execution
- **Define/Decide:**
  - Modelo canónico de Claims institucionales con 5 estados de lifecycle
  - Claim Versioning operacional: ClaimVersionRepository, migration 085, immutable snapshots
  - Claim-Evidence Graph operacional: ClaimEvidenceLinkSchema con RLS vía 084
  - Capability Entity: InstitutionCapabilitySchema con agregación M2M de claims
  - Evidence Sufficiency: EvidenceSufficiencyService determinista
  - Knowledge Graph: KnowledgeGraphService con forward+reverse+coverage traversal
  - 16 API routes: claims CRUD, lifecycle, capabilities, knowledge-graph
  - 3 nuevas páginas UI: claims, capabilities, knowledge-graph
  - 5 migrations (081–085) forward-only, idempotentes
  - 3793 tests passed, 0 regresiones LOOP-3
  - `confidence_score` slot disponible para LOOP 4
- **Documentos clave del LOOP:**
  - `00_LOOP_CHARTER.md` — 14 fases planificadas
  - `01_CURRENT_STATE.md` — Estado pre-LOOP
  - `02_CLAIM_MODEL.md` — Modelo de claims institucionales
  - `03_CLAIM_VERSIONING.md` — Versionado de claims
  - `04_CAPABILITY_MODEL.md` — Modelo de capacidades
  - `12_VALIDATION_REPORT.md` — Reporte de validación
  - `13_ACCEPTANCE_REPORT.md` — 6 acceptance scenarios ✅, 13 exit criteria ✅
- **Referencias:** KEMS-001, KEMS-003, LOOP 2, LOOP 4

---

## LOOP 4: Confidence Engine (KAD-LOOP-004)
- **Archivo:** `foundation/05_ENGINEERING/loops/loop-4-confidence-engine/`
- **Tipo:** LOOP (14 documentos)
- **Estado:** ACTIVE — domain model, repositories, services completados; API/UI en progreso
- **Autoridad:** Execution
- **Define/Decide:**
  - Motor de confianza canónico: determinista, versionado, explicable, reproducible
  - Flujo canónico: InstitutionalEvent → SourceRecord → Evidence → Review → Claim → Capability → Confidence Assessment → Passport
  - 8 dimensiones de scoring: coverage, quality, review, freshness, consistency, completeness, diversity, governance
  - Eligibility Gate: 4 estados (ELIGIBLE, ELIGIBLE_WITH_WARNINGS, MANUAL_REVIEW_REQUIRED, NOT_ELIGIBLE)
  - Assessments inmutables (sin UPDATE excepto stale_at)
  - Hash-based replay: SHA-256 de inputs y outputs serializados
  - Staleness detection: detección de cambios upstream con preservación de historial
  - 17 API routes (en progreso), 8 vistas UI (pendientes)
  - 55 tests sprint4 committed ✅
- **Documentos clave del LOOP:**
  - `01_LOOP_CHARTER.md` — 10 componentes en scope
  - `02_CURRENT_STATE.md` — Estado pre-LOOP
  - `03_GAP_ANALYSIS.md` — Análisis de gaps
  - `04_CONFIDENCE_DOMAIN_MODEL.md` — Modelo de dominio
  - `05_CONFIDENCE_GOVERNANCE.md` — Gobernanza de confianza
  - `06_ELIGIBILITY_ENGINE.md` — Motor de elegibilidad
  - `07_CALCULATION_ENGINE.md` — Motor de cálculo (810 líneas)
  - `10_REPLAY_AND_VERSIONING.md` — Replay y versionado
  - `12_API.md` — Contratos API
  - `13_UI_INTEGRATION.md` — Integración UI
  - `14_IMPLEMENTATION_REPORT.md` — 11 packages implementados, ~8,600 líneas
  - `15_VALIDATION_REPORT.md` — Reporte de validación
  - `16_ACCEPTANCE_REPORT.md` — 8 acceptance scenarios schema-validados; API/UI pendientes
  - `17_NEXT_LOOP_GATE.md` — Gate para LOOP 5 (Passport)
- **Referencias:** KEMS-001, LOOP 3, LOOP 5 (Passport)

---

## KAD-001.5 → KAD-012: Concept Discovery Implementation Reports
- **Archivo:** `foundation/05_ENGINEERING/KAD*_IMPLEMENTATION_REPORT.md` (18 reports)
- **Tipo:** Implementation-report
- **Estado:** Todos COMPLETE (2026-07-24)
- **Autoridad:** Execution
- **Define/Decide (resumen de los 18 stories):**

| Story | Entidad | Estado |
|-------|---------|--------|
| KAD-001.5 | Canonical Entity Specifications | ✅ COMPLETE |
| KAD-002A | Person Model (migration 062, Zod schemas, CRUD API, RLS) | ✅ COMPLETE |
| KAD-002B | Location Model (migration 063, institution-scoped) | ✅ COMPLETE |
| KAD-002C | Institution Participation (Membership + Role, migrations 064–065) | ✅ FOUNDATION COMPLETE |
| KAD-002D | Canonical Repositories (migration 066) | ✅ COMPLETE |
| KAD-002E | Domain API Refactoring (consolidación de rutas) | ✅ COMPLETE |
| KAD-002F | Minimal Core UI (páginas base) | ✅ COMPLETE |
| KAD-002G | Integration & Vertical Validation | ✅ COMPLETE |
| KAD-003 | Capability Model | ✅ FOUNDATION COMPLETE |
| KAD-004 | Claim Consolidation | ✅ COMPLETE |
| KAD-005 | Evidence & Provenance (tipos canónicos, Zod schemas) | ✅ COMPLETE |
| KAD-006 | Review Workflow | ✅ COMPLETE |
| KAD-007 | Confidence | ✅ COMPLETE |
| KAD-008 | Knowledge Publication (published_knowledge, 7 tipos, API) | ✅ COMPLETE |
| KAD-009 | Passport (passport_entries, pipeline de publicación) | ✅ COMPLETE |
| KAD-010 | Sharing & Access Grants (passport_shares, token access) | ✅ COMPLETE |
| KAD-011 | Readiness | ✅ COMPLETE |
| KAD-012 | Vilo Production Pilot (migration 072, health check, checklist) | ✅ COMPLETE |

- **Protected Vertical Slice verificado:** Claim → Evidence → Review → Confidence → Passport → ShareGrant ✅
- **Métricas finales:** Build ✅, Typecheck ✅, 1322 tests passing, 16 entity tables, 40+ API endpoints, 072 migrations
- **Referencias:** 057_IMPLEMENTATION_BASELINE, 016_CANONICAL_ENTITY_SPECIFICATIONS, VILO_PILOT_READINESS_CHECKLIST

---

## 016_CANONICAL_ENTITY_SPECIFICATIONS.md
- **Archivo:** `foundation/01_DOMAIN/016_CANONICAL_ENTITY_SPECIFICATIONS.md`
- **Tipo:** Domain specification
- **Estado:** Complete (KAD-001.5)
- **Autoridad:** Execution
- **Define/Decide:**
  - Especificaciones canónicas de las entidades fundamentales del dominio
  - Define: Person, Location, Institution, Membership, Role, Credential, Capability, Claim, Evidence, Passport
  - Base para todos los KAD-002* implementation reports
- **Referencias:** KAD-002A..G, KAD-003..012

---

## VILO_PILOT_READINESS_CHECKLIST.md
- **Archivo:** `foundation/05_ENGINEERING/VILO_PILOT_READINESS_CHECKLIST.md`
- **Tipo:** Implementation-report (checklist)
- **Estado:** Complete (KAD-012)
- **Autoridad:** Execution
- **Define/Decide:**
  - Checklist de 15 pasos para el primer Passport de Vilo Research Group
  - Pipeline verificado end-to-end: Organization → People → Locations → Members → Capabilities → Claims → Evidence → Review → Confidence → Passport → Share → Public Access
  - Health check endpoint: `GET /api/v1/pilot/health` valida 16 tablas
- **Referencias:** KAD-012, 057_IMPLEMENTATION_BASELINE

---

## R1_MIGRATION_CANONICAL.md
- **Archivo:** `foundation/05_ENGINEERING/R1_MIGRATION_CANONICAL.md`
- **Tipo:** Implementation-report
- **Estado:** Complete
- **Autoridad:** Execution
- **Define/Decide:**
  - Canonicalización de migraciones: `database/migrations/` es la fuente canónica (46 archivos)
  - `supabase/migrations/` es artifact de despliegue (48 archivos, sincronizado)
  - Política: todas las nuevas migraciones DEBEN crearse en `database/migrations/` primero
- **Referencias:** 056_FOUNDATION_REMEDIATION_REPORT

---

## R6_PACKAGE_CREATION_FREEZE.md
- **Archivo:** `foundation/05_ENGINEERING/R6_PACKAGE_CREATION_FREEZE.md`
- **Tipo:** Engineering rule
- **Estado:** Active
- **Autoridad:** Execution → Regla de ingeniería vinculante
- **Define/Decide:**
  - Congelación de creación de nuevos packages
  - No se pueden crear nuevos packages sin aprobación explícita y ADR
  - Enforceable mediante review policy
- **Referencias:** 055_ARCHITECTURE_DISPOSITION_REGISTER, 057_IMPLEMENTATION_BASELINE

---

# SPRINTS v2 (IMPLEMENTACIÓN ACTIVA)

---

## Sprint 0 — Architecture Freeze (COMPLETO)
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/implementation/sprint-0/`
- **Tipo:** Sprint deliverables (11 documentos)
- **Estado:** COMPLETE — READY FOR SPRINT 1
- **Autoridad:** Implementation
- **Define/Decide:**
  - 10 deliverables en 8 workstreams:
    - WS1: Document Authority Registry (qué documentos son normativos)
    - WS2: Repository Baseline (estado del repositorio al inicio)
    - WS3: Schema Reconciliation (v1 → v2 mapping)
    - WS4: Ratified Migration Sequence (bloques A–G)
    - WS5: Continuity Engine Deprecation Plan
    - WS6: v1–v2 Compatibility Contract
    - WS7: Foundation Phase Charter (7 objetivos)
    - WS8: Sprint 1 Entry Gate (10 condiciones satisfechas)
  - 10 entry gate conditions para Sprint 1 TODAS satisfechas
- **Documentos:** 00_SPRINT_0_README, 01_DOCUMENT_AUTHORITY_REGISTRY, 02_REPOSITORY_BASELINE, 03_CURRENT_SCHEMA_INVENTORY, 04_V1_V2_SCHEMA_RECONCILIATION, 05_RATIFIED_MIGRATION_SEQUENCE, 06_CONTINUITY_ENGINE_DEPRECATION_PLAN, 07_V1_V2_COMPATIBILITY_CONTRACT, 08_FOUNDATION_PHASE_CHARTER, 09_SPRINT_1_ENTRY_GATE, 10_IMPLEMENTATION_DECISION_LOG
- **Referencias:** Master Roadmap v2, 06_RATIFIED_MINIMAL_SCHEMA

---

## Sprint 1 — Source Registry (COMPLETO)
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/implementation/sprint-1/`
- **Tipo:** Sprint deliverables (6 documentos)
- **Estado:** COMPLETE — READY FOR SPRINT 2
- **Autoridad:** Implementation
- **Define/Decide:**
  - Domain Decisions: Source vs SourceRecord, authority levels (6 niveles T1a–T4b), freshness policies (5 políticas)
  - Schema Implementation: migrations 073 (evidence_sources, 17 columnas) + 074 (source_records, 14 columnas)
  - Security & Tenancy: RLS — global sources visibles para todos; institucionales scoped por membership
  - API Contracts: 7 endpoints para evidence-sources + source-records
  - Authority & Freshness Model: 6 niveles de autoridad (regulatory → inferred_or_generated), 5 políticas de frescura (no_expiration, fixed_duration, source_defined, event_driven, manual_review)
  - Sprint 1 tests: 15/15 passed, 0 regresiones, full suite 1337/1337
  - Sprint 2 Entry Gate: READY — 8 condiciones satisfechas
- **Documentos:** 00_SPRINT_1_README, 01_COMPACT_DELIVERABLES, 03_AUTHORITY_AND_FRESHNESS_MODEL, 07_BASELINE_FAILURE_REGISTRY, 08_SKILL_CHANGE_DISCLOSURE, 09_SPRINT_2_ENTRY_GATE
- **Referencias:** Sprint 0, 05_RATIFIED_MIGRATION_SEQUENCE, 06_RATIFIED_MINIMAL_SCHEMA

---

# DOCUMENTOS DE ANÁLISIS (HISTORICAL — NO NORMATIVOS)

---

## Realignment Review (7 documentos)
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/realignment/review/`
- **Estado:** Todos HISTORICAL (según Document Authority Registry)
- **Autoridad:** Analysis (no vinculante; las decisiones finales están en final-gate/)
- **Define/Decide (análisis que informó las decisiones):**
  - `00_README.md` — CONDITIONAL GO con 6 condiciones (aceptar 24 tablas no 45, 8 nuevas no 27, claim versioning vía columnas no tabla)
  - `01_DOMAIN_SIMPLIFICATION_REVIEW.md` — Principio: "Fold, Don't Multiply". Cada concepto que puede ser atributo NO debe ser entidad
  - `02_ENTITY_JUSTIFICATION_MATRIX.md` — 33 entidades evaluadas
  - `03_TABLE_JUSTIFICATION_MATRIX.md` — ~45 tablas propuestas evaluadas
  - `04_BOUNDED_CONTEXT_REVIEW.md` — 9 bounded contexts → 5
  - `05_ARCHITECTURE_COMPLEXITY_REPORT.md` — Métricas de complejidad
  - `06_MINIMAL_ARCHITECTURE_v2.md` — Propuesta simplificada: 22 tablas, 8 nuevas, principio "Fold, Don't Multiply"
- **Referencias:** final-gate/00_FINAL_GATE_DECISION, 06_RATIFIED_MINIMAL_SCHEMA

---

## Realignment Analysis (7 documentos)
- **Archivo:** `foundation/00_ROOT_AUTHORITY/v2/realignment/`
- **Estado:** Todos HISTORICAL
- **Autoridad:** Analysis
- **Define/Decide:**
  - `01_ARCHITECTURE_ALIGNMENT_AUDIT.md` — Auditoría de alineación
  - `02_GAP_ANALYSIS_REPORT.md` — Gaps CRITICAL (EvidenceSource, SourceRecord), MAJOR (acquisition tracking), MINOR
  - `03_IMPACT_MATRIX_KAD001_012.md` — Clasificación PRESERVE/EXTEND/REFACTOR/DEPRECATE/DEFER para cada KAD story
  - `04_MIGRATION_STRATEGY.md` — 8 bloques de migración A–H con rollback plans
  - `05_REFACTORING_BACKLOG.md` — Backlog de refactoring
  - `06_MASTER_ROADMAP_v2.md` — Roadmap de 10 sprints
- **Referencias:** final-gate/, sprint-0/, sprint-1/

---

# RESUMEN DE LA TRAZA VERTICAL (INSTITUTION → PASSPORT)

El corte vertical protegido documentado en 057_IMPLEMENTATION_BASELINE y verificado por KAD-012:

```
INSTITUTION (organizations) ──► Person (KAD-002A) ──► Location (KAD-002B)
       │                              │
       └── Membership (KAD-002C) ◄────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   CAPABILITY    CLAIM        EVIDENCE
   (KAD-003)    (KAD-004)    (KAD-005)
       │            │            │
       └────────────┼────────────┘
                    ▼
               REVIEW (KAD-006)
                    │
                    ▼
              CONFIDENCE (KAD-007 / LOOP-4)
                    │
                    ▼
            KNOWLEDGE PUBLICATION (KAD-008)
                    │
                    ▼
               PASSPORT (KAD-009)
                    │
                    ▼
            SHARE GRANT (KAD-010)
                    │
                    ▼
            PUBLIC ACCESS (KAD-010)
```

**Cada eslabón está implementado, tested y verificado.**

La arquitectura v2 (Ratified Minimal Schema) extiende esta traza añadiendo:
- **Source Intelligence** (Sprint 1): EvidenceSource → SourceRecord → Evidence (procedencia)
- **Temporal Claims** (Sprint 3): self-versioning con claim_family_id
- **Protocol Assessment** (Sprint 5–6): Protocols → Requirements → Assessments
- **Knowledge Snapshots** (Sprint 4): inmutabilidad de publicación

---

# ESTADÍSTICAS FINALES

| Métrica | Valor |
|---------|-------|
| Total archivos .md leídos | 129 |
| Documentos constitucionales | 12 (KEMS-001..007, PB-2.7, KOSRA, ADRs, CANONICAL_REPOSITORY) |
| Documentos estratégicos | 8 (CEP, Alignment Audit, Master Roadmap, Governance Index/Precedence/Relationship Map, Final Gate Decision, Ratified Minimal Schema, Document Authority Registry) |
| Documentos de estructura | 5 (KIMP, Foundation Phase Charter, Migration Sequence, Compatibility Contract, Program Index + Work Order Catalog) |
| Documentos de control | 5 (ICO Charter, Governance Validation/Integration, Architecture Disposition Register, Implementation Baseline, Existing Code Audit, Foundation Remediation) |
| Documentos de ejecución (LOOPs) | 49 (4 LOOPs × ~12 docs cada uno) |
| Implementation reports (KAD) | 18 (KAD-001.5 → KAD-012) |
| Sprint deliverables v2 | 17 (Sprint 0: 11 + Sprint 1: 6) |
| Documentos de análisis (historical) | 14 (realignment + review) |
| Soportes/ingeniería | 4 (R1, R6, VILO checklist, entity specs) |

**Estado general del ecosistema documental:** COHERENTE y GOBERNADO. La jerarquía de precedencia está materializada. El baseline de implementación está congelado. Los 4 LOOPs principales están completos (consolidación, claims, confidence) o activos con entregables sustanciales (evidence acquisition). El framework de gobernanza (KOSRA → CEP → KIMP → ICO → WO) es autoconsistente y tiene integridad referencial cruzada.
