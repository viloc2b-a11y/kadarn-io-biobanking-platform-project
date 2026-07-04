import { PassportDetailLoader } from '@/components/sponsor/passport/passport-detail-loader'

interface PageProps {
  params: Promise<{ institutionId: string }>
}

export default async function SponsorPassportDetailPage({ params }: PageProps) {
  const { institutionId } = await params
  return <PassportDetailLoader institutionId={institutionId} />
}
