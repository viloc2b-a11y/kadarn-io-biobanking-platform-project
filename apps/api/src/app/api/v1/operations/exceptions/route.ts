import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

type OrganizationName = { name: string }

const getOrganizationName = (value: OrganizationName | OrganizationName[] | null): string | null => {
  const organization = Array.isArray(value) ? value[0] : value
  return organization?.name ?? null
}

export const GET = withAuth(async (_request, user) => {
  try {
    if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
      return Response.json({ error: { code: 403, message: 'KOC access required' } }, { status: 403 })
    }

    const supabase = await createRouteClient()

    // Trust challenges are the primary exception source
    const [challengesRes, shipmentsRes, exchangeRes] = await Promise.all([
      supabase
        .from('trust_challenges')
        .select(`
          id, dimension, reason, status,
          organization_id, created_at,
          organizations ( name )
        `)
        .in('status', ['filed', 'under_review', 'escalated'])
        .order('created_at', { ascending: false })
        .limit(20),

      // Shipments with issues
      supabase
        .from('logistics_shipments')
        .select('id, status, created_at, organization_id, organizations(name)')
        .in('status', ['customs_hold', 'exception', 'returned'])
        .order('created_at', { ascending: false })
        .limit(10),

      // Blocked exchange requests
      supabase
        .from('exchange_requests')
        .select('id, status, created_at, organization_id, organizations(name)')
        .eq('status', 'disputed')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const exceptions = [
      ...(challengesRes.data ?? []).map(c => ({
        id:         c.id,
        source:     'trust',
        severity:   c.status === 'escalated' ? 'critical' : 'warning',
        type:       c.dimension as string,
        summary:    c.reason,
        org_name:   getOrganizationName(c.organizations),
        org_id:     c.organization_id,
        status:     c.status as string,
        created_at: c.created_at,
      })),
      ...(shipmentsRes.data ?? []).map(s => ({
        id:         s.id,
        source:     'logistics',
        severity:   s.status === 'exception' ? 'critical' : 'warning',
        type:       s.status,
        summary:    `Shipment ${s.status.replace(/_/g, ' ')}`,
        org_name:   getOrganizationName(s.organizations),
        org_id:     s.organization_id,
        status:     'open',
        created_at: s.created_at,
      })),
      ...(exchangeRes.data ?? []).map(e => ({
        id:         e.id,
        source:     'exchange',
        severity:   'warning',
        type:       'dispute',
        summary:    'Exchange request disputed',
        org_name:   getOrganizationName(e.organizations),
        org_id:     e.organization_id,
        status:     'open',
        created_at: e.created_at,
      })),
    ].sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 }
      return (order[a.severity as keyof typeof order] ?? 2) - (order[b.severity as keyof typeof order] ?? 2)
    })

    return Response.json({
      data: {
        total:    exceptions.length,
        critical: exceptions.filter(e => e.severity === 'critical').length,
        warning:  exceptions.filter(e => e.severity === 'warning').length,
        exceptions,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
