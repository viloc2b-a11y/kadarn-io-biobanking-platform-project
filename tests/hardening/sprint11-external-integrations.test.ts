// ==========================================================================
// Sprint 11 — External Integrations: static integration gate
// ==========================================================================

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HttpOpaClient,
  ResilientOpaClient,
} from '../../packages/policy-engine/src/opa/http-opa-client';
import {
  createOpaClient,
  LocalOpaClient,
  NullOpaClient,
} from '../../packages/policy-engine/src/opa/opa-client';
import { DEFAULT_POLICIES } from '../../packages/policy-engine/src/opa/policies';
import {
  EXTERNAL_INTEGRATIONS,
  integrationsByVerdict,
} from '../../packages/integration-engine/src/registry';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const ROOT_PKG = path.join(REPO_ROOT, 'package.json');
const LOCK = path.join(REPO_ROOT, 'package-lock.json');

describe('Sprint 11 — version and ADR', () => {
  it('platform version is hardening.11', () => {
    const pkg = JSON.parse(fs.readFileSync(ROOT_PKG, 'utf-8')) as { version: string };
    expect(pkg.version).toBe('1.0.0-hardening.11');
  });

  it('ADR-023 documents value-based integration decisions', () => {
    const adr = fs.readFileSync(
      path.join(REPO_ROOT, 'docs/adr/adr-023-external-integrations-decision.md'),
      'utf-8',
    );
    expect(adr).toContain('Accepted');
    expect(adr).toContain('Deferred');
    expect(adr).toContain('not satisfy an audit checklist');
  });
});

describe('Sprint 11 — integrations NOT installed without justification', () => {
  it('root package.json has no stripe dependency', () => {
    const pkg = fs.readFileSync(ROOT_PKG, 'utf-8');
    expect(pkg).not.toContain('"stripe"');
  });

  it('package-lock has no stripe packages', () => {
    const lock = fs.readFileSync(LOCK, 'utf-8');
    expect(lock).not.toContain('"stripe"');
  });

  it('registry defers Stripe, FHIR, OpenSpecimen and rejects BBMRI for sprint scope', () => {
    expect(getById('stripe')?.verdict).toBe('defer');
    expect(getById('fhir')?.verdict).toBe('defer');
    expect(getById('openspecimen')?.verdict).toBe('defer');
    expect(getById('bbmri')?.verdict).toBe('reject');
  });

  it('registry integrates OPA and Supabase Realtime only', () => {
    const integrated = integrationsByVerdict('integrate');
    expect(integrated.map(item => item.id).sort()).toEqual(['opa', 'supabase-realtime']);
  });
});

describe('Sprint 11 — OPA HTTP client', () => {
  it('ResilientOpaClient falls back to local client on HTTP failure', async () => {
    const fallback = new LocalOpaClient(DEFAULT_POLICIES);
    const client = new ResilientOpaClient(
      new HttpOpaClient({ baseUrl: 'http://127.0.0.1:1', timeoutMs: 100 }),
      fallback,
    );

    const result = await client.evaluate('organization.membership', {
      actor: { id: 'user-1', role: 'kadarn_internal' },
      organization: { id: 'org-1' },
      resource: { type: 'organization', id: 'org-1' },
      action: 'read',
      context: {},
    });

    expect(typeof result.allow).toBe('boolean');
    expect(result.evaluatedAt).toBeTruthy();
  });

  it('createOpaClient returns LocalOpaClient when OPA_SERVER_URL unset', () => {
    const previous = process.env.OPA_SERVER_URL;
    delete process.env.OPA_SERVER_URL;
    const client = createOpaClient(DEFAULT_POLICIES);
    expect(client).not.toBeInstanceOf(NullOpaClient);
    if (previous) process.env.OPA_SERVER_URL = previous;
  });
});

describe('Sprint 11 — Supabase Realtime wiring', () => {
  it('web hook exists and notifications page uses it', () => {
    expect(fs.existsSync(path.join(REPO_ROOT, 'apps/web/src/hooks/use-supabase-realtime.ts'))).toBe(true);
    const page = fs.readFileSync(
      path.join(REPO_ROOT, 'apps/web/src/app/(koc)/koc/notifications/page.tsx'),
      'utf-8',
    );
    expect(page).toContain('useSupabaseRealtime');
  });

  it('migration 041 enables realtime publication', () => {
    const sql = fs.readFileSync(
      path.join(REPO_ROOT, 'database/migrations/041_external_integrations.sql'),
      'utf-8',
    );
    expect(sql).toContain('supabase_realtime');
    expect(sql).toContain('audit_events');
  });
});

describe('Sprint 11 — optional OPA sidecar artifact', () => {
  it('integrations/opa/docker-compose.yml references openpolicyagent', () => {
    const compose = fs.readFileSync(
      path.join(REPO_ROOT, 'integrations/opa/docker-compose.yml'),
      'utf-8',
    );
    expect(compose).toContain('openpolicyagent/opa');
    expect(compose).toContain('8181');
  });
});

function getById(id: string) {
  return EXTERNAL_INTEGRATIONS.find(item => item.id === id);
}
