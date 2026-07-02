// ==========================================================================
// Evidence Discovery — Agents Public API
// ==========================================================================
// Sprint 20A.4A.
// ==========================================================================

export { AgentRegistry } from './framework/registry.js';
export { AgentRunner } from './framework/runner.js';
export { DocumentClassifierAgent } from './classifier.js';
export { EntityExtractorAgent } from './entity-extractor.js';
export { RelationshipExtractorAgent } from './relationship-extractor.js';
export type {
  DiscoveryAgent,
  AgentContext,
  AgentResult,
  AgentProvenance,
  AgentResultStatus,
} from './framework/types.js';
export type {
  DocumentType,
  ClassifierOutput,
} from './classifier.js';
export type {
  ExtractedEntity,
  EntityType,
  EntityExtractorOutput,
} from './entity-extractor.js';
export type {
  ExtractedRelationship,
  RelationshipType,
  RelationshipExtractorOutput,
} from './relationship-extractor.js';
