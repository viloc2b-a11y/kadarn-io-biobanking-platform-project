// Seed users for Kadarn QA — each represents a different access profile
// Passwords: test-${role}-2026
export const SEED_USERS = {
  // No organization — should see onboarding, not workspace
  noorg:    { email: 'noorg@kadarn.test',     role: 'unassigned',  org: null },

  // Multi-org — should be able to switch workspaces
  multiorg: { email: 'multiorg@kadarn.test',  role: 'researcher',  org: ['Biobank A', 'Sponsor X'] },

  // Organization-specific
  sponsor:  { email: 'sponsor@kadarn.test',   role: 'sponsor',     org: 'Sponsor X' },
  biobank:  { email: 'biobank@kadarn.test',   role: 'biobank',     org: 'Biobank A' },
  site:     { email: 'site@kadarn.test',      role: 'clinical_site', org: 'Site 02' },
  lab:      { email: 'lab@kadarn.test',       role: 'processing_lab', org: 'LabCore' },
  koc:      { email: 'koc@kadarn.test',       role: 'platform_admin', org: null },

  // Edge cases
  expired:  { email: 'expired@kadarn.test',   role: 'sponsor',     org: 'Sponsor X', status: 'expired' },
  readonly: { email: 'readonly@kadarn.test',  role: 'viewer',     org: 'Biobank A' },
} as const;

export type SeedUser = keyof typeof SEED_USERS;
