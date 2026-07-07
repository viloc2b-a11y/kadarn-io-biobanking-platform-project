import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export async function GET() {
  const specPath = join(process.cwd(), 'openapi-v1.yaml')
  const yaml = readFileSync(specPath, 'utf8')
  const html = `<!DOCTYPE html>
<html>
<head><title>Kadarn API Docs</title></head>
<body>
  <h1>Kadarn API v1</h1>
  <p>OpenAPI spec: <a href="/api/docs/openapi.yaml">openapi-v1.yaml</a></p>
  <pre style="white-space:pre-wrap;font-size:12px">${yaml.replace(/</g, '&lt;')}</pre>
</body>
</html>`
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
