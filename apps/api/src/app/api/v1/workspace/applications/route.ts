import { withAuth, requireOrgMembership, handleApiError } from '@/lib/auth-guards'

export const GET = withAuth(requireOrgMembership(async (_request, user, orgId) => {
  return Response.json({
    success: true,
    data: {
      applications: [
        { id: 'inventory', name: 'Inventory', enabled: true },
        { id: 'collections', name: 'Collections', enabled: true },
        { id: 'qc', name: 'Quality Control', enabled: true },
        { id: 'processing', name: 'Processing', enabled: true },
        { id: 'exchange', name: 'Exchange', enabled: true },
        { id: 'analytics', name: 'Analytics', enabled: true },
      ],
    },
  })
}))
