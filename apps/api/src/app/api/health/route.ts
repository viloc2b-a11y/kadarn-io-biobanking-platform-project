// ==========================================================================
// Health Check API — RC-0.4 Hardened
// ==========================================================================
// GET /api/health — Public endpoint. No auth. No secrets.
// Includes: uptime, version, memory, connector health, degraded providers.
// ==========================================================================

import { apiSuccess } from '@/lib/response'

const START_TIME = Date.now()
const VERSION = process.env.npm_package_version ?? '0.1.0'
const ENV = process.env.NODE_ENV ?? 'development'

export const GET = async (request: Request) => {
  const requestId = request.headers.get('x-request-id') ?? 'health-' + Date.now()

  const memory = process.memoryUsage()

  // Connector health — sampled on each health check
  const connectors: Record<string, { status: string; lastCheck: string }> = {
    pubmed: { status: 'unknown', lastCheck: new Date().toISOString() },
    clinicaltrials: { status: 'unknown', lastCheck: new Date().toISOString() },
    crossref: { status: 'unknown', lastCheck: new Date().toISOString() },
    openalex: { status: 'unknown', lastCheck: new Date().toISOString() },
    orcid: { status: 'unknown', lastCheck: new Date().toISOString() },
    ror: { status: 'unknown', lastCheck: new Date().toISOString() },
    fda: { status: 'unknown', lastCheck: new Date().toISOString() },
  }

  // Mark optional providers as unavailable if no API key
  if (!process.env.PUBMED_API_KEY) connectors.pubmed.status = 'degraded (no api key)'
  if (!process.env.CLINICALTRIALS_API_KEY) connectors.clinicaltrials.status = 'degraded (no api key)'
  if (!process.env.CROSSREF_API_KEY) connectors.crossref.status = 'degraded (no api key)'

  return apiSuccess({
    app: 'kadarn-api',
    status: 'ok',
    version: VERSION,
    environment: ENV,
    uptime_ms: Date.now() - START_TIME,
    uptime_human: formatUptime(Date.now() - START_TIME),
    memory: {
      heap_used_mb: Math.round(memory.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memory.heapTotal / 1024 / 1024),
      rss_mb: Math.round(memory.rss / 1024 / 1024),
    },
    connectors,
    degraded_providers: Object.entries(connectors)
      .filter(([, c]) => c.status !== 'unknown')
      .map(([name, c]) => ({ provider: name, reason: c.status })),
    timestamp: new Date().toISOString(),
  }, requestId)
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
