import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

/**
 * GET /api/v1/koc/policy
 * Policy Dashboard: active policies, evaluations, violations, pending decisions
 */
export const GET = withAuth(async (_request, user) => {
  try {
    // RC-0.3: KOC access restricted to kadarn_internal role
    const userRole = user.user_metadata?.kadarn_role as string | undefined
    if (userRole !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access restricted' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const [policiesRes, evaluationsRes, challengesRes] = await Promise.all([
      supabase.from('policies').select('id, name, policy_type, status, severity, description', { count: 'exact' }),
      supabase.from('policy_evaluations').select('id, result, created_at', { count: 'exact' }),
      supabase.from('trust_challenges').select('id, status, severity, dimension', { count: 'exact' }).eq('status', 'filed'),
    ])

    const policies = policiesRes.data ?? []
    const evaluations = evaluationsRes.data ?? []
    const pendingChallenges = challengesRes.data ?? []

    const violations = evaluations.filter(e => e.result === 'deny' || e.result === 'violation')
    const approvals = evaluations.filter(e => e.result === 'allow')
    const pendingDecisions = policies.filter(p => p.status === 'draft' || p.status === 'pending')

    return Response.json({
      data: {
        total_policies: policies.length,
        active_policies: policies.filter(p => p.status === 'active').length,
        violations: violations.length,
        approvals: approvals.length,
        total_evaluations: evaluations.length,
        pending_decisions: pendingDecisions.length,
        pending_challenges: pendingChallenges.length,
        by_severity: {
          critical: policies.filter(p => p.severity === 'critical').length,
          high: policies.filter(p => p.severity === 'high').length,
          medium: policies.filter(p => p.severity === 'medium').length,
          low: policies.filter(p => p.severity === 'low').length,
        },
        policies: policies.slice(0, 10),
        recent_evaluations: evaluations.slice(0, 10),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
