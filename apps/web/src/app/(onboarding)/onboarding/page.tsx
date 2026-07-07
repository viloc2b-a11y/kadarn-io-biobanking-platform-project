'use client'

import { ONBOARDING_JOURNEY, TOTAL_JOURNEY_MINUTES, INTERVIEW_DOMAINS, DERIVED_DOMAINS } from '@/lib/onboarding/onboarding-journey'
import Link from 'next/link'

export default function OnboardingPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Welcome to Kadarn
        </h1>
        <p className="text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
          We are going to build a complete, evidence-backed profile of your institution.
          Not a form. An understanding.
        </p>
      </div>

      {/* The Gate */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Here is what we will build together
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-700">{INTERVIEW_DOMAINS.length}</div>
            <div className="text-sm text-blue-600 mt-1">interview sections</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-700">~{TOTAL_JOURNEY_MINUTES} min</div>
            <div className="text-sm text-blue-600 mt-1">estimated time</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <div className="text-3xl font-bold text-blue-700">{DERIVED_DOMAINS.length}</div>
            <div className="text-sm text-blue-600 mt-1">derived deliverables</div>
          </div>
        </div>

        {/* Journey steps — interview domains */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">You tell us about your institution</h3>
          <div className="space-y-2">
            {INTERVIEW_DOMAINS.map((step, idx) => (
              <div key={step.domain} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{step.label}</div>
                  <div className="text-sm text-gray-500">{step.whyItMatters.slice(0, 90)}...</div>
                </div>
                <div className="text-sm text-gray-400 flex-shrink-0 text-right">
                  ~{step.estimatedMinutes} min
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derived deliverables */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Kadarn derives from your answers</h3>
          <div className="space-y-2">
            {DERIVED_DOMAINS.map((step, idx) => (
              <div key={step.domain} className="flex items-center gap-4 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  ⟐
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{step.label}</div>
                  <div className="text-sm text-gray-500">{step.whatYouGet}</div>
                </div>
                <div className="text-xs text-purple-500 flex-shrink-0">Auto-generated</div>
              </div>
            ))}
          </div>
        </div>

        {/* What you get */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-900 mb-3">At the end, you will have:</h3>
          <ul className="space-y-2 text-green-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>A complete institutional profile — who you are, what you do, who does it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>All your evidence organized — every document proving what you claim.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Your derived capabilities — each one backed by specific evidence.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Your readiness assessment — what programs you are prepared to execute.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="font-semibold">Your Institution Passport — the evidence-backed profile of everything you have built, ready for sponsors and partners.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/onboarding/organization"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-lg shadow-sm"
          >
            Start — Tell us about your organization
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-sm text-gray-400 mt-3">
            Save and continue anytime. Your progress is never lost.
          </p>
        </div>
      </div>
    </div>
  )
}
