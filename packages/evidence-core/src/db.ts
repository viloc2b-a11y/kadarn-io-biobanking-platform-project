// ==========================================================================
// Evidence Core — Database Client & Connection
// ==========================================================================
// Baseline AF-1.0. Sprint 17.2.
// ==========================================================================

/**
 * Database adapter interface for the Evidence Core.
 * Implementations may use Supabase, a direct Postgres client, or test doubles.
 */
export interface DbClient {
  from(table: string): {
    insert(data: Record<string, unknown> | Record<string, unknown>[]): Promise<{ data: unknown; error: unknown }>;
    select(columns: string): { eq: (col: string, val: unknown) => Promise<{ data: unknown; error: unknown }> };
    // Additional query methods added per-engine as needed
  };
  rpc(fn: string, params: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

/**
 * Function type for creating a DbClient bound to a specific actor context.
 */
export type DbClientFactory = () => Promise<DbClient>;
