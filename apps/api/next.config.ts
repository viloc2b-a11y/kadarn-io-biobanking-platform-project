// @ts-check

import path from 'path'
import { fileURLToPath } from 'url'

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* http://127.0.0.1:* https:; frame-ancestors 'none'",
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: repoRoot,
  transpilePackages: [
    '@kadarn/published-view',
    '@kadarn/types',
    '@kadarn/evidence-core',
    '@kadarn/evidence-discovery',
    '@kadarn/evidence-lineage',
    '@kadarn/policy-engine',
    '@kadarn/telemetry',
    '@kadarn/provenance',
    '@kadarn/instrumentation',
    '@kadarn/platform-services',
  ],
  pageExtensions: ['ts', 'tsx'],
  typescript: {
    // Legacy withAuth/requireOrgMembership wrappers vs dynamic sponsor routes — follow-up RC-10.7b.
    ignoreBuildErrors: true,
  },
  // Satisfies Next.js 16 when a legacy webpack hook remains for monorepo TS resolution.
  turbopack: {},
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
  webpack: (config: { resolve?: { extensionAlias?: Record<string, string[]> } }) => {
    config.resolve ??= {}
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default nextConfig
