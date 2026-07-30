// ==========================================================================
// KAD-GC-001 — Assessment CRUD API (Institution-scoped)
// ==========================================================================
// POST /api/v1/institutions/[id]/assessments — Create an Assessment
// GET  /api/v1/institutions/[id]/assessments — List Assessments for an Institution
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { CreateAssessmentSchema } from '@kadarn/types';
import { z } from 'zod';

const paramsSchema = z.object({ id: z.string().uuid() });

export const POST = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const body = await request.json() as Record<string, unknown>;

    const parsed = CreateAssessmentSchema.safeParse({ ...body, institution_id: id });
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const insert = {
      institution_id: parsed.data.institution_id,
      assessment_type: parsed.data.assessment_type,
      status: parsed.data.status ?? 'pending',
      started_at: parsed.data.started_at ?? null,
      results_summary: parsed.data.results_summary ?? {},
    };

    const { data, error } = await supabase
      .from('assessments')
      .insert(insert)
      .select()
      .single();

    if (error) {
      return handleApiError(error);
    }

    return Response.json({ data, error: null }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const GET = withAuth(async (request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params);
    const supabase = await createRouteClient();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');

    let query = supabase
      .from('assessments')
      .select('*')
      .eq('institution_id', id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('assessment_type', type);

    const { data, error } = await query;

    if (error) {
      return handleApiError(error);
    }

    return Response.json({ data, error: null });
  } catch (error) {
    return handleApiError(error);
  }
});
