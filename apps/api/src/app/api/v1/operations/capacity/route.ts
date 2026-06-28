import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (_request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    const [orgsRes, collectionsRes, shipmentsRes, programsRes] = await Promise.all([
      // All active orgs with capabilities
      supabase
        .from('organizations')
        .select('id, name, country, capabilities')
        .eq('is_active', true)
        .order('name'),

      // Active collections per org — used as capacity proxy for biobanks/sites
      supabase
        .from('collection_twins')
        .select('id, organization_id, status, target_enrollment, actual_enrollment')
        .in('status', ['active', 'planned']),

      // Shipments in transit per org — logistics load
      supabase
        .from('logistics_shipments')
        .select('id, organization_id, status')
        .in('status', ['in_transit', 'pending', 'picked_up']),

      // Active programs per org (as assigned_org_id on milestones)
      supabase
        .from('program_milestones')
        .select('id, assigned_org_id, status')
        .neq('status', 'completed')
        .not('assigned_org_id', 'is', null),
    ])

    const orgs        = orgsRes.data ?? []
    const collections = collectionsRes.data ?? []
    const shipments   = shipmentsRes.data ?? []
    const milestones  = programsRes.data ?? []

    const orgCapacity = orgs.map(org => {
      const orgCollections = collections.filter(c => c.organization_id === org.id)
      const orgShipments   = shipments.filter(s => s.organization_id === org.id)
      const orgMilestones  = milestones.filter(m => m.assigned_org_id === org.id)

      // Enrollment utilization for collection orgs
      const totalTarget  = orgCollections.reduce((s, c) => s + (c.target_enrollment ?? 0), 0)
      const totalActual  = orgCollections.reduce((s, c) => s + (c.actual_enrollment ?? 0), 0)
      const enrollmentPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : null

      // Workload score: normalize against network max (rough heuristic)
      const workload = orgMilestones.length + orgShipments.length * 0.5

      // Utilization classification
      let utilization_level: 'saturated' | 'high' | 'normal' | 'underutilized'
      if (workload >= 15 || (enrollmentPct !== null && enrollmentPct >= 90)) {
        utilization_level = 'saturated'
      } else if (workload >= 8 || (enrollmentPct !== null && enrollmentPct >= 70)) {
        utilization_level = 'high'
      } else if (workload >= 2) {
        utilization_level = 'normal'
      } else {
        utilization_level = 'underutilized'
      }

      return {
        org_id:           org.id,
        org_name:         org.name,
        country:          org.country,
        capabilities:     org.capabilities as string[],
        workload_score:   Math.round(workload * 10) / 10,
        active_milestones: orgMilestones.length,
        shipments_active: orgShipments.length,
        collections: {
          active:         orgCollections.filter(c => c.status === 'active').length,
          target:         totalTarget,
          enrolled:       totalActual,
          enrollment_pct: enrollmentPct,
        },
        utilization_level,
      }
    })

    // Network aggregate
    const byLevel = {
      saturated:    orgCapacity.filter(o => o.utilization_level === 'saturated').length,
      high:         orgCapacity.filter(o => o.utilization_level === 'high').length,
      normal:       orgCapacity.filter(o => o.utilization_level === 'normal').length,
      underutilized: orgCapacity.filter(o => o.utilization_level === 'underutilized').length,
    }

    // Rebalancing recommendations
    const recommendations: string[] = []
    if (byLevel.saturated > 0 && byLevel.underutilized > 0) {
      recommendations.push(
        `${byLevel.saturated} saturated org(s) could offload work to ${byLevel.underutilized} underutilized org(s).`
      )
    }
    if (byLevel.saturated > orgs.length * 0.3) {
      recommendations.push('More than 30% of network is saturated. Consider adding new partners.')
    }
    if (byLevel.underutilized > orgs.length * 0.4) {
      recommendations.push('High underutilization. Review program allocation or partner activation.')
    }

    return Response.json({
      data: {
        network: {
          total_orgs:  orgs.length,
          by_level:    byLevel,
          avg_workload: orgs.length > 0
            ? Math.round(orgCapacity.reduce((s, o) => s + o.workload_score, 0) / orgs.length * 10) / 10
            : 0,
        },
        recommendations,
        organizations: orgCapacity.sort((a, b) => b.workload_score - a.workload_score),
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
