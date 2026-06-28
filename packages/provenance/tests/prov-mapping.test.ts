// ==========================================================================
// Kadarn Provenance — W3C PROV Semantic Mapping Tests
// ==========================================================================
// KAA-003 §8: Semantic Mapping Layer
//
// Tests prove:
//   - sample node → PROV Entity
//   - organization/user actor → PROV Agent
//   - processing activity → PROV Activity
//   - shipment activity → PROV Activity
//   - correction relation → wasRevisionOf
//   - derived_from / wasRevisionOf relation
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  toProvEntity,
  toProvActivity,
  toProvAgent,
  toProvNode,
  toProvRelation,
  toProvDocument,
  getProvCategory,
  getProvType,
} from '../src/prov-mapping.js';

// ---------------------------------------------------------------------------
// Category detection
// ---------------------------------------------------------------------------

describe('getProvCategory()', () => {
  it('maps specimen to Entity', () => {
    expect(getProvCategory('specimen')).toBe('Entity');
  });

  it('maps processing_event to Activity', () => {
    expect(getProvCategory('processing_event')).toBe('Activity');
  });

  it('maps organization to Agent', () => {
    expect(getProvCategory('organization')).toBe('Agent');
  });

  it('returns null for unknown node type', () => {
    expect(getProvCategory('unknown_type')).toBeNull();
  });
});

describe('getProvType()', () => {
  it('returns correct PROV type string for entities', () => {
    expect(getProvType('specimen')).toBe('kadarn:specimen');
    expect(getProvType('aliquot')).toBe('kadarn:aliquot');
    expect(getProvType('consent')).toBe('kadarn:consent');
  });

  it('returns correct PROV type string for activities', () => {
    expect(getProvType('processing_event')).toBe('kadarn:processingEvent');
    expect(getProvType('shipment')).toBe('kadarn:shipment');
  });

  it('returns correct PROV type for agents', () => {
    expect(getProvType('organization')).toBe('prov:Organization');
  });
});

// ---------------------------------------------------------------------------
// Entity mapping
// ---------------------------------------------------------------------------

describe('toProvEntity() — sample node', () => {
  it('maps a specimen node to a PROV Entity', () => {
    const entity = toProvEntity('specimen', 'TUMOR-001', {
      label: 'Primary tumor biopsy',
      organization_id: 'org-1',
      collection_date: '2025-06-15',
      tissue_type: 'breast',
    });

    expect(entity).not.toBeNull();
    expect(entity!['prov:type']).toBe('kadarn:specimen');
    expect(entity!['kadarn:nodeType']).toBe('specimen');
    expect(entity!['kadarn:label']).toBe('Primary tumor biopsy');
    expect(entity!['kadarn:externalId']).toBe('TUMOR-001');
    expect(entity!['kadarn:organizationId']).toBe('org-1');
  });

  it('maps an aliquot node to a PROV Entity', () => {
    const entity = toProvEntity('aliquot', 'ALQ-001', {
      label: 'Serum aliquot A1',
      volume_ul: 500,
    });

    expect(entity).not.toBeNull();
    expect(entity!['prov:type']).toBe('kadarn:aliquot');
    expect(entity!['kadarn:label']).toBe('Serum aliquot A1');
    expect(entity!['kadarn:externalId']).toBe('ALQ-001');
  });

  it('returns null for non-Entity node types', () => {
    expect(toProvEntity('processing_event', 'PE-001')).toBeNull();
    expect(toProvEntity('organization', 'ORG-1')).toBeNull();
    expect(toProvEntity('unknown', 'X')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Activity mapping
// ---------------------------------------------------------------------------

describe('toProvActivity() — processing and shipment', () => {
  it('maps a processing_event node to a PROV Activity', () => {
    const activity = toProvActivity('processing_event', 'PE-001', {
      label: 'DNA extraction - batch B2',
      organization_id: 'org-2',
      protocol: 'PROT-123',
    });

    expect(activity).not.toBeNull();
    expect(activity!['prov:type']).toBe('kadarn:processingEvent');
    expect(activity!['kadarn:nodeType']).toBe('processing_event');
    expect(activity!['kadarn:label']).toBe('DNA extraction - batch B2');
    expect(activity!['kadarn:externalId']).toBe('PE-001');
    expect(activity!['kadarn:organizationId']).toBe('org-2');
  });

  it('maps a shipment node to a PROV Activity', () => {
    const activity = toProvActivity('shipment', 'SHP-789', {
      label: 'Dry ice shipment - org-1 to org-2',
      carrier: 'FedEx',
      tracking: 'FX-123456',
    });

    expect(activity).not.toBeNull();
    expect(activity!['prov:type']).toBe('kadarn:shipment');
    expect(activity!['kadarn:nodeType']).toBe('shipment');
    expect(activity!['kadarn:label']).toBe('Dry ice shipment - org-1 to org-2');
    expect(activity!['kadarn:externalId']).toBe('SHP-789');
  });

  it('returns null for non-Activity node types', () => {
    expect(toProvActivity('specimen', 'S-001')).toBeNull();
    expect(toProvActivity('organization', 'ORG-1')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Agent mapping
// ---------------------------------------------------------------------------

describe('toProvAgent() — organization and user actor', () => {
  it('maps an organization node to a PROV Agent', () => {
    const agent = toProvAgent('organization', 'ORG-1', {
      label: 'University Biorepository',
      country: 'US',
    });

    expect(agent).not.toBeNull();
    expect(agent!['prov:type']).toBe('prov:Organization');
    expect(agent!['kadarn:nodeType']).toBe('organization');
    expect(agent!['kadarn:label']).toBe('University Biorepository');
    expect(agent!['kadarn:externalId']).toBe('ORG-1');
  });

  it('returns null for non-Agent node types', () => {
    expect(toProvAgent('specimen', 'S-001')).toBeNull();
    expect(toProvAgent('processing_event', 'PE-001')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toProvNode() — unified dispatch
// ---------------------------------------------------------------------------

describe('toProvNode()', () => {
  it('dispatches entity types correctly', () => {
    const result = toProvNode('specimen', 'S-001', { label: 'test' });
    expect(result).not.toBeNull();
    expect(result!['prov:type']).toBe('kadarn:specimen');
  });

  it('dispatches activity types correctly', () => {
    const result = toProvNode('processing_event', 'PE-001', { label: 'test' });
    expect(result).not.toBeNull();
    expect(result!['prov:type']).toBe('kadarn:processingEvent');
  });

  it('dispatches agent types correctly', () => {
    const result = toProvNode('organization', 'ORG-1', { label: 'test' });
    expect(result).not.toBeNull();
    expect(result!['prov:type']).toBe('prov:Organization');
  });

  it('returns null for unknown types', () => {
    expect(toProvNode('unknown_type', 'X')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Relation mapping
// ---------------------------------------------------------------------------

describe('toProvRelation() — derived_from / wasRevisionOf', () => {
  it('maps derived_from with wasRevisionOf property to wasRevisionOf relation', () => {
    const result = toProvRelation(
      'derived_from',
      'specimen', 'TUMOR-001',
      'specimen', 'TUMOR-001:correction:1700000000',
      { relation: 'wasRevisionOf', corrected_at: '2025-06-16T10:00:00Z' },
    );

    expect(result).toHaveLength(1);
    const [relationType, key, relation] = result[0];
    expect(relationType).toBe('wasRevisionOf');
    expect(key).toContain('wasRevisionOf');
    expect(relation['prov:newEntity']).toBe('kadarn:specimen-TUMOR-001');
    expect(relation['prov:oldEntity']).toBe('kadarn:specimen-TUMOR-001:correction:1700000000');
    expect(relation['prov:time']).toBe('2025-06-16T10:00:00Z');
  });

  it('maps plain derived_from to wasDerivedFrom', () => {
    const result = toProvRelation(
      'derived_from',
      'dataset', 'DS-001',
      'specimen', 'S-001',
    );

    expect(result).toHaveLength(1);
    const [relationType, , relation] = result[0];
    expect(relationType).toBe('wasDerivedFrom');
    expect(relation['prov:generatedEntity']).toBe('kadarn:dataset-DS-001');
    expect(relation['prov:usedEntity']).toBe('kadarn:specimen-S-001');
  });
});

describe('toProvRelation() — other relations', () => {
  it('maps generated_from to wasGeneratedBy', () => {
    const result = toProvRelation(
      'generated_from',
      'aliquot', 'ALQ-001',
      'processing_event', 'PE-001',
    );

    expect(result).toHaveLength(1);
    const [relationType, , relation] = result[0];
    expect(relationType).toBe('wasGeneratedBy');
    expect(relation['prov:generatedEntity']).toBe('kadarn:aliquot-ALQ-001');
    expect(relation['prov:usedActivity']).toBe('kadarn:processing_event-PE-001');
  });

  it('maps processed_by to wasAssociatedWith', () => {
    const result = toProvRelation(
      'processed_by',
      'processing_event', 'PE-001',
      'organization', 'ORG-2',
    );

    expect(result).toHaveLength(1);
    const [relationType, , relation] = result[0];
    expect(relationType).toBe('wasAssociatedWith');
    expect(relation['prov:activity']).toBe('kadarn:processing_event-PE-001');
    expect(relation['prov:agent']).toBe('kadarn:organization-ORG-2');
  });

  it('maps owned_by to wasAttributedTo', () => {
    const result = toProvRelation(
      'owned_by',
      'dataset', 'DS-001',
      'organization', 'ORG-1',
    );

    expect(result).toHaveLength(1);
    const [relationType, , relation] = result[0];
    expect(relationType).toBe('wasAttributedTo');
    expect(relation['prov:entity']).toBe('kadarn:dataset-DS-001');
    expect(relation['prov:agent']).toBe('kadarn:organization-ORG-1');
  });

  it('returns empty array for unknown edge types', () => {
    const result = toProvRelation(
      'unknown_edge',
      'specimen', 'S-001',
      'specimen', 'S-002',
    );
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ProvDocument assembly
// ---------------------------------------------------------------------------

describe('toProvDocument()', () => {
  it('assembles a complete PROV document from nodes and edges', () => {
    const doc = toProvDocument(
      [
        {
          node_type: 'specimen',
          external_id: 'TUMOR-001',
          label: 'Primary tumor biopsy',
          properties: { tissue_type: 'breast' },
          organization_id: 'ORG-1',
        },
        {
          node_type: 'processing_event',
          external_id: 'PE-001',
          label: 'DNA extraction',
          properties: { protocol: 'PROT-123' },
          organization_id: 'ORG-2',
        },
        {
          node_type: 'organization',
          external_id: 'ORG-1',
          label: 'University Biorepository',
        },
      ],
      [
        {
          edge_type: 'derived_from',
          source_node_type: 'aliquot',
          source_external_id: 'ALQ-001',
          target_node_type: 'specimen',
          target_external_id: 'TUMOR-001',
        },
        {
          edge_type: 'generated_from',
          source_node_type: 'aliquot',
          source_external_id: 'ALQ-001',
          target_node_type: 'processing_event',
          target_external_id: 'PE-001',
        },
        {
          edge_type: 'owned_by',
          source_node_type: 'specimen',
          source_external_id: 'TUMOR-001',
          target_node_type: 'organization',
          target_external_id: 'ORG-1',
        },
      ],
    );

    // Prefix
    expect(doc.prefix.prov).toBe('http://www.w3.org/ns/prov#');
    expect(doc.prefix.kadarn).toBe('https://kadarn.io/prov/');

    // Entities
    expect(doc.entity).toBeDefined();
    expect(Object.keys(doc.entity!)).toContain('kadarn:specimen-TUMOR-001');
    expect(doc.entity!['kadarn:specimen-TUMOR-001']['kadarn:label']).toBe('Primary tumor biopsy');

    // Activities
    expect(doc.activity).toBeDefined();
    expect(Object.keys(doc.activity!)).toContain('kadarn:processing_event-PE-001');
    expect(doc.activity!['kadarn:processing_event-PE-001']['kadarn:label']).toBe('DNA extraction');

    // Agents
    expect(doc.agent).toBeDefined();
    expect(Object.keys(doc.agent!)).toContain('kadarn:organization-ORG-1');
    expect(doc.agent!['kadarn:organization-ORG-1']['kadarn:label']).toBe('University Biorepository');

    // Relations
    expect(doc.wasDerivedFrom).toBeDefined();
    expect(doc.wasGeneratedBy).toBeDefined();
    expect(doc.wasAttributedTo).toBeDefined();
  });

  it('builds an empty document when given no nodes or edges', () => {
    const doc = toProvDocument([], []);
    expect(doc.prefix.prov).toBeDefined();
    expect(doc.entity).toBeUndefined();
    expect(doc.activity).toBeUndefined();
    expect(doc.agent).toBeUndefined();
  });

  it('handles correction edges in document assembly', () => {
    const doc = toProvDocument(
      [
        {
          node_type: 'specimen',
          external_id: 'S-001',
          label: 'Original node',
        },
        {
          node_type: 'specimen',
          external_id: 'S-001:correction:1700000000',
          label: 'Corrected node',
          properties: { correction_of: 'original-id' },
        },
      ],
      [
        {
          edge_type: 'derived_from',
          source_node_type: 'specimen',
          source_external_id: 'S-001:correction:1700000000',
          target_node_type: 'specimen',
          target_external_id: 'S-001',
          properties: {
            relation: 'wasRevisionOf',
            corrected_at: '2025-06-16T10:00:00Z',
          },
        },
      ],
    );

    expect(doc.wasRevisionOf).toBeDefined();
    expect(doc.wasRevisionOf).not.toBeUndefined();
    const revisionKeys = Object.keys(doc.wasRevisionOf!);
    expect(revisionKeys).toHaveLength(1);
    const revision = doc.wasRevisionOf![revisionKeys[0]];
    expect(revision['prov:newEntity']).toBe('kadarn:specimen-S-001:correction:1700000000');
    expect(revision['prov:oldEntity']).toBe('kadarn:specimen-S-001');
    expect(revision['prov:time']).toBe('2025-06-16T10:00:00Z');
  });
});

// ---------------------------------------------------------------------------
// End-to-end scenario: full provenance chain
// ---------------------------------------------------------------------------

describe('E2E: Full provenance chain mapping', () => {
  it('maps a complete specimen processing chain to PROV semantics', () => {
    // Simulate: specimen → processing → aliquot → dataset chain
    const doc = toProvDocument(
      [
        { node_type: 'specimen', external_id: 'S-001', label: 'Tumor biopsy', organization_id: 'ORG-1' },
        { node_type: 'organization', external_id: 'ORG-1', label: 'University Hospital' },
        { node_type: 'processing_event', external_id: 'PE-001', label: 'DNA extraction', organization_id: 'ORG-2' },
        { node_type: 'organization', external_id: 'ORG-2', label: 'Reference Lab' },
        { node_type: 'aliquot', external_id: 'ALQ-001', label: 'Extracted DNA aliquot', organization_id: 'ORG-2' },
        { node_type: 'dataset', external_id: 'DS-001', label: 'Sequencing results', organization_id: 'ORG-2' },
      ],
      [
        { edge_type: 'owned_by', source_node_type: 'specimen', source_external_id: 'S-001', target_node_type: 'organization', target_external_id: 'ORG-1' },
        { edge_type: 'generated_from', source_node_type: 'aliquot', source_external_id: 'ALQ-001', target_node_type: 'processing_event', target_external_id: 'PE-001' },
        { edge_type: 'processed_by', source_node_type: 'processing_event', source_external_id: 'PE-001', target_node_type: 'organization', target_external_id: 'ORG-2' },
        { edge_type: 'derived_from', source_node_type: 'dataset', source_external_id: 'DS-001', target_node_type: 'aliquot', target_external_id: 'ALQ-001' },
      ],
    );

    // All 6 nodes mapped
    expect(Object.keys(doc.entity!)).toHaveLength(3);  // specimen, aliquot, dataset
    expect(Object.keys(doc.activity!)).toHaveLength(1); // processing_event
    expect(Object.keys(doc.agent!)).toHaveLength(2);    // ORG-1, ORG-2

    // All 4 edges mapped
    expect(Object.keys(doc.wasAttributedTo!)).toHaveLength(1);   // owned_by
    expect(Object.keys(doc.wasGeneratedBy!)).toHaveLength(1);    // generated_from
    expect(Object.keys(doc.wasAssociatedWith!)).toHaveLength(1); // processed_by
    expect(Object.keys(doc.wasDerivedFrom!)).toHaveLength(1);    // derived_from

    // Verify the chain semantics
    // S-001 wasAttributedTo ORG-1 (specimen belongs to hospital)
    const attrKey = Object.keys(doc.wasAttributedTo!)[0];
    expect(doc.wasAttributedTo![attrKey]['prov:entity']).toBe('kadarn:specimen-S-001');
    expect(doc.wasAttributedTo![attrKey]['prov:agent']).toBe('kadarn:organization-ORG-1');

    // PE-001 wasAssociatedWith ORG-2 (processing done by lab)
    const assocKey = Object.keys(doc.wasAssociatedWith!)[0];
    expect(doc.wasAssociatedWith![assocKey]['prov:agent']).toBe('kadarn:organization-ORG-2');

    // ALQ-001 wasGeneratedBy PE-001 (aliquot from processing)
    const genKey = Object.keys(doc.wasGeneratedBy!)[0];
    expect(doc.wasGeneratedBy![genKey]['prov:usedActivity']).toBe('kadarn:processing_event-PE-001');

    // DS-001 wasDerivedFrom ALQ-001 (dataset from aliquot)
    const derivedKey = Object.keys(doc.wasDerivedFrom!)[0];
    expect(doc.wasDerivedFrom![derivedKey]['prov:generatedEntity']).toBe('kadarn:dataset-DS-001');
  });
});
