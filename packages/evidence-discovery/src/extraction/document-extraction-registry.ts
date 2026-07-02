// ==========================================================================
// Evidence Discovery — Document Extraction Registry
// ==========================================================================
// Sprint 20A.3A.
//
// Holds all available DocumentExtractionProvider implementations.
// Selects the right provider for a given input.
// ==========================================================================

import type { DocumentExtractionProvider, ExtractionInput } from './document-extraction-provider.js';

export class DocumentExtractionRegistry {
  constructor(private readonly providers: DocumentExtractionProvider[]) {}

  /** Register additional providers */
  register(provider: DocumentExtractionProvider): void {
    this.providers.push(provider);
  }

  /** Find the first provider that supports this input */
  getProvider(input: ExtractionInput): DocumentExtractionProvider {
    const provider = this.providers.find(p => p.supports(input));

    if (!provider) {
      throw new Error(`No extraction provider supports ${input.mimeType} (${input.filename})`);
    }

    return provider;
  }

  /** List all registered providers */
  listProviders(): DocumentExtractionProvider[] {
    return [...this.providers];
  }
}
