// ==========================================================================
// KEMS-SITE-PROFILE — Site Scrape & Import
// POST /api/v1/site-profiles/scrape
//
// Accepts a URL, fetches the site, extracts structured institutional
// data via LLM, and returns field-level suggestions with confidence scores.
// The user reviews and approves fields before they pre-populate the wizard.
// ==========================================================================

import { withAuth, handleApiError, ApiError } from '@/lib/supabase-server'
import { z } from 'zod'

// ─── Schema ────────────────────────────────────────────────────────────────

const ScrapeRequestSchema = z.object({
  url: z.string().url('Invalid URL').min(1),
})

export interface ScrapedField {
  value: string | string[] | null
  confidence: number        // 0–1
  source: string            // where in the page this was found
  rationale: string         // human-readable why
}

export interface ScrapeResult {
  url: string
  title: string
  fields: {
    name: ScrapedField
    description: ScrapedField
    institution_type: ScrapedField
    founded_year: ScrapedField
    mission_statement: ScrapedField
    website: ScrapedField
    dba_name: ScrapedField
    research_focus: ScrapedField
    therapeutic_areas: ScrapedField
    research_modalities: ScrapedField
    locations: ScrapedField
    people: ScrapedField
    contact_email: ScrapedField
    contact_phone: ScrapedField
  }
  raw_text_sample: string   // first 2000 chars for debug
  error?: string
}

// ─── GET — health / docs ──────────────────────────────────────────────────

export const GET = withAuth(async () => {
  return Response.json({
    endpoint: '/api/v1/site-profiles/scrape',
    method: 'POST',
    body: { url: 'string (valid URL)' },
    returns: 'ScrapeResult with field-level confidence scores',
    description:
      'Scrapes a clinical research site website and extracts structured' +
      ' institutional data using LLM extraction. Each field includes a' +
      ' confidence score, source, and rationale for user approval.',
  })
})

// ─── POST — scrape + extract ──────────────────────────────────────────────

export const POST = withAuth(async (request) => {
  try {
    const body = await request.json() as Record<string, unknown>
    const parsed = ScrapeRequestSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { data: null, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { url } = parsed.data
    const result = await scrapeAndExtract(url)
    return Response.json({ data: result, error: null })
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ data: null, error: error.message }, { status: error.statusCode ?? 500 })
    }
    return handleApiError(error)
  }
})

// ─── Core Logic ─────────────────────────────────────────────────────────────

const MAX_FETCH_BYTES = 2 * 1024 * 1024 // 2 MB
const MAX_TEXT_CHARS = 12000            // truncate for LLM

async function scrapeAndExtract(url: string): Promise<ScrapeResult> {
  // 1. Fetch the page
  let html: string
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'KADARN-SiteProfiler/1.0 (clinical-research-site-discovery; +https://kadarn.io)',
        'Accept': 'text/html, application/xhtml+xml',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new ApiError(502, `Failed to fetch URL: HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new ApiError(422, `URL does not appear to be an HTML page (got ${contentType})`)
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > MAX_FETCH_BYTES) {
      throw new ApiError(422, `Page too large (${(buffer.byteLength / 1024).toFixed(0)} KB), max ${MAX_FETCH_BYTES / 1024} KB`)
    }

    html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  } catch (err) {
    if (err instanceof ApiError) throw err
    const message = err instanceof Error ? err.message : 'Unknown fetch error'
    throw new ApiError(502, `Failed to fetch URL: ${message}`)
  }

  // 2. Extract clean text
  const text = extractText(html)
  const truncated = text.slice(0, MAX_TEXT_CHARS)

  // 3. Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch?.[1]?.trim() ?? new URL(url).hostname

  // 4. LLM extraction
  const fields = await extractFieldsWithLLM(url, title, truncated)

  return {
    url,
    title,
    fields,
    raw_text_sample: truncated.slice(0, 2000),
  }
}

// ─── Text Extraction ────────────────────────────────────────────────────────

function extractText(html: string): string {
  // Remove scripts, styles, noscript, svg, head
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, ' ')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

// ─── LLM Extraction ─────────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a clinical research site profiler. Extract structured institutional data from the website text below.

Return ONLY valid JSON — no markdown, no explanation, no code fences.

Rules:
- If a field is not found, set value to null and confidence to 0.
- confidence is 0.0–1.0: how sure you are the extracted value is correct.
- source is a short quote or element description from the page.
- rationale is a one-line explanation of why you chose this value.
- For array fields (research_focus, therapeutic_areas, research_modalities, locations, people),
  use the EXACT values from these allowed lists where possible.
- institution_type MUST be one of the allowed values.

Allowed institution_type values:
  "Independent Research Site", "Hospital", "Academic Medical Center", "Biobank",
  "Laboratory", "SMO", "Research Network", "Reference / Central Laboratory",
  "Contract Research Organization (CRO)", "Physician Practice / Clinic",
  "University", "Non-Profit Research Organization", "Other"

Allowed research_focus values:
  "Phase I", "Phase II", "Phase III", "Phase IV", "Medical Device",
  "Diagnostics", "Digital Health", "Real-World Evidence", "Observational Studies",
  "Registry Studies", "Investigator-Initiated", "Decentralized / Hybrid Trials",
  "Biospecimen Collection", "Imaging", "Genomics"

Allowed therapeutic_areas values:
  "Oncology", "Cardiology", "Neurology", "Immunology", "Infectious Disease",
  "Rare Disease", "Endocrinology", "Respiratory", "Gastroenterology",
  "Hematology", "Dermatology", "Psychiatry", "Ophthalmology", "Rheumatology",
  "Nephrology", "Pediatrics", "Women's Health", "Pain Management", "Vaccines",
  "Cell & Gene Therapy"

Allowed research_modalities values:
  "Drug Trials", "Device Studies", "Biologic Studies", "Biosimilar Studies",
  "Diagnostic Studies", "Digital Therapeutic Studies",
  "Nutritional / Supplement Studies", "Surgical Studies",
  "Behavioral Intervention", "Epidemiological Studies"

Return this exact JSON shape:
{
  "name": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "description": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "institution_type": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "founded_year": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "mission_statement": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "website": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "dba_name": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "research_focus": { "value": ["string"] or null, "confidence": 0.0, "source": "string", "rationale": "string" },
  "therapeutic_areas": { "value": ["string"] or null, "confidence": 0.0, "source": "string", "rationale": "string" },
  "research_modalities": { "value": ["string"] or null, "confidence": 0.0, "source": "string", "rationale": "string" },
  "locations": { "value": ["string"] or null, "confidence": 0.0, "source": "string", "rationale": "string" },
  "people": { "value": ["string"] or null, "confidence": 0.0, "source": "string", "rationale": "string" },
  "contact_email": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" },
  "contact_phone": { "value": "string or null", "confidence": 0.0, "source": "string", "rationale": "string" }
}`

async function extractFieldsWithLLM(
  url: string,
  title: string,
  text: string,
): Promise<ScrapeResult['fields']> {
  const llmUrl = process.env.SCRAPER_LLM_URL
  const llmKey = process.env.SCRAPER_LLM_KEY
  const llmModel = process.env.SCRAPER_LLM_MODEL ?? 'gpt-4o-mini'

  if (!llmUrl || !llmKey) {
    // Fallback: basic regex-based extraction without LLM
    return fallbackExtraction(url, title, text)
  }

  const prompt = `${EXTRACTION_PROMPT}

WEBSITE URL: ${url}
PAGE TITLE: ${title}

WEBSITE TEXT:
${text}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(llmUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${llmKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [
          { role: 'system', content: 'You are a precise JSON extractor. Return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    })
    clearTimeout(timeout)

    if (!response.ok) {
      console.error(`LLM extraction failed: HTTP ${response.status}`)
      return fallbackExtraction(url, title, text)
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return fallbackExtraction(url, title, text)
    }

    const parsed = JSON.parse(content) as ScrapeResult['fields']
    return parsed
  } catch (err) {
    console.error('LLM extraction error:', err instanceof Error ? err.message : 'Unknown')
    return fallbackExtraction(url, title, text)
  }
}

// ─── Fallback Extraction (no LLM) ───────────────────────────────────────────

function fallbackExtraction(url: string, title: string, text: string): ScrapeResult['fields'] {
  const empty = (): ScrapedField => ({
    value: null, confidence: 0, source: '', rationale: 'LLM not configured — no extraction attempted',
  })

  // Basic regex patterns
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  const yearMatch = text.match(/(?:founded|established|since)\s+(\d{4})/i) ??
    text.match(/\b(19\d{2}|20[0-2]\d)\b/)

  return {
    name: { value: title.replace(/\s*[-|]\s*.+$/, '').trim(), confidence: 0.4, source: '<title>', rationale: 'Extracted from page title' },
    description: empty(),
    institution_type: empty(),
    founded_year: yearMatch ? { value: yearMatch[1], confidence: 0.3, source: 'text pattern', rationale: 'Matched year pattern in page text' } : empty(),
    mission_statement: empty(),
    website: { value: url, confidence: 1.0, source: 'user input', rationale: 'URL provided by user' },
    dba_name: empty(),
    research_focus: empty(),
    therapeutic_areas: empty(),
    research_modalities: empty(),
    locations: empty(),
    people: empty(),
    contact_email: emailMatch ? { value: [emailMatch[0]], confidence: 0.5, source: 'text pattern', rationale: 'Email address found in page text' } : empty(),
    contact_phone: phoneMatch ? { value: [phoneMatch[0]], confidence: 0.5, source: 'text pattern', rationale: 'Phone number found in page text' } : empty(),
  }
}
