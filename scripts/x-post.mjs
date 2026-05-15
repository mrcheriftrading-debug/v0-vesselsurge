#!/usr/bin/env node

import { readLocalEnv, getEnv } from './lib/read-env.mjs'
import { buildOAuth1Header } from './lib/x-oauth1.mjs'

async function readStdin() {
  if (process.stdin.isTTY) return ''
  let data = ''
  for await (const chunk of process.stdin) data += chunk
  return data
}

const localEnv = readLocalEnv()
const credentials = {
  consumerKey: getEnv('X_API_KEY', localEnv),
  consumerSecret: getEnv('X_API_SECRET', localEnv),
  token: getEnv('X_ACCESS_TOKEN', localEnv),
  tokenSecret: getEnv('X_ACCESS_TOKEN_SECRET', localEnv),
}

for (const [key, value] of Object.entries(credentials)) {
  if (!value) {
    console.error(`[x-post] Missing ${key}. Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET to .env.local.`)
    process.exit(1)
  }
}

const text = (process.argv.slice(2).join(' ') || await readStdin()).trim()

if (!text) {
  console.error('[x-post] Missing post text. Usage: npm run x:post -- "Your post text"')
  process.exit(1)
}

if (text.length > 280) {
  console.error(`[x-post] Post is ${text.length} characters. Keep it at 280 or below.`)
  process.exit(1)
}

const url = 'https://api.x.com/2/tweets'
const response = await fetch(url, {
  method: 'POST',
  headers: {
    authorization: buildOAuth1Header({ method: 'POST', url, ...credentials }),
    'content-type': 'application/json',
  },
  body: JSON.stringify({ text }),
})

const body = await response.json().catch(() => ({}))

if (!response.ok) {
  console.error('[x-post] X post failed')
  console.error(JSON.stringify({ status: response.status, body }, null, 2))
  process.exit(1)
}

console.log('[x-post] Posted to X')
console.log(JSON.stringify(body, null, 2))
