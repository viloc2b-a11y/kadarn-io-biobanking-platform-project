// ==========================================================================
// Health Check API — Sprint 25E
// ==========================================================================
// GET /api/health
// Returns API health status. Public endpoint. No auth required.
// ==========================================================================

export const GET = async () => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '0.2.0',
    phase: 'Phase 6 — Commercial Readiness',
  }

  return Response.json({ data: health, error: null })
}
