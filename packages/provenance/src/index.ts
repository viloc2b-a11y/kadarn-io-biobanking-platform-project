// ==========================================================================
// Kadarn Provenance — Public API
// ==========================================================================
// KAA-003 §8: Semantic Mapping Layer
//
// The mapping layer translates Kadarn provenance data into W3C PROV concepts
// without moving data. Existing tables remain the source of truth.
// ==========================================================================

export {
  toProvEntity,
  toProvActivity,
  toProvAgent,
  toProvNode,
  toProvRelation,
  toProvDocument,
  getProvCategory,
  getProvType,
} from './prov-mapping.js';

export type {
  ProvIdentifier,
  ProvEntity,
  ProvActivity,
  ProvAgent,
  ProvDocument,
  ProvWasGeneratedBy,
  ProvUsed,
  ProvWasDerivedFrom,
  ProvWasAttributedTo,
  ProvWasAssociatedWith,
  ProvActedOnBehalfOf,
  ProvWasRevisionOf,
  ProvCategory,
  ProvRelationType,
  NodeTypeMapping,
} from './prov-types.js';
