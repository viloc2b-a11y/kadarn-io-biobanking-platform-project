'use client'

import { useState, useRef, useCallback } from 'react'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ConvertResult {
  markdown?: string
  characterCount?: number
  convertedAt?: string
  converter?: string
  error?: string
  code?: string
}

export interface IntakeDocument {
  id: string
  fileName: string
  fileSize: number
  label: string
  status: 'pending' | 'uploading' | 'converting' | 'converted' | 'error'
  progress: number
  result?: ConvertResult
  error?: string
}

interface DocumentIntakeProps {
  onDocumentProcessed?: (doc: IntakeDocument) => void
  onDocumentError?: (doc: IntakeDocument) => void
  acceptedTypes?: string
  maxFileSizeMB?: number
  apiEndpoint?: string
}

// ── Component ───────────────────────────────────────────────────────────────

const DEFAULT_ACCEPTED = '.pdf,.doc,.docx,.xlsx,.pptx,.html,.htm,.csv,.txt,.md'
const DEFAULT_MAX_MB = 50

export function DocumentIntake({
  onDocumentProcessed,
  onDocumentError,
  acceptedTypes = DEFAULT_ACCEPTED,
  maxFileSizeMB = DEFAULT_MAX_MB,
  apiEndpoint = '/api/onboarding/documents/convert',
}: DocumentIntakeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [documents, setDocuments] = useState<IntakeDocument[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      // Size check
      const maxBytes = maxFileSizeMB * 1024 * 1024
      if (file.size > maxBytes) {
        const errorDoc: IntakeDocument = {
          id: crypto.randomUUID(),
          fileName: file.name,
          fileSize: file.size,
          label: file.name.replace(/\.[^/.]+$/, ''),
          status: 'error',
          progress: 0,
          error: `File exceeds ${maxFileSizeMB}MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        }
        setDocuments((prev) => [errorDoc, ...prev])
        onDocumentError?.(errorDoc)
        return
      }

      const id = crypto.randomUUID()
      const doc: IntakeDocument = {
        id,
        fileName: file.name,
        fileSize: file.size,
        label: file.name.replace(/\.[^/.]+$/, ''),
        status: 'uploading',
        progress: 0,
      }

      setDocuments((prev) => [doc, ...prev])
      setGlobalError(null)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id && d.status === 'uploading'
              ? { ...d, progress: Math.min(d.progress + 15, 90) }
              : d,
          ),
        )
      }, 150)

      try {
        const form = new FormData()
        form.append('file', file)

        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: 'converting', progress: 95 } : d)),
        )

        clearInterval(progressInterval)

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          body: form,
        })

        const payload: ConvertResult = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error ?? payload?.code ?? 'Document conversion failed.')
        }

        const result: ConvertResult = {
          markdown: payload.markdown,
          characterCount: payload.characterCount,
          convertedAt: payload.convertedAt ?? new Date().toISOString(),
          converter: payload.converter ?? 'markitdown',
        }

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, status: 'converted', progress: 100, result }
              : d,
          ),
        )

        onDocumentProcessed?.({ ...doc, status: 'converted', progress: 100, result })
      } catch (err) {
        clearInterval(progressInterval)

        const message = err instanceof Error ? err.message : 'Conversion failed.'
        const errorDoc = { ...doc, status: 'error' as const, progress: 0, error: message }

        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? errorDoc : d)),
        )

        onDocumentError?.(errorDoc)
      }
    },
    [apiEndpoint, maxFileSizeMB, onDocumentProcessed, onDocumentError],
  )

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      void Promise.all(fileArray.map(processFile))
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files) handleFiles(files)
      // Reset input so same file can be re-selected
      e.target.value = ''
    },
    [handleFiles],
  )

  const handleRemove = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const converted = documents.filter((d) => d.status === 'converted').length
  const processing = documents.filter((d) => d.status === 'uploading' || d.status === 'converting').length
  const errors = documents.filter((d) => d.status === 'error').length

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Document Intake</h2>
        <p className="text-sm text-gray-500">
          Upload documents to convert them into searchable evidence. Supported formats: PDF, DOCX, XLSX, PPTX, HTML, CSV, TXT, MD.
          Max {maxFileSizeMB}MB per file.
        </p>
      </div>

      {/* Status bar */}
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {documents.length} total
          </span>
          {converted > 0 && (
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
              {converted} converted
            </span>
          )}
          {processing > 0 && (
            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
              {processing} processing
            </span>
          )}
          {errors > 0 && (
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
              {errors} errors
            </span>
          )}
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {/* Drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept={acceptedTypes}
      />

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer mb-6 ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
        }}
      >
        <div className="text-4xl mb-3">{dragOver ? '📥' : '📄'}</div>
        <div className="text-lg font-medium text-gray-700 mb-1">
          {dragOver ? 'Drop files here' : 'Drag & drop documents here'}
        </div>
        <div className="text-sm text-gray-400">
          or click to browse. Files are converted to searchable markdown evidence.
        </div>
      </div>

      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-2 mb-8">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} document={doc} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Document Row ────────────────────────────────────────────────────────────

function DocumentRow({
  document,
  onRemove,
}: {
  document: IntakeDocument
  onRemove: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { id, fileName, fileSize, status, progress, result, error } = document

  const statusConfig: Record<
    string,
    { icon: string; color: string; label: string }
  > = {
    pending: { icon: '○', color: 'text-gray-400', label: 'Pending' },
    uploading: { icon: '↑', color: 'text-blue-500', label: 'Uploading' },
    converting: { icon: '⚙', color: 'text-amber-500 animate-spin inline-block', label: 'Converting' },
    converted: { icon: '✓', color: 'text-green-500', label: 'Converted' },
    error: { icon: '✕', color: 'text-red-500', label: 'Error' },
  }

  const config = statusConfig[status] ?? statusConfig.pending

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Row header */}
      <div className="flex items-center gap-3 p-3">
        {/* Status icon */}
        <span className={`flex-shrink-0 w-5 text-center ${config.color}`}>
          {config.icon}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{fileName}</div>
          <div className="text-xs text-gray-400">
            {(fileSize / 1024).toFixed(0)} KB
            {result?.characterCount != null && ` · ${result.characterCount.toLocaleString()} chars`}
          </div>
        </div>

        {/* Status label */}
        <span className={`text-xs font-medium flex-shrink-0 ${config.color}`}>
          {config.label}
        </span>

        {/* Progress bar (uploading / converting) */}
        {(status === 'uploading' || status === 'converting') && (
          <div className="w-24 flex-shrink-0">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-right text-[10px] text-gray-400 mt-0.5">{progress}%</div>
          </div>
        )}

        {/* Expand button (for converted / error) */}
        {(status === 'converted' || status === 'error') && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 px-2 py-1 rounded hover:bg-gray-100"
          >
            {expanded ? 'Hide' : 'Preview'}
          </button>
        )}

        {/* Remove */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(id)
          }}
          className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 px-1"
          aria-label={`Remove ${fileName}`}
        >
          ×
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-3">
          {status === 'converted' && result?.markdown ? (
            <div>
              <div className="text-xs text-gray-500 mb-2">
                {result.converter && <span>Converter: {result.converter} · </span>}
                {result.characterCount != null && (
                  <span>{result.characterCount.toLocaleString()} characters</span>
                )}
                {result.convertedAt && (
                  <span> · {new Date(result.convertedAt).toLocaleTimeString()}</span>
                )}
              </div>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-white border border-gray-200 p-3 text-xs text-gray-700">
                {result.markdown.slice(0, 5000)}
                {result.markdown.length > 5000 && '\n\n... (truncated)'}
              </pre>
            </div>
          ) : status === 'error' && error ? (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-700">
              <strong>Conversion failed:</strong> {error}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentIntake() {
  const [documents, setDocuments] = useState<IntakeDocument[]>([])

  const addDocument = useCallback((doc: IntakeDocument) => {
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = doc
        return updated
      }
      return [doc, ...prev]
    })
  }, [])

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { documents, addDocument, removeDocument }
}
