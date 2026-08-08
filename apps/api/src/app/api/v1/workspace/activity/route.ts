// ==========================================================================
// Slice 3 — Workspace Activity API
// GET /api/v1/workspace/activity — Recent activity for the active institution
// ==========================================================================
// Scoped to the user's organization. No kadarn_internal role required.
// Returns audit events relevant to the institution — evidence uploads,
// claim changes, reviews, disputes.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { requireValidatedActiveOrg } from '@/lib/workspace'

export const GET = withAuth(async (request, _user) => {
  try {
    const supabase = await createRouteClient()
    const organizationId = await requireValidatedActiveOrg(_user)
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 50)

    const { data, error } = await supabase
      .from('audit_events')
      .select('id, action, resource_type, resource_id, summary, actor_email, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return Response.json({ data: [], error: null }) // graceful — empty, not error
    }

    const events = (data ?? []).map(e => ({
      id: e.id,
      action: e.action,
      resourceType: e.resource_type,
      resourceId: e.resource_id,
      summary: e.summary,
      actor: e.actor_email,
      createdAt: e.created_at,
    }))

    return Response.json({ data: events, count: events.length, error: null })
  } catch (error) {
    // Graceful degradation — Home handles empty events
    return Response.json({ data: [], count: 0, error: null })
  }
})
