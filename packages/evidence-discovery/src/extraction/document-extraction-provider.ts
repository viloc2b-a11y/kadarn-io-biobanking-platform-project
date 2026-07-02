// ==========================================================================
// Evidence Discovery — Document Extraction Provider Interface
// ==========================================================================
// Sprint 20A.3A. KEMS-002.
//
// Kadarn depends on DocumentExtractionProvider.
// MarkItDown is only the first implementation.
// Future providers (Azure, Unstructured, OCR) implement the same contract.
//
// NEVER creates Evidence Candidates.
// NEVER creates Claims.
// NEVER calls AI agents.
// NEVER writes to Evidence Core.
// ==========================================================================

export type SupportedDocumentType = 'pdf' | 'docx' | 'zip';

export type ExtractionProviderName =
  | 'markitdown'
  | 'azure-document-intelligence'
  | 'unstructured'
  | 'ocr';

export interface ExtractionInput {
  artifactId: string;
  filePath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

export interface ExtractionWarning {
  code: string;
  message: string;
}

export interface ExtractionMetadata {
  provider: ExtractionProviderName;
  providerVersion: string;
  startedAt: string;
  completedAt: string;
  processingTimeMs: number;
  pages?: number;
  tablesDetected?: number;
  imagesDetected?: number;
  ocrUsed?: boolean;
  language?: string;
  warnings: ExtractionWarning[];
}

export interface ExtractionResult {
  artifactId: string;
  markdown: string;
  metadata: ExtractionMetadata;
  sourceHash: string;
}

export interface DocumentExtractionProvider {
  name: ExtractionProviderName;

  supports(input: ExtractionInput): boolean;

  extract(input: ExtractionInput): Promise<ExtractionResult>;
}
