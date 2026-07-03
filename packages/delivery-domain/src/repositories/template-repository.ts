// ==========================================================================
// DeliveryTemplateRepository — persistence interface (no implementation)
// ==========================================================================

import type { DeliveryTemplate } from '../entities/delivery-template.js';
import type { DeliveryTemplateId } from '../value-objects/ids.js';
import type { ArtifactType } from '../value-objects/artifact-type.js';

export interface DeliveryTemplateRepository {
  /** Persist a new or updated template */
  save(template: DeliveryTemplate): Promise<void>;

  /** Find by ID */
  findById(id: DeliveryTemplateId): Promise<DeliveryTemplate | null>;

  /** Find all templates for a given artifact type */
  findByType(artifactType: ArtifactType): Promise<DeliveryTemplate[]>;

  /** Find the latest version of a template by name */
  findLatestVersion(name: string): Promise<DeliveryTemplate | null>;
}
