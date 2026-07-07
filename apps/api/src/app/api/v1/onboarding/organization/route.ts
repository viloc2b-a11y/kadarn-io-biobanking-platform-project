import { badRequest, successResponse } from '@/lib/api-response'
import { provisionOrganizationFirst } from '@/lib/onboarding-provisioning'
import { organizationProvisioningRequestSchema } from '@/lib/onboarding-provisioning-plan'
import { rateLimit, PUBLIC_RATE_LIMIT } from '@/lib/rate-limit'
import { handleApiError, withErrorHandling } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export const POST = rateLimit(PUBLIC_RATE_LIMIT, withErrorHandling(async (request: Request) => {
  try {
    const body = (await request.json()) as unknown
    const parsed = organizationProvisioningRequestSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest('Validation error', JSON.stringify(parsed.error.flatten().fieldErrors))
    }

    const result = await provisionOrganizationFirst(parsed.data)
    return Response.json(successResponse(result), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}))
