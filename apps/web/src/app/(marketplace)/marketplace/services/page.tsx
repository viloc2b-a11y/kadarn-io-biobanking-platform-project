import type { Metadata } from 'next'
import { MarketplaceDiscovery } from '@/components/marketplace/discovery'

export const metadata: Metadata = { title: 'Services' }

export default function ServicesPage() {
  return <MarketplaceDiscovery initialTab="services" />
}
