#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { buildMarketingPost } from './lib/x-marketing-post.mjs'
import { getEnv, readLocalEnv } from './lib/read-env.mjs'

const SITE_URL = 'https://www.vesselsurge.com'
const STATE_PATH = path.join(process.cwd(), '.buffer-post-state.json')
const CACHE_PATH = path.join(process.cwd(), '.buffer-approved-feed-cache.json')
const BUFFER_API_URL = 'https://api.buffer.com'
const FEED_URLS = (
  process.env.X_MARITIME_FEED_URLS ||
  process.env.X_MARITIME_FEED_URL ||
  'https://www.vesselsurge.com/api/social/x-feed?approval=all&limit=30,https://vesselsurge.com/api/social/x-feed?approval=all&limit=30'
)
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

const IMAGE_BY_REGION = {
  hormuz: [
    'viral-01-trump-iran-hormuz-alert.jpg',
    'seo-01-hormuz-oil-risk.jpg',
    'vesselsurge-hormuz-premium-card-v2.jpg',
    'viral-03-market-panic-hormuz.jpg',
    'seo-04-oil-tanker-tracking.jpg',
  ],
  bab: ['seo-02-red-sea-shipping-risk.jpg', 'viral-05-red-sea-domino-risk.jpg', 'trend-04-bab-el-mandeb-next.jpg'],
  suez: ['seo-03-shipping-disruption-tracker.jpg', 'trend-03-market-does-not-wait.jpg'],
  malacca: ['trend-05-vessel-slowing-signal.jpg', 'seo-05-maritime-intelligence-layer.jpg'],
}

const FALLBACK_IMAGES = [
  'seo-05-maritime-intelligence-layer.jpg',
  'viral-06-vesselsurge-watch-before-news.jpg',
  'trend-02-operators-watch-chokepoint.jpg',
]

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n')
}

function readState() {
  const state = readJsonFile(STATE_PATH, { postedUrls: [], imageCursor: 0 })
  return {
    postedUrls: Array.isArray(state.postedUrls) ? state.postedUrls : [],
    imageCursor: Number.isInteger(state.imageCursor) ? state.imageCursor : 0,
  }
}

function writeState(state) {
  writeJsonFile(STATE_PATH, state)
}

function readCachedPayload() {
  const cached = readJsonFile(CACHE_PATH, null)
  if (cached?.payload) {
    console.log(`[buffer-agent] Using cached approved feed from ${cached.updatedAt || 'unknown time'}.`)
    return cached.payload
  }
  return null
}

function writeCachedPayload(payload, feedUrl) {
  writeJsonFile(CACHE_PATH, { updatedAt: new Date().toISOString(), feedUrl, payload })
}

async function fetchApprovedFeed() {
  for (const feedUrl of FEED_URLS) {
    try {
      const response = await fetch(feedUrl, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        cache: 'no-store',
      })

      if (!response.ok) {
        console.error(`[buffer-agent] Approved feed returned ${response.status}: ${feedUrl}`)
        continue
      }

      const payload = await response.json()
      writeCachedPayload(payload, feedUrl)
      return payload
    } catch (error) {
      console.error(`[buffer-agent] Failed to fetch approved feed: ${feedUrl}`)
      console.error(error)
    }
  }

  return readCachedPayload()
}

function selectImage(article, state) {
  const options = IMAGE_BY_REGION[article.region] || FALLBACK_IMAGES
  const fileName = options[state.imageCursor % options.length]
  state.imageCursor += 1
  return {
    fileName,
    url: `${SITE_URL}/social-assets/${fileName}`,
    altText: `VesselSurge maritime intelligence card for ${article.region || 'global shipping risk'} and chokepoint monitoring`,
  }
}

function normalizePostText(article) {
  const text = article.postText || buildMarketingPost(article, { variantSeed: `${Date.now()}` })
  return text.length <= 280 ? text : `${text.slice(0, 276).trim()}...`
}

async function bufferGraphql(token, query, variables = {}) {
  const response = await fetch(BUFFER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await response.json()

  if (!response.ok || json.errors) {
    const message = json.errors?.map((error) => error.message).join('; ') || JSON.stringify(json)
    throw new Error(`Buffer API error (${response.status}): ${message}`)
  }

  return json.data
}

async function findTwitterChannel(token) {
  const organizationsData = await bufferGraphql(
    token,
    `query GetOrganizations {
      account {
        organizations {
          id
          name
        }
      }
    }`,
  )

  for (const organization of organizationsData.account?.organizations || []) {
    const channelsData = await bufferGraphql(
      token,
      `query GetChannels($organizationId: OrganizationId!) {
        channels(input: { organizationId: $organizationId }) {
          id
          name
          displayName
          service
          isQueuePaused
        }
      }`,
      { organizationId: organization.id },
    )
    const channel = channelsData.channels?.find((item) => item.service === 'twitter')
    if (channel) return channel
  }

  return null
}

async function createBufferPost({ token, channelId, postText, imageUrl, dryRun }) {
  const input = {
    text: postText,
    channelId,
    schedulingType: 'automatic',
    mode: 'addToQueue',
    assets: [{ image: { url: imageUrl } }],
    source: 'vesselsurge-openclaw-buffer-agent',
    aiAssisted: true,
  }

  if (dryRun) return { dryRun: true, input }

  const data = await bufferGraphql(
    token,
    `mutation CreateVesselSurgePost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess {
          post {
            id
            text
            dueAt
            status
            assets {
              id
              mimeType
            }
          }
        }
        ... on MutationError {
          message
        }
      }
    }`,
    { input },
  )

  if (data.createPost?.message) throw new Error(`Buffer rejected post: ${data.createPost.message}`)
  return data.createPost?.post
}

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')
const localEnv = readLocalEnv()
const token = getEnv('BUFFER_ACCESS_TOKEN', localEnv)
let channelId = getEnv('BUFFER_X_CHANNEL_ID', localEnv)

if (!token) {
  console.error('[buffer-agent] Missing BUFFER_ACCESS_TOKEN.')
  process.exit(1)
}

if (!channelId) {
  const channel = await findTwitterChannel(token)
  if (!channel) {
    console.error('[buffer-agent] No Buffer X/Twitter channel found.')
    process.exit(1)
  }
  if (channel.isQueuePaused) {
    console.error('[buffer-agent] Buffer X/Twitter queue is paused.')
    process.exit(1)
  }
  channelId = channel.id
}

const payload = await fetchApprovedFeed()
if (!payload) {
  console.log('[buffer-agent] No approved feed available online or in cache. No Buffer post created.')
  process.exit(0)
}

const articles = payload?.items || payload?.data?.articles || []
const candidates = articles
  .filter((article) => article.sourceUrl && article.region && article.region !== 'global')
  .sort((a, b) => {
    const scoreDiff = (b.approval?.score || 0) - (a.approval?.score || 0)
    if (scoreDiff !== 0) return scoreDiff
    return Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0)
  })

const state = readState()
const posted = new Set(state.postedUrls)
const nextArticle = candidates.find((article) => !posted.has(article.sourceUrl))

if (!nextArticle) {
  console.log('[buffer-agent] No new approved maritime item to queue.')
  process.exit(0)
}

const postText = normalizePostText(nextArticle)
const image = selectImage(nextArticle, state)
const post = await createBufferPost({ token, channelId, postText, imageUrl: image.url, dryRun })

console.log(dryRun ? '[buffer-agent] Dry run ready:' : '[buffer-agent] Queued Buffer post:')
console.log(postText)
console.log(`[buffer-agent] Image: ${image.url}`)
console.log(`[buffer-agent] Alt text: ${image.altText}`)
if (post?.id) console.log(`[buffer-agent] Buffer post id: ${post.id}`)
if (post?.dueAt) console.log(`[buffer-agent] Scheduled for: ${post.dueAt}`)

if (!dryRun) {
  state.postedUrls = [nextArticle.sourceUrl, ...state.postedUrls].slice(0, 300)
  writeState(state)
}
