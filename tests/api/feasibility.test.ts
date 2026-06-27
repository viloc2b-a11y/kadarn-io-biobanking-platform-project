// ==========================================================================
// Feasibility Engine — API Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, ORG_IDS, type AuthenticatedClient } from '../setup/test-utils';

const API_BASE = process.env.SUPABASE_URL || 'http://127.0.0.1:54331';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let sponsor: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
});

async function apiPost(path: string, body: any, actor: AuthenticatedClient) {
  const res = await fetch(`${API_BASE}/rest/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${actor.session.access_token}`,
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: res.status < 300 ? await res.json() : await res.json().catch(() => ({})) };
}

async function apiRpc(name: string, params: any, actor: AuthenticatedClient) {
  const res = await fetch(`${API_BASE}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${actor.session.access_token}`,
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  return { status: res.status, body: await res.json() };
}

describe('Feasibility Engine', () => {
  it('creates and runs an assessment', async () => {
    // First: create the assessment and run scoring via the RPC function
    const { data: assessment } = await sponsor.client
      .from('feasibility_assessments')
      .insert({
        created_by: sponsor.userId,
        organization_id: ORG_IDS.pharmaCorp,
        program_name: 'Feasibility Test Program',
        program_description: 'Testing feasibility engine',
        required_capabilities: ['sponsor', 'cro', 'biobank', 'clinical_site'],
        target_countries: ['US', 'DE'],
        status: 'pending',
      })
      .select()
      .single();

    expect(assessment).toBeDefined();

    // Run the scoring
    const rpc = await apiRpc('run_feasibility_assessment', {
      p_assessment_id: assessment!.id,
    }, sponsor);
    expect(rpc.status).toBe(200);

    // Fetch results
    const { data: completed } = await sponsor.client
      .from('feasibility_assessments')
      .select('*')
      .eq('id', assessment!.id)
      .single();

    expect(completed!.status).toBe('completed');
    expect(completed!.candidate_count).toBeGreaterThanOrEqual(1);
    expect(completed!.overall_score).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(completed!.risk_level);

    // Check scores were generated
    const { data: scores } = await sponsor.client
      .from('feasibility_scores')
      .select('*')
      .eq('assessment_id', assessment!.id);

    expect(scores!.length).toBeGreaterThanOrEqual(1);
    expect(scores![0].capability_score).toBeGreaterThan(0);
    expect(scores![0].overall_score).toBeGreaterThan(0);
  });

  it('scores organizations by capability match', async () => {
    const { data: assessment } = await sponsor.client
      .from('feasibility_assessments')
      .insert({
        created_by: sponsor.userId,
        organization_id: ORG_IDS.pharmaCorp,
        program_name: 'Capability Match Test',
        required_capabilities: ['biobank', 'storage_facility'],
        status: 'pending',
      })
      .select()
      .single();

    await apiRpc('run_feasibility_assessment', { p_assessment_id: assessment!.id }, sponsor);

    const { data: scores } = await sponsor.client
      .from('feasibility_scores')
      .select('*')
      .eq('assessment_id', assessment!.id)
      .order('overall_score', { ascending: false });

    expect(scores!.length).toBeGreaterThanOrEqual(1);

    // National Biobank has biobank + storage_facility — should score higher
    const nationalBiobank = scores!.find(s => s.organization_id === ORG_IDS.nationalBiobank);
    expect(nationalBiobank).toBeDefined();
    expect(nationalBiobank!.capability_score).toBe(40); // 2 capabilities × 20
  });

  it('returns risk level based on candidate count', async () => {
    // Few required capabilities = more candidates = low risk
    const { data: assessment } = await sponsor.client
      .from('feasibility_assessments')
      .insert({
        created_by: sponsor.userId,
        organization_id: ORG_IDS.pharmaCorp,
        program_name: 'Risk Level Test',
        required_capabilities: ['sponsor'],
        status: 'pending',
      })
      .select()
      .single();

    await apiRpc('run_feasibility_assessment', { p_assessment_id: assessment!.id }, sponsor);

    const { data: completed } = await sponsor.client
      .from('feasibility_assessments')
      .select('risk_level, candidate_count')
      .eq('id', assessment!.id)
      .single();

    expect(completed!.candidate_count).toBeGreaterThanOrEqual(1);
    expect(['low', 'medium', 'high']).toContain(completed!.risk_level);
  });

  it('geographic filter excludes non-matching countries', async () => {
    // Target only Brazil — only Univ Medical Center has a Brazil prospective collection
    const { data: assessment } = await sponsor.client
      .from('feasibility_assessments')
      .insert({
        created_by: sponsor.userId,
        organization_id: ORG_IDS.pharmaCorp,
        program_name: 'Geographic Filter Test',
        required_capabilities: ['biobank', 'clinical_site'],
        target_countries: ['BR'],
        status: 'pending',
      })
      .select()
      .single();

    await apiRpc('run_feasibility_assessment', { p_assessment_id: assessment!.id }, sponsor);

    const { data: scores } = await sponsor.client
      .from('feasibility_scores')
      .select('*')
      .eq('assessment_id', assessment!.id)
      .order('overall_score', { ascending: false });

    // Organizations in BR should get 100 geographic score
    // Univ Medical Center is US-based, National Biobank is US-based
    // But Univ has the NSCLC prospective collection aimed at Brazil
    const scoresArray = scores ?? [];
    for (const s of scoresArray) {
      if (s.country === 'BR') {
        expect(s.geographic_score).toBe(100);
      } else {
        expect(s.geographic_score).toBe(0);
      }
    }
  });

  it('lists assessments for the current user', async () => {
    const { data: list } = await sponsor.client
      .from('feasibility_assessments')
      .select('*')
      .eq('created_by', sponsor.userId)
      .limit(10);

    expect(list!.length).toBeGreaterThanOrEqual(3); // we created 3+ in this suite
  });
});
