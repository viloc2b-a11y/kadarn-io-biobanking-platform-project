#!/usr/bin/env node
/**
 * Kadarn secret scanner — cross-platform (CI, Windows, macOS, Linux).
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const NC = '\x1b[0m'

let exitCode = 0

const EXCLUDE_PATHS = [
  '.env.example',
  'apps/web/.env.example',
  'apps/api/.env.example',
  'docs/ops/SUPABASE-SECRETS-SETUP.md',
  'docs/ops/SUPABASE-INFRASTRUCTURE-VALIDATION.md',
  'docs/pilots/FIRST-BIOBANK-PILOT-RUNBOOK.md',
  'docs/pilots/ALPHA-SEED-DATA.md',
  'scripts/seed-pilot-users.ts',
  'tests/test-config.example.txt',
  'scripts/check-secrets.sh',
  'scripts/check-secrets.mjs',
  'apps/web/next.config.ts',
  '.github/workflows/ci.yml',
]

const JWT_EXCLUDE_PATHS = [
  ...EXCLUDE_PATHS,
  'tests/setup/seed-users.ts',
  'tests/api/core.test.ts',
  'tests/security/threat.test.ts',
  'scripts/create-test-users.sh',
]

function gitLsFiles() {
  try {
    return execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

function isExcluded(file, excludes) {
  return excludes.some(pattern => {
    if (pattern.includes('*')) {
      const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      return re.test(file)
    }
    return file === pattern || file.endsWith('/' + pattern)
  })
}

function scanFiles(patterns, excludes) {
  const hits = []
  for (const file of gitLsFiles()) {
    if (isExcluded(file, excludes)) continue
    let content
    try {
      content = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    content.split('\n').forEach((line, i) => {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          hits.push({ file, line: i + 1, text: line })
        }
      }
    })
  }
  return hits
}

console.log('=== Kadarn Secret Scanner ===\n')

const trackedEnv = gitLsFiles().filter(f => /\.env(\.(local|prod|staging|dev))?$/.test(f))
if (trackedEnv.length) {
  console.log(`${RED}FAIL: .env files tracked by git${NC}`)
  trackedEnv.forEach(f => console.log(f))
  exitCode = 1
} else {
  console.log(`${GREEN}OK: No .env files tracked by git${NC}`)
}

for (const label of ['SUPABASE_SERVICE_ROLE_KEY=', 'DATABASE_URL=postgres', 'JWT_SECRET=', 'postgresql://']) {
  const hits = scanFiles([new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))], EXCLUDE_PATHS)
  if (hits.length) {
    console.log(`${RED}FAIL: Found '${label}' in tracked files${NC}`)
    hits.forEach(h => console.log(`${h.file}:${h.line}`))
    exitCode = 1
  }
}

const anonHits = scanFiles([/SUPABASE_ANON_KEY=/], EXCLUDE_PATHS)
for (const h of anonHits) {
  if (!/replace-with|your-|REDACTED/i.test(h.text)) {
    console.log(`${RED}FAIL: Found real-looking SUPABASE_ANON_KEY${NC}`)
    console.log(`${h.file}:${h.line}`)
    exitCode = 1
  }
}

const jwtHits = scanFiles([/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/], JWT_EXCLUDE_PATHS)
if (jwtHits.length) {
  console.log(`${YELLOW}WARN: Found Supabase JWT tokens in unexpected files${NC}`)
  jwtHits.forEach(h => console.log(`${h.file}:${h.line}`))
}

console.log('')
if (exitCode === 0) {
  console.log(`${GREEN}All checks passed. No secrets leaked.${NC}`)
} else {
  console.log(`${RED}Some checks failed. Review issues above.${NC}`)
}
process.exit(exitCode)
