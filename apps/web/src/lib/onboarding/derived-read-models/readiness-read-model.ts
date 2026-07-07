// ==========================================================================
// ORP-1.3 Derived Read Model — Readiness Read Model
// ==========================================================================
// Pure, deterministic, non-persistent. Reads ONLY from canonical objects.
// NEVER reads legacy flat projection keys (LEGACY_FLAT_PROJECTION_KEYS).
// NEVER writes back to onboarding answers/state.
//
// Derives readiness from:
// - Canonical object completeness (locations, team, infrastructure, documents)
// - Document coverage from evidence
// - Capability strength from capability read model
// ==========================================================================

import type { InstitutionalLocation } from '../institutional-locations'
import type { LocationInfrastructure } from '../location-infrastructure'
import type { ResearchTeamMember } from '../research-team'
import type {
  PassportCapability,
  PassportReadiness,
  PassportReadinessDimension,
  PassportEvidence,
} from '../../passport/passport-assembler'
import type { KnowledgeContext } from './types'

export interface ReadinessReadModelInput {
  capabilities: PassportCapability[]
  evidence: PassportEvidence
  locations: InstitutionalLocation[]
  teamMembers: ResearchTeamMember[]
  infrastructure: LocationInfrastructure[]
  hasBackupPower: boolean
  hasDedicatedSpace: boolean
  hasTemperatureMonitoring: boolean
  hasDigitalCustody: boolean
  hasPriorStudies: boolean
}

/**
 * Derives readiness exclusively from canonical object completeness.
 *
 * @frozen ORP-1.6 — public interface will not change.
 *
 * Design contract (ORP-1.5):
 * - Pure function: same input → same output
 * - Stateless: no side effects, no state mutation
 * - Deterministic: no Date.now(), no randomness
 * - Non-persistent: returns data, never writes to state
 * - Idempotent: repeated calls with same input yield identical output
 *
 * When canonical objects are empty, scores "Needs Attention" with
 * detail explaining what canonical objects are missing.
 */
export function deriveReadinessReadModel(input: ReadinessReadModelInput): PassportReadiness {
  const claims = input.knowledge?.claims ?? []
  const claimContributions = claims.length > 0
    ? claims.map(function(c) { return {
        label: c.statement.slice(0, 80),
        impact: (c.confidence === 'High' || c.confidence === 'Medium' ? 'positive' : 'pending') as 'positive' | 'negative' | 'pending',
        points: c.confidence === 'High' ? 15 : c.confidence === 'Medium' ? 10 : 5,
        description: c.statement,
        claimId: c.id,
      }})
    : []
  const { capabilities, evidence, locations, teamMembers, infrastructure } = input
  const strongCaps = capabilities.filter((c) => c.level === 'Strong').length
  const totalCaps = capabilities.length || 1
  const capScore = Math.round((strongCaps / totalCaps) * 100)

  // Completeness signals from canonical objects
  const locationCompleteness = locations.filter(
    (l) => l.name && l.city && l.country && l.type,
  ).length
  const teamCompleteness = teamMembers.filter(
    (m) => m.firstName && m.lastName && m.primaryRole,
  ).length
  const infraCompleteness = infrastructure.length
  const docUploaded = evidence.uploadedDocuments

  // Regulatory Readiness — based on document coverage
  const regScore = docUploaded >= 3 ? 80 : docUploaded >= 1 ? 50 : 30
  const regStatus =
    docUploaded >= 3 ? 'Ready' : docUploaded >= 1 ? 'Partial' : ('Needs Attention' as const)

  // Operational Readiness — based on backup power + dedicated space
  const opScore = input.hasBackupPower ? (input.hasDedicatedSpace ? 85 : 65) : 40
  const opStatus = input.hasBackupPower ? 'Ready' : ('Partial' as const)

  // Laboratory Readiness — based on infrastructure completeness
  const hasLab = infrastructure.some((item) => item.laboratoryPresent)
  const processing = Array.from(
    new Set(
      infrastructure
        .filter(
          (item) => item.laboratoryPresent || item.biospecimenProcessingPresent,
        )
        .flatMap((item) => item.biospecimenOperations)
        .filter((op) => op !== 'None'),
    ),
  )
  const labScore = hasLab ? Math.min(95, 50 + processing.length * 5 + infraCompleteness * 3) : 10
  const labStatus: PassportReadinessDimension['status'] =
    labScore >= 80 ? 'Ready' : labScore >= 45 ? 'Partial' : 'Needs Attention'

  // Biospecimen Readiness — based on biospecimen operations + custody + shipping
  const hasBiospecimen = infrastructure.some((item) =>
    item.biospecimenOperations.some((op) => op !== 'None'),
  )
  const hasInternationalShipping = infrastructure.some(
    (item) => item.shippingCapability === 'Domestic and international',
  )
  const bioScore = hasBiospecimen
    ? input.hasDigitalCustody
      ? 85
      : 55
    : 10
  const bioStatus: PassportReadinessDimension['status'] = hasBiospecimen
    ? input.hasDigitalCustody
      ? 'Ready'
      : 'Partial'
    : 'Needs Attention'

  // Documentation Readiness — based on evidence health
  const docScore = evidence.healthScore
  const docStatus: PassportReadinessDimension['status'] =
    docScore >= 70 ? 'Ready' : docScore >= 40 ? 'Partial' : 'Needs Attention'

  const dimensions: PassportReadinessDimension[] = [
    {
      name: 'Regulatory Readiness',
      score: regScore,
      status: regStatus,
      detail:
        regStatus === 'Ready'
          ? 'Key certifications and licenses present.'
          : regStatus === 'Partial'
            ? 'Some critical documents uploaded; more needed for full readiness.'
            : 'No critical documents uploaded. Complete organization and document sections.',
      contributions: [
        ...(docUploaded >= 3
          ? [
              {
                label: docUploaded + ' documents verified',
                impact: 'positive' as const,
                points: docUploaded * 15,
                description: 'Critical regulatory documents uploaded',
                evidenceClass: 'A' as const,
              },
            ]
          : docUploaded >= 1
            ? [
                {
                  label: docUploaded + ' documents uploaded',
                  impact: 'positive' as const,
                  points: docUploaded * 10,
                  description: 'Some documents present; upload remaining critical documents',
                },
              ]
            : [
                {
                  label: 'No documents uploaded',
                  impact: 'negative' as const,
                  points: -20,
                  description: 'Upload CLIA, IRB, and business license',
                },
              ]),
      ],
    },
    {
      name: 'Operational Readiness',
      score: opScore,
      status: opStatus,
      detail: input.hasBackupPower
        ? 'Backup power + ' +
          (input.hasDedicatedSpace ? 'dedicated' : 'shared') +
          ' research space.'
        : 'No backup power. Infrastructure section needs completion.',
      contributions: [
        ...(input.hasBackupPower
          ? [
              {
                label: 'Backup power (generator + UPS)',
                impact: 'positive' as const,
                points: 30,
                description: 'Critical equipment and storage protected during outages',
              },
            ]
          : [
              {
                label: 'No backup power',
                impact: 'negative' as const,
                points: -25,
                description: 'Power failure risks specimen integrity',
              },
            ]),
        {
          label: input.hasDedicatedSpace
            ? 'Dedicated research space'
            : 'No dedicated research space',
          impact: input.hasDedicatedSpace ? ('positive' as const) : ('negative' as const),
          points: input.hasDedicatedSpace ? 20 : -10,
          description: input.hasDedicatedSpace
            ? 'Research wing with exam rooms and processing areas'
            : 'Add dedicated research space for improved operational readiness',
        },
      ],
    },
    {
      name: 'Laboratory Readiness',
      score: labScore,
      status: labStatus,
      detail: hasLab
        ? 'Lab with ' +
          processing.length +
          ' processing capabilities across ' +
          infraCompleteness +
          ' locations.'
        : 'No laboratory documented — add infrastructure details.',
      contributions: [
        ...(hasLab
          ? [
              {
                label: 'Laboratory present',
                impact: 'positive' as const,
                points: 20,
                description: 'Operational laboratory declared',
              },
              ...(infraCompleteness > 0
                ? [
                    {
                      label: infraCompleteness + ' infrastructure records',
                      impact: 'positive' as const,
                      points: infraCompleteness * 5,
                      description: 'Infrastructure documented across locations',
                    },
                  ]
                : []),
              ...(processing.length > 0
                ? [
                    {
                      label: processing.length + ' processing capabilities',
                      impact: 'positive' as const,
                      points: Math.min(30, processing.length * 3),
                      description: processing.slice(0, 6).join(', '),
                    },
                  ]
                : []),
            ]
          : [
              {
                label: 'No laboratory',
                impact: 'negative' as const,
                points: -30,
                description:
                  'Required for clinical testing and biospecimen programs. Add infrastructure details.',
              },
            ]),
      ],
    },
    {
      name: 'Biospecimen Readiness',
      score: bioScore,
      status: bioStatus,
      detail: hasBiospecimen
        ? 'Biospecimen operations active. ' +
          (input.hasDigitalCustody ? 'Digital chain of custody.' : 'Manual chain of custody.')
        : 'No biospecimen operations documented.',
      contributions: [
        ...(hasBiospecimen
          ? [
              {
                label: 'Biospecimen operations active',
                impact: 'positive' as const,
                points: 20,
                description:
                  Array.from(
                    new Set(
                      infrastructure.flatMap((item) =>
                        item.biospecimenOperations.filter((op) => op !== 'None'),
                      ),
                    ),
                  ).length + ' specimen types handled',
              },
              ...(input.hasDigitalCustody
                ? [
                    {
                      label: 'Digital chain of custody',
                      impact: 'positive' as const,
                      points: 25,
                      description:
                        'Full traceability from collection to final disposition',
                    },
                  ]
                : [
                    {
                      label: 'Manual chain of custody',
                      impact: 'negative' as const,
                      points: -10,
                      description:
                        'Upgrade to digital tracking (LIMS or electronic log)',
                    },
                  ]),
              ...(hasInternationalShipping
                ? [
                    {
                      label: 'International shipping',
                      impact: 'positive' as const,
                      points: 15,
                      description: 'IATA-certified staff for global transport',
                    },
                  ]
                : infrastructure.some(
                      (item) => item.shippingCapability === 'Domestic only',
                    )
                  ? [
                      {
                        label: 'Domestic shipping only',
                        impact: 'negative' as const,
                        points: -5,
                        description: 'Add IATA international certification',
                      },
                    ]
                  : []),
            ]
          : [
              {
                label: 'No biospecimen operations',
                impact: 'negative' as const,
                points: -30,
                description:
                  'Required for biospecimen-based programs. Add infrastructure details.',
              },
            ]),
      ],
    },
    {
      name: 'Research Readiness',
      score: capScore,
      status: capScore >= 70 ? 'Ready' : 'Partial',
      detail:
        strongCaps + ' strong capabilities out of ' + totalCaps + ' total.',
      contributions: [
        {
          label: strongCaps + ' strong capabilities',
          impact: 'positive' as const,
          points: strongCaps * 10,
          description: 'Capabilities backed by verifiable evidence',
        },
        ...(totalCaps - strongCaps > 0
          ? [
              {
                label:
                  totalCaps - strongCaps + ' capabilities need strengthening',
                impact: 'negative' as const,
                points: -(totalCaps - strongCaps) * 5,
                description:
                  'Add supporting documents, certifications, or equipment',
              },
            ]
          : []),
        ...(input.hasPriorStudies
          ? [
              {
                label: 'Research track record',
                impact: 'positive' as const,
                points: 10,
                description: 'Prior study experience declared',
              },
            ]
          : []),
        ...(teamCompleteness > 0
          ? [
              {
                label:
                  teamCompleteness + ' team members with complete profiles',
                impact: 'positive' as const,
                points: teamCompleteness * 3,
                description: 'Research staff documented',
              },
            ]
          : [
              {
                label: 'No team members documented',
                impact: 'negative' as const,
                points: -15,
                description: 'Add research team members in People section',
              },
            ]),
        ...(locationCompleteness > 0
          ? [
              {
                label:
                  locationCompleteness + ' locations with complete details',
                impact: 'positive' as const,
                points: locationCompleteness * 3,
                description: 'Site infrastructure documented',
              },
            ]
          : []),
      ],
    },
    {
      name: 'Documentation Readiness',
      score: docScore,
      status: docStatus,
      detail:
        docUploaded +
        ' of ' +
        evidence.totalDocuments +
        ' critical documents present.',
      contributions: [
        ...evidence.documents
          .filter((d) => d.status === 'active')
          .map((d) => ({
            label: 'OK ' + d.label,
            impact: 'positive' as const,
            points: 12,
            description: 'Class ' + d.evidenceClass + ' evidence',
            evidenceClass: d.evidenceClass,
          })),
        ...evidence.documents
          .filter((d) => d.status === 'expiring_soon')
          .map((d) => ({
            label: 'Expiring: ' + d.label,
            impact: 'negative' as const,
            points: -5,
            description: 'Renew before ' + (d.expiresAt || 'expiration'),
          })),
        ...evidence.documents
          .filter((d) => d.status === 'missing')
          .map((d) => ({
            label: 'Missing: ' + d.label,
            impact: 'negative' as const,
            points: -8,
            description: 'Upload required for full readiness',
          })),
        ...evidence.documents
          .filter((d) => d.status === 'pending')
          .map((d) => ({
            label: 'Pending: ' + d.label,
            impact: 'pending' as const,
            points: 0,
            description: 'In progress or awaiting verification',
          })),
      ],
    },
  ]

  const scores = dimensions.map((d) => d.score)
  const overall = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)

  return {
    overallScore: overall,
    dimensions,
    ...(claimContributions.length > 0 ? { claimContributions } : {}),
    eligiblePrograms:
      overall >= 70
        ? ['Observational Studies', 'Phase III-IV Trials', 'Biospecimen Collection Programs']
        : [],
    partialPrograms: overall >= 40 ? ['Phase II Trials', 'Central Lab Services'] : [],
  }
}
