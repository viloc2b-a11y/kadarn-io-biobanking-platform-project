import { getMetricsRegistry, withInstrumentation } from '@kadarn/instrumentation'
import { bootstrapInstrumentation } from '@/lib/instrumentation-bootstrap'

bootstrapInstrumentation()

export const GET = withInstrumentation('/api/metrics', async () => {
  const body = getMetricsRegistry().toPrometheusText()
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
})
