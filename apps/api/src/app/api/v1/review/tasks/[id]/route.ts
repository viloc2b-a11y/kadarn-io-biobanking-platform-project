// ============================================================================
// Review Tasks API — PATCH by ID
// ============================================================================
// PATCH /api/v1/review/tasks/:id — Complete/skip/cancel a task
// ============================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { completeReviewTask } from '@kadarn/evidence-core';

export const PATCH = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const taskId = segments[segments.length - 1];

    if (!taskId || taskId === 'tasks') {
      return Response.json({ data: null, error: 'Task ID required in path' }, { status: 400 });
    }

    const body = await request.json() as Record<string, unknown>;
    const status = body.status as string;
    if (!status || !['completed', 'skipped', 'cancelled'].includes(status)) {
      return Response.json(
        { data: null, error: 'status must be: completed, skipped, or cancelled' },
        { status: 400 },
      );
    }

    const correlationId = crypto.randomUUID();

    // requireValidatedActiveOrg is embedded inside
    const { data: orgData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    const organizationId = orgData?.organization_id as string;
    if (!organizationId) {
      return Response.json({ data: null, error: 'No active organization' }, { status: 403 });
    }

    await completeReviewTask(supabase as any, {
      actorId: user.id,
      organizationId,
      correlationId,
    }, taskId, status as any, body.notes as string);

    return Response.json({ data: { id: taskId, status } }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
});
