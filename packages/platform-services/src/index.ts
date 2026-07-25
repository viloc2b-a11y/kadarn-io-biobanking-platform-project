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

// ─── KAD-002D — Repositories ──────────────────────────────────────────────
export { PersonRepository, LocationRepository, MembershipRepository, EventRepository, SourceRecordRepository, EvidenceSourceRepository, GenerationRuleRepository, ClaimRepository, CapabilityRepository, ClaimVersionRepository } from './repositories';
export type { PersonRecord, LocationRecord, MembershipRecord, RoleRecord, RoleAssignmentRecord } from './repositories';

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

// Lineage Service (KAD-LOOP-CANONICALIZATION-001, Package E)
export * from './lineage-service';

// KAD-LOOP-002 — Generation Pipeline & Lineage Implementation
export * from './generation-pipeline-service';
export * from './lineage-service-impl';
