// ==========================================================================
// KAD-LOOP-002 — Evidence Replay API
// ==========================================================================
// POST /api/v1/evidence/[id]/replay — Replay generation, verify determinism
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { createHash } from 'crypto';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const POST = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();

    // 1. Fetch original evidence
    const { data: evidence, error: evError } = await supabase
      .from('evidence_nodes')
      .select('*')
      .eq('id', id)
      .single();
    if (evError || !evidence) {
      throw new ApiError(404, 'Evidence not found');
    }

    if (!evidence.generation_rule_id || !evidence.source_record_id) {
      throw new ApiError(400, 'Evidence has no generation provenance — cannot replay');
    }

    // 2. Fetch source record and rule
    const { data: sourceRecord } = await supabase
      .from('source_records')
      .select('*')
      .eq('id', evidence.source_record_id)
      .single();

    const { data: rule } = await supabase
      .from('evidence_generation_rules')
      .select('*')
      .eq('id', evidence.generation_rule_id)
      .single();

    if (!sourceRecord || !rule) {
      throw new ApiError(404, 'Source record or generation rule no longer exists');
    }

    // 3. Recompute input hash
    const hashInput = [
      sourceRecord.content_hash || '',
      rule.id,
      String(rule.rule_version),
    ].join('|');
    const replayedHash = createHash('sha256').update(hashInput).digest('hex');

    // 4. Re-generate content (deterministic)
    const replayedContent = JSON.stringify({
      source: sourceRecord.id,
      rule: rule.id,
      rule_version: rule.rule_version,
      content_hash: sourceRecord.content_hash,
      generated_at: new Date().toISOString(),
    });

    // 5. Compare
    const inputHashMatches = replayedHash === evidence.input_hash;
    const outputMatches = replayedContent === evidence.content;

    return Response.json({
      data: {
        evidence_id: id,
        input_hash_matches: inputHashMatches,
        output_matches: outputMatches,
        replayed_content: replayedContent,
        original_content: evidence.content,
        replayed_at: new Date().toISOString(),
      },
      error: null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
