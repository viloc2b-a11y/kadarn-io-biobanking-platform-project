import { withErrorHandling } from '@/lib/supabase-server'
import { runReadinessChecks } from '@/lib/observability'
import { withAsyncTracing, SPAN_HEALTH_CHECK } from '@kadarn/telemetry'

export const GET = withAsyncTracing(
  withErrorHandling(async () => {
    const report = await runReadinessChecks()
    const status = report.status === 'ready' ? 200 : 503

    return Response.json(report, { status })
  }),
  SPAN_HEALTH_CHECK,
)
