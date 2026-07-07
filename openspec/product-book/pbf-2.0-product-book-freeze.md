# PBF-2.0 — Product Book Freeze

> **Date:** 2026-07-06
> **Status:** ACTIVE
> **Type:** Governance Decree

---

## Declaration

**Kadarn Product Book v2.0** (`openspec/product-book/kadarn-product-book-v2.md`) is the canonical product document for Kadarn.

## Decisions

1. **Canonical Authority.** The Product Book v2.0 is the highest product authority. No product decision may contradict it without a formal Product Decision Record (PDR) that explicitly acknowledges and justifies the deviation.

2. **No Silent Amendments.** The Product Book may not be modified without: (a) a PDR documenting the rationale, (b) review by product and architecture, and (c) a version bump.

3. **Version Freeze.** The current version is frozen as v2.0. The next version will be v2.1 (minor revision) or v3.0 (major revision). No intermediate versions.

4. **Conflict Resolution.** If a proposed feature, architectural decision, or commercial strategy contradicts the Product Book, the Product Book wins. If market evidence contradicts the Product Book, the Product Book is formally amended — not ignored — through the PDR process.

## Hierarchy

```
Product Book v2.0
    ↓
Manifesto
    ↓
KRM / KEMS
    ↓
ADR (Architecture Decision Records)
    ↓
PDR (Product Decision Records)
    ↓
OpenSpec
    ↓
Engineering
```

## Enforcement

This freeze remains in effect until explicitly superseded by a subsequent Product Book Freeze declaration (PBF-2.1, PBF-3.0, etc.).
