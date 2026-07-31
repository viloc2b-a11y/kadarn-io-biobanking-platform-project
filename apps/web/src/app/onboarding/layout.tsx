import type { Metadata } from 'next'
import styles from '../(onboarding)/onboarding-rendering.module.css'

export const metadata: Metadata = {
  title: 'Onboarding — Kadarn',
  description: 'Set up your institution on Kadarn.',
}

export default function OnboardingWizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.surface} min-h-screen bg-gray-50`}>
      <main className="max-w-4xl mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  )
}
