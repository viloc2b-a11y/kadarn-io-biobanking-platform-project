// ==========================================================================
// Pre-built subscriptions — canonical delivery automations (KEMS-007 §C)
// ==========================================================================

import type { DeliverySubscription } from './types.js';
import { SubscriptionScheduler } from './scheduler.js';

// --- Confidence Drop Alert ---
// IF confidence drops below MEDIUM → notify sponsor

export const CONFIDENCE_DROP_ALERT: DeliverySubscription = {
  id: 'sub-confidence-drop-001',
  name: 'Confidence Drop Alert',
  description: 'Notifies sponsor when evidence confidence drops below MEDIUM level',
  trigger: {
    type: 'event',
    eventName: 'confidence.changed',
    condition: {
      field: 'confidence.level',
      operator: 'drops_below',
      value: 'MEDIUM',
      rankOrder: ['LOW', 'MEDIUM', 'HIGH'],
    },
  },
  templateName: 'SponsorReport',
  artifactType: 'pdf',
  recipients: [{ recipientId: 'sponsor-default', channelType: 'email' }],
  enabled: true,
  lastTriggeredAt: null,
  createdAt: '2026-07-03T00:00:00.000Z',
};

// --- Weekly Digest ---
// Every Monday at 08:00 UTC → send SponsorReport

export const WEEKLY_DIGEST: DeliverySubscription = {
  id: 'sub-weekly-digest-001',
  name: 'Weekly Digest',
  description: 'Weekly summary report delivered every Monday at 08:00 UTC',
  trigger: {
    type: 'schedule',
    schedule: 'weekly',
    dayOfWeek: 1, // Monday
    hour: 8,
  },
  templateName: 'SponsorReport',
  artifactType: 'html',
  recipients: [{ recipientId: 'sponsor-default', channelType: 'email' }],
  enabled: true,
  lastTriggeredAt: null,
  createdAt: '2026-07-03T00:00:00.000Z',
};

// --- Monthly Passport ---
// Every 1st of month at 08:00 UTC → publish InstitutionPassport

export const MONTHLY_PASSPORT: DeliverySubscription = {
  id: 'sub-monthly-passport-001',
  name: 'Monthly Passport',
  description: 'Monthly institution passport delivered on the 1st at 08:00 UTC',
  trigger: {
    type: 'schedule',
    schedule: 'monthly',
    dayOfMonth: 1,
    hour: 8,
  },
  templateName: 'InstitutionPassport',
  artifactType: 'html',
  recipients: [{ recipientId: 'institution-default', channelType: 'portal' }],
  enabled: true,
  lastTriggeredAt: null,
  createdAt: '2026-07-03T00:00:00.000Z',
};

// --- Quarterly Audit ---
// Every quarter start at 09:00 UTC → generate AuditPack

export const QUARTERLY_AUDIT: DeliverySubscription = {
  id: 'sub-quarterly-audit-001',
  name: 'Quarterly Audit',
  description: 'Quarterly audit pack delivered on first day of each quarter at 09:00 UTC',
  trigger: {
    type: 'schedule',
    schedule: 'quarterly',
    dayOfMonth: 1,
    hour: 9,
  },
  templateName: 'AuditPack',
  artifactType: 'zip',
  recipients: [{ recipientId: 'auditor-default', channelType: 's3' }],
  enabled: true,
  lastTriggeredAt: null,
  createdAt: '2026-07-03T00:00:00.000Z',
};

// --- Expiration Alert ---
// IF artifact expires within 7 days → notify sponsor

export const EXPIRATION_ALERT: DeliverySubscription = {
  id: 'sub-expiration-alert-001',
  name: 'Expiration Alert',
  description: 'Alerts sponsor when a delivery artifact is expiring within 7 days',
  trigger: {
    type: 'event',
    eventName: 'artifact.expiring',
    condition: {
      field: 'daysUntilExpiry',
      operator: 'less_than',
      value: 7,
    },
  },
  templateName: 'SponsorReport',
  artifactType: 'html',
  recipients: [{ recipientId: 'sponsor-default', channelType: 'email' }],
  enabled: true,
  lastTriggeredAt: null,
  createdAt: '2026-07-03T00:00:00.000Z',
};

// --- Preset collection ---

export const PRESET_SUBSCRIPTIONS: DeliverySubscription[] = [
  CONFIDENCE_DROP_ALERT,
  WEEKLY_DIGEST,
  MONTHLY_PASSPORT,
  QUARTERLY_AUDIT,
  EXPIRATION_ALERT,
];

// --- Factory ---

export function createDefaultScheduler(): SubscriptionScheduler {
  const scheduler = new SubscriptionScheduler();
  for (const sub of PRESET_SUBSCRIPTIONS) {
    // Deep-clone to prevent test pollution via shared lastTriggeredAt
    scheduler.register(structuredClone(sub));
  }
  return scheduler;
}
