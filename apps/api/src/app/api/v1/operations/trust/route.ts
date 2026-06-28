import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

type TrustOrganization = { name: string; country: string }

export const GET = withAuth(async (_request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const { data, error } = await supabase
      .from('organization_trust')
      .select(`
        organization_id,
        overall_score,
        operational_score,
        regulatory_score,
        financial_score,
        technical_score,
        total_fulfillments,
        successful_fulfillments,
        incident_count,
        last_event_at,
        updated_at,
        organizations ( name, country )
      `)
      .order('overall_score', { ascending: true }) // lowest first (most at risk)
      .limit(50)

    if (error) {
      return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
    }

    const scores = (data ?? []).map(t => {
      const org = Array.isArray(t.organizations)
        ? t.organizations[0] as TrustOrganization | undefined
        : t.organizations as TrustOrganization | null
      const overall = Number(t.overall_score)
      return {
        org_id:       t.organization_id,
        org_name:     org?.name ?? 'Unknown',
        country:      org?.country ?? null,
        trust: {
          overall,
          operational: Number(t.operational_score),
          regulatory:  Number(t.regulatory_score),
          financial:   Number(t.financial_score),
          technical:   Number(t.technical_score),
        },
        fulfillments:  t.total_fulfillments,
        success_rate:  t.total_fulfillments > 0
          ? Math.round((t.successful_fulfillments / t.total_fulfillments) * 100)
          : null,
        incidents:     t.incident_count,
        last_event_at: t.last_event_at,
        risk_level:    overall >= 0.80 ? 'low' : overall >= 0.60 ? 'medium' : 'high',
      }
    })

    const networkAvg = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.trust.overall, 0) / scores.length
      : 0

    return Response.json({
      data: {
        network_trust_index: Math.round(networkAvg * 100),
        org_count:           scores.length,
        at_risk:             scores.filter(s => s.risk_level === 'high').length,
        organizations:       scores,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
