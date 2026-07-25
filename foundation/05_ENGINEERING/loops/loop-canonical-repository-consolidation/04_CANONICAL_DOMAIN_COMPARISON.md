# Phase 4 — Canonical Domain Comparison

## Methodology

Semantic comparison of C (retiring) vs D (canonical) capabilities. Classification per Loop spec.

## Institutional Structure

| Capability | D Status | C Status | Classification |
|-----------|----------|----------|---------------|
| Institution | ✅ `organizations` table (008) | ✅ Same | PRESENT IN D AND SUPERIOR — D has institution-scoped API routes |
| Person | ✅ `people` table (062), type, repository, API | ❌ Not in C | PRESENT IN D AND SUPERIOR |
| Location | ✅ `locations` table (063), type, repository, API | ❌ Not in C | PRESENT IN D AND SUPERIOR |
| Membership | ✅ `memberships` table (064), type, repository, API | ❌ Not in C | PRESENT IN D AND SUPERIOR |
| Role | ✅ API routes, type | ❌ Not in C | PRESENT IN D AND SUPERIOR |
| Credential | ✅ Positioning docs, schema refs | ❌ Not in C | PRESENT IN D AND SUPERIOR |
| Capability | ✅ `capabilities` table (065), type, API | ❌ Not in C | PRESENT IN D AND SUPERIOR |

## Evidence Architecture

| Capability | D Status | C Status | Classification |
|-----------|----------|----------|---------------|
| Claim | ✅ `claims` table (045, consolidated 066), type, API | ✅ Basic claim in C | PRESENT IN D AND SUPERIOR — D has consolidation, person_id, tags |
| Evidence | ✅ `evidence_nodes` (045) with JSONB, append-only, class enum | ✅ `evidence` table (023) | PRESENT IN D AND SUPERIOR — D has append-only, class system, RLS |
| EvidenceSource | ✅ `evidence_sources` (073) with source_type, producer_type, authority_level | ✅ `evidence_sources` (023) with source_class enum | PRESENT IN BOTH — REQUIRES RECONCILIATION — D's enum model is richer |
| SourceRecord | ✅ `source_records` (074) with lifecycle, temporal, hash, locator | ✅ `source_records` (024, extended 027) | PRESENT IN BOTH — REQUIRES RECONCILIATION — D has acquisition_status enum, C has supersession |
| ClaimEvidenceLink | ❌ Not in D — D uses `evidence_relationships` (node-to-node) | ✅ `claim_evidence_links` (028) with SUPPORTS/CONTRADICTS | ONLY PRESENT IN C — PORT REQUIRED — but D has `evidence_relationships` for evidence-to-evidence |
| Generation Rules | ❌ Not in D | ✅ `evidence_generation_rules` (025, extended 027) | ONLY PRESENT IN C — PORT REQUIRED |
| Provenance | ✅ Evidence has `wasRevisionOf` pattern, JSONB provenance | ✅ `generation_rule_id`, `input_hash` on evidence | PRESENT IN BOTH — REQUIRES RECONCILIATION |
| Lifecycle | ✅ `evidence_node_status` enum (active/superseded/disputed/resolved) | ✅ `acquisition_status`, supersession on source_records | PRESENT IN BOTH — D for evidence nodes, C for source records |
| Security Classification | ❌ Not in D | ✅ Comments in 026 (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED) | ONLY PRESENT IN C — PORT REQUIRED |
| Supersession | ✅ `wasRevisionOf` pattern, `supersedes` relationship type | ✅ `superseded_by` on source_records | PRESENT IN BOTH — REQUIRES RECONCILIATION |
| Contradiction semantics | ✅ `contradicts` in evidence_relationship_type | ✅ `CONTRADICTS` in claim_evidence_links | PRESENT IN BOTH — D at evidence-evidence level, C at claim-evidence level |

## Event Architecture

| Capability | D Status | C Status | Classification |
|-----------|----------|----------|---------------|
| InstitutionalEvent | ❌ No `institutional_events` table | ✅ `institutional_events` (022) with full schema | ONLY PRESENT IN C — PORT REQUIRED |
| Append-only ledger | ❌ Not as standalone table | ✅ Designed as append-only | ONLY PRESENT IN C — PORT REQUIRED |
| Correlation | ❌ | ✅ `correlation_id` column | ONLY PRESENT IN C — PORT REQUIRED |
| Causation | ❌ | ✅ `causation_id` column | ONLY PRESENT IN C — PORT REQUIRED |
| Idempotency | ❌ | ✅ `idempotency_key` with unique constraint | ONLY PRESENT IN C — PORT REQUIRED |
| Event producers/consumers | ✅ `domain-events` package, `event-bus` | ✅ `domain-events` package, events route | PRESENT IN BOTH — D has event bus, C has API route |
| Event store | ✅ `platform-services/event-bus` | ✅ In-memory Map (DEPRECATED in C code) | PRESENT IN D AND SUPERIOR — D has proper event bus, C uses global Map |
| Tenant isolation | ✅ RLS on all tables | ✅ `tenant_id` on events and links | PRESENT IN BOTH — D via RLS, C via explicit column |

## Publication Architecture

| Capability | D Status | C Status | Classification |
|-----------|----------|----------|---------------|
| Passport | ✅ `passport_entries` (069), API, public sharing route | ❌ Not in C | PRESENT IN D AND SUPERIOR |
| ShareGrant | ✅ `shares` table (070), API | ❌ Not in C | PRESENT IN D AND SUPERIOR |
| Controlled disclosure | ✅ `public/passport/[token]` route | ❌ | PRESENT IN D AND SUPERIOR |
| Revocation | ✅ Share API | ❌ | PRESENT IN D AND SUPERIOR |
| Expiration | ✅ Passport entries | ❌ | PRESENT IN D AND SUPERIOR |
| Access audit | ✅ Audit events | ❌ | PRESENT IN D AND SUPERIOR |

## UI and APIs

| Capability | D Status | C Status | Classification |
|-----------|----------|----------|---------------|
| Core views | ✅ Full workspace UI | ✅ UI prototype HTML | PRESENT IN D AND SUPERIOR |
| Upload flow | ✅ Document intake pipeline | ❌ | PRESENT IN D AND SUPERIOR |
| Evidence review | ✅ Review workflow API (067) | ❌ | PRESENT IN D AND SUPERIOR |
| Claim evidence | ✅ Claims API with confidence, reviews | ✅ events.ts route | PRESENT IN D AND SUPERIOR |
| Passport generation | ✅ Passport API (069) | ❌ | PRESENT IN D AND SUPERIOR |
| Sharing | ✅ Shares API (070) | ❌ | PRESENT IN D AND SUPERIOR |
| Mocks vs real data | ✅ Mix (sponsor passport has mock handlers) | ✅ Global Map (mock) | PRESENT IN BOTH — both have mock patterns to clean up |

## Frozen Storage

| Capability | Classification |
|-----------|---------------|
| Frozen Storage PoC | PROOF OF CONCEPT ONLY — C commit f38425e test. Do not port as production. |

## Summary Classification

### PORT REQUIRED (from C → D)

1. **Institutional Event Ledger** — table, append-only, correlation, causation, idempotency
2. **Evidence Generation Rules** — versioned rule registry, rule execution metadata
3. **Claim-Evidence Links** — canonical relational linking (SUPPORTS/CONTRADICTS/REQUIRES_REVIEW)
4. **Security Classification** — forward-only classification comments

### REQUIRES RECONCILIATION

5. **EvidenceSource** — D's enum model (source_type, producer_type, authority_level) vs C's (source_class). Keep D's, extend if needed.
6. **SourceRecord** — D has (074) with lifecycle/temporal. C has supersession and extended provenance. Merge C's supersession into D.
7. **Provenance** — D has `wasRevisionOf` for evidence nodes. C has generation provenance (rule_id, input_hash). Add C's generation provenance to D.

### PRESENT IN D AND SUPERIOR (no port needed)

- Person, Location, Membership, Role, Credential, Capability
- Claim (consolidated)
- Evidence (append-only, class system, RLS)
- Passport, ShareGrant, controlled disclosure
- UI, API routes, document intake
- Event bus (platform-services)

### PROOF OF CONCEPT ONLY (do not port)

- Frozen Storage (C commit f38425e)

### Key Architectural Decision

D is the architectural base. C's capabilities that need porting are:
1. Event Ledger (new table + API)
2. Generation Rules (new table + service)
3. Claim-Evidence Links (new table, bridging claims and evidence)
4. Security Classification (documentation comments on existing tables)

These will be implemented as forward-only migrations 075+ in D.
