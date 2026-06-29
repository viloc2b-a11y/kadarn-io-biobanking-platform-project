// ==========================================================================
// Discovery Engine — API Tests
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { signInAs, type AuthenticatedClient } from '../setup/test-utils';

const API_BASE = process.env.SUPABASE_URL || 'http://127.0.0.1:54331';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

let sponsor: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
});

async function discoverySearch(params: Record<string, any>, actor: AuthenticatedClient) {
  const res = await fetch(`${API_BASE}/rest/v1/rpc/discovery_search`, {
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

describe('Discovery Engine', () => {
  it('search returns supply items', async () => {
    const res = await discoverySearch({ p_limit: 5 }, sponsor);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].title).toBeDefined();
  });

  it('search by text finds matching items', async () => {
    const res = await discoverySearch({ p_search_text: 'TNBC', p_limit: 5 }, sponsor);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].title).toContain('TNBC');
  });

  it('search by disease code filters correctly', async () => {
    const res = await discoverySearch({ p_disease_icd10: 'ICD-10:C50.9', p_limit: 5 }, sponsor);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((r: any) => r.disease_icd10 === 'ICD-10:C50.9')).toBe(true);
  });

  it('search by type filters correctly', async () => {
    const res = await discoverySearch({ p_types: ['laboratory_service'], p_limit: 5 }, sponsor);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((r: any) => r.type === 'laboratory_service')).toBe(true);
  });

  it('search by country filters correctly', async () => {
    const res = await discoverySearch({ p_country: 'DE', p_limit: 5 }, sponsor);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.every((r: any) => r.country === 'DE')).toBe(true);
  });

  it('search returns total_count in results', async () => {
    const res = await discoverySearch({ p_limit: 20 }, sponsor);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].total_count).toBeGreaterThanOrEqual(res.body.length);
  });

  it('search with no matches returns empty array', async () => {
    const res = await discoverySearch({ p_search_text: 'zzzznonexistent', p_limit: 5 }, sponsor);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  it('pagination works correctly', async () => {
    const res1 = await discoverySearch({ p_limit: 2, p_offset: 0 }, sponsor);
    expect(res1.status).toBe(200);
    expect(res1.body.length).toBeLessThanOrEqual(2);

    const res2 = await discoverySearch({ p_limit: 2, p_offset: 2 }, sponsor);
    expect(res2.status).toBe(200);
    if (res1.body.length > 0 && res2.body.length > 0) {
      expect(res2.body[0].id).not.toBe(res1.body[0].id);
    }
  });
});
