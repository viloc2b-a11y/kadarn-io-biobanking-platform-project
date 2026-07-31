// ==========================================================================
// KEMS-SITE-PROFILE — Attest Site Profile Version
// POST /api/v1/site-profiles/[id]/attest
// Creates an attestation for the current profile version.
// On first attestation, transitions profile from 'review' → 'attested'.
// ==========================================================================

import { withAuth, handleApiError } from '@/lib/supabase-server'
import { getProfileService } from '@/lib/profile-service-factory'
import { ProfileServiceError } from '@kadarn/platform-services'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().uuid() })

const attestBodySchema = z.object({
  attester_role: z.string().optional(),
  attestation_type: z.string().min(1, 'attestation_type is required'),
  statement: z.string().optional(),
  signature_ref: z.string().optional(),
  verified_by: z.string().uuid().optional(),
})

export const POST = withAuth(async (request, user, params) => {
  try {
    const { id } = paramsSchema.parse(params)
    const body = await request.json() as Record<string, unknown>

    const parsed = attestBodySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const service = getProfileService()
    const attestation = await service.attestVersion(id, {
      attesterId: user.id,
      attesterRole: parsed.data.attester_role,
      attestationType: parsed.data.attestation_type,
      statement: parsed.data.statement,
      signatureRef: parsed.data.signature_ref,
      verifiedBy: parsed.data.verified_by,
    })

    return Response.json({ data: attestation, error: null }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ data: null, error: 'Invalid profile ID' }, { status: 400 })
    }
    if (error instanceof ProfileServiceError) {
      return Response.json({ data: null, error: error.message }, { status: mapServiceCode(error.code) })
    }
    return handleApiError(error)
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────

function mapServiceCode(code: string): number {
  switch (code) {
    case 'NOT_FOUND': return 404
    case 'NO_VERSION': return 422
    case 'ATTEST_FAILED': return 500
    default: return 500
  }
}
