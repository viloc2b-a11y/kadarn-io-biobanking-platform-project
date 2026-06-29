// @ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const nextConfig = {
  transpilePackages: [
    '@kadarn/domain-events',
    '@kadarn/financial-engine',
    '@kadarn/knowledge-engine',
    '@kadarn/matching-engine',
    '@kadarn/operational-twins',
    '@kadarn/platform-services',
    '@kadarn/policy-engine',
    '@kadarn/provenance',
    '@kadarn/telemetry',
    '@kadarn/trust-engine',
    '@kadarn/types',
    '@kadarn/workflow-engine',
  ],
  turbopack: {
    root: monorepoRoot,
  },
  pageExtensions: ['ts', 'tsx'],
};

export default nextConfig;
