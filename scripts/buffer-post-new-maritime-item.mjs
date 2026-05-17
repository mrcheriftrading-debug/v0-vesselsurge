#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { buildMarketingPost } from './lib/x-marketing-post.mjs'
import { getEnv, readLocalEnv } from './lib/read-env.mjs'

const SITE_URL = 'https://www.vesselsurge.com'
const STATE_PATH = path.join(process.cwd(), '.buffer-post-state.json')
const CACHE_PATH = path.join(process.cwd(), '.buffer-approved-feed-cache.json')
const BUFFER_API_URL = 'https://api.buffer.com'
const DEFAULT_MIN_HOURS_BETWEEN_POSTS = 8
const DEFAULT_MAX_POSTS_PER_DAY = 2
const DEFAULT_MAX_SCHEDULED_QUEUE = 6
const DEFAULT_MIN_RATE_LIMIT_REMAINING = 10
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
  const state = readJsonFile(STATE_PATH, { postedUrls: [], postedAt: [], imageCursor: 0 })
  return {
    postedUrls: Array.isArray(state.postedUrls) ? state.postedUrls : [],
    postedAt: Array.isArray(state.postedAt) ? state.postedAt : [],
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

function readNumberEnv(name, localEnv, fallback) {
  const value = Number.parseInt(getEnv(name, localEnv) || '', 10)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function hoursSince(isoDate) {
  const timestamp = Date.parse(isoDate || '')
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY
  return (Date.now() - timestamp) / (1000 * 60 * 60)
}

function sameUtcDay(a, b) {
  const aDate = new Date(a)
  const bDate = new Date(b)
  return (
    aDate.getUTCFullYear() === bDate.getUTCFullYear() &&
    aDate.getUTCMonth() === bDate.getUTCMonth() &&
    aDate.getUTCDate() === bDate.getUTCDate()
  )
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
  const rateLimitRemaining = Number.parseInt(response.headers.get('ratelimit-remaining') || '', 10)
  const rateLimitReset = response.headers.get('ratelimit-reset')

  if (!response.ok || json.errors) {
    const message = json.errors?.map((error) => error.message).join('; ') || JSON.stringify(json)
    throw new Error(`Buffer API error (${response.status}): ${message}`)
  }

  if (Number.isFinite(rateLimitRemaining)) {
    json.data = {
      ...json.data,
      _rateLimit: {
        remaining: rateLimitRemaining,
        reset: rateLimitReset,
      },
    }
  }

  return json.data
}

async function resolveTwitterChannel(token, preferredChannelId) {
  const organizationsData = await bufferGraphql(
    token,
    `query GetOrganizations {
      account {
        organizations {
          id
          name
          limits {
            scheduledPosts
          }
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
    const channel = channelsData.channels?.find((item) =>
      preferredChannelId ? item.id === preferredChannelId : item.service === 'twitter',
    )
    if (channel) {
      return {
        organization,
        channel,
        rateLimit: channelsData._rateLimit || organizationsData._rateLimit || null,
      }
    }
  }

  return null
}

async function getScheduledPostsSummary({ token, organizationId, channelId }) {
  const data = await bufferGraphql(
    token,
    `query GetScheduledPosts($organizationId: OrganizationId!, $channelId: ChannelId!) {
      posts(
        first: 20
        input: {
          organizationId: $organizationId
          sort: [{ field: dueAt, direction: asc }, { field: createdAt, direction: desc }]
          filter: { status: [scheduled], channelIds: [$channelId] }
        }
      ) {
        totalCount
        edges {
          node {
            id
            text
            dueAt
            createdAt
            channelId
          }
        }
      }
    }`,
    { organizationId, channelId },
  )

  return {
    totalCount: data.posts?.totalCount || data.posts?.edges?.length || 0,
    posts: (data.posts?.edges || []).map((edge) => edge.node),
    rateLimit: data._rateLimit || null,
  }
}

async function getDailyPostingLimit({ token, channelId }) {
  const data = await bufferGraphql(
    token,
    `query GetDailyPostingLimits($channelId: ChannelId!) {
      dailyPostingLimits(input: { channelIds: [$channelId] }) {
        channelId
        sent
        scheduled
        limit
        isAtLimit
      }
    }`,
    { channelId },
  )

  return {
    status: data.dailyPostingLimits?.[0] || null,
    rateLimit: data._rateLimit || null,
  }
}

function shouldSkipForLocalCadence({ state, maxPostsPerDay, minHoursBetweenPosts }) {
  const now = new Date()
  const recentPostedAt = state.postedAt.filter((postedAt) => Number.isFinite(Date.parse(postedAt)))
  const postedToday = recentPostedAt.filter((postedAt) => sameUtcDay(postedAt, now)).length
  const latestPostAt = recentPostedAt.sort((a, b) => Date.parse(b) - Date.parse(a))[0]

  if (postedToday >= maxPostsPerDay) {
    return `daily local cap reached (${postedToday}/${maxPostsPerDay})`
  }

  const elapsedHours = hoursSince(latestPostAt)
  if (elapsedHours < minHoursBetweenPosts) {
    return `minimum spacing active (${elapsedHours.toFixed(1)}h/${minHoursBetweenPosts}h)`
  }

  return null
}

function shouldSkipForBufferLimits({ dailyLimit, scheduledSummary, maxPostsPerDay, maxScheduledQueue }) {
  if (scheduledSummary.totalCount >= maxScheduledQueue) {
    return `Buffer queue cap reached (${scheduledSummary.totalCount}/${maxScheduledQueue})`
  }

  if (!dailyLimit) return null
  const networkLimit = dailyLimit.limit ?? Number.POSITIVE_INFINITY
  const effectiveDailyLimit = Math.min(networkLimit, maxPostsPerDay)
  const usedToday = (dailyLimit.sent || 0) + (dailyLimit.scheduled || 0)

  if (dailyLimit.isAtLimit || usedToday >= effectiveDailyLimit) {
    return `Buffer daily cap reached (${usedToday}/${effectiveDailyLimit})`
  }

  return null
}

function shouldSkipForRateLimit(rateLimits, minRateLimitRemaining) {
  const lowestRemaining = rateLimits
    .map((item) => item?.remaining)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)[0]

  if (Number.isFinite(lowestRemaining) && lowestRemaining <= minRateLimitRemaining) {
    return `Buffer API rate-limit reserve reached (${lowestRemaining} remaining)`
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
const preferredChannelId = getEnv('BUFFER_X_CHANNEL_ID', localEnv)
const maxPostsPerDay = readNumberEnv('BUFFER_MAX_POSTS_PER_DAY', localEnv, DEFAULT_MAX_POSTS_PER_DAY)
const minHoursBetweenPosts = readNumberEnv(
  'BUFFER_MIN_HOURS_BETWEEN_POSTS',
  localEnv,
  DEFAULT_MIN_HOURS_BETWEEN_POSTS,
)
const maxScheduledQueue = readNumberEnv('BUFFER_MAX_SCHEDULED_QUEUE', localEnv, DEFAULT_MAX_SCHEDULED_QUEUE)
const minRateLimitRemaining = readNumberEnv(
  'BUFFER_MIN_RATE_LIMIT_REMAINING',
  localEnv,
  DEFAULT_MIN_RATE_LIMIT_REMAINING,
)

if (!token) {
  console.error('[buffer-agent] Missing BUFFER_ACCESS_TOKEN.')
  process.exit(1)
}

const resolved = await resolveTwitterChannel(token, preferredChannelId)
if (!resolved) {
  console.error('[buffer-agent] No Buffer X/Twitter channel found.')
  process.exit(1)
}

if (resolved.channel.isQueuePaused) {
  console.error('[buffer-agent] Buffer X/Twitter queue is paused.')
  process.exit(1)
}

const channelId = resolved.channel.id
const organizationId = resolved.organization.id
const state = readState()
const localSkipReason = shouldSkipForLocalCadence({ state, maxPostsPerDay, minHoursBetweenPosts })
if (localSkipReason) {
  console.log(`[buffer-agent] Skipping: ${localSkipReason}.`)
  process.exit(0)
}

const [scheduledSummary, dailyPostingLimit] = await Promise.all([
  getScheduledPostsSummary({ token, organizationId, channelId }),
  getDailyPostingLimit({ token, channelId }),
])
const bufferSkipReason = shouldSkipForBufferLimits({
  dailyLimit: dailyPostingLimit.status,
  scheduledSummary,
  maxPostsPerDay,
  maxScheduledQueue,
})
if (bufferSkipReason) {
  console.log(`[buffer-agent] Skipping: ${bufferSkipReason}.`)
  process.exit(0)
}

const rateLimitSkipReason = shouldSkipForRateLimit(
  [resolved.rateLimit, scheduledSummary.rateLimit, dailyPostingLimit.rateLimit],
  minRateLimitRemaining,
)
if (rateLimitSkipReason) {
  console.log(`[buffer-agent] Skipping: ${rateLimitSkipReason}.`)
  process.exit(0)
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
  state.postedAt = [new Date().toISOString(), ...state.postedAt].slice(0, 300)
  writeState(state)
}
