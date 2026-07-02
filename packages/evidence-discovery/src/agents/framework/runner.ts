// ==========================================================================
// Evidence Discovery — Agent Runner
// ==========================================================================
// Sprint 20A.4A.
//
// Orchestrates agent execution against SemanticExtractionRequests.
// Handles CLAIM → RUN → COMPLETE/FAIL lifecycle.
// ==========================================================================

import { AgentRegistry } from './registry.js';
import type { AgentContext, AgentResult, DiscoveryAgent } from './types.js';
import type { SemanticExtractionRequest, SemanticRequestType } from '../../preparation/types.js';
import { createRequest, transitionRequest } from '../../preparation/types.js';
import crypto from 'node:crypto';

export interface RequestStore {
  getById(requestId: string): Promise<SemanticExtractionRequest | null>;
  update(request: SemanticExtractionRequest): Promise<void>;
}

export interface Layer1Store {
  getById(layer1Id: string): Promise<{ markdown: string; artifactId: string; metadata: Record<string, unknown> } | null>;
}

export interface ArtifactStore {
  getById(artifactId: string): Promise<{ filename: string; mimeType: string } | null>;
}

export interface AgentOutputStore {
  save(result: AgentResult): Promise<void>;
}

export class AgentRunner {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly requestStore: RequestStore,
    private readonly layer1Store: Layer1Store,
    private readonly artifactStore: ArtifactStore,
    private readonly outputStore: AgentOutputStore,
    private readonly pipelineVersion: string,
  ) {}

  async execute(request: SemanticExtractionRequest): Promise<AgentResult> {
    // 1. Find agent
    const agent = this.registry.find(request.requestType);

    // 2. Claim request
    const claimed = transitionRequest(request, 'CLAIMED', { agentVersion: agent.version });
    await this.requestStore.update(claimed);

    // 3. Load Layer 1
    const layer1 = await this.layer1Store.getById(request.layer1Id);
    if (!layer1) {
      const failed = transitionRequest(request, 'FAILED', { error: `Layer 1 not found: ${request.layer1Id}` });
      await this.requestStore.update(failed);
      return {
        requestId: request.requestId, agentName: agent.name, agentVersion: agent.version,
        status: 'FAILED', output: {}, confidence: 0, warnings: ['Layer 1 not found'],
        provenance: { agentName: agent.name, agentVersion: agent.version, pipelineVersion: this.pipelineVersion, modelVersion: null, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), inputHash: request.inputHash, layer1Id: request.layer1Id, artifactId: request.artifactId },
      };
    }

    // 4. Load artifact metadata
    const artifact = await this.artifactStore.getById(request.artifactId);

    // 5. Mark RUNNING
    const running = transitionRequest(claimed, 'RUNNING');
    await this.requestStore.update(running);

    // 6. Execute agent
    const context: AgentContext = {
      requestId: request.requestId,
      discoveryRunId: request.discoveryRunId,
      artifactId: request.artifactId,
      layer1Id: request.layer1Id,
      requestType: request.requestType,
      layer1Markdown: layer1.markdown,
      filename: artifact?.filename ?? 'unknown',
      mimeType: artifact?.mimeType ?? 'unknown',
      extractionMetadata: layer1.metadata,
      pipelineVersion: this.pipelineVersion,
    };

    let result: AgentResult;
    try {
      result = await agent.run(context);
    } catch (err) {
      const failed = transitionRequest(running, 'FAILED', {
        error: err instanceof Error ? err.message : String(err),
        agentVersion: agent.version,
      });
      await this.requestStore.update(failed);

      return {
        requestId: request.requestId, agentName: agent.name, agentVersion: agent.version,
        status: 'FAILED', output: {}, confidence: 0, warnings: [String(err)],
        provenance: { agentName: agent.name, agentVersion: agent.version, pipelineVersion: this.pipelineVersion, modelVersion: null, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), inputHash: request.inputHash, layer1Id: request.layer1Id, artifactId: request.artifactId },
      };
    }

    // 7. Complete request
    switch (result.status) {
      case 'COMPLETED': {
        const completed = transitionRequest(running, 'COMPLETED', {
          outputRef: `agent-output-${result.requestId}`,
          agentVersion: agent.version,
        });
        await this.requestStore.update(completed);
        break;
      }
      case 'FAILED': {
        const failed = transitionRequest(running, 'FAILED', {
          error: result.warnings.join('; '),
          agentVersion: agent.version,
        });
        await this.requestStore.update(failed);
        break;
      }
      case 'SKIPPED': {
        const skipped = transitionRequest(running, 'SKIPPED');
        await this.requestStore.update(skipped);
        break;
      }
    }

    // 8. Persist output
    await this.outputStore.save(result);

    return result;
  }
}
