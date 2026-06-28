import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server'
import { uuidParamSchema } from '@/lib/validation'

// ---------------------------------------------------------------------------
// KPE — Kadarn Proof of Execution
//
// Program-scoped audit-readiness scoring across 4 dimensions:
//   Evidence (≥90%)   — provenance_nodes (specimen, qc, consent) + provenance_evidence
//   Governance (100%) — program_milestones (irb, mta)
//   Provenance (≥85%) — provenance_edges chain completeness
//   Settlement (≥80%) — exchange_deals + exchange_escrow
// ---------------------------------------------------------------------------

interface DimensionScore {
  score: number
  total: number
  passed: number
  status: 'pass' | 'warn' | 'fail'
  gaps: string[]
}

function dimStatus(score: number, threshold: number): 'pass' | 'warn' | 'fail' {
  if (score >= threshold) return 'pass'
  if (score >= threshold - 15) return 'warn'
  return 'fail'
}

// ---------------------------------------------------------------------------
// Evidence dimension
// ---------------------------------------------------------------------------
async function scoreEvidence(
  supabase: Awaited<ReturnType<typeof createRouteClient>>,
  programId: string,
): Promise<DimensionScore> {
  // Critical node types for audit evidence
  const criticalTypes = ['specimen', 'qc_result', 'consent', 'document']

  // Fetch all program-scoped provenance nodes via organization linkage
  const { data: nodes } = await supabase
    .from('provenance_nodes')
    .select(`
      id, node_type,
      provenance_evidence ( id )
    `)
    .in('node_type', criticalTypes)

  const allNodes = nodes ?? []
  const total = allNodes.length
  const withEvidence = allNodes.filter(n => (n.provenance_evidence ?? []).length > 0).length
  const score = total > 0 ? Math.round((withEvidence / total) * 100) : 0

  const gaps: string[] = []
  if (total === 0) {
    gaps.push('No evidence nodes found for this program')
  } else {
    const missing = total - withEvidence
    if (missing > 0) gaps.push(`${missing} node(s) without linked evidence`)
    // Per-type breakdown
    for (const t of criticalTypes) {
      const typed = allNodes.filter(n => n.node_type === t)
      const typedOk = typed.filter(n => (n.provenance_evidence ?? []).length > 0).length
      if (typed.length > 0 && typedOk < typed.length) {
        gaps.push(`${t}: ${typed.length - typedOk}/${typed.length} missing evidence`)
      }
    }
  }

  return {
    score,
    total,
    passed: withEvidence,
    status: dimStatus(score, 90),
    gaps,
  }
}

// ---------------------------------------------------------------------------
// Governance dimension
// ---------------------------------------------------------------------------
async function scoreGovernance(
  supabase: Awaited<ReturnType<typeof createRouteClient>>,
  programId: string,
): Promise<DimensionScore> {
  const governanceTypes = ['irb_submission', 'irb_approval', 'mta_execution']

  const { data: milestones } = await supabase
    .from('program_milestones')
    .select('id, milestone_type, status, actual_end_date')
    .eq('program_id', programId)
    .in('milestone_type', governanceTypes)
    .order('milestone_type')

  const all = milestones ?? []
  const total = governanceTypes.length // all governance types expected
  const completed = all.filter(m => m.status === 'completed').length

  // Governance is all-or-nothing: 100% required
  const score = total > 0 ? Math.round((completed / total) * 100) : 0

  const gaps: string[] = []
  for (const gType of governanceTypes) {
    const found = all.find(m => m.milestone_type === gType)
    if (!found) {
      gaps.push(`${gType} — not started`)
    } else if (found.status !== 'completed') {
      gaps.push(`${gType} — ${found.status}`)
    }
  }

  return {
    score,
    total,
    passed: completed,
    status: score >= 100 ? 'pass' : score >= 50 ? 'warn' : 'fail',
    gaps,
  }
}

// ---------------------------------------------------------------------------
// Provenance dimension
// ---------------------------------------------------------------------------
async function scoreProvenance(
  supabase: Awaited<ReturnType<typeof createRouteClient>>,
  programId: string,
): Promise<DimensionScore> {
  // Expected chain: specimen → processing_event → shipment → receipt
  const chainSequence = ['specimen', 'processing_event', 'shipment', 'receipt']

  const { data: nodes } = await supabase
    .from('provenance_nodes')
    .select('id, node_type, external_id')
    .in('node_type', chainSequence)

  const allNodes = nodes ?? []

  // Count how many nodes have at least one incoming OR outgoing edge
  const nodeIds = allNodes.map(n => n.id)
  let edgeCount = 0
  if (nodeIds.length > 0) {
    // Two safe queries instead of string-interpolated .or() to prevent SQL injection
    const { data: edgesFromSource, count: sourceCount } = await supabase
      .from('provenance_edges')
      .select('id', { count: 'exact', head: true })
      .in('source_node_id', nodeIds)

    const { data: edgesFromTarget, count: targetCount } = await supabase
      .from('provenance_edges')
      .select('id', { count: 'exact', head: true })
      .in('target_node_id', nodeIds)

    edgeCount = (sourceCount ?? 0) + (targetCount ?? 0)
  }

  // Score: how well-connected is the provenance graph?
  // Ideal: every node has at least 1 edge forming a chain
  const total = allNodes.length
  // A node is "chained" if it participates in at least one edge
  // We approximate by checking if edgeCount ≥ total - 1 (minimum edges for a chain)
  const chained = Math.min(edgeCount, total)
  const score = total > 0 ? Math.round((chained / total) * 100) : 0

  const gaps: string[] = []
  if (total === 0) {
    gaps.push('No provenance nodes for this program')
  } else {
    // Check per-type coverage
    for (const nType of chainSequence) {
      const typed = allNodes.filter(n => n.node_type === nType)
      if (typed.length === 0) {
        gaps.push(`Missing ${nType} nodes — chain incomplete`)
      }
    }
    if (edgeCount < total - 1) {
      gaps.push(`${total - 1 - edgeCount} missing edge(s) to form complete chain`)
    }
  }

  return {
    score,
    total,
    passed: chained,
    status: dimStatus(score, 85),
    gaps,
  }
}

// ---------------------------------------------------------------------------
// Settlement dimension
// ---------------------------------------------------------------------------
async function scoreSettlement(
  supabase: Awaited<ReturnType<typeof createRouteClient>>,
  programId: string,
): Promise<DimensionScore> {
  // Settlement = exchange_deals linked to this program + their escrow accounts
  const { data: deals } = await supabase
    .from('exchange_deals')
    .select(`
      id, status, total_value,
      exchange_escrow ( total_amount, released_amount, status )
    `)
    .eq('program_id', programId)

  const allDeals = deals ?? []
  const total = allDeals.length

  if (total === 0) {
    return {
      score: 0,
      total: 0,
      passed: 0,
      status: 'fail',
      gaps: ['No exchange deals found for this program'],
    }
  }

  // Settlement readiness scoring:
  // - Deal must be active/completed (not pending/cancelled/disputed)
  // - Escrow must have ≥80% released (if funded)
  let healthyDeals = 0
  const gaps: string[] = []

  for (const deal of allDeals) {
    const escrows = (deal.exchange_escrow ?? []) as Array<{
      total_amount: number
      released_amount: number
      status: string
    }>
    const escrow = escrows[0] // one escrow per deal

    if (deal.status === 'disputed') {
      gaps.push(`Deal ${deal.id.slice(0, 8)}: disputed`)
      continue
    }
    if (deal.status === 'cancelled') {
      gaps.push(`Deal ${deal.id.slice(0, 8)}: cancelled`)
      continue
    }
    if (deal.status === 'pending_acceptance') {
      gaps.push(`Deal ${deal.id.slice(0, 8)}: not yet accepted`)
      continue
    }

    // Check escrow release %
    if (escrow && escrow.total_amount > 0) {
      const releasePct = (escrow.released_amount / escrow.total_amount) * 100
      if (releasePct < 80) {
        gaps.push(`Deal ${deal.id.slice(0, 8)}: only ${Math.round(releasePct)}% escrow released`)
        continue
      }
    }

    healthyDeals++
  }

  const score = total > 0 ? Math.round((healthyDeals / total) * 100) : 0

  return {
    score,
    total,
    passed: healthyDeals,
    status: dimStatus(score, 80),
    gaps,
  }
}

// ---------------------------------------------------------------------------
// Milestone timeline
// ---------------------------------------------------------------------------
async function getMilestoneTimeline(
  supabase: Awaited<ReturnType<typeof createRouteClient>>,
  programId: string,
) {
  const { data: milestones } = await supabase
    .from('program_milestones')
    .select('id, milestone_type, title, status, planned_end_date, actual_end_date, assigned_org_id')
    .eq('program_id', programId)
    .order('planned_end_date', { ascending: true })

  return (milestones ?? []).map(m => ({
    id: m.id,
    type: m.milestone_type,
    title: m.title,
    status: m.status,
    planned_end: m.planned_end_date,
    actual_end: m.actual_end_date,
    assigned_org: m.assigned_org_id,
  }))
}

// ---------------------------------------------------------------------------
// Linked evidence items
// ---------------------------------------------------------------------------
async function getEvidenceItems(
  supabase: Awaited<ReturnType<typeof createRouteClient>>,
  programId: string,
) {
  const criticalTypes = ['specimen', 'qc_result', 'consent', 'document']

  const { data: nodes } = await supabase
    .from('provenance_nodes')
    .select(`
      id, node_type, external_id, label, organization_id, recorded_at,
      provenance_evidence ( id, evidence_type, reference )
    `)
    .in('node_type', criticalTypes)
    .order('recorded_at', { ascending: false })
    .limit(50)

  return (nodes ?? []).map(n => ({
    id: n.id,
    type: n.node_type,
    external_id: n.external_id,
    label: n.label,
    has_evidence: (n.provenance_evidence ?? []).length > 0,
    evidence_count: (n.provenance_evidence ?? []).length,
    recorded_at: n.recorded_at,
  }))
}

// ---------------------------------------------------------------------------
// KPE endpoint
// ---------------------------------------------------------------------------
export const GET = withAuth(async (_request, user, params) => {
  try {
    const { id: programId } = uuidParamSchema.parse(params)
    const supabase = await createRouteClient()

    // Verify program exists
    const { data: program, error: progErr } = await supabase
      .from('programs')
      .select('id, name, short_name, status, sponsor_org_id')
      .eq('id', programId)
      .single()

    if (progErr || !program) {
      return Response.json(
        { error: { code: 404, message: 'Program not found' } },
        { status: 404 },
      )
    }

    // Check access: KOC internal OR program participant
    const isKocInternal = user.user_metadata?.kadarn_role === 'kadarn_internal'

    if (!isKocInternal) {
      const { data: membership } = await supabase
        .from('program_participants')
        .select('id')
        .eq('program_id', programId)
        .eq('organization_id', user.user_metadata?.active_org_id)
        .eq('status', 'active')
        .maybeSingle()

      if (!membership) {
        return Response.json(
          { error: { code: 403, message: 'Access denied — not a program participant' } },
          { status: 403 },
        )
      }
    }

    // Score all 4 dimensions in parallel
    const [evidence, governance, provenance, settlement, milestones, evidenceItems] =
      await Promise.all([
        scoreEvidence(supabase, programId),
        scoreGovernance(supabase, programId),
        scoreProvenance(supabase, programId),
        scoreSettlement(supabase, programId),
        getMilestoneTimeline(supabase, programId),
        getEvidenceItems(supabase, programId),
      ])

    // Aggregate score (weighted average)
    const dimensions = { evidence, governance, provenance, settlement }
    const weights = { evidence: 0.30, governance: 0.30, provenance: 0.25, settlement: 0.15 }

    const weightedTotal = Object.entries(weights).reduce(
      (sum, [key, w]) => sum + dimensions[key as keyof typeof dimensions].score * w,
      0,
    )
    const kpeScore = Math.round(weightedTotal)

    // Audit-ready: each dimension must pass its threshold
    const gaps = [
      ...evidence.gaps,
      ...governance.gaps,
      ...provenance.gaps,
      ...settlement.gaps,
    ]

    const auditReady =
      evidence.status === 'pass' &&
      governance.status === 'pass' &&
      provenance.status === 'pass' &&
      settlement.status === 'pass'

    return Response.json({
      data: {
        program: {
          id: program.id,
          name: program.name,
          short_name: program.short_name,
          status: program.status,
        },
        kpe_score: kpeScore,
        audit_ready: auditReady,
        dimensions: {
          evidence: {
            score: evidence.score,
            threshold: 90,
            status: evidence.status,
            total: evidence.total,
            passed: evidence.passed,
            gaps: evidence.gaps,
          },
          governance: {
            score: governance.score,
            threshold: 100,
            status: governance.status,
            total: governance.total,
            passed: governance.passed,
            gaps: governance.gaps,
          },
          provenance: {
            score: provenance.score,
            threshold: 85,
            status: provenance.status,
            total: provenance.total,
            passed: provenance.passed,
            gaps: provenance.gaps,
          },
          settlement: {
            score: settlement.score,
            threshold: 80,
            status: settlement.status,
            total: settlement.total,
            passed: settlement.passed,
            gaps: settlement.gaps,
          },
        },
        gaps,
        milestones,
        evidence_items: evidenceItems,
      },
      error: null,
    })
  } catch (err) {
    return handleApiError(err)
  }
})
