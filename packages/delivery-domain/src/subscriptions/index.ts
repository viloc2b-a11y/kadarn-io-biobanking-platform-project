// ==========================================================================
// Subscriptions — barrel export
// ==========================================================================

export {
  type DeliverySubscription,
  type SubscriptionRecipient,
  type ScheduleTrigger,
  type EventTrigger,
  type TriggerCondition,
  type SubscriptionTrigger,
  type EvaluationContext,
  type SubscriptionEvent,
  type TriggeredSubscription,
} from './types.js';

export { SubscriptionScheduler } from './scheduler.js';

export {
  CONFIDENCE_DROP_ALERT,
  WEEKLY_DIGEST,
  MONTHLY_PASSPORT,
  QUARTERLY_AUDIT,
  EXPIRATION_ALERT,
  PRESET_SUBSCRIPTIONS,
  createDefaultScheduler,
} from './prebuilt.js';
