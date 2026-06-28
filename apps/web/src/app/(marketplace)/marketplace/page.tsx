import type { Metadata } from 'next'
import { MarketplaceDiscovery } from '@/components/marketplace/discovery'

export const metadata: Metadata = { title: 'Discover' }

export default function MarketplacePage() {
  return <MarketplaceDiscovery />
}
