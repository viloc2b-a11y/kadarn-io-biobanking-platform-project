# Architecture Freeze v1.0 — Kadarn Platform Core

**Date:** 2026-07-03  
**Status:** Ratified — Baseline Frozen  
**Coverage:** KEMS-001 through KEMS-007  
**Commit baseline:** `a67d5e93` (domain) + `4188319d` (UI)  

---

## 1. Executive Summary

Kadarn's core epistemic platform — the seven Knowledge Evidence Modeling Standards (KEMS-001 through KEMS-007) — is architecturally complete. This document freezes the architecture baseline: dependency graph, public interface catalog, non-negotiable invariants, module boundaries, anti-pattern assessment, and breaking change policy.

The platform now answers five questions:

| Before KEMS-007 | After KEMS-007 |
|---|---|
| ¿Qué sabemos? | ¿Quién puede consumir ese conocimiento? |
| | ¿En qué formato? |
| | ¿Con qué políticas? |
| | ¿Con qué trazabilidad? |
| | ¿Con qué evidencia de entrega? |

With the core frozen, subsequent phases (10–14) shift from **Platform Engineering** to **Product Engineering**: Sponsor Intelligence, Institutional Workspaces, Public Discovery, Ecosystem Integrations, and Intelligence.

---

## 2. KEMS Module Map

| KEMS | Package(s) | Responsibility | Source Files | Status |
|------|-----------|----------------|:---:|--------|
| KEMS-001 | `evidence-core` | Canonical evidence storage, claims, relationships, confidence graph, provenance metadata | 56 | ✅ Frozen |
| KEMS-002 | `evidence-core` + `types` | Trustworthy evidence architecture, risk model, claim taxonomy | — | ✅ Frozen |
| KEMS-003 | `evidence-lineage` | Confidence computation engine, schema evolution, entity resolution | 16 | ✅ Frozen |
| KEMS-004 | `published-view` | Published Views, Evidence Packs, legacy adapter, discovery integration | 9 | ✅ Frozen |
| KEMS-005 | `policy-engine` | Policy evaluation, OPA shadow mode, ABAC rule engine | 10 | ✅ Frozen |
| KEMS-006 | `provenance` + `provenance-graph` | W3C PROV mapping, trace-forward/backward, full lineage | 3+3 | ✅ Frozen |
| KEMS-007 | `delivery-domain` | Delivery platform: domain model, lifecycle, policies, rendering, templates, engine, distribution, channels, audit, subscriptions, integration APIs | 73 | ✅ Frozen |
| Shared | `types` | Organization, auth, API response envelopes, Phase 8 contracts | 13 | ✅ Frozen |

---

## 3. Dependency Graph

Based on actual `import` statements in `/src` directories. Direction: **consumer → dependency**.

```
                        types (leaf — no Kadarn deps)
                         ↑
          ┌──────────────┼──────────────┐
          │              │              │
   evidence-lineage  published-view  (other consumers)
     (types/phase8)  (evidence-discovery,
                      types/phase8)

LEAF PACKAGES (zero cross-package Kadarn imports):
  evidence-core          evidence-discovery       policy-engine
  provenance             provenance-graph         delivery-domain
```

**Key finding:** 7 of 9 packages are self-contained leaves with zero cross-package Kadarn dependencies. Only `evidence-lineage` and `published-view` import from `types/phase8` (and `published-view` adds `evidence-discovery`). This is a highly decoupled architecture — changes in one package rarely cascade.

**Direction rule:** All arrows flow toward `types`. No package imports from `delivery-domain` (it's a top-level consumer). No circular dependencies exist.

---

## 4. Public Interface Catalog

### 4.1 KEMS-001: `@kadarn/evidence-core`

| Domain | Exports |
|--------|---------|
| Types | `TemporalMetadata`, `ProvenanceMetadata`, `VisibilityScope`, `VisibilityMetadata`, `EvidenceNodeStatus`, `EvidenceNode`, `ClaimStatus`, `Claim`, `RelationshipType`, `EvidenceRelationship`, `CounterEvidence`, `RightOfResponse` |
| Evidence Class | `EvidenceClass`, class names, descriptions, decay months, default weight |
| Confidence | `ConfidenceLevel`, `ConfidenceContribution`, `ConfidenceState` (type only — no computation) |
| Claim | `isClaimActive`, `validateClaimBoundedness`, `validateClaimEvidenceClasses`, `validateClaimContradictable` |
| Evidence Node | `createEvidenceNode`, `assertEvidenceNodeImmutable`, `validateEvidenceNodeWeight`, `validateNodeHasClaim` |
| Relationship | `createRelationship`, `validateRelationshipNoSelfReference` |
| Counter Evidence | `createCounterEvidence`, `attachResponse`, `validateCounterEvidenceWeight`, `assertCounterEvidenceIsImmutable` |
| Right of Response | `createRightOfResponse`, `validateResponseHasCounterEvidence` |
| Graph | `EvidenceGraph`, `createEmptyGraph`, `createGraphStore`, `addNode`, `addEdge`, `buildGraphFromData`, `getEvidenceGraph`, `getClaimEvidence`, `getSupportingEvidence`, `getContradictingEvidence`, `getResponseChain`, `getEvidenceLineage`, `getTemporalHistory`, `getRelationshipGraph`, `findDisconnectedNodes`, `findCycles`, `findBrokenReferences`, `validateGraphIntegrity` |
| Provenance | `createProvenance` |
| Visibility | `siteVisibility`, `sponsorAuthorizedVisibility`, `systemVisibility` |
| Invariants | `validateClaim`, `InvariantResult` |
| Audit | `recordAuditEntry`, `createAuditEntry`, `AuditAction`, `AuditEntry` |
| Lifecycle | `createClaim`, `submitEvidence`, `linkEvidenceToClaim`, `submitCounterEvidence`, `submitRightOfResponse`, `updateProcessState`, commands, actor context |
| Boundary | `testBoundary`, `isForbiddenInCore`, `assertNotForbiddenInCore`, `registerCoreFunction`, `getCoreFunctions`, `verifyCoreBoundary`, `FORBIDDEN_CORE_OPERATIONS` |
| Repository | `insertClaim`, `getClaimById`, `insertEvidenceNode`, `getEvidenceNodesByClaim`, `insertCounterEvidence`, `insertRightOfResponse`, `insertRelationship` |
| API | `apiCreateClaim`, `apiSubmitEvidence`, `apiSubmitCounterEvidence`, `apiSubmitResponse`, `apiCreateRelationship`, `apiUpdateProcessState`, `apiGetClaim`, `apiGetClaimEvidence` |
| Connectors | `ConnectorOrchestrator`, `withRetry`, `RateLimiter`, `InMemoryIdempotencyStore`, `MetricsCollector`, FDA/PubMed/ClinicalTrials adapters |
| Identity | `resolveIdentity`, tiered resolution (1–4), `normalizeName`, `detectConflicts`, `detectMergeCandidates`, `detectSplitCandidates` |
| Evaluation | `EvaluationPipeline`, `aggregateContributions`, `projectConfidence`, 6 evaluators (evidence class, relationship, counter-evidence, temporal, right-of-response, visibility) |
| Explainability | `createSkeletonEvaluation`, `EvaluationResult`, `Explanation`, contribution types, omission tracking |

### 4.2 KEMS-002: Claim Model (embedded in `evidence-core` + `types`)

The claim model is distributed across `evidence-core` (domain logic) and `types` (shared contracts). Key invariants:

- Claims use only terms from the Kadarn Lexicon
- Claims can be supported or contradicted by evidence
- Claims never represent opinions, rankings, or reputational judgments
- Evidence Nodes are immutable, append-only (`wasRevisionOf` / `supersedes` for corrections)

### 4.3 KEMS-003: `@kadarn/evidence-lineage`

| Domain | Exports |
|--------|---------|
| Engine | `EvidenceLineageEngine`, `EntityResolutionEngine`, `ClaimGenerationEngine`, `ClaimProvenanceEngine` |
| Lifecycle | `ReviewLifecycleEngine`, `ReviewEventType`, `ReviewEvent` |
| Confidence | `ConfidenceStateEngine`, `EvidenceGraphNode`, `EvidenceGraphEdge` |
| Publishing | `PublishedViewEngine`, `EvidencePackEngine`, `ViewType` |
| Schema | `SchemaEvolutionEngine`, `ClaimTypeDefinition`, `MigrationRule`, `ReadAdapter` |
| Integration | `SystemsIntegrationEngine`, `IntegrationSystem`, `IntegrationContract`, `WebhookEvent` |
| Indexing | `HybridIndexingEngine`, `IndexConfig`, `MaterializedEdge` |
| Reconstruction | `ReconstructService`, `ReconstructResult` |
| Freeze | `ArchitectureFreezeEngine`, `ArchitectureFreezeRecord` |
| Contract Mapping | `toContractLineage`, `toContractSource`, `assertContractLineageComplete`, `ContractLineageBundle` |

### 4.4 KEMS-004: `@kadarn/published-view`

| Domain | Exports |
|--------|---------|
| Engine | `PublishedViewEngine`, `confidenceLevelFromScore`, `PublishInput`, `ViewAudience` |
| Legacy Adapter | `LegacyReadAdapter`, `LEGACY_ADAPTER_VERSION`, legacy types |
| Discovery | `adaptDiscoveryAgentOutputs`, `adaptDiscoveryCandidates`, `DISCOVERY_ADAPTER_VERSION` |
| Output Builder | `buildAllEngineOutputs`, `AgentOutputMap` |
| Evidence Pack | `EvidencePackGenerator`, `PackGenerationInput` |
| Report | `generateDiscoveryReport`, `buildDiscoveryReportDirect` |
| Service | `PublishedViewService`, service config and input/output types |
| Guard | `PHASE8_VIEW_BOUNDARY`, `assertPublishedViewRead`, `VIEW_MIGRATED_ROUTES`, `VIEW_PENDING_ROUTES` |

### 4.5 KEMS-005: `@kadarn/policy-engine`

| Domain | Exports |
|--------|---------|
| Core | `evaluate`, `compose`, `validateCondition` |
| Types | `Policy`, `PolicyRule`, `PolicyCondition`, `PolicyDomain`, `PolicyStatus`, `PolicyOutcome`, `PolicyEvaluation`, `EvaluationTrace`, `CompositionResult` |
| OPA Shadow | `LocalOpaClient`, `NullOpaClient`, `createOpaClient`, `ShadowModeRunner`, `loadConfig`, `PolicyEngineConfig` |
| Built-in | `DEFAULT_POLICIES`, `organizationMembershipPolicy`, `programVisibilityPolicy`, `withPolicyShadow` |

### 4.6 KEMS-006: `@kadarn/provenance` + `@kadarn/provenance-graph`

**`@kadarn/provenance`** — W3C PROV mapping:
| Domain | Exports |
|--------|---------|
| Mapping | `toProvEntity`, `toProvActivity`, `toProvAgent`, `toProvNode`, `toProvRelation`, `toProvDocument`, `getProvCategory`, `getProvType` |
| Types | `ProvEntity`, `ProvActivity`, `ProvAgent`, `ProvDocument`, `ProvWasGeneratedBy`, `ProvUsed`, `ProvWasDerivedFrom`, `ProvWasAttributedTo`, `ProvWasAssociatedWith`, `ProvActedOnBehalfOf`, `ProvWasRevisionOf` |

**`@kadarn/provenance-graph`** — Graph traversal:
| Domain | Exports |
|--------|---------|
| Traversal | `traceForward`, `traceBackward`, `fullLineage`, `evidenceFor`, `lineageAt` |
| Types | `ProvenanceNode`, `ProvenanceEdge`, `ProvenanceEvidence`, `LineageResult`, `ProvenanceAdapter` |

### 4.7 KEMS-007: `@kadarn/delivery-domain`

| Module | Key Exports |
|--------|-------------|
| Entities (6) | `DeliveryArtifact`, `DeliveryChannel`, `DeliveryRecipient`, `DeliveryPolicy`, `DeliveryTemplate`, `DeliveryReceipt` |
| Value Objects (7) | `DeliveryArtifactId` (+5 branded IDs), `ContentHash`, `ArtifactStatus`, `ReceiptStatus`, `ArtifactType`, `ChannelType`, `RecipientType` |
| Events (12) | `DeliveryArtifactCreated`, `ArtifactGenerated`, `ArtifactQueued`, `ArtifactDelivered`, `ArtifactOpened`, `ArtifactExpired`, `ArtifactRevoked`, `DeliveryReceiptRecorded`, `DeliveryFailed` (plus 3 legacy compat events) |
| Repositories (5) | `DeliveryArtifactRepository`, `DeliveryChannelRepository`, `DeliveryRecipientRepository`, `DeliveryTemplateRepository`, `DeliveryReceiptRepository` |
| Policies | `PolicyEngine`, `PolicyActor`, `DeliveryRole` (6 roles), `DeliveryAction` (7 actions), `AbacRule` (7 operators), `VisibilityRule` (3 built-in) |
| Rendering (4) | `ArtifactRenderer`, `JsonRenderer`, `HtmlRenderer`, `CsvRenderer`, `PdfRenderer`, `ViewData` |
| Templating | `TemplateRegistry` (11 methods), `TemplateSlot` (6 types), `TemplateMetadata`, 5 pre-built templates |
| Engine | `DeliveryEngine`, `DeliveryRequest`, `DeliveryResult`, 5 typed errors |
| Distribution | `DistributionLayer`, `DeliveryQueue` (FIFO), `DeadLetterQueue`, `ExponentialBackoff`, `FixedBackoff`, `NoRetry`, `IdempotencyRegistry` |
| Channels (6) | `ChannelAdapter`, `RestAdapter`, `WebhookAdapter`, `EmailAdapter`, `DashboardAdapter`, `DownloadAdapter`, `ApiAdapter`, `ChannelRegistry` |
| Audit | `AuditTrail` (immutable hash-chained), `AuditEntry` (15 event types), `IntegrityReport`, `ReplayResult` |
| Subscriptions | `SubscriptionScheduler` (schedule + event triggers), `DeliverySubscription`, 5 pre-built subscriptions |
| Integration | `CtmsAdapter`, `FhirAdapter` (FHIR R4), `WebhookIntegration`, `RestApiContract` (4 endpoints), `DeliverySdk`, `ApiContractValidator` |

### 4.8 Shared: `@kadarn/types`

| Domain | Key Types |
|--------|-----------|
| Organization | `OrgType` (9 types), `Capability` (12), `Organization`, `OrganizationMembership` |
| Auth | `KadarnRole` (4 roles), `WorkspaceType`, `Experience`, `UserProfile`, `AccessContext` |
| Programs | `ProgramStatus` (6 states), `Program` |
| Marketplace | `MarketplaceCategory` |
| Operations | `ExceptionSeverity`, `Exception`, `KPEStatus` |
| API | `ApiResponse<T>`, `ApiError` |
| Phase 8 | Re-exported `phase8/*` (PublishedView, EvidencePack, lineage, claims, etc.) |
| Events | Platform events, error types |

---

## 5. Invariants Per Module

### KEMS-001 — Evidence Core
- Evidence Nodes are **immutable and append-only** — never updated or deleted
- Corrections are made by appending a new node with `wasRevisionOf` / `supersedes` relationship
- Confidence is **computed**, never stored as user input
- Confidence State is per-Claim emergent output of the graph
- Claims represent bounded assertions about institutional capability — never opinions, rankings, or reputational judgments
- Claims must use only Kadarn Lexicon terms
- Claims must admit at least one valid Evidence Class (A–F)
- Claims must be contradictable by Counter Evidence

### KEMS-002 — Trustworthy Evidence Architecture
- Architectural decisions shall not violate KEMS-002 principles without a new ADR
- Evidence Core stores/relates/persists but does NOT compute Confidence (boundary rule)

### KEMS-003 — Evidence Lineage / Confidence
- Schema evolution must preserve backward compatibility
- Entity resolution is tiered (1–4), each tier has specific match criteria
- Contract mapping must complete for all extracted facts (`assertContractLineageComplete`)

### KEMS-004 — Published Views
- Published Views are the **only valid input** to the Delivery Engine
- `Evidence Core → PDF` path is **never** allowed (always `Published View → Delivery Artifact → Channel`)
- Legacy adapter (`LEGACY_ADAPTER_VERSION`) must remain until production cutover
- Compatibility Layer code is retained in deploy artifact (remove after 2-week monitoring)

### KEMS-005 — Policy Engine
- Policy evaluation is deterministic — same input always produces same output
- Shadow mode runs OPA policies in parallel without affecting production decisions

### KEMS-006 — Provenance
- W3C PROV mapping is semantic only — no data moves
- Original tables remain the source of truth
- `traceForward` and `traceBackward` must produce consistent, complete paths

### KEMS-007 — Delivery Domain
- **AuditTrail entries are immutable** — Object.freeze, hash-chained with SHA-256 (`node:crypto`)
- **ArtifactStatus transitions are restricted** — state machine enforces valid paths:
  - `draft → generated → queued → delivered → acknowledged`
  - Terminal: `expired`, `revoked`
- **PolicyEngine evaluation order** (first match wins):
  1. Actor-specific override policies
  2. RBAC — role-based permissions
  3. ABAC — attribute-based rules (priority-ordered)
  4. Visibility — built-in rules
- **DeliveryQueue is FIFO** — enqueue order equals dequeue order
- **Idempotency key** = `artifactId + channelId + recipientId` — prevents duplicate delivery
- **DistributionLayer** does not depend on channel implementation — transport injection pattern
- **ContentHash** is always SHA-256 hex (64 chars) — no other hash algorithm
- **DeliveryTemplate checksum** is deterministic — recomputable from name + type + version + metadata + schema
- **Renderer output is pure representation** — no business logic, no confidence computation
- Integration APIs use **12 endpoints** across 4 contracts (CTMS, FHIR R4, Webhook, REST)
- **735 domain tests** guard all invariants (14 test files)

---

## 6. Module Boundaries

### `evidence-core` (KEMS-001/002)
| IN scope | OUT of scope |
|----------|-------------|
| Evidence storage, relationships, provenance metadata | Confidence computation (done by `evidence-lineage`) |
| Claim lifecycle (create, submit, counter, respond) | UI rendering |
| Graph construction and traversal | HTTP endpoint definitions |
| Connector ingestion (FDA, PubMed, ClinicalTrials) | Delivery/channel logic |
| Identity resolution (tiered matching) | Policy evaluation |
| Evaluation pipeline (6 evaluators) | Subscription scheduling |

### `evidence-discovery` (KEMS-001 companion)
| IN scope | OUT of scope |
|----------|-------------|
| Capability detection and normalization | Evidence storage (uses `evidence-core`) |
| Claim candidate detection | Confidence computation |
| Gap analysis and narrative generation | Delivery/distribution |
| Institutional profiling and assessment | External integration APIs |
| Discovery workspace orchestration | Template rendering |
| Curation, snapshot, timeline | Audit trail |

### `evidence-lineage` (KEMS-003)
| IN scope | OUT of scope |
|----------|-------------|
| Entity resolution (1–4 tiers) | Raw evidence storage |
| Claim generation from extracted facts | UI |
| Claim provenance tracking | Channel adapters |
| Confidence state engine | Delivery queue |
| Schema evolution and migration | Subscription triggers |
| Contract mapping to canonical types | External consumer adapters |
| Architecture freeze enforcement | |

### `published-view` (KEMS-004)
| IN scope | OUT of scope |
|----------|-------------|
| Published View generation from lineage | Raw claim access |
| Evidence Pack compilation | Confidence computation |
| Legacy adapter (phase8 cutover) | Delivery (uses KEMS-007) |
| Discovery agent output adaptation | Channel management |
| Integration guard (route migration tracking) | Template management |

### `policy-engine` (KEMS-005)
| IN scope | OUT of scope |
|----------|-------------|
| Policy evaluation and composition | Evidence storage |
| OPA shadow mode | UI policy interfaces |
| Built-in policies (membership, program visibility) | Delivery-specific policies (those are in `delivery-domain`) |
| Condition validation | Channel authorization |

### `provenance` + `provenance-graph` (KEMS-006)
| IN scope | OUT of scope |
|----------|-------------|
| W3C PROV semantic mapping | Data storage (reads from existing tables) |
| Graph traversal (forward, backward, full lineage) | Confidence computation |
| Evidence chain reconstruction | Delivery audit (KEMS-007 owns delivery-specific audit) |
| Lineage querying | UI rendering |

### `delivery-domain` (KEMS-007)
| IN scope | OUT of scope |
|----------|-------------|
| Domain model (6 entities, 7 VOs, 12 events, 5 repos) | HTTP servers |
| Artifact lifecycle (7-state machine) | Database implementations |
| Policy engine (RBAC + ABAC + Visibility) | Real SMTP/HTTP calls |
| Renderers (HTML, PDF, JSON, CSV) | UI rendering (consumed by `apps/web`) |
| Template registry + 5 pre-built templates | Actual PDF generation library |
| Delivery engine orchestrator | Running cron jobs (scheduler is domain model only) |
| Distribution layer (Queue, Retry, DLQ, Idempotency) | |
| Channel adapters (6 protocols) | |
| Immutable audit trail (SHA-256 chain) | |
| Subscription scheduler (schedule + event triggers) | |
| Integration APIs (CTMS, FHIR, Webhook, REST, SDK) | |

### `types`
| IN scope | OUT of scope |
|----------|-------------|
| Shared TypeScript contracts | Runtime logic |
| Organization, auth, API response envelopes | Database schemas (owned by `supabase/migrations`) |
| Phase 8 frozen domain contracts | UI components |
| Platform events and error types | Business rules |

---

## 7. Anti-Patterns Assessment

### 7.1 Circular Dependencies
**Finding: NONE.** Zero circular dependencies detected across all 9 packages. Dependency graph is a clean DAG with all arrows flowing toward `types`.

### 7.2 God Modules
**Finding: MONITORED, NOT BLOCKING.** `evidence-core` (56 files) and `delivery-domain` (73 files) are large packages but well-factored into sub-modules with clear responsibilities. `evidence-discovery` (104 files) is the largest — warrants future decomposition review post-Phase 14.

### 7.3 Leaky Abstractions
**Finding: NONE DETECTED.** All packages expose interfaces/contracts, not implementations. Transport injection pattern in `delivery-domain/channels` ensures domain doesn't leak HTTP/SMTP details. Repository interfaces are abstract — no DB coupling.

### 7.4 Missing Interfaces
**Finding: NONE.** All 7 KEMS packages expose public interfaces through `index.ts` barrel exports. Repository interfaces exist for all 5 delivery entities. Channel adapters implement `ChannelAdapter`.

### 7.5 Type Coupling
**Finding: LOW.** Only two cross-package type dependencies exist: `evidence-lineage → types/phase8` and `published-view → evidence-discovery, types/phase8`. Branded types (e.g., `DeliveryArtifactId`) prevent primitive obsession but are string-compatible — safe.

### 7.6 Test Coverage Gaps
**Finding: ACCEPTABLE.** 735 domain tests + 22 UI E2E/a11y tests. `evidence-discovery` (104 source files) would benefit from additional test coverage in future phases.

---

## 8. Breaking Change Policy

### BREAKING changes (require Architecture Freeze amendment)

The following actions constitute a breaking change to the frozen architecture:

1. **Removing or renaming** a public export from any package's `index.ts`
2. **Changing an entity interface** — adding required fields, removing fields, changing field types
3. **Changing an invariant** listed in §5
4. **Changing the evaluation order** in `PolicyEngine` (Actor → RBAC → ABAC → Visibility)
5. **Changing event type strings** (e.g., `'delivery.artifact.created'`)
6. **Changing artifact status transitions** — adding/removing valid transitions, changing terminal states
7. **Removing a pre-built template or subscription**
8. **Changing the ContentHash algorithm** from SHA-256
9. **Changing the idempotency key formula** (`artifactId + channelId + recipientId`)
10. **Bypassing the Published View → Delivery Artifact → Channel pipeline** (`Evidence Core → PDF` is forbidden)
11. **Adding cross-package dependencies** that create cycles
12. **Changing the W3C PROV mapping semantics**

### NON-BREAKING changes (allowed without amendment)

1. **Adding new exports** to any package
2. **Adding optional fields** to entity interfaces
3. **Adding new event types** (extending `AuditEventType` union)
4. **Adding new channel adapters** implementing `ChannelAdapter`
5. **Adding new renderers** implementing `ArtifactRenderer`
6. **Adding new subscription triggers**
7. **Adding new pre-built templates** to the registry
8. **Adding new evaluators** to the EvaluationPipeline
9. **Adding new connector adapters** (FDA, PubMed pattern)
10. **Adding new test files** — always allowed
11. **Refactoring internal implementation** (files not exported from `index.ts`)

### Amendment Process

1. Proposed breaking change must be documented in a new ADR (`docs/adr/`)
2. ADR must cite which invariant(s) are affected
3. Architecture Freeze v1.0 must be updated (v1.1, v1.2, …) with the change
4. All 735 domain tests must continue to pass
5. `npm run typecheck` must pass for all affected packages

---

## 9. Version Baseline

| Field | Value |
|-------|-------|
| **Document version** | Architecture Freeze v1.0 |
| **Date** | 2026-07-03 |
| **KEMS covered** | 001, 002, 003, 004, 005, 006, 007 |
| **Commit baseline (domain)** | `a67d5e93` — `feat(delivery-domain): implement KEMS-007 Delivery Architecture foundation` |
| **Commit baseline (UI)** | `4188319d` — `feat(web): implement Delivery Workspace UI — Sprint 9.12A-F` |
| **Packages frozen** | 9 (`evidence-core`, `evidence-discovery`, `evidence-lineage`, `published-view`, `policy-engine`, `provenance`, `provenance-graph`, `delivery-domain`, `types`) |
| **Domain tests** | 735 (14 test files, all passing) |
| **UI E2E tests** | 22 (15 Playwright + 7 A11y) |
| **TypeScript** | Zero errors across frozen packages |
| **Source files** | 293 across 9 packages |
| **Cross-package deps** | 2 (all others are leaf packages) |
| **Circular deps** | 0 |

---

## 10. Ratification

This Architecture Freeze is ratified as the canonical baseline for the Kadarn Platform Core. All subsequent phases (10–14) shall build upon this frozen foundation without modifying the KEMS-001 through KEMS-007 packages except through the Breaking Change Policy (§8).

**Ratified by:** Architecture audit, 2026-07-03  
**Next review:** Before Phase 10 code merge, or upon first breaking change proposal

---

*End of Architecture Freeze v1.0*
