// ==========================================================================
// Mock data for Delivery Workspace UI (Sprint 9.12B + 9.12C)
// Uses exact types from @kadarn/delivery-domain
// ==========================================================================

import type {
  DeliveryArtifact,
  AuditEntry,
  DeliverySubscription,
  DeliveryTemplate,
  DeliveryChannel,
  QueueEntry,
  DLQEntry,
} from '@kadarn/delivery-domain';

// Branded type helpers — cast raw strings to domain-branded types
function aid(id: string): DeliveryArtifact['id'] { return id as DeliveryArtifact['id']; }
function chash(h: string): DeliveryArtifact['contentHash'] { return h as DeliveryArtifact['contentHash']; }

// ─── Mock DeliveryArtifacts (8) ────────────────────────────────────────────

export const MOCK_ARTIFACTS: DeliveryArtifact[] = [
  {
    id: aid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
    type: 'html',
    contentHash: chash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
    templateId: '11111111-1111-4111-8111-111111111111',
    templateVersion: 1,
    compiledAt: '2026-06-28T14:30:00.000Z',
    status: 'acknowledged',
    metadata: {
      viewId: 'view-001',
      templateName: 'InstitutionPassport',
      classification: 'public',
      institutionName: 'National Biobank',
      capabilities: ['Plasma Collection', 'DNA Extraction', 'Cryopreservation'],
    },
  },
  {
    id: aid('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'),
    type: 'pdf',
    contentHash: chash('a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a'),
    templateId: '22222222-2222-4222-8222-222222222222',
    templateVersion: 1,
    compiledAt: '2026-07-01T09:15:00.000Z',
    status: 'delivered',
    metadata: {
      viewId: 'view-002',
      templateName: 'SponsorReport',
      classification: 'public',
      sponsorName: 'Pfizer Inc.',
      studyId: 'NCT-04567890',
      summary: 'Quarterly performance report for biobank capabilities.',
    },
  },
  {
    id: aid('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'),
    type: 'json',
    contentHash: chash('6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b'),
    templateId: '33333333-3333-4333-8333-333333333333',
    templateVersion: 1,
    compiledAt: '2026-07-02T16:00:00.000Z',
    status: 'queued',
    metadata: {
      viewId: 'view-003',
      templateName: 'EvidencePack',
      classification: 'public',
      studyId: 'NCT-01234567',
      claimCount: 7,
      confidenceLevel: 'HIGH',
    },
  },
  {
    id: aid('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'),
    type: 'zip',
    contentHash: chash('d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35'),
    templateId: '44444444-4444-4444-8444-444444444444',
    templateVersion: 1,
    compiledAt: '2026-07-02T20:30:00.000Z',
    status: 'generated',
    metadata: {
      viewId: 'view-004',
      templateName: 'AuditPack',
      classification: 'confidential',
      auditPeriod: '2026-Q2',
      institutionName: 'National Biobank',
      sections: ['compliance', 'quality', 'training'],
    },
  },
  {
    id: aid('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'),
    type: 'html',
    contentHash: chash('4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce'),
    templateId: '11111111-1111-4111-8111-111111111111',
    templateVersion: 1,
    compiledAt: '2026-06-15T10:00:00.000Z',
    status: 'expired',
    metadata: {
      viewId: 'view-005',
      templateName: 'InstitutionPassport',
      classification: 'public',
      institutionName: 'Regional BioRepository',
      capabilities: ['Serum Storage', 'Histology'],
      expiresAfterHours: 720,
    },
  },
  {
    id: aid('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c'),
    type: 'pdf',
    contentHash: chash('4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'),
    templateId: '22222222-2222-4222-8222-222222222222',
    templateVersion: 2,
    compiledAt: '2026-06-25T14:00:00.000Z',
    status: 'revoked',
    metadata: {
      viewId: 'view-006',
      templateName: 'SponsorReport',
      classification: 'public',
      sponsorName: 'Roche',
      studyId: 'NCT-09999999',
      revocationReason: 'Data quality issues — corrected report pending',
    },
  },
  {
    id: aid('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d'),
    type: 'csv',
    contentHash: chash('ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'),
    templateId: '55555555-5555-4555-8555-555555555555',
    templateVersion: 1,
    compiledAt: '2026-07-01T11:00:00.000Z',
    status: 'delivered',
    metadata: {
      viewId: 'view-007',
      templateName: 'DataExport',
      classification: 'confidential',
      rowCount: 15420,
      columns: ['specimenId', 'collectionDate', 'storageLocation', 'viability'],
      requestedBy: 'sponsor-roche',
    },
  },
  {
    id: aid('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e'),
    type: 'json',
    contentHash: chash('e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb'),
    templateId: '33333333-3333-4333-8333-333333333333',
    templateVersion: 1,
    compiledAt: '2026-07-03T08:00:00.000Z',
    status: 'draft',
    metadata: {
      viewId: 'view-008',
      templateName: 'EvidencePack',
      classification: 'counter-evidence',
      studyId: 'NCT-01111111',
      claimCount: 3,
      confidenceLevel: 'LOW',
    },
  },
];

// ─── Mock Audit Trail (~25 entries) ─────────────────────────────────────────

const AID = MOCK_ARTIFACTS;

export const MOCK_AUDIT_TRAIL: AuditEntry[] = [
  // ── AID[0] (InstitutionPassport) — complete lifecycle ──
  {
    id: 'evt-001', sequenceNumber: 1,
    eventType: 'delivery.requested', artifactId: AID[0].id,
    timestamp: '2026-06-22T09:00:00.000Z', actor: 'admin-1',
    payload: { requestedBy: 'admin-1', viewId: 'view-001' },
    previousHash: null,
    hash: '0000000000000000000000000000000000000000000000000000000000000001',
  },
  {
    id: 'evt-002', sequenceNumber: 2,
    eventType: 'policy.evaluated', artifactId: AID[0].id,
    timestamp: '2026-06-22T09:00:01.000Z', actor: 'delivery-engine',
    payload: { decision: 'ALLOW', evaluatedBy: 'rbac', role: 'admin' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000001',
    hash: '0000000000000000000000000000000000000000000000000000000000000002',
  },
  {
    id: 'evt-003', sequenceNumber: 3,
    eventType: 'template.selected', artifactId: AID[0].id,
    timestamp: '2026-06-22T09:00:02.000Z', actor: 'delivery-engine',
    payload: { templateId: '11111111-1111-4111-8111-111111111111', templateName: 'InstitutionPassport', version: 1 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000002',
    hash: '0000000000000000000000000000000000000000000000000000000000000003',
  },
  {
    id: 'evt-004', sequenceNumber: 4,
    eventType: 'artifact.rendered', artifactId: AID[0].id,
    timestamp: '2026-06-22T09:00:03.000Z', actor: 'delivery-engine',
    payload: { renderer: 'HtmlRenderer', contentType: 'text/html' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000003',
    hash: '0000000000000000000000000000000000000000000000000000000000000004',
  },
  {
    id: 'evt-005', sequenceNumber: 5,
    eventType: 'artifact.created', artifactId: AID[0].id,
    timestamp: '2026-06-22T09:00:04.000Z', actor: 'delivery-engine',
    payload: { artifactType: 'html', contentHash: 'e3b0c44...' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000004',
    hash: '0000000000000000000000000000000000000000000000000000000000000005',
  },
  {
    id: 'evt-006', sequenceNumber: 6,
    eventType: 'artifact.queued', artifactId: AID[0].id,
    timestamp: '2026-06-22T09:00:05.000Z', actor: 'delivery-engine',
    payload: { queuePosition: 0, channelType: 'portal' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000005',
    hash: '0000000000000000000000000000000000000000000000000000000000000006',
  },
  {
    id: 'evt-007', sequenceNumber: 7,
    eventType: 'delivery.attempted', artifactId: AID[0].id,
    timestamp: '2026-06-28T14:00:00.000Z', actor: 'delivery-engine',
    payload: { channelType: 'portal', attempt: 1, maxAttempts: 5 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000006',
    hash: '0000000000000000000000000000000000000000000000000000000000000007',
  },
  {
    id: 'evt-008', sequenceNumber: 8,
    eventType: 'delivery.succeeded', artifactId: AID[0].id,
    timestamp: '2026-06-28T14:00:02.000Z', actor: 'delivery-engine',
    payload: { channelType: 'portal', responseTime: '200ms' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000007',
    hash: '0000000000000000000000000000000000000000000000000000000000000008',
  },
  {
    id: 'evt-009', sequenceNumber: 9,
    eventType: 'receipt.received', artifactId: AID[0].id,
    timestamp: '2026-06-28T14:05:00.000Z', actor: 'system',
    payload: { receiptStatus: 'delivered', deliveryChannel: 'portal-dashboard' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000008',
    hash: '0000000000000000000000000000000000000000000000000000000000000009',
  },
  {
    id: 'evt-010', sequenceNumber: 10,
    eventType: 'artifact.acknowledged', artifactId: AID[0].id,
    timestamp: '2026-06-28T14:30:00.000Z', actor: 'admin-1',
    payload: { acknowledgedBy: 'admin-1', institutionName: 'National Biobank' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000009',
    hash: '00000000000000000000000000000000000000000000000000000000000000a',
  },

  // ── AID[1] (SponsorReport) — partial lifecycle ──
  {
    id: 'evt-011', sequenceNumber: 11,
    eventType: 'delivery.requested', artifactId: AID[1].id,
    timestamp: '2026-06-30T08:00:00.000Z', actor: 'sponsor-1',
    payload: { requestedBy: 'sponsor-1', viewId: 'view-002' },
    previousHash: '000000000000000000000000000000000000000000000000000000000000000a',
    hash: '000000000000000000000000000000000000000000000000000000000000000b',
  },
  {
    id: 'evt-012', sequenceNumber: 12,
    eventType: 'policy.evaluated', artifactId: AID[1].id,
    timestamp: '2026-06-30T08:00:01.000Z', actor: 'delivery-engine',
    payload: { decision: 'ALLOW', evaluatedBy: 'rbac', role: 'sponsor' },
    previousHash: '000000000000000000000000000000000000000000000000000000000000000b',
    hash: '000000000000000000000000000000000000000000000000000000000000000c',
  },
  {
    id: 'evt-013', sequenceNumber: 13,
    eventType: 'delivery.attempted', artifactId: AID[1].id,
    timestamp: '2026-07-01T09:00:00.000Z', actor: 'delivery-engine',
    payload: { channelType: 'email', attempt: 1, maxAttempts: 5 },
    previousHash: '000000000000000000000000000000000000000000000000000000000000000c',
    hash: '000000000000000000000000000000000000000000000000000000000000000d',
  },
  {
    id: 'evt-014', sequenceNumber: 14,
    eventType: 'delivery.succeeded', artifactId: AID[1].id,
    timestamp: '2026-07-01T09:15:00.000Z', actor: 'delivery-engine',
    payload: { channelType: 'email', responseTime: '450ms', recipient: 'sponsor-pfizer' },
    previousHash: '000000000000000000000000000000000000000000000000000000000000000d',
    hash: '000000000000000000000000000000000000000000000000000000000000000e',
  },

  // ── AID[2] (EvidencePack) — queued, not delivered ──
  {
    id: 'evt-015', sequenceNumber: 15,
    eventType: 'delivery.requested', artifactId: AID[2].id,
    timestamp: '2026-07-02T15:00:00.000Z', actor: 'admin-1',
    payload: { requestedBy: 'admin-1', viewId: 'view-003' },
    previousHash: '000000000000000000000000000000000000000000000000000000000000000e',
    hash: '000000000000000000000000000000000000000000000000000000000000000f',
  },
  {
    id: 'evt-016', sequenceNumber: 16,
    eventType: 'artifact.queued', artifactId: AID[2].id,
    timestamp: '2026-07-02T16:00:00.000Z', actor: 'delivery-engine',
    payload: { queuePosition: 3, channelType: 'api' },
    previousHash: '000000000000000000000000000000000000000000000000000000000000000f',
    hash: '0000000000000000000000000000000000000000000000000000000000000010',
  },

  // ── AID[5] (SponsorReport v2) — revoked after DLQ ──
  {
    id: 'evt-017', sequenceNumber: 17,
    eventType: 'delivery.requested', artifactId: AID[5].id,
    timestamp: '2026-06-23T10:00:00.000Z', actor: 'sponsor-1',
    payload: { requestedBy: 'sponsor-1', viewId: 'view-006' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000010',
    hash: '0000000000000000000000000000000000000000000000000000000000000011',
  },
  {
    id: 'evt-018', sequenceNumber: 18,
    eventType: 'delivery.attempted', artifactId: AID[5].id,
    timestamp: '2026-06-23T10:30:00.000Z', actor: 'delivery-engine',
    payload: { channelType: 'webhook', attempt: 1, maxAttempts: 5 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000011',
    hash: '0000000000000000000000000000000000000000000000000000000000000012',
  },
  {
    id: 'evt-019', sequenceNumber: 19,
    eventType: 'delivery.failed', artifactId: AID[5].id,
    timestamp: '2026-06-23T10:30:02.000Z', actor: 'delivery-engine',
    payload: { channelType: 'webhook', attempt: 1, error: 'Connection refused', nextRetryMs: 1000 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000012',
    hash: '0000000000000000000000000000000000000000000000000000000000000013',
  },
  {
    id: 'evt-020', sequenceNumber: 20,
    eventType: 'delivery.retried', artifactId: AID[5].id,
    timestamp: '2026-06-23T10:30:04.000Z', actor: 'delivery-engine',
    payload: { attempt: 2, backoffMs: 1000 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000013',
    hash: '0000000000000000000000000000000000000000000000000000000000000014',
  },
  {
    id: 'evt-021', sequenceNumber: 21,
    eventType: 'delivery.failed', artifactId: AID[5].id,
    timestamp: '2026-06-23T10:30:06.000Z', actor: 'delivery-engine',
    payload: { channelType: 'webhook', attempt: 2, error: 'Connection refused', nextRetryMs: 4000 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000014',
    hash: '0000000000000000000000000000000000000000000000000000000000000015',
  },
  {
    id: 'evt-022', sequenceNumber: 22,
    eventType: 'delivery.dlq', artifactId: AID[5].id,
    timestamp: '2026-06-23T10:35:00.000Z', actor: 'delivery-engine',
    payload: { reason: 'Max retries exceeded (5)', totalAttempts: 5 },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000015',
    hash: '0000000000000000000000000000000000000000000000000000000000000016',
  },
  {
    id: 'evt-023', sequenceNumber: 23,
    eventType: 'artifact.revoked', artifactId: AID[5].id,
    timestamp: '2026-06-25T14:00:00.000Z', actor: 'admin-1',
    payload: { reason: 'Data quality issues — corrected report pending', initiatedBy: 'admin-1' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000016',
    hash: '0000000000000000000000000000000000000000000000000000000000000017',
  },

  // ── AID[6] (CSV data export) — quick deliver ──
  {
    id: 'evt-024', sequenceNumber: 24,
    eventType: 'delivery.requested', artifactId: AID[6].id,
    timestamp: '2026-06-30T10:00:00.000Z', actor: 'sponsor-1',
    payload: { requestedBy: 'sponsor-1', viewId: 'view-007' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000017',
    hash: '0000000000000000000000000000000000000000000000000000000000000018',
  },
  {
    id: 'evt-025', sequenceNumber: 25,
    eventType: 'delivery.succeeded', artifactId: AID[6].id,
    timestamp: '2026-07-01T11:00:00.000Z', actor: 'delivery-engine',
    payload: { channelType: 's3', bucket: 'kadarn-exports', responseTime: '1200ms' },
    previousHash: '0000000000000000000000000000000000000000000000000000000000000018',
    hash: '0000000000000000000000000000000000000000000000000000000000000019',
  },
];

// ─── Mock Templates (5) ──────────────────────────────────────────────────────

function tid(id: string): DeliveryTemplate['id'] { return id as DeliveryTemplate['id']; }
function tchash(h: string): DeliveryTemplate['checksum'] { return h as DeliveryTemplate['checksum']; }

const T_SPONSOR_V1 = tid('31111111-1111-4111-8111-111111111113');
const T_SPONSOR_V2 = tid('32222222-2222-4222-8222-222222222224');

export const MOCK_TEMPLATES: DeliveryTemplate[] = [
  {
    id: T_SPONSOR_V1,
    name: 'SponsorReport',
    artifactType: 'pdf',
    version: 1,
    metadata: {
      displayName: 'Sponsor Report v1',
      description: 'Standard quarterly sponsor report with capability summary and evidence highlights.',
      category: 'report',
      deprecated: true,
      supersededBy: T_SPONSOR_V2,
      tags: ['sponsor', 'quarterly', 'capabilities'],
    },
    schema: {
      version: '1.0.0',
      layout: 'report',
      slots: [
        { name: 'sponsorName', type: 'text', required: true, description: 'Full sponsor organization name' },
        { name: 'institutionName', type: 'text', required: true, description: 'Institution name' },
        { name: 'capabilityTable', type: 'table', required: true, description: 'Capability overview with status and metrics', validation: { minItems: 1, maxItems: 20 } },
        { name: 'evidenceSummary', type: 'markdown', required: true, description: 'Summary of evidence highlights in markdown' },
        { name: 'actions', type: 'list', required: false, description: 'Recommended next actions', validation: { maxItems: 10 } },
      ],
    },
    renderEngine: 'PdfRenderer',
    checksum: tchash('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2'),
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
  {
    id: T_SPONSOR_V2,
    name: 'SponsorReport',
    artifactType: 'pdf',
    version: 2,
    metadata: {
      displayName: 'Sponsor Report v2',
      description: 'Enhanced sponsor report with evidence gaps, confidence trends, and actionable recommendations.',
      category: 'report',
      tags: ['sponsor', 'quarterly', 'capabilities', 'confidence', 'gaps'],
    },
    schema: {
      version: '2.0.0',
      layout: 'report',
      slots: [
        { name: 'sponsorName', type: 'text', required: true, description: 'Full sponsor organization name' },
        { name: 'institutionName', type: 'text', required: true, description: 'Institution name' },
        { name: 'capabilityTable', type: 'table', required: true, description: 'Capability overview with status and metrics', validation: { minItems: 1, maxItems: 20 } },
        { name: 'evidenceSummary', type: 'markdown', required: true, description: 'Summary of evidence highlights in markdown' },
        { name: 'evidenceGaps', type: 'table', required: true, description: 'Identified evidence gaps with severity and impact', validation: { minItems: 1 } },
        { name: 'confidenceTrend', type: 'chart', required: false, description: 'Confidence trend visualization over time' },
        { name: 'recommendations', type: 'list', required: true, description: 'Actionable recommendations to close gaps', validation: { minItems: 1, maxItems: 10 } },
      ],
    },
    renderEngine: 'PdfRenderer',
    checksum: tchash('b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3'),
    createdAt: '2026-06-15T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: tid('43333333-3333-4333-8333-333333333335'),
    name: 'AuditPack',
    artifactType: 'zip',
    version: 1,
    metadata: {
      displayName: 'Audit Pack',
      description: 'Comprehensive audit package with compliance, quality, and training documentation.',
      category: 'audit',
      tags: ['audit', 'compliance', 'quality', 'quarterly'],
    },
    schema: {
      version: '1.0.0',
      layout: 'pack',
      slots: [
        { name: 'institutionName', type: 'text', required: true, description: 'Audited institution name' },
        { name: 'auditPeriod', type: 'text', required: true, description: 'Audit period (e.g. 2026-Q2)', validation: { pattern: '\\d{4}-Q[1-4]' } },
        { name: 'complianceSection', type: 'json', required: true, description: 'Regulatory compliance status and certificates' },
        { name: 'findings', type: 'table', required: false, description: 'Audit findings with severity classification', validation: { maxItems: 50 } },
      ],
    },
    renderEngine: 'ZipRenderer',
    checksum: tchash('c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4'),
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: tid('54444444-4444-4444-8444-444444444446'),
    name: 'EvidencePack',
    artifactType: 'json',
    version: 1,
    metadata: {
      displayName: 'Evidence Pack',
      description: 'Structured evidence bundle with claims, confidence data, and reconstruction proof.',
      category: 'pack',
      tags: ['evidence', 'claims', 'confidence', 'reconstruction'],
    },
    schema: {
      version: '1.0.0',
      layout: 'pack',
      slots: [
        { name: 'studyId', type: 'text', required: true, description: 'Clinical trial or study identifier' },
        { name: 'claims', type: 'json', required: true, description: 'Array of evidence claims with confidence scores', validation: { minItems: 1 } },
        { name: 'confidenceSummary', type: 'table', required: true, description: 'Confidence breakdown by claim type' },
        { name: 'reconstructionProof', type: 'json', required: true, description: 'Reconstruction verification data for audit replay' },
        { name: 'explanationSteps', type: 'list', required: false, description: 'Confidence derivation explanation chain' },
        { name: 'reviewHistory', type: 'table', required: false, description: 'Peer review and curation events' },
      ],
    },
    renderEngine: 'JsonRenderer',
    checksum: tchash('d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5'),
    createdAt: '2026-05-15T00:00:00.000Z',
    updatedAt: '2026-05-15T00:00:00.000Z',
  },
  {
    id: tid('65555555-5555-4555-8555-555555555557'),
    name: 'InstitutionPassport',
    artifactType: 'html',
    version: 1,
    metadata: {
      displayName: 'Institution Passport',
      description: 'Public-facing institution profile with capabilities, certifications, and evidence summary.',
      category: 'passport',
      tags: ['institution', 'public', 'capabilities', 'certifications'],
    },
    schema: {
      version: '1.0.0',
      layout: 'two-column',
      slots: [
        { name: 'institutionName', type: 'text', required: true, description: 'Full institution name' },
        { name: 'institutionLogo', type: 'text', required: false, description: 'URL or base64-encoded institution logo' },
        { name: 'capabilitiesList', type: 'table', required: true, description: 'List of biobank capabilities with status indicators', validation: { minItems: 1 } },
        { name: 'certifications', type: 'list', required: true, description: 'Accreditations and certifications (CAP, ISO, CLIA, etc.)' },
        { name: 'evidenceHighlights', type: 'markdown', required: false, description: 'Selected evidence highlights and metrics' },
        { name: 'contactInfo', type: 'text', required: true, description: 'Primary contact information' },
        { name: 'locationInfo', type: 'text', required: true, description: 'Physical location and facilities overview' },
        { name: 'specimenCounts', type: 'table', required: false, description: 'Specimen inventory counts by type and condition', validation: { maxItems: 30 } },
      ],
    },
    renderEngine: 'HtmlRenderer',
    checksum: tchash('e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6'),
    createdAt: '2026-04-15T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
  },
];

// ─── Mock Channels (8) ────────────────────────────────────────────────────────

function cid(id: string): DeliveryChannel['id'] { return id as DeliveryChannel['id']; }

export const MOCK_CHANNELS: DeliveryChannel[] = [
  {
    id: cid('c1111111-1111-4111-8111-11111111111c'),
    channelType: 'email',
    config: {
      from: 'delivery@kadarn.io',
      smtp: 'smtp.kadarn.io',
    },
    retryPolicy: { maxAttempts: 5, backoffMs: 1000 },
    isActive: true,
  },
  {
    id: cid('c2222222-2222-4222-8222-22222222222c'),
    channelType: 'email',
    config: {
      from: 'no-reply@kadarn.io',
      smtp: 'smtp.kadarn.io',
      replyTo: 'support@kadarn.io',
    },
    retryPolicy: { maxAttempts: 3, backoffMs: 2000 },
    isActive: true,
  },
  {
    id: cid('c3333333-3333-4333-8333-33333333333c'),
    channelType: 'webhook',
    config: {
      url: 'https://api.sponsor.com/webhooks/kadarn',
      secret: 'whsec_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
      authType: 'bearer',
      credentials: { token: '••••••••••••••••••••••••••' },
    },
    retryPolicy: { maxAttempts: 5, backoffMs: 2000 },
    isActive: true,
  },
  {
    id: cid('c4444444-4444-4444-8444-44444444444c'),
    channelType: 'webhook',
    config: {
      url: 'https://hooks.slack.com/services/T00/B00/xxxx',
      secret: 'whsec_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k',
    },
    retryPolicy: { maxAttempts: 3, backoffMs: 1000 },
    isActive: false,
  },
  {
    id: cid('c5555555-5555-4555-8555-55555555555c'),
    channelType: 'sftp',
    config: {
      endpoint: 'sftp://delivery.partner.org:22/delivery/',
      credentials: { hostKey: 'SHA256:aBcDeFgHiJkLmNoPqRsTuVwXyZ...' },
    },
    retryPolicy: { maxAttempts: 3, backoffMs: 5000 },
    isActive: false,
  },
  {
    id: cid('c6666666-6666-4666-8666-66666666666c'),
    channelType: 'api',
    config: {
      endpoint: 'https://api.ctms-partner.com/v2/deliveries',
      authType: 'api-key',
      method: 'POST',
      headers: { 'X-CTMS-Version': '2.0' },
    },
    retryPolicy: { maxAttempts: 5, backoffMs: 1000 },
    isActive: true,
  },
  {
    id: cid('c7777777-7777-4777-8777-77777777777c'),
    channelType: 'portal',
    config: {
      workspaceId: 'ws-delivery-dashboard',
      notificationEnabled: true,
    },
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    isActive: true,
  },
  {
    id: cid('c8888888-8888-4888-8888-88888888888c'),
    channelType: 's3',
    config: {
      bucket: 'kadarn-delivery-artifacts',
      region: 'us-east-1',
      expirySeconds: 86400,
    },
    retryPolicy: { maxAttempts: 3, backoffMs: 2000 },
    isActive: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getArtifactById(id: string): DeliveryArtifact | undefined {
  return MOCK_ARTIFACTS.find((a) => a.id === id);
}

export function getAuditForArtifact(artifactId: string): AuditEntry[] {
  return MOCK_AUDIT_TRAIL.filter((e) => e.artifactId === artifactId);
}

export function getUniqueArtifactIds(audit: AuditEntry[]): string[] {
  return [...new Set(audit.map((e) => e.artifactId))];
}

// ─── Mock Subscriptions (5) ──────────────────────────────────────────────────

function subId(id: string): DeliverySubscription['id'] { return id as DeliverySubscription['id']; }

export const MOCK_SUBSCRIPTIONS: DeliverySubscription[] = [
  {
    id: subId('sub-conf-drop'),
    name: 'Confidence Drop Alert',
    description: 'Notify sponsor when evidence confidence drops below MEDIUM.',
    trigger: { type: 'schedule' as const, schedule: 'daily' as const, hour: 8 },
    templateName: 'SponsorReport',
    artifactType: 'pdf',
    recipients: [{ recipientId: 'rec-sponsor-pfizer', channelType: 'email' }],
    enabled: true,
    lastTriggeredAt: '2026-07-03T08:00:00.000Z',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: subId('sub-weekly-digest'),
    name: 'Weekly Digest',
    description: 'Weekly summary of evidence updates for sponsor review.',
    trigger: { type: 'schedule' as const, schedule: 'weekly' as const, dayOfWeek: 1, hour: 8 },
    templateName: 'SponsorReport',
    artifactType: 'pdf',
    recipients: [{ recipientId: 'rec-sponsor-pfizer', channelType: 'email' }, { recipientId: 'rec-sponsor-roche', channelType: 'email' }],
    enabled: true,
    lastTriggeredAt: '2026-07-01T08:00:00.000Z',
    createdAt: '2026-05-15T00:00:00.000Z',
  },
  {
    id: subId('sub-monthly-passport'),
    name: 'Monthly Passport',
    description: 'Monthly Institution Passport delivery for all active biobanks.',
    trigger: { type: 'schedule' as const, schedule: 'monthly' as const, dayOfMonth: 1, hour: 8 },
    templateName: 'InstitutionPassport',
    artifactType: 'html',
    recipients: [{ recipientId: 'rec-dashboard', channelType: 'portal' }],
    enabled: false,
    lastTriggeredAt: null,
    createdAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: subId('sub-quarterly-audit'),
    name: 'Quarterly Audit',
    description: 'Quarterly audit pack with compliance, quality, and training sections.',
    trigger: { type: 'schedule' as const, schedule: 'quarterly' as const, dayOfMonth: 1, hour: 9 },
    templateName: 'AuditPack',
    artifactType: 'zip',
    recipients: [{ recipientId: 'rec-s3-audit', channelType: 's3' }],
    enabled: false,
    lastTriggeredAt: null,
    createdAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: subId('sub-expiration-alert'),
    name: 'Expiration Alert',
    description: 'Alert when artifacts are expiring within 7 days.',
    trigger: { type: 'schedule' as const, schedule: 'daily' as const, hour: 6 },
    templateName: 'SponsorReport',
    artifactType: 'pdf',
    recipients: [{ recipientId: 'rec-admin', channelType: 'email' }, { recipientId: 'rec-dashboard', channelType: 'portal' }],
    enabled: true,
    lastTriggeredAt: '2026-07-03T06:00:00.000Z',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
];

// ─── RBAC Role Permissions ───────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'artifact:read', 'artifact:deliver', 'artifact:revoke',
    'artifact:expire', 'policy:manage', 'channel:manage', 'lineage:view',
  ],
  sponsor: ['artifact:read', 'artifact:deliver'],
  institution: ['artifact:read', 'artifact:deliver', 'lineage:view'],
  researcher: ['artifact:read'],
  auditor: ['artifact:read', 'lineage:view'],
  system: ['artifact:read', 'artifact:deliver', 'artifact:expire'],
};

// ─── Visibility / ABAC Rules ─────────────────────────────────────────────────

export interface VisibilityRule {
  id: string;
  name: string;
  description: string;
  effect: 'ALLOW' | 'DENY';
  priority: number;
  condition: string;
}

export const VISIBILITY_RULES: VisibilityRule[] = [
  {
    id: 'vis-public',
    name: 'Public Access',
    description: 'Public artifacts visible to all authenticated roles.',
    effect: 'ALLOW',
    priority: 100,
    condition: "classification = 'public'",
  },
  {
    id: 'vis-confidential',
    name: 'Confidential Restriction',
    description: 'Confidential artifacts denied by default except for owning institution and auditors.',
    effect: 'DENY',
    priority: 200,
    condition: "classification = 'confidential'",
  },
  {
    id: 'vis-counter-evidence',
    name: 'Sponsor Counter-Evidence Block',
    description: 'Sponsors cannot access counter-evidence artifacts.',
    effect: 'DENY',
    priority: 300,
    condition: "classification = 'counter-evidence' AND actor.role = 'sponsor'",
  },
];

// ─── Mock Queue + DLQ (9.12E) ────────────────────────────────────────────

function qid(id: string): QueueEntry['id'] { return id as QueueEntry['id']; }
function did(id: string): DLQEntry['id'] { return id as DLQEntry['id']; }

export const MOCK_QUEUE: QueueEntry[] = [
  {
    id: qid('q-pending-1'),
    artifactId: aid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
    channelId: 'ch-webhook-1' as DLQEntry['channelId'],
    recipientId: 'rec-pfizer-1' as DLQEntry['recipientId'],
    status: 'pending',
    attemptNumber: 0,
    lastAttemptAt: null,
    nextAttemptAt: new Date(Date.now() + 30000).toISOString(),
    lastError: null,
    createdAt: '2026-07-03T10:00:00.000Z',
  },
  {
    id: qid('q-processing-1'),
    artifactId: aid('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'),
    channelId: 'ch-email-1' as DLQEntry['channelId'],
    recipientId: 'rec-pfizer-1' as DLQEntry['recipientId'],
    status: 'processing',
    attemptNumber: 1,
    lastAttemptAt: new Date(Date.now() - 5000).toISOString(),
    nextAttemptAt: null,
    lastError: null,
    createdAt: '2026-07-03T10:02:00.000Z',
  },
  {
    id: qid('q-failed-1'),
    artifactId: aid('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f'),
    channelId: 'ch-sftp-1' as DLQEntry['channelId'],
    recipientId: 'rec-roche-1' as DLQEntry['recipientId'],
    status: 'failed',
    attemptNumber: 3,
    lastAttemptAt: new Date(Date.now() - 120000).toISOString(),
    nextAttemptAt: new Date(Date.now() + 30000).toISOString(),
    lastError: 'SFTP connection timeout after 30s',
    createdAt: '2026-07-03T09:30:00.000Z',
  },
  {
    id: qid('q-pending-2'),
    artifactId: aid('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'),
    channelId: 'ch-api-1' as DLQEntry['channelId'],
    recipientId: 'rec-novartis-1' as DLQEntry['recipientId'],
    status: 'pending',
    attemptNumber: 0,
    lastAttemptAt: null,
    nextAttemptAt: new Date(Date.now() + 10000).toISOString(),
    lastError: null,
    createdAt: '2026-07-03T10:15:00.000Z',
  },
  {
    id: qid('q-processing-2'),
    artifactId: aid('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b'),
    channelId: 'ch-webhook-2' as DLQEntry['channelId'],
    recipientId: 'rec-astrazeneca-1' as DLQEntry['recipientId'],
    status: 'processing',
    attemptNumber: 2,
    lastAttemptAt: new Date(Date.now() - 15000).toISOString(),
    nextAttemptAt: null,
    lastError: 'Previous attempt: 502 Bad Gateway',
    createdAt: '2026-07-03T09:45:00.000Z',
  },
  {
    id: qid('q-failed-2'),
    artifactId: aid('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c'),
    channelId: 'ch-email-2' as DLQEntry['channelId'],
    recipientId: 'rec-johnson-1' as DLQEntry['recipientId'],
    status: 'failed',
    attemptNumber: 4,
    lastAttemptAt: new Date(Date.now() - 60000).toISOString(),
    nextAttemptAt: new Date(Date.now() + 60000).toISOString(),
    lastError: 'SMTP 550: Mailbox not found',
    createdAt: '2026-07-03T08:00:00.000Z',
  },
]

export const MOCK_DLQ: DLQEntry[] = [
  {
    id: did('dlq-1'),
    artifactId: aid('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a'),
    channelId: 'ch-sftp-1' as DLQEntry['channelId'],
    recipientId: 'rec-pfizer-1' as DLQEntry['recipientId'],
    failureReason: 'Max retries exceeded (5/5): SFTP authentication failed',
    failedAt: '2026-07-02T18:00:00.000Z',
    attemptNumber: 5,
    movedToDLQAt: '2026-07-02T18:05:00.000Z',
    originalEntryId: 'q-dlq-source-1' as QueueEntry['id'],
  },
  {
    id: did('dlq-2'),
    artifactId: aid('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'),
    channelId: 'ch-webhook-1' as DLQEntry['channelId'],
    recipientId: 'rec-roche-1' as DLQEntry['recipientId'],
    failureReason: 'Webhook endpoint returned 503 Service Unavailable (3 consecutive attempts)',
    failedAt: '2026-07-02T14:30:00.000Z',
    attemptNumber: 3,
    movedToDLQAt: '2026-07-02T14:35:00.000Z',
    originalEntryId: 'q-dlq-source-2' as QueueEntry['id'],
  },
  {
    id: did('dlq-3'),
    artifactId: aid('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e'),
    channelId: 'ch-email-1' as DLQEntry['channelId'],
    recipientId: 'rec-novartis-1' as DLQEntry['recipientId'],
    failureReason: 'SMTP 554: Message rejected as spam by recipient server',
    failedAt: '2026-07-01T09:15:00.000Z',
    attemptNumber: 4,
    movedToDLQAt: '2026-07-01T09:20:00.000Z',
    originalEntryId: 'q-dlq-source-3' as QueueEntry['id'],
  },
]

// ─── Policy Tester — simplified evaluation ────────────────────────────────────

export function evaluatePolicy(
  role: string,
  action: string,
  classification: string,
): { decision: 'ALLOW' | 'DENY'; reason: string } {
  // RBAC check
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) {
    return { decision: 'DENY', reason: `Unknown role: ${role}` };
  }
  if (!rolePerms.includes(action)) {
    return { decision: 'DENY', reason: `Role "${role}" lacks permission "${action}"` };
  }

  // ABAC / Visibility checks (higher priority = evaluated first)
  // Counter-evidence + sponsor
  if (classification === 'counter-evidence' && role === 'sponsor') {
    return { decision: 'DENY', reason: 'Sponsor counter-evidence denied (priority 300)' };
  }
  // Confidential + non-admin / non-auditor
  if (classification === 'confidential' && !['admin', 'auditor', 'institution'].includes(role)) {
    return { decision: 'DENY', reason: 'Confidential restriction — role not authorized (priority 200)' };
  }
  // Public
  if (classification === 'public') {
    return { decision: 'ALLOW', reason: 'Public access allowed (priority 100)' };
  }
  // Restricted
  if (classification === 'restricted' && role !== 'admin') {
    return { decision: 'DENY', reason: 'Restricted access — admin only' };
  }

  return { decision: 'ALLOW', reason: `RBAC: role "${role}" has "${action}"` };
}
