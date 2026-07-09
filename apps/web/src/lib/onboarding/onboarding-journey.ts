// ==========================================================================
// MVP Sprint 1 — Simplified Journey (8 core modules)
// ==========================================================================
// Replaces the 14-step fine-grained journey with 8 user-facing modules.
// Internal domains (Facilities, Lab, Equipment, Biospecimen) are grouped as Infrastructure.
// Quality, Regulatory, Research Experience are woven into the relevant sections.
//
// KTP-1.3: Added hybrid-trial interview domain for Hybrid Trial Readiness Passport.
// ==========================================================================

export type OnboardingDomain =
  | 'welcome'
  | 'organization'
  | 'people'
  | 'infrastructure'
  | 'hybrid-trial'
  | 'documents'
  | 'memory'
  | 'capabilities'
  | 'readiness'
  | 'passport'
  | 'roadmap'

export interface OnboardingStep {
  domain: OnboardingDomain
  label: string
  description: string
  estimatedMinutes: number
  whyItMatters: string
  whatYouGet: string
  questionCount: number
  requiresDocuments: boolean
  generatesClaims?: string[]
  derivesCapabilities?: string[]
  readinessImpact?: string
  isDerived: boolean  // true = read-only, derived from previous answers
}

export const ONBOARDING_JOURNEY: OnboardingStep[] = [
  {
    domain: 'welcome',
    label: 'Welcome',
    description: 'Your journey to institutional clarity.',
    estimatedMinutes: 2,
    whyItMatters: 'Understand what Kadarn will build for you before you invest time.',
    whatYouGet: 'A clear map of the journey and what you will achieve.',
    questionCount: 0,
    requiresDocuments: false,
    isDerived: false,
  },
  {
    domain: 'organization',
    label: 'Organization',
    description: 'Who you are as an institution.',
    estimatedMinutes: 15,
    whyItMatters: 'Your identity, mission, research experience, and operational footprint. This is what sponsors see first.',
    whatYouGet: 'Institutional profile: type, mission, research experience domains, locations, footprint, and languages.',
    questionCount: 35,
    requiresDocuments: false,
    isDerived: false,
  },
  {
    domain: 'people',
    label: 'People',
    description: 'Your institutional research team and their expertise.',
    estimatedMinutes: 15,
    whyItMatters: 'Sponsors select institutions based on research leadership, investigator depth, staff certifications, and therapeutic expertise.',
    whatYouGet: 'Team profile: research leadership, investigators, coordinators, lab staff, certifications, languages, and therapeutic experience.',
    questionCount: 30,
    requiresDocuments: true,
    isDerived: false,
  },
  {
    domain: 'infrastructure',
    label: 'Infrastructure',
    description: 'Facilities, labs, equipment, biospecimens.',
    estimatedMinutes: 25,
    whyItMatters: 'Your physical and operational infrastructure determines what studies you can execute.',
    whatYouGet: 'Facility map, lab certifications, equipment inventory, biospecimen capabilities.',
    questionCount: 45,
    requiresDocuments: true,
    isDerived: false,
  },
  {
    domain: 'hybrid-trial',
    label: 'Hybrid Trial',
    description: 'Your hybrid and decentralized trial capabilities.',
    estimatedMinutes: 20,
    whyItMatters: 'Hybrid trials are the fastest-growing trial model. Sponsors need to know if you can execute decentralized components including at-home visits, remote monitoring, and biospecimen collection outside the clinic.',
    whatYouGet: 'Hybrid Trial Readiness Passport: site execution, at-home coordination, data integrity, patient diversity, biospecimen-at-home, remote monitoring, vendor management, protocol compliance, safety escalation, and historical experience.',
    questionCount: 55,
    requiresDocuments: true,
    generatesClaims: [
      'clinical_trials.hybrid.site_execution',
      'clinical_trials.hybrid.at_home_coordination',
      'clinical_trials.hybrid.data_integrity',
      'clinical_trials.hybrid.patient_access_diversity',
      'clinical_trials.hybrid.biospecimen_at_home',
      'clinical_trials.hybrid.remote_monitoring',
      'clinical_trials.hybrid.vendor_nurse_coordination',
      'clinical_trials.hybrid.protocol_compliance',
      'clinical_trials.hybrid.safety_escalation',
      'clinical_trials.hybrid.historical_experience',
    ],
    derivesCapabilities: [
      'Hybrid Site Execution',
      'At-Home Coordination',
      'Hybrid Data Integrity',
      'Patient Access & Diversity',
      'Biospecimen-at-Home',
      'Remote Monitoring',
      'Vendor / Home Nurse Coordination',
      'Protocol Compliance Documentation',
      'Safety Escalation',
      'Hybrid Trial Historical Experience',
    ],
    readinessImpact: 'Hybrid Trial Readiness Passport becomes available with evidence-backed evaluation when this domain is completed.',
    isDerived: false,
  },
  {
    domain: 'documents',
    label: 'Documents',
    description: 'Upload the evidence.',
    estimatedMinutes: 15,
    whyItMatters: 'Documents transform claims into proof. Every upload strengthens your capabilities.',
    whatYouGet: 'Evidence library — documents linked to people, labs, equipment, and capabilities.',
    questionCount: 3,
    requiresDocuments: true,
    isDerived: false,
  },
  {
    domain: 'memory',
    label: 'Memory',
    description: 'Your institution over time.',
    estimatedMinutes: 10,
    whyItMatters: 'Institutional experience accumulates across staff, locations, documents, sponsors, inspections, and capabilities.',
    whatYouGet: 'A living institutional timeline that preserves history and links milestones to evidence.',
    questionCount: 1,
    requiresDocuments: false,
    isDerived: false,
  },
  {
    domain: 'capabilities',
    label: 'Capabilities',
    description: 'What you can do.',
    estimatedMinutes: 5,
    whyItMatters: 'All your answers are analyzed to derive what your institution can actually do.',
    whatYouGet: 'Capability map — each capability backed by specific evidence from people, infrastructure, and documents.',
    questionCount: 0,
    requiresDocuments: false,
    isDerived: true,
  },
  {
    domain: 'readiness',
    label: 'Readiness',
    description: 'How ready you are.',
    estimatedMinutes: 5,
    whyItMatters: 'Readiness determines which programs you qualify for. It changes as your institution grows.',
    whatYouGet: 'Readiness assessment across 6 dimensions. Never manually set — always derived from evidence.',
    questionCount: 0,
    requiresDocuments: false,
    isDerived: true,
  },
  {
    domain: 'passport',
    label: 'Passport',
    description: 'Your complete institutional profile.',
    estimatedMinutes: 5,
    whyItMatters: 'The Institution Passport is the current snapshot sponsors, CROs, and partners can review quickly.',
    whatYouGet: 'A 5-section current-state Passport: Who We Are, What We Can Prove, What We Can Do, How Ready We Are, and What We Should Do Next.',
    questionCount: 0,
    requiresDocuments: false,
    isDerived: true,
  },
  {
    domain: 'roadmap',
    label: 'Roadmap',
    description: 'What to build next.',
    estimatedMinutes: 5,
    whyItMatters: 'The Institution Roadmap turns Passport gaps, readiness gaps, evidence gaps, and growth goals into prioritized next actions.',
    whatYouGet: 'A future-facing action plan: immediate actions, capability expansion, readiness improvement, renewal calendar, and strategic growth.',
    questionCount: 0,
    requiresDocuments: false,
    isDerived: true,
  },
]

export const TOTAL_JOURNEY_MINUTES = ONBOARDING_JOURNEY.reduce((sum, s) => sum + s.estimatedMinutes, 0)
export const TOTAL_QUESTIONS = ONBOARDING_JOURNEY.reduce((sum, s) => sum + s.questionCount, 0)
export const INTERVIEW_DOMAINS = ONBOARDING_JOURNEY.filter((s) => !s.isDerived && s.domain !== 'welcome')
export const DERIVED_DOMAINS = ONBOARDING_JOURNEY.filter((s) => s.isDerived)
