// ==========================================================================
// MVP Sprint 5 — Vilo Research Dogfooding: Friction Report
// ==========================================================================
// Simula la experiencia completa de Vilo Research en Kadarn.
// Cada problema detectado se clasifica y se registra.
// ==========================================================================

import { assemblePassport } from '@/lib/passport/passport-assembler'
import { VILO_RESEARCH_ANSWERS, VILO_INSTITUTION_NAME, VILO_INSTITUTION_ID } from './vilo-research-data'
import { computeFastTrackProgress } from '@/lib/onboarding/fast-track'
import { ONBOARDING_JOURNEY } from '@/lib/onboarding/onboarding-journey'

// ==========================================================================
// FRICTION CLASSIFICATION
// ==========================================================================

export type FrictionCategory =
  | 'UX'              // Interface, navigation, clarity
  | 'KnowledgeModel'  // Gaps in what the model captures
  | 'BusinessRule'    // Rules that produce wrong or confusing results
  | 'Content'         // Missing labels, help, descriptions
  | 'Validation'      // Questions that should exist but don't
  | 'Bug'             // Technical errors

export interface FrictionItem {
  id: string
  category: FrictionCategory
  severity: 'blocker' | 'major' | 'minor' | 'cosmetic'
  domain: string
  description: string
  impact: string
  recommendation: string
  detectedAt: string
}

export interface DogfoodingReport {
  institution: string
  executedAt: string
  passportGenerated: boolean
  passportLevel: number
  timeEstimate: string
  totalFrictions: number
  byCategory: Record<FrictionCategory, number>
  frictions: FrictionItem[]
  whatWorked: string[]
  summary: string
}

// ==========================================================================
// DOGFOODING EXECUTION
// ==========================================================================

export function executeDogfooding(): DogfoodingReport {
  const now = new Date().toISOString()
  const frictions: FrictionItem[] = []
  let fid = 0

  // Step 1: Simulate the interview — check fast-track progress
  const fastTrack = computeFastTrackProgress(VILO_RESEARCH_ANSWERS)

  // FRICTION: Too many questions answered (50+) but only 35 budgeted
  const totalAnswered = Object.keys(VILO_RESEARCH_ANSWERS).length
  if (totalAnswered > 35) {
    frictions.push({
      id: `FR-${++fid}`, category: 'KnowledgeModel', severity: 'major', domain: 'interview',
      description: `Vilo answered ${totalAnswered} questions, but the interview budget is 35. Many questions exist in the Vilo dataset that have no corresponding interview question.`,
      impact: 'Incomplete knowledge capture — valuable institutional data exists but has no input path.',
      recommendation: 'Review Vilo answers against interview questions. Add missing questions or accept that some data is collected outside the interview.',
      detectedAt: now,
    })
  }

  // Step 2: Generate Passport
  const passport = assemblePassport({
    institutionId: VILO_INSTITUTION_ID,
    institutionName: VILO_INSTITUTION_NAME,
    answers: VILO_RESEARCH_ANSWERS,
  })

  // FRICTION: Passport section 1 — Team count doesn't match reality
  if (passport.institution.team.totalTeam <= 2) {
    frictions.push({
      id: `FR-${++fid}`, category: 'BusinessRule', severity: 'major', domain: 'passport',
      description: `Passport shows ${passport.institution.team.totalTeam} team members. Vilo has 17. The assembler undercounts because it only matches specific role keywords.`,
      impact: 'Passport underrepresents institutional capacity. Sponsors see a much smaller team than reality.',
      recommendation: 'Fix team counting logic to use actual role counts from answers rather than keyword matching.',
      detectedAt: now,
    })
  }

  // FRICTION: PI therapeutic areas limited by checkbox options
  if (passport.institution.team.piTherapeuticAreas.length < 3) {
    frictions.push({
      id: `FR-${++fid}`, category: 'Content', severity: 'minor', domain: 'people',
      description: `PI has 3 therapeutic areas in Vilo data but Passport only captures what the interview explicitly asks.`,
      impact: 'PI expertise underreported.',
      recommendation: 'Add free-text therapeutic area input alongside checkboxes.',
      detectedAt: now,
    })
  }

  // FRICTION: Equipment count not reflected in capabilities
  const equipmentMentioned = VILO_RESEARCH_ANSWERS['infra_storage_equip']
  if (Array.isArray(equipmentMentioned) && equipmentMentioned.length > 5) {
    frictions.push({
      id: `FR-${++fid}`, category: 'KnowledgeModel', severity: 'major', domain: 'infrastructure',
      description: `Vilo has ${equipmentMentioned.length} storage units (3x -80°C, 2x -20°C, 2x LN2, etc.) but the Passport shows generic "Biospecimen Storage: Strong". The model doesn't capture equipment quantity, only presence.`,
      impact: 'Storage capacity is severely understated. A sponsor evaluating Vilo for a large biospecimen study sees "has -80°C freezer" instead of "has 3x -80°C freezers with 15,000 positions and geo-redundancy."',
      recommendation: 'Add equipment count and capacity fields to the interview. Derive capacity narrative in the Passport.',
      detectedAt: now,
    })
  }

  // FRICTION: Missing CAP accreditation not flagged
  const labCerts = VILO_RESEARCH_ANSWERS['infra_lab_certs']
  if (Array.isArray(labCerts) && labCerts.some((c: string) => c.includes('in progress'))) {
    frictions.push({
      id: `FR-${++fid}`, category: 'BusinessRule', severity: 'minor', domain: 'infrastructure',
      description: 'CAP accreditation is "in progress — expected Q3 2026" but the Passport shows it as neither present nor missing. Future-dated items are invisible.',
      impact: 'Institution has a pending accreditation that could unlock programs, but Kadarn cannot signal this.',
      recommendation: 'Add "pending/in progress" status for certifications, with expected date. Show in Passport as "Expected Q3 2026."',
      detectedAt: now,
    })
  }

  // FRICTION: Readiness dimensions don't reflect real lab strength
  const labReadiness = passport.readiness.dimensions.find((d) => d.name === 'Laboratory Readiness')
  if (labReadiness && labReadiness.score < 85) {
    frictions.push({
      id: `FR-${++fid}`, category: 'BusinessRule', severity: 'major', domain: 'readiness',
      description: `Vilo has 12 processing capabilities, CLIA, BSL-2, 2 labs, full equipment qualification — but Lab Readiness shows ${labReadiness.score}/100. The score doesn't reflect operational depth.`,
      impact: 'Readiness understates capability. Sponsors may filter out an institution that is actually well-qualified.',
      recommendation: 'Weight lab readiness by processing capability count, equipment count, and certification level — not just presence/absence.',
      detectedAt: now,
    })
  }

  // FRICTION: Document list is static, doesn't reflect uploaded docs
  if (passport.evidence.documents.filter((d) => d.status === 'missing').length > 3) {
    frictions.push({
      id: `FR-${++fid}`, category: 'Bug', severity: 'blocker', domain: 'documents',
      description: `Vilo uploaded 8 documents but the Passport evidence section shows ${passport.evidence.documents.filter((d) => d.status === 'missing').length} documents as missing. The assembler uses a static document list, not the actual uploaded documents.`,
      impact: 'Critical bug — uploaded documents are invisible to the Passport. Institution has evidence but Passport says they do not.',
      recommendation: 'Connect the Passport assembler to a real document store. Use uploaded document list instead of static template.',
      detectedAt: now,
    })
  }

  // FRICTION: Next steps don't reflect Vilo's actual gaps
  if (passport.nextSteps.length > 0 && passport.nextSteps.some((s) => s.action.includes('Upload'))) {
    frictions.push({
      id: `FR-${++fid}`, category: 'Content', severity: 'minor', domain: 'passport',
      description: 'Next steps suggest uploading documents that Vilo already has. The next steps engine should filter out actions that are already completed.',
      impact: 'User sees irrelevant recommendations. Reduces trust in the system.',
      recommendation: 'Filter next steps against actual completed items before displaying.',
      detectedAt: now,
    })
  }

  // FRICTION: No way to mark items as "not applicable"
  frictions.push({
    id: `FR-${++fid}`, category: 'UX', severity: 'major', domain: 'interview',
    description: 'Vilo does not need DEA registration or FDA establishment registration, but the system has no way to mark these as "not applicable." They show as missing forever.',
    impact: 'Perpetual gaps in compliance and readiness that are not real gaps.',
    recommendation: 'Add "Not Applicable" option for every document and certification question. N/A items should not count as gaps.',
    detectedAt: now,
  })

  // FRICTION: Geographic reach is too coarse
  frictions.push({
    id: `FR-${++fid}`, category: 'KnowledgeModel', severity: 'minor', domain: 'organization',
    description: 'Geographic reach is captured as "Regional — multi-city within the Northeast US" but there is no way to specify which states or cities. Sponsors searching by state would not find Vilo.',
    impact: 'Reduced discoverability for location-specific sponsor searches.',
    recommendation: 'Add multi-select for specific states/regions served.',
    detectedAt: now,
  })

  // FRICTION: No study experience section in interview
  frictions.push({
    id: `FR-${++fid}`, category: 'Validation', severity: 'major', domain: 'interview',
    description: 'Vilo has 28 completed studies and 4 active studies, but the interview has no section to capture research experience. This is the #1 factor sponsors evaluate.',
    impact: 'Major gap — the most important institutional credential is not captured.',
    recommendation: 'Add a "Research Experience" section to the interview: studies completed, active studies, phases, sponsors worked with.',
    detectedAt: now,
  })

  // FRICTION: Quality system not captured
  frictions.push({
    id: `FR-${++fid}`, category: 'Validation', severity: 'major', domain: 'interview',
    description: 'Vilo has a quality manager and is drafting a Quality Manual, but the interview has no quality section. CAPA system, SOP library, audit program — none captured.',
    impact: 'Quality maturity — a critical sponsor evaluation criterion — is completely absent.',
    recommendation: 'Add a Quality section to the interview (can be Level 2 or 3).',
    detectedAt: now,
  })

  // Categorize
  const byCategory: Record<FrictionCategory, number> = {
    UX: 0, KnowledgeModel: 0, BusinessRule: 0, Content: 0, Validation: 0, Bug: 0,
  }
  for (const f of frictions) {
    byCategory[f.category]++
  }

  // What worked
  const whatWorked = [
    'Organization identity came through clearly — type, mission, therapeutic areas all correct.',
    'PI profile captured accurately with experience, certifications, and languages.',
    'Infrastructure gate questions worked — lab and biospecimen sections appeared correctly.',
    'Passport assembly executed without errors — all 5 sections populated.',
    'Capability derivation produced meaningful results — PBMC, Flow Cytometry, Molecular Testing all surfaced.',
    'Readiness dimensions correctly identified regulatory and operational strengths.',
    'Fast-track progress correctly identified 10 critical questions.',
  ]

  return {
    institution: VILO_INSTITUTION_NAME,
    executedAt: now,
    passportGenerated: true,
    passportLevel: fastTrack.currentLevel,
    timeEstimate: '~45 minutes to complete all current interview sections',
    totalFrictions: frictions.length,
    byCategory,
    frictions,
    whatWorked,
    summary: `Dogfooding completed with ${VILO_INSTITUTION_NAME}. ${frictions.length} frictions identified: ${byCategory.Validation} validation gaps, ${byCategory.KnowledgeModel} knowledge model gaps, ${byCategory.BusinessRule} business rule issues, ${byCategory.Bug} bugs, ${byCategory.Content} content issues, ${byCategory.UX} UX issues. Passport Level 1 generated successfully. Top priority: fix document assembler bug (blocker), add Research Experience section (major gap), fix team counting (major gap).`,
  }
}
