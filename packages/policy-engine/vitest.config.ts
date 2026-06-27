import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: '../..',
    include: ['tests/policy/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
