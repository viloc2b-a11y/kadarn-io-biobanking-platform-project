# Phase 4 — Evidence Generation Report

## 1. Current State

Evidence generation infrastructure (from Loop C forward-port):
- `evidence_generation_rules` table (077) — rule registry
- `evidence_nodes` columns (077): `generation_rule_id`, `input_hash`, `generator`, `generated_at`, `source_record_id`
- `LineageService` (placeholder, no DB queries)

**No generation pipeline executor exists.** No code transforms SourceRecords into Evidence via Rules.

## 2. Required Pipeline

```
Input: SourceRecord / InstitutionalEvent / External Registry / Manual Observation
   ↓
[1] Select applicable Generation Rule (match event_pattern, check preconditions)
   ↓
[2] Validate inputs against rule.required_inputs
   ↓
[3] Compute input_hash (deterministic hash of all inputs)
   ↓
[4] Execute generator (rule-specific transformation)
   ↓
[5] Create evidence_node with:
    - generation_rule_id (FK to rule)
    - input_hash (deterministic)
    - generator (name/version of executor)
    - generated_at (timestamp)
    - source_record_id (FK to input source)
    - evidence_class (from rule.output_evidence_type)
    - content (generator output)
    - status (default: 'generated' in new lifecycle)
   ↓
[6] Return evidence with generation metadata
```

## 3. Deterministic Replay

**Requirement:** Given the same SourceRecord + Rule, replaying must produce identical Evidence.

**Implementation:**
- `input_hash` = SHA-256 of (source_record.content_hash + rule.id + rule.rule_version + sorted inputs)
- Replay: fetch SourceRecord by id, fetch Rule by id, recompute, compare `input_hash` and output `content`
- If `input_hash` matches, output must match (deterministic generator)
- If output differs, flag as anomaly (non-deterministic generator — violates spec)

## 4. Design

### GenerationPipelineService
```typescript
class GenerationPipelineService {
  // Generate evidence from a source record using a rule
  async generate(input: {
    source_record_id: string
    rule_id: string
    tenant_id: string
  }): Promise<{ evidence: Evidence; metadata: GenerationMetadata }>

  // Replay a generation and verify determinism
  async replay(evidence_id: string): Promise<{
    input_hash_matches: boolean
    output_matches: boolean
    replayed_evidence: Evidence
  }>
}
```

### Generator Registry
Generators are named functions registered in code:
```typescript
interface Generator {
  name: string
  version: string
  execute(inputs: Record<string, unknown>): string  // returns content
}
```

The `generator` column on `evidence_nodes` stores `name@version`. The registry maps this to the function.

**Note:** Generators are code, not DB entities. Rules reference generators by convention (`output_evidence_type` + `event_pattern` imply which generator to use). This is intentional — generators are implementation, rules are governance.

## 5. Gaps

| # | Gap | Severity | Fix |
|---|-----|----------|-----|
| 1 | No generation pipeline executor | HIGH | Create `GenerationPipelineService` |
| 2 | No generator registry | HIGH | Create generator registry with named functions |
| 3 | No replay mechanism | HIGH | Implement replay with hash comparison |
| 4 | No `GenerateEvidenceSchema` in types | MEDIUM | Add Zod schema for generation input |
| 5 | No `ReplayResultSchema` in types | LOW | Add Zod schema for replay output |

## 6. Verdict

**Evidence generation is 0% implemented.** The DB schema supports it (077 columns exist), but no executor code exists. This is the largest implementation effort in Loop 2.
