export const JOIN_ACTORS = {
  institution: {
    href: '/join/institution',
    name: 'Institution / Research Site',
    description: 'Create an institution workspace for research operations, discovery readiness, and future evidence-backed profiles.',
    audience: 'Research sites, hospitals, academic centers, biobanks, and clinical operations teams.',
    outcome: 'Institution workspace with private portfolio setup.',
    formDescription: 'Register an institution profile for future workspace and private portfolio provisioning.',
  },
  sponsor: {
    href: '/join/sponsor',
    name: 'Sponsor',
    description: 'Create a sponsor workspace for portfolio scope, institution evaluation, and study-readiness workflows.',
    audience: 'Biopharma sponsors and study teams evaluating institutions.',
    outcome: 'Sponsor workspace with empty sponsor portfolio scope.',
    formDescription: 'Register a sponsor organization for future workspace and sponsor portfolio provisioning.',
  },
  cro: {
    href: '/join/cro',
    name: 'CRO',
    description: 'Create an operations workspace for study coordination, site collaboration, QC, logistics, and exchange workflows.',
    audience: 'CRO teams coordinating programs across sponsors, sites, labs, and vendors.',
    outcome: 'CRO workspace with program and operations setup.',
    formDescription: 'Register a CRO organization for future operations workspace provisioning.',
  },
  network: {
    href: '/join/network',
    name: 'Network / SMO / Academic Network',
    description: 'Create a network workspace for coordinating sites, operational relationships, and program participation.',
    audience: 'SMOs, academic networks, site networks, and coordinating organizations.',
    outcome: 'Network workspace with private coordination setup.',
    formDescription: 'Register a network organization for future coordination workspace provisioning.',
  },
  vendor: {
    href: '/join/vendor',
    name: 'Vendor / Central Lab / Technology Partner',
    description: 'Create a contribution workspace for confirming operational work, services, lab processing, logistics, or technology support.',
    audience: 'Central labs, logistics vendors, technology partners, and service providers.',
    outcome: 'Contribution workspace with provider setup.',
    formDescription: 'Register a provider organization for future contribution workspace provisioning.',
  },
} as const

export type JoinActorSlug = keyof typeof JOIN_ACTORS

export function isJoinActorSlug(value: string): value is JoinActorSlug {
  return Object.hasOwn(JOIN_ACTORS, value)
}

export function getJoinActorSlugs(): JoinActorSlug[] {
  return Object.keys(JOIN_ACTORS) as JoinActorSlug[]
}
