import type { Metadata } from 'next'
import { MarketplaceDiscovery } from '@/components/marketplace/discovery'

export const metadata: Metadata = { title: 'Search Marketplace' }

export default function SearchPage() {
  return <MarketplaceDiscovery />
}
