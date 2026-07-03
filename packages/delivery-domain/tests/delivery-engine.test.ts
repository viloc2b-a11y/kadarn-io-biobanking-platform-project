// ==========================================================================
// Delivery Engine Tests — Sprint 9.6
// End-to-end: View → Policy → Template → Renderer → Artifact → Queue
// ==========================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { DeliveryEngine } from '../src/engine/delivery-engine.js';
import {
  DeliveryPolicyDeniedError,
  TemplateNotFoundError,
  RendererNotFoundError,
} from '../src/engine/errors.js';
import type { DeliveryRequest, DeliveryResult } from '../src/engine/types.js';
import { PolicyEngine } from '../src/policies/engine.js';
import type { PolicyActor } from '../src/policies/types.js';
import { JsonRenderer, HtmlRenderer, CsvRenderer, PdfRenderer } from '../src/rendering/index.js';
import type { ArtifactRenderer, ViewData } from '../src/rendering/types.js';
import { createDefaultRegistry } from '../src/templating/prebuilt.js';
import { TemplateRegistry } from '../src/templating/registry.js';
import type { ArtifactType } from '../src/value-objects/artifact-type.js';

// =========================================================================
// Helpers
// =========================================================================

function createTestEngine(config?: { autoQueue?: boolean; requireApproval?: boolean; defaultTemplate?: string }): DeliveryEngine {
  const policyEngine = new PolicyEngine();
  const registry = createDefaultRegistry();
  const renderers = new Map<ArtifactType, ArtifactRenderer>();
  renderers.set('json', new JsonRenderer());
  renderers.set('csv', new CsvRenderer());
  renderers.set('html', new HtmlRenderer());
  renderers.set('pdf', new PdfRenderer());
  return new DeliveryEngine(policyEngine, registry, renderers, config);
}

function makeSponsor(): PolicyActor {
  return { actorId: 'sponsor-1', roles: ['sponsor'], attributes: {} };
}

function makeAdmin(): PolicyActor {
  return { actorId: 'admin-1', roles: ['admin'], attributes: {} };
}

function makeResearcher(): PolicyActor {
  return { actorId: 'researcher-1', roles: ['researcher'], attributes: {} };
}

function makeView(overrides?: Partial<ViewData>): ViewData {
  return {
    id: 'view-1',
    title: 'Institution Capability Report',
    source: 'national-biobank',
    generatedAt: new Date().toISOString(),
    sections: [
      { sectionId: 's1', heading: 'Overview', content: 'Test overview content', order: 1 },
    ],
    metadata: { classification: 'public' },
    ...overrides,
  };
}

function makeCounterEvidenceView(): ViewData {
  return makeView({
    id: 'view-counter-1',
    title: 'Counter Evidence Report',
    metadata: { classification: 'counter-evidence' },
  });
}

// =========================================================================
// Policy Evaluation
// =========================================================================

describe('Policy Evaluation', () => {
  const engine = createTestEngine();

  it('Sponsor delivers public view → ALLOW (policy passes)', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.policyDecision.decision).toBe('ALLOW');
  });

  it('Sponsor delivers counter-evidence → DENY (throws DeliveryPolicyDeniedError)', async () => {
    await expect(
      engine.execute({
        view: makeCounterEvidenceView(),
        targetArtifactType: 'json',
        actor: makeSponsor(),
      }),
    ).rejects.toThrow(DeliveryPolicyDeniedError);
  });

  it('PolicyDeniedError contains policyDecision with reason', async () => {
    try {
      await engine.execute({
        view: makeCounterEvidenceView(),
        targetArtifactType: 'json',
        actor: makeSponsor(),
      });
      expect.fail('Expected DeliveryPolicyDeniedError');
    } catch (err) {
      expect(err).toBeInstanceOf(DeliveryPolicyDeniedError);
      const deniedErr = err as DeliveryPolicyDeniedError;
      expect(deniedErr.policyDecision.decision).toBe('DENY');
      expect(deniedErr.policyDecision.reason).toBeTruthy();
      expect(deniedErr.code).toBe('POLICY_DENIED');
    }
  });

  it('Admin delivers anything → ALLOW', async () => {
    const result = await engine.execute({
      view: makeView({ metadata: { classification: 'restricted' } }),
      targetArtifactType: 'json',
      actor: makeAdmin(),
    });
    expect(result.policyDecision.decision).toBe('ALLOW');
  });

  it('Policy decision is included in result', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.policyDecision).toBeDefined();
    expect(result.policyDecision.decision).toBe('ALLOW');
    expect(result.policyDecision.evaluatedBy).toBeTruthy();
  });

  it('canDeliver returns policy decision without executing', () => {
    const decision = engine.canDeliver(makeSponsor(), {
      view: makeView(),
      targetArtifactType: 'json',
    });
    expect(decision.decision).toBe('ALLOW');
  });
});

// =========================================================================
// Template Selection
// =========================================================================

describe('Template Selection', () => {
  it('Explicit template name + version → finds exact match', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'pdf',
      templateName: 'SponsorReport',
      templateVersion: 1,
      actor: makeSponsor(),
    });
    expect(result.template.name).toBe('SponsorReport');
    expect(result.template.version).toBe(1);
  });

  it('Explicit template name without version → finds latest', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'pdf',
      templateName: 'SponsorReport',
      actor: makeSponsor(),
    });
    expect(result.template.name).toBe('SponsorReport');
    expect(result.template.version).toBe(2); // v2 is latest
  });

  it('Non-existent template name → throws TemplateNotFoundError', async () => {
    const engine = createTestEngine();
    await expect(
      engine.execute({
        view: makeView(),
        targetArtifactType: 'pdf',
        templateName: 'NonExistentTemplate',
        actor: makeSponsor(),
      }),
    ).rejects.toThrow(TemplateNotFoundError);
  });

  it('Auto-select by artifactType → finds matching template', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'html',
      actor: makeSponsor(),
    });
    expect(result.template.name).toBe('InstitutionPassport');
    expect(result.template.artifactType).toBe('html');
  });

  it('No matching template → throws TemplateNotFoundError', async () => {
    const engine = createTestEngine();
    await expect(
      engine.execute({
        view: makeView(),
        targetArtifactType: 'csv',
        actor: makeSponsor(),
      }),
    ).rejects.toThrow(TemplateNotFoundError);
  });

  it('Default template fallback configured and used', async () => {
    const engine = createTestEngine({ defaultTemplate: 'SponsorReport' });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'pdf',
      actor: makeSponsor(),
    });
    expect(result.template.name).toBe('SponsorReport');
  });
});

// =========================================================================
// Rendering
// =========================================================================

describe('Rendering', () => {
  it('Render with JsonRenderer → valid JSON output', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.rendered.contentType).toBe('application/json');
    const parsed = JSON.parse(result.rendered.data);
    expect(parsed).toBeDefined();
  });

  it('Render with HtmlRenderer → valid HTML output', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'html',
      actor: makeSponsor(),
    });
    expect(result.rendered.contentType).toBe('text/html');
    expect(result.rendered.data).toContain('<!DOCTYPE html>');
  });

  it('Render with CsvRenderer → valid CSV output', async () => {
    const engine = createTestEngine();
    // Need to register csv renderer for test — already registered in createTestEngine
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'csv',
      templateName: 'InstitutionPassport', // force template since no csv template exists
      actor: makeSponsor(),
    });
    expect(result.rendered.contentType).toBe('text/csv');
    expect(result.rendered.data).toContain('section_id');
  });

  it('Unsupported artifactType → throws RendererNotFoundError', async () => {
    const engine = createTestEngine();
    // Remove pdf renderer to simulate unsupported type
    const renderers = new Map(engine['renderers'] as Map<ArtifactType, ArtifactRenderer>);
    renderers.delete('pdf');
    const rendererEngine = new DeliveryEngine(
      (engine as any).policyEngine,
      (engine as any).templateRegistry,
      renderers,
    );
    await expect(
      rendererEngine.execute({
        view: makeView(),
        targetArtifactType: 'pdf',
        actor: makeSponsor(),
      }),
    ).rejects.toThrow(RendererNotFoundError);
  });

  it('Rendered content matches artifact type', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.rendered.artifactType).toBe('json');
  });
});

// =========================================================================
// Artifact Creation
// =========================================================================

describe('Artifact Creation', () => {
  const engine = createTestEngine();

  it('Created artifact has correct type', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact.type).toBe('json');
  });

  it('Created artifact has content hash (SHA-256)', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact.contentHash).toMatch(/^[a-fA-F0-9]{64}$/);
  });

  it('Created artifact has templateId from selected template', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact.templateId).toBe(result.template.id);
  });

  it('Created artifact has templateVersion', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact.templateVersion).toBeGreaterThan(0);
  });

  it('Created artifact has compiledAt timestamp', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact.compiledAt).toBeTruthy();
    expect(new Date(result.artifact.compiledAt).getTime()).not.toBeNaN();
  });

  it('Created artifact metadata includes viewId and templateName', async () => {
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact.metadata.viewId).toBe('view-1');
    expect(result.artifact.metadata.templateName).toBe(result.template.name);
  });
});

// =========================================================================
// Queue
// =========================================================================

describe('Queue', () => {
  it('With recipients + autoQueue=true → status transitions to queued', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
      recipientIds: ['recipient-1'],
    });
    expect(result.status).toBe('queued');
  });

  it('Without recipients → status stays generated', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.status).toBe('generated');
  });

  it('With autoQueue=false → status stays generated even with recipients', async () => {
    const engine = createTestEngine({ autoQueue: false });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
      recipientIds: ['recipient-1'],
    });
    expect(result.status).toBe('generated');
  });

  it('Empty recipients array → status stays generated', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
      recipientIds: [],
    });
    expect(result.status).toBe('generated');
  });
});

// =========================================================================
// Event Emission
// =========================================================================

describe('Event Emission', () => {
  it('DeliveryArtifactCreated event always emitted', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    const createdEvent = result.events.find(
      (e) => e.type === 'delivery.artifact.created',
    );
    expect(createdEvent).toBeDefined();
    expect(createdEvent!.payload.artifactId).toBe(result.artifact.id);
  });

  it('ArtifactGenerated event always emitted', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    const generatedEvent = result.events.find(
      (e) => e.type === 'delivery.artifact.generated',
    );
    expect(generatedEvent).toBeDefined();
  });

  it('ArtifactQueued event only emitted when queued', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
      recipientIds: ['recipient-1'],
    });
    const queuedEvent = result.events.find(
      (e) => e.type === 'delivery.artifact.queued',
    );
    expect(queuedEvent).toBeDefined();
  });

  it('ArtifactQueued event NOT emitted when not queued', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    const queuedEvent = result.events.find(
      (e) => e.type === 'delivery.artifact.queued',
    );
    expect(queuedEvent).toBeUndefined();
  });

  it('Events array contains correct event types in order', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
      recipientIds: ['recipient-1'],
    });
    const types = result.events.map((e) => e.type);
    expect(types[0]).toBe('delivery.artifact.created');
    expect(types[1]).toBe('delivery.artifact.generated');
    expect(types[2]).toBe('delivery.artifact.queued');
  });

  it('Each event has ISO timestamp', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    for (const event of result.events) {
      expect(new Date(event.timestamp).getTime()).not.toBeNaN();
    }
  });
});

// =========================================================================
// Full E2E Walkthrough
// =========================================================================

describe('Full E2E Walkthrough', () => {
  it('Sponsor delivers InstitutionPassport as HTML → ALLOW, artifact created, queued', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView({ title: 'National Biobank Passport' }),
      targetArtifactType: 'html',
      templateName: 'InstitutionPassport',
      actor: makeSponsor(),
      recipientIds: ['recipient-1', 'recipient-2'],
    });

    expect(result.policyDecision.decision).toBe('ALLOW');
    expect(result.template.name).toBe('InstitutionPassport');
    expect(result.rendered.contentType).toBe('text/html');
    expect(result.artifact.type).toBe('html');
    expect(result.status).toBe('queued');
    expect(result.events.length).toBe(3);
  });

  it('Admin delivers EvidencePack as JSON → ALLOW, artifact created, queued', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      templateName: 'EvidencePack',
      actor: makeAdmin(),
      recipientIds: ['auditor-1'],
    });

    expect(result.policyDecision.decision).toBe('ALLOW');
    expect(result.template.name).toBe('EvidencePack');
    expect(result.rendered.contentType).toBe('application/json');
    expect(result.artifact.type).toBe('json');
    expect(result.status).toBe('queued');
  });

  it('Sponsor delivers counter-evidence → DENY with reason', async () => {
    const engine = createTestEngine();
    try {
      await engine.execute({
        view: makeCounterEvidenceView(),
        targetArtifactType: 'json',
        actor: makeSponsor(),
      });
      expect.fail('Expected error');
    } catch (err) {
      const deniedErr = err as DeliveryPolicyDeniedError;
      expect(deniedErr.policyDecision.reason.toLowerCase()).toContain('counter-evidence');
    }
  });

  it('Full result structure contains all expected fields', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
      recipientIds: ['recipient-1'],
    });

    expect(result.artifact).toBeDefined();
    expect(result.rendered).toBeDefined();
    expect(result.policyDecision).toBeDefined();
    expect(result.template).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.events).toBeDefined();
    expect(Array.isArray(result.events)).toBe(true);
  });

  it('End-to-end: view → policy → template → renderer → artifact → queue', async () => {
    const engine = createTestEngine({ autoQueue: true });
    const view = makeView({
      id: 'view-e2e-1',
      title: 'E2E Test Report',
      sections: [
        { sectionId: 's1', heading: 'Summary', content: 'E2E test results', order: 1 },
        { sectionId: 's2', heading: 'Details', content: 'All tests passed', order: 2 },
      ],
    });

    const result = await engine.execute({
      view,
      targetArtifactType: 'json',
      actor: makeAdmin(),
      recipientIds: ['recipient-1'],
    });

    // Policy passed
    expect(result.policyDecision.decision).toBe('ALLOW');
    // Template selected
    expect(result.template.artifactType).toBe('json');
    // Rendered
    expect(result.rendered.contentType).toBe('application/json');
    // Artifact created
    expect(result.artifact.contentHash).toMatch(/^[a-fA-F0-9]{64}$/);
    // Queued
    expect(result.status).toBe('queued');
    // Events emitted
    expect(result.events.some((e) => e.type === 'delivery.artifact.created')).toBe(true);
    expect(result.events.some((e) => e.type === 'delivery.artifact.generated')).toBe(true);
    expect(result.events.some((e) => e.type === 'delivery.artifact.queued')).toBe(true);
  });
});

// =========================================================================
// Edge Cases
// =========================================================================

describe('Edge Cases', () => {
  it('View with no sections → renders successfully', async () => {
    const engine = createTestEngine();
    const result = await engine.execute({
      view: makeView({ sections: [] }),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact).toBeDefined();
    expect(result.rendered.data).toBeTruthy();
  });

  it('View with many sections → renders successfully', async () => {
    const engine = createTestEngine();
    const sections = Array.from({ length: 20 }, (_, i) => ({
      sectionId: `s${i}`,
      heading: `Section ${i}`,
      content: `Content for section ${i}`,
      order: i,
    }));
    const result = await engine.execute({
      view: makeView({ sections }),
      targetArtifactType: 'json',
      actor: makeSponsor(),
    });
    expect(result.artifact).toBeDefined();
  });

  it('Engine queries return correct state', () => {
    const engine = createTestEngine();
    expect(engine.supportedArtifactTypes).toContain('json');
    expect(engine.supportedArtifactTypes).toContain('html');
    expect(engine.supportedArtifactTypes).toContain('csv');
    expect(engine.supportedArtifactTypes).toContain('pdf');
    expect(engine.supportsArtifactType('json')).toBe(true);
    expect(engine.supportsArtifactType('pdf')).toBe(true);
    expect(engine.supportsArtifactType('zip')).toBe(false);
    expect(engine.rendererCount).toBe(4);
  });

  it('Researcher without permissions → DENY', async () => {
    const engine = createTestEngine();
    await expect(
      engine.execute({
        view: makeView({ metadata: { classification: 'restricted' } }),
        targetArtifactType: 'json',
        actor: makeResearcher(),
      }),
    ).rejects.toThrow(DeliveryPolicyDeniedError);
  });

  it('Custom metadata is passed through to artifact', async () => {
    const engine = createTestEngine();
    const customMeta = { projectId: 'proj-1', priority: 'high' };
    const result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'json',
      actor: makeSponsor(),
      metadata: customMeta,
    });
    expect(result.artifact.metadata.projectId).toBe('proj-1');
    expect(result.artifact.metadata.priority).toBe('high');
  });

  it('Different template versions produce different template references', async () => {
    const engine = createTestEngine();
    const v1Result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'pdf',
      templateName: 'SponsorReport',
      templateVersion: 1,
      actor: makeSponsor(),
    });
    const v2Result = await engine.execute({
      view: makeView(),
      targetArtifactType: 'pdf',
      templateName: 'SponsorReport',
      templateVersion: 2,
      actor: makeSponsor(),
    });
    expect(v1Result.template.version).toBe(1);
    expect(v2Result.template.version).toBe(2);
    expect(v1Result.template.id).not.toBe(v2Result.template.id);
  });
});
