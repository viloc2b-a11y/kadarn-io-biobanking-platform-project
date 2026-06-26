import { beforeAll, afterAll } from 'vitest';
import { checkSupabaseHealth } from './test-utils';

beforeAll(async () => {
  const healthy = await checkSupabaseHealth();
  if (!healthy) {
    console.warn(
      '\n  ⚠️  Supabase Local is not reachable.\n' +
      '  Start it with: cd ../Kadarn && supabase start\n' +
      '  Then set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in tests/.env\n'
    );
  }
});

afterAll(async () => {
  // Cleanup: sign out all sessions (handled per-test)
});
