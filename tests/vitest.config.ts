import { defineConfig } from 'vitest/config';

export default defineConfig({
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
