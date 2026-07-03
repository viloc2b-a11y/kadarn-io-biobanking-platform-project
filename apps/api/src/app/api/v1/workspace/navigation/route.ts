import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic';
type CapabilityKey = { key: string }

// Capability key → nav items
const CAP_NAV: Record<string, { id: string; label: string; href: string; section: string }[]> = {
  biobank: [
    { id: 'inventory',   label: 'Inventory',   href: '/workspace/inventory',   section: 'Operations' },
    { id: 'collections', label: 'Collections', href: '/workspace/collections', section: 'Operations' },
    { id: 'qc',          label: 'Quality Control', href: '/workspace/qc',      section: 'Operations' },
  ],
  processing_lab: [
    { id: 'processing',  label: 'Processing',  href: '/workspace/processing',  section: 'Operations' },
    { id: 'qc',          label: 'Quality Control', href: '/workspace/qc',      section: 'Operations' },
  ],
  storage_facility: [
    { id: 'inventory',   label: 'Inventory',   href: '/workspace/inventory',   section: 'Operations' },
    { id: 'logistics',   label: 'Logistics',   href: '/workspace/logistics',   section: 'Operations' },
  ],
  sponsor: [
    { id: 'programs',    label: 'Programs',    href: '/workspace/programs',    section: 'Programs' },
    { id: 'discovery',   label: 'Discovery',   href: '/marketplace',           section: 'Programs' },
  ],
  cro: [
    { id: 'programs',    label: 'Programs',    href: '/workspace/programs',    section: 'Programs' },
    { id: 'logistics',   label: 'Logistics',   href: '/workspace/logistics',   section: 'Operations' },
  ],
  clinical_site: [
    { id: 'consent',     label: 'Consent',     href: '/workspace/consent',     section: 'Clinical' },
    { id: 'collections', label: 'Collections', href: '/workspace/collections', section: 'Clinical' },
  ],
  logistics_vendor: [
    { id: 'logistics',   label: 'Logistics',   href: '/workspace/logistics',   section: 'Operations' },
  ],
  irb: [
    { id: 'regulatory',  label: 'Regulatory',  href: '/workspace/regulatory',  section: 'Governance' },
  ],
  regulatory_body: [
    { id: 'regulatory',  label: 'Regulatory',  href: '/workspace/regulatory',  section: 'Governance' },
  ],
  diagnostic_lab: [
    { id: 'processing',  label: 'Processing',  href: '/workspace/processing',  section: 'Operations' },
    { id: 'qc',          label: 'Quality Control', href: '/workspace/qc',      section: 'Operations' },
  ],
}

// Always present regardless of capabilities
const BASE_NAV = [
  { id: 'overview',  label: 'Overview',  href: '/workspace',           section: 'Workspace' },
  { id: 'exchange',  label: 'Exchange',  href: '/workspace/exchange',  section: 'Workspace' },
  { id: 'analytics', label: 'Analytics', href: '/workspace/analytics', section: 'Workspace' },
]

const ORG_NAV = [
  { id: 'profile',   label: 'Profile',   href: '/workspace/profile',   section: 'Organization' },
  { id: 'documents', label: 'Documents', href: '/workspace/documents', section: 'Organization' },
  { id: 'evidence_discovery', label: 'Institutional Discovery', href: '/workspace/discovery', section: 'Organization' },
  { id: 'payments',  label: 'Payments',  href: '/workspace/payments',  section: 'Organization' },
]

export const GET = withAuth(async (_request, user) => {
  try {
  const supabase = await createRouteClient()

  const activeOrgId = user.user_metadata?.active_org_id as string | null
  if (!activeOrgId) {
    return Response.json({ data: { sections: [] }, error: null })
  }

  // Get capabilities for active org
  const { data: caps } = await supabase
    .from('organization_capabilities')
    .select('organization_capability_types(key)')
    .eq('organization_id', activeOrgId)

  const capKeys = (caps ?? [])
    .map(c => {
      const capabilityType = Array.isArray(c.organization_capability_types)
        ? c.organization_capability_types[0] as CapabilityKey | undefined
        : c.organization_capability_types as CapabilityKey | null

      return capabilityType?.key
    })
    .filter(Boolean) as string[]

  // Resolve nav items from capabilities (deduplicate by id)
  const seen = new Set<string>()
  const items: typeof BASE_NAV = [...BASE_NAV]

  for (const key of capKeys) {
    for (const item of CAP_NAV[key] ?? []) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        items.push(item)
      }
    }
  }
  items.push(...ORG_NAV)

  // Group by section preserving order
  const sectionMap = new Map<string, typeof BASE_NAV>()
  for (const item of items) {
    if (!sectionMap.has(item.section)) sectionMap.set(item.section, [])
    sectionMap.get(item.section)!.push(item)
  }

  const sections = [...sectionMap.entries()].map(([label, navItems]) => ({ label, items: navItems }))

  return Response.json({ data: { sections, capability_keys: capKeys }, error: null })
  } catch (err) {
    return handleApiError(err)
  }
})
