import type { Metadata } from 'next'
import { OnboardingProvider } from '@/lib/onboarding/onboarding-context'
import { OnboardingSidebar } from './components/onboarding-sidebar'
import styles from './onboarding-rendering.module.css'

export const metadata: Metadata = {
  title: 'Institution Onboarding — Kadarn',
  description: 'Build your institutional knowledge, evidence, and capabilities.',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <div className={`${styles.surface} flex min-h-screen bg-gray-50`}>
        <OnboardingSidebar />
        <main className="flex-1 ml-64 p-8 max-w-4xl">
          {children}
        </main>
      </div>
    </OnboardingProvider>
  )
}
