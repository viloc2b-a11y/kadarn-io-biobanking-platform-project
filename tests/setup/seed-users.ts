// ==========================================================================
// Kadarn — Seed Users via Supabase Auth API
// ==========================================================================
// This script creates demo users using the Supabase Auth signUp endpoint
// instead of direct SQL. Only the Auth API produces login-capable users.
//
// Usage: npx tsx setup/seed-users.ts
// ==========================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54331';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

interface SeedUser {
  email: string;
  password: string;
  fullName: string;
}

const USERS: SeedUser[] = [
  // Platform admin (cross-org, gets memberships via SQL seed)
  { email: 'admin@kadarn.test',    password: 'Test123!', fullName: 'Kadarn Admin' },
  // One user per organization
  { email: 'sponsor@kadarn.test',  password: 'Test123!', fullName: 'Sarah Chen' },
  { email: 'cro@kadarn.test',      password: 'Test123!', fullName: 'Miguel Torres' },
  { email: 'site@kadarn.test',     password: 'Test123!', fullName: 'Emily Nakamura' },
  { email: 'biobank@kadarn.test',  password: 'Test123!', fullName: 'James Okafor' },
  { email: 'lab@kadarn.test',      password: 'Test123!', fullName: 'Anna Weber' },
  { email: 'courier@kadarn.test',  password: 'Test123!', fullName: 'Klaus Mueller' },
  { email: 'irb@kadarn.test',      password: 'Test123!', fullName: 'Patricia Okonkwo' },
];

async function seedUsers() {
  const client = createClient(SUPABASE_URL, ANON_KEY);
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of USERS) {
    try {
      const { data, error } = await client.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: { full_name: user.fullName },
        },
      });

      if (error) {
        // If user already exists, that's fine — skip
        if (error.message.includes('already exists') || error.message.includes('already registered')) {
          console.log(`  ⏭️  ${user.email} — already exists`);
          skipped++;
        } else {
          console.log(`  ❌  ${user.email} — ${error.message}`);
          failed++;
        }
      } else if (data.user) {
        console.log(`  ✅  ${user.email} — ${data.user.id}`);
        created++;
      }
    } catch (e: any) {
      console.log(`  ❌  ${user.email} — ${e.message}`);
      failed++;
    }
  }

  console.log(`\n  Done: ${created} created, ${skipped} skipped, ${failed} failed`);
}

seedUsers().catch(console.error);
