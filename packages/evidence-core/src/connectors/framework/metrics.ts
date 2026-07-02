// ==========================================================================
// Connector Framework — Metrics Module
// ==========================================================================
// Baseline AF-1.0. Sprint 19.5.
//
// Lightweight metrics contract for evidence acquisition.
// In production, these would feed into OpenTelemetry, Prometheus, or a
// monitoring system. For Sprint 19.5, the contract is defined and values
// are collected in-memory.
// ==========================================================================

export interface ConnectorMetrics {
  /** Connector name */
  connectorName: string;

  /** Cumulative counters */
  connectorCalls: number;
  recordsFound: number;
  recordsResolved: number;
  recordsStaged: number;
  evidenceCreated: number;
  counterEvidenceCreated: number;
  duplicatesSkipped: number;
  errors: number;

  /** Derived rates */
  identitySuccessRate: number;
  duplicateRate: number;
  connectorErrorRate: number;

  /** Latency (last ingest in ms) */
  lastIngestLatencyMs: number;
  averageIngestLatencyMs: number;

  /** Timestamps */
  firstCallAt: string | null;
  lastCallAt: string | null;
}

export function createEmptyMetrics(connectorName: string): ConnectorMetrics {
  return {
    connectorName,
    connectorCalls: 0,
    recordsFound: 0,
    recordsResolved: 0,
    recordsStaged: 0,
    evidenceCreated: 0,
    counterEvidenceCreated: 0,
    duplicatesSkipped: 0,
    errors: 0,
    identitySuccessRate: 0,
    duplicateRate: 0,
    connectorErrorRate: 0,
    lastIngestLatencyMs: 0,
    averageIngestLatencyMs: 0,
    firstCallAt: null,
    lastCallAt: null,
  };
}

export class MetricsCollector {
  private metrics: Map<string, ConnectorMetrics> = new Map();
  private latencies: Map<string, number[]> = new Map();

  getOrCreate(connectorName: string): ConnectorMetrics {
    if (!this.metrics.has(connectorName)) {
      this.metrics.set(connectorName, createEmptyMetrics(connectorName));
    }
    return this.metrics.get(connectorName)!;
  }

  recordCall(connectorName: string, params: {
    recordsFound: number;
    recordsResolved: number;
    recordsStaged: number;
    evidenceCreated: number;
    counterEvidenceCreated: number;
    duplicatesSkipped: number;
    errors: number;
    latencyMs: number;
  }): void {
    const m = this.getOrCreate(connectorName);
    m.connectorCalls++;
    m.recordsFound += params.recordsFound;
    m.recordsResolved += params.recordsResolved;
    m.recordsStaged += params.recordsStaged;
    m.evidenceCreated += params.evidenceCreated;
    m.counterEvidenceCreated += params.counterEvidenceCreated;
    m.duplicatesSkipped += params.duplicatesSkipped;
    m.errors += params.errors;

    m.identitySuccessRate = m.recordsFound > 0 ? Math.min(m.recordsResolved / m.recordsFound, 1.0) : 0;
    m.duplicateRate = m.recordsFound > 0 ? m.duplicatesSkipped / m.recordsFound : 0;
    m.connectorErrorRate = m.recordsFound > 0 ? m.errors / m.recordsFound : 0;

    if (!this.latencies.has(connectorName)) this.latencies.set(connectorName, []);
    this.latencies.get(connectorName)!.push(params.latencyMs);

    m.lastIngestLatencyMs = params.latencyMs;
    const allLatencies = this.latencies.get(connectorName)!;
    m.averageIngestLatencyMs = allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length;

    if (!m.firstCallAt) m.firstCallAt = new Date().toISOString();
    m.lastCallAt = new Date().toISOString();
  }

  getMetrics(connectorName?: string): ConnectorMetrics[] {
    if (connectorName) {
      const m = this.metrics.get(connectorName);
      return m ? [m] : [];
    }
    return Array.from(this.metrics.values());
  }

  reset(): void {
    this.metrics.clear();
    this.latencies.clear();
  }
}
