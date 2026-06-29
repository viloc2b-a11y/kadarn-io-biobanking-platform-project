import { withAuth, handleApiError, ApiError } from '@/lib/supabase-server'
import { withRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const querySchema = z.object({
  programId: z.string().uuid('programId query param must be a valid UUID'),
})

/**
 * Deprecated alias — redirects to canonical KPE report:
 * GET /api/v1/programs/:programId/kpe
 */
export const GET = withRateLimit(
  withAuth(async (request, user) => {
    try {
      if (user.user_metadata?.kadarn_role !== 'kadarn_internal') {
        throw new ApiError(403, 'KOC access required')
      }

      const url = new URL(request.url)
      const { programId } = querySchema.parse({
        programId: url.searchParams.get('programId'),
      })

      url.pathname = `/api/v1/programs/${programId}/kpe`
      url.search = ''

      return Response.redirect(url.toString(), 308)
    } catch (err) {
      return handleApiError(err)
    }
  }),
)
