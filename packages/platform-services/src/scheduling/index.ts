// ==========================================================================
// Scheduling — Cron-based job scheduling
// ==========================================================================

export type JobSchedule = 'once' | 'interval' | 'cron';

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: JobSchedule;
  expression: string; // cron expression or interval in ms
  handler: string; // handler identifier
  organizationId?: string;
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SchedulerService {
  /** Schedule a new job */
  schedule(job: Omit<ScheduledJob, 'id' | 'lastRunAt' | 'nextRunAt' | 'createdAt'>): Promise<ScheduledJob>;

  /** Cancel a scheduled job */
  cancel(jobId: string): Promise<void>;

  /** Pause a scheduled job */
  pause(jobId: string): Promise<void>;

  /** Resume a paused job */
  resume(jobId: string): Promise<void>;

  /** List scheduled jobs */
  list(organizationId?: string): Promise<ScheduledJob[]>;

  /** Get job execution history */
  getHistory(jobId: string, limit?: number): Promise<{ executedAt: string; status: 'success' | 'failed'; durationMs: number; error?: string }[]>;
}
