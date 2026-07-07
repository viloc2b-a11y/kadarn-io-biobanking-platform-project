// ==========================================================================
// Metrics Registry — Prometheus-compatible in-process (AF-4.0 S1)
// Naming: kadarn_<subsystem>_<metric>_<unit>
// ==========================================================================

type Labels = Record<string, string>

interface CounterEntry { value: number; labels: Labels }
interface GaugeEntry { value: number; labels: Labels }
interface HistogramEntry { buckets: number[]; counts: number[]; sum: number; count: number; labels: Labels }

function labelKey(labels: Labels): string {
  return Object.keys(labels).sort().map(k => `${k}="${labels[k]}"`).join(',')
}

function formatLabels(labels: Labels): string {
  const keys = Object.keys(labels).sort()
  if (keys.length === 0) return ''
  return `{${keys.map(k => `${k}="${labels[k]}"`).join(',')}}`
}

export class MetricsRegistry {
  private counters = new Map<string, CounterEntry>()
  private gauges = new Map<string, GaugeEntry>()
  private histograms = new Map<string, HistogramEntry>()
  private readonly defaultBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

  counter(name: string, value = 1, labels: Labels = {}): void {
    const key = `${name}|${labelKey(labels)}`
    const existing = this.counters.get(key)
    if (existing) existing.value += value
    else this.counters.set(key, { value, labels })
  }

  gauge(name: string, value: number, labels: Labels = {}): void {
    const key = `${name}|${labelKey(labels)}`
    this.gauges.set(key, { value, labels })
  }

  histogram(name: string, valueSeconds: number, labels: Labels = {}): void {
    const key = `${name}|${labelKey(labels)}`
    let h = this.histograms.get(key)
    if (!h) {
      h = {
        buckets: [...this.defaultBuckets],
        counts: new Array(this.defaultBuckets.length + 1).fill(0),
        sum: 0,
        count: 0,
        labels,
      }
      this.histograms.set(key, h)
    }
    h.sum += valueSeconds
    h.count += 1
    let placed = false
    for (let i = 0; i < h.buckets.length; i++) {
      if (valueSeconds <= h.buckets[i]) {
        h.counts[i] += 1
        placed = true
        break
      }
    }
    if (!placed) h.counts[h.buckets.length] += 1
  }

  /** Record HTTP request metrics (standard kadarn_http_* names) */
  recordHttpRequest(method: string, route: string, status: number, durationMs: number): void {
    const labels = { method, route, status: String(status) }
    this.counter('kadarn_http_requests_total', 1, labels)
    this.histogram('kadarn_http_request_duration_seconds', durationMs / 1000, { method, route })
    if (status >= 400) {
      this.counter('kadarn_http_errors_total', 1, { method, route, status: String(status) })
    }
  }

  toPrometheusText(): string {
    const lines: string[] = []

    const counterNames = new Set<string>()
    for (const [key] of this.counters) counterNames.add(key.split('|')[0])
    for (const name of counterNames) {
      lines.push(`# TYPE ${name} counter`)
      for (const [key, entry] of this.counters) {
        if (key.split('|')[0] === name) {
          lines.push(`${name}${formatLabels(entry.labels)} ${entry.value}`)
        }
      }
    }

    const gaugeNames = new Set<string>()
    for (const [key] of this.gauges) gaugeNames.add(key.split('|')[0])
    for (const name of gaugeNames) {
      lines.push(`# TYPE ${name} gauge`)
      for (const [key, entry] of this.gauges) {
        if (key.split('|')[0] === name) {
          lines.push(`${name}${formatLabels(entry.labels)} ${entry.value}`)
        }
      }
    }

    const histNames = new Set<string>()
    for (const [key] of this.histograms) histNames.add(key.split('|')[0])
    for (const name of histNames) {
      lines.push(`# TYPE ${name} histogram`)
      for (const [key, h] of this.histograms) {
        if (key.split('|')[0] !== name) continue
        let cumulative = 0
        for (let i = 0; i < h.buckets.length; i++) {
          cumulative += h.counts[i]
          lines.push(`${name}_bucket${formatLabels({ ...h.labels, le: String(h.buckets[i]) })} ${cumulative}`)
        }
        cumulative += h.counts[h.buckets.length]
        lines.push(`${name}_bucket${formatLabels({ ...h.labels, le: '+Inf' })} ${cumulative}`)
        lines.push(`${name}_sum${formatLabels(h.labels)} ${h.sum}`)
        lines.push(`${name}_count${formatLabels(h.labels)} ${h.count}`)
      }
    }

    return lines.join('\n') + (lines.length ? '\n' : '')
  }

  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
  }
}

let globalRegistry = new MetricsRegistry()

export function getMetricsRegistry(): MetricsRegistry {
  return globalRegistry
}

export function resetMetricsRegistry(): void {
  globalRegistry = new MetricsRegistry()
}
