// ==========================================================================
// SubscriptionScheduler — automated delivery orchestration (KEMS-007 §C)
// ==========================================================================

import type {
  DeliverySubscription,
  EvaluationContext,
  EventTrigger,
  ScheduleTrigger,
  SubscriptionEvent,
  SubscriptionTrigger,
  TriggerCondition,
  TriggeredSubscription,
} from './types.js';

export class SubscriptionScheduler {
  private subscriptions: Map<string, DeliverySubscription> = new Map();

  // ==========================================================================
  // Public API — Evaluation
  // ==========================================================================

  /**
   * Evaluate all enabled subscriptions against the current context.
   * Returns subscriptions that should fire NOW.
   */
  evaluate(context: EvaluationContext): TriggeredSubscription[] {
    const triggered: TriggeredSubscription[] = [];
    const now = new Date(context.currentTime);

    for (const sub of this.subscriptions.values()) {
      if (!sub.enabled) continue;

      let shouldFire = false;
      let reason = '';

      if (sub.trigger.type === 'schedule') {
        const result = this.evaluateSchedule(sub, sub.trigger, now);
        shouldFire = result.shouldFire;
        reason = result.reason;
      } else if (sub.trigger.type === 'event') {
        const result = this.evaluateEvent(sub, sub.trigger, context);
        shouldFire = result.shouldFire;
        reason = result.reason;
      }

      if (shouldFire) {
        sub.lastTriggeredAt = context.currentTime;
        triggered.push({
          subscription: sub,
          triggerReason: reason,
          context: context.data ?? {},
          evaluatedAt: context.currentTime,
        });
      }
    }

    return triggered;
  }

  // ==========================================================================
  // Schedule evaluation
  // ==========================================================================

  private evaluateSchedule(
    sub: DeliverySubscription,
    trigger: ScheduleTrigger,
    now: Date,
  ): { shouldFire: boolean; reason: string } {
    // Check if already triggered in this period
    if (sub.lastTriggeredAt) {
      const lastTriggered = new Date(sub.lastTriggeredAt);
      if (this.isSamePeriod(trigger.schedule, lastTriggered, now)) {
        return {
          shouldFire: false,
          reason: `Already triggered in current ${trigger.schedule} period`,
        };
      }
    }

    const hour = trigger.hour ?? 8;
    const currentHour = now.getUTCHours();

    switch (trigger.schedule) {
      case 'daily':
        if (currentHour >= hour) {
          return {
            shouldFire: true,
            reason: `Daily schedule triggered (${String(hour).padStart(2, '0')}:00)`,
          };
        }
        break;

      case 'weekly': {
        const dayOfWeek = trigger.dayOfWeek ?? 1; // default Monday
        if (now.getUTCDay() === dayOfWeek && currentHour >= hour) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return {
            shouldFire: true,
            reason: `Weekly schedule triggered (${dayNames[dayOfWeek]} ${String(hour).padStart(2, '0')}:00)`,
          };
        }
        break;
      }

      case 'monthly': {
        const dayOfMonth = trigger.dayOfMonth ?? 1;
        if (now.getUTCDate() === dayOfMonth && currentHour >= hour) {
          return {
            shouldFire: true,
            reason: `Monthly schedule triggered (day ${dayOfMonth}, ${String(hour).padStart(2, '0')}:00)`,
          };
        }
        break;
      }

      case 'quarterly': {
        const month = now.getUTCMonth(); // 0-indexed
        const isQuarterStart = month % 3 === 0; // Jan(0), Apr(3), Jul(6), Oct(9)
        const dayOfMonth = trigger.dayOfMonth ?? 1;
        if (isQuarterStart && now.getUTCDate() === dayOfMonth && currentHour >= hour) {
          const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
          const quarter = quarterNames[Math.floor(month / 3)];
          return {
            shouldFire: true,
            reason: `Quarterly schedule triggered (${quarter}, day ${dayOfMonth}, ${String(hour).padStart(2, '0')}:00)`,
          };
        }
        break;
      }
    }

    return { shouldFire: false, reason: 'Schedule not matched for current time' };
  }

  // ==========================================================================
  // Event evaluation
  // ==========================================================================

  private evaluateEvent(
    _sub: DeliverySubscription,
    trigger: EventTrigger,
    context: EvaluationContext,
  ): { shouldFire: boolean; reason: string } {
    if (!context.events || context.events.length === 0) {
      return { shouldFire: false, reason: 'No events to evaluate' };
    }

    for (const event of context.events) {
      if (event.name !== trigger.eventName) continue;

      // If no condition, fire on any matching event
      if (!trigger.condition) {
        return {
          shouldFire: true,
          reason: `Event ${trigger.eventName} triggered`,
        };
      }

      // Evaluate condition
      if (this.evaluateCondition(trigger.condition, event.payload, context.data)) {
        return {
          shouldFire: true,
          reason: `Event ${trigger.eventName}: ${trigger.condition.field} ${trigger.condition.operator} ${trigger.condition.value}`,
        };
      }
    }

    return { shouldFire: false, reason: `Event ${trigger.eventName} did not match conditions` };
  }

  // ==========================================================================
  // Condition evaluation
  // ==========================================================================

  private evaluateCondition(
    condition: TriggerCondition,
    payload: Record<string, unknown>,
    data?: Record<string, unknown>,
  ): boolean {
    const actualValue = this.resolveField(condition.field, payload, data);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'greater_than':
        return this.compareValues(actualValue, expectedValue, '>', condition.rankOrder);
      case 'less_than':
        return this.compareValues(actualValue, expectedValue, '<', condition.rankOrder);
      case 'drops_below':
        return this.compareValues(actualValue, expectedValue, '<', condition.rankOrder);
      case 'rises_above':
        return this.compareValues(actualValue, expectedValue, '>', condition.rankOrder);
      case 'changed_to':
        return actualValue === expectedValue;
      default:
        return false;
    }
  }

  /**
   * Compare two values. Uses numeric comparison when both are numbers,
   * rankOrder mapping when provided for categorical values,
   * and falls back to lexicographic string comparison.
   */
  private compareValues(a: unknown, b: unknown, op: '>' | '<', rankOrder?: unknown[]): boolean {
    const numA = Number(a);
    const numB = Number(b);

    // Both numeric — use numeric comparison
    if (!isNaN(numA) && !isNaN(numB)) {
      return op === '>' ? numA > numB : numA < numB;
    }

    // rankOrder provided — map categorical values to their numeric rank
    if (rankOrder && rankOrder.length > 0) {
      const rankA = rankOrder.indexOf(a);
      const rankB = rankOrder.indexOf(b);
      if (rankA !== -1 && rankB !== -1) {
        return op === '>' ? rankA > rankB : rankA < rankB;
      }
    }

    // Fallback: string comparison (lexicographic)
    const strA = String(a);
    const strB = String(b);
    return op === '>' ? strA > strB : strA < strB;
  }

  // ==========================================================================
  // Field resolution (dot-notation)
  // ==========================================================================

  private resolveField(
    field: string,
    ...sources: Array<Record<string, unknown> | undefined>
  ): unknown {
    for (const source of sources) {
      if (!source) continue;
      const parts = field.split('.');
      let current: unknown = source;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined) return current;
    }
    return undefined;
  }

  // ==========================================================================
  // Period checking (prevent duplicate triggers in same period)
  // ==========================================================================

  private isSamePeriod(
    schedule: string,
    lastTriggered: Date,
    now: Date,
  ): boolean {
    switch (schedule) {
      case 'daily':
        return (
          lastTriggered.getUTCFullYear() === now.getUTCFullYear() &&
          lastTriggered.getUTCMonth() === now.getUTCMonth() &&
          lastTriggered.getUTCDate() === now.getUTCDate()
        );
      case 'weekly': {
        const getWeekStart = (d: Date): number => {
          const date = new Date(d);
          date.setUTCDate(date.getUTCDate() - date.getUTCDay());
          date.setUTCHours(0, 0, 0, 0);
          return date.getTime();
        };
        return getWeekStart(lastTriggered) === getWeekStart(now);
      }
      case 'monthly':
        return (
          lastTriggered.getUTCFullYear() === now.getUTCFullYear() &&
          lastTriggered.getUTCMonth() === now.getUTCMonth()
        );
      case 'quarterly': {
        const getQuarter = (d: Date): number => Math.floor(d.getUTCMonth() / 3);
        return (
          lastTriggered.getUTCFullYear() === now.getUTCFullYear() &&
          getQuarter(lastTriggered) === getQuarter(now)
        );
      }
      default:
        return false;
    }
  }

  // ==========================================================================
  // CRUD
  // ==========================================================================

  register(subscription: DeliverySubscription): void {
    if (this.subscriptions.has(subscription.id)) {
      throw new Error(`Subscription with id '${subscription.id}' already registered`);
    }
    this.subscriptions.set(subscription.id, subscription);
  }

  getSubscription(id: string): DeliverySubscription | undefined {
    return this.subscriptions.get(id);
  }

  listAll(): DeliverySubscription[] {
    return Array.from(this.subscriptions.values());
  }

  listEnabled(): DeliverySubscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.enabled);
  }

  listByTriggerType(type: 'schedule' | 'event'): DeliverySubscription[] {
    return Array.from(this.subscriptions.values()).filter((s) => s.trigger.type === type);
  }

  enable(id: string): void {
    const sub = this.subscriptions.get(id);
    if (!sub) throw new Error(`Subscription '${id}' not found`);
    sub.enabled = true;
  }

  disable(id: string): void {
    const sub = this.subscriptions.get(id);
    if (!sub) throw new Error(`Subscription '${id}' not found`);
    sub.enabled = false;
  }

  remove(id: string): void {
    if (!this.subscriptions.has(id)) {
      throw new Error(`Subscription '${id}' not found`);
    }
    this.subscriptions.delete(id);
  }

  clear(): void {
    this.subscriptions.clear();
  }

  get size(): number {
    return this.subscriptions.size;
  }
}
