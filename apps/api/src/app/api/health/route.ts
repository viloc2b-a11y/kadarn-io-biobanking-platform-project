import { withErrorHandling } from '@/lib/supabase-server'
import { getObservabilityStatus, getUptimeSeconds } from '@/lib/observability'
import { incrementCounter, METRIC_HEALTH_CHECKS } from '@kadarn/telemetry'

export const GET = withErrorHandling(async () => {
  incrementCounter(METRIC_HEALTH_CHECKS, { probe: 'liveness', status: 'ok' })

  return Response.json({
    status: 'ok',
    version: '1.0.0-hardening.11',
    api_version: 'v1',
    uptime_seconds: getUptimeSeconds(),
    observability: getObservabilityStatus(),
    timestamp: new Date().toISOString(),
  })
})
