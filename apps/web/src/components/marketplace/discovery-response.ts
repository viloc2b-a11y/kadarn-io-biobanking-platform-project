export interface MarketplaceSearchEnvelope<T> {
  results: T[]
  total: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTotal(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function normalizeMarketplaceSearchResponse<T>(json: unknown): MarketplaceSearchEnvelope<T> {
  if (!isRecord(json)) return { results: [], total: 0 }

  const data = json.data

  if (Array.isArray(data)) {
    return { results: data as T[], total: data.length }
  }

  if (!isRecord(data)) return { results: [], total: 0 }

  const results = Array.isArray(data.results) ? data.results as T[] : []
  return {
    results,
    total: readTotal(data.total, results.length),
  }
}
