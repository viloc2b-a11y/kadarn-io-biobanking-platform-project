# Kadarn MVP Evidence Pipeline Design

Sprint 5 changes the Documents module from a Dropbox-style upload area into the entry point for Kadarn's Evidence Pipeline. Documents are not primary entities. They are source material that produces evidence objects, extracted facts, provenance, claims, and confidence graph relationships.

## Design Rule

```text
Upload
  -> OCR / Conversion
  -> Extraction
  -> Evidence Objects
  -> Extracted Facts
  -> Claim Candidates
  -> Confidence Graph
  -> Document remains supporting source
```

Never:

```text
Document
  -> Document
  -> Document
```

Documents are evidence. They are not the product, the graph, or the institutional model.

## Current Problem

The current `/onboarding/documents` page already uses evidence language and converts uploaded files to markdown, but the user experience still behaves like a document repository:

- The main action is drag/drop upload.
- Uploaded items are listed as files.
- The taxonomy is displayed as a document checklist.
- The system does not yet show extracted facts, evidence objects, claim candidates, or provenance.

This creates the wrong mental model. Users may believe success is "upload more documents." Kadarn's real model is "convert evidence into institutional knowledge."

## Target Mental Model

| Old mental model | New mental model |
|---|---|
| Upload documents. | Submit evidence sources. |
| Track files. | Extract facts and evidence objects. |
| Complete document checklist. | Build claims backed by evidence. |
| Documents prove themselves. | Evidence objects support or weaken claims. |
| User summarizes documents manually. | Kadarn extracts facts and asks for confirmation only when needed. |

## Pipeline Stages

| Stage | Purpose | Output | Owner |
|---|---|---|---|
| Upload | Accept source file and metadata. | `EvidenceSource` / `SourceVersion` candidate. | Documents UI. |
| OCR / Conversion | Convert PDF/DOCX/image/etc. into machine-readable text. | `EvidenceArtifact` with text and content hash. | Document intake / conversion engine. |
| Classification | Identify document type, domain, linked entity, and likely capability area. | `DocumentClassification`. | Extraction engine. |
| Extraction | Extract structured facts from text/tables/forms. | `ExtractedFact[]`. | Extraction engine. |
| Entity resolution | Match extracted facts to Institution, Location, Person, Laboratory, Equipment. | `EntityResolutionCandidate[]`. | Knowledge/entity resolver. |
| Evidence object creation | Create evidence objects that can support claims. | `EvidenceObject[]` / Evidence Nodes. | Evidence Core boundary. |
| Claim candidate generation | Turn facts into proposed claims. | `ClaimCandidate[]`. | Claim engine / knowledge engine. |
| Provenance recording | Preserve source, extraction run, model/rule version, offsets, confidence. | `ClaimProvenance` / provenance graph nodes. | Evidence lineage / provenance. |
| Human review | Confirm uncertain facts, conflicts, and claim candidates. | Accepted/rejected/edited candidates. | User + review UI. |
| Confidence graph update | Link claims, evidence, counter-evidence, and confidence inputs. | Confidence graph read model. | Evidence graph + confidence engine. |
| Derived outputs | Project into Capabilities, Readiness, Passport, Memory, Roadmap. | Readonly outputs. | Product projections. |

## MVP Data Objects

| Object | Definition | Notes |
|---|---|---|
| `EvidenceSource` | User-submitted original source. | File name, mime type, size, uploaded time, submitter, source origin. |
| `SourceVersion` | Immutable version of the source content. | Content hash prevents silent mutation. |
| `EvidenceArtifact` | Machine-readable artifact produced from the source version. | Markdown/text, OCR output, page structure, tables. |
| `ExtractionRun` | Execution record for parser/OCR/model/rule extraction. | Tool version, timestamp, success/failure, logs. |
| `ExtractedFact` | Atomic factual statement extracted from artifact. | Value, type, source span, confidence, normalized representation. |
| `EvidenceObject` | Evidence node/object that can support, weaken, corroborate, or contradict a claim. | Document remains attached as source support. |
| `ClaimCandidate` | Proposed claim derived from facts before review/promotion. | Not canonical truth yet. |
| `ClaimProvenance` | Reconstruction path from source to fact to claim. | Required for trust and review. |
| `ConfidenceGraphEdge` | Relationship between claim and evidence object. | Supports, contradicts, corroborates, supersedes. |

## State Transition Model

```text
uploaded
  -> converted
  -> classified
  -> extracted
  -> entity_resolution_pending
  -> evidence_objects_created
  -> claim_candidates_created
  -> review_pending
  -> accepted_into_graph
  -> projected
```

Failure states:

```text
conversion_failed
classification_failed
extraction_failed
entity_resolution_conflict
human_review_rejected
superseded
```

## Documents UI Redesign Logic

The Documents page should become an Evidence Pipeline page with these sections:

1. **Submit Evidence**
   - Upload source files.
   - Explain that files become evidence objects and claims.

2. **Processing Pipeline**
   - Show each uploaded source by pipeline stage.
   - Example: Uploaded -> Converted -> Extracted -> Claims Proposed.

3. **Extracted Facts**
   - Show facts Kadarn found.
   - Include source snippets or page references.
   - Let user confirm, reject, or resolve conflicts.

4. **Evidence Objects**
   - Show evidence objects created from documents.
   - Link to Institution, Location, Person, Laboratory, Equipment.

5. **Claim Candidates**
   - Show claims proposed by extraction.
   - Include supporting facts and evidence class.

6. **Graph Impact**
   - Show what changed in Capabilities, Readiness, Passport, Memory, and Roadmap.

## Example Pipeline: CLIA Certificate

```text
Upload CLIA Certificate PDF
  -> OCR / conversion extracts text
  -> classification: Regulatory / Laboratory / CLIA Certificate
  -> extracted facts:
       CLIA number
       laboratory name
       certificate type
       specialties/testing categories
       expiration date
       lab address
  -> entity resolution:
       match/create Laboratory
       match/create Location
  -> evidence object:
       CLIA Certificate evidence node
  -> claim candidates:
       Laboratory exists
       Laboratory has regulated testing authority
       Clinical testing capability supported
  -> confidence graph:
       CLIA evidence supports Laboratory Operations claim
  -> projections:
       Capabilities: Sample Processing / Clinical Testing strengthened
       Readiness: Laboratory readiness improves
       Passport: active evidence appears
       Roadmap: lab certification gap removed
```

## Example Pipeline: FDA Form 1572

```text
Upload FDA Form 1572
  -> conversion extracts form text/fields
  -> classification: Regulatory / Study Site / FDA 1572
  -> extracted facts:
       investigators
       facilities
       laboratories
       IRB
       protocol
       sponsor
       site address
  -> entity resolution:
       match/create Person records
       match/create Location records
       match/create Laboratory records
  -> evidence objects:
       1572 evidence node
       site/facility evidence links
  -> claim candidates:
       Institution has study execution history
       Investigator coverage exists
       Site operations capability exists
  -> confidence graph:
       1572 supports research operations and site readiness claims
  -> projections:
       People, Locations, Memory, Capabilities, Passport, Roadmap update
```

## Document-to-Graph Rules

| Rule | Design decision |
|---|---|
| A document is never the final entity. | It is a source/version/artifact that can produce evidence objects and facts. |
| Extracted facts are not claims. | Facts feed claim candidates. |
| Claim candidates are not accepted claims. | They require confidence, evidence links, and possibly human review. |
| Evidence objects can support multiple claims. | One CLIA certificate may support lab existence, regulatory readiness, and clinical testing. |
| Claims must preserve provenance. | Every claim should be reconstructable back to source, extraction run, and fact spans. |
| Derived outputs are readonly. | Capabilities, Readiness, Passport, and Roadmap consume graph state. |
| Conflicts do not overwrite silently. | Contradictions create review tasks or counter-evidence. |

## Evidence Classes

Documents should be transformed into evidence objects with classes or confidence inputs. MVP classes can align with existing Evidence Class labels:

| Class | Meaning in pipeline |
|---|---|
| A | Authoritative regulatory/legal/certification evidence. |
| B | Strong operational evidence such as insurance, equipment qualification, SOPs, contracts. |
| C | Training, procedural, or internally maintained evidence. |
| D | Supporting or uploaded contextual evidence. |
| Counter-evidence | Evidence that weakens or contradicts a claim. |

## Required Provenance Metadata

Every extracted fact and claim candidate should track:

- Source file id.
- Source version / content hash.
- Artifact id.
- Extraction run id.
- Parser/OCR/model/rule version.
- Source span: page, section, table, row, or character offsets when possible.
- Extracted value.
- Normalized value.
- Extraction confidence.
- Human review state.
- Created/accepted/rejected timestamps.

## Current MVP Gap Analysis

| Current behavior | Gap | Correction |
|---|---|---|
| Upload creates `UploadedDoc`. | No source/version/artifact distinction. | Split source, version, artifact, extraction run. |
| MarkItDown conversion stores markdown on `UploadedDoc`. | Converted text is attached to file record, not an artifact. | Store as `EvidenceArtifact`. |
| Taxonomy row checks whether uploaded label matches document title. | Classification is filename-based and weak. | Add document classification stage. |
| No extracted facts visible. | User cannot see what Kadarn learned. | Add extracted facts review panel. |
| No entity resolution. | Documents do not create Institution/Location/Person/Lab/Equipment objects. | Add entity resolution candidates. |
| No claim candidate review. | Documents do not visibly become claims. | Add claim candidate stage. |
| Passport assembler uses uploaded docs directly. | Bypasses evidence graph semantics. | Passport should consume graph-derived evidence objects and claims. |

## MVP Implementation Slices

### Slice 1 — Rename the mental model

Change Documents copy and structure:

- "Documents" may remain as navigation label.
- Page title should become "Evidence Pipeline".
- Uploaded list should become "Submitted Evidence Sources".
- Taxonomy should become "Evidence Coverage Map".

### Slice 2 — Add pipeline status model

Extend local MVP state with pipeline statuses:

```typescript
type EvidencePipelineStatus =
  | 'uploaded'
  | 'converted'
  | 'classified'
  | 'extracted'
  | 'review_pending'
  | 'accepted_into_graph'
  | 'failed'
```

### Slice 3 — Add extraction review buffer

Introduce:

```typescript
interface ExtractedFactCandidate {
  id: string
  sourceDocumentId: string
  label: string
  value: string
  targetObject: 'Institution' | 'Location' | 'Person' | 'Laboratory' | 'Equipment' | 'CapabilityClaim' | 'TimelineEvent'
  confidence: 'high' | 'medium' | 'low'
  sourceSnippet: string
  reviewStatus: 'pending' | 'accepted' | 'rejected'
}
```

### Slice 4 — Generate claim candidates

Introduce:

```typescript
interface ClaimCandidate {
  id: string
  claim: string
  subjectType: string
  subjectId: string
  supportingFactIds: string[]
  supportingEvidenceIds: string[]
  confidence: 'high' | 'medium' | 'low'
  reviewStatus: 'pending' | 'accepted' | 'rejected'
}
```

### Slice 5 — Project graph impact

Show impact cards:

- "3 facts extracted."
- "1 Laboratory identified."
- "2 claim candidates proposed."
- "Laboratory readiness can improve after review."

## Acceptance Check

Sprint 5 is complete when:

- The Documents page no longer feels like a Dropbox.
- Uploads are presented as evidence sources entering a pipeline.
- Conversion/OCR, extraction, evidence objects, claim candidates, and graph impact are visible concepts.
- Documents remain linked as support, not as primary entities.
- Extracted facts and claim candidates have provenance back to the source artifact.
- Capabilities, Readiness, Passport, and Roadmap consume evidence graph outputs, not raw document lists.
