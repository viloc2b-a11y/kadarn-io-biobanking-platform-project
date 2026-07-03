import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { assertPlaywrightEnv, loadWebEnvForPlaywright } from './e2e/load-web-env';

const webDir = path.resolve(__dirname);
const playwrightEnv = loadWebEnvForPlaywright(webDir);
const playwrightPort = process.env.PLAYWRIGHT_PORT ?? '3099';
const baseURL = `http://127.0.0.1:${playwrightPort}`;

assertPlaywrightEnv(playwrightEnv);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx next dev --webpack -p ${playwrightPort}`,
    cwd: webDir,
    url: baseURL,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
    timeout: 120_000,
    env: {
      ...playwrightEnv,
      NODE_ENV: 'development',
      KADARN_E2E_AUTH: 'true',
      NEXT_PUBLIC_KADARN_E2E_AUTH: 'true',
      NEXT_DIST_DIR: '.next-playwright',
    },
  },
});
