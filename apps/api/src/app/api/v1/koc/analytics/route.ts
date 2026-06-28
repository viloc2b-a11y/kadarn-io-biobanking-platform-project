import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (_request, user) => {
  try {
    const supabase = await createRouteClient()

    // Program success: active vs completed vs cancelled
    const { data: progStatus } = await supabase
      .from('programs')
      .select('status')

    const totalProgs = progStatus?.length ?? 0
    const activeProgs = progStatus?.filter(p => p.status === 'active').length ?? 0
    const completedProgs = progStatus?.filter(p => p.status === 'completed').length ?? 0
    const cancelledProgs = progStatus?.filter(p => p.status === 'cancelled').length ?? 0

    // Fulfillment rate from exchange_deals
    const { data: deals } = await supabase
      .from('exchange_deals')
      .select('status, sample_count_expected, sample_count_delivered')

    const totalDeals = deals?.length ?? 0
    const completedDeals = deals?.filter(d => d.status === 'completed').length ?? 0
    const disputedDeals = deals?.filter(d => d.status === 'disputed').length ?? 0
    const totalSamplesExpected = deals?.reduce((s, d) => s + (d.sample_count_expected ?? 0), 0) ?? 0
    const totalSamplesDelivered = deals?.reduce((s, d) => s + (d.sample_count_delivered ?? 0), 0) ?? 0
    const fulfillmentRate = totalSamplesExpected > 0
      ? Math.round((totalSamplesDelivered / totalSamplesExpected) * 100)
      : 0

    // Collection performance from collection_twins
    const { data: collections } = await supabase
      .from('collection_twins')
      .select('target_enrollment, actual_enrollment, status')

    const totalTarget = collections?.reduce((s, c) => s + (c.target_enrollment ?? 0), 0) ?? 0
    const totalActual = collections?.reduce((s, c) => s + (c.actual_enrollment ?? 0), 0) ?? 0
    const enrollmentRate = totalTarget > 0
      ? Math.round((totalActual / totalTarget) * 100)
      : 0
    const activeCollections = collections?.filter(c => c.status === 'active').length ?? 0

    // Network utilization from organizations
    const { count: totalOrgs } = await supabase
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    // Revenue from exchange_escrow
    const { data: escrows } = await supabase
      .from('exchange_escrow')
      .select('total_amount, released_amount')

    const totalRevenue = escrows?.reduce((s, e) => s + (e.total_amount ?? 0), 0) ?? 0
    const releasedRevenue = escrows?.reduce((s, e) => s + (e.released_amount ?? 0), 0) ?? 0

    return Response.json({
      data: {
        programs: { total: totalProgs, active: activeProgs, completed: completedProgs, cancelled: cancelledProgs },
        fulfillment: { total_deals: totalDeals, completed_deals: completedDeals, disputed_deals: disputedDeals, samples_expected: totalSamplesExpected, samples_delivered: totalSamplesDelivered, rate: fulfillmentRate },
        collections: { total: collections?.length ?? 0, active: activeCollections, target_enrollment: totalTarget, actual_enrollment: totalActual, enrollment_rate: enrollmentRate },
        network: { active_orgs: totalOrgs ?? 0 },
        revenue: { total: totalRevenue, released: releasedRevenue, pending: totalRevenue - releasedRevenue },
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
