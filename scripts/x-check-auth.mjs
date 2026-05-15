#!/usr/bin/env node

import { readLocalEnv, getEnv } from './lib/read-env.mjs'
import { buildOAuth1Header } from './lib/x-oauth1.mjs'

const localEnv = readLocalEnv()
const credentials = {
  consumerKey: getEnv('X_API_KEY', localEnv),
  consumerSecret: getEnv('X_API_SECRET', localEnv),
  token: getEnv('X_ACCESS_TOKEN', localEnv),
  tokenSecret: getEnv('X_ACCESS_TOKEN_SECRET', localEnv),
}

for (const [key, value] of Object.entries(credentials)) {
  if (!value) {
    console.error(`[x-check] Missing ${key}. Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET to .env.local.`)
    process.exit(1)
  }
}

const url = 'https://api.x.com/2/users/me?user.fields=username'
const response = await fetch(url, {
  headers: {
    authorization: buildOAuth1Header({ method: 'GET', url, ...credentials }),
  },
})

const body = await response.json().catch(() => ({}))

if (!response.ok) {
  console.error('[x-check] X auth check failed')
  console.error(JSON.stringify({ status: response.status, body }, null, 2))
  process.exit(1)
}

console.log('[x-check] X credentials are valid')
console.log(JSON.stringify({
  id: body.data?.id,
  username: body.data?.username,
  name: body.data?.name,
}, null, 2))
