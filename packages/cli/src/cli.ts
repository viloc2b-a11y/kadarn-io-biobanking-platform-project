#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { KadarnClient } from '@kadarn/sdk'

const [cmd, ...args] = process.argv.slice(2)
const ROOT = process.cwd()

async function main() {
  switch (cmd) {
    case 'dev':
      return runDev(args[0] ?? 'up')
    case 'doctor':
      return doctor()
    case 'seed':
      return runNpm('run', 'seed:users', '-w', 'tests')
    default:
      console.log(`Kadarn CLI v0.1.0

Usage:
  kadarn dev up       Start API + Web + Supabase (via docker compose)
  kadarn doctor       Check local environment
  kadarn seed         Seed test users
`)
  }
}

function runNpm(...npmArgs: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('npm', npmArgs, { cwd: ROOT, stdio: 'inherit', shell: true })
    child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
  })
}

async function runDev(sub: string) {
  if (sub === 'up') {
    console.log('Starting Kadarn stack...')
    await runNpm('run', 'dev:api')
  } else {
    console.error('Unknown: kadarn dev', sub)
  }
}

async function doctor() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  const client = new KadarnClient({ baseUrl: api })
  try {
    const h = await client.health()
    console.log('API health:', h)
    console.log('PASS: doctor')
  } catch (e) {
    console.error('FAIL: API unreachable at', api, e)
    process.exit(1)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
