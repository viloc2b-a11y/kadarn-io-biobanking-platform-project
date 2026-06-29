import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(repoRoot, 'apps/api/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    root: '.',
    setupFiles: ['./setup/global-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    sequence: {
      // Run suites sequentially — tests share Supabase state
      concurrent: false,
    },
    coverage: {
      enabled: false,
      provider: 'v8',
      include: ['security/**/*.test.ts'],
      thresholds: {
        perFile: true,
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
