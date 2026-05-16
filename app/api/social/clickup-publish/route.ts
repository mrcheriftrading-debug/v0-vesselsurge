import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2'
const DEFAULT_WORKSPACE_ID = '90121653458'
const DEFAULT_POSTS_LIST_ID = '901217308703'
const DEFAULT_X_ACCOUNT_TASK_ID = '869cyummt'
const DEFAULT_ACCOUNT_FIELD_ID = '85aca866-925a-405d-840f-85c6d2a008ab'
const DEFAULT_PUBLISH_STATUS = 'published'

type SocialFeedItem = {
  id: string
  title: string
  summary?: string
  source: string
  sourceUrl?: string | null
  region: string
  riskLevel: string
  timestamp: string
  postText: string
  liveMapUrl: string
  approval: {
    approved: boolean
    score: number
    reasons: string[]
  }
}

type ClickUpConfig = {
  apiToken: string
  workspaceId: string
  postsListId: string
  xAccountTaskId: string
  accountFieldId: string
  publishStatus: string
}

function getClickUpConfig(): ClickUpConfig | null {
  const apiToken = process.env.CLICKUP_API_TOKEN

  if (!apiToken) return null

  return {
    apiToken,
    workspaceId: process.env.CLICKUP_WORKSPACE_ID || DEFAULT_WORKSPACE_ID,
    postsListId: process.env.CLICKUP_POSTS_LIST_ID || DEFAULT_POSTS_LIST_ID,
    xAccountTaskId: process.env.CLICKUP_X_ACCOUNT_TASK_ID || DEFAULT_X_ACCOUNT_TASK_ID,
    accountFieldId: process.env.CLICKUP_POST_ACCOUNT_FIELD_ID || DEFAULT_ACCOUNT_FIELD_ID,
    publishStatus: process.env.CLICKUP_PUBLISH_STATUS || DEFAULT_PUBLISH_STATUS,
  }
}

function assertCron(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 })
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

function compact(value: string | null | undefined) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim()
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}

function absoluteUrl(request: Request, path: string) {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}${path}`
}

function buildCardUrl(request: Request, item: SocialFeedItem) {
  const params = new URLSearchParams({
    title: item.title,
    source: item.source,
    region: item.region,
    risk: item.riskLevel,
  })

  return absoluteUrl(request, `/api/social/x-card?${params.toString()}`)
}

function buildPostTaskName(item: SocialFeedItem) {
  return `VesselSurge X auto-post - ${truncate(compact(item.title), 72)}`
}

function buildPostDescription(item: SocialFeedItem, cardUrl: string) {
  const imageText = `${item.region.toUpperCase()} ${item.riskLevel.toUpperCase()}: ${compact(item.title)}`

  return [
    'Tweet / Thread',
    '',
    item.postText,
    '',
    'Image',
    cardUrl,
    '',
    'Image text',
    imageText,
    '',
    'Alt text',
    `VesselSurge maritime intelligence card for ${item.region}, risk ${item.riskLevel}. Headline: ${compact(item.title)}. Source: ${compact(item.source)}.`,
    '',
    'Source',
    compact(item.source),
    item.sourceUrl || 'No source URL',
    '',
    `Source URL: ${item.sourceUrl || item.id}`,
    `VesselSurge item ID: ${item.id}`,
    `Approval score: ${item.approval.score}`,
    `Approval reasons: ${item.approval.reasons.join(', ')}`,
  ].join('\n')
}

async function clickupRequest(config: ClickUpConfig, path: string, init: RequestInit = {}) {
  return fetch(`${CLICKUP_API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: config.apiToken,
      ...(init.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
      ...(init.headers || {}),
    },
  })
}

async function fetchFeed(request: Request) {
  const variant = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const feedUrl = absoluteUrl(request, `/api/social/x-feed?approval=approved&limit=20&variant=${variant}`)
  const response = await fetch(feedUrl, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch social feed: ${response.status}`)
  }

  const payload = await response.json()
  return (payload.items || []) as SocialFeedItem[]
}

async function fetchRecentClickUpTasks(config: ClickUpConfig) {
  const params = new URLSearchParams({
    include_closed: 'true',
    subtasks: 'false',
    page: '0',
    order_by: 'created',
    reverse: 'true',
  })
  const response = await clickupRequest(config, `/list/${config.postsListId}/task?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch ClickUp tasks: ${response.status} ${await response.text()}`)
  }

  const payload = await response.json()
  return (payload.tasks || []) as Array<{ id: string; name: string; description?: string; text_content?: string }>
}

function wasAlreadyPosted(item: SocialFeedItem, tasks: Array<{ description?: string; text_content?: string }>) {
  const markers = [item.sourceUrl, `VesselSurge item ID: ${item.id}`].filter(Boolean) as string[]

  return tasks.some((task) => {
    const haystack = `${task.description || ''}\n${task.text_content || ''}`
    return markers.some((marker) => haystack.includes(marker))
  })
}

async function createClickUpPost(config: ClickUpConfig, item: SocialFeedItem, cardUrl: string) {
  const response = await clickupRequest(config, `/list/${config.postsListId}/task`, {
    method: 'POST',
    body: JSON.stringify({
      name: buildPostTaskName(item),
      description: buildPostDescription(item, cardUrl),
      status: 'draft',
      custom_fields: [
        {
          id: config.accountFieldId,
          value: [config.xAccountTaskId],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create ClickUp post: ${response.status} ${await response.text()}`)
  }

  return (await response.json()) as { id: string; url: string }
}

async function attachCardImage(config: ClickUpConfig, taskId: string, cardUrl: string) {
  const imageResponse = await fetch(cardUrl, { cache: 'no-store' })

  if (!imageResponse.ok) {
    throw new Error(`Failed to render social card: ${imageResponse.status}`)
  }

  const imageBlob = await imageResponse.blob()
  const form = new FormData()
  form.append('attachment', imageBlob, 'vesselsurge-maritime-intelligence.png')

  const response = await clickupRequest(config, `/task/${taskId}/attachment`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error(`Failed to attach ClickUp image: ${response.status} ${await response.text()}`)
  }
}

async function publishClickUpPost(config: ClickUpConfig, taskId: string) {
  const response = await clickupRequest(config, `/task/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: config.publishStatus,
      due_date: Date.now(),
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to publish ClickUp post: ${response.status} ${await response.text()}`)
  }
}

export async function GET(request: Request) {
  const unauthorized = assertCron(request)
  if (unauthorized) return unauthorized

  const config = getClickUpConfig()
  if (!config) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'CLICKUP_API_TOKEN is not configured. ClickUp/X publishing is disabled.',
    })
  }

  try {
    const [items, recentTasks] = await Promise.all([fetchFeed(request), fetchRecentClickUpTasks(config)])
    const nextItem = items.find((item) => item.sourceUrl && !wasAlreadyPosted(item, recentTasks))

    if (!nextItem) {
      return NextResponse.json({
        success: true,
        published: false,
        reason: 'No new approved maritime item to publish.',
        reviewed: items.length,
      })
    }

    const cardUrl = buildCardUrl(request, nextItem)
    const task = await createClickUpPost(config, nextItem, cardUrl)
    await attachCardImage(config, task.id, cardUrl)
    await publishClickUpPost(config, task.id)

    return NextResponse.json({
      success: true,
      published: true,
      task_id: task.id,
      task_url: task.url,
      source_url: nextItem.sourceUrl,
      card_url: cardUrl,
      status: config.publishStatus,
    })
  } catch (error: any) {
    console.error('[clickup-publish] Failed:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
