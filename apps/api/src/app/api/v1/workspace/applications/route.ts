import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withRateLimit } from '@/lib/rate-limit'
import { requireActiveOrg } from '@/lib/workspace'

const CAPABILITY_APPS: Record<string, { id: string; name: string }[]> = {
  biobank: [
    { id: 'inventory', name: 'Inventory' },
    { id: 'collections', name: 'Collections' },
    { id: 'qc', name: 'Quality Control' },
  ],
  processing_lab: [
    { id: 'processing', name: 'Processing' },
    { id: 'qc', name: 'Quality Control' },
  ],
  storage_facility: [
    { id: 'inventory', name: 'Inventory' },
    { id: 'logistics', name: 'Logistics' },
  ],
  sponsor: [
    { id: 'programs', name: 'Programs' },
    { id: 'exchange', name: 'Exchange' },
  ],
  cro: [
    { id: 'programs', name: 'Programs' },
    { id: 'logistics', name: 'Logistics' },
  ],
  clinical_site: [
    { id: 'consent', name: 'Consent' },
    { id: 'collections', name: 'Collections' },
  ],
  logistics_vendor: [{ id: 'logistics', name: 'Logistics' }],
  irb: [{ id: 'regulatory', name: 'Regulatory' }],
  regulatory_body: [{ id: 'regulatory', name: 'Regulatory' }],
  diagnostic_lab: [
    { id: 'processing', name: 'Processing' },
    { id: 'qc', name: 'Quality Control' },
  ],
}

const BASE_APPS = [
  { id: 'overview', name: 'Overview', enabled: true },
  { id: 'exchange', name: 'Exchange', enabled: true },
  { id: 'analytics', name: 'Analytics', enabled: true },
  { id: 'documents', name: 'Documents', enabled: true },
  { id: 'payments', name: 'Payments', enabled: true },
]

type CapabilityRow = { organization_capability_types: { key: string } | { key: string }[] | null }

export const GET = withRateLimit(
  withAuth(async (_request, user) => {
    try {
      const supabase = await createRouteClient()
      const orgId = requireActiveOrg(user)

      const { data: caps, error } = await supabase
        .from('organization_capabilities')
        .select('organization_capability_types(key)')
        .eq('organization_id', orgId)

      if (error) throw new ApiError(500, 'Failed to fetch capabilities', error.message)

      const capKeys = (caps ?? [])
        .map((c: CapabilityRow) => {
          const t = c.organization_capability_types
          const row = Array.isArray(t) ? t[0] : t
          return row?.key
        })
        .filter(Boolean) as string[]

      const seen = new Set<string>()
      const applications = [...BASE_APPS]

      for (const key of capKeys) {
        for (const app of CAPABILITY_APPS[key] ?? []) {
          if (!seen.has(app.id)) {
            seen.add(app.id)
            applications.push({ id: app.id, name: app.name, enabled: true })
          }
        }
      }

      return Response.json({
        data: { organization_id: orgId, applications },
        error: null,
      })
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
