#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const STATE_PATH = path.join(process.cwd(), '.x-direct-post-state.json')
const FEED_URL =
  process.env.X_MARITIME_FEED_URL ||
  'https://www.vesselsurge.com/api/social/x-feed?approval=approved&limit=20'

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

function cardUrl(item) {
  const params = new URLSearchParams({
    title: item.title || 'New maritime intelligence update',
    source: item.source || 'verified source',
    region: item.region || 'global',
    risk: item.riskLevel || 'medium',
  })

  return `https://www.vesselsurge.com/api/social/x-card?${params.toString()}`
}

function altText(item) {
  return [
    `VesselSurge maritime intelligence card for ${item.region || 'global'}.`,
    `Risk level: ${item.riskLevel || 'medium'}.`,
    `Headline: ${item.title || 'New maritime intelligence update'}.`,
    `Source: ${item.source || 'verified source'}.`,
  ].join(' ')
}

const feedResponse = await fetch(`${FEED_URL}&variant=direct-${Date.now()}`, {
  headers: { accept: 'application/json', 'cache-control': 'no-cache' },
  cache: 'no-store',
})

if (!feedResponse.ok) {
  console.error(`[x-direct-agent] Failed to fetch social feed: ${feedResponse.status}`)
  process.exit(1)
}

const payload = await feedResponse.json()
const items = (payload.items || []).filter((item) => item.sourceUrl && item.postText)
const state = readState()
const posted = new Set(state.postedUrls)
const nextItem = items.find((item) => !posted.has(item.sourceUrl))

if (!nextItem) {
  console.log('[x-direct-agent] No new approved maritime item to post.')
  process.exit(0)
}

console.log('[x-direct-agent] Posting new maritime update directly to X:')
console.log(nextItem.postText)
console.log(`[x-direct-agent] Image: ${cardUrl(nextItem)}`)

const result = spawnSync(
  process.execPath,
  ['scripts/x-post-with-image.mjs', '--image-url', cardUrl(nextItem), '--alt-text', altText(nextItem), nextItem.postText],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  },
)

if (result.status !== 0) process.exit(result.status || 1)

state.postedUrls = [nextItem.sourceUrl, ...state.postedUrls].slice(0, 300)
writeState(state)
console.log(`[x-direct-agent] Posted and recorded ${nextItem.sourceUrl}`)
