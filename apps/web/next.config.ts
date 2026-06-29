import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Supabase local demo anon key — build-time fallback only; override via env in CI/production. */
const BUILD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const BUILD_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

/** API backend URL for rewrites. Defaults to local dev server. */
const API_UPSTREAM = process.env.API_UPSTREAM_URL ?? 'http://localhost:3001'

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

const nextConfig: NextConfig = {
  transpilePackages: ['@kadarn/ui', '@kadarn/types', '@kadarn/auth'],
  turbopack: {
    root: monorepoRoot,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: BUILD_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: BUILD_SUPABASE_ANON_KEY,
  },
  async rewrites() {
    return [
      // Proxy /api/* to the API backend (same-origin, no CORS needed).
      // The web app runs on :3000, the API on :3001.
      // This rewrite lets client components fetch /api/v1/... as relative URLs.
      {
        source: '/api/:path*',
        destination: `${API_UPSTREAM}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
