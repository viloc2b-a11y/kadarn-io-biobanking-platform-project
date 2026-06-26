// ==========================================================================
// Feature Flags — Toggle features per organization
// ==========================================================================

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  organizationId?: string; // null = global flag
  enabledForUserIds?: string[];
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface FeatureFlagService {
  /** Check if a feature is enabled for a given context */
  isEnabled(key: string, context?: { userId?: string; organizationId?: string }): Promise<boolean>;

  /** Get all feature flags for an organization */
  getForOrganization(organizationId: string): Promise<FeatureFlag[]>;

  /** Enable a feature for an organization */
  enable(key: string, organizationId?: string): Promise<void>;

  /** Disable a feature for an organization */
  disable(key: string, organizationId?: string): Promise<void>;

  /** Enable a feature for specific users only */
  enableForUsers(key: string, userIds: string[]): Promise<void>;

  /** Create a new feature flag */
  create(flag: Omit<FeatureFlag, 'updatedAt'>): Promise<FeatureFlag>;
}
