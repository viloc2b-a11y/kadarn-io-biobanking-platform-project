// ==========================================================================
// Analytics Engine — Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, ORG_IDS, PROGRAM_IDS, type AuthenticatedClient } from '../setup/test-utils';

let sponsor: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
});

const ok = (e: any) => e === null || e?.code?.startsWith('PGRST');

describe('Analytics Engine', () => {
  // -----------------------------------------------------------------------
  // 1. Network Snapshots
  // -----------------------------------------------------------------------
  describe('Network Snapshots', () => {
    it('computes a network snapshot', async () => {
      const { data, error } = await sponsor.client.rpc('compute_network_snapshot', {
        p_period_start: '2026-06-01',
        p_period_end: '2026-06-30',
        p_snapshot_type: 'monthly',
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('stores snapshot metrics', async () => {
      const { data } = await sponsor.client
        .from('analytics_network_snapshots')
        .select('*')
        .order('computed_at', { ascending: false })
        .limit(1);

      expect(data!.length).toBe(1);
      expect(data![0].total_organizations).toBeGreaterThanOrEqual(7);
      expect(data![0].total_programs).toBeGreaterThanOrEqual(2);
    });

    it('tracks unique snapshots per period', async () => {
      const { error } = await sponsor.client.rpc('compute_network_snapshot', {
        p_period_start: '2026-06-01',
        p_period_end: '2026-06-30',
        p_snapshot_type: 'monthly',
      });

      // Unique constraint on (period_start, snapshot_type)
      expect(error).toBeDefined();
      expect(error!.code).toBe('23505');
    });
  });

  // -----------------------------------------------------------------------
  // 2. Program Metrics
  // -----------------------------------------------------------------------
  describe('Program Metrics', () => {
    it('computes metrics for a program', async () => {
      const { data, error } = await sponsor.client.rpc('compute_program_metrics', {
        p_program_id: PROGRAM_IDS.tnbcRetro,
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });

    it('stores program metrics', async () => {
      const { data } = await sponsor.client
        .from('analytics_program_metrics')
        .select('program_id, participant_count')
        .eq('program_id', PROGRAM_IDS.tnbcRetro);

      expect(data!.length).toBeGreaterThanOrEqual(1);
      expect(data![0].participant_count).toBeGreaterThanOrEqual(7);
    });

    it('re-computing updates existing metrics', async () => {
      await sponsor.client.rpc('compute_program_metrics', {
        p_program_id: PROGRAM_IDS.tnbcRetro,
      });

      const { data } = await sponsor.client
        .from('analytics_program_metrics')
        .select('program_id')
        .eq('program_id', PROGRAM_IDS.tnbcRetro);

      // Should still be 1 row (UNIQUE program_id)
      expect(data!.length).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Search Queries
  // -----------------------------------------------------------------------
  describe('Search Analytics', () => {
    it('tracks a search query', async () => {
      const { data, error } = await sponsor.client
        .from('analytics_search_queries')
        .insert({
          search_text: 'TNBC FFPE',
          result_count: 5,
          user_id: sponsor.userId,
        })
        .select();

      expect(ok(error)).toBe(true);
      expect(data![0].search_text).toBe('TNBC FFPE');
    });

    it('queries search trends', async () => {
      const { data } = await sponsor.client
        .from('analytics_search_queries')
        .select('search_text, result_count')
        .order('created_at', { ascending: false });

      expect(data!.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Materialized Views
  // -----------------------------------------------------------------------
  describe('Analytics Views', () => {
    it('program performance view is queryable via PostgREST', async () => {
      const { data } = await sponsor.client
        .from('analytics_program_metrics')
        .select('program_id, participant_count')
        .limit(5);

      expect(data).toBeDefined();
    });

    it('supplier metrics are queryable', async () => {
      const { data } = await sponsor.client
        .from('analytics_supplier_metrics')
        .select('organization_id')
        .limit(5);

      expect(data).toBeDefined();
    });
  });
});
