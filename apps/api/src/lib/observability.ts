// ==========================================================================
// Observability — API bootstrap and readiness probes
// ==========================================================================

import { createClient } from '@supabase/supabase-js';
import {
  initObservability,
  getObservabilityStatus,
  incrementCounter,
  METRIC_HEALTH_CHECKS,
  logWarn,
} from '@kadarn/telemetry';

export { initObservability, getObservabilityStatus };

const startedAt = Date.now();

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}

export interface ReadinessCheck {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
}

export interface ReadinessReport {
  status: 'ready' | 'not_ready';
  checks: ReadinessCheck[];
  timestamp: string;
}

async function checkDatabase(): Promise<ReadinessCheck> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      name: 'database',
      status: 'degraded',
      message: 'Supabase credentials not configured',
    };
  }

  const start = Date.now();
  try {
    const client = createClient(url, key);
    const { error } = await client
      .from('organizations')
      .select('id', { count: 'exact', head: true });

    const latencyMs = Date.now() - start;
    if (error) {
      return {
        name: 'database',
        status: 'down',
        latencyMs,
        message: error.message,
      };
    }

    return { name: 'database', status: 'ok', latencyMs };
  } catch (err) {
    return {
      name: 'database',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

function checkEventRuntime(): ReadinessCheck {
  return {
    name: 'event_runtime',
    status: 'ok',
    message: 'Domain event runtime loaded',
  };
}

function checkObservability(): ReadinessCheck {
  const status = getObservabilityStatus();
  return {
    name: 'observability',
    status: 'ok',
    message: `tracing=${status.tracing}`,
  };
}

export async function runReadinessChecks(): Promise<ReadinessReport> {
  const checks = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkEventRuntime()),
    Promise.resolve(checkObservability()),
  ]);

  const hasDown = checks.some(c => c.status === 'down');
  const report: ReadinessReport = {
    status: hasDown ? 'not_ready' : 'ready',
    checks,
    timestamp: new Date().toISOString(),
  };

  incrementCounter(METRIC_HEALTH_CHECKS, {
    probe: 'readiness',
    status: report.status,
  });

  if (hasDown) {
    logWarn('readiness.not_ready', { checks: checks.filter(c => c.status === 'down') });
  }

  return report;
}

export function authorizeMetricsScrape(request: Request): boolean {
  const token = process.env.KADARN_METRICS_TOKEN;
  if (!token) return true;
  const header = request.headers.get('authorization');
  return header === `Bearer ${token}`;
}
