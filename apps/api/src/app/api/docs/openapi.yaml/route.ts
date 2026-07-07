import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export async function GET() {
  const yaml = readFileSync(join(process.cwd(), 'openapi-v1.yaml'), 'utf8')
  return new Response(yaml, { headers: { 'content-type': 'text/yaml; charset=utf-8' } })
}
