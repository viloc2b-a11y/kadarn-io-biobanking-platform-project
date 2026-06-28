import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

type OrganizationName = { name: string }
type ProgramSummary = { id: string; name: string; short_name: string | null; status: string }

const firstRelation = <T>(value: T | T[] | null): T | null => {
  return Array.isArray(value) ? value[0] ?? null : value
}

export const GET = withAuth(async (_request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const supabase = await createRouteClient()
    const now      = new Date()
    const soon     = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days ahead

    const [milestonesRes, shipmentsRes, exchangeRes] = await Promise.all([
      // Milestones with planned dates (SLA proxy for programs)
      supabase
        .from('program_milestones')
        .select(`
          id, title, status, planned_end_date, actual_end_date, milestone_type,
          programs ( id, name, short_name, status ),
          organizations ( name )
        `)
        .not('planned_end_date', 'is', null)
        .neq('status', 'completed')
        .order('planned_end_date', { ascending: true })
        .limit(100),

      // Shipments overdue (estimated_delivery in the past, not delivered)
      supabase
        .from('logistics_shipments')
        .select('id, shipment_name, status, estimated_delivery, shipped_date, organization_id, organizations(name)')
        .not('estimated_delivery', 'is', null)
        .in('status', ['in_transit', 'pending', 'picked_up', 'customs_hold'])
        .order('estimated_delivery', { ascending: true })
        .limit(50),

      // Exchange requests pending a long time (submitted > 14 days ago)
      supabase
        .from('exchange_requests')
        .select('id, status, created_at, requested_timeline_days, organization_id, organizations(name)')
        .in('status', ['submitted', 'under_review'])
        .order('created_at', { ascending: true })
        .limit(50),
    ])

    const milestones = milestonesRes.data ?? []
    const shipments  = shipmentsRes.data ?? []
    const exchanges  = exchangeRes.data ?? []

    // SLA status per milestone
    const milestoneItems = milestones.map(m => {
      const plannedEnd = new Date(m.planned_end_date!)
      const daysUntil  = Math.round((plannedEnd.getTime() - now.getTime()) / 86400000)
      const overdue    = daysUntil < 0
      const dueSoon    = !overdue && daysUntil <= 7
      const program    = firstRelation(m.programs as ProgramSummary | ProgramSummary[] | null)
      const org        = firstRelation(m.organizations as OrganizationName | OrganizationName[] | null)

      return {
        id:              m.id,
        type:            'milestone',
        title:           m.title,
        milestone_type:  m.milestone_type,
        program_id:      program?.id ?? null,
        program_name:    program?.short_name ?? program?.name ?? null,
        org_name:        org?.name ?? null,
        due_date:        m.planned_end_date,
        days_until_due:  daysUntil,
        sla_status:      overdue ? 'overdue' : dueSoon ? 'at_risk' : 'on_track',
      }
    })

    // SLA status per shipment
    const shipmentItems = shipments.map(s => {
      const estimatedDel = new Date(s.estimated_delivery!)
      const daysUntil    = Math.round((estimatedDel.getTime() - now.getTime()) / 86400000)
      const org          = firstRelation(s.organizations as OrganizationName | OrganizationName[] | null)

      return {
        id:              s.id,
        type:            'shipment',
        title:           s.shipment_name,
        org_name:        org?.name ?? null,
        due_date:        s.estimated_delivery,
        days_until_due:  daysUntil,
        sla_status:      daysUntil < 0 ? 'overdue' : daysUntil <= 3 ? 'at_risk' : 'on_track',
        shipment_status: s.status,
      }
    })

    // SLA for exchange requests — compare age vs requested_timeline_days
    const exchangeItems = exchanges.map(e => {
      const createdAt    = new Date(e.created_at)
      const ageMs        = now.getTime() - createdAt.getTime()
      const ageDays      = Math.round(ageMs / 86400000)
      const timelineDays = e.requested_timeline_days ?? 30
      const remainingDays = timelineDays - ageDays
      const org          = firstRelation(e.organizations as OrganizationName | OrganizationName[] | null)

      return {
        id:              e.id,
        type:            'exchange_request',
        title:           `Exchange request (${e.status})`,
        org_name:        org?.name ?? null,
        due_date:        new Date(createdAt.getTime() + timelineDays * 86400000).toISOString(),
        days_until_due:  remainingDays,
        age_days:        ageDays,
        requested_timeline_days: timelineDays,
        sla_status:      remainingDays < 0 ? 'overdue' : remainingDays <= 5 ? 'at_risk' : 'on_track',
      }
    })

    const allItems = [...milestoneItems, ...shipmentItems, ...exchangeItems]
      .sort((a, b) => a.days_until_due - b.days_until_due)

    // Phase timing from completed milestones
    const { data: completedMilestones } = await supabase
      .from('program_milestones')
      .select('milestone_type, planned_end_date, actual_end_date')
      .eq('status', 'completed')
      .not('planned_end_date', 'is', null)
      .not('actual_end_date', 'is', null)
      .limit(200)

    const phaseTimingMap: Record<string, number[]> = {}
    for (const m of completedMilestones ?? []) {
      const planned = new Date(m.planned_end_date!).getTime()
      const actual  = new Date(m.actual_end_date!).getTime()
      const delta   = Math.round((actual - planned) / 86400000) // positive = late
      if (!phaseTimingMap[m.milestone_type]) phaseTimingMap[m.milestone_type] = []
      phaseTimingMap[m.milestone_type].push(delta)
    }

    const phaseAverages = Object.entries(phaseTimingMap).map(([phase, deltas]) => ({
      phase,
      avg_delay_days: Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length),
      sample_size:    deltas.length,
    })).sort((a, b) => b.avg_delay_days - a.avg_delay_days)

    const bottlenecks = phaseAverages.filter(p => p.avg_delay_days > 5)

    return Response.json({
      data: {
        summary: {
          overdue:   allItems.filter(i => i.sla_status === 'overdue').length,
          at_risk:   allItems.filter(i => i.sla_status === 'at_risk').length,
          on_track:  allItems.filter(i => i.sla_status === 'on_track').length,
          total:     allItems.length,
        },
        items:        allItems,
        bottlenecks,
        phase_timing: phaseAverages,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
