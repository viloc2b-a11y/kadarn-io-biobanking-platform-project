import { NextRequest } from 'next/server'
import { handleApiError } from '@/lib/auth-guards'
import { ReconstructService } from '@kadarn/evidence-lineage'

const reconstruct = new ReconstructService()

/**
 * GET /api/v1/evidence-lineage/claims/:id/provenance
 * Sprint 28E — Claim provenance lookup (in-memory engine until persistence wired)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
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
}
