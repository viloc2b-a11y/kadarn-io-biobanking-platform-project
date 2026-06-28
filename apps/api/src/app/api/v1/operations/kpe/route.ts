import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const GET = withAuth(async (request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('program_id')

    const supabase = await createRouteClient()

    let programQuery = supabase
      .from('programs')
      .select(`
        id, name, short_name, status, updated_at,
        program_milestones ( id, name, status, due_date, completion_percentage )
      `)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (programId) programQuery = programQuery.eq('id', programId)

    const { data: programs, error } = await programQuery

    if (error) {
      return Response.json({ error: { code: 500, message: error.message } }, { status: 500 })
    }

    // Derive KPE metrics per program from milestones
    const programKpe = (programs ?? []).map(p => {
      const milestones = p.program_milestones ?? []
      const total      = milestones.length
      const completed  = milestones.filter((m: { status: string }) => m.status === 'completed').length
      const overdue    = milestones.filter((m: { status: string; due_date: string }) =>
        m.status !== 'completed' && m.due_date && new Date(m.due_date) < new Date()
      ).length

      const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

      // KPE dimensions — derived from milestone categories (simplified)
      const evidenceMilestones    = milestones.filter((m: { name: string }) => m.name?.toLowerCase().includes('evidence') || m.name?.toLowerCase().includes('document'))
      const governanceMilestones  = milestones.filter((m: { name: string }) => m.name?.toLowerCase().includes('irb') || m.name?.toLowerCase().includes('consent') || m.name?.toLowerCase().includes('governance'))
      const provenanceMilestones  = milestones.filter((m: { name: string }) => m.name?.toLowerCase().includes('provenance') || m.name?.toLowerCase().includes('collection'))
      const settlementMilestones  = milestones.filter((m: { name: string }) => m.name?.toLowerCase().includes('payment') || m.name?.toLowerCase().includes('settlement'))

      function dimScore(dims: { status: string }[]) {
        if (dims.length === 0) return null
        const done = dims.filter(d => d.status === 'completed').length
        return Math.round((done / dims.length) * 100)
      }

      return {
        program_id:    p.id,
        program_name:  p.short_name ?? p.name,
        overall:       completionPct,
        milestones:    { total, completed, overdue },
        dimensions: {
          evidence:   dimScore(evidenceMilestones),
          governance: dimScore(governanceMilestones),
          provenance: dimScore(provenanceMilestones),
          settlement: dimScore(settlementMilestones),
        },
        audit_ready:   overdue === 0 && completionPct >= 80,
      }
    })

    const networkKpe = programKpe.length > 0
      ? Math.round(programKpe.reduce((s, p) => s + p.overall, 0) / programKpe.length)
      : 0

    return Response.json({
      data: {
        network_kpe:     networkKpe,
        program_count:   programKpe.length,
        audit_ready:     programKpe.filter(p => p.audit_ready).length,
        programs:        programKpe,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
