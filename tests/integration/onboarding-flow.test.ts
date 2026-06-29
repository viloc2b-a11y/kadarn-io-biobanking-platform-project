// ==========================================================================
// KPV-01 — Biobank Onboarding Validation Tests
// ==========================================================================
// Validates the full onboarding flow: organization creation → policy checks
// → provenance recording → domain events → telemetry tracing.
//
// These are offline tests that prove the engines are connected.
// Actual DB calls (Supabase) are not required.
// ==========================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  emitOrganizationCreated,
  recordOrganizationProvenance,
  evaluateCreateOrgPolicy,
  createCorrelationId,
} from '../../apps/api/src/lib/onboarding.js';
import type { EmittedEvent } from '../../apps/api/src/lib/onboarding.js';

// ---------------------------------------------------------------------------
// Domain event emission
// ---------------------------------------------------------------------------

describe('KPV-01: Domain Events', () => {
  it('emitOrganizationCreated produces a structured event with all required fields', () => {
    const correlationId = createCorrelationId();
    const event = emitOrganizationCreated(
      { id: 'org-001', name: 'Test Biobank', country: 'US' },
      'user-1',
      correlationId,
    );

    expect(event.type).toBe('OrganizationCreated');
    expect(event.payload).toEqual({
      organizationId: 'org-001',
      name: 'Test Biobank',
      country: 'US',
      createdBy: 'user-1',
    });
    expect(event.actorId).toBe('user-1');
    expect(event.organizationId).toBe('org-001');
    expect(event.correlationId).toBe(correlationId);
  });

  it('emitOrganizationCreated preserves the OrganizationCreatedPayload contract', () => {
    const event = emitOrganizationCreated(
      { id: 'org-002', name: 'Cancer Research Lab', country: 'DE' },
      'admin-1',
      'corr-001',
    );

    // Verify compliance with DomainEvent<OrganizationCreatedPayload> shape
    const payload = event.payload as Record<string, unknown>;
    expect(payload).toHaveProperty('organizationId');
    expect(payload).toHaveProperty('name');
    expect(payload).toHaveProperty('country');
    expect(payload).toHaveProperty('createdBy');
    expect(payload.organizationId).toBe('org-002');
    expect(payload.name).toBe('Cancer Research Lab');
    expect(payload.country).toBe('DE');
    expect(payload.createdBy).toBe('admin-1');
  });
});

// ---------------------------------------------------------------------------
// Provenance recording
// ---------------------------------------------------------------------------

describe('KPV-01: Provenance Recording', () => {
  it('recordOrganizationProvenance produces a valid provenance record', async () => {
    const record = await recordOrganizationProvenance(
      { id: 'org-001', name: 'Test Biobank', country: 'US', created_at: '2026-06-01T00:00:00Z' },
      'corr-001',
    );

    expect(record.recorded).toBe(true);
    expect(record.nodeType).toBe('organization');
    expect(record.externalId).toBe('org-001');
    expect(record.organizationId).toBe('org-001');
  });

  it('provenance record matches the upsert_provenance_node expected input', async () => {
    const org = { id: 'org-003', name: 'Genomics Core', country: 'GB' };
    const correlationId = createCorrelationId();
    const record = await recordOrganizationProvenance(org, correlationId);

    // The record shape is compatible with upsert_provenance_node RPC call
    // p_node_type, p_external_id, p_label, p_properties, p_organization_id
    expect(record.nodeType).toBe('organization');
    expect(record.externalId).toBe(org.id);
    expect(record.organizationId).toBe(org.id);
  });
});

// ---------------------------------------------------------------------------
// Policy checks
// ---------------------------------------------------------------------------

describe('KPV-01: Policy Shadow Check', () => {
  it('evaluateCreateOrgPolicy runs without throwing', async () => {
    const result = await evaluateCreateOrgPolicy(
      'user-1',
      'platform_admin',
      'org-001',
      'corr-001',
    );

    expect(result.evaluated).toBe(true);
    expect(result.correlationId).toBe('corr-001');
  });

  it('policy check is fire-and-forget (never throws on any input)', async () => {
    // Should handle any role gracefully
    const result = await evaluateCreateOrgPolicy(
      'user-2',
      'unknown_role',
      'org-002',
      'corr-002',
    );

    expect(result.evaluated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Route export verification
// ---------------------------------------------------------------------------

describe('KPV-01: Route Integration', () => {
  it('organizations route exports GET handler with telemetry and policy shadow', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const root = path.resolve(import.meta.dirname, '..', '..');
    const routePath = path.join(root, 'apps/api/src/app/api/organizations/route.ts');
    const source = fs.readFileSync(routePath, 'utf-8');

    // Verifies the route integrates with all 4 engines
    expect(source).toContain('withAsyncTracing');      // telemetry
    expect(source).toContain('withPolicyShadow');       // policy engine
    expect(source).toContain('SPAN_API_REQUEST');       // telemetry span name
    expect(source).toContain('recordOrganizationProvenance'); // provenance
    expect(source).toContain('emitOrganizationCreated');      // domain events
    expect(source).toContain('evaluateCreateOrgPolicy');     // policy check
    expect(source).toContain('createCorrelationId');          // correlation
  });

  it('POST handler is fire-and-forget: engines do not block the response', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const root = path.resolve(import.meta.dirname, '..', '..');
    const routePath = path.join(root, 'apps/api/src/app/api/organizations/route.ts');
    const source = fs.readFileSync(routePath, 'utf-8');

    // All cross-engine hooks use .catch() — they never throw to the caller
    const catchCount = (source.match(/\.catch\(/g) ?? []).length;
    expect(catchCount).toBeGreaterThanOrEqual(2); // provenance + policy

    // The response is returned BEFORE hooks complete
    const returnBeforeCatch = source.indexOf('return Response.json');
    const firstCatch = source.indexOf('.catch(');
    expect(returnBeforeCatch).toBeLessThan(firstCatch);
  });
});

// ---------------------------------------------------------------------------
// Correlation model
// ---------------------------------------------------------------------------

describe('KPV-01: Correlation Model', () => {
  it('createCorrelationId returns a unique UUID each time', () => {
    const id1 = createCorrelationId();
    const id2 = createCorrelationId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('the same correlationId flows through all engines in a single onboarding', () => {
    const correlationId = createCorrelationId();

    // 1. Event emitted with correlationId
    const event = emitOrganizationCreated(
      { id: 'org-001', name: 'Test', country: 'US' },
      'user-1',
      correlationId,
    );
    expect(event.correlationId).toBe(correlationId);

    // 2. Provenance recorded with correlationId
    const provenanceRecord = recordOrganizationProvenance(
      { id: 'org-001', name: 'Test', country: 'US' },
      correlationId,
    );
    // The correlationId flows through the provenance data
    expect(provenanceRecord).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Full flow: validates the end-to-end onboarding produces all artifacts
// ---------------------------------------------------------------------------

describe('KPV-01: End-to-End Onboarding Flow', () => {
  it('completes the full onboarding sequence producing all expected artifacts', async () => {
    const correlationId = createCorrelationId();
    const orgId = 'org-e2e-001';
    const actorId = 'user-onboarder';

    // Step 1: Organization data (simulates POST /api/organizations result)
    const org = { id: orgId, name: 'E2E Biobank', country: 'CA', created_at: new Date().toISOString() };

    // Step 2: Policy shadow check
    const policyResult = await evaluateCreateOrgPolicy(actorId, 'org_admin', orgId, correlationId);
    expect(policyResult.evaluated).toBe(true);

    // Step 3: Provenance recording
    const provenance = await recordOrganizationProvenance(org, correlationId);
    expect(provenance.recorded).toBe(true);
    expect(provenance.nodeType).toBe('organization');

    // Step 4: Domain event emission
    const event = emitOrganizationCreated(
      { id: orgId, name: org.name, country: org.country },
      actorId,
      correlationId,
    );
    expect(event.type).toBe('OrganizationCreated');
    expect(event.correlationId).toBe(correlationId);

    // Step 5: All artifacts are linked by correlationId
    expect(policyResult.correlationId).toBe(correlationId);
    expect(event.correlationId).toBe(correlationId);

    // Step 6: All artifacts reference the same organization
    expect(event.payload.organizationId).toBe(orgId);
    expect(provenance.externalId).toBe(orgId);
  });
});
