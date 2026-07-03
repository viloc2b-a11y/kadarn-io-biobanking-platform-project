import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (_request, user) => {
  try {
    // RC-0.3: KOC access restricted to kadarn_internal role
    const userRole = user.user_metadata?.kadarn_role as string | undefined
    if (userRole !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access restricted' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    // 1. Top organizations by program participation
    const { data: topOrgs } = await supabase
      .from('program_participants')
      .select('organization_id')
      .eq('status', 'active')

    const orgCounts: Record<string, number> = {}
    for (const p of topOrgs ?? []) {
      orgCounts[p.organization_id] = (orgCounts[p.organization_id] ?? 0) + 1
    }
    const topOrgIds = Object.entries(orgCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    const { data: orgNames } = topOrgIds.length > 0
      ? await supabase.from('organizations').select('id, name').in('id', topOrgIds)
      : { data: [] }

    const nameMap = new Map((orgNames ?? []).map(o => [o.id, o.name]))
    const topBiobanks = topOrgIds.map(id => ({
      organization_id: id,
      name: nameMap.get(id) ?? 'Unknown',
      program_count: orgCounts[id],
    }))

    // 2. Disease / therapeutic area distribution
    const { data: programs } = await supabase
      .from('programs')
      .select('therapeutic_areas')
      .not('therapeutic_areas', 'is', null)

    const areaCounts: Record<string, number> = {}
    for (const p of programs ?? []) {
      const areas = p.therapeutic_areas as string[] | null
      if (areas) {
        for (const area of areas) {
          areaCounts[area] = (areaCounts[area] ?? 0) + 1
        }
      }
    }
    const diseaseDistribution = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([area, count]) => ({ area, count }))

    // 3. Growth — programs created per month
    const { data: progDates } = await supabase
      .from('programs')
      .select('created_at')
      .order('created_at', { ascending: true })

    const monthCounts: Record<string, number> = {}
    for (const p of progDates ?? []) {
      const month = p.created_at?.slice(0, 7) // YYYY-MM
      if (month) monthCounts[month] = (monthCounts[month] ?? 0) + 1
    }
    const growth = Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, new_programs]) => ({ month, new_programs }))

    // 4. Demand/supply balance
    const [reqRes, dealRes] = await Promise.all([
      supabase.from('exchange_requests').select('id', { count: 'exact', head: true }),
      supabase.from('exchange_deals').select('id', { count: 'exact', head: true }),
    ])

    const requests = reqRes.count ?? 0
    const deals = dealRes.count ?? 0

    return Response.json({
      data: {
        top_biobanks: topBiobanks,
        disease_distribution: diseaseDistribution,
        growth,
        demand_supply: {
          requests,
          deals,
          ratio: requests > 0 ? Math.round((deals / requests) * 100) : 0,
        },
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
