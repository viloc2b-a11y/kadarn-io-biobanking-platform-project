import { ConsoleLogger } from '@kadarn/platform-services'
import { getHealthAggregator } from './health.js'
import { setLogger } from './logger.js'
import { getMetricsRegistry } from './metrics.js'

export interface InstrumentationConfig {
  service: string
  /** Register default readiness checks */
  supabasePing?: () => Promise<boolean>
}

let initialized = false

export function initInstrumentation(config: InstrumentationConfig): void {
  if (initialized) return
  initialized = true

  setLogger(new ConsoleLogger({ service: config.service }))
  // Tracer: default NoopTracer from @kadarn/telemetry until Sprint 2 OTel exporter

  const health = getHealthAggregator()
  health.register('config', () => ({
    name: 'config',
    status: process.env.SUPABASE_URL ? 'ok' : 'degraded',
    message: process.env.SUPABASE_URL ? 'env present' : 'SUPABASE_URL missing',
  }))

  if (config.supabasePing) {
    health.register('supabase', async () => {
      const ok = await config.supabasePing!()
      return {
        name: 'supabase',
        status: ok ? 'ok' : 'fail',
        message: ok ? 'reachable' : 'unreachable',
      }
    })
  }

  getMetricsRegistry().gauge('kadarn_instrumentation_initialized', 1, { service: config.service })
}

export function isInstrumentationInitialized(): boolean {
  return initialized
}
