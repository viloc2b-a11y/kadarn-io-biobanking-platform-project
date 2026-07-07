import { NextResponse } from 'next/server'
import { convertToMarkdown } from '../../../../../lib/documents/markitdown-adapter'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'NO_FILE' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await convertToMarkdown({
      buffer,
      filename: file.name,
      mimeType: file.type,
    })

    // Return flat format matching frontend expectations
    return NextResponse.json(result)
  } catch (err: unknown) {
    const error = err as { filename?: string; error?: string; code?: string; message?: string }
    console.error('[markitdown] Conversion error:', error)

    return NextResponse.json(
      { error: error?.error ?? error?.message ?? 'Conversion failed', code: error?.code ?? 'UNKNOWN' },
      { status: error?.code === 'UNSUPPORTED_FORMAT' ? 415 : error?.code === 'EMPTY_OUTPUT' ? 400 : 500 }
    )
  }
}
