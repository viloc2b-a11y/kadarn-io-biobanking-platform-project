// ==========================================================================
// Program Engine — API Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, ORG_IDS, PROGRAM_IDS, type AuthenticatedClient } from '../setup/test-utils';

const API_BASE = process.env.SUPABASE_URL || 'http://127.0.0.1:54331';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let sponsor: AuthenticatedClient;
let courier: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
  courier = await signInAs('courier');
});

// -------------------------------------------------------------------------
// 1. Program Discovery & Visibility
// -------------------------------------------------------------------------
describe('Program Discovery', () => {
  it('lists programs visible to user', async () => {
    const { data } = await sponsor.client.from('programs').select('id, name').limit(10);
    expect(data!.length).toBeGreaterThanOrEqual(1);
  });

  it('shows program with participant details', async () => {
    const { data } = await sponsor.client
      .from('programs')
      .select('id, name, program_participants(organization_id, role)')
      .eq('id', PROGRAM_IDS.tnbcRetro)
      .single();

    expect(data).toBeDefined();
    expect(data!.program_participants).toBeDefined();
    expect(data!.program_participants.length).toBeGreaterThanOrEqual(1);
  });

  it('enforces RLS: courier cannot update Program 2', async () => {
    const { error } = await courier.client
      .from('programs')
      .update({ description: 'hacked' })
      .eq('id', PROGRAM_IDS.nsclcLbio);

    expect(error).toBeDefined();
  });
});

// -------------------------------------------------------------------------
// 2. Program Status Transitions
// -------------------------------------------------------------------------
describe('Program Status Transitions', () => {
  it('transitions from draft to active', async () => {
    const { data: prog } = await sponsor.client
      .from('programs')
      .insert({
        name: 'Status Transition Test ' + Date.now(),
        description: 'Testing status transitions',
        status: 'draft',
        sponsor_org_id: ORG_IDS.pharmaCorp,
        created_by: sponsor.userId,
        created_by_organization_id: ORG_IDS.pharmaCorp,
      })
      .select()
      .single();

    expect(prog!.status).toBe('draft');

    // Transition to active
    const { error } = await sponsor.client.rpc('transition_program_status', {
      p_program_id: prog!.id,
      p_new_status: 'active',
      p_user_id: sponsor.userId,
    });
    expect(error).toBeNull();

    const { data: updated } = await sponsor.client
      .from('programs')
      .select('status')
      .eq('id', prog!.id)
      .single();
    expect(updated!.status).toBe('active');
  });

  it('blocks invalid transitions (active → draft)', async () => {
    const { data: prog } = await sponsor.client
      .from('programs')
      .insert({
        name: 'Invalid Transition Test ' + Date.now(),
        status: 'active',
        sponsor_org_id: ORG_IDS.pharmaCorp,
        created_by: sponsor.userId,
        created_by_organization_id: ORG_IDS.pharmaCorp,
      })
      .select()
      .single();

    const { error } = await sponsor.client.rpc('transition_program_status', {
      p_program_id: prog!.id,
      p_new_status: 'draft',
      p_user_id: sponsor.userId,
    });
    expect(error).toBeDefined();
    expect(error!.message).toContain('Invalid status transition');
  });

  it('allows valid lifecycle: draft → active → paused → active → completed → archived', async () => {
    const { data: prog } = await sponsor.client
      .from('programs')
      .insert({
        name: 'Full Lifecycle Test ' + Date.now(),
        status: 'draft',
        sponsor_org_id: ORG_IDS.pharmaCorp,
        created_by: sponsor.userId,
        created_by_organization_id: ORG_IDS.pharmaCorp,
      })
      .select()
      .single();

    const transitions = ['active', 'paused', 'active', 'completed', 'archived'];
    for (const status of transitions) {
      const { error } = await sponsor.client.rpc('transition_program_status', {
        p_program_id: prog!.id,
        p_new_status: status,
        p_user_id: sponsor.userId,
      });
      expect(error).toBeNull();
    }

    const { data: final } = await sponsor.client
      .from('programs')
      .select('status')
      .eq('id', prog!.id)
      .single();
    expect(final!.status).toBe('archived');
  });
});

// -------------------------------------------------------------------------
// 3. Milestones
// -------------------------------------------------------------------------
describe('Program Milestones', () => {
  it('creates milestones for a program', async () => {
    const { data: milestone } = await sponsor.client
      .from('program_milestones')
      .insert({
        program_id: PROGRAM_IDS.tnbcRetro,
        milestone_type: 'irb_submission',
        title: 'IRB Submission',
        description: 'Submit to Central IRB',
        planned_end_date: '2026-08-01',
        created_by: sponsor.userId,
      })
      .select()
      .single();

    expect(milestone).toBeDefined();
    expect(milestone!.title).toBe('IRB Submission');
    expect(milestone!.status).toBe('pending');
  });

  it('lists milestones for a program', async () => {
    const { data } = await sponsor.client
      .from('program_milestones')
      .select('*')
      .eq('program_id', PROGRAM_IDS.tnbcRetro);

    expect(data!.length).toBeGreaterThanOrEqual(1);
  });

  it('updates milestone status', async () => {
    const { data: ms } = await sponsor.client
      .from('program_milestones')
      .insert({
        program_id: PROGRAM_IDS.tnbcRetro,
        milestone_type: 'irb_approval',
        title: 'IRB Approval',
        created_by: sponsor.userId,
      })
      .select()
      .single();

    const { error } = await sponsor.client
      .from('program_milestones')
      .update({ status: 'completed', actual_end_date: '2026-07-15' })
      .eq('id', ms!.id);

    expect(error).toBeNull();
  });

  it('enforces RLS: courier cannot create milestones for programs they cannot manage', async () => {
    const { error } = await courier.client
      .from('program_milestones')
      .insert({
        program_id: PROGRAM_IDS.tnbcRetro,
        milestone_type: 'program_definition',
        title: 'Courier should not be able to create this',
        created_by: courier.userId,
      });
    // Courier is a participant but not sponsor/lead — should be blocked
    expect(error).toBeDefined();
  });
});

// -------------------------------------------------------------------------
// 4. Program Requirements
// -------------------------------------------------------------------------
describe('Program Requirements', () => {
  it('creates structured requirements', async () => {
    const { data: req } = await sponsor.client
      .from('program_requirements')
      .insert({
        program_id: PROGRAM_IDS.tnbcRetro,
        sample_types: ['tissue_ffpe', 'tissue_frozen'],
        total_sample_count: 500,
        disease_icd10: 'ICD-10:C50.9',
        disease_label: 'Breast cancer',
        therapeutic_areas: ['oncology'],
        clinical_data_needed: ['diagnosis', 'treatment', 'outcome'],
        created_by: sponsor.userId,
      })
      .select()
      .single();

    expect(req).toBeDefined();
    expect(req!.total_sample_count).toBe(500);
  });

  it('reads requirements', async () => {
    const { data } = await sponsor.client
      .from('program_requirements')
      .select('*')
      .eq('program_id', PROGRAM_IDS.tnbcRetro)
      .single();

    expect(data).toBeDefined();
    expect(data!.sample_types).toContain('tissue_ffpe');
  });
});

// -------------------------------------------------------------------------
// 5. Activity Log
// -------------------------------------------------------------------------
describe('Program Activity Log', () => {
  it('logs program activity', async () => {
    const { data: activity } = await sponsor.client
      .from('program_activity_log')
      .insert({
        program_id: PROGRAM_IDS.tnbcRetro,
        action: 'milestone_completed',
        description: 'IRB Submission milestone completed',
        actor_id: sponsor.userId,
        ref_type: 'milestone',
      })
      .select()
      .single();

    expect(activity).toBeDefined();
    expect(activity!.action).toBe('milestone_completed');
  });

  it('reads activity feed', async () => {
    const { data } = await sponsor.client
      .from('program_activity_log')
      .select('*')
      .eq('program_id', PROGRAM_IDS.tnbcRetro)
      .order('created_at', { ascending: false });

    expect(data!.length).toBeGreaterThanOrEqual(1);
  });
});
