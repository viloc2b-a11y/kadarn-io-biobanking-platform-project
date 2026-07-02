import { describe, it, expect } from 'vitest'
import { buildDiscoveryPipelineStatus } from '../../apps/api/src/lib/discovery-pipeline-status'

describe('buildDiscoveryPipelineStatus', () => {
  it('renders all pipeline stages', () => {
    const data = buildDiscoveryPipelineStatus({
      sessionId: 'sess-1',
      run: null,
      artifacts: [],
      layer1Rows: [],
      prepRequests: [],
      agentOutputs: [],
      curationEventCount: 0,
      latestCurationAt: null,
    })

    expect(data.stages).toHaveLength(14)
    expect(data.stages.map((s) => s.id)).toEqual([
      'layer0_artifact',
      'layer1_extraction',
      'semantic_requests',
      'document_classification',
      'entity_extraction',
      'relationship_extraction',
      'timeline_engine',
      'capability_detector',
      'claim_candidate_detector',
      'gap_detector',
      'narrative_engine',
      'institutional_profile',
      'snapshot',
      'curation',
    ])
  })

  it('marks completed stages when artifacts and layer1 exist', () => {
    const data = buildDiscoveryPipelineStatus({
      sessionId: 'sess-1',
      run: { id: 'run-1', status: 'completed', pipeline_version: '20B.1' },
      artifacts: [{ id: 'art-1', created_at: '2026-01-01T00:00:00Z' }],
      layer1Rows: [{
        id: 'l1-1',
        artifact_id: 'art-1',
        status: 'completed',
        extracted_at: '2026-01-01T00:05:00Z',
        error_message: null,
      }],
      prepRequests: [{
        request_id: 'req-1',
        request_type: 'ENTITY_EXTRACTION',
        status: 'COMPLETED',
        error: null,
        created_at: '2026-01-01T00:06:00Z',
        completed_at: '2026-01-01T00:07:00Z',
        failed_at: null,
        updated_at: '2026-01-01T00:07:00Z',
      }],
      agentOutputs: [{
        agent_name: 'entity-extractor',
        status: 'COMPLETED',
        warnings: [],
        created_at: '2026-01-01T00:07:00Z',
      }],
      curationEventCount: 2,
      latestCurationAt: '2026-01-01T01:00:00Z',
    })

    const layer0 = data.stages.find((s) => s.id === 'layer0_artifact')
    const layer1 = data.stages.find((s) => s.id === 'layer1_extraction')
    const entity = data.stages.find((s) => s.id === 'entity_extraction')
    const curation = data.stages.find((s) => s.id === 'curation')

    expect(layer0?.status).toBe('completed')
    expect(layer1?.status).toBe('completed')
    expect(entity?.status).toBe('completed')
    expect(curation?.status).toBe('completed')
    expect(curation?.count).toBe(2)
  })

  it('surfaces failed stage errors', () => {
    const data = buildDiscoveryPipelineStatus({
      sessionId: 'sess-1',
      run: { id: 'run-1', status: 'failed', pipeline_version: '20A.1' },
      artifacts: [{ id: 'art-1', created_at: '2026-01-01T00:00:00Z' }],
      layer1Rows: [{
        id: 'l1-1',
        artifact_id: 'art-1',
        status: 'failed',
        extracted_at: '2026-01-01T00:05:00Z',
        error_message: 'OCR extraction failed',
      }],
      prepRequests: [{
        request_id: 'req-1',
        request_type: 'DOCUMENT_CLASSIFICATION',
        status: 'FAILED',
        error: 'Classifier timeout',
        created_at: '2026-01-01T00:06:00Z',
        completed_at: null,
        failed_at: '2026-01-01T00:08:00Z',
        updated_at: '2026-01-01T00:08:00Z',
      }],
      agentOutputs: [],
      curationEventCount: 0,
      latestCurationAt: null,
    })

    const layer1 = data.stages.find((s) => s.id === 'layer1_extraction')
    const docs = data.stages.find((s) => s.id === 'document_classification')

    expect(layer1?.status).toBe('failed')
    expect(layer1?.errors).toContain('OCR extraction failed')
    expect(docs?.status).toBe('failed')
    expect(docs?.errors).toContain('Classifier timeout')
  })

  it('handles partial data without crashing', () => {
    expect(() => buildDiscoveryPipelineStatus({
      sessionId: 'sess-1',
      run: { id: 'run-1', status: 'running', pipeline_version: '20B.1' },
      artifacts: [{ id: 'art-1', created_at: '2026-01-01T00:00:00Z' }],
      layer1Rows: [],
      prepRequests: [],
      agentOutputs: [],
      curationEventCount: 0,
      latestCurationAt: null,
    })).not.toThrow()

    const data = buildDiscoveryPipelineStatus({
      sessionId: 'sess-1',
      run: { id: 'run-1', status: 'running', pipeline_version: '20B.1' },
      artifacts: [{ id: 'art-1', created_at: '2026-01-01T00:00:00Z' }],
      layer1Rows: [],
      prepRequests: [],
      agentOutputs: [],
      curationEventCount: 0,
      latestCurationAt: null,
    })

    expect(data.stages.every((stage) => stage.status)).toBe(true)
    expect(data.stages.find((s) => s.id === 'entity_extraction')?.status).toBe('not_available')
  })
})
