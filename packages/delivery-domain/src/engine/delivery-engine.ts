// ==========================================================================
// DeliveryEngine — orchestrator for KEMS-007 delivery pipeline
// Sprint 9.6
//
// Pipeline: Published View → Policy → Template → Renderer → Artifact → Queue
// ==========================================================================

import { PolicyEngine } from '../policies/engine.js';
import type { PolicyActor, PolicyDecision } from '../policies/types.js';
import { TemplateRegistry } from '../templating/registry.js';
import type { ArtifactRenderer, RenderedArtifact, ViewData } from '../rendering/types.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';
import {
  transitionStatus,
  type ArtifactStatus,
} from '../value-objects/delivery-status.js';
import { generateContentHash } from '../value-objects/content-hash.js';
import {
  createDeliveryArtifactId,
  type DeliveryArtifactId,
  type DeliveryChannelId,
} from '../value-objects/ids.js';
import {
  createDeliveryArtifact,
  type DeliveryArtifact,
} from '../entities/delivery-artifact.js';
import type { DeliveryTemplate } from '../entities/delivery-template.js';
import {
  createArtifactCreatedEvent,
  createArtifactGeneratedEvent,
  createArtifactQueuedEvent,
  type DomainEvent,
} from '../events/delivery-events.js';
import type {
  DeliveryRequest,
  DeliveryResult,
  DeliveryEngineConfig,
} from './types.js';
import {
  DeliveryPolicyDeniedError,
  TemplateNotFoundError,
  RendererNotFoundError,
} from './errors.js';

export class DeliveryEngine {
  private policyEngine: PolicyEngine;
  private templateRegistry: TemplateRegistry;
  private renderers: Map<ArtifactType, ArtifactRenderer>;
  private config: DeliveryEngineConfig;

  constructor(
    policyEngine: PolicyEngine,
    templateRegistry: TemplateRegistry,
    renderers: Map<ArtifactType, ArtifactRenderer>,
    config?: DeliveryEngineConfig,
  ) {
    this.policyEngine = policyEngine;
    this.templateRegistry = templateRegistry;
    this.renderers = renderers;
    this.config = { autoQueue: true, requireApproval: false, ...config };
  }

  // =========================================================================
  // Public API
  // =========================================================================

  /**
   * Execute the full delivery pipeline:
   * Policy → Template → Render → Artifact → Queue
   */
  async execute(request: DeliveryRequest): Promise<DeliveryResult> {
    const events: DomainEvent[] = [];
    const artifactId = createDeliveryArtifactId();

    // Step 1: Evaluate policy
    const policyDecision = this.evaluatePolicy(request);
    if (policyDecision.decision === 'DENY') {
      throw new DeliveryPolicyDeniedError(policyDecision);
    }

    // Step 2: Select template
    const template = this.selectTemplate(request);

    // Step 3: Render artifact
    const rendered = this.renderArtifact(request, template);

    // Step 4: Create delivery artifact entity
    const artifact = await this.createArtifact(artifactId, request, template, rendered);
    events.push(
      createArtifactCreatedEvent(
        artifact.id,
        artifact.type,
        artifact.contentHash,
        artifact.templateId,
      ),
      createArtifactGeneratedEvent(artifact.id),
    );

    // Step 5: Queue (if recipients provided and autoQueue enabled)
    let status: ArtifactStatus = 'generated';
    if (this.config.autoQueue && request.recipientIds && request.recipientIds.length > 0) {
      status = transitionStatus('generated', 'queued');
      const channelId = request.recipientIds[0] as unknown as DeliveryChannelId;
      events.push(createArtifactQueuedEvent(artifact.id, channelId));
    }

    return {
      artifact: { ...artifact, status } as DeliveryArtifact,
      rendered,
      policyDecision,
      template,
      status,
      events,
    };
  }

  /** Convenience: check if delivery would be allowed without executing. */
  canDeliver(actor: PolicyActor, request: Partial<DeliveryRequest>): PolicyDecision {
    return this.policyEngine.evaluate(actor, 'artifact:deliver', {
      artifact: {
        type: request.targetArtifactType,
        status: 'draft',
        metadata: (request as DeliveryRequest).view?.metadata ?? {},
        classification:
          ((request as DeliveryRequest).view?.metadata?.classification as string) ??
          'public',
      },
    });
  }

  // =========================================================================
  // Queries
  // =========================================================================

  /** Get the list of artifact types for which renderers are registered. */
  get supportedArtifactTypes(): ArtifactType[] {
    return Array.from(this.renderers.keys());
  }

  /** Check whether an artifact type has a registered renderer. */
  supportsArtifactType(type: ArtifactType): boolean {
    return this.renderers.has(type);
  }

  /** Get the number of registered renderers. */
  get rendererCount(): number {
    return this.renderers.size;
  }

  // =========================================================================
  // Private — pipeline steps
  // =========================================================================

  private evaluatePolicy(request: DeliveryRequest): PolicyDecision {
    return this.policyEngine.evaluate(request.actor, 'artifact:deliver', {
      artifact: {
        type: request.targetArtifactType,
        status: 'draft',
        metadata: request.view.metadata,
        classification:
          (request.view.metadata?.classification as string) ?? 'public',
        recipientIds: request.recipientIds,
      },
    });
  }

  private selectTemplate(request: DeliveryRequest): DeliveryTemplate {
    // Explicit template name provided
    if (request.templateName) {
      const template =
        request.templateVersion !== undefined
          ? this.templateRegistry.findByNameAndVersion(
              request.templateName,
              request.templateVersion,
            )
          : this.templateRegistry.findLatest(request.templateName);

      if (!template) {
        throw new TemplateNotFoundError(
          request.templateName,
          request.templateVersion,
        );
      }
      return template;
    }

    // Auto-select: find latest template matching artifactType
    const allTemplates = this.templateRegistry.listAll();
    const matching = allTemplates
      .filter((t) => t.artifactType === request.targetArtifactType)
      .sort((a, b) => b.version - a.version);

    if (matching.length > 0) {
      return matching[0];
    }

    // Fallback: use configured default template
    if (this.config.defaultTemplate) {
      const fallback = this.templateRegistry.findLatest(
        this.config.defaultTemplate,
      );
      if (fallback) return fallback;
    }

    throw new TemplateNotFoundError(request.targetArtifactType);
  }

  private renderArtifact(
    request: DeliveryRequest,
    template: DeliveryTemplate,
  ): RenderedArtifact {
    const renderer = this.renderers.get(request.targetArtifactType);
    if (!renderer) {
      throw new RendererNotFoundError(request.targetArtifactType);
    }
    return renderer.render(request.view);
  }

  private async createArtifact(
    id: DeliveryArtifactId,
    request: DeliveryRequest,
    template: DeliveryTemplate,
    rendered: RenderedArtifact,
  ): Promise<DeliveryArtifact> {
    const contentHash = await generateContentHash(rendered.data);
    return createDeliveryArtifact({
      id,
      type: request.targetArtifactType,
      contentHash,
      templateId: template.id,
      templateVersion: template.version,
      compiledAt: new Date().toISOString(),
      status: 'draft',
      metadata: {
        viewId: request.view.id,
        templateName: template.name,
        policyDecision: 'ALLOW',
        recipients: request.recipientIds ?? [],
        ...request.metadata,
      },
    });
  }
}
