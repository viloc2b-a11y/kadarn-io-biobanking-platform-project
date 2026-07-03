// ==========================================================================
// Kadarn Document Intake Engine — Core Engine
// ==========================================================================
// Sprint 26A — Foundation.
//
// The DocumentIntakeEngine is the entry point for document normalization.
// It accepts a DocumentArtifact and produces a NormalizedDocument using
// the registered IntakeProvider(s).
//
// Boundaries:
//   - Infrastructure layer — no domain knowledge.
//   - Does not depend on Discovery Pipeline or Evidence Core.
//   - Provider-agnostic: any adapter implementing IntakeProvider works.
// ==========================================================================

import type {
  DocumentArtifact,
  NormalizedDocument,
  IntakeProvider,
} from './contracts.js'

// --------------------------------------------------------------------------
// Errors
// --------------------------------------------------------------------------

/** No registered provider can handle the given artifact. */
export class NoSuitableProviderError extends Error {
  constructor(artifact: DocumentArtifact) {
    super(
      `No intake provider supports ${artifact.format} (${artifact.mimeType}) for artifact ${artifact.id}`,
    )
    this.name = 'NoSuitableProviderError'
  }
}

/** Provider normalization failed. */
export class IntakeNormalizationError extends Error {
  constructor(
    public readonly providerName: string,
    public readonly artifactId: string,
    cause: unknown,
  ) {
    super(`Provider ${providerName} failed to normalize artifact ${artifactId}: ${String(cause)}`)
    this.name = 'IntakeNormalizationError'
  }
}

// --------------------------------------------------------------------------
// Engine
// --------------------------------------------------------------------------

/**
 * Kadarn Document Intake Engine.
 *
 * Usage:
 *   const engine = new DocumentIntakeEngine([provider1, provider2])
 *   const normalized = await engine.intake(artifact)
 */
export class DocumentIntakeEngine {
  constructor(private readonly providers: IntakeProvider[]) {}

  /** Register an additional provider at runtime. */
  register(provider: IntakeProvider): void {
    this.providers.push(provider)
  }

  /** List all registered providers. */
  listProviders(): ReadonlyArray<IntakeProvider> {
    return [...this.providers]
  }

  /**
   * Normalize a raw document artifact through the intake pipeline.
   *
   * Selects the first provider that supports the artifact's format,
   * delegates normalization to it, and returns the NormalizedDocument.
   *
   * @throws NoSuitableProviderError if no provider can handle the artifact
   * @throws IntakeNormalizationError if the selected provider fails
   */
  async intake(artifact: DocumentArtifact): Promise<NormalizedDocument> {
    const provider = this.selectProvider(artifact)

    try {
      return await provider.normalize(artifact)
    } catch (cause) {
      throw new IntakeNormalizationError(provider.name, artifact.id, cause)
    }
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private selectProvider(artifact: DocumentArtifact): IntakeProvider {
    const provider = this.providers.find(p => p.supports(artifact))

    if (!provider) {
      throw new NoSuitableProviderError(artifact)
    }

    return provider
  }
}
