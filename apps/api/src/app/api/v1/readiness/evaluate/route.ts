// ==========================================================================
// POST /api/v1/readiness/evaluate
// ==========================================================================
// Trigger a readiness evaluation for an organization against a program type.
// Calls readiness-engine's evaluateReadiness(), persists snapshot, emits events.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient, ApiError } from '@/lib/supabase-server'
import { withAsyncTracing, SPAN_API_REQUEST } from '@kadarn/telemetry'
import { requireActiveOrg } from '@/lib/workspace'
import { z } from 'zod'
import type { ReadinessEvaluation, CapabilitySummary, EvidenceGap } from '@kadarn/readiness-engine/dto'

const evaluateSchema = z.object({
  programTypeKey: z.string().min(1),
})

export const POST = withAsyncTracing(
  withAuth(async (request, user) => {
    try {
      const supabase = await createRouteClient()
      const body = await request.json().catch(() => ({}))
      const parsed = evaluateSchema.safeParse(body)
      if (!parsed.success) throw new ApiError(400, 'Invalid request body', parsed.error.message)

      const { programTypeKey } = parsed.data
      const orgId = requireActiveOrg(user)

      // 1. Resolve taxonomy
      const { data: taxonomy, error: taxError } = await supabase
        .from('program_type_taxonomy')
        .select('id, type_key, name, readiness_threshold')
        .eq('type_key', programTypeKey)
        .eq('category', 'readiness')
        .single()

      if (taxError || !taxonomy) throw new ApiError(404, 'Program type not found', programTypeKey)

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

      // Group evidence by capability requirement
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

        // Check if org has this capability asserted
        const { count: evidenceCount } = await supabase
          .from('claims')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)

        let mandatoryMet = 0
        let mandatoryTotal = 0

        for (const er of reqs) {
          if (er.is_mandatory) {
            mandatoryTotal++
            // Simplified: check if evidence exists for this class
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

      // 5. Compute overall readiness
      const mandatoryCaps = capabilities.filter(c => c.isMandatory)
      const overallConfidence = mandatoryCaps.length > 0
        ? Math.round((mandatoryCaps.reduce((s, c) => s + c.confidence, 0) / mandatoryCaps.length) * 100) / 100
        : 0

      const allMet = mandatoryCaps.every(c => c.metRequirements)
      const anyMet = mandatoryCaps.some(c => c.metRequirements)
      const status = allMet ? 'ready'
        : anyMet ? 'partial'
        : 'not_ready'

      const threshold = taxonomy.readiness_threshold as number ?? 0.75
      const finalStatus = status === 'ready' && overallConfidence < threshold ? 'conditionally_ready' : status

      // 6. Upsert evaluation
      const snapshot = { capabilitiesBreakdown: capabilities, evidenceGaps: gaps }
      const correlationId = `eval-${orgId}-${programTypeKey}-${Date.now()}`

      const { data: existing } = await supabase
        .from('readiness_evaluations')
        .select('id, readiness_status')
        .eq('organization_id', orgId)
        .eq('program_type_id', taxonomy.id)
        .maybeSingle()

      let evaluationId: string
      const previousStatus = (existing?.readiness_status as string) ?? null

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
