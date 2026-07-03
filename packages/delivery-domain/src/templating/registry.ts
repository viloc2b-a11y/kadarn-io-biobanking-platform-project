// ==========================================================================
// TemplateRegistry — manages versioned delivery templates
// ==========================================================================

import type { DeliveryTemplate } from '../entities/delivery-template.js';

export class TemplateRegistry {
  private templates: Map<string, DeliveryTemplate> = new Map();

  /** Register a template. Throws if template with same id already exists. */
  register(template: DeliveryTemplate): void {
    if (this.templates.has(template.id)) {
      throw new Error(`Template already registered: ${template.id}`);
    }
    this.templates.set(template.id, template);
  }

  /** Find a template by exact id */
  findById(id: string): DeliveryTemplate | undefined {
    return this.templates.get(id);
  }

  /** Find all versions of a template by name (e.g. 'SponsorReport') */
  findByName(name: string): DeliveryTemplate[] {
    const results: DeliveryTemplate[] = [];
    for (const template of this.templates.values()) {
      if (template.name === name) {
        results.push(template);
      }
    }
    return results.sort((a, b) => a.version - b.version);
  }

  /** Find the latest version of a template by name */
  findLatest(name: string): DeliveryTemplate | undefined {
    const versions = this.findByName(name);
    return versions.length > 0 ? versions[versions.length - 1] : undefined;
  }

  /** Find a specific version of a template by name */
  findByNameAndVersion(name: string, version: number): DeliveryTemplate | undefined {
    for (const template of this.templates.values()) {
      if (template.name === name && template.version === version) {
        return template;
      }
    }
    return undefined;
  }

  /** List templates by category */
  listByCategory(category: string): DeliveryTemplate[] {
    const results: DeliveryTemplate[] = [];
    for (const template of this.templates.values()) {
      if (template.metadata.category === category) {
        results.push(template);
      }
    }
    return results;
  }

  /** List all registered templates */
  listAll(): DeliveryTemplate[] {
    return Array.from(this.templates.values());
  }

  /** Deprecate a template version (marks it and sets supersededBy) */
  deprecate(id: string, supersededBy: string): void {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }
    const deprecated: DeliveryTemplate = {
      ...template,
      metadata: {
        ...template.metadata,
        deprecated: true,
        supersededBy,
      },
      updatedAt: new Date().toISOString(),
    };
    this.templates.set(id, deprecated);
  }

  /** Check if a template exists */
  has(id: string): boolean {
    return this.templates.has(id);
  }

  /** Total number of registered templates */
  get count(): number {
    return this.templates.size;
  }

  /** Clear all templates (for testing) */
  clear(): void {
    this.templates.clear();
  }
}
