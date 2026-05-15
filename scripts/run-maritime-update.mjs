#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const envPath = path.join(root, '.env.local')

function readLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        if (separator === -1) return [line, '']
        const key = line.slice(0, separator).trim()
        const rawValue = line.slice(separator + 1).trim()
        const value = rawValue.replace(/^['"]|['"]$/g, '')
        return [key, value]
      }),
  )
}

const localEnv = readLocalEnv(envPath)
const cronSecret = process.env.CRON_SECRET || localEnv.CRON_SECRET
const updateUrl = process.env.MARITIME_UPDATE_URL || 'https://www.vesselsurge.com/api/cron/update'

if (!cronSecret) {
  console.error('[maritime-update] Missing CRON_SECRET. Run `vercel env pull .env.local --yes` or set CRON_SECRET.')
  process.exit(1)
}

const startedAt = new Date()
console.log(`[maritime-update] Starting ${updateUrl} at ${startedAt.toISOString()}`)

const response = await fetch(updateUrl, {
  method: 'GET',
  headers: {
    authorization: `Bearer ${cronSecret}`,
    accept: 'application/json',
  },
})

const bodyText = await response.text()
let body
try {
  body = JSON.parse(bodyText)
} catch {
  body = { raw: bodyText.slice(0, 1000) }
}

if (!response.ok || body?.success === false) {
  console.error('[maritime-update] Update failed')
  console.error(JSON.stringify({ status: response.status, body }, null, 2))
  process.exit(1)
}

const news = body.news || {}
const ais = body.ais || {}
const summary = {
  status: response.status,
  articlesFetched: news.articles_fetched ?? null,
  articlesInserted: news.articles_inserted ?? null,
  statsUpdated: news.stats_updated ?? ais.stats_updated ?? null,
  verified: news.verified ?? null,
  vesselsFound: ais.vessels_found ?? null,
  source: news.source ?? null,
  timestamp: body.timestamp ?? new Date().toISOString(),
}

console.log('[maritime-update] Success')
console.log(JSON.stringify(summary, null, 2))
