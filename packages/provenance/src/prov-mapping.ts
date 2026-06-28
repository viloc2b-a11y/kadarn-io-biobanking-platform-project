// ==========================================================================
// Kadarn Provenance — W3C PROV Semantic Mapping
// ==========================================================================
// KAA-003 §5 (Semantic Layer), §6 (Core Concepts), §8 (Semantic Mapping)
//
// This module maps Kadarn provenance data to W3C PROV concepts.
// The mapping is interpretive only — data does not move, existing tables
// remain the source of truth, no schema rewrite occurs.
//
// Mapping rules (from KAA-003 §6):
//   - specimen, aliquot, qc_result, consent, document, dataset → Entity
//   - processing_event, shipment, access_request, protocol, program → Activity
//   - organization → Agent (future: user/profile → Person Agent)
//   - derived_from + wasRevisionOf property → wasRevisionOf relation
//   - other edge types → PROV relations via mapping table
// ==========================================================================

import type {
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
  NodeTypeMapping,
  ProvRelationType,
  ProvCategory,
} from './prov-types.js';

// --------------------------------------------------------------------------
// Node type → PROV category mapping
// --------------------------------------------------------------------------
// This is the authoritative registry. Add new node types here.
// --------------------------------------------------------------------------

const NODE_TYPE_MAPPINGS: Record<string, NodeTypeMapping> = {
  // ── Entities ──────────────────────────────────────────────────────────
  specimen:     { category: 'Entity',   provType: 'kadarn:specimen' },
  aliquot:      { category: 'Entity',   provType: 'kadarn:aliquot' },
  qc_result:    { category: 'Entity',   provType: 'kadarn:qcResult' },
  consent:      { category: 'Entity',   provType: 'kadarn:consent' },
  document:     { category: 'Entity',   provType: 'kadarn:document' },
  dataset:      { category: 'Entity',   provType: 'kadarn:dataset' },
  receipt:      { category: 'Entity',   provType: 'kadarn:receipt' },

  // ── Activities ─────────────────────────────────────────────────────────
  processing_event: { category: 'Activity', provType: 'kadarn:processingEvent' },
  shipment:         { category: 'Activity', provType: 'kadarn:shipment' },
  access_request:   { category: 'Activity', provType: 'kadarn:accessRequest' },
  protocol:         { category: 'Activity', provType: 'kadarn:protocol' },
  program:          { category: 'Activity', provType: 'kadarn:program' },
  temperature_log:  { category: 'Activity', provType: 'kadarn:temperatureLog' },
  settlement:       { category: 'Entity', provType: 'kadarn:settlement' },

  // ── Agents ─────────────────────────────────────────────────────────────
  organization: { category: 'Agent', provType: 'prov:Organization' },
};

// --------------------------------------------------------------------------
// Edge type → PROV relation mapping
// --------------------------------------------------------------------------

interface EdgeMappingRule {
  relation: ProvRelationType;
  isCorrection?: boolean; // If true, check edge properties for wasRevisionOf
  sourceRole: 'entity' | 'activity' | 'agent';
  targetRole: 'entity' | 'activity' | 'agent';
}

const EDGE_TYPE_MAPPINGS: Record<string, EdgeMappingRule> = {
  derived_from: { relation: 'wasDerivedFrom', sourceRole: 'entity', targetRole: 'entity' },
  generated_from: { relation: 'wasGeneratedBy', sourceRole: 'entity', targetRole: 'activity' },
  processed_by: { relation: 'wasAssociatedWith', sourceRole: 'activity', targetRole: 'agent' },
  verified_by: { relation: 'wasAssociatedWith', sourceRole: 'activity', targetRole: 'agent' },
  authorized_by: { relation: 'wasAttributedTo', sourceRole: 'entity', targetRole: 'agent' },
  owned_by: { relation: 'wasAttributedTo', sourceRole: 'entity', targetRole: 'agent' },
  requested_by: { relation: 'wasAssociatedWith', sourceRole: 'activity', targetRole: 'agent' },
  approved_by: { relation: 'wasAssociatedWith', sourceRole: 'activity', targetRole: 'agent' },
  shipped_with: { relation: 'wasDerivedFrom', sourceRole: 'entity', targetRole: 'entity' },
  linked_to: { relation: 'wasDerivedFrom', sourceRole: 'entity', targetRole: 'entity' },
};

// --------------------------------------------------------------------------
// Identifier helpers
// --------------------------------------------------------------------------

const PREFIX = 'kadarn';

function makeId(nodeType: string, externalId: string): ProvIdentifier {
  return `${PREFIX}:${nodeType}-${externalId}`;
}

function makeEdgeId(edgeType: string, sourceId: string, targetId: string): string {
  return `${PREFIX}:${edgeType}-${sourceId}-${targetId}`;
}

// --------------------------------------------------------------------------
// Public mapping functions
// --------------------------------------------------------------------------

/**
 * Determine the PROV category for a Kadarn node type.
 */
export function getProvCategory(nodeType: string): ProvCategory | null {
  return NODE_TYPE_MAPPINGS[nodeType]?.category ?? null;
}

/**
 * Get the PROV type string for a Kadarn node type.
 */
export function getProvType(nodeType: string): string | null {
  return NODE_TYPE_MAPPINGS[nodeType]?.provType ?? null;
}

/**
 * Map a Kadarn provenance node to a PROV Entity.
 * Returns null if the node type is not an Entity.
 */
export function toProvEntity(
  nodeType: string,
  externalId: string,
  properties?: Record<string, unknown>,
): ProvEntity | null {
  const mapping = NODE_TYPE_MAPPINGS[nodeType];
  if (!mapping || mapping.category !== 'Entity') return null;

  const props = properties ?? {};

  return {
    'prov:type': mapping.provType,
    'kadarn:nodeType': nodeType,
    'kadarn:label': (props['label'] as string) ?? null,
    'kadarn:externalId': externalId,
    'kadarn:organizationId': (props['organization_id'] as string) ?? null,
    ...(props as Record<string, unknown>),
  };
}

/**
 * Map a Kadarn provenance node to a PROV Activity.
 * Returns null if the node type is not an Activity.
 */
export function toProvActivity(
  nodeType: string,
  externalId: string,
  properties?: Record<string, unknown>,
): ProvActivity | null {
  const mapping = NODE_TYPE_MAPPINGS[nodeType];
  if (!mapping || mapping.category !== 'Activity') return null;

  const props = properties ?? {};

  return {
    'prov:type': mapping.provType,
    'kadarn:nodeType': nodeType,
    'kadarn:label': (props['label'] as string) ?? null,
    'kadarn:externalId': externalId,
    'kadarn:organizationId': (props['organization_id'] as string) ?? null,
    ...(props as Record<string, unknown>),
  };
}

/**
 * Map a Kadarn provenance node to a PROV Agent.
 * Returns null if the node type is not an Agent.
 */
export function toProvAgent(
  nodeType: string,
  externalId: string,
  properties?: Record<string, unknown>,
): ProvAgent | null {
  const mapping = NODE_TYPE_MAPPINGS[nodeType];
  if (!mapping || mapping.category !== 'Agent') return null;

  const props = properties ?? {};

  return {
    'prov:type': mapping.provType,
    'kadarn:nodeType': nodeType,
    'kadarn:label': (props['label'] as string) ?? null,
    'kadarn:externalId': externalId,
    ...(props as Record<string, unknown>),
  };
}

/**
 * Map a Kadarn provenance node to the correct PROV type based on its node_type.
 * Returns entity, activity, or agent — or null if the type is unknown.
 */
export function toProvNode(
  nodeType: string,
  externalId: string,
  properties?: Record<string, unknown>,
): ProvEntity | ProvActivity | ProvAgent | null {
  return (
    toProvEntity(nodeType, externalId, properties) ??
    toProvActivity(nodeType, externalId, properties) ??
    toProvAgent(nodeType, externalId, properties)
  );
}

/**
 * Map a Kadarn edge to the correct PROV relation object.
 * 
 * For derived_from edges with wasRevisionOf properties, maps to wasRevisionOf.
 * For other edges, uses the EDGE_TYPE_MAPPINGS registry.
 *
 * @returns An array of [relationType, relationKey, relationObject] tuples
 *          so the caller can insert them into a ProvDocument.
 */
export function toProvRelation(
  edgeType: string,
  sourceNodeType: string,
  sourceExternalId: string,
  targetNodeType: string,
  targetExternalId: string,
  edgeProperties?: Record<string, unknown>,
): Array<[ProvRelationType, string, ProvWasGeneratedBy | ProvUsed | ProvWasDerivedFrom | ProvWasAttributedTo | ProvWasAssociatedWith | ProvActedOnBehalfOf | ProvWasRevisionOf]> {
  const props = edgeProperties ?? {};
  const sourceId = makeId(sourceNodeType, sourceExternalId);
  const targetId = makeId(targetNodeType, targetExternalId);

  // Check for correction pattern: derived_from + wasRevisionOf property
  if (
    edgeType === 'derived_from' &&
    (props['relation'] === 'wasRevisionOf' || props['relation'] === 'wasRevisionOf')
  ) {
    return [['wasRevisionOf', makeEdgeId('wasRevisionOf', sourceExternalId, targetExternalId), {
      'prov:newEntity': sourceId,
      'prov:oldEntity': targetId,
      'prov:time': (props['corrected_at'] as string) ?? undefined,
      'kadarn:reason': 'Correction via wasRevisionOf pattern',
    } as ProvWasRevisionOf]];
  }

  const rule = EDGE_TYPE_MAPPINGS[edgeType];
  if (!rule) return [];

  switch (rule.relation) {
    case 'wasGeneratedBy': {
      // source (entity) was generated by target (activity)
      return [['wasGeneratedBy', makeEdgeId(edgeType, sourceExternalId, targetExternalId), {
        'prov:generatedEntity': sourceId,
        'prov:usedActivity': targetId,
      } as ProvWasGeneratedBy]];
    }
    case 'used': {
      return [['used', makeEdgeId(edgeType, sourceExternalId, targetExternalId), {
        'prov:usedActivity': sourceId,
        'prov:entity': targetId,
      } as ProvUsed]];
    }
    case 'wasDerivedFrom': {
      return [['wasDerivedFrom', makeEdgeId(edgeType, sourceExternalId, targetExternalId), {
        'prov:generatedEntity': sourceId,
        'prov:usedEntity': targetId,
      } as ProvWasDerivedFrom]];
    }
    case 'wasAttributedTo': {
      return [['wasAttributedTo', makeEdgeId(edgeType, sourceExternalId, targetExternalId), {
        'prov:entity': sourceId,
        'prov:agent': targetId,
      } as ProvWasAttributedTo]];
    }
    case 'wasAssociatedWith': {
      return [['wasAssociatedWith', makeEdgeId(edgeType, sourceExternalId, targetExternalId), {
        'prov:activity': sourceId,
        'prov:agent': targetId,
      } as ProvWasAssociatedWith]];
    }
    case 'actedOnBehalfOf': {
      return [['actedOnBehalfOf', makeEdgeId(edgeType, sourceExternalId, targetExternalId), {
        'prov:agent': sourceId,
        'prov:responsible': targetId,
      } as ProvActedOnBehalfOf]];
    }
    default:
      return [];
  }
}

// --------------------------------------------------------------------------
// ProvDocument assembly
// --------------------------------------------------------------------------

/**
 * Assembled provenance node with resolved PROV data.
 * Intermediate type for building a ProvDocument.
 */
interface ResolvedNode {
  id: ProvIdentifier;
  nodeType: string;
  externalId: string;
  provData: ProvEntity | ProvActivity | ProvAgent | null;
  category: ProvCategory | null;
}

/**
 * Build a complete PROV document from Kadarn provenance data.
 *
 * @param nodes - Array of Kadarn provenance nodes with node_type, external_id, properties
 * @param edges - Array of Kadarn provenance edges with edge_type, source, target, properties
 * @returns A ProvDocument ready for serialization
 */
export function toProvDocument(
  nodes: Array<{
    node_type: string;
    external_id: string;
    label?: string | null;
    properties?: Record<string, unknown>;
    organization_id?: string | null;
  }>,
  edges: Array<{
    edge_type: string;
    source_node_type: string;
    source_external_id: string;
    target_node_type: string;
    target_external_id: string;
    properties?: Record<string, unknown>;
  }>,
): ProvDocument {
  const doc: ProvDocument = {
    prefix: {
      prov: 'http://www.w3.org/ns/prov#',
      kadarn: 'https://kadarn.io/prov/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    },
  };

  const entity: Record<ProvIdentifier, ProvEntity> = {};
  const activity: Record<ProvIdentifier, ProvActivity> = {};
  const agent: Record<ProvIdentifier, ProvAgent> = {};

  // Map nodes
  for (const node of nodes) {
    const nodeProps: Record<string, unknown> = { ...(node.properties ?? {}) };
    if (node.label) nodeProps['label'] = node.label;
    if (node.organization_id) nodeProps['organization_id'] = node.organization_id;

    const provNode = toProvNode(node.node_type, node.external_id, nodeProps);
    if (!provNode) continue;

    const id = makeId(node.node_type, node.external_id);
    const category = getProvCategory(node.node_type);

    if (category === 'Entity') {
      entity[id] = provNode as ProvEntity;
    } else if (category === 'Activity') {
      activity[id] = provNode as ProvActivity;
    } else if (category === 'Agent') {
      agent[id] = provNode as ProvAgent;
    }
  }

  if (Object.keys(entity).length > 0) doc.entity = entity;
  if (Object.keys(activity).length > 0) doc.activity = activity;
  if (Object.keys(agent).length > 0) doc.agent = agent;

  // Map edges
  const wasGeneratedBy: Record<string, ProvWasGeneratedBy> = {};
  const used: Record<string, ProvUsed> = {};
  const wasDerivedFrom: Record<string, ProvWasDerivedFrom> = {};
  const wasAttributedTo: Record<string, ProvWasAttributedTo> = {};
  const wasAssociatedWith: Record<string, ProvWasAssociatedWith> = {};
  const actedOnBehalfOf: Record<string, ProvActedOnBehalfOf> = {};
  const wasRevisionOf: Record<string, ProvWasRevisionOf> = {};

  for (const edge of edges) {
    const relations = toProvRelation(
      edge.edge_type,
      edge.source_node_type,
      edge.source_external_id,
      edge.target_node_type,
      edge.target_external_id,
      edge.properties,
    );

    for (const [relationType, key, relation] of relations) {
      switch (relationType) {
        case 'wasGeneratedBy':
          wasGeneratedBy[key] = relation as ProvWasGeneratedBy;
          break;
        case 'used':
          used[key] = relation as ProvUsed;
          break;
        case 'wasDerivedFrom':
          wasDerivedFrom[key] = relation as ProvWasDerivedFrom;
          break;
        case 'wasAttributedTo':
          wasAttributedTo[key] = relation as ProvWasAttributedTo;
          break;
        case 'wasAssociatedWith':
          wasAssociatedWith[key] = relation as ProvWasAssociatedWith;
          break;
        case 'actedOnBehalfOf':
          actedOnBehalfOf[key] = relation as ProvActedOnBehalfOf;
          break;
        case 'wasRevisionOf':
          wasRevisionOf[key] = relation as ProvWasRevisionOf;
          break;
      }
    }
  }

  if (Object.keys(wasGeneratedBy).length > 0) doc.wasGeneratedBy = wasGeneratedBy;
  if (Object.keys(used).length > 0) doc.used = used;
  if (Object.keys(wasDerivedFrom).length > 0) doc.wasDerivedFrom = wasDerivedFrom;
  if (Object.keys(wasAttributedTo).length > 0) doc.wasAttributedTo = wasAttributedTo;
  if (Object.keys(wasAssociatedWith).length > 0) doc.wasAssociatedWith = wasAssociatedWith;
  if (Object.keys(actedOnBehalfOf).length > 0) doc.actedOnBehalfOf = actedOnBehalfOf;
  if (Object.keys(wasRevisionOf).length > 0) doc.wasRevisionOf = wasRevisionOf;

  return doc;
}
