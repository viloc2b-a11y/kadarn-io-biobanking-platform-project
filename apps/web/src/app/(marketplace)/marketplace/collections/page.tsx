import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Collections' }

// Collections reuses the discovery component filtered to research types
import { MarketplaceDiscovery } from '@/components/marketplace/discovery'

export default function CollectionsPage() {
  return <MarketplaceDiscovery initialTab="research" />
}
