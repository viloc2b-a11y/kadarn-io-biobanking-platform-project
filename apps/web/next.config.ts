import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@kadarn/ui', '@kadarn/types', '@kadarn/auth'],
}

export default nextConfig
