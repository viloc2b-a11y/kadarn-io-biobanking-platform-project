/**
 * RC-9.1 — Load web env for Playwright (no secret logging).
 * Uses @next/env (same loader as `next dev`) plus optional test overrides.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEnvConfig } from '@next/env';

const SILENT_LOG = { info: () => {}, error: () => {} };

const REQUIRED_PUBLIC_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const out: Record<string, string> = {};
  const content = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function mergeEnv(target: NodeJS.ProcessEnv, source: Record<string, string>, override: boolean): void {
  for (const [key, value] of Object.entries(source)) {
    if (override || target[key] === undefined) {
      target[key] = value;
    }
  }
}

/**
 * Load env files for Playwright + dev server child process.
 * Precedence (later wins where noted):
 *   apps/web via @next/env → root fallback (unset only) → .env.test → .env.playwright
 */
export function loadWebEnvForPlaywright(webDir: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };

  loadEnvConfig(webDir, true, SILENT_LOG);
  mergeEnv(env, process.env, true);

  const rootDir = path.resolve(webDir, '../..');
  for (const file of ['.env.local', '.env']) {
    mergeEnv(env, parseEnvFile(path.join(rootDir, file)), false);
  }

  for (const file of ['.env.test', '.env.playwright']) {
    mergeEnv(env, parseEnvFile(path.join(webDir, file)), true);
  }

  return env;
}

export function assertPlaywrightEnv(env: NodeJS.ProcessEnv): void {
  const missing = REQUIRED_PUBLIC_KEYS.filter((key) => !env[key]?.trim());

  if (missing.length === 0) return;

  throw new Error(
    [
      'Playwright E2E: required public env vars are not loaded.',
      `Missing: ${missing.join(', ')}`,
      'Fix: copy apps/web/.env.example → apps/web/.env.local (local dev)',
      '  or apps/web/.env.test.example → apps/web/.env.test (CI / agents)',
      'Never commit real keys. Do not hardcode secrets in playwright.config.ts.',
    ].join('\n'),
  );
}
