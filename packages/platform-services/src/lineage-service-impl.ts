// ─── KAD-LOOP-002 — Lineage Service Implementation ──────────────────────
// Authority: KADARN Engineering Playbook, Evidence Core
// Real lineage traversal for the evidence → source → rule → claim → review
// → passport chain. Uses Supabase FK joins / .in() lookups.
//
// NOTE: The existing `lineage-service.ts` is a placeholder stub and is NOT
// modified. This file provides the production implementation.

import { createClient } from '@supabase/supabase-js';
import type { LineageChain } from '@kadarn/types';

// ─── Result Types ────────────────────────────────────────────────────────

export interface ProvenanceResult {
  source_record: Record<string, unknown> | null;
  generation_rule: Record<string, unknown> | null;
}

export interface DependentsResult {
  claims: Record<string, unknown>[];
  reviews: Record<string, unknown>[];
}

// ─── Service ─────────────────────────────────────────────────────────────

export class LineageServiceImpl {
  private readonly supabase: ReturnType<typeof createClient>;

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase =
      supabase ??
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
  }

  // ─── Full Lineage ──────────────────────────────────────────────────────

  /**
   * Trace the full lineage chain for an evidence node:
   *   evidence → source_record → evidence_source
   *            → generation_rule
   *            → claim_evidence_links → claims
   *            → review_tasks (via claim_id)
   *            → passport_entries (via claim_id)
   */
  async traceLineage(evidenceId: string): Promise<LineageChain> {
    // 1. Fetch the evidence node
    const { data: evidence, error: evError } = await this.supabase
      .from('evidence_nodes')
      .select('*')
      .eq('id', evidenceId)
      .single();

    if (evError || !evidence) {
      throw new Error(
        `Evidence not found: ${evidenceId} — ${evError?.message ?? 'no data'}`,
      );
    }

    const ev = evidence as Record<string, unknown>;
    const chain: LineageChain = {
      event: null,
      source_record: null,
      generation_rule: null,
      evidence: ev,
      claim: null,
      review: null,
      passport: null,
    };

    // 2. Trace upstream: source_record → evidence_source
    if (ev.source_record_id) {
      const { data: sourceRecord } = await this.supabase
        .from('source_records')
        .select('*, evidence_source:evidence_source_id(*)')
        .eq('id', ev.source_record_id as string)
        .single();

      chain.source_record = sourceRecord ?? null;

      // Trace to institutional event via correlation_id in raw_metadata
      const rawMetadata = (sourceRecord as Record<string, unknown> | null)?.raw_metadata as
        | Record<string, unknown>
        | null
        | undefined;
      if (rawMetadata?.correlation_id) {
        const { data: event } = await this.supabase
          .from('institutional_events')
          .select('*')
          .eq('correlation_id', rawMetadata.correlation_id as string)
          .single();
        chain.event = event ?? null;
      }
    }

    // 3. Trace upstream: generation_rule
    if (ev.generation_rule_id) {
      const { data: rule } = await this.supabase
        .from('evidence_generation_rules')
        .select('*')
        .eq('id', ev.generation_rule_id as string)
        .single();
      chain.generation_rule = rule ?? null;
    }

    // 4. Trace downstream: claim_evidence_links → claims
    const { data: links } = await this.supabase
      .from('claim_evidence_links')
      .select('*, claim:claim_id(*)')
      .eq('evidence_id', evidenceId);

    const linkRows = (links ?? []) as Record<string, unknown>[];
    if (linkRows.length > 0) {
      // Take the first linked claim for the single-claim lineage chain slot
      const firstClaim = linkRows[0]?.claim as Record<string, unknown> | undefined;
      chain.claim = firstClaim ?? null;

      const claimIds = linkRows
        .map((l) => l.claim_id as string)
        .filter((id): id is string => Boolean(id));

      // 5. Reviews via claim_id
      if (claimIds.length > 0) {
        const { data: reviews } = await this.supabase
          .from('review_tasks')
          .select('*')
          .in('claim_id', claimIds);
        chain.review = reviews ?? null;
      }

      // 6. Passport entries via claim_id
      if (claimIds.length > 0) {
        const { data: passports } = await this.supabase
          .from('passport_entries')
          .select('*')
          .in('claim_id', claimIds);
        chain.passport = passports ?? null;
      }
    }

    return chain;
  }

  // ─── Upstream: Provenance ──────────────────────────────────────────────

  /**
   * Trace upstream provenance: what produced this evidence?
   * Returns the source_record and generation_rule.
   */
  async traceProvenance(evidenceId: string): Promise<ProvenanceResult> {
    const { data: evidence, error: evError } = await this.supabase
      .from('evidence_nodes')
      .select('source_record_id, generation_rule_id')
      .eq('id', evidenceId)
      .single();

    if (evError || !evidence) {
      throw new Error(
        `Evidence not found: ${evidenceId} — ${evError?.message ?? 'no data'}`,
      );
    }

    const ev = evidence as Record<string, unknown>;
    const result: ProvenanceResult = {
      source_record: null,
      generation_rule: null,
    };

    if (ev.source_record_id) {
      const { data: sourceRecord } = await this.supabase
        .from('source_records')
        .select('*, evidence_source:evidence_source_id(*)')
        .eq('id', ev.source_record_id as string)
        .single();
      result.source_record = (sourceRecord as unknown as Record<string, unknown>) ?? null;
    }

    if (ev.generation_rule_id) {
      const { data: rule } = await this.supabase
        .from('evidence_generation_rules')
        .select('*')
        .eq('id', ev.generation_rule_id as string)
        .single();
      result.generation_rule = (rule as unknown as Record<string, unknown>) ?? null;
    }

    return result;
  }

  // ─── Downstream: Dependents ────────────────────────────────────────────

  /**
   * Trace downstream dependents: what claims and reviews depend on this evidence?
   */
  async traceDependents(evidenceId: string): Promise<DependentsResult> {
    // 1. Find claim_evidence_links for this evidence
    const { data: links, error: linkError } = await this.supabase
      .from('claim_evidence_links')
      .select('claim_id')
      .eq('evidence_id', evidenceId);

    if (linkError) {
      throw new Error(
        `Failed to fetch claim-evidence links: ${linkError.message}`,
      );
    }

    const linkRows = (links ?? []) as Record<string, unknown>[];
    const claimIds = linkRows
      .map((l) => l.claim_id as string)
      .filter((id): id is string => Boolean(id));

    if (claimIds.length === 0) {
      return { claims: [], reviews: [] };
    }

    // 2. Fetch claims
    const { data: claims, error: claimsError } = await this.supabase
      .from('claims')
      .select('*')
      .in('id', claimIds);

    if (claimsError) {
      throw new Error(`Failed to fetch claims: ${claimsError.message}`);
    }

    // 3. Fetch reviews for those claims
    const { data: reviews, error: reviewsError } = await this.supabase
      .from('review_tasks')
      .select('*')
      .in('claim_id', claimIds);

    if (reviewsError) {
      throw new Error(`Failed to fetch reviews: ${reviewsError.message}`);
    }

    return {
      claims: (claims ?? []) as Record<string, unknown>[],
      reviews: (reviews ?? []) as Record<string, unknown>[],
    };
  }

  // ─── By Source ─────────────────────────────────────────────────────────

  /**
   * Trace all evidence generated from a given source record.
   */
  async traceFromSource(sourceRecordId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from('evidence_nodes')
      .select('*')
      .eq('source_record_id', sourceRecordId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch evidence by source record: ${error.message}`,
      );
    }

    return (data ?? []) as Record<string, unknown>[];
  }

  // ─── By Rule ───────────────────────────────────────────────────────────

  /**
   * Trace all evidence generated by a given generation rule.
   */
  async traceFromRule(ruleId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from('evidence_nodes')
      .select('*')
      .eq('generation_rule_id', ruleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(
        `Failed to fetch evidence by generation rule: ${error.message}`,
      );
    }

    return (data ?? []) as Record<string, unknown>[];
  }
}
