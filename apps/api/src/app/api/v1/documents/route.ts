// ==========================================================================
// KADARN v2 — Document Upload + RAG API (KEMS-001 §2-§4)
// ==========================================================================
// POST /api/v1/documents/upload — Upload document, extract text, chunk, embed
// GET  /api/v1/documents/search?q=&institution_id= — Vector similarity search
// ==========================================================================
// Schema: supabase/migrations/094_claims_evidence_rag.sql
// Types:  @kadarn/types claim.ts (EvidenceSource, DocumentChunk, etc.)
// ==========================================================================

import { createHash } from 'crypto'
import { execFile } from 'child_process'
import { writeFile, unlink, mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

import { withAuth, handleApiError, createServiceClient, ApiError } from '@/lib/supabase-server'

const execFileAsync = promisify(execFile)
const MARKITDOWN_SCRIPT = join(process.cwd(), 'scripts', 'markitdown_convert.py')

// ─── Constants ────────────────────────────────────────────────────────────

const CHUNK_SIZE = 1000       // characters per chunk
const CHUNK_OVERLAP = 200     // overlap between consecutive chunks
const EMBEDDING_MODEL = 'text-embedding-ada-002'
const EMBEDDING_DIMS = 1536
const MAX_SEARCH_RESULTS = 5
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Allowed MIME types for upload */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword',                                                       // .doc
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/vnd.ms-excel',                                                 // .xls
  'text/markdown',
])

function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Split text into overlapping chunks */
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = []
  if (!text || text.length === 0) return chunks

  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start += chunkSize - overlap
  }
  return chunks
}

/** Estimate token count (rough: ~4 chars per token for English) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Call OpenAI Embeddings API directly via fetch.
 * Requires OPENAI_API_KEY in environment.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new ApiError(500, 'OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new ApiError(
      response.status,
      `OpenAI embedding failed (${response.status}): ${body.slice(0, 200)}`,
    )
  }

  const json = await response.json() as {
    data: Array<{ embedding: number[] }>
  }
  return json.data[0].embedding
}

/**
 * Run markitdown_convert.py to extract text from a document.
 * Returns the markdown text content.
 */
async function extractText(
  filePath: string,
  filename: string,
  mimeType: string,
): Promise<{ markdown: string; characterCount: number }> {
  try {
    const { stdout } = await execFileAsync('python', [
      MARKITDOWN_SCRIPT,
      filePath,
      '--filename', filename,
      '--mime-type', mimeType,
    ], {
      timeout: 120_000, // 2-minute timeout for large docs
      maxBuffer: 10 * 1024 * 1024, // 10 MB stdout
    })

    const result = JSON.parse(stdout) as {
      markdown: string
      characterCount: number
      error?: string
    }

    if (result.error) {
      throw new ApiError(500, `Text extraction failed: ${result.error}`)
    }

    return { markdown: result.markdown, characterCount: result.characterCount }
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err
    const message = err instanceof Error ? err.message : String(err)
    // If MarkItDown is not installed, suggest the fix
    if (message.includes('MARKITDOWN_NOT_INSTALLED') || message.includes('No module named')) {
      throw new ApiError(500, 'Text extraction unavailable: MarkItDown Python package not installed')
    }
    throw new ApiError(500, `Text extraction failed: ${message}`)
  }
}

/**
 * Vector similarity search over document_chunks using pgvector.
 *
 * Strategy: For production, use a pgvector stored procedure via supabase.rpc().
 * As a fallback when no stored procedure exists, fetch all chunks for the
 * institution and compute cosine similarity in JS. This is acceptable for
 * small-to-medium datasets (<10k chunks per institution).
 *
 * TODO(kadarn): Create `search_document_chunks` Postgres function and switch
 * to supabase.rpc() for native pgvector index acceleration.
 */
async function vectorSearch(
  supabase: ReturnType<typeof createServiceClient>,
  queryEmbedding: number[],
  institutionId: string,
  limit: number = MAX_SEARCH_RESULTS,
): Promise<Array<{
  chunk_id: string
  source_id: string
  file_name: string
  chunk_text: string
  chunk_index: number
  similarity: number
}>> {
  // ── Primary path: pgvector stored procedure ──────────────────────────
  // Only works if the `search_document_chunks` function exists in the DB.
  try {
    const { data, error } = await supabase.rpc('search_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: limit,
      p_institution_id: institutionId,
    })

    if (!error && data && Array.isArray(data)) {
      return data.map((row: Record<string, unknown>) => ({
        chunk_id: row.chunk_id as string,
        source_id: row.source_id as string,
        file_name: row.file_name as string,
        chunk_text: row.chunk_text as string,
        chunk_index: row.chunk_index as number,
        similarity: row.similarity as number,
      }))
    }
    // Fall through to JS fallback if rpc fails
  } catch {
    // RPC not available — fall through to JS fallback
  }

  // ── Fallback: fetch chunks + compute similarity in JS ────────────────
  const { data: sources, error: srcErr } = await supabase
    .from('evidence_sources')
    .select('id')
    .eq('institution_id', institutionId)
    .eq('processing_status', 'completed')

  if (srcErr || !sources?.length) return []

  const sourceIds = sources.map((s: { id: string }) => s.id)

  const { data: chunks, error: chunkErr } = await supabase
    .from('document_chunks')
    .select('id, source_id, chunk_index, chunk_text, embedding')
    .in('source_id', sourceIds)

  if (chunkErr || !chunks?.length) return []

  // Compute cosine similarity in JS
  interface ChunkRow {
    id: string
    source_id: string
    chunk_index: number
    chunk_text: string
    embedding: number[] | string | null
  }

  function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    let dot = 0, normA = 0, normB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB)
    return denom === 0 ? 0 : dot / denom
  }

  const scored: Array<{
    chunk_id: string
    source_id: string
    chunk_index: number
    chunk_text: string
    similarity: number
  }> = []

  for (const chunk of chunks as ChunkRow[]) {
    if (!chunk.embedding) continue
    let emb: number[]
    if (typeof chunk.embedding === 'string') {
      // pgvector may return embedding as a string representation
      try {
        emb = JSON.parse(chunk.embedding)
      } catch {
        emb = chunk.embedding.slice(1, -1).split(',').map(Number)
      }
    } else {
      emb = chunk.embedding
    }
    const sim = cosineSimilarity(queryEmbedding, emb)
    scored.push({
      chunk_id: chunk.id,
      source_id: chunk.source_id,
      chunk_index: chunk.chunk_index,
      chunk_text: chunk.chunk_text,
      similarity: Math.round(sim * 10_000) / 10_000,
    })
  }

  scored.sort((a, b) => b.similarity - a.similarity)
  const top = scored.slice(0, limit)

  // Resolve file names
  const sourceIdSet = new Set(top.map((s) => s.source_id))
  const { data: sourceRows } = await supabase
    .from('evidence_sources')
    .select('id, file_name')
    .in('id', Array.from(sourceIdSet))

  const fileNames = new Map<string, string>()
  for (const s of (sourceRows ?? []) as Array<{ id: string; file_name: string | null }>) {
    if (s.file_name) fileNames.set(s.id, s.file_name)
  }

  return top.map((r) => ({
    ...r,
    file_name: fileNames.get(r.source_id) ?? 'unknown',
    evidence_page: undefined,
  }))
}

// ─── Route Handlers ───────────────────────────────────────────────────────

/**
 * POST /api/v1/documents/upload
 *
 * Accepts multipart/form-data:
 *   - file: The document to upload
 *   - institution_id: UUID of the institution
 *
 * Pipeline:
 *   1. Validate file (type, size)
 *   2. Save to temp directory
 *   3. Extract text via markitdown_convert.py
 *   4. Store metadata in evidence_sources
 *   5. Chunk text (1000 char, 200 overlap)
 *   6. Generate embeddings via OpenAI
 *   7. Store chunks in document_chunks
 *   8. Update processing_status → completed
 */
export const POST = withAuth(async (request, _user) => {
  let tempDir: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const institutionId = formData.get('institution_id')

    // ── Validation ─────────────────────────────────────────────────────
    if (!file || !(file instanceof File)) {
      return Response.json(
        { data: null, error: 'Missing or invalid file field' },
        { status: 400 },
      )
    }
    if (!institutionId || typeof institutionId !== 'string') {
      return Response.json(
        { data: null, error: 'Missing or invalid institution_id' },
        { status: 400 },
      )
    }
    if (file.size === 0) {
      return Response.json(
        { data: null, error: 'File is empty' },
        { status: 400 },
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { data: null, error: `File too large (max ${humanFileSize(MAX_FILE_SIZE)})` },
        { status: 413 },
      )
    }
    if (!ALLOWED_MIME_TYPES.has(file.type) && file.type !== '') {
      // Allow empty MIME type (some clients don't set it); validate by extension instead
      const ext = file.name.split('.').pop()?.toLowerCase()
      const allowedExts = ['pdf', 'docx', 'doc', 'txt', 'csv', 'xlsx', 'xls', 'md']
      if (!ext || !allowedExts.includes(ext)) {
        return Response.json(
          { data: null, error: `Unsupported file type: ${file.type || ext || 'unknown'}` },
          { status: 415 },
        )
      }
    }

    const supabase = createServiceClient()

    // ── Save temp file ─────────────────────────────────────────────────
    tempDir = await mkdtemp(join(tmpdir(), 'kadarn-upload-'))
    const tempPath = join(tempDir, file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(tempPath, buffer)

    // ── Compute file hash for dedup ────────────────────────────────────
    const fileHash = createHash('sha256').update(buffer).digest('hex')

    // Check for duplicate
    const { data: existing } = await supabase
      .from('evidence_sources')
      .select('id, file_hash')
      .eq('file_hash', fileHash)
      .eq('institution_id', institutionId)
      .maybeSingle()

    if (existing) {
      // Clean up temp
      await unlink(tempPath).catch(() => {})
      await rm(tempDir!, { recursive: true, force: true }).catch(() => {})
      return Response.json(
        { data: null, error: 'Duplicate file: this document has already been uploaded', existing_id: existing.id },
        { status: 409 },
      )
    }

    // ── Create evidence source record (pending) ────────────────────────
    const { data: source, error: insertErr } = await supabase
      .from('evidence_sources')
      .insert({
        institution_id: institutionId,
        source_type: 'document_upload',
        label: file.name,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        file_hash: fileHash,
        processing_status: 'pending',
        page_count: 1,
      })
      .select()
      .single()

    if (insertErr || !source) {
      throw new ApiError(500, `Failed to create source record: ${insertErr?.message ?? 'unknown'}`)
    }

    // ── Update status → extracting ─────────────────────────────────────
    await supabase
      .from('evidence_sources')
      .update({ processing_status: 'extracting' })
      .eq('id', source.id)

    // ── Extract text via MarkItDown ────────────────────────────────────
    let textContent: string
    let characterCount: number

    try {
      const result = await extractText(tempPath, file.name, file.type)
      textContent = result.markdown
      characterCount = result.characterCount
    } catch (extractErr) {
      // Mark extraction as failed
      await supabase
        .from('evidence_sources')
        .update({ processing_status: 'failed', description: `Extraction error: ${extractErr instanceof Error ? extractErr.message : String(extractErr)}` })
        .eq('id', source.id)
      throw extractErr
    }

    // If extraction produced no text, treat as failure
    if (!textContent || textContent.trim().length === 0) {
      await supabase
        .from('evidence_sources')
        .update({ processing_status: 'failed', description: 'No extractable text found in document' })
        .eq('id', source.id)
      return Response.json(
        { data: null, error: 'No extractable text found in document. The file may be scanned/image-based.' },
        { status: 422 },
      )
    }

    // ── Update with extracted text ─────────────────────────────────────
    await supabase
      .from('evidence_sources')
      .update({
        text_content: textContent,
        processing_status: 'chunking',
        page_count: Math.max(1, Math.ceil(characterCount / 3000)), // rough page estimate
      })
      .eq('id', source.id)

    // ── Chunk text ─────────────────────────────────────────────────────
    const chunks = chunkText(textContent)
    if (chunks.length === 0) {
      await supabase
        .from('evidence_sources')
        .update({ processing_status: 'failed', description: 'Text chunking produced no chunks' })
        .eq('id', source.id)
      throw new ApiError(500, 'Text chunking produced no chunks')
    }

    // ── Update status → embedding ──────────────────────────────────────
    await supabase
      .from('evidence_sources')
      .update({ processing_status: 'embedding' })
      .eq('id', source.id)

    // ── Generate embeddings and store chunks ───────────────────────────
    // Process chunks sequentially to respect OpenAI rate limits
    // For large documents (>50 chunks), consider batching with delays
    const MAX_CHUNKS = 200 // safety cap
    const chunksToProcess = chunks.slice(0, MAX_CHUNKS)

    for (let i = 0; i < chunksToProcess.length; i++) {
      const chunkText_content = chunksToProcess[i]
      const embedding = await generateEmbedding(chunkText_content)
      const tokenCount = estimateTokens(chunkText_content)

      const { error: chunkErr } = await supabase
        .from('document_chunks')
        .insert({
          source_id: source.id,
          chunk_index: i,
          chunk_text: chunkText_content,
          embedding: embedding as unknown as string, // pgvector accepts number[]
          token_count: tokenCount,
        })

      if (chunkErr) {
        throw new ApiError(500, `Failed to store chunk ${i}: ${chunkErr.message}`)
      }
    }

    // ── Mark as completed ──────────────────────────────────────────────
    const { data: updated, error: updateErr } = await supabase
      .from('evidence_sources')
      .update({ processing_status: 'completed' })
      .eq('id', source.id)
      .select()
      .single()

    if (updateErr) {
      throw new ApiError(500, `Failed to finalize source: ${updateErr.message}`)
    }

    // ── Clean up temp files ────────────────────────────────────────────
    await unlink(tempPath).catch(() => {})
    await rm(tempDir!, { recursive: true, force: true }).catch(() => {})
    tempDir = null

    // ── Response ───────────────────────────────────────────────────────
    const response: {
      source_id: string
      file_name: string
      file_size: number
      page_count: number
      text_length: number
      processing_status: string
      chunk_count: number
    } = {
      source_id: source.id,
      file_name: file.name,
      file_size: file.size,
      page_count: updated?.page_count ?? 1,
      text_length: characterCount,
      processing_status: 'completed',
      chunk_count: chunksToProcess.length,
    }

    return Response.json({ data: response, error: null }, { status: 201 })
  } catch (error) {
    // Clean up temp dir on error
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
    return handleApiError(error)
  }
})

/**
 * GET /api/v1/documents/search
 *
 * Query params:
 *   - q: Search query string (required)
 *   - institution_id: Institution UUID (required)
 *   - limit: Max results (optional, default 5, max 20)
 *
 * Pipeline:
 *   1. Validate params
 *   2. Generate query embedding via OpenAI
 *   3. Vector similarity search via pgvector (or JS fallback)
 *   4. Return ranked results
 */
export const GET = withAuth(async (request, _user) => {
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const institutionId = url.searchParams.get('institution_id')
    const limitParam = url.searchParams.get('limit')

    // ── Validation ─────────────────────────────────────────────────────
    if (!query || query.trim().length === 0) {
      return Response.json(
        { data: null, error: 'Missing or empty query parameter "q"' },
        { status: 400 },
      )
    }
    if (!institutionId) {
      return Response.json(
        { data: null, error: 'Missing required parameter "institution_id"' },
        { status: 400 },
      )
    }

    const limit = limitParam
      ? Math.min(Math.max(1, parseInt(limitParam, 10) || MAX_SEARCH_RESULTS), 20)
      : MAX_SEARCH_RESULTS

    if (isNaN(limit) || limit < 1) {
      return Response.json(
        { data: null, error: 'Invalid limit parameter (must be 1–20)' },
        { status: 400 },
      )
    }

    const trimmedQuery = query.trim()

    // ── Generate query embedding ───────────────────────────────────────
    const queryEmbedding = await generateEmbedding(trimmedQuery)

    if (!queryEmbedding || queryEmbedding.length !== EMBEDDING_DIMS) {
      throw new ApiError(500, `Embedding generation returned unexpected dimensions: ${queryEmbedding?.length ?? 0}`)
    }

    // ── Vector similarity search ───────────────────────────────────────
    const supabase = createServiceClient()
    const results = await vectorSearch(supabase, queryEmbedding, institutionId, limit)

    // ── Response ───────────────────────────────────────────────────────
    return Response.json({
      data: {
        query: trimmedQuery,
        results,
        count: results.length,
      },
      error: null,
    })
  } catch (error) {
    return handleApiError(error)
  }
})
