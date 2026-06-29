// ==========================================================================
// Kadarn Telemetry — In-memory metrics (Prometheus text exposition)
// ==========================================================================

export type MetricLabels = Record<string, string>;

interface CounterSeries {
  labels: MetricLabels;
  value: number;
}

interface HistogramSeries {
  labels: MetricLabels;
  sum: number;
  count: number;
  buckets: Map<number, number>;
}

const COUNTERS = new Map<string, CounterSeries[]>();
const HISTOGRAMS = new Map<string, HistogramSeries[]>();

const DEFAULT_HISTOGRAM_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

function labelKey(labels: MetricLabels): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('|');
}

function formatPrometheusLabels(labels: MetricLabels): string {
  const entries = Object.entries(labels);
  if (entries.length === 0) return '';
  return `{${entries.map(([k, v]) => `${k}="${String(v).replace(/"/g, '\\"')}"`).join(',')}}`;
}

function getOrCreateCounter(name: string, labels: MetricLabels): CounterSeries {
  const key = labelKey(labels);
  let series = COUNTERS.get(name);
  if (!series) {
    series = [];
    COUNTERS.set(name, series);
  }
  let entry = series.find(s => labelKey(s.labels) === key);
  if (!entry) {
    entry = { labels: { ...labels }, value: 0 };
    series.push(entry);
  }
  return entry;
}

function getOrCreateHistogram(name: string, labels: MetricLabels): HistogramSeries {
  const key = labelKey(labels);
  let series = HISTOGRAMS.get(name);
  if (!series) {
    series = [];
    HISTOGRAMS.set(name, series);
  }
  let entry = series.find(s => labelKey(s.labels) === key);
  if (!entry) {
    entry = {
      labels: { ...labels },
      sum: 0,
      count: 0,
      buckets: new Map(DEFAULT_HISTOGRAM_BUCKETS.map(b => [b, 0])),
    };
    series.push(entry);
  }
  return entry;
}

export function incrementCounter(
  name: string,
  labels: MetricLabels = {},
  delta = 1,
): void {
  getOrCreateCounter(name, labels).value += delta;
}

export function observeHistogram(
  name: string,
  value: number,
  labels: MetricLabels = {},
): void {
  const entry = getOrCreateHistogram(name, labels);
  entry.sum += value;
  entry.count += 1;
  for (const bucket of DEFAULT_HISTOGRAM_BUCKETS) {
    if (value <= bucket) {
      entry.buckets.set(bucket, (entry.buckets.get(bucket) ?? 0) + 1);
    }
  }
}

export interface MetricsSnapshot {
  counters: Array<{ name: string; labels: MetricLabels; value: number }>;
  histograms: Array<{ name: string; labels: MetricLabels; sum: number; count: number }>;
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const counters: MetricsSnapshot['counters'] = [];
  for (const [name, series] of COUNTERS) {
    for (const s of series) {
      counters.push({ name, labels: s.labels, value: s.value });
    }
  }

  const histograms: MetricsSnapshot['histograms'] = [];
  for (const [name, series] of HISTOGRAMS) {
    for (const s of series) {
      histograms.push({ name, labels: s.labels, sum: s.sum, count: s.count });
    }
  }

  return { counters, histograms };
}

export function renderPrometheusText(): string {
  const lines: string[] = [];

  for (const [name, series] of COUNTERS) {
    lines.push(`# TYPE ${name} counter`);
    for (const s of series) {
      lines.push(`${name}${formatPrometheusLabels(s.labels)} ${s.value}`);
    }
  }

  for (const [name, series] of HISTOGRAMS) {
    lines.push(`# TYPE ${name} histogram`);
    for (const s of series) {
      let cumulative = 0;
      for (const bucket of DEFAULT_HISTOGRAM_BUCKETS) {
        cumulative += s.buckets.get(bucket) ?? 0;
        lines.push(`${name}_bucket${formatPrometheusLabels({ ...s.labels, le: String(bucket) })} ${cumulative}`);
      }
      lines.push(`${name}_bucket${formatPrometheusLabels({ ...s.labels, le: '+Inf' })} ${s.count}`);
      lines.push(`${name}_sum${formatPrometheusLabels(s.labels)} ${s.sum}`);
      lines.push(`${name}_count${formatPrometheusLabels(s.labels)} ${s.count}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

/** Reset all metrics (tests only). */
export function resetMetrics(): void {
  COUNTERS.clear();
  HISTOGRAMS.clear();
}
