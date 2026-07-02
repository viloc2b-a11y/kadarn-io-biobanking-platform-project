# Architecture Freeze Baseline AF-1.0

## Ratificación: KEMS-001 v1.0 — The Kadarn Confidence Graph Model

---

### Declaración

Por la presente, **KEMS-001 v1.0 — The Kadarn Confidence Graph Model** queda establecido como especificación canónica y normativa de Kadarn. Esta ratificación no modifica ni una línea técnica del documento original.

---

### Jerarquía

| Propiedad | Valor |
|-----------|-------|
| **Documento** | KEMS-001 v1.0 — The Kadarn Confidence Graph Model |
| **Hierarchy Level** | Level 2 — Canonical Architectural Model |
| **Authority** | Normative |
| **Status** | ✅ Ratified |
| **Version** | 1.0 |
| **Effective Date** | 2026-07-01 |
| **Baseline** | AF-1.0 (Architecture Freeze 1.0) |
| **Owner** | Architecture Lead |
| **Location** | `vendor/kems/KEMS-001_Confidence_Graph_Model_v1.0.md` |

---

### Documentos dependientes

Los siguientes artefactos derivan su autoridad de KEMS-001 y deben ser consistentes con él:

| ID | Artefacto | Relación |
|----|-----------|----------|
| P0-003 | ADR-010: Trust Engine → Confidence Engine | Implementa el Retired Terms Registry de KEMS §10 |
| P0-004 | ADR-011: Evidence Core Boundary Rule | Define los límites del Evidence Core que KEMS especifica |
| P0-005 | ADR-012: Engine Governance | Gobierna qué engines operan sobre Confidence Graphs |
| P0-006 | Lexicon v1.2 | Refleja toda la terminología de KEMS |
| P0-007 | Claim Taxonomy v1.0 | Instancia el concepto de Claim (KEMS §1) para el dominio Biospecimen |
| P0-008 | KRM-RAO v2.0 | Incorpora Evidence Core como capa explícita (KEMS §2) |
| P0-009 | KRM-BNO v1.2 | Mapea Evidence Classes (KEMS §3) al perfil Biospecimen |
| — | Evidence Core implementation (Phase 1) | Implementa el modelo de datos de KEMS |

---

### Conceptos sustituidos

A partir de esta ratificación, los siguientes conceptos quedan formalmente obsoletos y no deben ser utilizados en nueva documentación, código, o comunicación arquitectónica:

| Concepto obsoleto | Sustituido por | Referencia KEMS |
|-------------------|---------------|-----------------|
| Trust Score | Confidence State (per Claim, with explanation) | §2 — Component D |
| Trust Engine (as Core Engine) | Confidence Engine | KEMS preamble |
| Trust Graph | Evidence Graph | §2 — The Confidence Graph |
| Trust Fabric | (redundante — no reemplazado) | KEMS preamble |
| Trust Level: Gold / Silver / Bronze | Confidence Level: High / Moderate / Low / Insufficient | §2 — Component D |
| Verified (as in "this site is Verified") | "Supported by Evidence" with Evidence Class and source | §3 |
| Institutional Certification | External Confirmation (Class F) | §3 — Class F |
| Trust Score (numeric 0.0-1.0) | Confidence Value (numeric 0-100) | §2 — Component D |

---

### Open questions (no resueltas por KEMS-001, no bloquean la ratificación)

Las siguientes preguntas están reconocidas como abiertas. No modifican KEMS. Se resolverán en documentos posteriores:

| Cuestión | Resuelto en |
|----------|-------------|
| Confidence algorithm specifics (cómo el grafo produce un valor 0-100) | Future ADR (post-Freeze) |
| Derived Signals y Federated Feedback (compartir señales agregadas sin exponer modelos propietarios) | Future design domain |
| Claim Taxonomy (lista canónica de Claims) | P0-007 |
| Third-party Engine certification (gobierno de engines externos) | ADR-012 (P0-005) |

---

### Regla de baseline

A partir de esta ratificación, queda establecida la **Baseline AF-1.0 (Architecture Freeze 1.0)**.

**Qué significa:**
- Todo artifact ratificado durante Phase 0 pasa a formar parte de AF-1.0.
- Cualquier cambio posterior a un artifact dentro de AF-1.0 requiere un ADR o un proceso formal de revisión.
- Ningún cambio de código podrá introducir terminología o conceptos incompatibles con un artifact ratificado dentro de AF-1.0.

**Qué no significa:**
- Los artifacts no están congelados para siempre. Pueden evolucionar — pero mediante ADR, no por decisión informal.
- Phase 1 (Evidence Core Build) puede implementar libremente dentro del marco que AF-1.0 define.

---

### Firma

| Rol | Nombre | Fecha | Firma |
|-----|--------|------|-------|
| Architecture Lead | | 2026-07-01 | |
| Engineering Lead | | | |
| Product / Strategy | | | |

---

*Este documento es el artefacto P0-002 del Execution Backlog de Phase 0. Su aprobación constituye la ratificación formal de KEMS-001 v1.0 como especificación canónica de Kadarn.*
