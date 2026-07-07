import { withAuth, handleApiError } from '@/lib/auth-guards'
import { ReconstructService } from '@kadarn/evidence-lineage'

const reconstruct = new ReconstructService()

/**
 * GET /api/v1/evidence-lineage/claims/:id/provenance
 * Sprint 28E — authenticated; in-memory until persistence wired (remediation P2.3).
 */
export const GET = withAuth(async (_request, _user, params) => {
  try {
    const id = params?.id
    if (!id) {
      return Response.json(
        { data: null, error: { code: 'BAD_REQUEST', message: 'Claim id required' } },
        { status: 400 },
      )
    }

    const provenance = reconstruct.getProvenance(id)

    if (!provenance) {
      return Response.json(
        { data: null, error: { code: 'NOT_FOUND', message: `Provenance not found for claim ${id}` } },
        { status: 404 },
      )
    }

    return Response.json({ data: provenance, error: null })
  } catch (error) {
    return handleApiError(error)
  }
})
