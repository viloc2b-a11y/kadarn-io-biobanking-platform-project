// ==========================================================================
// Kadarn Platform Services — Main Export
// ==========================================================================
// All services are exported as interfaces and default implementations.
// Engines import what they need — never import from subpaths directly.
// ==========================================================================

export * from './types';

// Event Bus
export { InMemoryEventBus } from './event-bus';
export type { EventBus, EventHandler, PublishOptions } from './event-bus';

// Configuration
export { EnvConfigurationService } from './configuration';
export type { ConfigurationService } from './configuration';

// Idempotency
export { InMemoryIdempotencyService } from './idempotency';
export type { IdempotencyService } from './idempotency';

// Notification
export type { NotificationService, Notification, SendEmailOptions, SendInAppOptions } from './notification';

// File Service
export type { FileService, FileMetadata, UploadOptions } from './file-service';

// Search
export type { SearchService, SearchQuery, SearchResult, SearchResults, SearchableEntity } from './search';

// Webhooks
export type { WebhookService, WebhookConfig, WebhookDelivery, WebhookEvent } from './webhooks';

// API Keys
export type { ApiKeyService, ApiKey, CreateApiKeyOptions } from './api-keys';

// Feature Flags
export type { FeatureFlagService, FeatureFlag } from './feature-flags';

// Observability
export { ConsoleLogger, NoopMetricsService } from './observability';
export type { Logger, LogEntry, LogLevel, MetricsService } from './observability';

// Rate Limiting
export type { RateLimitingService, RateLimitRule, RateLimitResult } from './rate-limiting';

// Distributed Locking
export type { DistributedLockingService, LockOptions } from './distributed-locking';

// Scheduling
export type { SchedulerService, ScheduledJob, JobSchedule } from './scheduling';

// Background Jobs
export type { BackgroundJobsService, Job, JobStatus, JobHandler } from './background-jobs';
