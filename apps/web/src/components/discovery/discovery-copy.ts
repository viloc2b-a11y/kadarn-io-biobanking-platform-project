// User-facing product language for Institutional Discovery / Discovery Workbench.
// Internal code names (DashboardData, fetchDiscoveryDashboard) stay unchanged.

export const DISCOVERY_COPY = {
  eyebrow: 'Institutional Discovery',
  workbenchTitle: 'Discovery Workbench',
  workbenchIntro:
    'Review what Kadarn reconstructed from available artifacts — snapshots, profiles, and pipeline outputs. '
    + 'Outputs are provisional until a reviewer curates them. Nothing here is written to Evidence Core.',
  sessionEmpty: 'No institutional discovery sessions yet.',
  sessionEmptyHint: 'Open a session to begin reconstructing institutional evidence.',
  signIn: 'Sign in to access Institutional Discovery',
  metricsTitle: 'Reconstruction summary',
  metricsHelp:
    'Counts describe what the pipeline reconstructed in this session. '
    + 'They reflect discovery confidence and extraction signals — not sponsor ratings or canonical evidence.',
  uncertaintyNote: 'Reconstructed from available artifacts. Needs human review.',

  // Recognition Overview
  recognitionHeadline: 'This is what Kadarn found about your institution.',
  recognitionSubheadline: 'Kadarn reconstructed an initial evidence profile from available discovery data.',
  reviewHeadline: 'Review Overview',
  reviewSubheadline: 'What needs human review, what needs curation, and what blocks presentation readiness.',
  notAvailableYet: 'Not available yet',
  noEvidenceFoundYet: 'No evidence found yet',
  needsReview: 'Needs review',

  // First-run states
  firstRunEmpty: 'Open a discovery session to let Kadarn reconstruct an initial evidence profile.',
  firstRunLoading: 'Kadarn is reconstructing the institutional evidence profile.',
  firstRunError: 'We could not load this discovery profile. Retry or select another session.',

  // Institutional Story (Narrative)
  storyTitle: 'Institutional Story',
  storyDescription:
    'Traceable narrative Kadarn synthesized from timeline, capabilities found, and evidence claims — reconstructed from available artifacts.',
  storyWhoSection: 'Who Kadarn found you are',
  storyWhatSupportsSection: 'What your evidence currently supports',
  storyWhatToStrengthenSection: 'What still needs to be strengthened',

  // Evidence Gaps (action-oriented)
  evidenceGapsTitle: 'Evidence Gaps',
  evidenceGapsDescription:
    'Missing or weak evidence Kadarn found while reconstructing evidence claims. Kadarn does not invent evidence to fill gaps — upload or curate instead.',
  gapWhyItMatters: 'Why it matters',
  gapNextAction: 'What to do next',
  gapBlocksSponsorReadiness: 'Blocks sponsor readiness',
  gapDoesNotBlockSponsorReadiness: 'Does not block sponsor readiness',

  // Gap action labels
  actionUploadEvidence: 'Upload evidence',
  actionRequestExternalConfirmation: 'Request external confirmation',
  actionReviewInconsistency: 'Review inconsistency',
  actionUpdateExpiredEvidence: 'Update expired evidence',
  actionAddValidationNote: 'Add validation note',
  actionDeferReview: 'Defer review',

  // Sponsor Readiness Summary
  sponsorReadinessTitle: 'Sponsor Readiness Summary',
  sponsorReadinessDescription:
    'A categorical read of how presentation-ready this institutional evidence profile is, based on capabilities, evidence claims, and evidence gaps.',
  sponsorReadinessInsufficientData: 'Not enough evidence yet to assess presentation readiness.',
  sponsorReadinessPresentationReady: 'Presentation-ready',
  sponsorReadinessPresentationReadyDescription:
    'Evidence claims are supported by capabilities found with no critical evidence gaps outstanding.',
  sponsorReadinessNeedsAdditionalEvidence: 'Needs additional evidence',
  sponsorReadinessNeedsAdditionalEvidenceDescription:
    'Critical evidence gaps remain that should be resolved before this profile is presented.',
  sponsorReadinessNeedsHumanReview: 'Needs human review',
  sponsorReadinessNeedsHumanReviewDescription:
    'Evidence claims or capabilities have not yet been reviewed by a curator.',
  sponsorReadinessNotEnoughEvidence: 'Not enough evidence yet',
  sponsorReadinessNotEnoughEvidenceDescription:
    'Kadarn has not reconstructed enough capabilities or evidence claims to assess readiness.',
  sponsorReadinessStrongestCapabilities: 'Strongest supported capabilities',
  sponsorReadinessCapabilitiesNeedingEvidence: 'Capabilities needing evidence',
  sponsorReadinessRiskAreas: 'Risk areas',
  sponsorReadinessNextStep: 'Recommended next step',

  // Report CTA
  reportCtaLabel: 'Generate Institution Recognition Report',
  reportCtaHelper: 'Report generation will use the reviewed discovery profile.',

  // Recommended next action
  recommendedNextAction: 'Recommended next action',
} as const

export const FORBIDDEN_UI_PHRASES = [
  'verified',
  'certified',
  'trust score',
  'site score',
  'approved',
  'this site has',
  'guaranteed',
  'capability exists',
  'discovery interaction dashboard',
  'claim confidence',
] as const

export const PREFERRED_UI_PHRASES = [
  'Discovery Workbench',
  'Institutional Discovery',
  'Evidence Snapshot',
  'Institution Profile',
  'Validation Notes',
  'Source Trace',
  'claim candidate',
  'Requires review',
  'Discovery confidence',
] as const
