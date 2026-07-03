// ==========================================================================
// DeliveryReceiptRepository — persistence interface (no implementation)
// ==========================================================================

import type { DeliveryReceipt } from '../entities/delivery-receipt.js';
import type { DeliveryReceiptId } from '../value-objects/ids.js';

export interface DeliveryReceiptRepository {
  /** Persist a new or updated receipt */
  save(receipt: DeliveryReceipt): Promise<void>;

  /** Find by ID */
  findById(id: DeliveryReceiptId): Promise<DeliveryReceipt | null>;

  /** Find all receipts for a given artifact */
  findByArtifact(artifactId: string): Promise<DeliveryReceipt[]>;

  /** Find the most recent receipt for a given artifact */
  findLatest(artifactId: string): Promise<DeliveryReceipt | null>;
}
