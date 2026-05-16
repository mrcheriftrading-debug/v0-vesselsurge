#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import os from 'node:os'

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

function altText(item) {
  return [
    `VesselSurge maritime intelligence card for ${item.region || 'global'}.`,
    `Risk level: ${item.riskLevel || 'medium'}.`,
    `Headline: ${item.title || 'New maritime intelligence update'}.`,
    `Source: ${item.source || 'verified source'}.`,
  ].join(' ')
}

function escapeXml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapText(value, maxLineLength = 30) {
  const words = `${value || ''}`.replace(/\s+/g, ' ').trim().split(' ')
  const lines = []
  let line = ''

  for (const word of words) {
    if (`${line} ${word}`.trim().length > maxLineLength && line) {
      lines.push(line)
      line = word
    } else {
      line = `${line} ${word}`.trim()
    }
  }

  if (line) lines.push(line)
  return lines.slice(0, 4)
}

function buildLocalCard(item) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vesselsurge-x-card-'))
  const svgPath = path.join(tmpDir, 'card.svg')
  const pngPath = `${svgPath}.png`
  const risk = `${item.riskLevel || 'medium'}`.toUpperCase()
  const region = `${item.region || 'global'}`.toUpperCase()
  const titleLines = wrapText(item.title || 'New maritime intelligence update')
  const titleTspans = titleLines
    .map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : 74}">${escapeXml(line)}</tspan>`)
    .join('')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#071014"/>
      <stop offset="55%" stop-color="#0f2630"/>
      <stop offset="100%" stop-color="#121827"/>
    </linearGradient>
    <radialGradient id="radar" cx="82%" cy="18%" r="55%">
      <stop offset="0%" stop-color="#14b8a6" stop-opacity=".55"/>
      <stop offset="60%" stop-color="#14b8a6" stop-opacity=".08"/>
      <stop offset="100%" stop-color="#14b8a6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect width="1200" height="675" fill="url(#radar)"/>
  <circle cx="980" cy="145" r="96" fill="none" stroke="#38bdf8" stroke-opacity=".28" stroke-width="2"/>
  <circle cx="980" cy="145" r="158" fill="none" stroke="#38bdf8" stroke-opacity=".18" stroke-width="2"/>
  <path d="M70 540 C260 490, 410 580, 600 520 S930 500, 1130 545" fill="none" stroke="#67e8f9" stroke-opacity=".28" stroke-width="8"/>
  <text x="72" y="82" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800">VesselSurge</text>
  <text x="72" y="122" fill="#99f6e4" font-family="Arial, Helvetica, sans-serif" font-size="22">Live Maritime Intelligence</text>
  <rect x="930" y="56" width="198" height="58" rx="29" fill="#3b1217" stroke="#ef4444" stroke-width="3"/>
  <text x="1029" y="94" text-anchor="middle" fill="#fee2e2" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="900">${escapeXml(risk)}</text>
  <text x="72" y="208" fill="#bae6fd" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800">${escapeXml(region)}</text>
  <text y="292" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="60" font-weight="900">${titleTspans}</text>
  <text x="72" y="606" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="25">Source: ${escapeXml(item.source || 'verified source')}</text>
  <text x="1128" y="606" text-anchor="end" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900">vesselsurge.com/map-dashboard</text>
</svg>`

  fs.writeFileSync(svgPath, svg)

  const result = spawnSync('qlmanage', ['-t', '-s', '1200', '-o', tmpDir, svgPath], {
    stdio: 'ignore',
  })

  if (result.status !== 0 || !fs.existsSync(pngPath) || fs.statSync(pngPath).size === 0) {
    throw new Error('Failed to render local VesselSurge image card.')
  }

  return { tmpDir, pngPath }
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
const renderedCard = buildLocalCard(nextItem)
console.log(`[x-direct-agent] Image: ${renderedCard.pngPath}`)

const result = spawnSync(
  process.execPath,
  ['scripts/x-post-with-image.mjs', '--image-file', renderedCard.pngPath, '--alt-text', altText(nextItem), nextItem.postText],
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
