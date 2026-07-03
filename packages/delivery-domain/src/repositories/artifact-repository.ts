// ==========================================================================
// DeliveryArtifactRepository — persistence interface (no implementation)
// ==========================================================================

import type { DeliveryArtifact } from '../entities/delivery-artifact.js';
import type { DeliveryArtifactId, DeliveryRecipientId } from '../value-objects/ids.js';
import type { ArtifactStatus } from '../value-objects/delivery-status.js';

export interface DeliveryArtifactRepository {
  /** Persist a new or updated artifact */
  save(artifact: DeliveryArtifact): Promise<void>;

  /** Find by ID */
  findById(id: DeliveryArtifactId): Promise<DeliveryArtifact | null>;

  /** Find all artifacts with a given status */
  findByStatus(status: ArtifactStatus): Promise<DeliveryArtifact[]>;

  /** Find all artifacts destined for a given recipient */
  findByRecipient(recipientId: DeliveryRecipientId): Promise<DeliveryArtifact[]>;
}
