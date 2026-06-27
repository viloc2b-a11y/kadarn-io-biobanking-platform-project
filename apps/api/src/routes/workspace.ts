// Workspace routes — capability-driven per-org application endpoints
import { Router } from 'express';
import { ok, asyncHandler } from '../lib/engine-bridge.js';

const router = Router();

// GET /api/v1/workspace/profile — current org's profile + capabilities
router.get('/profile', asyncHandler(async (req, res) => {
  const orgId = (req as any).organizationId;
  ok(res, {
    organizationId: orgId,
    name: 'University Biorepository',
    capabilities: ['biobank', 'processing_lab', 'storage_facility'],
    trustScore: 0.92,
    applications: ['inventory', 'collections', 'qc', 'processing', 'exchange', 'analytics'],
  });
}));

// GET /api/v1/workspace/applications — enabled apps for current org
router.get('/applications', asyncHandler(async (req, res) => {
  ok(res, { applications: [
    { id: 'inventory', name: 'Inventory', enabled: true, url: '/workspace/inventory' },
    { id: 'collections', name: 'Collections', enabled: true, url: '/workspace/collections' },
    { id: 'qc', name: 'Quality Control', enabled: true, url: '/workspace/qc' },
    { id: 'processing', name: 'Processing', enabled: true, url: '/workspace/processing' },
    { id: 'exchange', name: 'Exchange', enabled: true, url: '/workspace/exchange' },
    { id: 'analytics', name: 'Analytics', enabled: true, url: '/workspace/analytics' },
  ]});
}));

// GET /api/v1/workspace/inventory — specimens owned by this org
router.get('/inventory', asyncHandler(async (req, res) => {
  ok(res, { specimens: [
    { id: 'spec-001', type: 'FFPE', status: 'stored', location: 'Freezer-3', quantity: 200 },
    { id: 'spec-002', type: 'Whole Blood', status: 'collected', location: 'Fridge-1', quantity: 10 },
  ], total: 2 });
}));

// GET /api/v1/workspace/exchange — transactions for this org
router.get('/exchange', asyncHandler(async (req, res) => {
  ok(res, { transactions: [
    { id: 'tx-001', type: 'MTA', status: 'completed', counterparty: 'Sponsor A', value: 15000 },
    { id: 'tx-002', type: 'Fulfillment', status: 'in_progress', counterparty: 'Lab B', value: 8200 },
  ]});
}));

export default router;
