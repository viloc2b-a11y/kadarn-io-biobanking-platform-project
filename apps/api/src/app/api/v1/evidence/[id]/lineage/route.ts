// ==========================================================================
// KAD-LOOP-002 — Evidence Lineage API
// ==========================================================================
// GET /api/v1/evidence/[id]/lineage — Full lineage chain
// GET /api/v1/evidence/[id]/provenance — Upstream provenance only
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    // Fetch evidence
    const { data: evidence, error: evError } = await supabase
      .from('evidence_nodes')
      .select('*')
      .eq('id', id)
      .single();
    if (evError || !evidence) {
      throw new ApiError(404, 'Evidence not found');
    }

    const lineage: Record<string, unknown> = { evidence };

    // Trace upstream: source record
    if (evidence.source_record_id) {
      const { data: sourceRecord } = await supabase
        .from('source_records')
        .select('*, evidence_source:evidence_source_id(*)')
        .eq('id', evidence.source_record_id)
        .single();
      lineage.source_record = sourceRecord;

      // Trace to institutional event via correlation
      if (sourceRecord?.raw_metadata?.correlation_id) {
        const { data: event } = await supabase
          .from('institutional_events')
          .select('*')
          .eq('correlation_id', sourceRecord.raw_metadata.correlation_id)
          .single();
        lineage.event = event;
      }
    }

    // Trace upstream: generation rule
    if (evidence.generation_rule_id) {
      const { data: rule } = await supabase
        .from('evidence_generation_rules')
        .select('*')
        .eq('id', evidence.generation_rule_id)
        .single();
      lineage.generation_rule = rule;
    }

    // Trace downstream: claim-evidence links → claims
    const { data: links } = await supabase
      .from('claim_evidence_links')
      .select('*, claim:claim_id(*)')
      .eq('evidence_id', id);
    lineage.claim_links = links;

    // Trace downstream: reviews
    if (links && links.length > 0) {
      const claimIds = links.map((l: Record<string, unknown>) => l.claim_id);
      const { data: reviews } = await supabase
        .from('review_tasks')
        .select('*')
        .in('claim_id', claimIds);
      lineage.reviews = reviews;

      // Trace downstream: passport entries
      const { data: passports } = await supabase
        .from('passport_entries')
        .select('*')
        .in('claim_id', claimIds);
      lineage.passports = passports;
    }

    return Response.json({ data: lineage, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
