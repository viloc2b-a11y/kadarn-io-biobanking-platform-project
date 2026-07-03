# KEMS-005 — Schema Evolution Standard

**Version:** 1.0
**Status:** Canonical — Ratified for Phase 8
**Category:** Architecture Standard
**Authority:** Defines how Kadarn schemas evolve without breaking historical claims
**Date:** 2026-07-03
**Depends on:** KEMS-001, KEMS-003, KEMS-004

---

## 1. Purpose

This document defines the permanent rules for schema evolution in Kadarn.

Kadarn's data model will evolve over 10-15 years. Claims created in 2026 must remain valid and queryable in 2036. This standard ensures backward compatibility through versioned schemas, migration rules, and compatibility contracts.

---

## 2. Core Principle

**Never break historical Claims.**

Every schema change must:
1. Define a new schema version
2. Provide a migration function from the previous version
3. Preserve the ability to read all historical versions
4. Not require existing Claims to be rewritten

---

## 3. Versioned Types

### 3.1 Claim Type Definition

```typescript
interface ClaimTypeDefinition {
  definitionId: string
  claimType: string          // e.g., 'biospecimen_collection', 'regulatory_compliance'
  schemaVersion: number      // Monotonic
  schema: JSONSchema         // Full JSON Schema for this version
  validFrom: string          // ISO date — claims before this use previous version
  validTo?: string           // ISO date — if deprecated
  migration?: MigrationRule  // How to migrate from previous version
  deprecatedFields: string[]
  addedFields: string[]
}
```

### 3.2 Migration Rule

```typescript
interface MigrationRule {
  fromVersion: number
  toVersion: number
  transform: MigrationFunction  // (oldClaim) → newClaim shape
  reversible: boolean           // True if migration can be reversed
  automated: boolean            // True if migration runs automatically
}
```

### 3.3 Claim Instance

Every Claim stores its schema reference:

```typescript
interface ClaimInstance {
  claimId: string
  claimDefinitionId: string    // References ClaimTypeDefinition
  schemaVersion: number        // The version used when this claim was created
  claimVersion: number         // Claim-specific revision counter
  payload: Record<string, unknown>  // Conforms to schemaVersion
  createdAt: string
}
```

---

## 4. Read Adapters

Kadarn must be able to read Claims created under any schema version.

### Read Adapter Pattern

```typescript
interface ReadAdapter {
  supportedVersions: number[]
  read(claim: ClaimInstance): CanonicalClaim  // Normalize to current format
}

// Registry of adapters keyed by schemaVersion
const readAdapters: Map<number, ReadAdapter>
```

When a consumer requests a Claim:
1. The Claim's `schemaVersion` is looked up
2. The appropriate `ReadAdapter` is selected
3. The Claim is normalized to the current canonical format
4. The consumer receives a `CanonicalClaim` regardless of original version

---

## 5. Compatibility Contracts

### Contract Types

| Contract | Guarantee |
|---|---|
| **Forward Compatible** | New schemas can read old Claims |
| **Backward Compatible** | Old readers can read new Claims (deprecated) |
| **Deprecation Notice** | Field scheduled for removal with migration path |
| **Breaking Change** | Requires ADR + 12-month deprecation period |

### Contract Enforcement

1. Every `ClaimTypeDefinition` declares its compatibility contract
2. Breaking changes require a 12-month deprecation period
3. During deprecation, both old and new schemas are active
4. After deprecation, old schema is archived but still readable

---

## 6. Canonical Views

Consumers never access raw Claim schemas. They access **Canonical Views**:

```typescript
interface CanonicalClaim {
  claimId: string
  claimType: string
  entityId: string
  statement: string
  // ... normalized fields regardless of schema version
}
```

The `CanonicalClaim` is the stable interface. Schema evolution happens behind it.

---

## 7. Migration Lifecycle

```
Schema v1 (active)
    │
    ▼ (new field added)
Schema v2 (active) + v1 (deprecated, readable)
    │
    ▼ (12 months later)
Schema v2 (active) + v1 (archived, readable via adapter)
```

---

## 8. Governance

1. All schema changes require an ADR
2. Breaking changes require Architecture Review + 12-month deprecation
3. Migration functions must be tested with historical Claims
4. Read Adapters must be registered before schema activation
5. The Schema Registry is immutable — versions are never deleted

---

## 9. Required ADRs

- ADR-026 — Schema Versioning Implementation
- ADR-027 — Read Adapter Architecture
- ADR-028 — Migration Testing Strategy

---

*Ratified for Phase 8. All schema changes must comply with this standard.*
