import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..', '..');
const databaseMigration = fs.readFileSync(
  path.join(repoRoot, 'database/migrations/042_continuity_engine.sql'),
  'utf-8',
);
const supabaseMigration = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/042_continuity_engine.sql'),
  'utf-8',
);
const legacyDatabaseMigration = fs.readFileSync(
  path.join(repoRoot, 'database/migrations/043_legacy_experience_claims.sql'),
  'utf-8',
);
const legacySupabaseMigration = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/043_legacy_experience_claims.sql'),
  'utf-8',
);

const requiredTables = [
  'site_continuity_profiles',
  'continuity_experience_ledger',
  'continuity_relationships',
  'continuity_capabilities',
  'continuity_performance_metrics',
  'continuity_timeline_events',
  'continuity_evidence_links',
] as const;

describe('Continuity Engine migration', () => {
  it('is mirrored between database and supabase migrations', () => {
    expect(supabaseMigration).toBe(databaseMigration);
  });

  it('creates every required Continuity table', () => {
    for (const table of requiredTables) {
      expect(databaseMigration).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
  });

  it('enables RLS on every Continuity table', () => {
    for (const table of requiredTables) {
      expect(databaseMigration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
  });

  it('links evidence to provenance, audit, domain events, and trust where available', () => {
    expect(databaseMigration).toContain('REFERENCES public.provenance_evidence(id)');
    expect(databaseMigration).toContain('REFERENCES public.audit_events(id)');
    expect(databaseMigration).toContain('REFERENCES public.domain_event_store(id)');
    expect(databaseMigration).toContain('REFERENCES public.trust_events(id)');
  });

  it('keeps earned history append-only for ledger, metrics, and timeline records', () => {
    expect(databaseMigration).toContain(
      "public.apply_append_only_triggers('public.continuity_experience_ledger'::regclass)",
    );
    expect(databaseMigration).toContain(
      "public.apply_append_only_triggers('public.continuity_performance_metrics'::regclass)",
    );
    expect(databaseMigration).toContain(
      "public.apply_append_only_triggers('public.continuity_timeline_events'::regclass)",
    );
  });
});

describe('Legacy experience claims migration', () => {
  it('is mirrored between database and supabase migrations', () => {
    expect(legacySupabaseMigration).toBe(legacyDatabaseMigration);
  });

  it('creates claims, evidence items, and references without duplicating provenance or trust', () => {
    expect(legacyDatabaseMigration).toContain('CREATE TABLE IF NOT EXISTS public.continuity_experience_claims');
    expect(legacyDatabaseMigration).toContain('CREATE TABLE IF NOT EXISTS public.continuity_evidence_items');
    expect(legacyDatabaseMigration).toContain('CREATE TABLE IF NOT EXISTS public.continuity_references');
    expect(legacyDatabaseMigration).toContain('continuity_evidence_link_id UUID REFERENCES public.continuity_evidence_links(id)');
  });

  it('adds explicit claim verification statuses', () => {
    for (const status of [
      'self_reported',
      'evidence_submitted',
      'reference_pending',
      'reference_confirmed',
      'kadarn_verified',
      'rejected',
      'expired',
    ]) {
      expect(legacyDatabaseMigration).toContain(`'${status}'`);
    }
  });

  it('enables RLS and public passport visibility without exposing rejected claims as verified', () => {
    expect(legacyDatabaseMigration).toContain('ALTER TABLE public.continuity_experience_claims ENABLE ROW LEVEL SECURITY');
    expect(legacyDatabaseMigration).toContain('OR is_public = true');
    expect(legacyDatabaseMigration).toContain("verification_status         public.continuity_claim_verification_status NOT NULL DEFAULT 'self_reported'");
  });

  it('does not require PHI fields', () => {
    expect(legacyDatabaseMigration).not.toMatch(/\bpatient_id\b/i);
    expect(legacyDatabaseMigration).not.toMatch(/\bdonor_id\b/i);
    expect(legacyDatabaseMigration).not.toMatch(/\bmrn\b/i);
    expect(legacyDatabaseMigration).not.toMatch(/\bdate_of_birth\b/i);
  });
});
