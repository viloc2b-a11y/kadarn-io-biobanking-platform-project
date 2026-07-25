// ==========================================================================
// KAD-LOOP-004 — Calculate Capability Confidence
// ==========================================================================
// POST /api/v1/capabilities/[id]/confidence/calculate
// ==========================================================================

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server';
import {
  ConfidenceModelRepository,
  ConfidenceRuleRepository,
  ConfidenceAssessmentRepository,
  ConfidenceFactorRepository,
  ConfidenceBlockerRepository,
  ConfidenceEligibilityService,
  ConfidenceCalculationService,
  ConfidenceScoringEngine,
} from '@kadarn/platform-services';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

const calculateSchema = z.object({
  tenant_id: z.string().uuid(),
  institution_id: z.string().uuid(),
  model_id: z.string().uuid().optional(),
  force_recalculate: z.boolean().optional().default(false),
});

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id: capabilityId } = paramsSchema.parse(params);
    const body = await request.json() as Record<string, unknown>;
    const parsed = calculateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { tenant_id, institution_id, model_id, force_recalculate } = parsed.data;
    const supabase = createServiceClient();
    const db = supabase as any;

    // Verify capability belongs to tenant
    const { data: capability, error: capErr } = await supabase
      .from('capabilities')
      .select('id, organization_id')
      .eq('id', capabilityId)
      .single();
    if (capErr || !capability) throw new ApiError(404, 'Capability not found');
    if (capability.organization_id !== tenant_id) {
      throw new ApiError(403, 'Capability does not belong to the specified tenant');
    }

    // Resolve active model if none specified
    let resolvedModelId = model_id;
    if (!resolvedModelId) {
      const { data: activeModel } = await supabase
        .from('confidence_models')
        .select('id')
        .eq('tenant_id', tenant_id)
        .eq('status', 'active')
        .single();
      if (!activeModel) {
        throw new ApiError(422, 'No active confidence model found for this tenant');
      }
      resolvedModelId = activeModel.id;
    }
    const modelId: string = resolvedModelId!;

    // Build services
    const modelRepo = new ConfidenceModelRepository(db);
    const ruleRepo = new ConfidenceRuleRepository(db);
    const assessmentRepo = new ConfidenceAssessmentRepository(db);
    const factorRepo = new ConfidenceFactorRepository(db);
    const blockerRepo = new ConfidenceBlockerRepository(db);

    const eligibilityService = new ConfidenceEligibilityService(db);
    const calculationService = new ConfidenceCalculationService(
      assessmentRepo, factorRepo, blockerRepo, ruleRepo, db,
    );

    // If force_recalculate, supersede existing
    if (force_recalculate) {
      const { data: existing } = await supabase
        .from('confidence_assessments')
        .select('id')
        .eq('capability_id', capabilityId)
        .eq('assessment_status', 'completed')
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();
      if (existing) {
        await supabase
          .from('confidence_assessments')
          .update({ assessment_status: 'superseded' })
          .eq('id', existing.id);
      }
    }

    // Run eligibility
    const eligibility = await eligibilityService.evaluateEligibility(capabilityId, modelId);
    if (eligibility.eligibility === 'NOT_ELIGIBLE') {
      return Response.json({
        data: null,
        error: 'Capability is not eligible for confidence scoring',
        details: { eligibility },
      }, { status: 422 });
    }

    // Run calculation
    const result = await calculationService.calculate(capabilityId, modelId);

    return Response.json({ data: result, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});