#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { buildMarketingPost } from './lib/x-marketing-post.mjs'

const STATE_PATH = path.join(process.cwd(), '.x-compose-state.json')
const CACHE_PATH = path.join(process.cwd(), '.x-approved-feed-cache.json')
const FEED_URLS = (
  process.env.X_MARITIME_FEED_URLS ||
  process.env.X_MARITIME_FEED_URL ||
  'https://www.vesselsurge.com/api/social/x-feed?limit=20,https://vesselsurge.com/api/social/x-feed?limit=20'
)
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

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

function readCachedPayload() {
  if (!fs.existsSync(CACHE_PATH)) return null
  try {
    const cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'))
    if (cached?.payload) {
      console.log(`[x-compose] Using cached approved feed from ${cached.updatedAt || 'unknown time'}.`)
      return cached.payload
    }
  } catch (error) {
    console.error('[x-compose] Failed to read cached approved feed.')
    console.error(error)
  }
  return null
}

function writeCachedPayload(payload, feedUrl) {
  fs.writeFileSync(
    CACHE_PATH,
    JSON.stringify({ updatedAt: new Date().toISOString(), feedUrl, payload }, null, 2) + '\n',
  )
}

async function fetchApprovedFeed() {
  for (const feedUrl of FEED_URLS) {
    try {
      const response = await fetch(feedUrl, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        cache: 'no-store',
      })

      if (!response.ok) {
        console.error(`[x-compose] Approved feed returned ${response.status}: ${feedUrl}`)
        continue
      }

      const payload = await response.json()
      writeCachedPayload(payload, feedUrl)
      return payload
    } catch (error) {
      console.error(`[x-compose] Failed to fetch approved feed: ${feedUrl}`)
      console.error(error)
    }
  }

  return readCachedPayload()
}

const payload = await fetchApprovedFeed()
if (!payload) {
  console.log('[x-compose] No approved feed available online or in cache. No compose window opened.')
  process.exit(0)
}

const articles = payload?.items || payload?.data?.articles || []
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

const postText = nextArticle.postText || buildMarketingPost(nextArticle, { variantSeed: `${Date.now()}` })
const composeUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(postText)}`

console.log('[x-compose] Opening X compose with:')
console.log(postText)

const result = spawnSync('open', [composeUrl], { stdio: 'inherit' })

state.openedUrls = [nextArticle.sourceUrl, ...state.openedUrls].slice(0, 200)
writeState(state)

if (result.status !== 0) {
  const pendingPath = path.join(process.cwd(), '.x-compose-pending.json')
  fs.writeFileSync(
    pendingPath,
    JSON.stringify({ createdAt: new Date().toISOString(), sourceUrl: nextArticle.sourceUrl, composeUrl }, null, 2) +
      '\n',
  )
  console.error(`[x-compose] Failed to open browser via \`open\` (exit ${result.status}).`)
  console.log(`[x-compose] Compose URL (open manually): ${composeUrl}`)
  console.log(`[x-compose] Marked source as opened and wrote pending compose to ${pendingPath}.`)
  process.exit(0)
}

console.log('[x-compose] Compose window opened. Review it, then click Post in X.')
