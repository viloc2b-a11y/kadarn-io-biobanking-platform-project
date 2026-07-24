// ============================================================================
// Review Tasks API
// ============================================================================
// GET  /api/v1/review/tasks         — List review tasks (with filters)
// POST /api/v1/review/tasks         — Create a review task
// PATCH /api/v1/review/tasks/:id    — Complete/skip/cancel a task
// ============================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { createReviewTask, listReviewTasks } from '@kadarn/evidence-core';

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const organizationId = await requireValidatedActiveOrg(user);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const taskType = url.searchParams.get('taskType') || undefined;
    const claimId = url.searchParams.get('claimId') || undefined;

    const tasks = await listReviewTasks(supabase as any, organizationId, {
      status: status as any,
      taskType: taskType as any,
      claimId,
    });

    return Response.json({ data: tasks }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
    const organizationId = await requireValidatedActiveOrg(user);
    const body = await request.json() as Record<string, unknown>;

    if (!body.taskType) {
      return Response.json(
        { data: null, error: 'Missing required field: taskType' },
        { status: 400 },
      );
    }

    const correlationId = crypto.randomUUID();
    const task = await createReviewTask(supabase as any, {
      actorId: user.id,
      organizationId,
      correlationId,
    }, {
      claimId: body.claimId as string,
      evidenceNodeId: body.evidenceNodeId as string,
      taskType: body.taskType as any,
      assignedTo: body.assignedTo as string,
      notes: body.notes as string,
    });

    return Response.json({ data: task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
