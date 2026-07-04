/**
 * RC-10.3 — Sponsor passport mock fixtures.
 *
 * Intentionally duplicated from apps/web/src/components/sponsor/passport/passport-mock-data.ts
 * (RC-10.1) until a shared DTO/types package is introduced in RC-10.4+.
 * Keep institutionIds in sync: inst-st-marys, inst-barcelona-oncology, inst-nordic-biobank.
 */

import type { InstitutionalPassport, PassportInstitutionSummary } from './types'

export const MOCK_PORTFOLIO_INSTITUTIONS: PassportInstitutionSummary[] = [
  {
    institutionId: 'inst-st-marys',
    passportId: 'passport-inst-st-marys',
    displayName: "St. Mary's Hospital",
    location: 'London, United Kingdom',
    stability: 'Evolving',
    memberSince: '2024-03-12',
    summary:
      'Evidence suggests oncology biospecimen processing and cold-chain storage capabilities with one open gap on calibration records.',
  },
  {
    institutionId: 'inst-barcelona-oncology',
    passportId: 'passport-inst-barcelona-oncology',
    displayName: 'Barcelona Oncology Research Center',
    location: 'Barcelona, Spain',
    stability: 'Stable',
    memberSince: '2023-11-08',
    summary:
      'Evidence suggests phase-II oncology trial experience and PBMC processing; recent document arrival strengthened timeline claims.',
  },
  {
    institutionId: 'inst-nordic-biobank',
    passportId: 'passport-inst-nordic-biobank',
    displayName: 'Nordic Biobank Helsinki',
    location: 'Helsinki, Finland',
    stability: 'Evidence Refresh Needed',
    memberSince: '2022-06-01',
    summary:
      'Evidence suggests population-scale biobanking; core cold-chain claim is aging and refresh is recommended before study dependency.',
  },
]

const ST_MARYS: InstitutionalPassport = {
  passportId: 'passport-inst-st-marys',
  institutionId: 'inst-st-marys',
  displayName: "St. Mary's Hospital",
  stability: 'Evolving',
  asOf: '2026-07-04T12:00:00.000Z',
  identity: {
    names: [
      { label: 'Primary name', value: "St. Mary's Hospital NHS Trust", source: 'Companies House filing (2024)' },
      { label: 'Alias', value: 'St. Mary\'s Oncology Unit', source: 'Trial registry cross-reference' },
    ],
    locations: [
      { label: 'Primary site', value: 'London, United Kingdom', source: 'Institutional registration document' },
    ],
    relationships: [
      { label: 'Parent network', value: 'London Academic Health Partners', source: 'Network membership letter' },
    ],
  },
  capabilities: [
    {
      id: 'cap-pbmc',
      taxonomyId: 'biospecimen.processing.pbmc',
      label: 'PBMC processing',
      candidateStatement: 'Evidence suggests PBMC processing capability at this institution',
      confidence: 'Moderate',
      temporalState: 'fresh',
      supportingClaimIds: ['claim-pbmc-001'],
    },
    {
      id: 'cap-coldchain',
      taxonomyId: 'logistics.cold_chain.storage',
      label: 'Cold-chain storage',
      candidateStatement: 'Evidence suggests monitored cold-chain storage for biospecimens',
      confidence: 'Low',
      temporalState: 'aging',
      supportingClaimIds: ['claim-cold-001'],
    },
  ],
  claims: [
    {
      id: 'claim-pbmc-001',
      taxonomyId: 'biospecimen.processing.pbmc',
      statement: 'Evidence suggests on-site PBMC isolation with same-day processing windows',
      confidence: 'Moderate',
      confidenceExplanation: 'Supported by two Class B documents from 2025; no contradicting evidence on file.',
      contested: false,
      asOf: '2026-07-04',
      provenance: {
        documentTitle: 'SOP: PBMC Isolation v3.2',
        documentDate: '2025-09-14',
        evidenceClass: 'Class B — operational procedure',
        excerpt: 'Processing window documented as within 4 hours of draw for oncology cohorts.',
      },
    },
    {
      id: 'claim-cold-001',
      taxonomyId: 'logistics.cold_chain.storage',
      statement: 'Evidence suggests −80°C storage with temperature monitoring logs',
      confidence: 'Low',
      confidenceExplanation: 'Calibration certificate expired; counter-evidence not yet resolved.',
      contested: true,
      asOf: '2026-07-04',
      provenance: {
        documentTitle: 'Equipment maintenance log excerpt',
        documentDate: '2024-11-02',
        evidenceClass: 'Class C — maintenance record',
        excerpt: 'Last calibration recorded November 2024; refresh pending.',
      },
    },
  ],
  recommendations: [
    {
      id: 'rec-001',
      action: 'Request updated cold-chain calibration records',
      reason: 'Calibration evidence is past decay horizon for depended-upon storage claim',
      expectedImpact: 'Would clarify storage claim confidence for active feasibility profiles',
      isNextAction: true,
    },
    {
      id: 'rec-002',
      action: 'Review PBMC SOP against Study ABC requirements',
      reason: 'Open feasibility profile includes same-day processing threshold',
      expectedImpact: 'Would confirm requirement 3 of 6 for Study ABC',
      isNextAction: false,
    },
  ],
  history: [
    {
      id: 'hist-001',
      occurredAt: '2026-06-28T09:00:00.000Z',
      eventType: 'Evidence arrival',
      description: 'New SOP revision arrived for PBMC isolation',
    },
    {
      id: 'hist-002',
      occurredAt: '2026-06-12T14:30:00.000Z',
      eventType: 'Confidence movement',
      description: 'Cold-chain claim confidence marked for review due to aging calibration',
    },
    {
      id: 'hist-003',
      occurredAt: '2025-11-08T10:00:00.000Z',
      eventType: 'Portfolio membership',
      description: 'Institution added to sponsor portfolio',
      actor: 'E2E Workspace User',
    },
  ],
}

const BARCELONA: InstitutionalPassport = {
  passportId: 'passport-inst-barcelona-oncology',
  institutionId: 'inst-barcelona-oncology',
  displayName: 'Barcelona Oncology Research Center',
  stability: 'Stable',
  asOf: '2026-07-04T12:00:00.000Z',
  identity: {
    names: [
      { label: 'Primary name', value: 'Barcelona Oncology Research Center', source: 'Regional health registry' },
    ],
    locations: [
      { label: 'Primary site', value: 'Barcelona, Spain', source: 'Site registration' },
    ],
    relationships: [],
  },
  capabilities: [
    {
      id: 'cap-onc-trials',
      taxonomyId: 'experience.oncology.phase_ii',
      label: 'Phase II oncology experience',
      candidateStatement: 'Evidence suggests phase-II oncology trial execution in the last five years',
      confidence: 'High',
      temporalState: 'fresh',
      supportingClaimIds: ['claim-onc-001'],
    },
  ],
  claims: [
    {
      id: 'claim-onc-001',
      taxonomyId: 'experience.oncology.phase_ii',
      statement: 'Evidence suggests three phase-II oncology studies completed since 2021',
      confidence: 'High',
      confidenceExplanation: 'Supported by close-out letters and registry entries (Class A/B).',
      contested: false,
      asOf: '2026-07-04',
      provenance: {
        documentTitle: 'Study close-out letter — ONC-2023-014',
        documentDate: '2025-12-01',
        evidenceClass: 'Class A — primary study document',
        excerpt: 'Confirms completion of phase-II oncology protocol with biospecimen endpoints.',
      },
    },
  ],
  recommendations: [
    {
      id: 'rec-b-001',
      action: 'Compare against Study ABC geography requirements',
      reason: 'Portfolio latency opportunity for Spain-based oncology profile',
      expectedImpact: 'May satisfy geography requirement without new search',
      isNextAction: true,
    },
  ],
  history: [
    {
      id: 'hist-b-001',
      occurredAt: '2026-06-01T08:00:00.000Z',
      eventType: 'Evidence arrival',
      description: 'Close-out letter discovered for ONC-2023-014',
    },
  ],
}

const NORDIC: InstitutionalPassport = {
  passportId: 'passport-inst-nordic-biobank',
  institutionId: 'inst-nordic-biobank',
  displayName: 'Nordic Biobank Helsinki',
  stability: 'Evidence Refresh Needed',
  asOf: '2026-07-04T12:00:00.000Z',
  identity: {
    names: [
      { label: 'Primary name', value: 'Nordic Biobank Helsinki', source: 'National biobank register' },
    ],
    locations: [
      { label: 'Primary site', value: 'Helsinki, Finland', source: 'Registry' },
    ],
    relationships: [
      { label: 'Network', value: 'Nordic Biobank Consortium', source: 'Consortium agreement excerpt' },
    ],
  },
  capabilities: [
    {
      id: 'cap-population',
      taxonomyId: 'population.access.oncology',
      label: 'Oncology population access',
      candidateStatement: 'Evidence suggests access to oncology patient population for biobanking',
      confidence: 'Moderate',
      temporalState: 'aging',
      supportingClaimIds: ['claim-pop-001'],
    },
  ],
  claims: [
    {
      id: 'claim-pop-001',
      taxonomyId: 'population.access.oncology',
      statement: 'Evidence suggests cohort access agreements covering oncology patients',
      confidence: 'Moderate',
      confidenceExplanation: 'Agreement dated 2023; refresh recommended per decay policy.',
      contested: false,
      asOf: '2026-07-04',
      provenance: {
        documentTitle: 'Cohort access agreement summary',
        documentDate: '2023-04-18',
        evidenceClass: 'Class B — contractual summary',
        excerpt: 'Documents oncology cohort scope; renewal cycle not confirmed in latest extract.',
      },
    },
  ],
  recommendations: [
    {
      id: 'rec-n-001',
      action: 'Trigger evidence refresh for cohort access claim',
      reason: 'Core claim past freshness threshold',
      expectedImpact: 'Restores confidence state before portfolio review cycle',
      isNextAction: true,
    },
  ],
  history: [
    {
      id: 'hist-n-001',
      occurredAt: '2026-05-15T11:00:00.000Z',
      eventType: 'Stability change',
      description: 'Passport marked Evidence Refresh Needed',
    },
  ],
}

const PASSPORTS: Record<string, InstitutionalPassport> = {
  'inst-st-marys': ST_MARYS,
  'inst-barcelona-oncology': BARCELONA,
  'inst-nordic-biobank': NORDIC,
}

export function getPortfolioInstitutions(): PassportInstitutionSummary[] {
  return MOCK_PORTFOLIO_INSTITUTIONS
}

export function getPassportByInstitutionId(institutionId: string): InstitutionalPassport | undefined {
  return PASSPORTS[institutionId]
}
