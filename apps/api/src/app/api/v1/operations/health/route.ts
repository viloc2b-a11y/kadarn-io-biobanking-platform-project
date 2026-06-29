import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (_request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const [orgsRes, programsRes, shipmentsRes, exchangeRes, trustRes] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('programs').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('logistics_shipments').select('id, status', { count: 'exact' }).in('status', ['in_transit', 'pending', 'customs_hold']),
      supabase.from('exchange_requests').select('id', { count: 'exact' }).in('status', ['submitted', 'under_review']),
      supabase.from('organization_trust').select('overall_score'),
    ])

    const transitCount  = (shipmentsRes.data ?? []).filter(s => s.status === 'in_transit').length
    const pendingCount  = (shipmentsRes.data ?? []).filter(s => s.status === 'pending').length
    const customsCount  = (shipmentsRes.data ?? []).filter(s => s.status === 'customs_hold').length

    const trustScores = (trustRes.data ?? []).map(t => Number(t.overall_score))
    const networkTrustAvg = trustScores.length > 0
      ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length
      : null

    return Response.json({
      data: {
        active_organizations: orgsRes.count ?? 0,
        active_programs:      programsRes.count ?? 0,
        pending_requests:     exchangeRes.count ?? 0,
        shipments_in_transit: transitCount,
        shipments_pending:    pendingCount,
        shipments_customs:    customsCount,
        network_trust_avg:    networkTrustAvg !== null ? Math.round(networkTrustAvg * 100) : null,
        trust_org_count:      trustScores.length,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
