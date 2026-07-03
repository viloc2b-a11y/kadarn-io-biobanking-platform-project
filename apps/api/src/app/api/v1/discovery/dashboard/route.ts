// ==========================================================================
// Discovery Dashboard API — Aggregate Data / Phase 8 28D convergence
// ==========================================================================
// GET /api/v1/discovery/dashboard?sessionId=xxx
// Capability/claim outputs via Published View service (ADR-030).
// Never writes to Evidence Core.
// ==========================================================================

import { withAuth, handleApiError, createServiceClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { buildDiscoveryMetrics } from '@/lib/discovery-metrics';
import { getPublishedViewService } from '@/lib/published-view-service';

const RUN_SCOPED_AGENTS = [
  'evidence_snapshot',
  'snapshot_builder',
  'institutional_timeline_engine',
  'capability_detector',
  'claim_candidate_detector',
  'evidence_gap_detector',
  'narrative_engine',
  'profile_builder',
  'institutional_profile',
] as const;

const ARTIFACT_SCOPED_AGENTS = [
  'document-classifier',
  'entity-extractor',
  'relationship-extractor',
] as const;

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function extractEntityCount(output: Record<string, unknown> | undefined): number {
  if (!output) return 0;
  return (
    countArray(output.entities)
    || countArray(output.entityGroups)
    || countArray((output.summary as Record<string, unknown> | undefined)?.entitiesDetected as unknown)
  );
}

function extractRelationshipCount(output: Record<string, unknown> | undefined): number {
  if (!output) return 0;
  return (
    countArray(output.relationships)
    || countArray(output.relationshipSummary)
  );
}

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = createServiceClient();
    const organizationId = await requireValidatedActiveOrg(user);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json(
        { data: null, error: 'sessionId query parameter is required' },
        { status: 400 },
      );
    }

    const { data: session, error: sessionErr } = await supabase
      .from('discovery_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('organization_id', organizationId)
      .single();
    if (sessionErr) throw sessionErr;

    const { data: runs } = await supabase
      .from('discovery_runs')
      .select('*')
      .eq('session_id', sessionId)
      .order('started_at', { ascending: false })
      .limit(1);

    const latestRun = runs?.[0] ?? null;

    let artifactCount = 0;
    let entityCount = 0;
    let relationshipCount = 0;
    let candidateCount = 0;

    const agentOutputs: Record<string, { output: Record<string, unknown>; confidence: number; status: string; created_at: string }> = {};

    if (latestRun) {
      const { count: aC } = await supabase
        .from('discovery_artifacts')
        .select('*', { count: 'exact', head: true })
        .eq('run_id', latestRun.id);
      artifactCount = aC ?? 0;

      const { count: cC } = await supabase
        .from('discovery_candidates')
        .select('*', { count: 'exact', head: true })
        .eq('run_id', latestRun.id);
      candidateCount = cC ?? 0;

      const { data: artifacts } = await supabase
        .from('discovery_artifacts')
        .select('id')
        .eq('run_id', latestRun.id);

      const artifactIds = (artifacts ?? []).map((a) => a.id);

      if (artifactIds.length > 0) {
        const { data: scopedOutputs } = await supabase
          .from('discovery_agent_outputs')
          .select('agent_name, output, confidence, status, created_at')
          .in('artifact_id', artifactIds)
          .order('created_at', { ascending: false });

        for (const row of scopedOutputs ?? []) {
          if (!agentOutputs[row.agent_name]) {
            agentOutputs[row.agent_name] = {
              output: (row.output ?? {}) as Record<string, unknown>,
              confidence: Number(row.confidence ?? 0),
              status: row.status,
              created_at: row.created_at,
            };
          }
        }
      }

      for (const name of RUN_SCOPED_AGENTS) {
        if (agentOutputs[name]) continue;
        const { data: outputs } = await supabase
          .from('discovery_agent_outputs')
          .select('output, confidence, status, created_at')
          .eq('agent_name', name)
          .order('created_at', { ascending: false })
          .limit(1);

        if (outputs?.[0]) {
          agentOutputs[name] = {
            output: (outputs[0].output ?? {}) as Record<string, unknown>,
            confidence: Number(outputs[0].confidence ?? 0),
            status: outputs[0].status,
            created_at: outputs[0].created_at,
          };
        }
      }

      const entityOutput =
        agentOutputs['entity-extractor']?.output
        ?? agentOutputs['entity_extractor']?.output;
      const relationshipOutput =
        agentOutputs['relationship-extractor']?.output
        ?? agentOutputs['relationship_extractor']?.output;

      entityCount = extractEntityCount(entityOutput);
      relationshipCount = extractRelationshipCount(relationshipOutput);

      const snapshotOutput =
        agentOutputs['evidence_snapshot']?.output
        ?? agentOutputs['snapshot_builder']?.output;
      if (snapshotOutput?.summary) {
        const summary = snapshotOutput.summary as Record<string, unknown>;
        entityCount = Number(summary.entitiesDetected ?? entityCount) || entityCount;
        relationshipCount = Number(summary.relationshipsDetected ?? relationshipCount) || relationshipCount;
      }
    }

    const { data: curationEvents } = latestRun
      ? await supabase
          .from('discovery_curation_events')
          .select('*')
          .eq('discovery_run_id', latestRun.id)
          .order('created_at', { ascending: false })
          .limit(50)
      : { data: [] };

    const { data: validationNotes } = await supabase
      .from('discovery_validation_notes')
      .select('*')
      .eq('discovery_session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(50);

    const { data: artifacts } = latestRun
      ? await supabase
          .from('discovery_artifacts')
          .select('*')
          .eq('run_id', latestRun.id)
          .order('created_at', { ascending: false })
          .limit(100)
      : { data: [] };

    const { data: candidates } = latestRun
      ? await supabase
          .from('discovery_candidates')
          .select('*')
          .eq('run_id', latestRun.id)
          .order('created_at', { ascending: false })
          .limit(100)
      : { data: [] };

    const viewService = getPublishedViewService();
    const viewAdapted = viewService.adaptDiscoveryDashboard({
      orgId: organizationId,
      sessionId,
      agentOutputs,
      candidates: (candidates ?? []) as Array<Record<string, unknown>>,
    });

    const metrics = buildDiscoveryMetrics({
      counts: {
        artifacts: artifactCount,
        entities: entityCount,
        relationships: relationshipCount,
        candidates: candidateCount,
      },
      agentOutputs: viewAdapted.agentOutputs,
      curationEvents: curationEvents ?? [],
      validationNotes: validationNotes ?? [],
      sessionCreatedAt: session.created_at,
      latestRun: latestRun
        ? { started_at: latestRun.started_at, completed_at: latestRun.completed_at }
        : null,
    });

    return Response.json({
      data: {
        session,
        latestRun,
        counts: {
          artifacts: artifactCount,
          entities: entityCount,
          relationships: relationshipCount,
          candidates: candidateCount,
        },
        metrics,
        agentOutputs: viewAdapted.agentOutputs,
        curationEvents: curationEvents ?? [],
        validationNotes: validationNotes ?? [],
        artifacts: artifacts ?? [],
        candidates: viewAdapted.candidates,
      },
      error: null,
    });
  } catch (err) {
    return handleApiError(err);
  }
});
