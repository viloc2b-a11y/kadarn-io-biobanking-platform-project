// ==========================================================================
// KAD-012 — Pilot Health Check Endpoint
// ==========================================================================
// GET /api/v1/pilot/health — Validates that all pipeline components function
// ==========================================================================

import { createRouteClient } from '@/lib/supabase-server';

export const GET = async () => {
  const supabase = await createRouteClient();
  const results: Record<string, { status: string; detail?: string }> = {};

  // 1. Database tables
  const tables = ['organizations', 'people', 'locations', 'organization_memberships', 'organization_roles',
    'claims', 'evidence_nodes', 'review_tasks', 'capabilities',
    'passport_entries', 'passport_shares', 'published_knowledge', 'readiness_scores',
    'evidence_class_ref', 'organization_capability_types', 'confidence_state_snapshots'];

  for (const table of tables) {
    try {
      const { count } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
      results[table] = { status: 'ok', detail: `${count ?? 0} rows` };
    } catch (e: any) {
      results[table] = { status: 'error', detail: e?.message ?? 'Unknown' };
    }
  }

  // 2. Vilo org exists
  const { data: vilo } = await supabase.from('organizations').select('id, name').eq('id', 'e0000000-0000-0000-0000-000000000001').maybeSingle();
  results['vilo_org'] = vilo
    ? { status: 'ok', detail: `${vilo.name} (${vilo.id})` }
    : { status: 'error', detail: 'Vilo Research Group not seeded. Run migration 072.' };

  // 3. Pipeline checks
  const pipeline = [
    { name: 'people_table', table: 'people' },
    { name: 'passport_pipeline', table: 'passport_entries' },
    { name: 'public_access', table: 'passport_shares' },
  ];
  for (const check of pipeline) {
    try {
      const { count } = await supabase.from(check.table as any).select('*', { count: 'exact', head: true });
      results[check.name] = { status: 'ok', detail: `${count ?? 0} rows` };
    } catch (e: any) {
      results[check.name] = { status: 'error', detail: e?.message ?? 'Unknown' };
    }
  }

  const errors = Object.values(results).filter(r => r.status === 'error').length;
  const ok = Object.values(results).filter(r => r.status === 'ok').length;
  const overallStatus = errors === 0 ? 'healthy' : errors >= 3 ? 'degraded' : 'partial';

  return Response.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    tables: Object.keys(results).length,
    healthy: ok,
    errors,
    details: results,
  });
};
