// ==========================================================================
// KEMS-SITE-PROFILE — Profile Content Gaps
// GET /api/v1/site-profiles/[id]/gaps
// Returns a list of missing or incomplete content sections in the profile.
// Identifies which required and optional sections are absent or empty.
// ==========================================================================

import { withAuth, handleApiError } from '@/lib/supabase-server'
import { getProfileService } from '@/lib/profile-service-factory'
import { ProfileServiceError } from '@kadarn/platform-services'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().uuid() })

// Section definitions (mirrors ProfileService internals)
const REQUIRED_SECTIONS = ['identity', 'contact', 'capabilities', 'compliance'] as const
const OPTIONAL_SECTIONS = [
  'facilities', 'equipment', 'personnel', 'quality_metrics',
  'therapeutic_areas', 'study_experience', 'documentation',
] as const

interface GapInfo {
  section: string
  required: boolean
  present: boolean
  message: string
}

export const GET = withAuth(async (_request, _user, params) => {
  try {
    const { id } = paramsSchema.parse(params)
    const service = getProfileService()

    // Fetch the full profile (with content)
    const { profile } = await service.getProfile(id)
    const content = (profile.content as Record<string, unknown>) ?? {}

    const gaps: GapInfo[] = []

    // Check required sections
    for (const section of REQUIRED_SECTIONS) {
      const hasContent = content[section] !== undefined && content[section] !== null
      if (!hasContent) {
        gaps.push({
          section,
          required: true,
          present: false,
          message: `Required section '${section}' is missing`,
        })
      } else {
        // Check if the section has meaningful content (not just an empty object)
        const value = content[section]
        const isEmpty = typeof value === 'object' && value !== null && Object.keys(value as object).length === 0
        if (isEmpty) {
          gaps.push({
            section,
            required: true,
            present: true,
            message: `Required section '${section}' exists but is empty`,
          })
        }
      }
    }

    // Check optional sections
    for (const section of OPTIONAL_SECTIONS) {
      const hasContent = content[section] !== undefined && content[section] !== null
      if (!hasContent) {
        gaps.push({
          section,
          required: false,
          present: false,
          message: `Optional section '${section}' is missing`,
        })
      } else {
        const value = content[section]
        const isEmpty = typeof value === 'object' && value !== null && Object.keys(value as object).length === 0
        if (isEmpty) {
          gaps.push({
            section,
            required: false,
            present: true,
            message: `Optional section '${section}' exists but is empty`,
          })
        }
      }
    }

    const missingRequired = gaps.filter((g) => g.required && !g.present).length
    const totalGaps = gaps.filter((g) => !g.present).length

    return Response.json({
      data: {
        gaps,
        summary: {
          total_gaps: totalGaps,
          missing_required: missingRequired,
          missing_optional: totalGaps - missingRequired,
        },
      },
      error: null,
    })
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
    default: return 500
  }
}
