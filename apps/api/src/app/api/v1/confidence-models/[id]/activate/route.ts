// ==========================================================================
// KAD-LOOP-004 — Activate Confidence Model (Phase 10)
// ==========================================================================
// POST /api/v1/confidence-models/[id]/activate — Activate a draft model
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const activateSchema = z.object({
  effective_from: z.string().datetime({ offset: true }).optional(),
  effective_until: z.string().datetime({ offset: true }).optional(),
});

// ─── POST — activate confidence model ──────────────────────────────────────
export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const parsed = activateSchema.safeParse(body);

    const supabase = createServiceClient();

    // Fetch the model with its rules for validation.
    const { data: model, error: fetchErr } = await supabase
      .from('confidence_models')
      .select('*, confidence_rules(*)')
      .eq('id', id)
      .single();

    if (fetchErr) {
      if (fetchErr.code === 'PGRST116') throw new ApiError(404, 'Confidence model not found');
      throw new ApiError(500, 'Failed to fetch confidence model', fetchErr.message);
    }
    if (!model) throw new ApiError(404, 'Confidence model not found');

    // Only draft models can be activated.
    if (model.status !== 'draft') {
      throw new ApiError(409, `Confidence model cannot be activated: current status is '${model.status}'`);
    }

    // Validate effective dates.
    const now = new Date().toISOString();
    const effectiveFrom = parsed.success && parsed.data.effective_from
      ? parsed.data.effective_from
      : now;

    if (parsed.success && parsed.data.effective_until) {
      if (new Date(parsed.data.effective_until) <= new Date(effectiveFrom)) {
        return Response.json(
          { data: null, error: 'effective_until must be after effective_from', details: null },
          { status: 422 },
        );
      }
    }

    // Validate that the model has at least one active rule.
    const rules = model.confidence_rules ?? [];
    const activeRules = rules.filter((r: { status: string }) => r.status === 'active' || r.status === 'draft');
    if (activeRules.length === 0) {
      return Response.json(
        { data: null, error: 'Confidence model must have at least one rule before activation' },
        { status: 422 },
      );
    }

    // Deactivate any other active models for this tenant.
    await supabase
      .from('confidence_models')
      .update({ status: 'deprecated', deprecated_at: now, updated_at: now })
      .eq('tenant_id', model.tenant_id)
      .eq('status', 'active');

    // Activate this model.
    const { data: updated, error: updErr } = await supabase
      .from('confidence_models')
      .update({
        status: 'active',
        effective_from: effectiveFrom,
        effective_until: parsed.success && parsed.data.effective_until
          ? parsed.data.effective_until
          : model.effective_until,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (updErr) throw new ApiError(500, 'Failed to activate confidence model', updErr.message);

    return Response.json({ data: updated, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
