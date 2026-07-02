// ==========================================================================
// Evidence Discovery — Agent Framework Types
// ==========================================================================
// Sprint 20A.4A. KEMS-002.
//
// Agents consume SemanticExtractionRequests, read Layer 1, produce outputs.
// Agents NEVER write to Evidence Core.
// Agents NEVER promote Evidence Nodes.
// Agents NEVER bypass Curation.
// Agents NEVER mutate Layer 0 or Layer 1.
// Agents NEVER create institutional truth.
// ==========================================================================

import type { SemanticRequestType } from '../../preparation/types.js';

// --------------------------------------------------------------------------
// Agent context
// --------------------------------------------------------------------------

export interface AgentContext {
  /** The request being processed */
  requestId: string;
  discoveryRunId: string;
  artifactId: string;
  layer1Id: string;
  requestType: SemanticRequestType;

  /** Raw inputs */
  layer1Markdown: string;
  filename: string;
  mimeType: string;
  extractionMetadata: Record<string, unknown>;

  /** Pipeline version */
  pipelineVersion: string;
}

// --------------------------------------------------------------------------
// Agent result
// --------------------------------------------------------------------------

export type AgentResultStatus = 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface AgentResult {
  requestId: string;
  agentName: string;
  agentVersion: string;
  status: AgentResultStatus;
  output: Record<string, unknown>;
  confidence: number;
  warnings: string[];
  provenance: AgentProvenance;
}

export interface AgentProvenance {
  agentName: string;
  agentVersion: string;
  pipelineVersion: string;
  modelVersion: string | null;
  startedAt: string;
  completedAt: string;
  inputHash: string;
  layer1Id: string;
  artifactId: string;
}

// --------------------------------------------------------------------------
// Agent interface
// --------------------------------------------------------------------------

export interface DiscoveryAgent {
  /** Agent name */
  name: string;
  /** Agent version */
  version: string;

  /** Whether this agent supports the given request type */
  supports(requestType: SemanticRequestType): boolean;

  /** Run the agent */
  run(context: AgentContext): Promise<AgentResult>;
}
