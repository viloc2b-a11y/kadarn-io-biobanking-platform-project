// ==========================================================================
// ORP-1.3 Derived Read Model — Roadmap Read Model
// ==========================================================================
// Pure, deterministic, non-persistent. Reads ONLY from canonical objects
// and the Passport read model (itself a pure projection).
// NEVER reads legacy flat projection keys.
// NEVER writes back to onboarding answers/state.
// ==========================================================================

import type { InstitutionalLocation } from '../institutional-locations'
import type { LocationInfrastructure } from '../location-infrastructure'
import type { ResearchTeamMember, StaffCertification } from '../research-team'
import type {
  PassportData,
  PassportCapability,
  PassportDocument,
  PassportReadinessDimension,
} from '../../passport/passport-assembler'
import {
  ROADMAP_SECTION,
  ROADMAP_PRIORITY,
  type InstitutionRoadmapAction,
  type InstitutionRoadmap,
  type RoadmapSection,
  type RoadmapPriority,
} from '../institution-roadmap'

export interface RoadmapReadModelInput {
  passport: PassportData
  locations: InstitutionalLocation[]
  teamMembers: ResearchTeamMember[]
  infrastructure: LocationInfrastructure[]
  strategicGoals: string[]
}

/**
 * Derives roadmap actions from Passport read model + canonical objects.
 *
 * Design contract (ORP-1.3):
 * - Pure function: same input → same output
 * - Stateless: no side effects, no state mutation
 * - Deterministic: no randomness
 * - Non-persistent: returns data, never writes to state
 * - Idempotent: repeated calls yield identical output
 */
export function deriveRoadmapReadModel(input: RoadmapReadModelInput): InstitutionRoadmap {
  const { passport, locations, teamMembers, infrastructure, strategicGoals } = input
  const certifications = teamMembers.flatMap((member) => member.certifications ?? [])

  const actions = [
    ...deriveImmediateActions(
      passport.evidence.documents,
      locations,
      teamMembers,
      certifications,
    ),
    ...deriveCapabilityExpansion(passport.capabilities),
    ...deriveReadinessImprovement(passport.readiness.dimensions),
    ...deriveComplianceRenewals(passport.evidence.documents, certifications),
    ...deriveStrategicGrowth(passport, infrastructure, strategicGoals),
  ]

  return {
    currentReadinessLevel: getReadinessLevel(passport.readiness.overallScore),
    targetReadinessLevel: getTargetReadinessLevel(passport.readiness.overallScore),
    actions: dedupeActions(actions).sort(sortActions),
  }
}

function deriveImmediateActions(
  documents: PassportDocument[],
  locations: InstitutionalLocation[],
  teamMembers: ResearchTeamMember[],
  certifications: StaffCertification[],
): InstitutionRoadmapAction[] {
  const missingCriticalDocuments = documents.filter(
    (document) =>
      document.status === 'missing' &&
      (document.evidenceClass === 'A' || document.evidenceClass === 'B'),
  )
  const incompleteLocations = locations.filter(
    (location) =>
      !location.name || !location.city || !location.country || !location.type,
  )
  const incompleteStaff = teamMembers.filter(
    (member) =>
      !member.firstName ||
      !member.lastName ||
      !member.primaryRole ||
      member.certifications.length === 0,
  )
  const expiredCertifications = certifications.filter((certification) =>
    isExpiredOrExpiring(certification.currentStatus),
  )
  const actions: InstitutionRoadmapAction[] = []

  if (missingCriticalDocuments.length > 0) {
    actions.push(
      createAction({
        id: 'upload-missing-critical-documents',
        section: ROADMAP_SECTION.IMMEDIATE_ACTIONS,
        priority: ROADMAP_PRIORITY.HIGH,
        title: `Upload ${missingCriticalDocuments
          .slice(0, 3)
          .map((document) => document.label)
          .join(', ')}`,
        whyItMatters:
          'Critical documents are the fastest way to turn claims into sponsor-reviewable proof.',
        improves: 'Evidence coverage, documentation readiness, sponsor qualification.',
        requiredEvidence: missingCriticalDocuments
          .slice(0, 5)
          .map((document) => document.label),
        estimatedImpact: '+12 to +20 readiness',
        linkedSection: 'Documents',
        href: '/onboarding/documents',
      }),
    )
  }

  if (incompleteStaff.length > 0) {
    actions.push(
      createAction({
        id: 'complete-required-staff-data',
        section: ROADMAP_SECTION.IMMEDIATE_ACTIONS,
        priority: ROADMAP_PRIORITY.HIGH,
        title: 'Complete required staff data and certifications',
        whyItMatters:
          'Sponsors need to see who can execute the work and which qualifications are current.',
        improves: 'People readiness, certification validity, capability confidence.',
        requiredEvidence: ['PI role', 'Coordinator roles', 'Current staff certifications'],
        estimatedImpact: '+8 to +15 readiness',
        linkedSection: 'People',
        href: '/onboarding/people',
      }),
    )
  }

  if (incompleteLocations.length > 0) {
    actions.push(
      createAction({
        id: 'add-missing-location-details',
        section: ROADMAP_SECTION.IMMEDIATE_ACTIONS,
        priority: ROADMAP_PRIORITY.MEDIUM,
        title: 'Add missing location details',
        whyItMatters:
          'Incomplete locations weaken multi-site, operational footprint, and infrastructure claims.',
        improves: 'Location completeness, multi-site readiness, infrastructure mapping.',
        requiredEvidence: [
          'Location name',
          'Location type',
          'City',
          'Country',
        ],
        estimatedImpact: '+5 to +10 readiness',
        linkedSection: 'Organization',
        href: '/onboarding/organization',
      }),
    )
  }

  if (expiredCertifications.length > 0) {
    actions.push(
      createAction({
        id: 'fix-expired-certifications',
        section: ROADMAP_SECTION.IMMEDIATE_ACTIONS,
        priority: ROADMAP_PRIORITY.HIGH,
        title: 'Fix expired or expiring certifications',
        whyItMatters:
          'Expired qualifications reduce confidence in current execution capacity.',
        improves: 'People readiness, compliance posture, sponsor review confidence.',
        requiredEvidence: expiredCertifications
          .map((certification) => certification.type || 'Staff certification')
          .slice(0, 5),
        estimatedImpact: '+6 to +12 readiness',
        linkedSection: 'People',
        href: '/onboarding/people',
      }),
    )
  }

  return actions
}

function deriveCapabilityExpansion(
  capabilities: PassportCapability[],
): InstitutionRoadmapAction[] {
  return capabilities
    .filter((capability) => capability.level !== 'Strong')
    .slice(0, 5)
    .map((capability) => {
      const negativeEvidence = capability.supportingEvidence.filter(
        (evidence) => evidence.impact === 'negative',
      )
      const requiredEvidence =
        negativeEvidence.length > 0
          ? negativeEvidence.map((evidence) => evidence.description)
          : capability.supportingEvidence.map((evidence) => evidence.label)

      return createAction({
        id: `expand-${slug(capability.name)}`,
        section: ROADMAP_SECTION.CAPABILITY_EXPANSION,
        priority:
          capability.level === 'Not available'
            ? ROADMAP_PRIORITY.HIGH
            : ROADMAP_PRIORITY.MEDIUM,
        title: `Strengthen ${capability.name}`,
        whyItMatters:
          'Capability strength determines which programs the institution can credibly support.',
        improves: `${capability.name} capability strength and supporting evidence.`,
        requiredEvidence: requiredEvidence.slice(0, 5),
        estimatedImpact:
          capability.level === 'Not available'
            ? '+10 to +18 readiness'
            : '+5 to +12 readiness',
        linkedSection: getCapabilityHref(capability),
        href: getCapabilityHref(capability),
      })
    })
}

function deriveReadinessImprovement(
  dimensions: PassportReadinessDimension[],
): InstitutionRoadmapAction[] {
  return dimensions
    .filter((dimension) => dimension.status !== 'Ready')
    .slice(0, 5)
    .map((dimension) => {
      const gaps = dimension.contributions.filter(
        (contribution) => contribution.impact === 'negative',
      )
      return createAction({
        id: `improve-${slug(dimension.name)}`,
        section: ROADMAP_SECTION.READINESS_IMPROVEMENT,
        priority:
          dimension.status === 'Needs Attention'
            ? ROADMAP_PRIORITY.HIGH
            : ROADMAP_PRIORITY.MEDIUM,
        title: `Move ${dimension.name} toward Ready`,
        whyItMatters:
          'Readiness gaps limit which sponsor programs the institution can support today.',
        improves: `${dimension.name}: current ${dimension.status}, target Ready.`,
        requiredEvidence:
          gaps.length > 0
            ? gaps.map((gap) => gap.description).slice(0, 5)
            : [dimension.detail],
        estimatedImpact: '+6 to +15 readiness',
        linkedSection: 'Readiness',
        href: '/onboarding/readiness',
      })
    })
}

function deriveComplianceRenewals(
  documents: PassportDocument[],
  certifications: StaffCertification[],
): InstitutionRoadmapAction[] {
  const expiringDocuments = documents.filter(
    (document) =>
      document.status === 'expiring_soon' || document.status === 'expired',
  )
  const expiringCertifications = certifications.filter((certification) =>
    isExpiredOrExpiring(certification.currentStatus),
  )
  const actions: InstitutionRoadmapAction[] = []

  if (expiringDocuments.length > 0) {
    actions.push(
      createAction({
        id: 'renew-expiring-documents',
        section: ROADMAP_SECTION.COMPLIANCE_RENEWAL,
        priority: ROADMAP_PRIORITY.HIGH,
        title: 'Renew expiring or expired documents',
        whyItMatters:
          'Sponsors review current validity, not only whether a document exists.',
        improves: 'Evidence freshness, compliance readiness, documentation health.',
        requiredEvidence: expiringDocuments
          .map(
            (document) =>
              `${document.label}${document.expiresAt ? ` by ${document.expiresAt}` : ''}`,
          )
          .slice(0, 5),
        estimatedImpact: '+6 to +12 readiness',
        linkedSection: 'Documents',
        href: '/onboarding/documents',
      }),
    )
  }

  if (expiringCertifications.length > 0) {
    actions.push(
      createAction({
        id: 'renew-staff-certifications',
        section: ROADMAP_SECTION.COMPLIANCE_RENEWAL,
        priority: ROADMAP_PRIORITY.MEDIUM,
        title: 'Schedule staff certification renewals',
        whyItMatters:
          'Renewal visibility prevents staff qualifications from silently becoming stale.',
        improves: 'Training currency, audit readiness, sponsor qualification.',
        requiredEvidence: expiringCertifications
          .map((certification) => certification.type || 'Staff certification')
          .slice(0, 5),
        estimatedImpact: '+4 to +10 readiness',
        linkedSection: 'People',
        href: '/onboarding/people',
      }),
    )
  }

  if (actions.length === 0) {
    actions.push(
      createAction({
        id: 'create-renewal-calendar',
        section: ROADMAP_SECTION.COMPLIANCE_RENEWAL,
        priority: ROADMAP_PRIORITY.LOW,
        title: 'Create renewal reminders for current evidence',
        whyItMatters:
          'A renewal calendar keeps the Passport current as evidence ages.',
        improves: 'Compliance continuity and document freshness.',
        requiredEvidence: [
          'Expiration dates for licenses, certifications, and critical documents',
        ],
        estimatedImpact: '+3 to +6 readiness',
        linkedSection: 'Documents',
        href: '/onboarding/documents',
      }),
    )
  }

  return actions
}

function deriveStrategicGrowth(
  passport: PassportData,
  infrastructure: LocationInfrastructure[],
  strategicGoals: string[],
): InstitutionRoadmapAction[] {
  const capabilities = passport.capabilities.map((capability) => capability.name)
  const hasBiospecimen = capabilities.includes('Biospecimen Collection')
  const hasSampleProcessing = capabilities.includes('Sample Processing')
  const hasMolecularTesting = capabilities.includes('Molecular Testing')
  const hasEarlyPhase = infrastructure.some(
    (item) =>
      item.overnightEarlyPhaseCapacity ||
      item.facilityType === 'Early Phase Unit',
  )
  const hasMultipleLocations =
    passport.institution.infrastructure.locations !== '1' &&
    passport.institution.infrastructure.locations !== 'Not specified'
  const goals =
    strategicGoals.length > 0
      ? strategicGoals
      : [
          'IVD readiness',
          'Biospecimen collection readiness',
          'Early phase readiness',
          'Multi-site readiness',
          'Sponsor qualification readiness',
        ]
  const actions: InstitutionRoadmapAction[] = []

  if (
    goals.some((goal) => goal.toLowerCase().includes('ivd')) &&
    (!hasSampleProcessing || !hasMolecularTesting)
  ) {
    actions.push(
      createAction({
        id: 'prepare-ivd-readiness',
        section: ROADMAP_SECTION.STRATEGIC_GROWTH,
        priority: ROADMAP_PRIORITY.MEDIUM,
        title: 'Prepare for IVD readiness',
        whyItMatters:
          'IVD programs require stronger lab, validation, quality, and diagnostic evidence than general clinical operations.',
        improves: 'IVD readiness, laboratory capability, sponsor qualification.',
        requiredEvidence: [
          'Sample processing evidence',
          'Molecular testing evidence',
          'Quality manual',
          'Equipment qualification records',
        ],
        estimatedImpact: '+10 to +18 readiness',
        linkedSection: 'Infrastructure',
        href: '/onboarding/infrastructure',
      }),
    )
  }

  if (
    goals.some((goal) => goal.toLowerCase().includes('biospecimen')) &&
    !hasBiospecimen
  ) {
    actions.push(
      createAction({
        id: 'prepare-biospecimen-readiness',
        section: ROADMAP_SECTION.STRATEGIC_GROWTH,
        priority: ROADMAP_PRIORITY.MEDIUM,
        title: 'Prepare for biospecimen collection readiness',
        whyItMatters:
          'Biospecimen programs depend on collection, processing, storage, shipping, and chain-of-custody proof.',
        improves:
          'Biospecimen collection readiness and sample logistics.',
        requiredEvidence: [
          'Storage equipment',
          'Temperature monitoring',
          'Shipping capability',
          'Chain of custody',
        ],
        estimatedImpact: '+8 to +16 readiness',
        linkedSection: 'Infrastructure',
        href: '/onboarding/infrastructure',
      }),
    )
  }

  if (
    goals.some((goal) => goal.toLowerCase().includes('early phase')) &&
    !hasEarlyPhase
  ) {
    actions.push(
      createAction({
        id: 'prepare-early-phase-readiness',
        section: ROADMAP_SECTION.STRATEGIC_GROWTH,
        priority: ROADMAP_PRIORITY.LOW,
        title: 'Prepare for early phase readiness',
        whyItMatters:
          'Early phase work requires higher-acuity infrastructure, staffing, monitoring, and emergency readiness.',
        improves:
          'Early phase readiness and advanced sponsor qualification.',
        requiredEvidence: [
          'Overnight capacity',
          'Infusion capability',
          'Procedure rooms',
          'Emergency protocols',
        ],
        estimatedImpact: '+8 to +14 readiness',
        linkedSection: 'Infrastructure',
        href: '/onboarding/infrastructure',
      }),
    )
  }

  if (
    goals.some((goal) => goal.toLowerCase().includes('multi-site')) &&
    !hasMultipleLocations
  ) {
    actions.push(
      createAction({
        id: 'prepare-multi-site-readiness',
        section: ROADMAP_SECTION.STRATEGIC_GROWTH,
        priority: ROADMAP_PRIORITY.LOW,
        title: 'Prepare for multi-site readiness',
        whyItMatters:
          'Multi-site readiness expands sponsor opportunities and increases operational resilience.',
        improves:
          'Operational footprint, network readiness, sponsor scalability.',
        requiredEvidence: [
          'Additional location records',
          'Location-specific infrastructure',
          'Site staffing coverage',
        ],
        estimatedImpact: '+6 to +12 readiness',
        linkedSection: 'Organization',
        href: '/onboarding/organization',
      }),
    )
  }

  actions.push(
    createAction({
      id: 'prepare-sponsor-qualification',
      section: ROADMAP_SECTION.STRATEGIC_GROWTH,
      priority:
        passport.readiness.overallScore >= 70
          ? ROADMAP_PRIORITY.MEDIUM
          : ROADMAP_PRIORITY.HIGH,
      title: 'Prepare for sponsor qualification readiness',
      whyItMatters:
        'Sponsors need a complete current Passport, evidence, readiness profile, and action plan.',
      improves:
        'Sponsor review confidence and marketplace qualification.',
      requiredEvidence: [
        'Current Passport',
        'Critical documents',
        'Resolved readiness gaps',
        'Capability support evidence',
      ],
      estimatedImpact: '+10 to +20 sponsor confidence',
      linkedSection: 'Passport',
      href: '/onboarding/passport',
    }),
  )

  return actions
}

// ==========================================================================
// HELPERS
// ==========================================================================

function createAction(
  action: InstitutionRoadmapAction,
): InstitutionRoadmapAction {
  return action
}

function dedupeActions(
  actions: InstitutionRoadmapAction[],
): InstitutionRoadmapAction[] {
  const seen = new Set<string>()
  return actions.filter((action) => {
    if (seen.has(action.id)) return false
    seen.add(action.id)
    return true
  })
}

function sortActions(
  a: InstitutionRoadmapAction,
  b: InstitutionRoadmapAction,
): number {
  const priority: Record<string, number> = { High: 0, Medium: 1, Low: 2 }
  return priority[a.priority] - priority[b.priority]
}

function getReadinessLevel(score: number): string {
  if (score >= 85) return 'Comprehensive'
  if (score >= 70) return 'Advanced'
  if (score >= 45) return 'Emerging'
  return 'Foundational'
}

function getTargetReadinessLevel(score: number): string {
  if (score >= 85) return 'Sustain Comprehensive'
  if (score >= 70) return 'Comprehensive'
  if (score >= 45) return 'Advanced'
  return 'Emerging'
}

function getCapabilityHref(capability: PassportCapability): string {
  if (
    capability.domains.some((domain) =>
      ['people', 'organization'].includes(domain),
    )
  )
    return '/onboarding/people'
  if (
    capability.domains.some((domain) =>
      ['laboratory', 'equipment', 'facilities', 'biospecimen'].includes(domain),
    )
  )
    return '/onboarding/infrastructure'
  return '/onboarding/documents'
}

function isExpiredOrExpiring(status: string): boolean {
  return status === 'Expired' || status === 'Expiring Soon'
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
