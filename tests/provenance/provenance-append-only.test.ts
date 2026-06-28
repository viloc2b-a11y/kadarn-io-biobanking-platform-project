// ==========================================================================
// Kadarn Provenance Engine — Append-Only Constraint Tests
// ==========================================================================
// KAA-003 Section 12: Provenance records are append-only by design.
// This is not a technical preference — it is a regulatory requirement.
//
// These tests verify the API-layer enforcement (not DB triggers, which are
// covered by migration 032_provenance_append_only.sql).
// ==========================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Types mirroring the provenance API contract
// ---------------------------------------------------------------------------

type IntegrityStatus = 'complete' | 'warning' | 'missing_evidence'

interface ProvenanceNode {
  id: string
  node_type: string
  external_id: string
  label: string | null
  properties: Record<string, unknown>
  organization_id: string | null
  recorded_at: string
}

interface IntegrityResult {
  node_id: string
  integrity_status: IntegrityStatus
}

// ---------------------------------------------------------------------------
// Inline integrity_status logic (mirrors provenance_node_integrity_status DB fn)
// Used to test the logic independently of the database.
// ---------------------------------------------------------------------------

const CRITICAL_NODE_TYPES = new Set(['specimen', 'aliquot', 'consent', 'shipment'])

function computeIntegrityStatus(
  nodeType: string,
  evidenceCount: number,
  edgeCount: number,
): IntegrityStatus {
  if (evidenceCount === 0 && CRITICAL_NODE_TYPES.has(nodeType)) return 'missing_evidence'
  if (edgeCount === 0) return 'warning'
  return 'complete'
}

// ---------------------------------------------------------------------------
// ensure_provenance_node simulation (mirrors DB fn with ON CONFLICT DO NOTHING)
// ---------------------------------------------------------------------------
// The DB function inserts a node and returns its id. If a node with the same
// node_type + external_id already exists, it returns the existing id without
// modifying the existing row. This is the "no mutation" guarantee.
// ---------------------------------------------------------------------------

function createEnsureProvenanceNode() {
  const store = new Map<string, ProvenanceNode>()

  const key = (node_type: string, external_id: string): string => `${node_type}::${external_id}`

  return {
    ensure(
      node_type: string,
      external_id: string,
      label: string | null,
      properties: Record<string, unknown>,
      organization_id: string | null,
    ): { id: string; wasInserted: boolean } {
      const k = key(node_type, external_id)
      const existing = store.get(k)
      if (existing) {
        return { id: existing.id, wasInserted: false }
      }
      const node: ProvenanceNode = {
        id: `node-${crypto.randomUUID()}`,
        node_type,
        external_id,
        label,
        properties,
        organization_id,
        recorded_at: new Date().toISOString(),
      }
      store.set(k, node)
      return { id: node.id, wasInserted: true }
    },

    snapshot(): ProvenanceNode[] {
      return Array.from(store.values())
    },

    get(node_type: string, external_id: string): ProvenanceNode | undefined {
      return store.get(key(node_type, external_id))
    },
  }
}

// ---------------------------------------------------------------------------
// Correction pattern helpers (mirrors upsert_provenance_node DB fn behavior)
// ---------------------------------------------------------------------------

interface CorrectionNode {
  original_id: string
  correction_id: string
  properties: Record<string, unknown>
  edge_type: 'derived_from'
  edge_properties: { relation: 'wasRevisionOf' }
}

function buildCorrectionNode(originalId: string, correctedProperties: Record<string, unknown>): CorrectionNode {
  return {
    original_id: originalId,
    correction_id: `correction-${Date.now()}`,
    properties: {
      ...correctedProperties,
      correction_of: originalId,
      corrected_at: new Date().toISOString(),
    },
    edge_type: 'derived_from',
    edge_properties: { relation: 'wasRevisionOf' },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Provenance append-only constraint', () => {
  describe('integrity_status computation', () => {
    it('returns complete for critical node with evidence and edges', () => {
      expect(computeIntegrityStatus('specimen', 2, 1)).toBe('complete')
    })

    it('returns missing_evidence for critical node with no evidence', () => {
      expect(computeIntegrityStatus('specimen', 0, 3)).toBe('missing_evidence')
      expect(computeIntegrityStatus('aliquot', 0, 1)).toBe('missing_evidence')
      expect(computeIntegrityStatus('consent', 0, 2)).toBe('missing_evidence')
      expect(computeIntegrityStatus('shipment', 0, 1)).toBe('missing_evidence')
    })

    it('returns warning for non-critical node with no edges', () => {
      expect(computeIntegrityStatus('protocol', 0, 0)).toBe('warning')
      expect(computeIntegrityStatus('program', 2, 0)).toBe('warning')
      expect(computeIntegrityStatus('dataset', 1, 0)).toBe('warning')
    })

    it('returns warning for critical node with evidence but no edges', () => {
      expect(computeIntegrityStatus('specimen', 1, 0)).toBe('warning')
    })

    it('does not flag non-critical nodes as missing_evidence even without evidence', () => {
      expect(computeIntegrityStatus('policy_evaluation', 0, 1)).toBe('complete')
      expect(computeIntegrityStatus('protocol', 0, 1)).toBe('complete')
    })
  })

  describe('correction pattern', () => {
    it('builds a correction node that references the original via wasRevisionOf', () => {
      const originalId = 'node-abc-123'
      const correction = buildCorrectionNode(originalId, { label: 'corrected label' })

      expect(correction.original_id).toBe(originalId)
      expect(correction.properties.correction_of).toBe(originalId)
      expect(correction.properties.corrected_at).toBeDefined()
      expect(correction.edge_type).toBe('derived_from')
      expect(correction.edge_properties.relation).toBe('wasRevisionOf')
    })

    it('correction node is a new record, not a mutation of the original', () => {
      const originalId = 'node-abc-123'
      const correction = buildCorrectionNode(originalId, { label: 'new label' })

      expect(correction.correction_id).not.toBe(originalId)
      expect(correction.correction_id).toMatch(/^correction-/)
    })
  })

  describe('append-only invariants', () => {
    it('a provenance chain grows only by appending new nodes', () => {
      const chain: ProvenanceNode[] = []

      const addNode = (node: ProvenanceNode) => {
        chain.push(node)
      }

      const specimen: ProvenanceNode = {
        id: 'node-1',
        node_type: 'specimen',
        external_id: 'spec-001',
        label: 'Primary tumor biopsy',
        properties: {},
        organization_id: 'org-1',
        recorded_at: new Date().toISOString(),
      }
      addNode(specimen)
      expect(chain).toHaveLength(1)

      const correction = buildCorrectionNode(specimen.id, { label: 'corrected label' })
      const correctionNode: ProvenanceNode = {
        id: correction.correction_id,
        node_type: 'specimen',
        external_id: 'spec-001:correction',
        label: 'corrected label',
        properties: correction.properties,
        organization_id: 'org-1',
        recorded_at: new Date().toISOString(),
      }
      addNode(correctionNode)

      expect(chain).toHaveLength(2)
      expect(chain[0].label).toBe('Primary tumor biopsy')
      expect(chain[1].properties.correction_of).toBe('node-1')
    })

    it('summary counts reflect all nodes in the chain including corrections', () => {
      const nodes = [
        { node_type: 'specimen', evidenceCount: 1, edgeCount: 2 },
        { node_type: 'aliquot',  evidenceCount: 0, edgeCount: 1 },
        { node_type: 'consent',  evidenceCount: 0, edgeCount: 0 },
        { node_type: 'protocol', evidenceCount: 0, edgeCount: 1 },
      ]

      const statuses = nodes.map(n => computeIntegrityStatus(n.node_type, n.evidenceCount, n.edgeCount))

      expect(statuses.filter(s => s === 'complete')).toHaveLength(2)
      expect(statuses.filter(s => s === 'missing_evidence')).toHaveLength(2)
      expect(statuses.filter(s => s === 'warning')).toHaveLength(0)
    })
  })

  describe('ensure_provenance_node — no mutation on duplicate', () => {
    it('first insert creates a new node and returns its id', () => {
      const store = createEnsureProvenanceNode()
      const result = store.ensure('specimen', 'spec-001', 'Primary tumor', {}, 'org-1')
      expect(result.wasInserted).toBe(true)
      expect(result.id).toBeTruthy()
      expect(store.snapshot()).toHaveLength(1)
    })

    it('duplicate insert with same key returns existing id without mutating', () => {
      const store = createEnsureProvenanceNode()
      const first = store.ensure('specimen', 'spec-001', 'Original label', { key: 'original' }, 'org-1')
      expect(first.wasInserted).toBe(true)
      const second = store.ensure('specimen', 'spec-001', 'Different label', { key: 'different' }, 'org-2')
      expect(second.wasInserted).toBe(false)
      expect(second.id).toBe(first.id)
      const node = store.get('specimen', 'spec-001')
      expect(node.label).toBe('Original label')
      expect(node.properties).toEqual({ key: 'original' })
      expect(node.organization_id).toBe('org-1')
    })

    it('different key pair creates separate nodes', () => {
      const store = createEnsureProvenanceNode()
      const a = store.ensure('specimen', 'spec-001', 'A', {}, 'org-1')
      const b = store.ensure('aliquot', 'spec-001', 'B', {}, 'org-1')
      const c = store.ensure('specimen', 'spec-002', 'C', {}, 'org-1')
      expect(a.wasInserted).toBe(true)
      expect(b.wasInserted).toBe(true)
      expect(c.wasInserted).toBe(true)
      expect(a.id).not.toBe(b.id)
      expect(a.id).not.toBe(c.id)
      expect(store.snapshot()).toHaveLength(3)
    })

    it('chain stays append-only: duplicates do not grow the store', () => {
      const store = createEnsureProvenanceNode()
      store.ensure('specimen', 'spec-001', 'Original', {}, 'org-1')
      expect(store.snapshot()).toHaveLength(1)
      store.ensure('specimen', 'spec-001', 'Attempt 2', {}, 'org-2')
      store.ensure('specimen', 'spec-001', 'Attempt 3', {}, 'org-3')
      store.ensure('specimen', 'spec-001', 'Attempt 4', {}, 'org-4')
      expect(store.snapshot()).toHaveLength(1)
      expect(store.get('specimen', 'spec-001').label).toBe('Original')
    })
  })

  describe('API route — no mutating endpoints exposed', () => {
    it('provenance route exports only GET and POST (no PUT/PATCH/DELETE)', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const root = path.resolve(import.meta.dirname, '..', '..')
      const routePath = path.join(root, 'apps/api/src/app/api/v1/operations/provenance/route.ts')
      const source = fs.readFileSync(routePath, 'utf-8')
      const exportPattern = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\b/g
      const methods = []
      let match
      while ((match = exportPattern.exec(source)) !== null) {
        methods.push(match[1])
      }
      expect(methods).toContain('GET')
      expect(methods).toContain('POST')
      expect(methods).not.toContain('PUT')
      expect(methods).not.toContain('PATCH')
      expect(methods).not.toContain('DELETE')
      expect(methods).toHaveLength(2)
    })
  })

  describe('DB integrity_status is the source of truth', () => {
    it('GET route references provenance_node_integrity_status_batch RPC', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const root = path.resolve(import.meta.dirname, '..', '..')
      const routePath = path.join(root, 'apps/api/src/app/api/v1/operations/provenance/route.ts')
      const source = fs.readFileSync(routePath, 'utf-8')
      expect(source).toContain('provenance_node_integrity_status_batch')
      expect(source).toContain('provenance_node_integrity_status')
    })

    it('migration 032 defines integrity_status as STABLE function, not column', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const root = path.resolve(import.meta.dirname, '..', '..')
      const migrationPath = path.join(root, 'database/migrations/032_provenance_append_only.sql')
      const source = fs.readFileSync(migrationPath, 'utf-8')
      expect(source).toContain('provenance_node_integrity_status')
      expect(source).toContain('STABLE')
    })
  })
})
