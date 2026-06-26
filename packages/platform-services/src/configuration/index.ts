// ==========================================================================
// Configuration Service — Centralized configuration management
// ==========================================================================

export interface ConfigurationService {
  /** Get a configuration value for an organization */
  get<T = string>(key: string, organizationId?: string): Promise<T | null>;

  /** Get all configuration values for an organization */
  getAll(organizationId?: string): Promise<Record<string, unknown>>;

  /** Set a configuration value */
  set(key: string, value: unknown, organizationId?: string): Promise<void>;

  /** Delete a configuration value */
  delete(key: string, organizationId?: string): Promise<void>;
}

/** Environment-variable based implementation (development default) */
export class EnvConfigurationService implements ConfigurationService {
  private prefix: string;

  constructor(prefix = 'KADARN_') {
    this.prefix = prefix;
  }

  async get<T = string>(key: string, _organizationId?: string): Promise<T | null> {
    const envKey = `${this.prefix}${key.toUpperCase().replace(/\./g, '_')}`;
    const value = process.env[envKey];
    if (value === undefined) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async getAll(_organizationId?: string): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(this.prefix)) {
        const configKey = key.slice(this.prefix.length).toLowerCase();
        result[configKey] = value;
      }
    }
    return result;
  }

  async set(_key: string, _value: unknown, _organizationId?: string): Promise<void> {
    console.warn('[Config] Runtime configuration changes require a database-backed implementation');
  }

  async delete(_key: string, _organizationId?: string): Promise<void> {
    console.warn('[Config] Runtime configuration deletion requires a database-backed implementation');
  }
}
