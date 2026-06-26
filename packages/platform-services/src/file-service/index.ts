// ==========================================================================
// File Service — File upload, download, and management
// ==========================================================================

export interface FileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  organizationId: string;
  programId?: string;
  uploadedBy: string;
  storagePath: string;
  createdAt: string;
}

export interface UploadOptions {
  fileName: string;
  mimeType: string;
  content: Buffer | ReadableStream;
  organizationId: string;
  programId?: string;
  userId: string;
}

export interface FileService {
  /** Upload a file */
  upload(options: UploadOptions): Promise<FileMetadata>;

  /** Download a file by ID */
  download(fileId: string): Promise<{ content: Buffer; metadata: FileMetadata }>;

  /** Get file metadata */
  getMetadata(fileId: string): Promise<FileMetadata | null>;

  /** Delete a file */
  delete(fileId: string, organizationId: string): Promise<void>;

  /** List files for an organization/program */
  list(organizationId: string, programId?: string): Promise<FileMetadata[]>;
}
