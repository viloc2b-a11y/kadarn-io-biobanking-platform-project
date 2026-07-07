import { z } from 'zod'

export const ORGANIZATION_ACTOR_TYPE = {
  INSTITUTION: 'institution',
  SPONSOR: 'sponsor',
  CRO: 'cro',
  NETWORK: 'network',
  VENDOR: 'vendor',
} as const

export type OrganizationActorType =
  (typeof ORGANIZATION_ACTOR_TYPE)[keyof typeof ORGANIZATION_ACTOR_TYPE]

export const PRIMARY_WORKSPACE = {
  INSTITUTION: 'institution_portfolio_workspace',
  SPONSOR: 'sponsor_workspace',
  CRO: 'cro_workspace',
  NETWORK: 'network_workspace',
  VENDOR: 'contribution_workspace',
} as const

export type PrimaryWorkspaceKind =
  (typeof PRIMARY_WORKSPACE)[keyof typeof PRIMARY_WORKSPACE]

export const ASSET_PERSISTENCE = {
  SITE_CONTINUITY_PROFILE: 'site_continuity_profiles',
  SPONSOR_PORTFOLIO: 'sponsor_portfolios',
  DERIVED_WORKSPACE: 'derived_workspace',
} as const

export type AssetPersistence =
  (typeof ASSET_PERSISTENCE)[keyof typeof ASSET_PERSISTENCE]

export interface PrimaryWorkspacePlan {
  kind: PrimaryWorkspaceKind
  label: string
  status: 'initialized'
}

export interface ActorAssetPlan {
  key: string
  label: string
  persistence: AssetPersistence
}

export interface OrganizationProvisioningPlan {
  actorType: OrganizationActorType
  capabilityKeys: string[]
  organizationVisibilityScope: 'organization'
  primaryWorkspace: PrimaryWorkspacePlan
  actorAssets: ActorAssetPlan[]
}

const actorCapabilityMap: Record<OrganizationActorType, string[]> = {
  [ORGANIZATION_ACTOR_TYPE.INSTITUTION]: ['clinical_site'],
  [ORGANIZATION_ACTOR_TYPE.SPONSOR]: ['sponsor'],
  [ORGANIZATION_ACTOR_TYPE.CRO]: ['cro'],
  [ORGANIZATION_ACTOR_TYPE.NETWORK]: ['cro'],
  [ORGANIZATION_ACTOR_TYPE.VENDOR]: ['technology_provider'],
}

const primaryWorkspaceMap: Record<OrganizationActorType, PrimaryWorkspacePlan> = {
  [ORGANIZATION_ACTOR_TYPE.INSTITUTION]: {
    kind: PRIMARY_WORKSPACE.INSTITUTION,
    label: 'Institution Portfolio Workspace',
    status: 'initialized',
  },
  [ORGANIZATION_ACTOR_TYPE.SPONSOR]: {
    kind: PRIMARY_WORKSPACE.SPONSOR,
    label: 'Sponsor Workspace',
    status: 'initialized',
  },
  [ORGANIZATION_ACTOR_TYPE.CRO]: {
    kind: PRIMARY_WORKSPACE.CRO,
    label: 'CRO Workspace',
    status: 'initialized',
  },
  [ORGANIZATION_ACTOR_TYPE.NETWORK]: {
    kind: PRIMARY_WORKSPACE.NETWORK,
    label: 'Network Workspace',
    status: 'initialized',
  },
  [ORGANIZATION_ACTOR_TYPE.VENDOR]: {
    kind: PRIMARY_WORKSPACE.VENDOR,
    label: 'Contribution Workspace',
    status: 'initialized',
  },
}

const actorAssetMap: Record<OrganizationActorType, ActorAssetPlan[]> = {
  [ORGANIZATION_ACTOR_TYPE.INSTITUTION]: [
    {
      key: 'institution_portfolio',
      label: 'Institution Portfolio',
      persistence: ASSET_PERSISTENCE.SITE_CONTINUITY_PROFILE,
    },
    {
      key: 'draft_passport',
      label: 'Draft Passport',
      persistence: ASSET_PERSISTENCE.SITE_CONTINUITY_PROFILE,
    },
    {
      key: 'default_workspace',
      label: 'Default Workspace',
      persistence: ASSET_PERSISTENCE.DERIVED_WORKSPACE,
    },
  ],
  [ORGANIZATION_ACTOR_TYPE.SPONSOR]: [
    {
      key: 'sponsor_workspace',
      label: 'Sponsor Workspace',
      persistence: ASSET_PERSISTENCE.DERIVED_WORKSPACE,
    },
    {
      key: 'sponsor_portfolio',
      label: 'Sponsor Portfolio',
      persistence: ASSET_PERSISTENCE.SPONSOR_PORTFOLIO,
    },
  ],
  [ORGANIZATION_ACTOR_TYPE.CRO]: [
    {
      key: 'cro_workspace',
      label: 'CRO Workspace',
      persistence: ASSET_PERSISTENCE.DERIVED_WORKSPACE,
    },
  ],
  [ORGANIZATION_ACTOR_TYPE.NETWORK]: [
    {
      key: 'network_workspace',
      label: 'Network Workspace',
      persistence: ASSET_PERSISTENCE.DERIVED_WORKSPACE,
    },
  ],
  [ORGANIZATION_ACTOR_TYPE.VENDOR]: [
    {
      key: 'contribution_workspace',
      label: 'Contribution Workspace',
      persistence: ASSET_PERSISTENCE.DERIVED_WORKSPACE,
    },
  ],
}

const trimmedString = z.string().transform(value => value.trim())

export const organizationProvisioningRequestSchema = z.object({
  actor_type: z.enum([
    ORGANIZATION_ACTOR_TYPE.INSTITUTION,
    ORGANIZATION_ACTOR_TYPE.SPONSOR,
    ORGANIZATION_ACTOR_TYPE.CRO,
    ORGANIZATION_ACTOR_TYPE.NETWORK,
    ORGANIZATION_ACTOR_TYPE.VENDOR,
  ]),
  organization: z.object({
    name: trimmedString.pipe(z.string().min(1, 'Organization name is required').max(200)),
    country: trimmedString
      .pipe(z.string().length(2, 'Country must be ISO 3166-1 alpha2'))
      .transform(value => value.toUpperCase()),
    website: z
      .union([trimmedString.pipe(z.string().url('Website must be a valid URL')), z.literal('')])
      .optional()
      .transform(value => value || null),
  }),
  administrator: z.object({
    first_name: trimmedString.pipe(z.string().min(1, 'First name is required').max(100)),
    last_name: trimmedString.pipe(z.string().min(1, 'Last name is required').max(100)),
    email: trimmedString.pipe(z.string().email('Valid email is required')).transform(value => value.toLowerCase()),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  legal: z.object({
    terms_accepted: z.literal(true),
    privacy_acknowledged: z.literal(true),
  }),
})

export type OrganizationProvisioningRequest =
  z.infer<typeof organizationProvisioningRequestSchema>

export function buildOrganizationProvisioningPlan(
  actorType: OrganizationActorType,
): OrganizationProvisioningPlan {
  return {
    actorType,
    capabilityKeys: actorCapabilityMap[actorType],
    organizationVisibilityScope: 'organization',
    primaryWorkspace: primaryWorkspaceMap[actorType],
    actorAssets: actorAssetMap[actorType],
  }
}
