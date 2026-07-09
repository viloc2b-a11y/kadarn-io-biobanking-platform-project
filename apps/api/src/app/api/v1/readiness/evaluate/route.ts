// ==========================================================================
// POST /api/v1/readiness/evaluate
// ==========================================================================
// Trigger a readiness evaluation for an organization against a program type.
//
// KTP-1.3: Extended to support source='onboarding_answers' for hybrid trial
// readiness evaluation from onboarding interview responses.
//
// Sources:
//   - 'evidence_nodes' (default): evaluates against DB evidence nodes
//   - 'onboarding_answers': evaluates against ht_* onboarding answers
//     (non-persistent — returns warnings, no DB writes)
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { requireActiveOrg } from '@/lib/workspace'
import { z } from 'zod'
import type { ReadinessEvaluation, CapabilitySummary, EvidenceGap } from '@kadarn/readiness-engine/dto'
import {
  computeEvidenceSupportLevel,
  filterActiveClaims,
  isClaimMet,
} from '@kadarn/readiness-engine'

// --------------------------------------------------------------------------
// Zod Schema (extended for KTP-1.3)
// --------------------------------------------------------------------------

const evaluateSchema = z.object({
  programTypeKey: z.string().min(1),
  source: z.enum(['evidence_nodes', 'onboarding_answers']).optional().default('evidence_nodes'),
  answers: z.record(z.unknown()).optional(),
  persist: z.boolean().optional().default(false),
})

// --------------------------------------------------------------------------
// KTP-1.3: Hybrid Trial Onboarding Answer Evaluation
// --------------------------------------------------------------------------

interface OnboardingClaimResult {
  claimId: string
  claimLabel: string
  evidenceSupport: string
  confidence: number
  isMandatory: boolean
  met: boolean
  gaps: string[]
}

interface ClaimMapping {
  claimId: string
  claimLabel: string
  isMandatory: boolean
  canBeNA: boolean
  gateQuestion?: string
  classBQuestions: string[]
  classCQuestions: string[]
}

const CLAIM_MAPPINGS: ClaimMapping[] = [
  {
    claimId: 'clinical_trials.hybrid.site_execution', claimLabel: 'Site-Based Execution',
    isMandatory: true, canBeNA: false,
    classBQuestions: ['ht_site_visit_sop'],
    classCQuestions: ['ht_site_dedicated_space', 'ht_site_exam_rooms', 'ht_site_staff_deployed'],
  },
  {
    claimId: 'clinical_trials.hybrid.at_home_coordination', claimLabel: 'At-Home Coordination',
    isMandatory: true, canBeNA: true, gateQuestion: 'ht_has_home_visits',
    classBQuestions: ['ht_home_resp_matrix', 'ht_home_workflow_sop', 'ht_home_comm_workflow', 'ht_home_escalation_pathway'],
    classCQuestions: ['ht_home_providers_contracted', 'ht_home_patient_comm'],
  },
  {
    claimId: 'clinical_trials.hybrid.data_integrity', claimLabel: 'Hybrid Data Integrity',
    isMandatory: true, canBeNA: false,
    classBQuestions: ['ht_data_source_doc_sop', 'ht_data_integrity_sop', 'ht_data_workflow_documented', 'ht_data_query_process', 'ht_data_review_workflow'],
    classCQuestions: ['ht_data_audit_trail', 'ht_data_ehr_edc_platforms'],
  },
  {
    claimId: 'clinical_trials.hybrid.patient_access_diversity', claimLabel: 'Patient Access & Diversity',
    isMandatory: true, canBeNA: true,
    classBQuestions: ['ht_patient_panel_documented', 'ht_language_access_doc'],
    classCQuestions: ['ht_patient_panel_size', 'ht_geo_reach', 'ht_languages', 'ht_underserved_access', 'ht_retention_tracked'],
  },
  {
    claimId: 'clinical_trials.hybrid.biospecimen_at_home', claimLabel: 'Biospecimen-at-Home',
    isMandatory: true, canBeNA: true, gateQuestion: 'ht_has_bio_home',
    classBQuestions: ['ht_bio_collection_sop', 'ht_custody_sop', 'ht_ship_courier_workflow', 'ht_bio_sample_workflow'],
    classCQuestions: ['ht_bio_specimen_types_home', 'ht_temp_monitoring_home', 'ht_temp_excursion_process', 'ht_temp_packaging_validated', 'ht_custody_documentation', 'ht_ship_provider_count'],
  },
  {
    claimId: 'clinical_trials.hybrid.remote_monitoring', claimLabel: 'Remote Monitoring',
    isMandatory: false, canBeNA: true, gateQuestion: 'ht_has_remote_mon',
    classBQuestions: ['ht_rm_monitoring_sop', 'ht_rm_device_sop', 'ht_rm_patient_training'],
    classCQuestions: ['ht_rm_data_ingestion', 'ht_rm_alert_mgmt', 'ht_rm_device_types'],
  },
  {
    claimId: 'clinical_trials.hybrid.vendor_nurse_coordination', claimLabel: 'Vendor / Home Nurse Coordination',
    isMandatory: true, canBeNA: true, gateQuestion: 'ht_has_home_visits',
    classBQuestions: ['ht_vendor_qual_sop', 'ht_vendor_training_sop'],
    classCQuestions: ['ht_vendor_perf_tracking'],
  },
  {
    claimId: 'clinical_trials.hybrid.protocol_compliance', claimLabel: 'Protocol Compliance Documentation',
    isMandatory: true, canBeNA: false,
    classBQuestions: ['ht_compliance_deviation_sop', 'ht_compliance_monitoring_sop'],
    classCQuestions: ['ht_compliance_capa_linked'],
  },
  {
    claimId: 'clinical_trials.hybrid.safety_escalation', claimLabel: 'Safety Escalation',
    isMandatory: true, canBeNA: false,
    classBQuestions: ['ht_safety_escalation_sop', 'ht_safety_emergency_sop'],
    classCQuestions: ['ht_safety_drills', 'ht_safety_drill_freq', 'ht_safety_ae_reporting'],
  },
  {
    claimId: 'clinical_trials.hybrid.historical_experience', claimLabel: 'Hybrid Trial Historical Experience',
    isMandatory: false, canBeNA: true, gateQuestion: 'ht_has_hybrid_exp',
    classBQuestions: [],
    classCQuestions: ['ht_hybrid_exp_count', 'ht_hybrid_exp_phases', 'ht_hybrid_exp_components', 'ht_hybrid_exp_therapeutic'],
  },
]

function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}

function evaluateOnboardingClaim(
  mapping: ClaimMapping,
  answers: Record<string, unknown>,
): OnboardingClaimResult {
  // Gate check for N/A
  if (mapping.gateQuestion && mapping.canBeNA) {
    const gateAnswer = answers[mapping.gateQuestion]
    if (gateAnswer === 'na' || gateAnswer === 'no') {
      return {
        claimId: mapping.claimId, claimLabel: mapping.claimLabel,
        evidenceSupport: 'NOT_APPLICABLE', confidence: 1.0,
        isMandatory: mapping.isMandatory, met: false, gaps: [],
      }
    }
    if (!isAnswered(gateAnswer)) {
      return {
        claimId: mapping.claimId, claimLabel: mapping.claimLabel,
        evidenceSupport: 'UNKNOWN', confidence: 0,
        isMandatory: mapping.isMandatory, met: false, gaps: ['Gate question not answered'],
      }
    }
  }

  const bAnswered = mapping.classBQuestions.filter((q) => isAnswered(answers[q])).length
  const bTotal = mapping.classBQuestions.length
  const cAnswered = mapping.classCQuestions.filter((q) => isAnswered(answers[q])).length
  const cTotal = mapping.classCQuestions.length

  // No evidence → UNKNOWN
  if (bAnswered === 0 && cAnswered === 0) {
    return {
      claimId: mapping.claimId, claimLabel: mapping.claimLabel,
      evidenceSupport: 'UNKNOWN', confidence: 0,
      isMandatory: mapping.isMandatory, met: false,
      gaps: ['No evidence collected for this claim'],
    }
  }

  const rawConfidence = (bTotal + cTotal > 0)
    ? ((bAnswered / Math.max(bTotal, 1)) * 0.50 + (cAnswered / Math.max(cTotal, 1)) * 0.50)
    : 0

  const evidenceClasses: string[] = []
  if (bAnswered > 0) evidenceClasses.push('B')
  if (cAnswered > 0) evidenceClasses.push('C')

  const { evidenceSupport, cappedConfidence } = computeEvidenceSupportLevel(evidenceClasses, rawConfidence)
  let confidence = cappedConfidence

  // Historical experience: Class C only is valid
  if (mapping.claimId === 'clinical_trials.hybrid.historical_experience' && bAnswered === 0 && cAnswered > 0) {
    confidence = Math.min(0.65, (cAnswered / Math.max(cTotal, 1)) * 0.65)
  }

  const gaps: string[] = []
  if (bAnswered < bTotal) gaps.push(`${bTotal - bAnswered} of ${bTotal} Class B items missing`)
  if (cAnswered < cTotal) gaps.push(`${cTotal - cAnswered} of ${cTotal} Class C items missing`)
  if (evidenceSupport === 'DECLARED_ONLY') gaps.push('No operational (Class C) evidence — confidence capped at 0.40')

  return {
    claimId: mapping.claimId, claimLabel: mapping.claimLabel,
    evidenceSupport, confidence,
    isMandatory: mapping.isMandatory,
    met: isClaimMet(evidenceSupport as Parameters<typeof isClaimMet>[0], confidence, 0.50),
    gaps,
  }
}

// --------------------------------------------------------------------------
// Route Handler
// --------------------------------------------------------------------------

export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const body = await request.json().catch(() => ({}))
      const parsed = evaluateSchema.safeParse(body)
      if (!parsed.success) throw new ApiError(400, 'Invalid request body', parsed.error.message)

      const { programTypeKey, source, answers, persist } = parsed.data
      const orgId = requireActiveOrg(user)

      // Resolve taxonomy (needed for both branches)
      const { data: taxonomy, error: taxError } = await supabase
        .from('program_type_taxonomy')
        .select('id, type_key, name, readiness_threshold, category')
        .eq('type_key', programTypeKey)
        .single()

      if (taxError || !taxonomy) throw new ApiError(404, 'Program type not found', programTypeKey)

      // ────────────────────────────────────────────────────────────
      // BRANCH: onboarding_answers (KTP-1.3)
      // ────────────────────────────────────────────────────────────
      if (source === 'onboarding_answers') {
        if (!answers || Object.keys(answers).length === 0) {
          throw new ApiError(400, 'answers required when source=onboarding_answers')
        }

        // Only hybrid_trial is supported via onboarding answers currently
        if (programTypeKey !== 'readiness_hybrid_trial') {
          throw new ApiError(400, 'source=onboarding_answers is only supported for readiness_hybrid_trial')
        }

        const hasHybridAnswers = Object.keys(answers).some(k => k.startsWith('ht_'))
        if (!hasHybridAnswers) {
          throw new ApiError(400, 'No hybrid trial (ht_*) answers found in request body')
        }

        // Evaluate each claim from onboarding answers
        const claimResults = CLAIM_MAPPINGS.map(m => evaluateOnboardingClaim(m, answers))

        // Count mandatory/optional
        let mandatoryMet = 0; let mandatoryTotal = 0
        let optionalMet = 0; let optionalTotal = 0

        for (const c of claimResults) {
          if (c.evidenceSupport === 'NOT_APPLICABLE' || c.evidenceSupport === 'UNKNOWN') continue
          if (c.isMandatory) { mandatoryTotal++; if (c.met) mandatoryMet++ }
          else { optionalTotal++; if (c.met) optionalMet++ }
        }

        const active = claimResults.filter(
          c => c.evidenceSupport !== 'NOT_APPLICABLE' && c.evidenceSupport !== 'UNKNOWN',
        )
        const overallConfidence = active.length > 0
          ? Math.round((active.reduce((s, c) => s + c.confidence, 0) / active.length) * 100) / 100
          : 0

        // Determine readiness status
        let readinessStatus: string
        if (mandatoryTotal === 0) {
          readinessStatus = optionalTotal === 0 || optionalMet === optionalTotal ? 'ready' : 'partial'
        } else if (mandatoryMet < mandatoryTotal) {
          readinessStatus = 'not_ready'
        } else if (optionalMet === optionalTotal) {
          readinessStatus = 'ready'
        } else if (optionalMet > 0) {
          readinessStatus = 'conditionally_ready'
        } else {
          readinessStatus = 'partial'
        }

        const threshold = taxonomy.readiness_threshold as number ?? 0.75
        if (readinessStatus === 'ready' && overallConfidence < threshold) {
          readinessStatus = 'conditionally_ready'
        }

        // Build capabilities
        const capabilities: CapabilitySummary[] = claimResults
          .filter(c => c.evidenceSupport !== 'NOT_APPLICABLE')
          .map(c => ({
            capabilityTypeId: c.claimId,
            capabilityTypeName: c.claimLabel,
            isMandatory: c.isMandatory,
            confidence: c.confidence,
            metRequirements: c.met,
            evidenceCount: Object.values(answers).filter(v => isAnswered(v)).length,
            mandatoryEvidenceMet: c.met ? 1 : 0,
            mandatoryEvidenceTotal: 1,
          }))

        // Build gaps
        const gaps: EvidenceGap[] = claimResults
          .filter(c => c.evidenceSupport !== 'NOT_APPLICABLE' && c.evidenceSupport !== 'UNKNOWN' && c.gaps.length > 0)
          .map(c => ({
            capabilityTypeId: c.claimId,
            capabilityTypeName: c.claimLabel,
            evidenceClass: 'B',
            required: 1,
            present: 0,
            missing: 1,
            isMandatory: c.isMandatory,
            suggestions: c.gaps,
          }))

        const correlationId = `onboarding-answers-${orgId}-${programTypeKey}-${Date.now()}`
        const warnings = [
          'Evaluation based on onboarding answers only. No evidence nodes persisted in database.',
          'Self-declared claims are capped at 0.40 confidence.',
          'Upload documents to convert claims from DECLARED_ONLY to SUPPORTED_BY_EVIDENCE.',
        ]

        const result: ReadinessEvaluation & { persisted: boolean; warnings: string[]; verifiableVia: string } = {
          evaluationId: null,
          organizationId: orgId,
          programTypeKey,
          programTypeName: taxonomy.name as string,
          status: readinessStatus as ReadinessEvaluation['status'],
          overallConfidence,
          capabilitiesBreakdown: capabilities,
          evidenceGaps: gaps,
          computedAt: new Date().toISOString(),
          evidenceGraphCorrelationId: correlationId,
          visibilityScope: 'organization',
          persisted: false,
          warnings,
          verifiableVia: `onboarding-answers://hybrid-trial/${orgId}`,
        }

        return Response.json({ data: result }, { status: 200 })
      }

      // ────────────────────────────────────────────────────────────
      // BRANCH: evidence_nodes (existing behavior)
      // ────────────────────────────────────────────────────────────

      // 2. Fetch capability requirements
      const { data: capReqs, error: capError } = await supabase
        .from('readiness_capability_requirements')
        .select(`
          id, is_mandatory, minimum_confidence,
          capability_type_id,
          organization_capability_types!inner(key, name)
        `)
        .eq('program_type_id', taxonomy.id)
        .order('display_order', { ascending: true })

      if (capError) throw new ApiError(500, 'Failed to fetch capability requirements', capError.message)

      // 3. Fetch evidence requirements
      const capReqIds = (capReqs ?? []).map((c: Record<string, unknown>) => c.id)
      const { data: evReqs } = capReqIds.length > 0
        ? await supabase
            .from('readiness_evidence_requirements')
            .select('capability_requirement_id, evidence_class, is_mandatory, minimum_count')
            .in('capability_requirement_id', capReqIds)
        : { data: [] }

      const evByCap = new Map<string, Array<Record<string, unknown>>>()
      for (const e of (evReqs ?? [])) {
        const k = e.capability_requirement_id as string
        if (!evByCap.has(k)) evByCap.set(k, [])
        evByCap.get(k)!.push(e)
      }

      // 4. Evaluate each capability against existing evidence
      const capabilities: CapabilitySummary[] = []
      const gaps: EvidenceGap[] = []

      for (const capReq of (capReqs ?? [])) {
        const r = capReq as Record<string, unknown>
        const capType = r.organization_capability_types as Record<string, unknown> | null
        const capId = r.capability_type_id as string
        const reqs = evByCap.get(r.id as string) ?? []

        const { count: evidenceCount } = await supabase
          .from('claims')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)

        let mandatoryMet = 0
        let mandatoryTotal = 0

        for (const er of reqs) {
          if (er.is_mandatory) {
            mandatoryTotal++
            const { count } = await supabase
              .from('evidence_nodes')
              .select('id', { count: 'exact', head: true })
              .eq('organization_id', orgId)
            if ((count ?? 0) > 0) mandatoryMet++
          }
        }

        const capConfidence = mandatoryTotal > 0
          ? Math.round((mandatoryMet / mandatoryTotal) * 100) / 100
          : 0

        capabilities.push({
          capabilityTypeId: capId,
          capabilityTypeName: capType?.name as string ?? 'Unknown',
          isMandatory: (r.is_mandatory as boolean) ?? true,
          confidence: capConfidence,
          metRequirements: mandatoryMet === mandatoryTotal && mandatoryTotal > 0,
          evidenceCount: evidenceCount ?? 0,
          mandatoryEvidenceMet: mandatoryMet,
          mandatoryEvidenceTotal: mandatoryTotal,
        })

        if (mandatoryMet < mandatoryTotal) {
          gaps.push({
            capabilityTypeId: capId,
            capabilityTypeName: capType?.name as string ?? 'Unknown',
            evidenceClass: 'A',
            required: mandatoryTotal,
            present: mandatoryMet,
            missing: mandatoryTotal - mandatoryMet,
            isMandatory: true,
            suggestions: [`Provide ${mandatoryTotal - mandatoryMet} more evidence item(s) for ${capType?.name ?? 'this capability'}`],
          })
        }
      }

      const mandatoryCaps = capabilities.filter(c => c.isMandatory)
      const overallConfidence = mandatoryCaps.length > 0
        ? Math.round((mandatoryCaps.reduce((s, c) => s + c.confidence, 0) / mandatoryCaps.length) * 100) / 100
        : 0

      const allMet = mandatoryCaps.every(c => c.metRequirements)
      const anyMet = mandatoryCaps.some(c => c.metRequirements)
      const status = allMet ? 'ready' : anyMet ? 'partial' : 'not_ready'

      const threshold = taxonomy.readiness_threshold as number ?? 0.75
      const finalStatus = status === 'ready' && overallConfidence < threshold ? 'conditionally_ready' : status

      const snapshot = { capabilitiesBreakdown: capabilities, evidenceGaps: gaps }
      const correlationId = `eval-${orgId}-${programTypeKey}-${Date.now()}`

      const { data: existing } = await supabase
        .from('readiness_evaluations')
        .select('id, readiness_status')
        .eq('organization_id', orgId)
        .eq('program_type_id', taxonomy.id)
        .maybeSingle()

      let evaluationId: string

      if (existing) {
        const { data: updated, error: updError } = await supabase
          .from('readiness_evaluations')
          .update({
            readiness_status: finalStatus,
            overall_confidence: overallConfidence,
            evaluation_snapshot: snapshot,
            computed_at: new Date().toISOString(),
            evidence_graph_correlation_id: correlationId,
          })
          .eq('id', existing.id)
          .select('id')
          .single()

        if (updError) throw new ApiError(500, 'Failed to update evaluation', updError.message)
        evaluationId = updated.id as string
      } else {
        const { data: inserted, error: insError } = await supabase
          .from('readiness_evaluations')
          .insert({
            organization_id: orgId,
            program_id: taxonomy.id,
            program_type_id: taxonomy.id,
            readiness_status: finalStatus,
            overall_confidence: overallConfidence,
            evaluation_snapshot: snapshot,
            visibility_scope: 'organization',
            computed_at: new Date().toISOString(),
            evidence_graph_correlation_id: correlationId,
            created_by: user.id,
          })
          .select('id')
          .single()

        if (insError) throw new ApiError(500, 'Failed to create evaluation', insError.message)
        evaluationId = inserted.id as string
      }

      const result: ReadinessEvaluation = {
        evaluationId,
        organizationId: orgId,
        programTypeKey,
        programTypeName: taxonomy.name as string,
        status: finalStatus as ReadinessEvaluation['status'],
        overallConfidence,
        capabilitiesBreakdown: capabilities,
        evidenceGaps: gaps,
        computedAt: new Date().toISOString(),
        evidenceGraphCorrelationId: correlationId,
        visibilityScope: 'organization',
      }

      return Response.json({ data: result }, { status: 200 })
    } catch (err) {
      return handleApiError(err)
    }
  }),
  SPAN_API_REQUEST,
  { attributes: { 'kadarn.api.route': 'readiness/evaluate', 'kadarn.api.method': 'POST' } },
)
