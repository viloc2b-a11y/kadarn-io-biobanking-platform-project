import {
  apiSuccessResponse,
  createLivenessReport,
  withInstrumentation,
} from '@kadarn/instrumentation'
import { bootstrapInstrumentation } from '@/lib/instrumentation-bootstrap'

const START_TIME = Date.now()
const VERSION = process.env.npm_package_version ?? '0.2.0'

bootstrapInstrumentation()

export const GET = withInstrumentation('/api/health', async (request: Request) => {
  const memory = process.memoryUsage()
  const report = createLivenessReport(Date.now() - START_TIME, Math.round(memory.heapUsed / 1024 / 1024))

  return apiSuccessResponse({
    app: 'kadarn-api',
    status: report.status,
    version: VERSION,
    environment: process.env.NODE_ENV ?? 'development',
    uptime_ms: Date.now() - START_TIME,
    memory: {
      heap_used_mb: Math.round(memory.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memory.heapTotal / 1024 / 1024),
      rss_mb: Math.round(memory.rss / 1024 / 1024),
    },
    checks: report.checks,
    timestamp: report.timestamp,
  })
})
