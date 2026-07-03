// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@kadarn/published-view',
    '@kadarn/types',
    '@kadarn/evidence-discovery',
    '@kadarn/evidence-lineage',
    '@kadarn/policy-engine',
    '@kadarn/telemetry',
    '@kadarn/provenance',
    '@kadarn/domain-events',
  ],
  pageExtensions: ['ts', 'tsx'],
  webpack: (config: { resolve?: { extensionAlias?: Record<string, string[]> } }) => {
    config.resolve ??= {}
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
};

export default nextConfig;
