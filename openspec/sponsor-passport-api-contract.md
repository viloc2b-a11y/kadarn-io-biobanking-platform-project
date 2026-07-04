# RC-10.2 — Sponsor Institutional Passport API Contract

| Field | Value |
|---|---|
| Release | RC-10.2 |
| Status | **Approved — contract only** |
| Kind | HTTP + DTO specification (documentation) |
| Depends on | RC-10.1 (mock runtime UI); KUX-008 (Institutional Passport); KUX-006 (Sponsor Workspace) |
| Governs | Sponsor-facing read API for Institutional Passports in the Sponsor Intelligence Workspace |
| Explicitly out of scope | Route handlers, UI wiring, database, migrations, `packages/types`, `apps/api/openapi-v1.yaml` edits, KUX/KEMS edits |

---

## 0. Boundary declaration

This contract defines a **new, sponsor-authenticated API surface**. It is **not** a rename, alias, adapter, or extension of any existing passport API.

| Surface | Path | Audience | Relationship to RC-10.2 |
|---|---|---|---|
| **Sponsor Institutional Passport** (this contract) | `/api/v1/sponsor/passports/*` | Authenticated sponsor org members | **Authoritative for Sponsor Workspace** |
| Continuity / Public Passport | `/api/v1/continuity/passport/:slug` | Anonymous / public read | **Forbidden reuse** — different product law, lexicon, and identity model |
| Site Passport UI | `/site-passport/[slug]` | Public | **Forbidden reuse** — consumes Public Projection, not this contract |
| Public Projection / `PublishedViewService.getPassportResponse()` | Internal compatibility layer | Public views | **Forbidden reuse** — preserves legacy shapes (`confidence_score`, verification labels) |

> **The Sponsor Institutional Passport API is NOT `continuity/passport`.**  
> Implementations MUST NOT call `getPassportResponse()`, MUST NOT key reads on `public_slug`, and MUST NOT return legacy passport JSON shapes.

---

## 1. Product law (binding on all responses)

Subordinate to KUX-008 §0:

> The Institutional Passport is the living, explainable representation of institutional capability at a point in time.

Consequences for this API:

1. **Candidate register only** — claim and capability statements use evidence-suggesting language, never declarative certification.
2. **No aggregate institution scores** — confidence is per-claim/per-capability enum, never a numeric rollup.
3. **Temporal by default** — every passport detail includes `asOf`; the Context Bar reads "As of now" against this timestamp.
4. **Explainable** — every claim in detail includes minimal provenance; full Evidence Tree is available via the optional provenance sub-resource.
5. **Portfolio-scoped** — sponsors read passports only for institutions in their working portfolio (403 otherwise).

---

## 2. Forbidden lexicon and fields

The following MUST NOT appear in request parameters, response fields, schema definitions, or documented examples for this API:

### Forbidden field names

| Forbidden | Reason |
|---|---|
| `score`, `overallScore`, `confidence_score` | Aggregate or numeric scoring (KUX-008 §6) |
| `verification_status`, `verified`, `certified` | Certification register (Lexicon §4) |
| `rank`, `ranking`, `ranked` | Institution ordering by quality |
| `completeness`, `profileCompleteness`, `completenessPercent` | Profile-completion gamification |
| `public_slug`, `slug` (as primary read key) | Public Projection identity model |
| `trustLevel`, `trustScore`, `evidenceLevel` (as grade) | Legacy scorecard vocabulary |
| `gold`, `silver`, `bronze`, `badge` | Quality tier language |
| Legacy passport claim shape (`title` + numeric `confidence`) | `toLegacyPassportResponse()` compatibility layer |

### Forbidden example phrases

- "Verified site", "Kadarn verified", "This site has X"
- "Overall continuity score", "Profile 85% complete"
- "Gold-tier institution", "Top-ranked biobank"

### Allowed confidence vocabulary

Enum only: `High` | `Moderate` | `Low` | `Insufficient`  
Never a number. Never a percentage.

### Allowed stability vocabulary

Enum only: `Stable` | `Evolving` | `Under Review` | `Evidence Refresh Needed`  
This is a **knowledge-state indicator**, not a quality grade (KUX-007 §9).

---

## 3. Authentication and authorization

All endpoints require a valid Supabase JWT (Bearer) and active sponsor organization membership.

| HTTP | Condition | Error body |
|---|---|---|
| **401 Unauthorized** | Missing, expired, or invalid JWT | `{ "data": null, "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }` |
| **403 Forbidden** | Authenticated user is not a member of a sponsor org, or the requested institution is not in the caller's portfolio | `{ "data": null, "error": { "code": "FORBIDDEN", "message": "Institution not in sponsor portfolio" } }` |
| **404 Not Found** | `institutionId` or `claimId` does not exist, or no passport exists for the institution | `{ "data": null, "error": { "code": "NOT_FOUND", "message": "<resource> not found" } }` |

Notes:

- This API is **never anonymous**. Public passport reads remain exclusively on `continuity/passport` (out of scope).
- Portfolio membership rules are enforced server-side; clients MUST NOT infer access from institution visibility elsewhere.
- Rate limiting SHOULD follow existing sponsor/workspace patterns when implemented (RC-10.3+).

---

## 4. Response envelope

All successful responses use the existing Kadarn API envelope:

```json
{
  "data": { },
  "error": null
}
```

Error responses:

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Passport not found for institution inst-st-marys"
  }
}
```

---

## 5. Endpoints

Base path: `/api/v1/sponsor/passports`

### 5.1 Portfolio index

```
GET /api/v1/sponsor/passports
```

Returns the sponsor's portfolio institutions with passport summaries suitable for the index route (`/sponsor/passports`).

**Auth:** Required (401 if absent).  
**Success:** `200` — `{ data: { items: PassportInstitutionSummary[] }, error: null }`  
**Errors:** 401, 403

#### Response type: `PassportPortfolioIndexResponse`

```typescript
interface PassportPortfolioIndexResponse {
  items: PassportInstitutionSummary[]
}
```

#### Example (200)

```json
{
  "data": {
    "items": [
      {
        "institutionId": "inst-st-marys",
        "passportId": "passport-inst-st-marys",
        "displayName": "St. Mary's Hospital",
        "location": "London, United Kingdom",
        "stability": "Evolving",
        "memberSince": "2024-03-12",
        "summary": "Evidence suggests oncology biospecimen processing and cold-chain storage capabilities with one open gap on calibration records."
      }
    ]
  },
  "error": null
}
```

---

### 5.2 Passport detail

```
GET /api/v1/sponsor/passports/{institutionId}
```

Returns the full Institutional Passport for one portfolio institution. Aligns 1:1 with RC-10.1 detail route (`/sponsor/passports/[institutionId]`).

**Path parameters:**

| Name | Type | Description |
|---|---|---|
| `institutionId` | `string` | Stable institution identifier. Production implementations SHOULD use UUID; RC-10.1 mock uses opaque portfolio-scoped ids (e.g. `inst-st-marys`). |

**Auth:** Required.  
**Success:** `200` — `{ data: InstitutionalPassport, error: null }`  
**Errors:** 401, 403, 404

Each claim in the detail response MUST include **minimal provenance** (sufficient for the Right Context Panel Explain view without calling the provenance sub-resource).

#### Example (200) — claim excerpt

```json
{
  "data": {
    "passportId": "passport-inst-st-marys",
    "institutionId": "inst-st-marys",
    "displayName": "St. Mary's Hospital",
    "stability": "Evolving",
    "asOf": "2026-07-04T12:00:00.000Z",
    "identity": { "names": [], "locations": [], "relationships": [] },
    "capabilities": [],
    "claims": [
      {
        "id": "claim-pbmc-001",
        "taxonomyId": "biospecimen.processing.pbmc",
        "statement": "Evidence suggests on-site PBMC isolation with same-day processing windows",
        "confidence": "Moderate",
        "confidenceExplanation": "Supported by two Class B documents from 2025; no contradicting evidence on file.",
        "contested": false,
        "asOf": "2026-07-04",
        "provenance": {
          "documentTitle": "SOP: PBMC Isolation v3.2",
          "documentDate": "2025-09-14",
          "evidenceClass": "Class B — operational procedure",
          "excerpt": "Processing window documented as within 4 hours of draw for oncology cohorts."
        }
      }
    ],
    "recommendations": [],
    "history": []
  },
  "error": null
}
```

---

### 5.3 Claim provenance (optional lazy sub-resource)

```
GET /api/v1/sponsor/passports/{institutionId}/claims/{claimId}/provenance
```

Returns the **full Evidence Tree descent** for a single claim. Intended for lazy load when the user expands Explain beyond the minimal provenance embedded in the detail response.

**Status:** Specified in RC-10.2. **Not implemented** until a future release (RC-10.3+).

**Path parameters:**

| Name | Type | Description |
|---|---|---|
| `institutionId` | `string` | Institution identifier (same as detail) |
| `claimId` | `string` | Claim identifier from `InstitutionalPassport.claims[].id` |

**Auth:** Required.  
**Success:** `200` — `{ data: PassportClaimProvenanceDetail, error: null }`  
**Errors:** 401, 403, 404

The detail endpoint MUST remain usable without calling this sub-resource (RC-10.1 Right Context Panel works from minimal provenance alone).

---

## 6. DTO types (contract-only)

These types are defined in this document and implemented in code. Shared extraction to `packages/types` is deferred to RC-10.6+.

> **Alignment rule (RC-10.5):** Canonical wire DTOs live in `apps/api/src/lib/sponsor-passport/types.ts`. The web module `apps/web/src/components/sponsor/passport/passport-types.ts` mirrors them field-for-field. `PassportSectionId` is a **web-only UI extension** (section nav) and is not part of the API wire schema.

### 6.1 Enums

```typescript
type StabilityIndicator =
  | 'Stable'
  | 'Evolving'
  | 'Under Review'
  | 'Evidence Refresh Needed'

type ConfidenceLevel = 'High' | 'Moderate' | 'Low' | 'Insufficient'

type PassportSectionId =
  | 'identity'
  | 'capabilities'
  | 'claims'
  | 'recommendations'
  | 'history'

type CapabilityTemporalState = 'fresh' | 'aging' | 'decayed'
```

### 6.2 Index

```typescript
interface PassportInstitutionSummary {
  institutionId: string
  passportId: string
  displayName: string
  location: string
  stability: StabilityIndicator
  memberSince: string   // ISO 8601 date (YYYY-MM-DD)
  summary: string       // Candidate register; one-line portfolio card copy
}
```

### 6.3 Detail — sections (KUX-008 MVP)

```typescript
interface PassportIdentityField {
  label: string
  value: string
  source: string
}

interface PassportIdentity {
  names: PassportIdentityField[]
  locations: PassportIdentityField[]
  relationships: PassportIdentityField[]
}

interface PassportCapability {
  id: string
  taxonomyId: string
  label: string
  candidateStatement: string
  confidence: ConfidenceLevel
  temporalState: CapabilityTemporalState
  supportingClaimIds: string[]
}

interface PassportClaimProvenanceMinimal {
  documentTitle: string
  documentDate: string   // ISO 8601 date or human-readable date string
  evidenceClass: string
  excerpt: string
}

interface PassportClaim {
  id: string
  taxonomyId: string
  statement: string
  confidence: ConfidenceLevel
  confidenceExplanation: string
  contested: boolean
  asOf: string           // ISO 8601 date (YYYY-MM-DD) — claim freshness marker
  provenance: PassportClaimProvenanceMinimal
}

interface PassportRecommendation {
  id: string
  action: string
  reason: string
  expectedImpact: string
  isNextAction: boolean
}

interface PassportHistoryEvent {
  id: string
  occurredAt: string   // ISO 8601 datetime
  eventType: string
  description: string
  actor?: string
}

interface InstitutionalPassport {
  passportId: string
  institutionId: string
  displayName: string
  stability: StabilityIndicator
  asOf: string         // ISO 8601 datetime — passport snapshot moment
  identity: PassportIdentity
  capabilities: PassportCapability[]
  claims: PassportClaim[]
  recommendations: PassportRecommendation[]
  history: PassportHistoryEvent[]
}
```

### 6.4 Provenance sub-resource (lazy — not in RC-10.1 mock)

Extends minimal provenance with Evidence Tree structure for deep Explain (KUX-008 §3.10).

```typescript
interface PassportEvidenceNode {
  id: string
  evidenceClass: string
  label: string
  sourceDocumentId?: string
  supportsClaim: boolean
  excerpt?: string
}

interface PassportSourceDocument {
  id: string
  title: string
  documentDate: string
  evidenceClass: string
}

interface PassportClaimProvenanceDetail {
  claimId: string
  institutionId: string
  statement: string
  confidence: ConfidenceLevel
  confidenceExplanation: string
  contested: boolean
  asOf: string
  minimal: PassportClaimProvenanceMinimal
  evidenceNodes: PassportEvidenceNode[]
  sourceDocuments: PassportSourceDocument[]
  contradictingNodeIds?: string[]
}
```

---

## 7. RC-10.1 mock runtime mapping

The RC-10.1 mock runtime (`passport-mock-data.ts`, `passport-types.ts`) maps to this contract without transformation:

| RC-10.1 source | Contract endpoint | Contract type |
|---|---|---|
| `getPortfolioInstitutions()` | `GET /sponsor/passports` | `PassportInstitutionSummary[]` via `PassportPortfolioIndexResponse.items` |
| `getPassportByInstitutionId(id)` | `GET /sponsor/passports/{institutionId}` | `InstitutionalPassport` |
| Claim selection → `PassportReasoningPanel` | Embedded `PassportClaim.provenance` | `PassportClaimProvenanceMinimal` |
| (Future deep Explain) | `GET .../claims/{claimId}/provenance` | `PassportClaimProvenanceDetail` |

**UI routes (unchanged):**

| UI route | API call (future RC-10.4) |
|---|---|
| `/sponsor/passports` | `GET /api/v1/sponsor/passports` |
| `/sponsor/passports/[institutionId]` | `GET /api/v1/sponsor/passports/{institutionId}` |

No field renaming, flattening, or legacy adapter is permitted at the UI boundary.

---

## 8. Implementation phases (informational)

| Release | Scope |
|---|---|
| **RC-10.2** (this document) | Contract specification only |
| RC-10.3 | Stub/mock route handlers; optional `packages/types` extraction |
| RC-10.4 | UI wiring — replace `passport-mock-data.ts` with API fetch |
| RC-10.5+ | Evidence Core adapter; portfolio membership persistence |

---

## 9. Gate — RC-10.2

| Criterion | Status |
|---|---|
| Contract document exists at `openspec/sponsor-passport-api-contract.md` | PASS |
| Explicitly states NOT `continuity/passport` | PASS |
| Forbidden lexicon absent from schema and examples | PASS |
| Index, detail, and provenance endpoints specified | PASS |
| Auth rules 401 / 403 / 404 documented | PASS |
| DTOs align 1:1 with RC-10.1 `passport-types.ts` | PASS |
| Minimal provenance in detail; lazy provenance sub-resource defined, not implemented | PASS |
| No route handlers, UI, DB, package, OpenAPI, KUX, or KEMS changes | PASS |

**RC-10.2 — ACCEPTED (contract only).**
