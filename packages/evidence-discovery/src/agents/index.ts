// ==========================================================================
// Evidence Discovery — Agents Public API
// ==========================================================================
// Sprint 20A.4A.
// ==========================================================================

export { AgentRegistry } from './framework/registry';
export { AgentRunner } from './framework/runner';
export { DocumentClassifierAgent } from './classifier';
export { EntityExtractorAgent } from './entity-extractor';
export { RelationshipExtractorAgent } from './relationship-extractor';
export type {
  DiscoveryAgent,
  AgentContext,
  AgentResult,
  AgentProvenance,
  AgentResultStatus,
} from './framework/types';
export type {
  DocumentType,
  ClassifierOutput,
} from './classifier';
export type {
  ExtractedEntity,
  EntityType,
  EntityExtractorOutput,
} from './entity-extractor';
export type {
  ExtractedRelationship,
  RelationshipType,
  RelationshipExtractorOutput,
} from './relationship-extractor';
