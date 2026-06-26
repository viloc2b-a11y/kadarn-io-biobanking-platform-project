import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Typed demo users matching seed data 011
// ---------------------------------------------------------------------------
export type DemoUserRole =
  | 'admin'
  | 'sponsor'
  | 'cro'
  | 'site'
  | 'biobank'
  | 'lab'
  | 'courier'
  | 'irb';

export interface DemoUser {
  email: string;
  password: string;
  organizationId: string;
  organizationName: string;
}

export const DEMO_USERS: Record<DemoUserRole, DemoUser> = {
  admin:   { email: 'admin@kadarn.test',    password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000001', organizationName: 'PharmaCorp' },
  sponsor: { email: 'sponsor@kadarn.test',  password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000001', organizationName: 'PharmaCorp' },
  cro:     { email: 'cro@kadarn.test',      password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000002', organizationName: 'ClinResearch CRO' },
  site:    { email: 'site@kadarn.test',     password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000003', organizationName: 'Univ Medical Center' },
  biobank: { email: 'biobank@kadarn.test',  password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000004', organizationName: 'National Biobank' },
  lab:     { email: 'lab@kadarn.test',      password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000005', organizationName: 'Advanced Path Lab' },
  courier: { email: 'courier@kadarn.test',  password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000006', organizationName: 'Global Cold Chain' },
  irb:     { email: 'irb@kadarn.test',      password: 'Test123!', organizationId: 'a0000000-0000-0000-0000-000000000007', organizationName: 'Central IRB' },
};

// Fixed UUIDs from seed data
export const ORG_IDS = {
  pharmaCorp:      'a0000000-0000-0000-0000-000000000001',
  clinResearch:    'a0000000-0000-0000-0000-000000000002',
  univMedical:     'a0000000-0000-0000-0000-000000000003',
  nationalBiobank: 'a0000000-0000-0000-0000-000000000004',
  advancedLab:     'a0000000-0000-0000-0000-000000000005',
  globalColdChain: 'a0000000-0000-0000-0000-000000000006',
  centralIrb:      'a0000000-0000-0000-0000-000000000007',
} as const;

export const PROGRAM_IDS = {
  tnbcRetro: 'b0000000-0000-0000-0000-000000000001',
  nsclcLbio: 'b0000000-0000-0000-0000-000000000002',
} as const;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
export interface TestConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
}

let _config: TestConfig | null = null;

export function getConfig(): TestConfig {
  if (_config) return _config;

  const url = process.env.SUPABASE_URL || 'http://localhost:54321';

  // In CI, keys must be provided via env vars. For local dev, we load a .env file.
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!anonKey || !serviceKey) {
    throw new Error(
      'Missing Supabase keys. Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Get them from: supabase status (in the Kadarn prototype repo)\n' +
      'Or copy tests/test-config.example.ts to tests/.env and fill in values.'
    );
  }

  _config = { supabaseUrl: url, supabaseAnonKey: anonKey, supabaseServiceRoleKey: serviceKey };
  return _config;
}

// ---------------------------------------------------------------------------
// Authenticated Supabase client factory
// ---------------------------------------------------------------------------
export interface AuthenticatedClient {
  client: SupabaseClient;
  session: Session;
  userId: string;
}

/**
 * Creates a Supabase client authenticated as the given demo user.
 * This simulates a real browser session with a valid JWT.
 */
export async function signInAs(role: DemoUserRole): Promise<AuthenticatedClient> {
  const config = getConfig();
  const user = DEMO_USERS[role];

  const client = createClient(config.supabaseUrl, config.supabaseAnonKey);

  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error || !data.session) {
    throw new Error(
      `Sign in failed for ${user.email}: ${error?.message || 'no session returned'}\n` +
      'Make sure Supabase Local is running and seed data (migration 011) has been applied.'
    );
  }

  return {
    client,
    session: data.session,
    userId: data.user.id,
  };
}

/**
 * Creates a Supabase client with the service_role key (bypasses RLS).
 * Only for test setup/teardown, not for security testing.
 */
export function createServiceClient(): SupabaseClient {
  const config = getConfig();
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Assertion helpers for RLS
// ---------------------------------------------------------------------------

/**
 * Attempts to perform a SELECT on a table as the given user.
 * Returns the rows if successful, or throws with the RLS error.
 */
export async function trySelect(
  actor: AuthenticatedClient,
  table: string,
  query?: Record<string, any>,
  limit = 10,
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    let q = actor.client.from(table).select('*').limit(limit);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        q = q.eq(key, value);
      }
    }
    const { data, error } = await q;
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Attempts to INSERT a row as the given user.
 * Returns the result or the RLS error.
 */
export async function tryInsert(
  actor: AuthenticatedClient,
  table: string,
  row: Record<string, any>,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await actor.client.from(table).insert(row).select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Attempts to UPDATE a row as the given user.
 */
export async function tryUpdate(
  actor: AuthenticatedClient,
  table: string,
  match: Record<string, any>,
  updates: Record<string, any>,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let q = actor.client.from(table).update(updates);
    for (const [key, value] of Object.entries(match)) {
      q = q.eq(key, value);
    }
    const { data, error } = await q.select();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Attempts to DELETE a row as the given user.
 */
export async function tryDelete(
  actor: AuthenticatedClient,
  table: string,
  match: Record<string, any>,
): Promise<{ success: boolean; error?: string }> {
  try {
    let q = actor.client.from(table).delete();
    for (const [key, value] of Object.entries(match)) {
      q = q.eq(key, value);
    }
    const { error } = await q;
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Tries to sign in with a tampered or manipulated JWT payload.
 * Returns success/failure of the auth attempt.
 */
export async function trySignInWithToken(
  accessToken: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  const config = getConfig();
  const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data, error } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: '',
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data: data.user };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const config = getConfig();
    const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { error } = await client.from('organizations').select('id').limit(1);
    if (error && error.code === 'PGRST301') {
      // Table exists but RLS blocks — that means Supabase IS running
      return true;
    }
    // No error or different error — check if we can reach the server
    if (!error) return true;
    return false;
  } catch {
    return false;
  }
}
