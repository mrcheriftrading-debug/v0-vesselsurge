#!/usr/bin/env node

import fs from 'node:fs'

function loadLocalEnv() {
  if (!fs.existsSync('.env.local')) return
  const content = fs.readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

loadLocalEnv()

const secret = process.env.CRON_SECRET
if (!secret) {
  console.error('[telegram-inbox] Missing CRON_SECRET')
  process.exit(1)
}

const endpoint = process.env.TELEGRAM_CODEX_INBOX_URL || 'https://www.vesselsurge.com/api/telegram/codex-inbox'
const response = await fetch(endpoint, {
  headers: { authorization: `Bearer ${secret}` },
  cache: 'no-store',
})

const body = await response.json().catch(() => null)
if (!response.ok) {
  console.error('[telegram-inbox] Failed to fetch inbox:', response.status, body)
  process.exit(1)
}

if (!body.count) {
  console.log('No pending Telegram Codex inbox items.')
  process.exit(0)
}

console.log(JSON.stringify(body, null, 2))
