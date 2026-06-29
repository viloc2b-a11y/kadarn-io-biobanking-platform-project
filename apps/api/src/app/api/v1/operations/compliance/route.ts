import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const GET = withRateLimit(
  withAuth(async (_request, user) => {
    try {
      if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
        throw new ApiError(403, 'KOC access required')
      }

      const supabase = await createRouteClient()

      const [policiesRes, evaluationsRes, submissionsRes] = await Promise.all([
        supabase
          .from('policies')
          .select('id, name, policy_type, status, severity, description, domain, updated_at', { count: 'exact' }),
        supabase
          .from('policy_evaluations')
          .select('id, policy_id, result, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('regulatory_submissions')
          .select('id, submission_type, status, irb_name, irb_number, submitted_at')
          .order('updated_at', { ascending: false })
          .limit(20),
      ])

      if (policiesRes.error) throw new ApiError(500, 'Failed to fetch policies', policiesRes.error.message)
      if (evaluationsRes.error) throw new ApiError(500, 'Failed to fetch evaluations', evaluationsRes.error.message)

      const policies = policiesRes.data ?? []
      const evaluations = evaluationsRes.data ?? []
      const violations = evaluations.filter(e => e.result === 'deny' || e.result === 'conditional')

      return Response.json({
        data: {
          total_policies: policies.length,
          active_policies: policies.filter(p => p.status === 'active').length,
          violations: violations.length,
          recent_evaluations: evaluations.slice(0, 10),
          policies: policies.slice(0, 20),
          regulatory_submissions: submissionsRes.data ?? [],
        },
        error: null,
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
