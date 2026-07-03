// ==========================================================================
// Subscription Types — Delivery Subscription Engine (KEMS-007 §C)
// ==========================================================================

import type { ArtifactType } from '../value-objects/artifact-type.js';
import type { ChannelType } from '../value-objects/channel-type.js';

// --- Triggers ---

export interface ScheduleTrigger {
  type: 'schedule';
  /** Cron-like schedule */
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  /** Day of week for weekly (0=Sunday, 1=Monday, ..., 6=Saturday) */
  dayOfWeek?: number;
  /** Day of month for monthly (1-28) */
  dayOfMonth?: number;
  /** Hour of day for daily (0-23), default 8 */
  hour?: number;
}

export interface EventTrigger {
  type: 'event';
  /** Event name to listen for */
  eventName: string;
  /** Optional condition — only fire if condition matches */
  condition?: TriggerCondition;
}

export interface TriggerCondition {
  /** Field in the event payload, dot-notation: 'confidence.level', 'artifact.status' */
  field: string;
  /** Comparison operator */
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'drops_below' | 'rises_above' | 'changed_to';
  /** Value to compare against */
  value?: unknown;
  /**
   * Optional ordering for categorical values (e.g. confidence levels).
   * Values earlier in the array are considered "lower".
   * Example: ['LOW', 'MEDIUM', 'HIGH'] — LOW < MEDIUM < HIGH for ordered operators.
   */
  rankOrder?: unknown[];
}

export type SubscriptionTrigger = ScheduleTrigger | EventTrigger;

// --- Subscription ---

export interface DeliverySubscription {
  readonly id: string;
  readonly name: string;               // 'Weekly Digest', 'Confidence Drop Alert'
  readonly description: string;
  readonly trigger: SubscriptionTrigger;
  readonly templateName: string;       // template to use for delivery
  readonly artifactType: ArtifactType;
  readonly recipients: SubscriptionRecipient[];
  enabled: boolean;
  lastTriggeredAt: string | null;     // ISO timestamp, null if never triggered
  readonly createdAt: string;
}

export interface SubscriptionRecipient {
  recipientId: string;
  channelType: ChannelType;
}

// --- Evaluation ---

export interface EvaluationContext {
  /** Current simulated time (ISO 8601) — enables deterministic testing */
  currentTime: string;
  /** Recent events that may trigger event-based subscriptions */
  events?: SubscriptionEvent[];
  /** Additional context data for condition evaluation */
  data?: Record<string, unknown>;
}

export interface SubscriptionEvent {
  name: string;                        // 'confidence.changed', 'artifact.expiring', etc.
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface TriggeredSubscription {
  subscription: DeliverySubscription;
  triggerReason: string;               // 'Weekly schedule triggered (Monday 08:00)'
  context: Record<string, unknown>;    // snapshot of relevant context
  evaluatedAt: string;                 // ISO timestamp
}
