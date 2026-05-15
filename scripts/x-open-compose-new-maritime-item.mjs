#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildMarketingPost } from './lib/x-marketing-post.mjs'

const STATE_PATH = path.join(process.cwd(), '.x-compose-state.json')
const FEED_URL = process.env.X_MARITIME_FEED_URL || 'https://www.vesselsurge.com/api/maritime-data'

function readState() {
  if (!fs.existsSync(STATE_PATH)) return { openedUrls: [] }
  try {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
    return { openedUrls: Array.isArray(state.openedUrls) ? state.openedUrls : [] }
  } catch {
    return { openedUrls: [] }
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n')
}

let response
try {
  response = await fetch(FEED_URL, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    cache: 'no-store',
  })
} catch (error) {
  console.error('[x-compose] Failed to fetch maritime feed (network unavailable).')
  console.error(error)
  console.log('[x-compose] No compose window opened.')
  process.exit(0)
}

if (!response.ok) {
  console.error(`[x-compose] Failed to fetch maritime feed: ${response.status}`)
  console.log('[x-compose] No compose window opened.')
  process.exit(0)
}

const payload = await response.json()
const articles = payload?.data?.articles || []
const candidates = articles
  .filter((article) => article.sourceUrl && article.region && article.region !== 'global')
  .sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0))

const state = readState()
const opened = new Set(state.openedUrls)
const nextArticle = candidates.find((article) => !opened.has(article.sourceUrl))

if (!nextArticle) {
  console.log('[x-compose] No new verified maritime item to open.')
  process.exit(0)
}

const postText = buildMarketingPost(nextArticle, { variantSeed: `${Date.now()}` })
const composeUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(postText)}`

console.log('[x-compose] Opening X compose with:')
console.log(postText)

const result = spawnSync('open', [composeUrl], { stdio: 'inherit' })
if (result.status !== 0) process.exit(result.status || 1)

state.openedUrls = [nextArticle.sourceUrl, ...state.openedUrls].slice(0, 200)
writeState(state)
console.log('[x-compose] Compose window opened. Review it, then click Post in X.')
