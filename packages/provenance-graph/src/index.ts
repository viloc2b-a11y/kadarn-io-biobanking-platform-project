// ==========================================================================
// Kadarn Provenance Graph — Public API
// ==========================================================================

export {
  traceForward,
  traceBackward,
  fullLineage,
  evidenceFor,
  lineageAt,
} from './engine.js';

export type {
  ProvenanceNode,
  ProvenanceEdge,
  ProvenanceEvidence,
  LineageResult,
  ProvenanceAdapter,
  ProvenanceNodeType,
  ProvenanceEdgeType,
  TraceQuery,
} from './types.js';
