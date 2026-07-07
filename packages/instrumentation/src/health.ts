export type HealthStatus = 'ok' | 'degraded' | 'fail'

export interface HealthCheckResult {
  name: string
  status: HealthStatus
  message?: string
  durationMs?: number
}

export interface HealthReport {
  status: HealthStatus
  checks: HealthCheckResult[]
  timestamp: string
}

export type HealthCheckFn = () => Promise<HealthCheckResult> | HealthCheckResult

export class HealthAggregator {
  private checks: Map<string, HealthCheckFn> = new Map()

  register(name: string, fn: HealthCheckFn): void {
    this.checks.set(name, fn)
  }

  async run(): Promise<HealthReport> {
    const results: HealthCheckResult[] = []
    let overall: HealthStatus = 'ok'

    for (const [name, fn] of this.checks) {
      const start = Date.now()
      try {
        const result = await fn()
        results.push({ ...result, name: result.name || name, durationMs: Date.now() - start })
        if (result.status === 'fail') overall = 'fail'
        else if (result.status === 'degraded' && overall === 'ok') overall = 'degraded'
      } catch (e) {
        results.push({
          name,
          status: 'fail',
          message: e instanceof Error ? e.message : String(e),
          durationMs: Date.now() - start,
        })
        overall = 'fail'
      }
    }

    return { status: overall, checks: results, timestamp: new Date().toISOString() }
  }
}

let globalHealth = new HealthAggregator()

export function getHealthAggregator(): HealthAggregator {
  return globalHealth
}

export function createLivenessReport(uptimeMs: number, memoryMb: number): HealthReport {
  return {
    status: 'ok',
    checks: [
      { name: 'process', status: 'ok', message: `uptime ${uptimeMs}ms` },
      { name: 'memory', status: memoryMb > 1024 ? 'degraded' : 'ok', message: `${memoryMb}MB heap` },
    ],
    timestamp: new Date().toISOString(),
  }
}
