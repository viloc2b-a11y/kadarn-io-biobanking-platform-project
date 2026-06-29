import { withErrorHandling } from '@/lib/supabase-server'
import { authorizeMetricsScrape } from '@/lib/observability'
import { renderPrometheusText } from '@kadarn/telemetry'

export const GET = withErrorHandling(async (request: Request) => {
  if (!authorizeMetricsScrape(request)) {
    return Response.json(
      { error: { code: 401, message: 'Metrics scrape unauthorized', details: null } },
      { status: 401 },
    )
  }

  const body = renderPrometheusText()
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
})
