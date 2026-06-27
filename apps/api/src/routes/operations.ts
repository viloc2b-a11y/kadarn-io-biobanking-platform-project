// Operations Center routes — KOC dashboards
import { Router } from 'express';
import { ok, asyncHandler } from '../lib/engine-bridge.js';
import { getTrustService } from '../lib/trust-service.js';
import type { MemoryTrustAdapter } from '../adapters/memory-trust-adapter.js';

const router = Router();

// GET /api/v1/operations/health — network health overview
router.get('/health', asyncHandler(async (req, res) => {
  ok(res, {
    activeOrganizations: 24,
    activePrograms: 8,
    pendingFulfillments: 12,
    blockedWorkflows: 3,
    totalSpecimens: 15420,
    shipmentsInTransit: 7,
    networkTrustAverage: 0.84,
  });
}));

// GET /api/v1/operations/trust — trust scores across orgs (computed via Trust EngineService)
router.get('/trust', asyncHandler(async (req, res) => {
  const service = getTrustService();
  const adapter = (service as any).adapter as MemoryTrustAdapter;

  // Lazy seed: on first call, record sample events so getScores returns real computed data
  if (!adapter._seeded) {
    const seedEvents = [
      { organizationId: 'org-1', dimension: 'operational' as const, source: 'quality_control', severity: 'high' as const, evidenceRef: 'ev-a1b2c3', description: 'Perfect QC score on 2026-Q2 audit' },
      { organizationId: 'org-1', dimension: 'regulatory' as const, source: 'certification_renewal', severity: 'normal' as const, evidenceRef: 'ev-d4e5f6', description: 'CAP accreditation renewed' },
      { organizationId: 'org-2', dimension: 'operational' as const, source: 'quality_control', severity: 'normal' as const, evidenceRef: 'ev-g7h8i9', description: 'Standard QC pass rate' },
      { organizationId: 'org-2', dimension: 'regulatory' as const, source: 'audit_finding', severity: 'low' as const, evidenceRef: 'ev-j0k1l2', description: 'Minor documentation gap resolved' },
      { organizationId: 'org-3', dimension: 'operational' as const, source: 'quality_control', severity: 'high' as const, evidenceRef: 'ev-m3n4o5', description: 'Zero temperature breaches in Q2' },
      { organizationId: 'org-3', dimension: 'regulatory' as const, source: 'certification_renewal', severity: 'high' as const, evidenceRef: 'ev-p6q7r8', description: 'GDPR compliance audit passed' },
    ];
    for (const ev of seedEvents) {
      await service.recordEvent(ev);
    }
    adapter._seeded = true;
  }

  const orgIds = ['org-1', 'org-2', 'org-3'];
  const orgNames: Record<string, string> = {
    'org-1': 'University Biorepository',
    'org-2': 'Pathology Lab Services',
    'org-3': 'World Courier',
  };

  const organizations = await Promise.all(
    orgIds.map(async (id) => {
      const scores = await service.getScores(id);
      // Determine trend based on aggregate event impact
      const events = await adapter.getTrustEvents(id);
      const recentImpact = events.reduce((sum, e) => sum + (e.impact || 0), 0);
      const trend: 'up' | 'stable' | 'down' = recentImpact > 0.1 ? 'up' : recentImpact < -0.1 ? 'down' : 'stable';

      return {
        id,
        name: orgNames[id],
        overall: scores.overallScore,
        operational: scores.operationalScore,
        regulatory: scores.regulatoryScore,
        financial: scores.financialScore,
        technical: scores.technicalScore,
        trend,
      };
    })
  );

  ok(res, { organizations });
}));

// GET /api/v1/operations/provenance/:id — lineage for an entity
router.get('/provenance/:id', asyncHandler(async (req, res) => {
  ok(res, {
    entityId: req.params.id,
    ancestors: [
      { id: 'consent-1', type: 'consent', label: 'Donor Consent #001', recordedAt: '2026-01-01' },
      { id: 'proc-1', type: 'processing_event', label: 'FFPE Processing', recordedAt: '2026-01-05' },
    ],
    descendants: [
      { id: 'ds-1', type: 'dataset', label: 'Expression Dataset', recordedAt: '2026-02-01' },
    ],
    evidence: [
      { type: 'consent_form', reference: '/docs/consent-1.pdf' },
      { type: 'qc_report', reference: '/docs/qc-1.pdf' },
    ],
  });
}));

// GET /api/v1/operations/exceptions — blocked workflows and disputes
router.get('/exceptions', asyncHandler(async (req, res) => {
  ok(res, { exceptions: [
    { id: 'wf-1', type: 'policy_blocked', workflow: 'Access Request', entity: 'spec-003', reason: 'Consent withdrawn', raisedAt: '2026-06-25T10:00:00Z' },
    { id: 'wf-2', type: 'dispute', workflow: 'Fulfillment', entity: 'sh-001', reason: 'Temperature breach', raisedAt: '2026-06-26T08:30:00Z' },
    { id: 'wf-3', type: 'compliance', workflow: 'Export', entity: 'org-4', reason: 'Missing export permit', raisedAt: '2026-06-26T12:00:00Z' },
  ]});
}));

// GET /api/v1/operations/kpe — Key Platform Entities
router.get('/kpe', asyncHandler(async (req, res) => {
  ok(res, {
    specimens: { total: 15420, collected: 320, shipped: 45, consumed: 120, destroyed: 12 },
    shipments: { total: 89, inTransit: 7, completed: 78, disputed: 4 },
    transactions: { total: 234, active: 18, completed: 210, disputed: 6 },
    collections: { total: 12, active: 8, completed: 4 },
  });
}));

export default router;
