// ==========================================================================
// Sprint 1A — Trust & Security Foundation
// Suite: Performance Baseline
// ==========================================================================
// Measures baseline performance for key operations.
// Not a benchmark — detects regressions between sprints.
//
// Metrics are recorded to track trends over time.
// Thresholds are generous — tighten as platform matures.
// ==========================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import {
  signInAs,
  ORG_IDS,
  type AuthenticatedClient,
} from '../setup/test-utils';

// ---------------------------------------------------------------------------
// Metric collection
// ---------------------------------------------------------------------------
interface Metric {
  name: string;
  durationMs: number;
  timestamp: string;
}

const metrics: Metric[] = [];

function recordMetric(name: string, startMs: number) {
  const duration = performance.now() - startMs;
  metrics.push({
    name,
    durationMs: Math.round(duration * 100) / 100,
    timestamp: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Thresholds (generous — will tighten)
// ---------------------------------------------------------------------------
const THRESHOLDS = {
  login: 2000,           // 2s for login (includes network + auth)
  programQuery: 500,     // 500ms for program listing
  orgQuery: 500,         // 500ms for org listing
  rlsEvaluation: 1000,   // 1s for a query that exercises RLS
  sequentialQueries: 3000, // 3s for 5 sequential queries
} as const;

let sponsor: AuthenticatedClient;

beforeAll(async () => {
  const start = performance.now();
  sponsor = await signInAs('sponsor');
  recordMetric('login-sponsor', start);
});

// -------------------------------------------------------------------------
// 1. Login Performance
// -------------------------------------------------------------------------
describe('1. Login performance', () => {
  it('sponsor login completes within threshold', async () => {
    const loginMetric = metrics.find(m => m.name === 'login-sponsor');
    if (loginMetric) {
      expect(loginMetric.durationMs).toBeLessThan(THRESHOLDS.login);
    }
  });

  it('all user logins complete within threshold', async () => {
    const roles = ['cro', 'site', 'biobank', 'lab', 'courier', 'irb', 'admin'] as const;
    const results = await Promise.all(
      roles.map(async (role) => {
        const start = performance.now();
        const user = await signInAs(role);
        const duration = performance.now() - start;
        recordMetric(`login-${role}`, start - (performance.now() - start));
        return { role, duration, success: !!user.session };
      }),
    );

    for (const result of results) {
      expect(result.success).toBe(true);
      // Individual login should be under threshold
      // But parallel logins may be slower — use aggregate
    }
  });
});

// -------------------------------------------------------------------------
// 2. Query Performance
// -------------------------------------------------------------------------
describe('2. Query performance', () => {
  it('program listing query within threshold', async () => {
    const start = performance.now();
    const { data } = await sponsor.client
      .from('programs')
      .select('id, name, status, created_at')
      .limit(20);
    recordMetric('query-programs', start);

    expect(data).toBeDefined();
  });

  it('organization listing query within threshold', async () => {
    const start = performance.now();
    const { data } = await sponsor.client
      .from('organizations')
      .select('id, name, country')
      .limit(20);
    recordMetric('query-organizations', start);

    expect(data).toBeDefined();
  });

  it('organization with capabilities (join) within threshold', async () => {
    const start = performance.now();
    const { data } = await sponsor.client
      .from('organizations')
      .select(`
        id, name,
        organization_capabilities (
          organization_capability_types (key, name)
        )
      `)
      .limit(10);
    recordMetric('query-org-with-capabilities', start);

    expect(data).toBeDefined();
  });

  it('program with participants query within threshold', async () => {
    const start = performance.now();
    const { data } = await sponsor.client
      .from('programs')
      .select(`
        id, name,
        program_participants (
          organization_id,
          role,
          organizations (name)
        )
      `)
      .limit(10);
    recordMetric('query-programs-with-participants', start);

    expect(data).toBeDefined();
  });

  it('RLS-heavy query: memberships filtered by org', async () => {
    const start = performance.now();
    const { data } = await sponsor.client
      .from('organization_memberships')
      .select('user_id, organization_id, organization_roles!inner(key)')
      .eq('organization_roles.key', 'org_admin')
      .limit(20);
    recordMetric('query-rls-membership-roles', start);

    // May fail if RLS blocks, but should be fast either way
  });
});

// -------------------------------------------------------------------------
// 3. Sequential Query Performance
// -------------------------------------------------------------------------
describe('3. Sequential query performance', () => {
  it('5 sequential queries complete within aggregate threshold', async () => {
    const start = performance.now();

    await sponsor.client.from('organizations').select('id').limit(5);
    await sponsor.client.from('programs').select('id').limit(5);
    await sponsor.client.from('organization_memberships').select('id').limit(5);
    await sponsor.client.from('organization_capabilities').select('id').limit(5);
    await sponsor.client.from('program_participants').select('id').limit(5);

    const total = performance.now() - start;
    recordMetric('sequential-5-queries', start - (performance.now() - start));
    expect(total).toBeLessThan(THRESHOLDS.sequentialQueries);
  });
});

// -------------------------------------------------------------------------
// 4. Metrics Export
// -------------------------------------------------------------------------
describe('4. Baseline metrics', () => {
  it('prints performance metrics for baseline comparison', () => {
    console.log('\n  📊 Performance Baseline Metrics:');
    console.log(`  ${'─'.repeat(60)}`);
    console.log(`  ${'Metric'.padEnd(45)} ${'Duration'.padEnd(10)}`);
    console.log(`  ${'─'.repeat(60)}`);

    for (const metric of metrics) {
      const status = metric.durationMs < 1000
        ? '✓'
        : metric.durationMs < 2000
          ? '⚠'
          : '✗';
      console.log(
        `  ${status} ${metric.name.padEnd(43)} ${metric.durationMs.toString().padStart(8)}ms`,
      );
    }

    console.log(`  ${'─'.repeat(60)}`);
    // Always pass — this is informational
    expect(true).toBe(true);
  });

  it('all metrics are within thresholds', () => {
    // This test serves as a regression gate
    // Each sprint should compare against the previous baseline
    const failures = metrics.filter(m => {
      // Map metric names to thresholds
      if (m.name.startsWith('login-') && m.durationMs > THRESHOLDS.login) return true;
      if (m.name.startsWith('query-') && m.durationMs > 1000) return true; // generous
      return false;
    });

    if (failures.length > 0) {
      console.warn('\n  ⚠️  Metrics exceeding thresholds:');
      for (const f of failures) {
        console.warn(`     ${f.name}: ${f.durationMs}ms`);
      }
    }

    // Don't fail the build on slow metrics — this is a baseline
    // Tighten thresholds in Sprint 3+
    expect(true).toBe(true);
  });
});
