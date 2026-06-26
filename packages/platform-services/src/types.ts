// ==========================================================================
// Kadarn Platform Services — Shared Types
// ==========================================================================

/** Generic pagination options for list operations */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/** Generic paginated response */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Operation result with optional error */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Actor context for service operations */
export interface ActorContext {
  userId: string;
  organizationId?: string | null;
  programId?: string | null;
}

/** Correlation ID for tracing requests across services */
export type CorrelationId = string;
