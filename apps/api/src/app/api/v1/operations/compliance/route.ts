import { withAuth, requireRole, handleApiError } from '@/lib/auth-guards'

export const GET = withAuth(requireRole('kadarn_internal', async (_request, user) => {
  return Response.json({
    success: true,
    data: {
      policies: [
        { id: 'pol-001', name: 'Oncology Use Only', domain: 'governance', status: 'active', evaluations: 47, violations: 0 },
        { id: 'pol-002', name: 'High-Value Shipment Authorization', domain: 'financial', status: 'active', evaluations: 12, violations: 2 },
        { id: 'pol-003', name: 'Minimum Confidence Threshold', domain: 'operational', status: 'active', evaluations: 89, violations: 3 },
      ],
    },
  })
}))
