import { getPrimaryLocation, type InstitutionalLocation } from '../onboarding/institutional-locations'
import type { LocationInfrastructure } from '../onboarding/location-infrastructure'
import type { ResearchTeamMember } from '../onboarding/research-team'

// ==========================================================================
// MVP Sprint 6 — Product Refinement: Passport Assembler v2
// ==========================================================================
// Correcciones del dogfooding:
//   FR-7 (blocker): Usa uploadedDocs reales, no lista estática
//   FR-2 (major): Team count por array length, no keyword matching
//   FR-4 (major): Equipment count en narrativa de capacidad
//   FR-6 (major): Lab readiness ponderado por capability count
//   FR-8 (minor): Next steps filtrados contra items ya completados
//   FR-5 (minor): Soporte para status "pending" en certificaciones
// ==========================================================================

export interface PassportData {
  institutionId: string
  generatedAt: string
  institution: PassportInstitution
  evidence: PassportEvidence
  capabilities: PassportCapability[]
  readiness: PassportReadiness
  nextSteps: PassportNextStep[]
}

export interface PassportInstitution {
  name: string; type: string; foundedYear: number | null
  mission: string | null; website: string | null
  primaryLocation: string | null; languages: string[]
  therapeuticAreas: string[]; researchFocus: string[]; geographicReach: string
  team: PassportTeam; infrastructure: PassportInfraSummary
}

export interface PassportTeam {
  piName: string | null; piTitle: string | null
  piExperienceYears: number | null; piTherapeuticAreas: string[]
  totalTeam: number; coordinators: number; labStaff: number; regulatoryStaff: number
  roles: string[]; certifications: string[]; languages: string[]
}

export interface PassportInfraSummary {
  locations: string; dedicatedResearchSpace: string; backupPower: string
  labCertifications: string[]; processingCapabilities: string[]; processingCapabilityCount: number
  storageEquipment: string[]; storageUnitCount: number
  temperatureMonitoring: string; specimenTypes: string[]; specimenTypeCount: number
  shippingCapability: string; chainOfCustody: string
}

export interface PassportEvidence {
  totalDocuments: number; uploadedDocuments: number; missingCritical: string[]
  documents: PassportDocument[]; coverageScore: number; healthScore: number
}

export interface PassportDocument {
  label: string; type: string
  status: 'active' | 'expiring_soon' | 'expired' | 'missing' | 'pending'
  expiresAt: string | null; evidenceClass: 'A' | 'B' | 'C' | 'D'
  proves: string[]; actionNeeded: boolean
}

export interface PassportCapability {
  name: string; level: 'Strong' | 'Moderate' | 'Available' | 'Not available'
  evidence: string; domains: string[]
  /** CR-0 FIX: Verifiable supporting evidence */
  supportingEvidence: ContributionItem[]
  /** KTP-1.3: Evidence support level */
  evidenceSupport?: 'SUPPORTED_BY_EVIDENCE' | 'DECLARED_ONLY' | 'NEEDS_EVIDENCE' | 'PARTIALLY_SUPPORTED' | 'UNKNOWN' | 'NOT_APPLICABLE' | 'NEEDS_REVIEW' | 'EXPIRED_OR_OUTDATED'
}

export interface PassportReadiness {
  overallScore: number; dimensions: PassportReadinessDimension[]
  eligiblePrograms: string[]; partialPrograms: string[]
  /** KTP-1.3: Per-program-type readiness evaluations (e.g., hybrid trial, biospecimen collection) */
  programTypeReadiness?: ProgramReadiness[]
}

/** KTP-1.3: Per-program-type readiness evaluation */
export interface ProgramReadiness {
  programTypeKey: string
  programTypeName: string
  readinessStatus: 'not_ready' | 'partial' | 'conditionally_ready' | 'ready'
  overallConfidence: number
  capabilities: {
    capabilityTypeKey: string
    capabilityTypeName: string
    isMandatory: boolean
    met: boolean
    achievedConfidence: number
    requiredConfidence: number
    evidenceGaps: {
      evidenceClass: string
      isMandatory: boolean
      required: number
      present: number
      missing: number
    }[]
  }[]
  evidenceGaps: string[]
  verifiableVia: string
}

export interface PassportReadinessDimension {
  name: string; score: number; status: 'Ready' | 'Partial' | 'Needs Attention'; detail: string
  /** CR-0 FIX: Verifiable contributing factors */
  contributions: ContributionItem[]
}

export interface ContributionItem {
  label: string
  impact: 'positive' | 'negative' | 'pending'
  points: number
  evidenceClass?: 'A' | 'B' | 'C' | 'D'
  documentId?: string
  description: string
}

export interface PassportNextStep {
  action: string; impact: string; priority: 'High' | 'Medium' | 'Low'; domain: string
}

/** Document input from the interview/docs page */
export interface UploadedDoc {
  label: string; type: string; uploaded: boolean
  expiresAt?: string; evidenceClass?: 'A' | 'B' | 'C' | 'D'; proves?: string[]
  pending?: boolean; notApplicable?: boolean
}

// ==========================================================================
// ASSEMBLER v2
// ==========================================================================

export function assemblePassport(params: {
  institutionId: string; institutionName: string
  answers: Record<string, unknown>
  uploadedDocs?: UploadedDoc[]
}): PassportData {
  const now = new Date().toISOString()
  const a = params.answers
  const docs = params.uploadedDocs ?? []
  const institutionName = params.institutionName || String(a['org_name'] ?? '').trim() || 'Your Institution'
  const locations = Array.isArray(a['org_locations']) ? (a['org_locations'] as InstitutionalLocation[]) : []
  const primaryLocation = getPrimaryLocation(locations)

  const institution: PassportInstitution = {
    name: institutionName,
    type: String(a['org_type'] ?? 'Not specified'),
    foundedYear: a['org_founded_year'] ? Number(a['org_founded_year']) : null,
    mission: String(a['org_mission'] ?? ''),
    website: String(a['org_website'] ?? ''),
    primaryLocation: primaryLocation
      ? [primaryLocation.city, primaryLocation.state, primaryLocation.country].filter(Boolean).join(', ') || null
      : [a['org_city'], a['org_state']].filter(Boolean).join(', ') || null,
    languages: arr(a['org_languages']),
    therapeuticAreas: arr(a['org_therapeutic_areas']),
    researchFocus: arr(a['org_research_focus']),
    geographicReach: String(a['org_geographic_reach'] ?? 'Not specified'),
    team: assembleTeam(a),
    infrastructure: assembleInfrastructure(a),
  }

  const evidence = assembleEvidence(docs)
  const capabilities = deriveCapabilities(a)
  const readiness = deriveReadiness(a, capabilities, evidence)
  const nextSteps = deriveNextSteps(a, evidence, readiness, docs)

  return { institutionId: params.institutionId, generatedAt: now, institution, evidence, capabilities, readiness, nextSteps }
}

// ==========================================================================
// FIX FR-2: Team count by array length
// ==========================================================================

function assembleTeam(a: Record<string, unknown>): PassportTeam {
  const teamMembers = Array.isArray(a['people_team_members']) ? (a['people_team_members'] as ResearchTeamMember[]) : []
  const principalInvestigators = teamMembers.filter((member) => member.isPrincipalInvestigator)
  const leadInvestigator = principalInvestigators[0] ?? teamMembers[0] ?? null
  const roles = teamMembers.length > 0
    ? Array.from(new Set(teamMembers.flatMap((member) => member.researchRoles).filter(Boolean)))
    : arr(a['people_roles'])
  const certs = teamMembers.length > 0
    ? Array.from(new Set(teamMembers.flatMap((member) => member.certifications ?? []).map((certification) => certification.type).filter(Boolean)))
    : arr(a['people_certs'])
  const langs = teamMembers.length > 0
    ? Array.from(new Set(teamMembers.flatMap((member) => member.languages).filter(Boolean)))
    : arr(a['people_languages'])

  // FR-2 FIX: Use actual array length + explicit counts when available
  const totalTeam = teamMembers.length > 0
    ? teamMembers.length
    : a['people_total_team'] ? Number(a['people_total_team']) : roles.length + 1

  // Derive PI name from split fields if combined field is empty
  const piFirstName = String(leadInvestigator?.firstName ?? a['people_pi_first_name'] ?? '')
  const piLastName = String(leadInvestigator?.lastName ?? a['people_pi_last_name'] ?? '')
  const piName = String(a['people_pi_name'] ?? '').trim() || (piFirstName || piLastName ? `${piFirstName} ${piLastName}`.trim() : null)

  return {
    piName,
    piTitle: String(leadInvestigator?.primaryRole ?? a['people_pi_title'] ?? null) || null,
    piExperienceYears: leadInvestigator?.yearsExperience ? Number(leadInvestigator.yearsExperience) : a['people_pi_experience'] ? Number(a['people_pi_experience']) : null,
    piTherapeuticAreas: leadInvestigator?.therapeuticExpertise.length ? leadInvestigator.therapeuticExpertise : arr(a['people_pi_ta']),
    totalTeam,
    coordinators: roles.filter((role) => role.toLowerCase().includes('coordinator')).length,
    labStaff: roles.filter((role) => role.toLowerCase().includes('lab')).length,
    regulatoryStaff: roles.filter((role) => role.toLowerCase().includes('regulatory')).length,
    roles,
    certifications: certs,
    languages: langs,
  }
}

// ==========================================================================
// FIX FR-4: Equipment count + FR-5: Pending status
// ==========================================================================

function assembleInfrastructure(a: Record<string, unknown>): PassportInfraSummary {
  const locationInfrastructure = Array.isArray(a['infra_location_infrastructure'])
    ? (a['infra_location_infrastructure'] as LocationInfrastructure[])
    : []
  const labCerts = arr(a['infra_lab_certs'])
  const processing = locationInfrastructure.length > 0
    ? Array.from(new Set(locationInfrastructure.filter((item) => item.laboratoryPresent || item.biospecimenProcessingPresent).flatMap((item) => item.biospecimenOperations).filter((operation) => operation !== 'None')))
    : arr(a['infra_lab_processing'])
  const storage = locationInfrastructure.length > 0
    ? Array.from(new Set(locationInfrastructure.flatMap((item) => item.storageEquipment)))
    : arr(a['infra_storage_equip'])
  const specimens = locationInfrastructure.length > 0
    ? Array.from(new Set(locationInfrastructure.flatMap((item) => item.biospecimenOperations).filter((operation) => operation !== 'None')))
    : arr(a['infra_specimen_types'])
  const locationCount = locationInfrastructure.length > 0 ? String(locationInfrastructure.length) : String(a['infra_location_count'] ?? 'Not specified')
  const firstLocation = locationInfrastructure[0]

  // FR-4 FIX: Capture actual counts
  const storageCount = a['infra_storage_total_capacity']
    ? storage.length // Use actual array length
    : storage.length

  return {
    locations: locationCount,
    dedicatedResearchSpace: String(firstLocation?.dedicatedResearchSpace ?? a['infra_research_space'] ?? 'Not specified'),
    backupPower: String(firstLocation?.backupPower ?? a['infra_backup_power'] ?? 'Not specified'),
    labCertifications: labCerts,
    processingCapabilities: processing,
    processingCapabilityCount: processing.length,
    storageEquipment: storage,
    storageUnitCount: storageCount,
    temperatureMonitoring: String(firstLocation?.temperatureMonitoring ?? a['infra_temp_monitoring'] ?? 'Not specified'),
    specimenTypes: specimens,
    specimenTypeCount: specimens.length,
    shippingCapability: String(firstLocation?.shippingCapability ?? a['infra_shipping'] ?? 'Not specified'),
    chainOfCustody: String(a['infra_custody'] ?? 'Not specified'),
  }
}

// ==========================================================================
// FIX FR-7 (blocker): Use real uploaded docs, not static list
// ==========================================================================

function assembleEvidence(uploadedDocs: UploadedDoc[]): PassportEvidence {
  // Default critical document templates
  const templates: Omit<PassportDocument, 'status' | 'actionNeeded'>[] = [
    { label: 'Business License', type: 'license', expiresAt: null, evidenceClass: 'A', proves: ['Legal Entity'] },
    { label: 'CLIA Certificate', type: 'certification', expiresAt: null, evidenceClass: 'A', proves: ['Laboratory Testing'] },
    { label: 'IRB Approval', type: 'regulatory', expiresAt: null, evidenceClass: 'A', proves: ['Ethical Oversight'] },
    { label: 'Insurance Certificate', type: 'insurance', expiresAt: null, evidenceClass: 'B', proves: ['Liability Coverage'] },
    { label: 'Medical License — PI', type: 'license', expiresAt: null, evidenceClass: 'A', proves: ['PI Qualifications'] },
    { label: 'IATA Certification', type: 'certification', expiresAt: null, evidenceClass: 'B', proves: ['Shipping Capability'] },
    { label: 'GCP Certificates', type: 'training', expiresAt: null, evidenceClass: 'C', proves: ['Staff Training'] },
    { label: 'Quality Manual', type: 'quality', expiresAt: null, evidenceClass: 'A', proves: ['Quality System'] },
    { label: 'Equipment Qualification Records', type: 'equipment', expiresAt: null, evidenceClass: 'B', proves: ['Equipment Readiness'] },
  ]

  // FR-7 FIX: Match templates against actually uploaded docs
  const documents: PassportDocument[] = templates.map((t) => {
    const uploaded = uploadedDocs.find((d) =>
      d.label.toLowerCase().includes(t.label.toLowerCase()) ||
      t.label.toLowerCase().includes(d.label.toLowerCase())
    )

    if (uploaded?.notApplicable) {
      return { ...t, status: 'active', actionNeeded: false }
    }
    // FR-5 FIX: Support pending status
    if (uploaded?.pending) {
      return { ...t, status: 'pending', expiresAt: uploaded.expiresAt ?? null, actionNeeded: false }
    }
    if (uploaded?.uploaded) {
      return {
        ...t,
        status: uploaded.expiresAt && new Date(uploaded.expiresAt) < new Date(Date.now() + 90 * 86_400_000)
          ? 'expiring_soon' : 'active',
        expiresAt: uploaded.expiresAt ?? null,
        actionNeeded: false,
      }
    }
    return { ...t, status: 'missing', actionNeeded: true }
  })

  const unmatchedUploads: PassportDocument[] = uploadedDocs
    .filter((doc) => doc.uploaded || doc.pending)
    .filter((doc) => !templates.some((template) =>
      doc.label.toLowerCase().includes(template.label.toLowerCase()) ||
      template.label.toLowerCase().includes(doc.label.toLowerCase())
    ))
    .map((doc) => ({
      label: doc.label,
      type: doc.type || 'uploaded',
      status: doc.pending ? 'pending' : 'active',
      expiresAt: doc.expiresAt ?? null,
      evidenceClass: doc.evidenceClass ?? 'D',
      proves: doc.proves ?? ['Uploaded Evidence'],
      actionNeeded: false,
    }))

  documents.push(...unmatchedUploads)

  const uploaded = documents.filter((d) => d.status === 'active' || d.status === 'expiring_soon' || d.status === 'pending').length
  const missingCritical = documents.filter((d) => d.status === 'missing').map((d) => d.label)

  return {
    totalDocuments: documents.length,
    uploadedDocuments: uploaded,
    missingCritical,
    documents,
    coverageScore: Math.round((uploaded / documents.length) * 100),
    healthScore: uploaded >= 7 ? 85 : uploaded >= 5 ? 65 : uploaded >= 3 ? 45 : 20,
  }
}

// ==========================================================================
// FIX FR-6: Lab readiness weighted by capability count
// ==========================================================================

function deriveCapabilities(a: Record<string, unknown>): PassportCapability[] {
  const locationInfrastructure = Array.isArray(a['infra_location_infrastructure'])
    ? (a['infra_location_infrastructure'] as LocationInfrastructure[])
    : []
  const hasLab = locationInfrastructure.length > 0
    ? locationInfrastructure.some((item) => item.laboratoryPresent)
    : a['infra_has_lab'] === 'yes'
  const hasBiospecimen = locationInfrastructure.length > 0
    ? locationInfrastructure.some((item) => item.biospecimenOperations.some((operation) => operation !== 'None'))
    : a['infra_has_biospecimen'] === 'yes'
  const processing = locationInfrastructure.length > 0
    ? Array.from(new Set(locationInfrastructure.filter((item) => item.laboratoryPresent || item.biospecimenProcessingPresent).flatMap((item) => item.biospecimenOperations).filter((operation) => operation !== 'None')))
    : arr(a['infra_lab_processing'])
  const specimens = locationInfrastructure.length > 0
    ? Array.from(new Set(locationInfrastructure.flatMap((item) => item.biospecimenOperations).filter((operation) => operation !== 'None')))
    : arr(a['infra_specimen_types'])
  const storage = locationInfrastructure.length > 0
    ? Array.from(new Set(locationInfrastructure.flatMap((item) => item.storageEquipment)))
    : arr(a['infra_storage_equip'])
  const hasBackup = locationInfrastructure.length > 0
    ? locationInfrastructure.some((item) => item.backupPower === 'Generator + UPS' || item.backupPower === 'Generator only')
    : a['infra_backup_power'] === 'both' || a['infra_backup_power'] === 'generator'
  const hasMonitoring = locationInfrastructure.length > 0
    ? locationInfrastructure.some((item) => item.temperatureMonitoring === 'Continuous logging with alarms')
    : a['infra_temp_monitoring'] === 'full'
  const labCerts = arr(a['infra_lab_certs'])

  const capabilities: PassportCapability[] = []

  if (a['org_research_focus']) {
    capabilities.push({
      name: 'Clinical Research Operations', level: 'Strong',
      evidence: 'Research organization with dedicated staff.',
      domains: ['organization', 'people'],
      supportingEvidence: [
        { label: 'Institution type', impact: 'positive', points: 15, description: String(a['org_type'] ?? '') },
        { label: 'Research focus', impact: 'positive', points: 15, description: arr(a['org_research_focus']).join(', ') },
      ],
    })
  }
  if (a['infra_research_space'] === 'dedicated') {
    capabilities.push({
      name: 'Patient Recruitment', level: 'Moderate',
      evidence: 'Dedicated research space available.',
      domains: ['facilities'],
      supportingEvidence: [
        { label: 'Dedicated research space', impact: 'positive', points: 20, description: 'Research wing or floor available' },
      ],
    })
  }

  if (hasLab) {
    const level = processing.length >= 8 ? 'Strong' : processing.length >= 4 ? 'Moderate' : 'Available'
    const labEvidence: ContributionItem[] = [
      { label: 'Laboratory present', impact: 'positive', points: 15, description: 'Operational laboratory declared' },
      ...(processing.length > 0 ? [{ label: processing.length + ' processing capabilities', impact: 'positive' as const, points: Math.min(30, processing.length * 3), description: processing.slice(0, 5).join(', ') }] : []),
      ...(labCerts.length > 0 ? [{ label: labCerts.length + ' certifications', impact: 'positive' as const, points: labCerts.length * 10, description: labCerts.join(', ') }] : [{ label: 'No lab certifications', impact: 'negative' as const, points: -10, description: 'Add CLIA, CAP, or COLA' }]),
    ]
    capabilities.push({
      name: 'Sample Processing', level,
      evidence: 'Lab with ' + processing.length + ' processing capabilities.',
      domains: ['laboratory'],
      supportingEvidence: labEvidence,
    })

    if (processing.includes('pbmc')) capabilities.push({
      name: 'PBMC Processing', level: 'Moderate', evidence: 'PBMC isolation capability.',
      domains: ['laboratory'],
      supportingEvidence: [{ label: 'PBMC declared', impact: 'positive', points: 15, description: 'Ficoll gradient isolation' }],
    })
    if (processing.includes('flow')) capabilities.push({
      name: 'Flow Cytometry', level: 'Available', evidence: 'Flow cytometry capability.',
      domains: ['laboratory'],
      supportingEvidence: [{ label: 'Flow cytometry declared', impact: 'positive', points: 10, description: 'Cell analysis and sorting' }],
    })
    if (processing.includes('pcr') || processing.includes('dna') || processing.includes('rna')) {
      const molTechs = [processing.includes('dna') && 'DNA', processing.includes('rna') && 'RNA', processing.includes('pcr') && 'PCR'].filter(Boolean)
      capabilities.push({
        name: 'Molecular Testing', level: 'Moderate', evidence: 'DNA/RNA/PCR capability.',
        domains: ['laboratory'],
        supportingEvidence: [{ label: 'Molecular techniques', impact: 'positive', points: 12, description: molTechs.join(', ') }],
      })
    }
  }

  if (storage.length > 0) {
    const hasMinus80 = storage.includes('minus80')
    capabilities.push({
      name: 'Biospecimen Storage',
      level: hasMinus80 && hasBackup && hasMonitoring ? 'Strong' : 'Moderate',
      evidence: storage.length + ' storage units.',
      domains: ['equipment', 'facilities'],
      supportingEvidence: [
        { label: storage.length + ' storage units', impact: 'positive', points: storage.length * 5, description: storage.map(function(s: string) { return s.replace(/_/g, ' ') }).join(', ') },
        ...(hasBackup ? [{ label: 'Backup power', impact: 'positive' as const, points: 15, description: 'Generator + UPS for critical equipment' }] : [{ label: 'No backup power', impact: 'negative' as const, points: -15, description: 'Specimens at risk during outages' }]),
        ...(hasMonitoring ? [{ label: '24/7 temperature monitoring', impact: 'positive' as const, points: 15, description: 'Continuous logging with alarms' }] : [{ label: 'No monitoring', impact: 'negative' as const, points: -10, description: 'Manual temperature checks only' }]),
      ],
    })
  }

  if (hasBiospecimen) {
    capabilities.push({
      name: 'Biospecimen Collection',
      level: specimens.length > 6 ? 'Strong' : specimens.length > 3 ? 'Moderate' : 'Available',
      evidence: specimens.length + ' specimen types handled.',
      domains: ['biospecimen'],
      supportingEvidence: [
        { label: specimens.length + ' specimen types', impact: 'positive', points: specimens.length * 3, description: specimens.slice(0, 6).join(', ') },
      ],
    })

    const shipping = a['infra_shipping']
    if (shipping === 'both') {
      capabilities.push({
        name: 'International Shipping', level: 'Strong',
        evidence: 'Domestic + international.',
        domains: ['biospecimen'],
        supportingEvidence: [
          { label: 'IATA certified', impact: 'positive', points: 20, description: 'International dangerous goods shipping' },
          { label: 'Domestic capability', impact: 'positive', points: 10, description: 'Multiple carriers' },
        ],
      })
    } else if (shipping === 'domestic') {
      capabilities.push({
        name: 'Domestic Shipping', level: 'Strong', evidence: 'Domestic shipping.',
        domains: ['biospecimen'],
        supportingEvidence: [{ label: 'Domestic shipping', impact: 'positive', points: 15, description: 'Regional and national carriers' }],
      })
      capabilities.push({
        name: 'International Shipping', level: 'Not available', evidence: 'Domestic only.',
        domains: ['biospecimen'],
        supportingEvidence: [{ label: 'No international IATA', impact: 'negative', points: -10, description: 'Add IATA international certification' }],
      })
    }
  }

  return capabilities
}

function deriveReadiness(
  a: Record<string, unknown>,
  capabilities: PassportCapability[],
  evidence: PassportEvidence,
): PassportReadiness {
  const strongCaps = capabilities.filter(function(c) { return c.level === 'Strong' }).length
  const totalCaps = capabilities.length || 1
  const capScore = Math.round((strongCaps / totalCaps) * 100)

  const hasBackup = a['infra_backup_power'] === 'both' || a['infra_backup_power'] === 'generator'
  const hasMonitoring = a['infra_temp_monitoring'] === 'full'
  const hasCustody = a['infra_custody'] === 'digital'
  const processingCount = arr(a['infra_lab_processing']).length
  const docUploaded = evidence.uploadedDocuments

  const labScore = a['infra_has_lab'] === 'yes'
    ? Math.min(95, 60 + processingCount * 3)
    : 0
  const labStatus = labScore >= 80 ? 'Ready' as const : labScore >= 50 ? 'Partial' as const : 'Needs Attention' as const

  const dimensions: PassportReadinessDimension[] = [
    {
      name: 'Regulatory Readiness',
      score: docUploaded >= 3 ? 80 : 40,
      status: docUploaded >= 3 ? 'Ready' : 'Needs Attention',
      detail: docUploaded >= 3 ? 'Key certifications and licenses present.' : 'Upload critical documents.',
      contributions: [
        ...(docUploaded >= 3
          ? [{ label: docUploaded + ' documents verified', impact: 'positive' as const, points: docUploaded * 15, description: 'Critical regulatory documents uploaded', evidenceClass: 'A' as const }]
          : [{ label: (3 - docUploaded) + ' critical documents missing', impact: 'negative' as const, points: -(3 - docUploaded) * 12, description: 'Upload CLIA, IRB, and business license' }]
        ),
      ],
    },
    {
      name: 'Operational Readiness',
      score: hasBackup ? 80 : 50,
      status: hasBackup ? 'Ready' : 'Partial',
      detail: hasBackup ? 'Backup power + dedicated research space.' : 'Add backup power.',
      contributions: [
        ...(hasBackup
          ? [{ label: 'Backup power (generator + UPS)', impact: 'positive' as const, points: 30, description: 'Critical equipment and storage protected during outages' }]
          : [{ label: 'No backup power', impact: 'negative' as const, points: -25, description: 'Power failure risks specimen integrity' }]
        ),
        { label: a['infra_research_space'] === 'dedicated' ? 'Dedicated research space' : 'Shared research space', impact: a['infra_research_space'] === 'dedicated' ? 'positive' as const : 'negative' as const, points: a['infra_research_space'] === 'dedicated' ? 20 : -10, description: a['infra_research_space'] === 'dedicated' ? 'Research wing with exam rooms and processing areas' : 'Clinical and research spaces overlap' },
      ],
    },
    {
      name: 'Laboratory Readiness',
      score: labScore,
      status: labStatus,
      detail: a['infra_has_lab'] === 'yes' ? 'Lab with ' + processingCount + ' processing capabilities.' : 'No laboratory documented.',
      contributions: [
        ...(a['infra_has_lab'] === 'yes'
          ? [
              { label: 'Laboratory present', impact: 'positive' as const, points: 20, description: 'Operational laboratory declared' },
              ...(arr(a['infra_lab_certs']).length > 0
                ? [{ label: arr(a['infra_lab_certs']).length + ' lab certifications', impact: 'positive' as const, points: arr(a['infra_lab_certs']).length * 10, description: arr(a['infra_lab_certs']).join(', '), evidenceClass: 'A' as const }]
                : [{ label: 'No laboratory certifications', impact: 'negative' as const, points: -15, description: 'Add CLIA, CAP, or COLA certification' }]
              ),
              ...(processingCount > 0
                ? [{ label: processingCount + ' processing capabilities', impact: 'positive' as const, points: Math.min(30, processingCount * 3), description: arr(a['infra_lab_processing']).slice(0, 6).join(', ') }]
                : []),
            ]
          : [{ label: 'No laboratory', impact: 'negative' as const, points: -30, description: 'Required for clinical testing and biospecimen programs' }]
        ),
      ],
    },
    {
      name: 'Biospecimen Readiness',
      score: a['infra_has_biospecimen'] === 'yes' ? (hasCustody ? 80 : 55) : 0,
      status: a['infra_has_biospecimen'] === 'yes' ? (hasCustody ? 'Ready' : 'Partial') : 'Needs Attention',
      detail: a['infra_has_biospecimen'] === 'yes' ? 'Chain of custody: ' + (hasCustody ? 'Digital' : 'Manual') + '.' : 'No biospecimen operations.',
      contributions: [
        ...(a['infra_has_biospecimen'] === 'yes'
          ? [
              { label: 'Biospecimen operations active', impact: 'positive' as const, points: 20, description: arr(a['infra_specimen_types']).length + ' specimen types handled' },
              ...(hasCustody
                ? [{ label: 'Digital chain of custody', impact: 'positive' as const, points: 25, description: 'Full traceability from collection to final disposition' }]
                : [{ label: 'Manual chain of custody', impact: 'negative' as const, points: -10, description: 'Upgrade to digital tracking (LIMS or electronic log)' }]
              ),
              ...(a['infra_shipping'] === 'both'
                ? [{ label: 'International shipping', impact: 'positive' as const, points: 15, description: 'IATA-certified staff for global transport' }]
                : a['infra_shipping'] === 'domestic'
                ? [{ label: 'Domestic shipping only', impact: 'negative' as const, points: -5, description: 'Add IATA international certification' }]
                : []),
            ]
          : [{ label: 'No biospecimen operations', impact: 'negative' as const, points: -30, description: 'Required for biospecimen-based programs' }]
        ),
      ],
    },
    {
      name: 'Research Readiness',
      score: capScore,
      status: capScore >= 70 ? 'Ready' : 'Partial',
      detail: strongCaps + ' strong capabilities out of ' + totalCaps + ' total.',
      contributions: [
        { label: strongCaps + ' strong capabilities', impact: 'positive' as const, points: strongCaps * 10, description: 'Capabilities backed by verifiable evidence' },
        ...(totalCaps - strongCaps > 0
          ? [{ label: (totalCaps - strongCaps) + ' capabilities need strengthening', impact: 'negative' as const, points: -(totalCaps - strongCaps) * 5, description: 'Add supporting documents, certifications, or equipment' }]
          : []),
        ...(a['infra_has_studies'] === 'yes'
          ? [{ label: 'Research track record', impact: 'positive' as const, points: 10, description: 'Prior study experience declared' }]
          : []),
      ],
    },
    {
      name: 'Documentation Readiness',
      score: evidence.healthScore,
      status: evidence.healthScore >= 70 ? 'Ready' : evidence.healthScore >= 40 ? 'Partial' : 'Needs Attention',
      detail: docUploaded + ' of ' + evidence.totalDocuments + ' critical documents present.',
      contributions: [
        ...evidence.documents.filter(function(d) { return d.status === 'active' }).map(function(d) { return { label: 'OK ' + d.label, impact: 'positive' as const, points: 12, description: 'Class ' + d.evidenceClass + ' evidence', evidenceClass: d.evidenceClass } }),
        ...evidence.documents.filter(function(d) { return d.status === 'expiring_soon' }).map(function(d) { return { label: 'Expiring: ' + d.label, impact: 'negative' as const, points: -5, description: 'Renew before ' + (d.expiresAt || 'expiration') } }),
        ...evidence.documents.filter(function(d) { return d.status === 'missing' }).map(function(d) { return { label: 'Missing: ' + d.label, impact: 'negative' as const, points: -8, description: 'Upload required for full readiness' } }),
        ...evidence.documents.filter(function(d) { return d.status === 'pending' }).map(function(d) { return { label: 'Pending: ' + d.label, impact: 'pending' as const, points: 0, description: 'In progress or awaiting verification' } }),
      ],
    },
  ]

  const scores = dimensions.map(function(d) { return d.score })
  const overall = Math.round(scores.reduce(function(s, v) { return s + v }, 0) / scores.length)

  return {
    overallScore: overall,
    dimensions,
    eligiblePrograms: overall >= 70 ? ['Observational Studies', 'Phase III-IV Trials', 'Biospecimen Collection Programs'] : [],
    partialPrograms: overall >= 40 ? ['Phase II Trials', 'Central Lab Services'] : [],
  }
}

function deriveNextSteps(
  a: Record<string, unknown>,
  evidence: PassportEvidence,
  _readiness: PassportReadiness,
  uploadedDocs: UploadedDoc[],
): PassportNextStep[] {
  const steps: PassportNextStep[] = []
  const completedLabels = new Set(uploadedDocs.filter((d) => d.uploaded || d.notApplicable).map((d) => d.label.toLowerCase()))

  // FR-8 FIX: Only suggest uploading docs that are actually missing
  const trulyMissing = evidence.documents.filter((d) => d.status === 'missing')
  if (trulyMissing.length > 0) {
    const missingLabels = trulyMissing.slice(0, 3).map((d) => d.label).join(', ')
    if (!completedLabels.has(missingLabels.toLowerCase())) {
      steps.push({
        action: `Upload ${missingLabels}`,
        impact: `Unlocks ${Math.min(3, trulyMissing.length)} readiness dimensions.`,
        priority: 'High', domain: 'documents',
      })
    }
  }

  if (a['infra_has_lab'] === 'yes' && arr(a['infra_lab_certs']).length === 0) {
    steps.push({ action: 'Add laboratory certifications (CLIA, CAP, or COLA)', impact: 'Unlocks clinical testing programs.', priority: 'High', domain: 'infrastructure' })
  }

  steps.push({ action: 'Upload equipment qualification records (IQ/OQ/PQ)', impact: 'Validates equipment claims and improves Lab Readiness.', priority: 'Medium', domain: 'documents' })

  if (a['infra_backup_power'] === 'none') {
    steps.push({ action: 'Install backup power for critical equipment', impact: 'Protects specimens. Improves Operational Readiness.', priority: 'High', domain: 'infrastructure' })
  }

  if (a['infra_shipping'] === 'domestic') {
    steps.push({ action: 'Add IATA international certification', impact: 'Unlocks international shipping.', priority: 'Medium', domain: 'infrastructure' })
  }

  if (a['infra_custody'] === 'paper' || a['infra_custody'] === 'none') {
    steps.push({ action: 'Implement digital chain of custody tracking', impact: 'Moves Biospecimen Readiness to Ready.', priority: 'Medium', domain: 'infrastructure' })
  }

  return steps.slice(0, 5)
}

// ==========================================================================
// HELPERS
// ==========================================================================

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value as string[] : []
}
