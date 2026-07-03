/** KUX-006 surface routes — intent-labeled, one question each. */
export interface SponsorSurface {
  id: string
  label: string
  href: string
  question: string
  rhythm: string
}

export const SPONSOR_SURFACES: SponsorSurface[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/sponsor',
    question: 'Where do I stand right now, and what should I do next?',
    rhythm: 'Calm re-entry',
  },
  {
    id: 'portfolio',
    label: 'Portfolio Intelligence',
    href: '/sponsor/portfolio',
    question: 'What is happening across my institution portfolio, and where should I focus next?',
    rhythm: 'Slow · analytical',
  },
  {
    id: 'passports',
    label: 'Institutional Passports',
    href: '/sponsor/passports',
    question: 'Who is this institution?',
    rhythm: 'Deep · explanatory',
  },
  {
    id: 'feasibility',
    label: 'Feasibility Search',
    href: '/sponsor/feasibility',
    question: 'Who satisfies this need?',
    rhythm: 'Fast · exploratory',
  },
  {
    id: 'opportunities',
    label: 'Opportunity Discovery',
    href: '/sponsor/opportunities',
    question: 'What opportunities am I not yet seeing?',
    rhythm: 'Attentive · progressive',
  },
  {
    id: 'risk',
    label: 'Risk Monitoring',
    href: '/sponsor/risk',
    question: 'What requires attention?',
    rhythm: 'Reactive · when warranted',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/sponsor/notifications',
    question: 'What changed that concerns me?',
    rhythm: 'Ambient',
  },
]

/** KUX-005 — five movements (behavior, not routes). */
export interface KuxMovement {
  id: string
  label: string
  summary: string
}

export const KUX_MOVEMENTS: KuxMovement[] = [
  {
    id: 'explore',
    label: 'Explore',
    summary: 'Discover information — scan, browse, follow curiosity through evidence.',
  },
  {
    id: 'focus',
    label: 'Focus',
    summary: 'Reduce context to the relevant — narrow scope with stated filters.',
  },
  {
    id: 'explain',
    label: 'Explain',
    summary: 'Descend toward evidence — ask why Kadarn believes this.',
  },
  {
    id: 'compare',
    label: 'Compare',
    summary: 'Weigh alternatives on their evidence — side by side, never collapsed to a single score.',
  },
  {
    id: 'decide',
    label: 'Decide',
    summary: 'Record a human judgment with its evidentiary context and traceability.',
  },
]

export function findSurfaceByPath(pathname: string): SponsorSurface | undefined {
  if (pathname === '/sponsor') return SPONSOR_SURFACES[0]
  return SPONSOR_SURFACES.find((s) => s.href !== '/sponsor' && pathname.startsWith(s.href))
}
