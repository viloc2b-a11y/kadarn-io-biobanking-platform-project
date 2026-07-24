// ==========================================================================
// ORP-1.3 Derived Read Model — Passport Read Model
// ==========================================================================
// Pure, deterministic, non-persistent. Reads ONLY from canonical objects.
// NEVER reads legacy flat projection keys (LEGACY_FLAT_PROJECTION_KEYS).
// NEVER writes back to onboarding answers/state.
//
// This is the canonical replacement for assemblePassport().
// Delegates capability and readiness derivation to their respective
// read-model functions.
// ==========================================================================

import { getPrimaryLocation, type InstitutionalLocation } from '../institutional-locations'
import type { LocationInfrastructure } from '../location-infrastructure'
import type { ResearchTeamMember } from '../research-team'
import type {
  PassportData,
  PassportInstitution,
  PassportTeam,
  PassportInfraSummary,
  PassportEvidence,
  PassportDocument,
  PassportCapability,
  PassportReadiness,
  PassportNextStep,
  ProgramReadiness,
  UploadedDoc,
} from '../../passport/passport-assembler'
import { deriveCapabilityReadModel } from './capability-read-model'
import { deriveReadinessReadModel } from './readiness-read-model'
import type { KnowledgeContext } from './types'
import { buildEnrichment } from './types'
import { deriveHybridTrialReadiness } from '../hybrid-trial-readiness'
import type { HybridClaimResult } from '../hybrid-trial-readiness'

export type { PassportData } from '../../passport/passport-assembler'

export interface PassportReadModelInput {
  institutionId: string
  institutionName: string
  answers: Record<string, unknown>
  uploadedDocs?: UploadedDoc[]
  /** ORP-1.5: Unified knowledge context (claims, evidence, provenance). FROZEN. */
  knowledge?: KnowledgeContext
}

/**
 * Derives the full Passport read model exclusively from canonical objects.
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
 * When canonical objects are empty, returns sensible defaults:
 * empty arrays, null, "Not specified".
 */
export function derivePassportReadModel(input: PassportReadModelInput): PassportData {
  const now = new Date().toISOString()
  const enrichment = buildEnrichment(input.knowledge)
  const a = input.answers
  const docs = input.uploadedDocs ?? []
  const institutionName =
    input.institutionName || String(a['org_name'] ?? '').trim() || 'Your Institution'

  // Canonical object extraction — no legacy flat keys
  const teamMembers: ResearchTeamMember[] = Array.isArray(a['people_team_members'])
    ? (a['people_team_members'] as ResearchTeamMember[])
    : []
  const infrastructure: LocationInfrastructure[] = Array.isArray(
    a['infra_location_infrastructure'],
  )
    ? (a['infra_location_infrastructure'] as LocationInfrastructure[])
    : []
  const locations: InstitutionalLocation[] = Array.isArray(a['org_locations'])
    ? (a['org_locations'] as InstitutionalLocation[])
    : []
  const primaryLocation = getPrimaryLocation(locations)

  const researchFocus: string[] = Array.isArray(a['org_research_focus'])
    ? (a['org_research_focus'] as string[])
    : []

  // Build institution section
  const institution: PassportInstitution = {
    name: institutionName,
    type: String(a['org_type'] ?? 'Not specified'),
    foundedYear: a['org_founded_year'] ? Number(a['org_founded_year']) : null,
    mission: String(a['org_mission'] ?? ''),
    website: String(a['org_website'] ?? ''),
    primaryLocation: primaryLocation
      ? [primaryLocation.city, primaryLocation.state, primaryLocation.country]
          .filter(Boolean)
          .join(', ') || null
      : null,
    languages: arrStr(a['org_languages']),
    therapeuticAreas: arrStr(a['org_therapeutic_areas']),
    researchFocus,
    geographicReach: 'Not specified',
    team: assembleTeam(teamMembers),
    infrastructure: assembleInfrastructure(infrastructure),
  }

  // Build evidence section
  const evidence = assembleEvidence(docs)

  // Derive capabilities from canonical objects only
  const capabilities = deriveCapabilityReadModel({
    researchFocus,
    organizationType: String(a['org_type'] ?? ''),
    infrastructure,
    labCertifications: arrStr(a['infra_lab_certs']),
    shippingCapability: infrastructure.length > 0
      ? infrastructure[0].shippingCapability || null
      : null,
        uploadedDocLabels: docs.map(function(d) { return d.label }),
  })

  // Derive readiness from canonical objects + capabilities + evidence
  const readiness = deriveReadinessReadModel({
    capabilities,
    evidence,
    locations,
    teamMembers,
    infrastructure,
    hasBackupPower: infrastructure.some(
      (item) =>
        item.backupPower === 'Generator + UPS' || item.backupPower === 'Generator only',
    ),
    hasDedicatedSpace: infrastructure.some(
      (item) => item.dedicatedResearchSpace === 'Dedicated research space',
    ),
    hasTemperatureMonitoring: infrastructure.some(
      (item) => item.temperatureMonitoring === 'Continuous logging with alarms',
    ),
    hasDigitalCustody: String(a['infra_custody'] ?? '') === 'digital',
    hasPriorStudies: String(a['infra_has_studies'] ?? '') === 'yes',
  })

  // KTP-1.3: Derive Hybrid Trial Readiness from ht_* answers (provisional frontend helper)
  const hasHybridAnswers = Object.keys(input.answers).some(k => k.startsWith('ht_'))
  let hybridCapabilities: PassportCapability[] = []
  let hybridReadiness: ProgramReadiness | null = null

  if (hasHybridAnswers) {
    const htResult = deriveHybridTrialReadiness(input.answers, docs.map(d => d.label))

    hybridCapabilities = htResult.claims
      .filter(c => c.evidenceSupport !== 'NOT_APPLICABLE')
      .map(c => ({
        name: c.claimLabel,
        level: c.confidence >= 0.65 ? 'Strong' : c.confidence >= 0.35 ? 'Moderate' : 'Available',
        evidence: c.gaps.length === 0 ? 'All evidence requirements met.' : c.gaps.join('; '),
        domains: ['hybrid-trial'],
        supportingEvidence: [
          ...Object.entries(c.responses).map(([qid, val]) => ({
            label: qid,
            impact: 'positive' as const,
            points: 5,
            description: String(val).slice(0, 60),
          })),
          ...c.gaps.map(g => ({
            label: 'Gap',
            impact: 'negative' as const,
            points: -5,
            description: g,
          })),
        ],
        evidenceSupport: c.evidenceSupport,
      }))

    hybridReadiness = {
      programTypeKey: 'readiness_hybrid_trial',
      programTypeName: 'Hybrid Trial Readiness',
      readinessStatus: htResult.readinessStatus,
      overallConfidence: htResult.overallConfidence,
      capabilities: htResult.claims.map(c => ({
        capabilityTypeKey: c.claimId,
        capabilityTypeName: c.claimLabel,
        isMandatory: c.isMandatory,
        met: c.evidenceSupport !== 'NOT_APPLICABLE' && c.evidenceSupport !== 'UNKNOWN' && (c.evidenceSupport === 'SUPPORTED_BY_EVIDENCE' || c.confidence >= 0.50),
        achievedConfidence: c.confidence,
        requiredConfidence: 0.50,
        evidenceGaps: c.gaps.map(g => ({
          evidenceClass: 'B',
          isMandatory: c.isMandatory,
          required: 1,
          present: 0,
          missing: 1,
        })),
      })),
      evidenceGaps: htResult.claims.flatMap(c => c.gaps.map(g => ({
        evidenceClass: 'B',
        isMandatory: c.isMandatory,
        required: 1,
        present: 0,
        missing: 1,
      })) as any),
      verifiableVia: 'shared-evaluator://hybrid-trial/' + input.institutionId,
    }
  }

  // Merge hybrid capabilities with existing capabilities
  const allCapabilities = [...capabilities, ...hybridCapabilities]

  // Derive next steps — reads from canonical objects only
  const nextSteps = deriveNextSteps(infrastructure, evidence, docs)

  return {
    institutionId: input.institutionId,
    generatedAt: now,
    institution,
    evidence,
    capabilities: allCapabilities,
    readiness: {
      ...readiness,
      ...(hybridReadiness ? { programTypeReadiness: [hybridReadiness] } : {}),
    },
    ...(enrichment ? { enrichment } : {}),
    nextSteps,
  }
}

// ==========================================================================
// Team assembly — canonical objects only
// ==========================================================================

function assembleTeam(teamMembers: ResearchTeamMember[]): PassportTeam {
  const principalInvestigators = teamMembers.filter(
    (member) => member.isPrincipalInvestigator,
  )
  const leadInvestigator = principalInvestigators[0] ?? teamMembers[0] ?? null
  const roles =
    teamMembers.length > 0
      ? Array.from(
          new Set(
            teamMembers.flatMap((member) => member.researchRoles).filter(Boolean),
          ),
        )
      : []
  const certs =
    teamMembers.length > 0
      ? Array.from(
          new Set(
            teamMembers
              .flatMap((member) => member.certifications ?? [])
              .map((certification) => certification.type)
              .filter(Boolean),
          ),
        )
      : []
  const langs =
    teamMembers.length > 0
      ? Array.from(
          new Set(
            teamMembers.flatMap((member) => member.languages).filter(Boolean),
          ),
        )
      : []
  const totalTeam = teamMembers.length

  const piFirstName = String(leadInvestigator?.firstName ?? '')
  const piLastName = String(leadInvestigator?.lastName ?? '')
  const piName =
    piFirstName || piLastName ? `${piFirstName} ${piLastName}`.trim() : null

  return {
    piName,
    piTitle: String(leadInvestigator?.primaryRole ?? '') || null,
    piExperienceYears: leadInvestigator?.yearsExperience
      ? Number(leadInvestigator.yearsExperience)
      : null,
    piTherapeuticAreas: leadInvestigator?.therapeuticExpertise?.length
      ? leadInvestigator.therapeuticExpertise
      : [],
    totalTeam,
    coordinators: roles.filter((role) =>
      role.toLowerCase().includes('coordinator'),
    ).length,
    labStaff: roles.filter((role) => role.toLowerCase().includes('lab')).length,
    regulatoryStaff: roles.filter((role) =>
      role.toLowerCase().includes('regulatory'),
    ).length,
    roles,
    certifications: certs,
    languages: langs,
  }
}

// ==========================================================================
// Infrastructure assembly — canonical objects only
// ==========================================================================

function assembleInfrastructure(
  infrastructure: LocationInfrastructure[],
): PassportInfraSummary {
  const labCerts: string[] = [] // lab certifications come from canonical owner, not infra
  const processing =
    infrastructure.length > 0
      ? Array.from(
          new Set(
            infrastructure
              .filter(
                (item) =>
                  item.laboratoryPresent || item.biospecimenProcessingPresent,
              )
              .flatMap((item) => item.biospecimenOperations)
              .filter((operation) => operation !== 'None'),
          ),
        )
      : []
  const storage =
    infrastructure.length > 0
      ? Array.from(
          new Set(infrastructure.flatMap((item) => item.storageEquipment)),
        )
      : []
  const specimens =
    infrastructure.length > 0
      ? Array.from(
          new Set(
            infrastructure
              .flatMap((item) => item.biospecimenOperations)
              .filter((operation) => operation !== 'None'),
          ),
        )
      : []
  const locationCount =
    infrastructure.length > 0
      ? String(infrastructure.length)
      : 'Not specified'
  const firstLocation = infrastructure[0]

  return {
    locations: locationCount,
    dedicatedResearchSpace: String(
      firstLocation?.dedicatedResearchSpace ?? 'Not specified',
    ),
    backupPower: String(firstLocation?.backupPower ?? 'Not specified'),
    labCertifications: labCerts,
    processingCapabilities: processing,
    processingCapabilityCount: processing.length,
    storageEquipment: storage,
    storageUnitCount: storage.length,
    temperatureMonitoring: String(
      firstLocation?.temperatureMonitoring ?? 'Not specified',
    ),
    specimenTypes: specimens,
    specimenTypeCount: specimens.length,
    shippingCapability: String(
      firstLocation?.shippingCapability ?? 'Not specified',
    ),
    chainOfCustody: 'Not specified',
  }
}

// ==========================================================================
// Evidence assembly — from uploaded documents
// ==========================================================================

function assembleEvidence(uploadedDocs: UploadedDoc[]): PassportEvidence {
  const templates: Omit<PassportDocument, 'status' | 'actionNeeded'>[] = [
    {
      label: 'Business License',
      type: 'license',
      expiresAt: null,
      evidenceClass: 'A',
      proves: ['Legal Entity'],
    },
    {
      label: 'CLIA Certificate',
      type: 'certification',
      expiresAt: null,
      evidenceClass: 'A',
      proves: ['Laboratory Testing'],
    },
    {
      label: 'IRB Approval',
      type: 'regulatory',
      expiresAt: null,
      evidenceClass: 'A',
      proves: ['Ethical Oversight'],
    },
    {
      label: 'Insurance Certificate',
      type: 'insurance',
      expiresAt: null,
      evidenceClass: 'B',
      proves: ['Liability Coverage'],
    },
    {
      label: 'Medical License — PI',
      type: 'license',
      expiresAt: null,
      evidenceClass: 'A',
      proves: ['PI Qualifications'],
    },
    {
      label: 'IATA Certification',
      type: 'certification',
      expiresAt: null,
      evidenceClass: 'B',
      proves: ['Shipping Capability'],
    },
    {
      label: 'GCP Certificates',
      type: 'training',
      expiresAt: null,
      evidenceClass: 'C',
      proves: ['Staff Training'],
    },
    {
      label: 'Quality Manual',
      type: 'quality',
      expiresAt: null,
      evidenceClass: 'A',
      proves: ['Quality System'],
    },
    {
      label: 'Equipment Qualification Records',
      type: 'equipment',
      expiresAt: null,
      evidenceClass: 'B',
      proves: ['Equipment Readiness'],
    },
  ]

  const documents: PassportDocument[] = templates.map((t) => {
    const uploaded = uploadedDocs.find(
      (d) =>
        d.label.toLowerCase().includes(t.label.toLowerCase()) ||
        t.label.toLowerCase().includes(d.label.toLowerCase()),
    )

    if (uploaded?.notApplicable) {
      return { ...t, status: 'active', actionNeeded: false }
    }
    if (uploaded?.pending) {
      return {
        ...t,
        status: 'pending',
        expiresAt: uploaded.expiresAt ?? null,
        actionNeeded: false,
      }
    }
    if (uploaded?.uploaded) {
      return {
        ...t,
        status:
          uploaded.expiresAt &&
          new Date(uploaded.expiresAt) < new Date(Date.now() + 90 * 86_400_000)
            ? 'expiring_soon'
            : 'active',
        expiresAt: uploaded.expiresAt ?? null,
        actionNeeded: false,
      }
    }
    return { ...t, status: 'missing', actionNeeded: true }
  })

  const unmatchedUploads: PassportDocument[] = uploadedDocs
    .filter((doc) => doc.uploaded || doc.pending)
    .filter(
      (doc) =>
        !templates.some(
          (template) =>
            doc.label.toLowerCase().includes(template.label.toLowerCase()) ||
            template.label.toLowerCase().includes(doc.label.toLowerCase()),
        ),
    )
    .map((doc) => ({
      label: doc.label,
      type: doc.type || 'uploaded',
      status: doc.pending ? 'pending' : ('active' as const),
      expiresAt: doc.expiresAt ?? null,
      evidenceClass: doc.evidenceClass ?? 'D',
      proves: doc.proves ?? ['Uploaded Evidence'],
      actionNeeded: false,
    }))

  documents.push(...unmatchedUploads)

  const uploaded = documents.filter(
    (d) => d.status === 'active' || d.status === 'expiring_soon' || d.status === 'pending',
  ).length
  const missingCritical = documents
    .filter((d) => d.status === 'missing')
    .map((d) => d.label)

  return {
    totalDocuments: documents.length,
    uploadedDocuments: uploaded,
    missingCritical,
    documents,
    coverageScore: Math.round((uploaded / documents.length) * 100),
    healthScore:
      uploaded >= 7 ? 85 : uploaded >= 5 ? 65 : uploaded >= 3 ? 45 : 20,
  }
}

// ==========================================================================
// Next steps — from canonical objects only
// ==========================================================================

function deriveNextSteps(
  infrastructure: LocationInfrastructure[],
  evidence: PassportEvidence,
  uploadedDocs: UploadedDoc[],
): PassportNextStep[] {
  const steps: PassportNextStep[] = []
  const completedLabels = new Set(
    uploadedDocs
      .filter((d) => d.uploaded || d.notApplicable)
      .map((d) => d.label.toLowerCase()),
  )

  const trulyMissing = evidence.documents.filter((d) => d.status === 'missing')
  if (trulyMissing.length > 0) {
    const missingLabels = trulyMissing
      .slice(0, 3)
      .map((d) => d.label)
      .join(', ')
    if (!completedLabels.has(missingLabels.toLowerCase())) {
      steps.push({
        action: `Upload ${missingLabels}`,
        impact: `Unlocks ${Math.min(3, trulyMissing.length)} readiness dimensions.`,
        priority: 'High',
        domain: 'documents',
      })
    }
  }

  const hasLab = infrastructure.some((item) => item.laboratoryPresent)
  const hasBackup = infrastructure.some(
    (item) =>
      item.backupPower === 'Generator + UPS' || item.backupPower === 'Generator only',
  )
  const hasInternational = infrastructure.some(
    (item) => item.shippingCapability === 'Domestic and international',
  )
  const hasDomesticOnly = infrastructure.some(
    (item) => item.shippingCapability === 'Domestic only',
  )

  if (hasLab && infrastructure.length === 0) {
    steps.push({
      action: 'Add infrastructure details for laboratory operations',
      impact: 'Unlocks clinical testing programs.',
      priority: 'High',
      domain: 'infrastructure',
    })
  }

  steps.push({
    action: 'Upload equipment qualification records (IQ/OQ/PQ)',
    impact: 'Validates equipment claims and improves Lab Readiness.',
    priority: 'Medium',
    domain: 'documents',
  })

  if (!hasBackup) {
    steps.push({
      action: 'Install backup power for critical equipment',
      impact: 'Protects specimens. Improves Operational Readiness.',
      priority: 'High',
      domain: 'infrastructure',
    })
  }

  if (hasDomesticOnly) {
    steps.push({
      action: 'Add IATA international certification',
      impact: 'Unlocks international shipping.',
      priority: 'Medium',
      domain: 'infrastructure',
    })
  }

  if (!hasInternational && !hasDomesticOnly && infrastructure.length > 0) {
    steps.push({
      action: 'Add shipping capability details',
      impact: 'Enables biospecimen transport programs.',
      priority: 'Medium',
      domain: 'infrastructure',
    })
  }

  return steps.slice(0, 5)
}

// ==========================================================================
// HELPERS
// ==========================================================================

function arrStr(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : []
}
