// ==========================================================================
// Background Jobs — Async job queue and processing
// ==========================================================================

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  priority: number;
  organizationId?: string;
  createdBy?: string;
  maxRetries: number;
  retryCount: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: unknown;
  createdAt: string;
}

export interface JobHandler<T = unknown> {
  (job: Job<T>): Promise<void>;
}

export interface BackgroundJobsService {
  /** Enqueue a new job */
  enqueue<T>(type: string, payload: T, options?: {
    priority?: number;
    organizationId?: string;
    createdBy?: string;
    maxRetries?: number;
    scheduledAt?: string;
  }): Promise<Job<T>>;

  /** Register a handler for a job type */
  registerHandler(type: string, handler: JobHandler): void;

  /** Get job status */
  getStatus(jobId: string): Promise<Job | null>;

  /** Cancel a queued job */
  cancel(jobId: string): Promise<void>;

  /** List jobs with optional filters */
  list(filters?: { type?: string; status?: JobStatus; organizationId?: string; limit?: number }): Promise<Job[]>;

  /** Retry a failed job */
  retry(jobId: string): Promise<Job>;

  /** Get queue statistics */
  getStats(): Promise<{ queued: number; running: number; completed: number; failed: number }>;
}
