# Phase 8 Contracts (Draft Reference)

**Status:** Promoted to `packages/types/src/phase8/` (Sprint 28A)  
**Authority:** Frozen domain types for Phase 8 implementation

---

## Location

Canonical TypeScript contracts:

```text
packages/types/src/phase8/
  index.ts
  common.ts
  lineage.ts      ← 28B Source → Fact
  entity.ts       ← 28B Entity Resolution
  claims.ts       ← 28C Claim Generation
  views.ts        ← 28D Published View, 28F Evidence Pack
  provenance.ts   ← 28E Claim Provenance
  reconstruction.ts ← 28E RECONSTRUCT
  lifecycle.ts    ← 28G Review Lifecycle
  confidence.ts   ← 28H Confidence State
  schema-evolution.ts ← 28I
  integration.ts  ← 28J
```

---

## Usage rules (28A)

1. Import from `@kadarn/types/phase8` once exported — not from openspec paths.
2. Contract tests in `packages/evidence-lineage/tests/` validate engines against these interfaces.
3. **No database migration** until contract tests pass for the relevant slice.
4. Header sprint numbers in files reflect **reorganized** Phase 8 order (Published View at 28D, Evidence Pack at 28F).

---

## Related

- [phase-8-evidence-evolution-architecture.md](../../phase-8-evidence-evolution-architecture.md)
- ADR-027 through ADR-032 in [adrs/](../adrs/)

---

*This directory is a reference stub. Source of truth: `packages/types/src/phase8/`.*
