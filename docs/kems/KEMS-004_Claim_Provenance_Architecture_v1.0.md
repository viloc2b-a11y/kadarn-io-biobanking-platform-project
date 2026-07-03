# KEMS-004 — Claim Provenance Architecture

**Version:** 1.0
**Status:** Canonical — Ratified for Phase 8
**Category:** Architecture Model
**Authority:** Defines the complete provenance chain for every Claim
**Date:** 2026-07-03
**Supersedes:** KEMS-002 §4.3 (Pipeline Flow)
**Depends on:** KEMS-001, KEMS-002, KEMS-003

---

## 1. Purpose

This document defines the canonical provenance chain for every Claim in Kadarn.

Every Claim must be traceable through:
- The Source that provided the evidence
- The Artifact that was processed
- The Extraction Run that produced Facts
- The Entity Resolution that linked to an identity
- The Rule Engine that generated the Claim Candidate
- The Review Events that validated or disputed it
- The Confidence computation inputs

**Core principle:** No Claim exists without complete, navigable provenance.

---

## 2. Provenance Chain

```
Source
  ↓
SourceVersion (snapshot of source at ingestion time)
  ↓
Artifact (raw document or data)
  ↓
ExtractionRun (parser + model + timestamp)
  ↓
ExtractedFact (individual fact with offset)
  ↓
EntityResolution (fact → canonical identity)
  ↓
NormalizedEntity (Institution, Site, PI, Lab, etc.)
  ↓
RuleApplication (rule engine → Claim Candidate)
  ↓
ClaimCandidate (proposed claim with confidence inputs)
  ↓
ReviewEvents (approval, rejection, counter-evidence, right-of-response)
  ↓
Claim (published, versioned, immutable)
  ↓
ConfidenceState (computed from Evidence Graph, not stored)
  ↓
PublishedView (consumer-facing, policy-filtered)
```

---

## 3. Object Definitions

### 3.1 Source

```typescript
interface Source {
  sourceId: string          // Unique identifier
  providerId: string        // 'pubmed', 'clinicaltrials.gov', 'upload', etc.
  sourceType: 'connector' | 'upload' | 'api' | 'internal'
  externalId?: string       // External identifier in source system
  sourceUrl?: string
  acquiredAt: string        // ISO timestamp
  metadata?: Record<string, unknown>
}
```

### 3.2 SourceVersion

```typescript
interface SourceVersion {
  sourceVersionId: string
  sourceId: string
  version: number           // Monotonic, per-source
  snapshot: Record<string, unknown>  // Immutable snapshot at ingestion time
  connectorVersion: string  // Adapter version
  ingestedAt: string
}
```

### 3.3 Artifact

```typescript
interface Artifact {
  artifactId: string
  sourceVersionId: string
  filename: string
  format: IntakeDocumentFormat
  mimeType: string
  sizeBytes: number
  sha256: string
  filePath: string
  registeredAt: string
}
```

### 3.4 ExtractionRun

```typescript
interface ExtractionRun {
  extractionRunId: string
  artifactId: string
  parserName: string        // 'markitdown', 'azure-di', etc.
  parserVersion: string
  modelName?: string        // AI model if applicable
  modelVersion?: string
  startedAt: string
  completedAt: string
  processingTimeMs: number
  warnings: ExtractionWarning[]
}
```

### 3.5 ExtractedFact

```typescript
interface ExtractedFact {
  factId: string
  extractionRunId: string
  factType: 'entity' | 'relationship' | 'claim' | 'capability' | 'asset' | 'biomarker'
  content: Record<string, unknown>
  offset: { startLine: number; endLine: number; order: number }
  confidence: number        // Extraction confidence (0.0-1.0), NOT Claim confidence
  extractedAt: string
}
```

### 3.6 NormalizedEntity

```typescript
interface NormalizedEntity {
  entityId: string          // Canonical ID
  entityType: 'institution' | 'site' | 'pi' | 'laboratory' | 'organization'
  canonicalName: string
  aliases: string[]
  rorId?: string
  gridId?: string
  npiId?: string
  orcidId?: string
  timeline: EntityTimelineEntry[]
  resolvedAt: string
}
```

### 3.7 ClaimCandidate

```typescript
interface ClaimCandidate {
  candidateId: string
  facts: string[]           // factIds used
  ruleId: string            // Which rule generated this
  ruleVersion: string
  claimType: ClaimType
  statement: string
  confidenceInputs: ConfidenceInput[]
  generatedAt: string
}
```

### 3.8 Claim

```typescript
interface Claim {
  claimId: string
  candidateId: string
  entityId: string
  claimType: ClaimType
  claimDefinitionId: string  // Schema version reference
  claimVersion: number
  statement: string
  status: 'proposed' | 'validated' | 'published' | 'disputed' | 'archived'
  evidenceGraph: EvidenceGraphReference
  reviewHistory: ReviewEvent[]
  provenanceChain: ProvenanceLink[]
  publishedAt?: string
  archivedAt?: string
}
```

### 3.9 Claim Provenance

```typescript
interface ClaimProvenance {
  claimId: string
  chain: ProvenanceLink[]
  // Every link captures: sourceId → targetId → transformation → timestamp → actor
  reconstructible: boolean  // True if full chain is navigable
  lastVerified: string
}
```

---

## 4. Immutable Rules

1. **Every Claim has exactly one ClaimProvenance.** No exceptions.
2. **Provenance is append-only.** Links are never modified after creation.
3. **Every Fact knows its SourceVersion, Parser, and Offset.**
4. **Facts are generated only through ExtractionRuns.** Never directly from documents.
5. **Claims are generated only through RuleApplications.** Never directly from Facts.
6. **Claims are versioned.** Modifications produce new ClaimVersions.
7. **Provenance chains are navigable in both directions.** Source → Claim and Claim → Source.
8. **No Claim is published without complete provenance.**

---

## 5. Integration with KDIE

KDIE (Document Intake Engine) produces:
- Artifact → NormalizedDocument → ExtractedFacts

Claim Provenance extends KDIE with:
- EntityResolution → ClaimCandidate → Claim → ConfidenceState → PublishedView

The boundary is: KDIE produces Facts. Everything after Facts is governed by this KEMS.

---

## 6. Required ADRs

- ADR-023 — Claim Provenance Implementation
- ADR-024 — Extraction Run Versioning
- ADR-025 — Fact-to-Claim Rule Engine

---

*Ratified for Phase 8 implementation. All subsequent Claim architecture must comply.*
