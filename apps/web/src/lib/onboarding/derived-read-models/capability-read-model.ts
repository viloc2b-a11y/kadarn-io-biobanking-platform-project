// ==========================================================================
// ORP-1.3 Derived Read Model — Capability Read Model
// ==========================================================================
// Pure, deterministic, non-persistent. Reads ONLY from canonical objects.
// NEVER reads legacy flat projection keys (LEGACY_FLAT_PROJECTION_KEYS).
// NEVER writes back to onboarding answers/state.
// ==========================================================================

import type { LocationInfrastructure } from '../location-infrastructure'
import type { PassportCapability, ContributionItem } from '../../passport/passport-assembler'
import type { EvidenceSupport } from './types'
import type { KnowledgeContext } from './types'

export interface CapabilityReadModelInput {
  researchFocus: string[]
  organizationType: string
  infrastructure: LocationInfrastructure[]
  labCertifications: string[]
  shippingCapability: string | null
  /** OCP-3: Uploaded document labels for evidence-awareness */
  uploadedDocLabels?: string[]
  /** ORP-1.5: Unified knowledge context. FROZEN. */
  knowledge?: KnowledgeContext
}

/**
 * Derives capabilities exclusively from canonical objects.
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
 * When canonical objects are empty, returns an empty list.
 * This is intentional — no capabilities without evidence.
 */
export function deriveCapabilityReadModel(input: CapabilityReadModelInput): PassportCapability[] {
  const claimIds = (input.knowledge?.claims ?? []).map(function(c) { return c.id })
  const evidenceIds = (input.knowledge?.evidence ?? []).map(function(e) { return e.id })
  const capabilities: PassportCapability[] = []
  const infra = input.infrastructure

  // Research focus indicates clinical research operations
  if (input.researchFocus.length > 0) {
    capabilities.push({
      name: 'Clinical Research Operations',
      level: 'Strong',
      evidence: 'Research organization with dedicated staff.',
      domains: ['organization', 'people'],
      supportingEvidence: [
        {
          label: 'Institution type',
          impact: 'positive',
          points: 15,
          description: input.organizationType || 'Not specified',
        },
        {
          label: 'Research focus',
          impact: 'positive',
          points: 15,
          description: input.researchFocus.join(', '),
        },
      ],
    })
  }

  // Patient Recruitment — only when dedicated research space exists
  const hasDedicatedSpace = infra.some(
    (item) => item.dedicatedResearchSpace === 'Dedicated research space',
  )
  if (hasDedicatedSpace) {
    capabilities.push({
      name: 'Patient Recruitment',
      level: 'Moderate',
      evidence: 'Dedicated research space available.',
      domains: ['facilities'],
      supportingEvidence: [
        {
          label: 'Dedicated research space',
          impact: 'positive',
          points: 20,
          description: 'Research wing or floor available',
        },
      ],
    })
  }

  // Laboratory capabilities — derived from infrastructure
  const hasLab = infra.some((item) => item.laboratoryPresent)
  if (hasLab) {
    const processing = Array.from(
      new Set(
        infra
          .filter(
            (item) => item.laboratoryPresent || item.biospecimenProcessingPresent,
          )
          .flatMap((item) => item.biospecimenOperations)
          .filter((op) => op !== 'None'),
      ),
    )
    const level =
      processing.length >= 8 ? 'Strong' : processing.length >= 4 ? 'Moderate' : 'Available'

    const labEvidence: ContributionItem[] = [
      {
        label: 'Laboratory present',
        impact: 'positive',
        points: 15,
        description: 'Operational laboratory declared',
      },
      ...(processing.length > 0
        ? [
            {
              label: processing.length + ' processing capabilities',
              impact: 'positive' as const,
              points: Math.min(30, processing.length * 3),
              description: processing.slice(0, 5).join(', '),
            },
          ]
        : []),
      ...(input.labCertifications.length > 0
        ? [
            {
              label: input.labCertifications.length + ' certifications',
              impact: 'positive' as const,
              points: input.labCertifications.length * 10,
              description: input.labCertifications.join(', '),
            },
          ]
        : [
            {
              label: 'No lab certifications',
              impact: 'negative' as const,
              points: -10,
              description: 'Add CLIA, CAP, or COLA',
            },
          ]),
    ]

    capabilities.push({
      name: 'Sample Processing',
      level,
      evidence: 'Lab with ' + processing.length + ' processing capabilities.',
      domains: ['laboratory'],
      supportingEvidence: labEvidence,
    })

    if (processing.includes('pbmc')) {
      capabilities.push({
        name: 'PBMC Processing',
        level: 'Moderate',
        evidence: 'PBMC isolation capability.',
        domains: ['laboratory'],
        supportingEvidence: [
          {
            label: 'PBMC declared',
            impact: 'positive',
            points: 15,
            description: 'Ficoll gradient isolation',
          },
        ],
      })
    }
    if (processing.includes('flow')) {
      capabilities.push({
        name: 'Flow Cytometry',
        level: 'Available',
        evidence: 'Flow cytometry capability.',
        domains: ['laboratory'],
        supportingEvidence: [
          {
            label: 'Flow cytometry declared',
            impact: 'positive',
            points: 10,
            description: 'Cell analysis and sorting',
          },
        ],
      })
    }
    if (processing.includes('pcr') || processing.includes('dna') || processing.includes('rna')) {
      const molTechs = [
        processing.includes('dna') && 'DNA',
        processing.includes('rna') && 'RNA',
        processing.includes('pcr') && 'PCR',
      ].filter(Boolean) as string[]
      capabilities.push({
        name: 'Molecular Testing',
        level: 'Moderate',
        evidence: 'DNA/RNA/PCR capability.',
        domains: ['laboratory'],
        supportingEvidence: [
          {
            label: 'Molecular techniques',
            impact: 'positive',
            points: 12,
            description: molTechs.join(', '),
          },
        ],
      })
    }
  }

  // Storage capabilities — derived from equipment + environmental controls
  const storage = Array.from(new Set(infra.flatMap((item) => item.storageEquipment)))
  if (storage.length > 0) {
    const hasMinus80 = storage.includes('minus80')
    const hasBackup = infra.some(
      (item) => item.backupPower === 'Generator + UPS' || item.backupPower === 'Generator only',
    )
    const hasMonitoring = infra.some(
      (item) => item.temperatureMonitoring === 'Continuous logging with alarms',
    )

    capabilities.push({
      name: 'Biospecimen Storage',
      level: hasMinus80 && hasBackup && hasMonitoring ? 'Strong' : 'Moderate',
      evidence: storage.length + ' storage units.',
      domains: ['equipment', 'facilities'],
      supportingEvidence: [
        {
          label: storage.length + ' storage units',
          impact: 'positive',
          points: storage.length * 5,
          description: storage
            .map(function (s: string) {
              return s.replace(/_/g, ' ')
            })
            .join(', '),
        },
        ...(hasBackup
          ? [
              {
                label: 'Backup power',
                impact: 'positive' as const,
                points: 15,
                description: 'Generator + UPS for critical equipment',
              },
            ]
          : [
              {
                label: 'No backup power',
                impact: 'negative' as const,
                points: -15,
                description: 'Specimens at risk during outages',
              },
            ]),
        ...(hasMonitoring
          ? [
              {
                label: '24/7 temperature monitoring',
                impact: 'positive' as const,
                points: 15,
                description: 'Continuous logging with alarms',
              },
            ]
          : [
              {
                label: 'No monitoring',
                impact: 'negative' as const,
                points: -10,
                description: 'Manual temperature checks only',
              },
            ]),
      ],
    })
  }

  // Biospecimen Collection — derived from biospecimen operations
  const hasBiospecimen = infra.some((item) =>
    item.biospecimenOperations.some((op) => op !== 'None'),
  )
  if (hasBiospecimen) {
    const specimens = Array.from(
      new Set(
        infra
          .flatMap((item) => item.biospecimenOperations)
          .filter((op) => op !== 'None'),
      ),
    )

    capabilities.push({
      name: 'Biospecimen Collection',
      level: specimens.length > 6 ? 'Strong' : specimens.length > 3 ? 'Moderate' : 'Available',
      evidence: specimens.length + ' specimen types handled.',
      domains: ['biospecimen'],
      supportingEvidence: [
        {
          label: specimens.length + ' specimen types',
          impact: 'positive',
          points: specimens.length * 3,
          description: specimens.slice(0, 6).join(', '),
        },
      ],
    })

    // Shipping capabilities
    if (input.shippingCapability === 'Domestic and international') {
      capabilities.push({
        name: 'International Shipping',
        level: 'Strong',
        evidence: 'Domestic + international.',
        domains: ['biospecimen'],
        supportingEvidence: [
          {
            label: 'IATA certified',
            impact: 'positive',
            points: 20,
            description: 'International dangerous goods shipping',
          },
          {
            label: 'Domestic capability',
            impact: 'positive',
            points: 10,
            description: 'Multiple carriers',
          },
        ],
      })
    } else if (input.shippingCapability === 'Domestic only') {
      capabilities.push({
        name: 'Domestic Shipping',
        level: 'Strong',
        evidence: 'Domestic shipping.',
        domains: ['biospecimen'],
        supportingEvidence: [
          {
            label: 'Domestic shipping',
            impact: 'positive',
            points: 15,
            description: 'Regional and national carriers',
          },
        ],
      })
      capabilities.push({
        name: 'International Shipping',
        level: 'Not available',
        evidence: 'Domestic only.',
        domains: ['biospecimen'],
        supportingEvidence: [
          {
            label: 'No international IATA',
            impact: 'negative',
            points: -10,
            description: 'Add IATA international certification',
          },
        ],
      })
    }
  }

  // ORP-1.4: Attach claim/evidence refs when present
  for (const cap of capabilities) {
    if (claimIds.length > 0) cap.supportingClaimIds = claimIds
    if (evidenceIds.length > 0) cap.supportingEvidenceIds = evidenceIds
  }
  // OCP-3: Compute evidence support for each capability
  const docLabels = (input.uploadedDocLabels ?? []).map(function(l: string) { return l.toLowerCase() })
  for (const cap of capabilities) {
    const hasSupportingEvidence = (cap.supportingEvidence ?? []).some(
      function(e: ContributionItem) { return e.impact === 'positive' },
    )
    const hasMatchingDoc = docLabels.some(function(l: string) {
      return cap.name.toLowerCase().includes(l) || l.includes(cap.name.toLowerCase())
    }) || docLabels.length >= 3 // 3+ docs = general evidence coverage

    if (hasSupportingEvidence && hasMatchingDoc) {
      cap.evidenceSupport = 'SUPPORTED_BY_EVIDENCE'
    } else if (hasSupportingEvidence) {
      cap.evidenceSupport = 'DECLARED_ONLY'
    } else if (cap.level === 'Not available') {
      cap.evidenceSupport = 'UNKNOWN'
    } else {
      cap.evidenceSupport = 'NEEDS_EVIDENCE'
    }
  }

  return capabilities
}
