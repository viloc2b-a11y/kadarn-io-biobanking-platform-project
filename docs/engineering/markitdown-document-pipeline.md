# MarkItDown document pipeline

Kadarn's MVP document ingestion path is intentionally narrow:

```text
Onboarding document upload -> Next.js API route -> temporary file -> MarkItDown -> Markdown JSON result
```

## Runtime boundary

- UI: `apps/web/src/app/(onboarding)/onboarding/documents/page.tsx`
- API route: `apps/web/src/app/api/onboarding/documents/convert/route.ts`
- TypeScript adapter: `apps/web/src/lib/documents/markitdown-adapter.ts`
- Python converter: `scripts/markitdown_convert.py`

The API route does not persist documents to the database yet. It returns the Markdown result and the onboarding client stores it in local onboarding state for later Passport / Evidence integration.

## Python dependency

Install the Python dependency in the runtime environment:

```bash
pip install -r requirements.txt
```

If Python is not available as `python`/`python3`, set:

```bash
MARKITDOWN_PYTHON_PATH=/absolute/path/to/python
```

## Result shape

```ts
{
  filename: string
  mimeType: string | null
  markdown: string
  characterCount: number
  convertedAt: string
  converter: "markitdown"
}
```

This is not a claim extraction pipeline. The Markdown output is the first normalized representation for downstream Evidence / Passport work.
