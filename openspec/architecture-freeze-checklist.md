# Architecture Freeze Checklist — Phase 0

**Purpose:** This checklist is the authoritative governance gate for Phase 0 (Architecture Freeze). No implementation work may begin until P0-012 (Architecture Freeze Certificate) has passed. Every artifact listed below must include objective evidence of completion.

**Workspace:** `openspec/phase-0-execution-backlog.md` (detailed backlog with dependencies, risks, reuse analysis)
**Governs:** Master Work Plan v2.0 — Phase 0 and Phase 0.5
**Owner:** Architecture Lead

---

## Gate Rules

1. **Ningún artefacto puede marcarse como PASS sin evidencia verificable.** La columna "Evidencia" debe contener una ruta de archivo, un hash de commit, o un enlace directo al artifact completado.
2. **Si un artefacto falla la validación, todos los artefactos dependientes permanecen bloqueados.** No se puede saltar un ítem y avanzar al siguiente.
3. **Sprint 17 no puede comenzar hasta que P0-012 esté en estado PASS.** Por definición del Master Work Plan §0.5.
4. **Cualquier cambio arquitectónico posterior requiere un ADR.** No se introducen excepciones vía conversación o decisión verbal.

---

## Checklist

| ID | Artefacto | Estado | Evidencia | Responsable | Bloquea | Resultado |
|----|-----------|--------|-----------|-------------|---------|-----------|
| P0-001 | Architecture Freeze Checklist | ✅ | `openspec/phase-0-execution-backlog.md` | Architecture Lead | Toda Phase 0 | **PASS** |
| P0-002 | KEMS-001 v1.0 Ratificado | ✅ | `openspec/ratificacion-kems-001.md` — ratificación firmada. Baseline AF-1.0 establecida. KEMS declarado canónico y normativo. | Architecture Lead | ADR-010, ADR-011, ADR-012, Claim Taxonomy, Lexicon v1.2, KRM-RAO v2.0, KRM-BNO v1.2 | **PASS** |
| P0-003 | ADR-010: Trust Engine Retirement | ✅ | `docs/adr/adr-010-trust-engine-retirement.md` — 5 decisiones registradas. Paradigma Trust retirado. Implementación preservada como pendiente de migración. | Architecture Lead | Lexicon v1.2, KRM-RAO v2.0, KRM-BNO v1.2, Sprint 17 | **PASS** |
| P0-004 | ADR-011: Evidence Core Boundary Rule | ✅ | `docs/adr/adr-011-evidence-core-boundary.md` — five-condition test, Boundary Principle, examples table, Core scope diagram. Consistente con KEMS-001 y ADR-010. | Architecture Lead | ADR-012, KRM-RAO v2.0, Evidence Core build (Phase 1) | **PASS** |
| P0-005 | ADR-012: Engine Governance (Core / Certified / Private) | ✅ | `docs/adr/adr-012-engine-governance.md` — 4 decisiones, 3 tipos, dependency rule, write rule, Private Engine independence. Tri-ADR coherence check → PASS. | Architecture Lead | KRM-RAO v2.0, Lexicon v1.2, Phase 3/4 engine roadmap | **PASS** |
| P0-006 | Lexicon v1.2 | ✅ | `docs/architecture/lexicon.md` — 4 secciones: canonical terms, usage rules, retired terms (con tabla visible), governance rules. + Automated verification section (CI-ready). Changelog actualizado. | Architecture Lead + Engineering | KRM-RAO v2.0, KRM-BNO v1.2, CI terminology lint pipeline | **PASS** |
| P0-007 | Claim Taxonomy v1.0 | ✅ | `docs/domain/claim-taxonomy-v1.0.md` — 14 Claims jerárquicos (5 subdominios). Cada uno con spec card completa: ID, name, description, parent, domain, Evidence Classes, required evidence, decay, examples, visibility, Evidence Strength Profile. Validación cruzada → PASS. | Architecture Lead + Domain Expert | Phase 1 Milestone 1 (Evidence Model), Phase 2 Onboarding, Phase 3 Sponsor Intelligence | **PASS** |
| P0-008 | KRM-RAO v2.0 | ✅ | `docs/architecture/krm-rao.md` — 8 secciones. Evidence Core explícito. 5 Graphs (Evidence + Confidence reemplazan Trust Graph). Engine classification Core/Service/Retired. 7 Architectural Invariants. Cross-reference verification → 6/6 PASS. Trust references eliminadas. | Architecture Lead | KRM-BNO v1.2, toda decisión arquitectónica que referencie KRM-RAO | **PASS** |
| P0-009 | KRM-BNO v1.2 | ✅ | `docs/architecture/krm-bno-profile.md` — 6 secciones. Domain Profile, Evidence Source Map (A-F con fuentes BNO específicas), Competitive Boundary (7 no-es), Domain Constraints (5), Cross-Source Verification → 7/7 PASS. Sin nuevos conceptos. Trust references eliminadas. | Architecture Lead | Phase 1 Evidence Model (modelo de datos de specimens) | **PASS** |
| P0-010 | Competitive Boundary | ✅ | `docs/strategy/competitive-boundary.md` — Category Definition, Capability Boundaries (9 Kadarn + 10 external), Competitive Mapping (4 grupos, IQVIA open), 8 Scope Guardrails. Why customers buy Kadarn table. Scope creep rule documentada. | Strategy Lead | Phase 3 Go-To-Market, positioning docs | **PASS** |
| P0-011 | Architecture Validation Audit | ✅ | `openspec/architecture-validation-audit.md` — 5 categorías, 25 invariantes. Retired terms scan, single-definition check, dependencia circular check, authority mapping. Resultado: 100/100 — 0 blockers, 0 critical, 2 minor (post-freeze). | Architecture Lead (auditor independiente) | Architecture Freeze Certificate | **PASS** |
| P0-012 | Architecture Freeze Certificate | ✅ | `openspec/architecture-freeze-certificate.md` — emitido. Baseline AF-1.0 establecida. 12/12 artifacts PASS. Architecture Readiness 100/100. 0 blockers. Sprint 17 autorizado. | Architecture Lead | Sprint 17 (Evidence Core Build) | **✅ ISSUED** |

---

## Estado actual del repositorio pre-Phase 0

| Componente | Estado frente a KEMS | Acción en Phase 0 |
|------------|----------------------|-------------------|
| KEMS-001 v1.0 | ✅ Escrito | Ratificar formalmente (P0-002) |
| Manifesto v1.0 | 🟡 Obsoleto parcial | Agregar §2.8, §2.9, §2.10 (post-Freeze, track separado) |
| packages/trust-engine/ | 🟡 Arquitectónicamente obsoleto — pendiente de migración | No tocar hasta ADR-010. Algoritmos de decay, weighting, graph traversal reutilizables. |
| database/migrations/023_trust_engine.sql | 🟡 Pendiente de migración | No tocar hasta ADR-010. Schema reutilizable como base de Confidence State storage. |
| apps/api/.../trust/route.ts | 🟡 Pendiente de migración | No tocar hasta ADR-010 + KRM-RAO v2.0. API debe alinearse con Confidence State. |
| packages/provenance-graph/ | ✅ Compatible | Base del Evidence Graph. Agregar types Claim, EvidenceNode, Relationship. |
| packages/operational-twins/ | ✅ Compatible | Genera Class C evidence. Emitir OperationalEvidence events post-Freeze. |
| packages/intelligence-engine/ | ✅ Compatible | Será consumido por Confidence State computation (Phase 1). |
| continuity-claim-service | 🟡 Reutilizable con cambios | LegacyClaimStatus → alinear con KEMS. EvidenceInput → EvidenceNode. ConfidenceInput → ConfidenceState. |
| migration 042_continuity_engine.sql | 🟡 Reutilizable con cambios | Base para schema de Claims + EvidenceNodes. Remodelar con KEMS taxonomy. |
| packages/provenance/ | ✅ Compatible | Append-only provenance para EvidenceNodes. Sin cambios. |
| packages/domain-events/ | ✅ Compatible | Agregar nuevos event types: EvidenceSubmitted, CounterEvidenceRecorded, ConfidenceStateUpdated. |
| packages/knowledge-engine/ | 🟡 Reutilizable con cambios | Ontology existente puede extenderse para Claim Taxonomy resolution. |
| tests/trust/trust-engine.test.ts | 🟡 Pendiente de migración | Tests de algoritmos reutilizables. Refactorizar cuando trust-engine migre a confidence-engine. |
| tests/provenance/ | ✅ Compatible | Sin cambios. |

---

## Regla de arquitectura

> **Ningún cambio de código podrá introducir terminología o conceptos incompatibles con KEMS-001 o con un ADR ratificado.**

Esta regla entra en vigencia desde la ratificación de KEMS-001 (P0-002). Cualquier PR que introduzca `trust_score`, `TrustEngine`, `Verified`, `Certification` u otro término del Retired Terms Registry será rechazado en review.

---

*Este documento es el artefacto P0-001 del Execution Backlog de Phase 0. Debe mantenerse actualizado durante toda la fase. Cualquier modificación a este checklist requiere aprobación del architecture lead.*
