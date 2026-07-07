// ==========================================================================
// Sponsor Intelligence — Multi-Actor Visibility (KTP-1.6 / Mission 7)
// ==========================================================================

import type { ActorRole, VisibilityRule } from './dto'

/**
 * RLS-aware visibility rules per actor type.
 * All functions are pure — no DB access, no side effects.
 */

export function canActorSeeInstitution(
  actorRole: ActorRole,
  institutionId: string,
  visibilityScope: string,
  actorOrganizationId?: string,
  portfolioInstitutionIds?: string[],
  programInstitutionIds?: string[]
): boolean {
  switch (actorRole) {
    case 'admin':
      return true

    case 'institution':
      // Institution can only see itself
      return institutionId === actorOrganizationId

    case 'sponsor':
      // Sponsor can see institutions with network visibility OR institutions in their portfolio
      if (visibilityScope === 'network' || visibilityScope === 'public') return true
      if (portfolioInstitutionIds?.includes(institutionId)) return true
      return false

    case 'cro':
      // CRO can see institutions in programs they manage
      if (visibilityScope === 'network' || visibilityScope === 'public') return true
      if (programInstitutionIds?.includes(institutionId)) return true
      return false

    default:
      return false
  }
}

export function canActorSeeEvaluationDetail(
  actorRole: ActorRole,
  institutionId: string,
  actorOrganizationId?: string
): boolean {
  switch (actorRole) {
    case 'admin':
    case 'institution':
      return institutionId === actorOrganizationId || actorRole === 'admin'
    case 'sponsor':
    case 'cro':
      // Detail access is restricted to network-visible or portfolio institutions
      return true // filtered upstream by canActorSeeInstitution
    default:
      return false
  }
}

export function getVisibleEvaluations(
  actorRole: ActorRole,
  evaluations: Array<{ organization_id: string; visibility_scope: string }>,
  actorOrganizationId?: string
): Array<{ organization_id: string; visibility_scope: string }> {
  return evaluations.filter((e) =>
    canActorSeeInstitution(actorRole, e.organization_id, e.visibility_scope, actorOrganizationId)
  )
}
