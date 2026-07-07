# ORP-1.4 — Document → Evidence Integration

**Program:** ORP-1.0 — Onboarding Refactoring & Architecture Alignment  
**Purpose:** Connect onboarding Documents to Evidence Core through the existing Evidence Pipeline.  
**Gate:** Every uploaded document generates Evidence Objects.

## Objective

Connect Documents with Evidence Core.

Documents must stop behaving like files in storage. Every uploaded source should enter the Evidence Pipeline and produce evidence objects, claim links, and provenance.

```text
Upload
  -> OCR
  -> Extraction
  -> Evidence Objects
  -> Claims
  -> Confidence Graph
```

Not:

```text
Upload
  -> Storage
```

## Current Behavior

The current Documents page already accepts uploads and calls a conversion endpoint. The file can become markdown and is stored as an `UploadedDoc` in onboarding state.

That is a good first step, but it is not yet Evidence Core integration.

Current shape:

```text
File
  -> UploadedDoc
  -> optional markdown conversion
  -> local onboarding state
  -> fuzzy taxonomy display match
```

Target shape:

```text
File
  -> EvidenceSource
  -> SourceVersion
  -> EvidenceArtifact
  -> ExtractedFact[]
  -> EntityResolutionCandidate[]
  -> EvidenceObject[]
  -> ClaimCandidate[]
  -> ClaimProvenance
  -> ConfidenceGraphEdge[]
  -> Projection updates
```

## Pipeline Requirements

| Stage | Required output | Notes |
|---|---|---|
| Upload | `EvidenceSource` | Original submitted file and submitter/source metadata. |
| Source versioning | `SourceVersion` | Immutable content hash and version record. |
| OCR / conversion | `EvidenceArtifact` | Machine-readable text/markdown plus conversion metadata. |
| Metadata | `DocumentClassification` | Document type, taxonomy ID, linked entity, likely capability area, expiration relevance. |
| Extraction | `ExtractedFact[]` | Atomic structured facts with source spans and confidence. |
| Entity resolution | `EntityResolutionCandidate[]` | Match or create Institution, Person, Location, Laboratory, Equipment, etc. |
| Evidence object creation | `EvidenceObject[]` | Evidence nodes that support, weaken, corroborate, contradict, or supersede claims. |
| Claim linking | `ClaimCandidate[]` | Claims proposed from facts and evidence. |
| Evidence linking | `ConfidenceGraphEdge[]` | Relationships between claims and evidence objects. |
| Provenance | `ClaimProvenance` | Reconstructable source -> artifact -> fact -> evidence -> claim path. |
| Projection updates | Read models | Passport, Capabilities, Readiness, Roadmap, and Continuity update from graph outputs. |

## Activities

### OCR / Conversion

Use existing conversion behavior as the first artifact stage. Preserve:

- converter name/version
- converted text or markdown
- character count
- conversion timestamp
- failure state
- source file metadata

### Extraction

Extract structured facts from artifacts.

Examples:

- CLIA number
- license number
- expiration date
- investigator name
- location address
- lab name
- equipment ID
- SOP domain
- training completion date

### Metadata

Attach document metadata beyond filename:

- taxonomy ID
- linked entity type
- linked entity ID when known
- evidence class
- issue date
- expiration date
- document status
- version
- source origin

### Claim Linking

Generate claim candidates from extracted facts.

Examples:

- Laboratory exists.
- Laboratory has regulated testing authority.
- Person has active medical license.
- Site has IATA-trained shipping support.
- Facility has documented storage controls.

### Evidence Linking

Create explicit relationships:

- supports
- contradicts
- corroborates
- supersedes
- source

Documents should support claims through evidence objects, not by being treated as proof by themselves.

### Provenance

Every extracted fact and claim candidate must be reconstructable.

Required provenance:

- source document ID
- source version/content hash
- artifact ID
- extraction run ID
- source span or page/snippet where possible
- extraction confidence
- reviewer action where applicable

## Document Types and Expected Evidence Objects

| Document type | Evidence objects generated | Claims enabled |
|---|---|---|
| CLIA Certificate | Lab certification evidence, lab identity facts, expiration evidence. | Laboratory exists, regulated testing authority, clinical testing readiness. |
| Medical License | Person credential evidence, license validity evidence. | Person qualification, clinical role support. |
| CV | Person experience evidence, education, publications, role history. | Investigator expertise, therapeutic experience, study history. |
| FDA Form 1572 | Investigator, facility, lab, IRB, sponsor facts. | Study execution history, investigator coverage, facility/lab linkage. |
| SOP | Procedure evidence, capability process evidence. | Capability support, operational maturity. |
| Equipment IQ/OQ/PQ | Equipment qualification evidence. | Equipment readiness, lab/storage capability support. |
| Shipping SOP | Logistics process evidence. | Domestic/international shipping, chain-of-custody support. |
| Temperature Logs | Storage/monitoring evidence. | Cold chain monitoring, biospecimen storage reliability. |

## UI Requirements

Documents UI should show pipeline state, not only uploaded files.

Required sections:

- Submit Evidence
- Processing Pipeline
- Extracted Facts
- Evidence Objects
- Claim Candidates
- Provenance
- Graph Impact

Each uploaded document should show:

- upload status
- conversion/OCR status
- extraction status
- evidence object count
- claim candidate count
- review status
- projection impact

## Non-Regression Rule

ORP-1.4 must preserve upload usability while changing the backend meaning.

Allowed:

- local `UploadedDoc` compatibility during migration
- converted markdown previews
- taxonomy display as guidance
- pending extraction states
- review queues for uncertain facts

Not allowed:

- treating upload count as evidence completeness
- using documents as standalone proof without evidence objects
- losing source/provenance metadata
- creating claims without evidence links
- silently overwriting canonical objects from extraction

## Deliverables

- Document → Evidence Integration plan.
- Evidence Pipeline mapping for Documents.
- Document metadata model.
- Claim/evidence linking map.
- Provenance requirements.
- UI pipeline state requirements.

## Gate

ORP-1.4 is complete when:

- every uploaded document creates or references an `EvidenceSource`
- every successfully processed document produces at least one `EvidenceObject` or a documented `no_extractable_evidence` state
- claim candidates link to evidence objects
- provenance exists from source document to extracted fact and claim candidate
- Passport, Capabilities, Readiness, Roadmap, and Continuity consume graph outputs, not raw document counts
