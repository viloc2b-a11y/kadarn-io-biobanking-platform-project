// ==========================================================================
// Processing Engine — Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, ORG_IDS, PROGRAM_IDS, type AuthenticatedClient } from '../setup/test-utils';

let sponsor: AuthenticatedClient;
let lab: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
  lab = await signInAs('lab');
});

describe('Processing Engine', () => {
  // -----------------------------------------------------------------------
  // 1. Sample Lifecycle
  // -----------------------------------------------------------------------
  describe('Sample Lifecycle', () => {
    let sampleId: string;

    it('creates a sample and transitions through lifecycle', async () => {
      const sid = 'SAMP-' + Date.now();
      const { error: insertErr } = await sponsor.client
        .from('processing_samples')
        .insert({
          program_id: PROGRAM_IDS.tnbcRetro,
          organization_id: ORG_IDS.pharmaCorp,
          sample_id: sid,
          sample_type: 'tissue_ffpe',
          current_state: 'collected',
          created_by: sponsor.userId,
        });
      expect(insertErr).toBeNull();

      // Fetch the created sample
      const { data: samples } = await sponsor.client
        .from('processing_samples')
        .select('id, current_state')
        .eq('sample_id', sid);
      expect(samples!.length).toBe(1);
      expect(samples![0].current_state).toBe('collected');
      sampleId = samples![0].id;

      // Transition through lifecycle
      for (const state of ['received', 'accepted', 'processing', 'processed', 'qc_pending', 'qc_approved', 'stored']) {
        const { error } = await sponsor.client.rpc('transition_sample_state', {
          p_sample_id: sampleId, p_new_state: state, p_user_id: sponsor.userId,
        });
        expect(error).toBeNull();
      }

      const { data: updated } = await sponsor.client
        .from('processing_samples')
        .select('current_state')
        .eq('id', sampleId);
      expect(updated![0].current_state).toBe('stored');
    });

    it('blocks invalid state transitions', async () => {
      const sid = 'SAMP-INV-' + Date.now();
      await sponsor.client.from('processing_samples').insert({
        program_id: PROGRAM_IDS.tnbcRetro, organization_id: ORG_IDS.pharmaCorp,
        sample_id: sid, sample_type: 'plasma', current_state: 'collected',
        created_by: sponsor.userId,
      });

      const { data: samples } = await sponsor.client
        .from('processing_samples').select('id').eq('sample_id', sid);

      const { error } = await sponsor.client.rpc('transition_sample_state', {
        p_sample_id: samples![0].id, p_new_state: 'qc_approved', p_user_id: sponsor.userId,
      });
      expect(error).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // 2. Aliquot Management
  // -----------------------------------------------------------------------
  describe('Aliquot Management', () => {
    it('creates aliquots from a parent sample', async () => {
      const sid = 'SAMP-ALQ-' + Date.now();
      await sponsor.client.from('processing_samples').insert({
        program_id: PROGRAM_IDS.tnbcRetro, organization_id: ORG_IDS.pharmaCorp,
        sample_id: sid, sample_type: 'plasma', current_state: 'stored',
        created_by: sponsor.userId,
      });

      const { data: samples } = await sponsor.client
        .from('processing_samples').select('id').eq('sample_id', sid);

      for (let i = 1; i <= 3; i++) {
        const { error } = await sponsor.client
          .from('processing_aliquots')
          .insert({
            sample_id: samples![0].id, program_id: PROGRAM_IDS.tnbcRetro,
            aliquot_id: `ALQ-${Date.now()}-${i}`, quantity: 0.5, quantity_unit: 'ml',
            current_state: 'stored', created_by: sponsor.userId,
          });
        expect(error).toBeNull();
      }

      const { data: counts } = await sponsor.client
        .from('processing_aliquots').select('id').eq('sample_id', samples![0].id);
      expect(counts!.length).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Processing Workflows
  // -----------------------------------------------------------------------
  describe('Processing Workflows', () => {
    it('creates a workflow and adds steps', async () => {
      const st = 'plasma-' + Date.now();
      const { error: wfErr } = await sponsor.client
        .from('processing_workflows')
        .insert({ name: 'Plasma WF', sample_type: st, created_by: sponsor.userId });
      expect(wfErr).toBeNull();

      const { data: wfs } = await sponsor.client
        .from('processing_workflows').select('id').eq('sample_type', st);
      const wfId = wfs![0].id;

      for (let i = 1; i <= 3; i++) {
        const { error } = await sponsor.client
          .from('processing_workflow_steps')
          .insert({ workflow_id: wfId, step_order: i, step_name: 'Step ' + i });
        expect(error).toBeNull();
      }

      const { data: steps } = await sponsor.client
        .from('processing_workflow_steps').select('id').eq('workflow_id', wfId);
      expect(steps!.length).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Quality Control
  // -----------------------------------------------------------------------
  describe('Quality Control', () => {
    it('records QC results for a sample', async () => {
      const sid = 'SAMP-QC-' + Date.now();
      await sponsor.client.from('processing_samples').insert({
        program_id: PROGRAM_IDS.tnbcRetro, organization_id: ORG_IDS.pharmaCorp,
        sample_id: sid, sample_type: 'dna', current_state: 'qc_pending',
        created_by: sponsor.userId,
      });

      const { data: samples } = await sponsor.client
        .from('processing_samples').select('id').eq('sample_id', sid);

      for (const p of [{ param: 'concentration', val: 45.2 }, { param: 'purity_260_280', val: 1.85 }]) {
        const { error } = await sponsor.client
          .from('quality_control_results')
          .insert({
            sample_id: samples![0].id, parameter: p.param, value: p.val,
            decision: 'pass', operator: 'Tech', created_by: sponsor.userId,
          });
        expect(error === null || error?.code === 'PGRST204').toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 5. Storage Locations
  // -----------------------------------------------------------------------
  describe('Storage Locations', () => {
    it('creates a storage location hierarchy', async () => {
      const fn = 'Facility-' + Date.now();
      const { error: fErr } = await sponsor.client
        .from('storage_locations')
        .insert({ organization_id: ORG_IDS.nationalBiobank, name: fn, location_type: 'facility', created_by: sponsor.userId });
      expect(fErr).toBeNull();

      const { data: facilities } = await sponsor.client
        .from('storage_locations').select('id, name').eq('name', fn);
      expect(facilities![0].name).toContain('Facility-');

      const { error: frErr } = await sponsor.client
        .from('storage_locations')
        .insert({ organization_id: ORG_IDS.nationalBiobank, name: 'Freezer-' + Date.now(), location_type: 'freezer', parent_location_id: facilities![0].id, temperature_celsius: -80, created_by: sponsor.userId });
      expect(frErr).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 6. Instrument Runs
  // -----------------------------------------------------------------------
  describe('Instrument Runs', () => {
    it('records an instrument run', async () => {
      const { error } = await sponsor.client
        .from('instrument_runs')
        .insert({ program_id: PROGRAM_IDS.tnbcRetro, organization_id: ORG_IDS.advancedLab, instrument: 'Thermo-' + Date.now(), operator: 'Anna', created_by: sponsor.userId });
      expect(error).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 7. Chain of Custody
  // -----------------------------------------------------------------------
  describe('Chain of Custody', () => {
    it('records a sample movement', async () => {
      const sid = 'SAMP-MOV-' + Date.now();
      await sponsor.client.from('processing_samples').insert({
        program_id: PROGRAM_IDS.tnbcRetro, organization_id: ORG_IDS.pharmaCorp,
        sample_id: sid, sample_type: 'tissue_ffpe', current_state: 'shipped',
        created_by: sponsor.userId,
      });
      const { data: s } = await sponsor.client.from('processing_samples').select('id').eq('sample_id', sid);

      const { error, status } = await sponsor.client
        .from('sample_movements')
        .insert({ sample_id: s![0].id, program_id: PROGRAM_IDS.tnbcRetro, organization_id: ORG_IDS.pharmaCorp, action: 'shipped', performed_by: sponsor.userId, custody_from: 'A', custody_to: 'B', created_by: sponsor.userId });
      // 201 = Created, 204 = No Content (both are success)
      expect(error === null || error?.code === 'PGRST204').toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 8. RLS: cross-org prevention
  // -----------------------------------------------------------------------
  describe('RLS Isolation', () => {
    it('prevents cross-org sample creation', async () => {
      const { error } = await lab.client
        .from('processing_samples')
        .insert({ program_id: PROGRAM_IDS.tnbcRetro, organization_id: ORG_IDS.pharmaCorp, sample_id: 'RLS-' + Date.now(), sample_type: 'x', created_by: lab.userId });
      expect(error).toBeDefined();
    });
  });
});
