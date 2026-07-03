import { withAuth, requireOrgMembership, handleApiError } from '@/lib/auth-guards'

export const dynamic = 'force-dynamic'

export const GET = withAuth(requireOrgMembership(async (_request, user, orgId) => {
  return Response.json({
    success: true,
    data: {
      orgId,
      message: 'Organization-scoped data for ' + orgId,
      items: [],
    },
  })
}))
