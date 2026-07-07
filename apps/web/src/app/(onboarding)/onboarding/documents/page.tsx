'use client'

import { useRef, useState } from 'react'
import { DomainHeader } from '../../components/domain-header'
import { useOnboarding, type UploadedDoc } from '@/lib/onboarding/onboarding-context'
import { DOCUMENT_IMPORTANCE, DOCUMENT_TAXONOMY, type CanonicalDocument, type DocumentImportance } from '@/lib/onboarding/document-taxonomy'

export default function DocumentsPage() {
  const { state, addDocument, removeDocument } = useOnboarding()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    const uploadedAt = new Date().toISOString()
    const doc: UploadedDoc = {
      label: file.name.replace(/\.[^/.]+$/, ''),
      type: 'uploaded',
      uploaded: true,
      fileName: file.name,
      fileSize: file.size,
      status: 'uploaded',
      uploadedAt,
    }
    addDocument(doc)

    const form = new FormData()
    form.append('file', file)

    try {
      const response = await fetch('/api/onboarding/documents/convert', {
        method: 'POST',
        body: form,
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Document conversion failed.')
      }

      addDocument({
        ...doc,
        status: 'converted',
        markdown: payload.markdown,
        characterCount: payload.characterCount,
        convertedAt: payload.convertedAt,
        converter: payload.converter,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Document conversion failed.'
      const markdown = await readPlainTextPreview(file)
      setError(message)
      addDocument({
        ...doc,
        status: 'error',
        error: message,
        ...(markdown ? { markdown, characterCount: markdown.length } : {}),
      })
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    void Promise.all(files.map(handleFile))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    void Promise.all(files.map(handleFile))
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DomainHeader domain="documents" questionCount={5} questionsAnswered={state.uploadedDocs.length} />

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-green-900 mb-2">The Evidence Layer</h2>
        <p className="text-green-800">
          Documents are proof. Each document you upload validates your claims and strengthens your capabilities.
          Kadarn links documents to the right people, labs, equipment, and capabilities automatically.
        </p>
      </div>

      {/* Upload area */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xlsx,.pptx,.html,.htm,.csv,.txt,.md"
      />

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer mb-6 ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        <div className="text-4xl mb-3">📄</div>
        <div className="text-lg font-medium text-gray-700 mb-1">
          {dragOver ? 'Drop evidence here' : 'Drag & drop evidence here'}
        </div>
        <div className="text-sm text-gray-400">or click to browse. PDF, DOCX, XLSX, PPTX, HTML, CSV, TXT, and MD accepted. Each upload becomes evidence in your Institution Passport.</div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Uploaded files */}
      {state.uploadedDocs.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Your Evidence ({state.uploadedDocs.length})</h3>
          <div className="space-y-2">
            {state.uploadedDocs.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={doc.status === 'failed' || doc.status === 'error' ? 'text-red-500' : doc.status === 'converted' || doc.status === 'uploaded' ? 'text-green-500' : 'text-amber-500'}>
                    {doc.status === 'failed' || doc.status === 'error' ? '!' : doc.status === 'converted' || doc.status === 'uploaded' ? '✓' : '…'}
                  </span>
                  <div>
                    <div className="font-medium text-sm text-gray-800">{doc.label}</div>
                    {doc.fileName && <div className="text-xs text-gray-400">{doc.fileName} · {(doc.fileSize ?? 0) > 0 ? `${Math.round((doc.fileSize ?? 0) / 1024)} KB` : ''}</div>}
                    <div className="mt-1 text-xs text-gray-500">
                      {doc.status === 'converted'
                        ? `Converted with MarkItDown · ${doc.characterCount ?? 0} characters`
                        : doc.status === 'failed' || doc.status === 'error'
                          ? `Uploaded; conversion unavailable: ${doc.error}`
                          : doc.status === 'uploaded'
                            ? 'Uploaded and attached to onboarding state'
                          : 'Converting with MarkItDown…'}
                    </div>
                    {doc.markdown && (
                      <pre className="mt-2 max-h-32 max-w-xl overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-700">
                        {doc.markdown.slice(0, 1000)}
                      </pre>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(doc.label)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canonical document taxonomy */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-2">Canonical Institutional Evidence Taxonomy</h3>
        <p className="text-sm text-gray-500 mb-4">
          Upload documents by domain. Kadarn links evidence to institutions, locations, people, labs, equipment, capabilities, readiness, and the Passport.
        </p>
        <div className="space-y-3">
          {DOCUMENT_TAXONOMY.map((domain) => (
            <details key={domain.id} className="rounded-xl border border-gray-200 bg-white" open={domain.id === 'corporate-legal'}>
              <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-900">
                {domain.label}
              </summary>
              <div className="space-y-4 border-t border-gray-100 p-4">
                {([DOCUMENT_IMPORTANCE.CRITICAL, DOCUMENT_IMPORTANCE.RECOMMENDED, DOCUMENT_IMPORTANCE.OPTIONAL] as DocumentImportance[])
                  .map((importance) => {
                    const docs = domain.documents.filter((document) => document.importance === importance)
                    if (docs.length === 0) return null

                    return (
                      <div key={importance}>
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{importance}</div>
                        <div className="space-y-2">
                          {docs.map((document) => (
                            <DocumentTaxonomyRow
                              key={`${domain.id}-${document.title}`}
                              document={document}
                              uploadedDocs={state.uploadedDocs}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-200">
        <a href="/onboarding/infrastructure" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Infrastructure
        </a>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.alert('Your onboarding progress is saved locally on this device.')}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
          >
            Save & Continue Later
          </button>
          <a href="/onboarding/memory" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium">
            Build Institutional Memory →
          </a>
        </div>
      </div>
    </div>
  )
}

function DocumentTaxonomyRow({
  document,
  uploadedDocs,
}: {
  document: CanonicalDocument
  uploadedDocs: UploadedDoc[]
}) {
  const uploaded = findUploadedDocument(document, uploadedDocs)
  const status = uploaded ? uploadStatusLabel(uploaded) : 'Not uploaded'

  return (
    <div className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-gray-800 text-sm">{document.title}</div>
          <div className="mt-1 grid gap-1 text-xs text-gray-500">
            <span>Status: {status}</span>
            <span>Expiration: {uploaded?.expiresAt ?? document.expiration}</span>
            <span>Version: {document.version}</span>
            <span>Linked Entity: {document.linkedEntity}</span>
            <span>Linked Capability: {document.linkedCapability}</span>
            <span>Readiness Impact: {document.readinessImpact}</span>
            <span>Passport Impact: {document.passportImpact}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${importanceClassName(document.importance)}`}>
          {document.importance}
        </span>
      </div>
    </div>
  )
}

function findUploadedDocument(document: CanonicalDocument, uploadedDocs: UploadedDoc[]): UploadedDoc | undefined {
  const normalizedTitle = normalizeDocumentName(document.title)
  return uploadedDocs.find((uploaded) => {
    const normalizedUpload = normalizeDocumentName(uploaded.label)
    return normalizedUpload.includes(normalizedTitle) || normalizedTitle.includes(normalizedUpload)
  })
}

function normalizeDocumentName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function uploadStatusLabel(document: UploadedDoc): string {
  if (document.status === 'converted') return 'Uploaded and converted'
  if (document.status === 'error' || document.status === 'failed') return 'Uploaded; conversion unavailable'
  if (document.status === 'uploaded') return 'Uploaded'
  return 'Uploaded'
}

function importanceClassName(importance: DocumentImportance): string {
  if (importance === DOCUMENT_IMPORTANCE.CRITICAL) return 'bg-red-100 text-red-700'
  if (importance === DOCUMENT_IMPORTANCE.RECOMMENDED) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-700'
}

async function readPlainTextPreview(file: File): Promise<string | null> {
  const lowerName = file.name.toLowerCase()
  const canReadText = file.type.startsWith('text/') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')
  if (!canReadText) return null

  try {
    return await file.text()
  } catch {
    return null
  }
}
