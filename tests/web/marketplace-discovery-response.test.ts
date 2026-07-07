import { describe, expect, it } from 'vitest'
import { normalizeMarketplaceSearchResponse } from '../../apps/web/src/components/marketplace/discovery-response'

describe('normalizeMarketplaceSearchResponse', () => {
  it('normalizes current marketplace envelopes', () => {
    const response = normalizeMarketplaceSearchResponse<{ id: string }>({
      data: {
        results: [{ id: 'asset-1' }],
        total: 3,
      },
      error: null,
    })

    expect(response.results).toEqual([{ id: 'asset-1' }])
    expect(response.total).toBe(3)
  })

  it('keeps legacy array payloads from crashing the marketplace page', () => {
    const response = normalizeMarketplaceSearchResponse<{ id: string }>({
      data: [{ id: 'legacy-asset' }],
      error: null,
    })

    expect(response.results).toEqual([{ id: 'legacy-asset' }])
    expect(response.total).toBe(1)
  })

  it('defaults missing result arrays to an empty state', () => {
    const response = normalizeMarketplaceSearchResponse<{ id: string }>({
      data: {},
      error: null,
    })

    expect(response.results).toEqual([])
    expect(response.total).toBe(0)
  })
})
