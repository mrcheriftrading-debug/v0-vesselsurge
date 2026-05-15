#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const STATE_PATH = path.join(process.cwd(), '.x-post-state.json')
const FEED_URL = process.env.X_MARITIME_FEED_URL || 'https://www.vesselsurge.com/api/maritime-data'
const MAP_URL = 'https://www.vesselsurge.com/map-dashboard'
const HOTSPOT_NAMES = {
  hormuz: 'Strait of Hormuz',
  bab: 'Bab el-Mandeb',
  malacca: 'Strait of Malacca',
  suez: 'Suez Canal',
}

function readState() {
  if (!fs.existsSync(STATE_PATH)) return { postedUrls: [] }
  try {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
    return { postedUrls: Array.isArray(state.postedUrls) ? state.postedUrls : [] }
  } catch {
    return { postedUrls: [] }
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n')
}

function truncate(value, max) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}

function buildPost(article) {
  const hotspot = HOTSPOT_NAMES[article.region] || article.region
  const title = truncate(article.title.replace(/\s+/g, ' ').trim(), 135)
  const source = truncate(article.source || 'verified source', 36)

  return truncate(
    `VesselSurge update: ${hotspot}\n\n${title}\n\nSource: ${source}\nLive map: ${MAP_URL}`,
    280,
  )
}

const response = await fetch(FEED_URL, {
  headers: { accept: 'application/json', 'cache-control': 'no-cache' },
  cache: 'no-store',
})

if (!response.ok) {
  console.error(`[x-agent] Failed to fetch maritime feed: ${response.status}`)
  process.exit(1)
}

const payload = await response.json()
const articles = payload?.data?.articles || []
const candidates = articles
  .filter((article) => article.sourceUrl && article.region && article.region !== 'global')
  .sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0))

const state = readState()
const posted = new Set(state.postedUrls)
const nextArticle = candidates.find((article) => !posted.has(article.sourceUrl))

if (!nextArticle) {
  console.log('[x-agent] No new verified maritime item to post.')
  process.exit(0)
}

const postText = buildPost(nextArticle)
console.log('[x-agent] Posting new maritime update:')
console.log(postText)

const result = spawnSync(process.execPath, ['scripts/x-post.mjs', postText], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env,
})

if (result.status !== 0) process.exit(result.status || 1)

state.postedUrls = [nextArticle.sourceUrl, ...state.postedUrls].slice(0, 200)
writeState(state)
console.log(`[x-agent] Posted and recorded ${nextArticle.sourceUrl}`)
