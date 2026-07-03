import { withAuth, requireOrgMembership, handleApiError } from '@/lib/auth-guards'

export const GET = withAuth(requireOrgMembership(async (request, user, orgId) => {
  const { searchParams } = new URL(request.url)
  const programId = searchParams.get('programId') ?? 'prog-001'

  return Response.json({
    success: true,
    data: {
      programId,
      programName: 'Oncology Biomarker Validation 2024-05',
      organizations: [
        { id: orgId, name: 'Current Organization', role: 'Requester' },
        { id: 'org-2', name: 'National Biobank', role: 'Biobank' },
      ],
      kpe: { overall: 85, evidence_complete: 90, governance_complete: 80 },
    },
  })
}))
