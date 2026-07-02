// ==========================================================================
// Evidence Discovery — Document Extraction Service
// ==========================================================================
// Sprint 20A.3A.
//
// Orchestrates document extraction and Layer 1 persistence.
// Uses DocumentExtractionRegistry to select the right provider.
// Persists extraction result as Layer 1 referencing Layer 0.
// ==========================================================================

import { DocumentExtractionRegistry } from './document-extraction-registry.js';
import type { ExtractionInput } from './document-extraction-provider.js';

export interface Layer1Repository {
  createLayer1(input: {
    artifactId: string;
    markdown: string;
    provider: string;
    providerVersion: string;
    sourceHash: string;
    metadata: unknown;
  }): Promise<void>;
}

export class DocumentExtractionService {
  constructor(
    private readonly registry: DocumentExtractionRegistry,
    private readonly layer1Repository: Layer1Repository,
  ) {}

  async extractToLayer1(input: ExtractionInput): Promise<void> {
    const provider = this.registry.getProvider(input);
    const result = await provider.extract(input);

    await this.layer1Repository.createLayer1({
      artifactId: result.artifactId,
      markdown: result.markdown,
      provider: result.metadata.provider,
      providerVersion: result.metadata.providerVersion,
      sourceHash: result.sourceHash,
      metadata: result.metadata,
    });
  }
}
