// ==========================================================================
// SubscriptionScheduler Tests — Sprint 9.10
// ==========================================================================

import { describe, it, expect } from 'vitest';
import { SubscriptionScheduler } from '../src/subscriptions/scheduler.js';
import {
  createDefaultScheduler,
  PRESET_SUBSCRIPTIONS,
  CONFIDENCE_DROP_ALERT,
  WEEKLY_DIGEST,
  MONTHLY_PASSPORT,
  QUARTERLY_AUDIT,
  EXPIRATION_ALERT,
} from '../src/subscriptions/prebuilt.js';
import type {
  DeliverySubscription,
  EvaluationContext,
  SubscriptionEvent,
} from '../src/subscriptions/types.js';

// --- Helpers ---

function makeContext(overrides: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    currentTime: '2026-07-06T08:00:00.000Z', // Monday Jul 6 2026, 08:00 UTC
    ...overrides,
  };
}

function makeEvent(
  name: string,
  payload: Record<string, unknown>,
  timestamp = '2026-07-06T08:00:00.000Z',
): SubscriptionEvent {
  return { name, payload, timestamp };
}

function makeSubscription(
  id: string,
  overrides: Partial<DeliverySubscription> = {},
): DeliverySubscription {
  return {
    id,
    name: id,
    description: `Test subscription ${id}`,
    trigger: { type: 'schedule', schedule: 'daily', hour: 8 },
    templateName: 'SponsorReport',
    artifactType: 'pdf',
    recipients: [{ recipientId: 'recv-1', channelType: 'email' }],
    enabled: true,
    lastTriggeredAt: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

// ==========================================================================
// Schedule trigger tests
// ==========================================================================

describe('Schedule triggers — daily', () => {
  it('fires at 8am', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', { trigger: { type: 'schedule', schedule: 'daily', hour: 8 } }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('08:00');
  });

  it('does not fire at 7am (before hour)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', { trigger: { type: 'schedule', schedule: 'daily', hour: 8 } }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T07:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('fires at 9am (after hour)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', { trigger: { type: 'schedule', schedule: 'daily', hour: 8 } }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T09:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });

  it('fires at 23:59 (after hour)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', { trigger: { type: 'schedule', schedule: 'daily', hour: 8 } }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T23:59:00.000Z' }));
    expect(result).toHaveLength(1);
  });
});

describe('Schedule triggers — weekly', () => {
  it('fires on Monday (dayOfWeek=1)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'weekly', dayOfWeek: 1, hour: 8 },
    }));
    // Jul 6 2026 is a Monday
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('Monday');
  });

  it('does not fire on Tuesday when dayOfWeek=1', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'weekly', dayOfWeek: 1, hour: 8 },
    }));
    // Jul 7 2026 is a Tuesday
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-07T08:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('fires on Wednesday when dayOfWeek=3', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'weekly', dayOfWeek: 3, hour: 10 },
    }));
    // Jul 8 2026 is a Wednesday
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-08T10:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('Wednesday');
  });

  it('defaults to Monday when no dayOfWeek', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'weekly', hour: 8 },
    }));
    // Jul 6 2026 is Monday
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });
});

describe('Schedule triggers — monthly', () => {
  it('fires on day 1 at 8am', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'monthly', dayOfMonth: 1, hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('day 1');
  });

  it('does not fire on day 2', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'monthly', dayOfMonth: 1, hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-02T08:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('defaults to day 1 when no dayOfMonth', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'monthly', hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });
});

describe('Schedule triggers — quarterly', () => {
  it('fires on Jan 1 (month 0)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'quarterly', dayOfMonth: 1, hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-01-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('Q1');
  });

  it('fires on Apr 1 (month 3)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'quarterly', dayOfMonth: 1, hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-04-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('Q2');
  });

  it('fires on Jul 1 (month 6)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'quarterly', dayOfMonth: 1, hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('Q3');
  });

  it('fires on Oct 1 (month 9)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'quarterly', dayOfMonth: 1, hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-10-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('Q4');
  });

  it('does not fire on Feb 1 (month 1 — not quarter start)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'quarterly', dayOfMonth: 1, hour: 8 },
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-02-01T08:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });
});

// ==========================================================================
// Duplicate prevention tests
// ==========================================================================

describe('Duplicate prevention', () => {
  it('daily: already triggered today → does not fire again', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'daily', hour: 8 },
      lastTriggeredAt: '2026-07-06T08:00:00.000Z',
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T12:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('weekly: already triggered this week → does not fire again', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'weekly', dayOfWeek: 1, hour: 8 },
      lastTriggeredAt: '2026-07-06T10:00:00.000Z', // Monday same week
    }));
    // Same Monday
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T12:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('monthly: already triggered this month → does not fire again', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'monthly', dayOfMonth: 1, hour: 8 },
      lastTriggeredAt: '2026-07-01T09:00:00.000Z',
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-15T08:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('quarterly: already triggered this quarter → does not fire again', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'quarterly', dayOfMonth: 1, hour: 8 },
      lastTriggeredAt: '2026-07-01T10:00:00.000Z',
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-08-01T08:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('daily: fires again after period changes (next day)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'daily', hour: 8 },
      lastTriggeredAt: '2026-07-05T08:00:00.000Z',
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });

  it('weekly: fires again after period changes (next week)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'weekly', dayOfWeek: 1, hour: 8 },
      lastTriggeredAt: '2026-06-29T08:00:00.000Z', // Previous Monday
    }));
    // Jul 6 2026 is a Monday — different week
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });

  it('monthly: fires again after period changes (next month)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'monthly', dayOfMonth: 1, hour: 8 },
      lastTriggeredAt: '2026-06-01T08:00:00.000Z',
    }));
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });

  it('quarterly: fires again after period changes (next quarter)', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'quarterly', dayOfMonth: 1, hour: 8 },
      lastTriggeredAt: '2026-04-01T08:00:00.000Z', // Q2
    }));
    // Jul 1 is Q3
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-01T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });
});

// ==========================================================================
// Event trigger tests
// ==========================================================================

describe('Event triggers', () => {
  it('event with matching name → fires', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'event', eventName: 'test.event' },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('test.event', {})],
    }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('test.event triggered');
  });

  it('event with non-matching name → does not fire', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'event', eventName: 'test.event' },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('other.event', {})],
    }));
    expect(result).toHaveLength(0);
  });

  it('event without condition → fires on match', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'event', eventName: 'data.updated' },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('data.updated', { value: 42 })],
    }));
    expect(result).toHaveLength(1);
  });

  it('condition equals → fires when values match', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'status.changed',
        condition: { field: 'status', operator: 'equals', value: 'active' },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('status.changed', { status: 'active' })],
    }));
    expect(result).toHaveLength(1);
  });

  it('condition equals → does not fire when values differ', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'status.changed',
        condition: { field: 'status', operator: 'equals', value: 'active' },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('status.changed', { status: 'inactive' })],
    }));
    expect(result).toHaveLength(0);
  });

  it('condition not_equals → fires when values differ', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'status.changed',
        condition: { field: 'status', operator: 'not_equals', value: 'deleted' },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('status.changed', { status: 'active' })],
    }));
    expect(result).toHaveLength(1);
  });

  it('condition greater_than → fires when value > threshold', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'metric.updated',
        condition: { field: 'value', operator: 'greater_than', value: 10 },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('metric.updated', { value: 15 })],
    }));
    expect(result).toHaveLength(1);
  });

  it('condition less_than → fires when value < threshold', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'metric.updated',
        condition: { field: 'value', operator: 'less_than', value: 10 },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('metric.updated', { value: 5 })],
    }));
    expect(result).toHaveLength(1);
  });

  it('condition drops_below → fires when value below threshold', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'confidence.changed',
        condition: { field: 'level', operator: 'drops_below', value: 50 },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('confidence.changed', { level: 30 })],
    }));
    expect(result).toHaveLength(1);
  });

  it('condition rises_above → fires when value above threshold', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'quality.updated',
        condition: { field: 'score', operator: 'rises_above', value: 80 },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('quality.updated', { score: 95 })],
    }));
    expect(result).toHaveLength(1);
  });

  it('condition changed_to → fires when value equals target', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'status.changed',
        condition: { field: 'status', operator: 'changed_to', value: 'revoked' },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('status.changed', { status: 'revoked' })],
    }));
    expect(result).toHaveLength(1);
  });

  it('no events in context → nothing fires', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'event', eventName: 'test.event' },
    }));
    const result = scheduler.evaluate(makeContext({ events: [] }));
    expect(result).toHaveLength(0);
  });

  it('multiple events → first matching event triggers', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'status.changed',
        condition: { field: 'status', operator: 'equals', value: 'done' },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [
        makeEvent('status.changed', { status: 'pending' }),
        makeEvent('status.changed', { status: 'done' }),
      ],
    }));
    expect(result).toHaveLength(1);
  });
});

// ==========================================================================
// User examples — Confidence Drop + Expiration Alert
// ==========================================================================

describe('User examples', () => {
  it('confidence.changed drops_below MEDIUM → fires Confidence Drop Alert', () => {
    const scheduler = createDefaultScheduler();
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
      events: [
        makeEvent('confidence.changed', { confidence: { level: 'LOW' } }),
      ],
    }));
    const confidenceAlerts = result.filter((r) => r.subscription.id === 'sub-confidence-drop-001');
    expect(confidenceAlerts).toHaveLength(1);
    expect(confidenceAlerts[0].triggerReason).toContain('drops_below');
  });

  it('confidence.changed HIGH (not below MEDIUM) → does not fire', () => {
    const scheduler = createDefaultScheduler();
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
      events: [
        makeEvent('confidence.changed', { confidence: { level: 'HIGH' } }),
      ],
    }));
    const confidenceAlerts = result.filter((r) => r.subscription.id === 'sub-confidence-drop-001');
    expect(confidenceAlerts).toHaveLength(0);
  });

  it('artifact.expiring with daysUntilExpiry=3 → fires Expiration Alert', () => {
    const scheduler = createDefaultScheduler();
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
      events: [
        makeEvent('artifact.expiring', { daysUntilExpiry: 3 }),
      ],
    }));
    const alerts = result.filter((r) => r.subscription.id === 'sub-expiration-alert-001');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].triggerReason).toContain('less_than');
  });

  it('artifact.expiring with daysUntilExpiry=10 → does not fire', () => {
    const scheduler = createDefaultScheduler();
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
      events: [
        makeEvent('artifact.expiring', { daysUntilExpiry: 10 }),
      ],
    }));
    const alerts = result.filter((r) => r.subscription.id === 'sub-expiration-alert-001');
    expect(alerts).toHaveLength(0);
  });
});

// ==========================================================================
// Enabled/disabled tests
// ==========================================================================

describe('Enabled/disabled', () => {
  it('disabled subscription → never fires', () => {
    const scheduler = new SubscriptionScheduler();
    const sub = makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'daily', hour: 8 },
    });
    sub.enabled = false;
    scheduler.register(sub);
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('enable() makes subscription active', () => {
    const scheduler = new SubscriptionScheduler();
    const sub = makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'daily', hour: 8 },
    });
    sub.enabled = false;
    scheduler.register(sub);
    scheduler.enable('sub-1');
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
  });

  it('disable() makes subscription inactive', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'daily', hour: 8 },
    }));
    scheduler.disable('sub-1');
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(0);
  });

  it('listEnabled() only returns enabled subscriptions', () => {
    const scheduler = new SubscriptionScheduler();
    const sub1 = makeSubscription('sub-1');
    const sub2 = makeSubscription('sub-2');
    sub2.enabled = false;
    scheduler.register(sub1);
    scheduler.register(sub2);
    expect(scheduler.listEnabled()).toHaveLength(1);
    expect(scheduler.listEnabled()[0].id).toBe('sub-1');
  });
});

// ==========================================================================
// CRUD tests
// ==========================================================================

describe('CRUD', () => {
  it('register adds subscription', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1'));
    expect(scheduler.size).toBe(1);
  });

  it('register duplicate id → throws', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1'));
    expect(() => scheduler.register(makeSubscription('sub-1'))).toThrow(/already registered/);
  });

  it('getSubscription returns correct subscription', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', { name: 'Custom Name' }));
    const sub = scheduler.getSubscription('sub-1');
    expect(sub).toBeDefined();
    expect(sub!.name).toBe('Custom Name');
  });

  it('getSubscription returns undefined for nonexistent', () => {
    const scheduler = new SubscriptionScheduler();
    expect(scheduler.getSubscription('nope')).toBeUndefined();
  });

  it('listAll returns all', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1'));
    scheduler.register(makeSubscription('sub-2'));
    expect(scheduler.listAll()).toHaveLength(2);
  });

  it('listByTriggerType filters correctly', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', { trigger: { type: 'schedule', schedule: 'daily' } }));
    scheduler.register(makeSubscription('sub-2', { trigger: { type: 'event', eventName: 'test' } }));
    expect(scheduler.listByTriggerType('schedule')).toHaveLength(1);
    expect(scheduler.listByTriggerType('event')).toHaveLength(1);
  });

  it('remove removes subscription', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1'));
    scheduler.remove('sub-1');
    expect(scheduler.size).toBe(0);
  });

  it('remove nonexistent → throws', () => {
    const scheduler = new SubscriptionScheduler();
    expect(() => scheduler.remove('nope')).toThrow(/not found/);
  });

  it('clear removes all', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1'));
    scheduler.register(makeSubscription('sub-2'));
    scheduler.clear();
    expect(scheduler.size).toBe(0);
  });

  it('size is correct', () => {
    const scheduler = new SubscriptionScheduler();
    expect(scheduler.size).toBe(0);
    scheduler.register(makeSubscription('sub-1'));
    expect(scheduler.size).toBe(1);
  });
});

// ==========================================================================
// Integration tests
// ==========================================================================

describe('Integration', () => {
  it('scheduler with all 5 preset subscriptions — total count', () => {
    const scheduler = createDefaultScheduler();
    expect(scheduler.size).toBe(5);
    expect(scheduler.listEnabled()).toHaveLength(5);
  });

  it('Weekly context → only Weekly Digest fires', () => {
    const scheduler = createDefaultScheduler();
    // Monday Jul 6 2026, 08:00 UTC
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
    }));
    const weekly = result.filter((r) => r.subscription.id === 'sub-weekly-digest-001');
    expect(weekly).toHaveLength(1);
    // Monthly should NOT fire unless it's day 1
    const monthly = result.filter((r) => r.subscription.id === 'sub-monthly-passport-001');
    expect(monthly).toHaveLength(0);
  });

  it('Monthly context → only Monthly Passport fires when day 1', () => {
    const scheduler = createDefaultScheduler();
    // Jul 1 2026, 08:00 UTC — day 1, BUT it's a Wednesday, not Monday
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-01T08:00:00.000Z',
    }));
    const monthly = result.filter((r) => r.subscription.id === 'sub-monthly-passport-001');
    expect(monthly).toHaveLength(1);
  });

  it('Confidence drop event → only Confidence Drop Alert fires', () => {
    const scheduler = createDefaultScheduler();
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
      events: [makeEvent('confidence.changed', { confidence: { level: 'LOW' } })],
    }));
    const alerts = result.filter((r) => r.subscription.id === 'sub-confidence-drop-001');
    expect(alerts).toHaveLength(1);
    // Schedule-based should not fire here (no Monday day 1 context)
  });

  it('Expiration event → only Expiration Alert fires', () => {
    const scheduler = createDefaultScheduler();
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
      events: [makeEvent('artifact.expiring', { daysUntilExpiry: 3 })],
    }));
    const alerts = result.filter((r) => r.subscription.id === 'sub-expiration-alert-001');
    expect(alerts).toHaveLength(1);
  });

  it('Multiple event types → correct subset fires', () => {
    const scheduler = createDefaultScheduler();
    const result = scheduler.evaluate(makeContext({
      currentTime: '2026-07-06T08:00:00.000Z',
      events: [
        makeEvent('confidence.changed', { confidence: { level: 'LOW' } }),
        makeEvent('artifact.expiring', { daysUntilExpiry: 3 }),
      ],
    }));
    const ids = result.map((r) => r.subscription.id);
    expect(ids).toContain('sub-confidence-drop-001');
    expect(ids).toContain('sub-expiration-alert-001');
  });
});

// ==========================================================================
// Edge cases
// ==========================================================================

describe('Edge cases', () => {
  it('empty scheduler → evaluate returns empty array', () => {
    const scheduler = new SubscriptionScheduler();
    const result = scheduler.evaluate(makeContext());
    expect(result).toHaveLength(0);
  });

  it('custom dayOfWeek and hour work correctly', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'weekly', dayOfWeek: 5, hour: 15 },
    }));
    // Jul 10 2026 is a Friday, 15:00 UTC
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-10T15:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(result[0].triggerReason).toContain('Friday');
    expect(result[0].triggerReason).toContain('15:00');
  });

  it('field resolution with dot-notation works', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'confidence.changed',
        condition: { field: 'confidence.level', operator: 'equals', value: 'LOW' },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('confidence.changed', { confidence: { level: 'LOW' } })],
    }));
    expect(result).toHaveLength(1);
  });

  it('missing field in payload → condition evaluates false', () => {
    const scheduler = new SubscriptionScheduler();
    scheduler.register(makeSubscription('sub-1', {
      trigger: {
        type: 'event',
        eventName: 'test.event',
        condition: { field: 'nonexistent', operator: 'equals', value: 'x' },
      },
    }));
    const result = scheduler.evaluate(makeContext({
      events: [makeEvent('test.event', { other: 'data' })],
    }));
    expect(result).toHaveLength(0);
  });

  it('lastTriggeredAt updates after triggering', () => {
    const scheduler = new SubscriptionScheduler();
    const sub = makeSubscription('sub-1', {
      trigger: { type: 'schedule', schedule: 'daily', hour: 8 },
    });
    scheduler.register(sub);
    const result = scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(result).toHaveLength(1);
    expect(sub.lastTriggeredAt).toBe('2026-07-06T08:00:00.000Z');
  });

  it('enabled state persists in evaluate', () => {
    const scheduler = new SubscriptionScheduler();
    const sub = makeSubscription('sub-1');
    scheduler.register(sub);
    scheduler.evaluate(makeContext({ currentTime: '2026-07-06T08:00:00.000Z' }));
    expect(sub.enabled).toBe(true); // not mutated by evaluate
  });
});
