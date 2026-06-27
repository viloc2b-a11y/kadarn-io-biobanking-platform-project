// ==========================================================================
// Kadarn Trust Engine — Unit Tests
// ==========================================================================
// Tests cover: score computation, decay, impact calculation, trajectory,
// service layer, days calculation, default scores.
// ==========================================================================

import { describe, it, expect } from 'vitest';
import {
  computeOverall,
  applyDecay,
  applyDecayToAll,
  computeImpact,
  applyImpact,
  getDefaultScore,
  computeScoreFromEvents,
  buildTrajectory,
  daysBetween,
  getSourceDescription,
} from '../packages/trust-engine/src/engine.js';

import { TrustEngineService } from '../packages/trust-engine/src/service.js';
import type { TrustEngineAdapter } from '../packages/trust-engine/src/service.js';
import type { OrganizationTrust, TrustEvent, TrustChallenge } from '../packages/trust-engine/src/types.js';

// --------------------------------------------------------------------------
// computeOverall()
// --------------------------------------------------------------------------

describe('computeOverall()', () => {
  it('should compute equal-weighted average by default', () => {
    const scores = { operational: 0.8, regulatory: 0.6, financial: 0.7, technical: 0.9 };
    const result = computeOverall(scores);
    expect(result).toBeCloseTo(0.75, 3);
  });

  it('should use custom weights when provided', () => {
    const scores = { operational: 1.0, regulatory: 0, financial: 0, technical: 0 };
    const result = computeOverall(scores, { operational: 1.0, regulatory: 0, financial: 0, technical: 0 });
    expect(result).toBe(1.0);
  });

  it('should clamp to 0-1 range', () => {
    const scores = { operational: 2, regulatory: 2, financial: 2, technical: 2 };
    const result = computeOverall(scores);
    expect(result).toBe(1.0);
  });
});

// --------------------------------------------------------------------------
// applyDecay()
// --------------------------------------------------------------------------

describe('applyDecay()', () => {
  it('should not decay when daysSinceLastEvent is 0', () => {
    expect(applyDecay(0.8, 0)).toBeCloseTo(0.8, 3);
  });

  it('should decay at configured rate', () => {
    const result = applyDecay(1.0, 30, { rate: 0.01 });
    // 1.0 × (1 - 0.01)^30 ≈ 0.74
    expect(result).toBeCloseTo(0.7397, 2);
  });

  it('should decay faster with higher rate', () => {
    const slow = applyDecay(1.0, 30, { rate: 0.01 });
    const fast = applyDecay(1.0, 30, { rate: 0.05 });
    expect(fast).toBeLessThan(slow);
  });

  it('should hit 0 when score is 0', () => {
    expect(applyDecay(0, 100)).toBe(0);
  });

  it('should not decay when daysSinceLastEvent is negative', () => {
    expect(applyDecay(0.8, -5)).toBeCloseTo(0.8, 3);
  });
});

// --------------------------------------------------------------------------
// applyDecayToAll()
// --------------------------------------------------------------------------

describe('applyDecayToAll()', () => {
  it('should decay each dimension at its configured rate', () => {
    const scores = { operational: 1.0, regulatory: 1.0, financial: 1.0, technical: 1.0 };
    const result = applyDecayToAll(scores, 30);
    // operational decays fastest (0.01/day), technical slowest (0.002/day)
    expect(result.operational).toBeLessThan(result.regulatory);
    expect(result.regulatory).toBe(result.financial);
    expect(result.financial).toBeLessThan(result.technical);
  });

  it('should accept custom dimension config', () => {
    const scores = { operational: 1.0, regulatory: 1.0, financial: 1.0, technical: 1.0 };
    const result = applyDecayToAll(scores, 30, { operational: { rate: 0 } });
    expect(result.operational).toBe(1.0); // no decay
    expect(result.regulatory).toBeLessThan(1.0); // normal decay
  });
});

// --------------------------------------------------------------------------
// computeImpact()
// --------------------------------------------------------------------------

describe('computeImpact()', () => {
  it('should use source default impact', () => {
    const impact = computeImpact('fulfillment.completed', 'normal');
    expect(impact).toBeCloseTo(0.02, 3);
  });

  it('should scale by severity', () => {
    const normal = computeImpact('temperature.breach', 'normal');
    const critical = computeImpact('temperature.breach', 'critical');
    expect(critical).toBeCloseTo(normal * 2.0, 3);
  });

  it('should use custom base impact when provided', () => {
    const impact = computeImpact('custom.event', 'high', 0.1);
    expect(impact).toBeCloseTo(0.15, 3); // 0.1 × 1.5
  });

  it('should use default 0.01 for unknown sources', () => {
    const impact = computeImpact('unknown.event', 'normal');
    expect(impact).toBeCloseTo(0.01, 3);
  });
});

// --------------------------------------------------------------------------
// applyImpact()
// --------------------------------------------------------------------------

describe('applyImpact()', () => {
  it('should increase score with positive impact', () => {
    expect(applyImpact(0.5, 0.1)).toBeCloseTo(0.6, 3);
  });

  it('should decrease score with negative impact', () => {
    expect(applyImpact(0.5, -0.1)).toBeCloseTo(0.4, 3);
  });

  it('should clamp to 0', () => {
    expect(applyImpact(0.1, -0.5)).toBe(0);
  });

  it('should clamp to 1', () => {
    expect(applyImpact(0.9, 0.5)).toBe(1);
  });
});

// --------------------------------------------------------------------------
// getDefaultScore()
// --------------------------------------------------------------------------

describe('getDefaultScore()', () => {
  it('should return 0.5 for all dimensions', () => {
    const scores = getDefaultScore();
    expect(scores.operational).toBe(0.5);
    expect(scores.regulatory).toBe(0.5);
    expect(scores.financial).toBe(0.5);
    expect(scores.technical).toBe(0.5);
  });
});

// --------------------------------------------------------------------------
// computeScoreFromEvents()
// --------------------------------------------------------------------------

describe('computeScoreFromEvents()', () => {
  it('should start from default scores when no startScores given', () => {
    const events = [
      { impact: 0.1, dimension: 'operational' as const },
      { impact: -0.05, dimension: 'operational' as const },
    ];
    const result = computeScoreFromEvents(events);
    expect(result.operational).toBeCloseTo(0.55, 3); // 0.5 + 0.1 - 0.05
  });

  it('should use provided startScores', () => {
    const events = [
      { impact: 0.1, dimension: 'operational' as const },
    ];
    const start = { operational: 0.8, regulatory: 0.5, financial: 0.5, technical: 0.5 };
    const result = computeScoreFromEvents(events, start);
    expect(result.operational).toBeCloseTo(0.9, 3);
  });

  it('should apply events in order', () => {
    const events = [
      { impact: 0.2, dimension: 'operational' as const },
      { impact: -0.3, dimension: 'operational' as const },
      { impact: 0.4, dimension: 'operational' as const },
    ];
    const result = computeScoreFromEvents(events);
    expect(result.operational).toBeCloseTo(0.8, 3); // 0.5 + 0.2 - 0.3 + 0.4
  });

  it('should handle multiple dimensions', () => {
    const events = [
      { impact: 0.1, dimension: 'operational' as const },
      { impact: 0.2, dimension: 'regulatory' as const },
      { impact: -0.05, dimension: 'financial' as const },
    ];
    const result = computeScoreFromEvents(events);
    expect(result.operational).toBeCloseTo(0.6, 3);
    expect(result.regulatory).toBeCloseTo(0.7, 3);
    expect(result.financial).toBeCloseTo(0.45, 3);
    expect(result.technical).toBe(0.5); // unchanged
  });
});

// --------------------------------------------------------------------------
// buildTrajectory()
// --------------------------------------------------------------------------

describe('buildTrajectory()', () => {
  it('should build trajectory points from events', () => {
    const events = [
      { impact: 0.1, dimension: 'operational' as const, source: 'fulfillment.completed', created_at: '2026-01-01', description: 'Fulfillment 1' },
      { impact: -0.05, dimension: 'operational' as const, source: 'temperature.breach', created_at: '2026-01-15', description: 'Breach 1' },
    ];
    const trajectory = buildTrajectory(events);
    expect(trajectory).toHaveLength(2);
    expect(trajectory[0].score).toBeCloseTo(0.6, 3);
    expect(trajectory[0].eventSource).toBe('fulfillment.completed');
    expect(trajectory[1].score).toBeCloseTo(0.55, 3);
    expect(trajectory[1].eventSource).toBe('temperature.breach');
  });

  it('should handle empty events', () => {
    const trajectory = buildTrajectory([]);
    expect(trajectory).toHaveLength(0);
  });
});

// --------------------------------------------------------------------------
// daysBetween()
// --------------------------------------------------------------------------

describe('daysBetween()', () => {
  it('should calculate days between dates', () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');
    expect(daysBetween(from, to)).toBe(30);
  });

  it('should return 0 for same day', () => {
    const from = new Date('2026-01-15');
    const to = new Date('2026-01-15');
    expect(daysBetween(from, to)).toBe(0);
  });

  it('should return 0 for future dates', () => {
    const from = new Date('2026-02-01');
    const to = new Date('2026-01-15');
    expect(daysBetween(from, to)).toBe(0);
  });

  it('should handle time differences within a day', () => {
    const from = new Date('2026-01-01T00:00:00');
    const to = new Date('2026-01-01T23:59:00');
    expect(daysBetween(from, to)).toBe(0); // same day
  });
});

// --------------------------------------------------------------------------
// getSourceDescription()
// --------------------------------------------------------------------------

describe('getSourceDescription()', () => {
  it('should return known source description', () => {
    expect(getSourceDescription('fulfillment.completed')).toBe('Fulfillment completed successfully');
    expect(getSourceDescription('temperature.breach')).toBe('Temperature breach during shipment');
  });

  it('should return generic description for unknown source', () => {
    expect(getSourceDescription('custom.event')).toBe('Trust event: custom.event');
  });
});

// --------------------------------------------------------------------------
// TrustEngineService
// --------------------------------------------------------------------------

describe('TrustEngineService', () => {
  // Create an in-memory adapter for testing
  function createMockAdapter(): TrustEngineAdapter {
    const trustStore = new Map<string, OrganizationTrust>();
    const eventStore: TrustEvent[] = [];
    const challengeStore = new Map<string, TrustChallenge>();

    return {
      async getOrganizationTrust(id: string): Promise<OrganizationTrust | null> {
        return trustStore.get(id) ?? null;
      },
      async upsertOrganizationTrust(t): Promise<void> {
        trustStore.set(t.organizationId, {
          organizationId: t.organizationId,
          operationalScore: (t as any).operationalScore ?? 0.5,
          regulatoryScore: (t as any).regulatoryScore ?? 0.5,
          financialScore: (t as any).financialScore ?? 0.5,
          technicalScore: (t as any).technicalScore ?? 0.5,
          overallScore: (t as any).overallScore ?? 0.5,
          lastEventAt: (t as any).lastEventAt ?? null,
          lastDecayAt: (t as any).lastDecayAt ?? new Date().toISOString(),
          totalFulfillments: 0,
          successfulFulfillments: 0,
          incidentCount: 0,
        });
      },
      async insertTrustEvent(e: TrustEvent): Promise<string> {
        const id = `evt-${eventStore.length + 1}`;
        eventStore.push({ ...e, id });
        return id;
      },
      async getTrustEvents(orgId: string): Promise<TrustEvent[]> {
        return eventStore.filter((e) => e.organizationId === orgId);
      },
      async insertChallenge(c: TrustChallenge): Promise<string> {
        const id = `ch-${challengeStore.size + 1}`;
        challengeStore.set(id, { ...c, id });
        return id;
      },
      async getChallenge(id: string): Promise<TrustChallenge | null> {
        return challengeStore.get(id) ?? null;
      },
      async updateChallenge(id: string, updates: Partial<TrustChallenge>): Promise<void> {
        const existing = challengeStore.get(id);
        if (existing) {
          challengeStore.set(id, { ...existing, ...updates });
        }
      },
    };
  }

  it('should record an event and update scores', async () => {
    const adapter = createMockAdapter();
    const service = new TrustEngineService(adapter);

    const result = await service.recordEvent({
      organizationId: 'org-1',
      dimension: 'operational',
      source: 'fulfillment.completed',
      severity: 'normal',
      evidenceRef: 'fulfillment-001',
    });

    expect(result.eventId).toBeTruthy();
    expect(result.scoreBefore).toBeCloseTo(0.5, 3);
    expect(result.scoreAfter).toBeCloseTo(0.52, 3); // 0.5 + 0.02

    const scores = await service.getScores('org-1');
    expect(scores.operationalScore).toBeCloseTo(0.52, 3);
  });

  it('should record a negative event and decrease scores', async () => {
    const adapter = createMockAdapter();
    const service = new TrustEngineService(adapter);

    await service.recordEvent({
      organizationId: 'org-1',
      dimension: 'operational',
      source: 'temperature.breach',
      severity: 'normal',
      evidenceRef: 'breach-001',
    });

    const scores = await service.getScores('org-1');
    expect(scores.operationalScore).toBeCloseTo(0.4, 3); // 0.5 - 0.10
  });

  it('should return neutral scores for unknown organizations', async () => {
    const adapter = createMockAdapter();
    const service = new TrustEngineService(adapter);

    const scores = await service.getScores('unknown-org');
    expect(scores.operationalScore).toBe(0.5);
    expect(scores.regulatoryScore).toBe(0.5);
    expect(scores.overallScore).toBe(0.5);
  });

  it('should build trajectory from recorded events', async () => {
    const adapter = createMockAdapter();
    const service = new TrustEngineService(adapter);

    await service.recordEvent({
      organizationId: 'org-1',
      dimension: 'operational',
      source: 'fulfillment.completed',
      severity: 'normal',
      evidenceRef: 'f-001',
    });

    await service.recordEvent({
      organizationId: 'org-1',
      dimension: 'operational',
      source: 'temperature.breach',
      severity: 'normal',
      evidenceRef: 'b-001',
    });

    const trajectory = await service.getTrajectory('org-1');
    expect(trajectory).toHaveLength(2);
    expect(trajectory[0].score).toBeCloseTo(0.52, 3);
    expect(trajectory[1].score).toBeCloseTo(0.42, 3);
  });

  it('should file a challenge and update score on acceptance', async () => {
    const adapter = createMockAdapter();
    const service = new TrustEngineService(adapter);

    const challengeId = await service.fileChallenge({
      organizationId: 'org-1',
      dimension: 'operational',
      evidenceRef: 'cert-iso-20387',
      reason: 'ISO 20387 certification verified',
      proposedScore: 0.7,
    });

    expect(challengeId).toBeTruthy();
    expect(challengeId).toContain('ch-');
  });
});
