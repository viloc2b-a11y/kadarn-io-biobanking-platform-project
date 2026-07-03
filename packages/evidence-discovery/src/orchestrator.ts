// ==========================================================================
// Evidence Discovery — Discovery Orchestrator
// ==========================================================================
// Sprint 20A.4C.
//
// Single entry point for the Discovery subsystem.
// Coordinates agent pipeline execution and produces DiscoveryResult.
// The Snapshot, UI, and APIs talk to this — never directly to agents.
// ==========================================================================

import { AgentRegistry, AgentRunner } from './agents/framework/index';
import { DocumentClassifierAgent } from './agents/classifier';
import { EntityExtractorAgent } from './agents/entity-extractor';
import { RelationshipExtractorAgent } from './agents/relationship-extractor';
import { createRequest as buildRequest } from './preparation/types';
import type { SemanticExtractionRequest } from './preparation/types';
import type { AgentResult, DiscoveryAgent } from './agents/framework/types';

// --------------------------------------------------------------------------
// Orchestrator dependencies
// --------------------------------------------------------------------------

export interface OrchestratorStores {
  requestStore: {
    create(req: SemanticExtractionRequest): Promise<void>;
    getById(id: string): Promise<SemanticExtractionRequest | null>;
    update(req: SemanticExtractionRequest): Promise<void>;
  };
  layer1Store: {
    getById(id: string): Promise<{ markdown: string; artifactId: string; metadata: Record<string, unknown> } | null>;
  };
  artifactStore: {
    getById(id: string): Promise<{ filename: string; mimeType: string } | null>;
  };
  agentOutputStore: {
    save(result: AgentResult): Promise<void>;
  };
}

// --------------------------------------------------------------------------
// Discovery Result — single output contract
// --------------------------------------------------------------------------

export interface DiscoveryArtifactInfo {
  artifactId: string;
  filename: string;
}

export interface DocumentClassification {
  artifactId: string;
  documentType: string;
  confidence: number;
  requiresHumanReview: boolean;
}

export interface Entity {
  entityId: string;
  type: string;
  value: string;
  normalizedValue: string | null;
  confidence: number;
}

export interface Relationship {
  relationshipId: string;
  type: string;
  sourceEntityId: string;
  targetEntityId: string;
  confidence: number;
}

export interface DiscoveryResult {
  runId: string;
  pipelineVersion: string;
  completedAt: string;

  artifacts: DiscoveryArtifactInfo[];
  classifications: DocumentClassification[];
  entities: Entity[];
  relationships: Relationship[];

  /** Raw agent outputs for inspection */
  agentOutputs: AgentResult[];
}

// --------------------------------------------------------------------------
// Orchestrator
// --------------------------------------------------------------------------

export class DiscoveryOrchestrator {
  private registry: AgentRegistry;
  private runner: AgentRunner;
  private agents: DiscoveryAgent[];

  constructor(
    private stores: OrchestratorStores,
    private pipelineVersion: string,
  ) {
    this.agents = [
      new DocumentClassifierAgent(),
      new EntityExtractorAgent(),
      new RelationshipExtractorAgent(),
    ];
    this.registry = new AgentRegistry(this.agents);
    this.runner = new AgentRunner(
      this.registry,
      {
        getById: (id) => this.stores.requestStore.getById(id),
        update: (req) => this.stores.requestStore.update(req),
      },
      this.stores.layer1Store,
      this.stores.artifactStore,
      this.stores.agentOutputStore,
      this.pipelineVersion,
    );
  }

  /**
   * Run the full discovery pipeline for a Layer 1 record.
   * Creates requests, runs all applicable agents, collects results.
   */
  async runDiscovery(params: {
    discoveryRunId: string;
    artifactId: string;
    layer1Id: string;
    inputHash: string;
  }): Promise<DiscoveryResult> {
    const { discoveryRunId, artifactId, layer1Id, inputHash } = params;

    // 1. Create requests for all agent types
    const requestTypes = ['DOCUMENT_CLASSIFICATION', 'ENTITY_EXTRACTION', 'RELATIONSHIP_EXTRACTION'] as const;
    const requests: SemanticExtractionRequest[] = [];

    for (const requestType of requestTypes) {
      const request = buildRequest({
        discoveryRunId,
        artifactId,
        layer1Id,
        requestType,
        pipelineVersion: this.pipelineVersion,
        inputHash,
      });
      await this.stores.requestStore.create(request);
      requests.push(request);
    }

    // 2. Run each agent in sequence
    const agentOutputs: AgentResult[] = [];

    for (const request of requests) {
      const result = await this.runner.execute(request);
      agentOutputs.push(result);
    }

    // 3. Collect outputs into DiscoveryResult
    return this.buildResult(discoveryRunId, artifactId, agentOutputs);
  }

  private buildResult(
    runId: string,
    artifactId: string,
    agentOutputs: AgentResult[],
  ): DiscoveryResult {
    const completedAt = new Date().toISOString();
    const result: DiscoveryResult = {
      runId,
      pipelineVersion: this.pipelineVersion,
      completedAt,
      artifacts: [],
      classifications: [],
      entities: [],
      relationships: [],
      agentOutputs,
    };

    for (const output of agentOutputs) {
      if (output.status !== 'COMPLETED') continue;

      switch (output.agentName) {
        case 'document-classifier': {
          const cls = output.output as any;
          result.classifications.push({
            artifactId,
            documentType: cls.documentType ?? 'UNKNOWN',
            confidence: cls.documentTypeConfidence ?? 0,
            requiresHumanReview: cls.requiresHumanReview ?? true,
          });
          break;
        }

        case 'entity-extractor': {
          const ent = output.output as any;
          for (const e of (ent.entities ?? [])) {
            result.entities.push({
              entityId: e.entityId,
              type: e.type,
              value: e.value,
              normalizedValue: e.normalizedValue ?? null,
              confidence: e.confidence,
            });
          }
          break;
        }

        case 'relationship-extractor': {
          const rel = output.output as any;
          for (const r of (rel.relationships ?? [])) {
            result.relationships.push({
              relationshipId: r.relationshipId,
              type: r.type,
              sourceEntityId: r.sourceEntityId,
              targetEntityId: r.targetEntityId,
              confidence: r.confidence,
            });
          }
          break;
        }
      }
    }

    result.artifacts.push({ artifactId, filename: 'unknown' });

    return result;
  }
}
