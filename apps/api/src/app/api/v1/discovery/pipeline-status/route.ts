// ==========================================================================
// Discovery Pipeline Status API (read-only)
// ==========================================================================
// GET /api/v1/discovery/pipeline-status?sessionId=
// Never writes to Evidence Core. No rerun.
// ==========================================================================

import { withAuth, handleApiError, createRouteClient } from '@/lib/supabase-server';
import { requireValidatedActiveOrg } from '@/lib/workspace';
import { buildDiscoveryPipelineStatus } from '@/lib/discovery-pipeline-status';

export const GET = withAuth(async (request, user) => {
  try {
    const supabase = await createRouteClient();
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
      .select('id')
      .eq('id', sessionId)
      .eq('organization_id', organizationId)
      .single();
    if (sessionErr) throw sessionErr;

    const { data: runs } = await supabase
      .from('discovery_runs')
      .select('id, status, pipeline_version')
      .eq('session_id', sessionId)
      .order('started_at', { ascending: false })
      .limit(1);

    const latestRun = runs?.[0] ?? null;

    if (!latestRun) {
      return Response.json({
        data: buildDiscoveryPipelineStatus({
          sessionId,
          run: null,
          artifacts: [],
          layer1Rows: [],
          prepRequests: [],
          agentOutputs: [],
          curationEventCount: 0,
          latestCurationAt: null,
        }),
        error: null,
      });
    }

    const { data: artifacts } = await supabase
      .from('discovery_artifacts')
      .select('id, created_at')
      .eq('run_id', latestRun.id);

    const artifactIds = (artifacts ?? []).map((a) => a.id);

    let layer1Rows: Array<{
      id: string;
      artifact_id: string;
      status: string;
      extracted_at: string;
      error_message: string | null;
    }> = [];

    if (artifactIds.length > 0) {
      const { data: layer1 } = await supabase
        .from('discovery_layer1')
        .select('id, artifact_id, status, extracted_at, error_message')
        .in('artifact_id', artifactIds);
      layer1Rows = layer1 ?? [];
    }

    const { data: prepRequests } = await supabase
      .from('discovery_preparation_requests')
      .select('request_id, request_type, status, error, created_at, completed_at, failed_at, updated_at')
      .eq('discovery_run_id', latestRun.id);

    let agentOutputs: Array<{
      agent_name: string;
      status: string;
      warnings: unknown;
      created_at: string;
    }> = [];

    if (artifactIds.length > 0) {
      const { data: outputs } = await supabase
        .from('discovery_agent_outputs')
        .select('agent_name, status, warnings, created_at')
        .in('artifact_id', artifactIds)
        .order('created_at', { ascending: false });
      agentOutputs = outputs ?? [];
    }

    const { data: curationEvents } = await supabase
      .from('discovery_curation_events')
      .select('created_at')
      .eq('discovery_run_id', latestRun.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const { count: curationCount } = await supabase
      .from('discovery_curation_events')
      .select('*', { count: 'exact', head: true })
      .eq('discovery_run_id', latestRun.id);

    const pipelineStatus = buildDiscoveryPipelineStatus({
      sessionId,
      run: latestRun,
      artifacts: artifacts ?? [],
      layer1Rows,
      prepRequests: prepRequests ?? [],
      agentOutputs,
      curationEventCount: curationCount ?? 0,
      latestCurationAt: curationEvents?.[0]?.created_at ?? null,
    });

    return Response.json({ data: pipelineStatus, error: null });
  } catch (err) {
    return handleApiError(err);
  }
});
