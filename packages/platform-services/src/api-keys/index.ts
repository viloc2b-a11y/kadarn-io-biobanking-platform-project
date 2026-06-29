// ==========================================================================
// API Keys — External API key management for integrations
// ==========================================================================

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  prefix: string; // first 8 chars of the key (for identification)
  hash: string; // bcrypt hash of the full key
  permissions: string[];
  expiresAt?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateApiKeyOptions {
  organizationId: string;
  name: string;
  permissions?: string[];
  expiresAt?: string;
  createdBy: string;
}

export interface ApiKeyService {
  /** Create a new API key. Returns the full key (once only). */
  create(options: CreateApiKeyOptions): Promise<{ key: ApiKey; rawKey: string }>;

  /** Validate an API key and return the associated organization */
  validate(rawKey: string): Promise<{ organizationId: string; permissions: string[] } | null>;

  /** List API keys for an organization (without the raw key) */
  list(organizationId: string): Promise<ApiKey[]>;

  /** Revoke an API key */
  revoke(id: string, organizationId: string): Promise<void>;

  /** Update API key permissions */
  updatePermissions(id: string, permissions: string[], organizationId: string): Promise<void>;
}
