// ==========================================================================
// Service client — server-side Supabase (trust/financial runtimes)
// ==========================================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  serviceClient = createClient(url, key);
  return serviceClient;
}

/** Reset cached client (tests only) */
export function resetServiceClient(): void {
  serviceClient = null;
}
