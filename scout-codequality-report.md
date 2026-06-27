# Kadarn Platform — Code Quality Deep Audit

**Date**: 2026-06-27
**Scope**: 14 packages under `packages/*/src/`
**Scout**: el Gentleman

---

## Executive Summary

The platform follows a clean, consistent architecture with the Adapter pattern and pure-function engine core used across all packages. However, there are several **type-safety hotspots**, **dead code files**, **missing tsconfigs**, and **duplicated type definitions** that create risk of drift and breakage.

**Critical**: matching-engine has no tsconfig.json at all — TypeScript compilation will fail or default to unsafe settings for this package.

---

## Per-Package Findings

### 1. `packages/matching-engine` — MISSING TSCONFIG

| Finding | Severity | Details |
|---------|----------|---------|
| No `tsconfig.json` | **HIGH** | Entire package has no TypeScript configuration. `tsc --noEmit` will use IDE defaults or fail. Needs a tsconfig consistent with the other packages. |
| No `.js` extension in imports | Medium | All other packages use `.js` extensions in imports (ESM convention); matching-engine also does this, but without tsconfig `moduleResolution: "bundler"` this can break under strict module resolution. |

**File**: `packages/matching-engine/` (directory exists, 3 source files, no tsconfig.json)

---

### 2. `packages/graph-query/src/network.ts` — DEAD CODE

| Finding | Severity | Details |
|---------|----------|---------|
| Unused exported function | **MEDIUM** | `network.ts` exports `findOrganizationsByCapability(adapter, capabilities)` — but this function is **never called** anywhere. `service.ts` calls `this.adapter.findOrganizationsByCapability()` directly on the adapter. `index.ts` does not re-export `network.ts`. |
| Dead file in build | Low | The file compiles but adds no value. |

```typescript
// network.ts — entire file is dead code
export async function findOrganizationsByCapability(adapter: GraphQueryAdapter, capabilities: string[]) {
  return adapter.findOrganizationsByCapability(capabilities);
}
```

---

### 3. `packages/operational-twins` — TYPE SAFETY HOTSPOT (22 type assertions)

| Finding | Severity | Details |
|---------|----------|---------|
| 9× `as unknown as` cast | **HIGH** | Every case in `applyEventToState` switch uses `event.payload as unknown as SomePayload`. This completely bypasses TypeScript's type checker. A mistyped event payload will silently corrupt state. |
| 11× `as string` / `as number` cast | **HIGH** | Transaction and shipment event handlers cast directly from `Record<string, unknown>` without runtime validation. |
| 2× `as string` in specimen-twin.ts | Medium | Line 41, 54: extracting `organizationId` from event payload with type assertion. |

**Example pattern** (repeated 9 times in engine.ts):
```typescript
const p = event.payload as unknown as SpecimenCollectedPayload;
// If payload is malformed, p is garbage with no runtime check
```

**Root cause**: The `Record<string, unknown>` payload type forces the engine to assert. The fix would be discriminated unions or a payload type map keyed by event type.

**Files**:
- `packages/operational-twins/src/engine.ts` (lines 61, 77, 87, 94, 102, 108, 114, 134, 147, 262-265, 328-342)
- `packages/operational-twins/src/specimen-twin.ts` (lines 41, 54)

---

### 4. `packages/operational-twins` — INCOMPLETE PUBLIC API (3 types not re-exported)

| Finding | Severity | Details |
|---------|----------|---------|
| `CollectionStatus` not in index.ts | Low | Defined in types.ts line 373, missing from index.ts re-exports |
| `CollectionTwinState` not in index.ts | Low | Defined in types.ts line 374, missing from index.ts re-exports |
| `OperationalTwin<TState, TPayloads>` not in index.ts | Low | Generic interface defined in types.ts line 50, missing from public API |

Consumers cannot import these types from `@kadarn/operational-twins` — they'd need to reach into internal paths.

---

### 5. `packages/intelligence-engine` — UNUSED TYPE EXPORT

| Finding | Severity | Details |
|---------|----------|---------|
| `AIHandler` type defined but unused in engine | **LOW** | `types.ts` exports `AIHandler = (context, prompt) => Promise<string>` and `index.ts` re-exports it, but `engine.ts` only imports and uses `IntelligenceAdapter`. `AIHandler` appears nowhere in the engine's logic. |

```typescript
// packages/intelligence-engine/src/types.ts
export type AIHandler = (context: Record<string,unknown>, prompt: string) => Promise<string>;
// ^^ Never used by engine.ts. Only IntelligenceAdapter is used.
```

---

### 6. `packages/knowledge-engine` — TYPE DEFINITION IN WRONG FILE

| Finding | Severity | Details |
|---------|----------|---------|
| `HierarchyResult` defined in engine.ts, not types.ts | **LOW** | All other types live in `types.ts` or are re-exported from there. `HierarchyResult` (line 147-150 in engine.ts) is an inline `export interface` in the engine file. |

**File**: `packages/knowledge-engine/src/engine.ts` line 147-150

---

### 7. `packages/provenance-graph` — BFS DUPLICATION + NON-NULL ASSERTION

| Finding | Severity | Details |
|---------|----------|---------|
| BFS logic duplicated in `traceForward` and `traceBackward` | **MEDIUM** | The BFS traversal loop (~25 lines) is copy-pasted between the two functions with only `getIncomingEdges`/`getOutgoingEdges` changed. 90% identical. |
| 2× non-null assertion (`queue.shift()!`) | Low | Lines 44, 89 — assumes queue is never empty, but relies on the `while (queue.length > 0)` guard. Safe but a code smell. |

**Refactoring opportunity**: Extract a `bfsTraverse` helper that accepts an edge-fetching function parameter.

**Files**:
- `packages/provenance-graph/src/engine.ts` (lines 24-65, 74-112)

---

### 8. `packages/trust-engine` — TYPE SAFETY ISSUE

| Finding | Severity | Details |
|---------|----------|---------|
| `dimensionToColumn` uses `as keyof OrganizationTrust` | **LOW** | `service.ts` line 188 casts a string to `keyof OrganizationTrust` to index into the trust record. If a new dimension is added to the `TrustDimension` type but not the mapping function, this will silently produce `undefined`. |

```typescript
// trust-engine/src/service.ts:188
current[`${challenge.dimension}Score` as keyof OrganizationTrust] as number
```

---

### 9. CROSS-PACKAGE TYPE DUPLICATION

| Finding | Severity | Details |
|---------|----------|---------|
| `SpecimenCollectedPayload` defined in 2 places with different fields | **HIGH** | `domain-events` and `operational-twins` define the same conceptual event type with **different fields**. This will cause data loss or mapping errors at integration boundaries. |
| Event payloads diverged | Medium | Other payload types like `AliquotCreatedPayload`, `LocationChangedPayload`, etc. also differ between the two packages. |

**domain-events version**:
```typescript
export interface SpecimenCollectedPayload {
  specimenId: string;
  collectionId: string;
  specimenType: string;
  containerType: string;
  preservationType: string;
  storageTemperature: string;
  initialQuantity: number;
  unit: string;
  consentStatus: string;
  consentId?: string;
}
```

**operational-twins version**:
```typescript
export interface SpecimenCollectedPayload {
  organizationId: string;      // ← not in domain-events
  specimenType: string;
  containerType: string;
  preservationType: string;
  storageTemperature: string;
  initialQuantity: number;
  unit: string;
  consentStatus: string;
  consentId?: string;
  collectionProtocol?: string; // ← not in domain-events
}
// Missing from operational-twins: specimenId, collectionId
```

**Impact**: An event emitted via `domain-events` envelope would carry `specimenId` but the `operational-twins` consumer would never read it.

---

### 10. TSCONFIG INCONSISTENCY — TWO TIERS

| Finding | Severity | Details |
|---------|----------|---------|
| 5 packages with minified tsconfig | **MEDIUM** | `financial-engine`, `fulfillment-engine`, `integration-engine`, `intelligence-engine`, `matching-engine` (no tsconfig) use incomplete configs missing: `moduleResolution: "bundler"`, `declaration: true`, `declarationMap: true`, `sourceMap: true`, `skipLibCheck`, `forceConsistentCasingInFileNames`, `resolveJsonModule` |
| Risk | Medium | Without `moduleResolution: "bundler"`, ESM `.js` extensions in imports may resolve incorrectly. Without `declaration: true`, these packages emit no `.d.ts` files. |

**Minified config** (5 packages):
```json
{"compilerOptions":{"target":"ES2022","module":"ESNext","strict":true,"esModuleInterop":true,"outDir":"dist","rootDir":"src"},"include":["src"]}
```

**Full config** (9 packages):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

### 11. PACKAGE.JSON INCONSISTENCY — MISSING `"types"` FIELD

| Finding | Severity | Details |
|---------|----------|---------|
| 5 packages missing `"types"` field | **LOW** | `financial-engine`, `fulfillment-engine`, `integration-engine`, `intelligence-engine`, `matching-engine` do not specify `"types": "src/index.ts"` or `"types": "dist/index.d.ts"` in their package.json |
| Risk | Low | Type-aware consumers (like VSCode, tsc --project references) may not resolve type declarations correctly for these packages. |

Also: all 5 minified-config packages and `domain-events` omit `"type": "module"` — without it, Node.js treats `.js` files as CommonJS, breaking ESM `.js` extension imports.

---

### 12. MISSING ERROR HANDLING PATTERNS

| Finding | Severity | Details |
|---------|----------|---------|
| `integration-engine` empty catch | **MEDIUM** | `engine.ts` uses `catch {}` — silently swallows all errors during retries. Loop continues but no logging or observability. |
| `fulfillment-engine` no error handling | Low | `startFulfillment` and `completeFulfillment` pass adapter calls through with no validation or error transformation. |
| `intelligence-engine` passthrough | Low | `classify()` passes directly through to adapter with zero validation. |
| `financial-engine` no input validation | Low | `calculate()` accepts `totalValue: number` and `schedule` — no guard against NaN, negative, or null values. |

---

### 13. `packages/domain-events` — OUTLIER STRUCTURE

| Finding | Severity | Details |
|---------|----------|---------|
| Single 635-line file | **LOW** | Only package without the standard 3-file split (index.ts, engine.ts, types.ts). All 68 exports are type/interface definitions — no logic. |
| `DomainEvent<T>` is a type alias for `EventEnvelope<T>` | Low | `export type DomainEvent<T> = EventEnvelope<T>;` — introduces a second name for the exact same type, potentially confusing consumers. |
| No `"type": "module"` in package.json | Low | Missing ESM declaration. |

---

## Patterns Worth Standardizing

| Pattern | Currently Used In | Recommendation |
|---------|------------------|----------------|
| **Adapter + Pure Engine** | All non-trivial packages | Keep as-is. This is the best pattern in the codebase — keep it. |
| **`index.ts` re-export barrel** | All packages | Keep. Consider auditing for completeness (missing Collection* types in operational-twins). |
| **3-file structure (`index.ts`, `engine.ts`, `types.ts`)** | 11/14 packages | Standardize. Move domain-events to this split. |
| **Discriminated union for event payloads** | Nowhere | Introduce across operational-twins to eliminate 22 unsafe type assertions. |
| **Single shared `@kadarn/domain-events` as source of truth** | Not yet implemented | Make operational-twins import payload types from domain-events instead of redefining them. |
| **BFS extraction helper** | Provenance-graph | Extract `traceForward`/`traceBackward` BFS into a shared helper. |
| **Base tsconfig template** | Nowhere | Create a root `tsconfig.base.json` and have all packages extend it via `extends`. |
| **Runtime payload validation in pure functions** | Nowhere | Add json-schema or zod validation at the adapter boundary before passing to pure engine functions. |

---

## Risk Summary

| Severity | Count | Key items |
|----------|-------|-----------|
| **HIGH** | 3 | matching-engine missing tsconfig.json; 22 unsafe type assertions in operational-twins; duplicate SpecimenCollectedPayload with incompatible fields |
| **MEDIUM** | 5 | Dead code in graph-query/network.ts; BFS duplication; tsconfig tier split; empty catch in integration-engine; missing moduleResolution:bundler on 5 packages |
| **LOW** | 7 | Unused AIHandler type; HierarchyResult in wrong file; domain-events single file; missing "type":"module" on 6 packages; non-null assertions; missing "types" field |

---

## Priority Actions

1. **HIGH**: Add `tsconfig.json` to `packages/matching-engine`
2. **HIGH**: Align `SpecimenCollectedPayload` between domain-events and operational-twins
3. **HIGH**: Replace `as unknown as` casts in operational-twins with discriminated union or runtime validator
4. **MEDIUM**: Unify all tsconfig files to the full config template
5. **MEDIUM**: Remove dead `network.ts` file from graph-query or wire it up
6. **MEDIUM**: Add `"type": "module"` and `"types": "src/index.ts"` to all 6 missing packages
7. **MEDIUM**: Extract shared BFS helper in provenance-graph
8. **LOW**: Add `CollectionStatus`, `CollectionTwinState`, `OperationalTwin` to operational-twins public API
9. **LOW**: Move `HierarchyResult` from knowledge-engine/engine.ts to types.ts
10. **LOW**: Consider removing `AIHandler` type from intelligence-engine if unused

---
