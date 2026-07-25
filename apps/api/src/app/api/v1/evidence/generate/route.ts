// ==========================================================================
// KAD-LOOP-002 — Evidence Generation API
// ==========================================================================
// POST /api/v1/evidence/generate — Generate evidence from source + rule
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server';
import { GenerateEvidenceSchema } from '@kadarn/types';
import { createHash } from 'crypto';

export const POST = withAuth(async (request, _user, _params) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const parsed = GenerateEvidenceSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { source_record_id, rule_id, tenant_id } = parsed.data;
    const supabase = await createRouteClient();

    // 1. Fetch source record
    const { data: sourceRecord, error: srcError } = await supabase
      .from('source_records')
      .select('*')
      .eq('id', source_record_id)
      .single();
    if (srcError || !sourceRecord) {
      throw new ApiError(404, 'Source record not found');
    }

    // 2. Fetch generation rule
    const { data: rule, error: ruleError } = await supabase
      .from('evidence_generation_rules')
      .select('*')
      .eq('id', rule_id)
      .single();
    if (ruleError || !rule) {
      throw new ApiError(404, 'Generation rule not found');
    }

    // 3. Validate rule is active
    if (!rule.active || rule.rule_status === 'retired') {
      throw new ApiError(409, 'Generation rule is not active');
    }

    // 4. Compute input hash
    const hashInput = [
      sourceRecord.content_hash || '',
      rule.id,
      String(rule.rule_version),
    ].join('|');
    const inputHash = createHash('sha256').update(hashInput).digest('hex');

    // 5. Generate content (deterministic based on source + rule)
    const generatorName = `${rule.output_evidence_type}@v${rule.rule_version}`;
    const generatedContent = JSON.stringify({
      source: sourceRecord.id,
      rule: rule.id,
      rule_version: rule.rule_version,
      content_hash: sourceRecord.content_hash,
      generated_at: new Date().toISOString(),
    });

    // 6. Find claim for this source record (if linked)
    // For now, evidence_nodes requires a claim_id — use a placeholder approach:
    // The generation pipeline creates evidence linked to the tenant's default claim
    // In production, the caller should specify which claim this evidence supports
    const { data: evidence, error: insertError } = await supabase
      .from('evidence_nodes')
      .insert({
        claim_id: null, // Evidence can be unlinked initially, linked via claim_evidence_links later
        evidence_class: rule.output_evidence_type,
        content: generatedContent,
        source: sourceRecord.locator_uri || sourceRecord.record_type || 'generated',
        node_date: new Date().toISOString(),
        status: 'active',
        lifecycle_status: 'generated',
        generation_rule_id: rule.id,
        input_hash: inputHash,
        generator: generatorName,
        generated_at: new Date().toISOString(),
        source_record_id: sourceRecord.id,
        provenance: {
          source_record_id: sourceRecord.id,
          rule_id: rule.id,
          rule_version: rule.rule_version,
          input_hash: inputHash,
          generator: generatorName,
        },
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError(500, `Failed to generate evidence: ${insertError.message}`);
    }

    return Response.json({
      data: {
        evidence,
        metadata: {
          rule_id: rule.id,
          rule_version: rule.rule_version,
          generator: generatorName,
          input_hash: inputHash,
          generated_at: new Date().toISOString(),
        },
      },
      error: null,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
