// API integration tests
import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../apps/api/src/app.js';

const request = supertest(app);

describe('API — Marketplace', () => {
  it('GET /api/v1/marketplace/specimens returns results', async () => {
    const res = await request.get('/api/v1/marketplace/specimens').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toBeDefined();
  });

  it('GET /api/v1/marketplace/network returns partners', async () => {
    const res = await request.get('/api/v1/marketplace/network').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBeGreaterThan(0);
  });
});

describe('API — Workspace', () => {
  it('GET /api/v1/workspace/profile returns org capabilities', async () => {
    const res = await request.get('/api/v1/workspace/profile').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(res.body.data.capabilities).toContain('biobank');
    expect(res.body.data.applications).toContain('inventory');
  });
});

describe('API — Operations', () => {
  it('GET /api/v1/operations/health returns metrics', async () => {
    const res = await request.get('/api/v1/operations/health').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(res.body.data.activeOrganizations).toBeGreaterThan(0);
  });

  it('GET /api/v1/operations/trust returns scores', async () => {
    const res = await request.get('/api/v1/operations/trust').set('Authorization', 'Bearer test');
    expect(res.status).toBe(200);
    expect(res.body.data.organizations.length).toBeGreaterThan(0);
  });
});

describe('API — Auth', () => {
  it('returns 401 without token', async () => {
    const res = await request.get('/api/v1/marketplace/specimens');
    expect(res.status).toBe(401);
  });
});
