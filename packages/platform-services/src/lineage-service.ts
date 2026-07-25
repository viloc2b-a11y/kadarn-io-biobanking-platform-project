// ─── KAD-LOOP-CANONICALIZATION-001, Package E — Lineage Service ──────────
// Traces: SourceRecord → GenerationRule → Evidence → Claim → Review → Passport

export interface LineageResult {
  sourceRecord: unknown | null
  generationRule: unknown | null
  evidence: unknown | null
  claims: unknown[]
  reviews: unknown[]
  passportEntries: unknown[]
}

export class LineageService {
  /**
   * Trace lineage starting from an evidence_id or claim_id.
   * Returns the full chain from SourceRecord through to Passport entries.
   */
  async getLineage(id: string, isClaimId: boolean = false): Promise<LineageResult> {
    // Placeholder implementation — real queries require DB access.
    // This provides the service interface; actual SQL queries will be
    // connected when the DB layer is wired in Loop 2.
    const result: LineageResult = {
      sourceRecord: null,
      generationRule: null,
      evidence: null,
      claims: [],
      reviews: [],
      passportEntries: [],
    }

    if (!id) {
      return result
    }

    // TODO: Implement actual DB queries:
    // 1. If isClaimId: fetch claim by id, then find linked evidence via claim_evidence_links
    // 2. If !isClaimId: fetch evidence by id, then find linked claims via claim_evidence_links
    // 3. From evidence: fetch source_record via evidence_nodes.source_record_id
    // 4. From evidence: fetch generation_rule via evidence_nodes.generation_rule_id
    // 5. From claims: fetch reviews via reviews table
    // 6. From claims: fetch passport_entries via passport_entries table

    return result
  }
}

export const lineageService = new LineageService()
