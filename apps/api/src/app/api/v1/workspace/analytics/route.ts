import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withRateLimit } from '@/lib/rate-limit'
import { requireActiveOrg } from '@/lib/workspace'

export const GET = withRateLimit(
  withAuth(async (_request, user) => {
    try {
      const supabase = await createRouteClient()
      const orgId = requireActiveOrg(user)

      const [metricsRes, activityRes, programsRes] = await Promise.all([
        supabase
          .from('analytics_program_metrics')
          .select('id, program_id, metric_name, metric_value, recorded_at')
          .eq('organization_id', orgId)
          .order('recorded_at', { ascending: false })
          .limit(20),
        supabase
          .from('program_activity_log')
          .select('id, event_type, summary, program_id, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('programs')
          .select('id, status', { count: 'exact', head: true })
          .or(`sponsor_org_id.eq.${orgId},lead_org_id.eq.${orgId}`),
      ])

      if (metricsRes.error && metricsRes.error.code !== 'PGRST116') {
        throw new ApiError(500, 'Failed to fetch analytics metrics', metricsRes.error.message)
      }
      if (activityRes.error) throw new ApiError(500, 'Failed to fetch activity', activityRes.error.message)

      return Response.json({
        data: {
          organization_id: orgId,
          program_count: programsRes.count ?? 0,
          metrics: metricsRes.data ?? [],
          recent_activity: activityRes.data ?? [],
        },
        error: null,
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
