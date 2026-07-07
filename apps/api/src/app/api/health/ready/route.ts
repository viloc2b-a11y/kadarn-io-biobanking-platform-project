import {
  apiSuccessResponse,
  getHealthAggregator,
  withInstrumentation,
} from '@kadarn/instrumentation'
import { bootstrapInstrumentation } from '@/lib/instrumentation-bootstrap'

bootstrapInstrumentation()

export const GET = withInstrumentation('/api/health/ready', async () => {
  const report = await getHealthAggregator().run()
  const status = report.status === 'ok' ? 200 : report.status === 'degraded' ? 200 : 503

  return apiSuccessResponse({
    ready: report.status !== 'fail',
    status: report.status,
    checks: report.checks,
    timestamp: report.timestamp,
  }, status)
})
