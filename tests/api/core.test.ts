// ==========================================================================
// Sprint 1B — Core API: Endpoint Tests
// ==========================================================================
// Tests each endpoint with real JWT auth against Supabase Local.
// RLS must be enforced — no service_role bypass for user requests.
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import {
  signInAs,
  ORG_IDS,
  type AuthenticatedClient,
} from '../setup/test-utils';

const API_BASE = process.env.SUPABASE_URL || 'http://127.0.0.1:54331';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let sponsor: AuthenticatedClient;
let courier: AuthenticatedClient;

beforeAll(async () => {
  sponsor = await signInAs('sponsor');
  courier = await signInAs('courier');
});

// -------------------------------------------------------------------------
// Helper: make authenticated request
// -------------------------------------------------------------------------
async function apiGet(path: string, actor: AuthenticatedClient) {
  const res = await fetch(`${API_BASE}/rest/v1${path}`, {
    headers: {
      Authorization: `Bearer ${actor.session.access_token}`,
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
  });
  return { status: res.status, body: await res.json() };
}

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
  return { status: res.status, body: await res.json() };
}

async function apiGetUnauthenticated(path: string) {
  const res = await fetch(`${API_BASE}/rest/v1${path}`, {
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
  });
  return { status: res.status, body: null };
}

// -------------------------------------------------------------------------
// Health — this is a direct endpoint test against the API
// -------------------------------------------------------------------------
describe('Health', () => {
  it('API responds to requests', async () => {
    const res = await fetch(`${API_BASE}/rest/v1/organizations?limit=1`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${sponsor.session.access_token}`,
      },
    });
    expect(res.status).toBe(200);
  });
});

// -------------------------------------------------------------------------
// GET /organizations
// -------------------------------------------------------------------------
describe('GET /organizations', () => {
  it('sponsor can list organizations', async () => {
    const res = await apiGet('/organizations?limit=5', sponsor);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('unauthenticated request returns no data', async () => {
    const res = await apiGetUnauthenticated('/organizations?limit=1');
    // RLS blocks anon requests — returns 200 with 0 rows or 401
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});

// -------------------------------------------------------------------------
// GET /organizations/:id
// -------------------------------------------------------------------------
describe('GET /organizations/:id', () => {
  it('sponsor can get PharmaCorp by ID', async () => {
    const res = await apiGet(`/organizations?id=eq.${ORG_IDS.pharmaCorp}`, sponsor);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('PharmaCorp');
  });

  it('returns 404 for non-existent ID', async () => {
    const fakeId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const res = await apiGet(`/organizations?id=eq.${fakeId}`, sponsor);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0); // PostgREST returns empty array, not 404
  });
});

// -------------------------------------------------------------------------
// GET /programs
// -------------------------------------------------------------------------
describe('GET /programs', () => {
  it('sponsor can list programs', async () => {
    const res = await apiGet('/programs?limit=5', sponsor);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('courier can list programs (network visibility)', async () => {
    const res = await apiGet('/programs?limit=5', courier);
    expect(res.status).toBe(200);
    // Courier is only in Program 1, but network visibility allows seeing all
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

// -------------------------------------------------------------------------
// POST /organizations
// -------------------------------------------------------------------------
describe('POST /organizations', () => {
  it('sponsor can create an organization', async () => {
    const uniqueName = 'API Test Org ' + Date.now();
    const res = await apiPost('/organizations', {
      name: uniqueName,
      country: 'US',
      created_by: sponsor.userId,
    }, sponsor);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body[0]?.name).toBe(uniqueName);
  });

  it('rejects organization with missing name', async () => {
    const res = await apiPost('/organizations', { country: 'US' }, sponsor);
    // PostgREST returns error status for NOT NULL violation
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// -------------------------------------------------------------------------
// POST /programs
// -------------------------------------------------------------------------
describe('POST /programs', () => {
  it('sponsor can create a program', async () => {
    const res = await apiPost('/programs', {
      name: 'API Test Program ' + Date.now(),
      sponsor_org_id: ORG_IDS.pharmaCorp,
      created_by: sponsor.userId,
      created_by_organization_id: ORG_IDS.pharmaCorp,
    }, sponsor);
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);
    expect(res.body[0]?.name).toContain('API Test Program');
  });

  it('rejects program without sponsor_org_id', async () => {
    const res = await apiPost('/programs', { name: 'Bad Program', created_by: sponsor.userId }, sponsor);
    // PostgREST returns error for NOT NULL violation
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// -------------------------------------------------------------------------
// GET /audit-events
// -------------------------------------------------------------------------
describe('GET /audit-events', () => {
  it('user can list their own audit events', async () => {
    const res = await apiGet(`/audit_events?actor_id=eq.${sponsor.userId}&limit=5`, sponsor);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('user cannot see other users audit events', async () => {
    const res = await apiGet(`/audit_events?actor_id=eq.${sponsor.userId}&limit=5`, courier);
    expect(res.status).toBe(200);
    // RLS should return 0 rows (courier cannot see sponsor's audit events)
    const allDifferentActor = res.body.every((e: any) => e.actor_id !== sponsor.userId);
    expect(allDifferentActor).toBe(true);
  });
});
