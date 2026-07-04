import { notFound } from 'next/navigation'
import { PassportDetail } from '@/components/sponsor/passport/passport-detail'
import { getPassportByInstitutionId } from '@/components/sponsor/passport/passport-mock-data'

interface PageProps {
  params: Promise<{ institutionId: string }>
}

export default async function SponsorPassportDetailPage({ params }: PageProps) {
  const { institutionId } = await params
  const passport = getPassportByInstitutionId(institutionId)

  if (!passport) {
    notFound()
  }

  return <PassportDetail passport={passport} />
}
