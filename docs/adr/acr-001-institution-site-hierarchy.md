# ACR-001: Institution → Site Identity Hierarchy

**Status:** Approved  
**Date:** 2026-07-01  
**Baseline:** AF-1.0  
**Type:** Required architecture change (Track A decision)  
**Source:** Sprint 19 spec — Identity Resolution Model + Architecture Lead review

---

## Context

Sprint 19.0 implemented `InstitutionIdentity` as a flat entity. The Sprint 19 Task 0 spec treats "institution" as the canonical identity object. However, during implementation review, a structural problem was identified:

**Two different sites at the same hospital (e.g., Oncology and Cardiology) have different capabilities. If they share a single InstitutionIdentity, their Claims and Confidence Graphs are conflated. If they have separate identities with no relationship, cross-source corroboration is lost.**

The original Sprint 19 spec flagged this as an open question. This ACR closes it.

---

## Decision

**InstitutionIdentity represents the legal/institutional entity. SiteIdentity represents the operational unit where Claims, EvidenceNodes, and Confidence Graphs live.**

### Entity roles

| Entity | Represents | Role |
|--------|-----------|------|
| `InstitutionIdentity` | Legal/corporate entity | Stores external identifiers (FEI, CLIA, CAP), aliases, legal addresses. Enables cross-source corroboration. |
| `SiteIdentity` | Operational unit | Hosts Claims, EvidenceNodes, Confidence Graphs. Is the entity that gets evaluated. |

### Relationship

```
InstitutionIdentity
      │
      ├── SiteIdentity: Oncology Research Unit
      │       ├── Claim: -80°C storage
      │       ├── Claim: PBMC processing
      │       └── EvidenceNodes...
      │
      ├── SiteIdentity: Cardiology Research Unit
      │       ├── Claim: Cold chain shipping
      │       └── EvidenceNodes...
      │
      └── SiteIdentity: Biobank
              ├── Claim: LN2 storage
              └── EvidenceNodes...
```

### FK chain

```
EvidenceNode.institution_id → SiteIdentity.site_id (NOT InstitutionIdentity)
SiteIdentity.institution_id → InstitutionIdentity.kadarn_id
```

### Consequences

| Concern | Resolution |
|---------|------------|
| Cross-source corroboration | InstitutionIdentity aggregates external IDs. Evidence at any Site under the same Institution enables Class D corroboration across sites. |
| Granular Confidence Graphs | Each Site has its own Claims and Confidence Graphs. Oncology's confidence is independent of Cardiology's. |
| Identity resolution | Tier 1–3 resolve to InstitutionIdentity. Tier 4 (site confirmation) creates or confirms SiteIdentity under that Institution. |
| EvidenceNode FK | Enforced at SiteIdentity level. No raw external identifiers. |
| PubMed affiliation matching | Affiliation strings resolve to InstitutionIdentity, then EvidenceNodes are created against the appropriate SiteIdentity (or unresolved if ambiguous). |

---

## Migration path

The current `InstitutionIdentity` implementation in Sprint 19.0 will be extended:

1. `InstitutionIdentity` — preserved, add provenance fields
2. `SiteIdentity` — new entity, FK → InstitutionIdentity
3. `InstitutionAlias` — new entity for Tier 2 name matching
4. `ExternalIdentifierHistory` — append-only versioned history
5. `IdentityConfidence` — separate concept from Evidence Class
6. EvidenceNode FK → updated to reference SiteIdentity

---

## Risk

**Low.** No evidence has been ingested yet. No CT.gov or PubMed connector exists. The graph is empty. This change is purely structural and affects only the identity module implemented in Sprint 19.0.

---

## Approval

| Role | Decision | Date |
|------|----------|------|
| Architecture Lead | ✅ Approved | 2026-07-01 |
| Implementation | Required change for Sprint 19.0A | 2026-07-01 |
