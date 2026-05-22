import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildOfflineMaritimeDashboardSnapshot } from '@/lib/maritime-offline-snapshot'
import {
  isMaritimeTradeSource,
  isOfficialMaritimeSource,
  isTierOneNewsSource,
  TIER_ONE_NEWS_SOURCE_NAMES,
} from '@/lib/maritime-source-quality'
import { publicVercelCacheHeaders } from '@/lib/vercel-cache'
import { buildMarketingPost, getMarketingApproval } from '@/scripts/lib/x-marketing-post.mjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FEED_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300'
const FEED_CACHE_HEADERS = publicVercelCacheHeaders(FEED_CACHE_CONTROL, ['x-feed', 'growth-feed'])
const DEFAULT_VARIANT_SEED = 'vesselsurge-stable-social-feed-v1'
const FEED_SETTLE_MS = 2 * 60 * 1000
const HOTSPOT_QUERY_TIMEOUT_MS = 1200
const ARTICLE_QUERY_TIMEOUT_MS = 2500
const STABLE_FALLBACK_TIMESTAMP = '2026-05-20T00:00:00.000Z'

function isExpectedFallbackReason(value: unknown) {
  const message = value instanceof Error ? value.message : String(value || '')
  return /timed out|timeout|aborted/i.test(message)
}

const TRUSTED_SOURCES = [
  'USNI News',
  'gCaptain',
  'Hellenic Shipping News',
  'Splash247',
  'Offshore Energy',
  'Seatrade Maritime News',
  'MarineLink',
  'Al Jazeera',
  'Bloomberg Markets',
  'Bloomberg Politics',
  'Bloomberg Economics',
  'Bloomberg Business',
  ...TIER_ONE_NEWS_SOURCE_NAMES,
  'Safety4Sea',
  'MarineLog',
  'World Oil',
  'Arab News',
  'Google News Bab el-Mandeb',
  'Google News Suez Canal',
  'Google News Malacca Strait',
  'ReCAAP ISC Alerts',
  'ReCAAP ISC Reports',
  'Norwegian Maritime Authority',
  'MARAD Maritime Security Advisory',
  'Suez Canal Authority',
]

const GOOGLE_NEWS_SOURCE_PREFIX = 'Google News:'
const MARKETING_SOURCE_BLOCKLIST = /\b(citybuzz|rising kashmir|kurdistan24|crypto|coin|bitcoin|decrypt|coingape|forex|sports|tourism|entertainment)\b/i

function trustedMarketingSourceContext(article: any) {
  return `${article.source || ''} ${article.title || ''} ${article.url || article.sourceUrl || ''}`
}

function isTrustedMarketingSource(article: any) {
  const source = article.source || ''
  const context = trustedMarketingSourceContext(article)
  if (MARKETING_SOURCE_BLOCKLIST.test(context)) return false

  if (TRUSTED_SOURCES.includes(source)) return true
  if (isOfficialMaritimeSource(context) || isTierOneNewsSource(context) || isMaritimeTradeSource(context)) return true

  return source.startsWith(GOOGLE_NEWS_SOURCE_PREFIX) &&
    (isTierOneNewsSource(context) || isMaritimeTradeSource(context) || isOfficialMaritimeSource(context))
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function absoluteUrl(request: Request, path: string) {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}${path}`
}

function shouldReturnRss(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get('format')
  const accept = request.headers.get('accept') || ''

  return format === 'rss' || accept.includes('application/rss+xml')
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function buildReviewedItems(articles: any[], riskByRegion: Map<string, string>, requestVariantSeed: string) {
  return articles
    .filter((article: any) => isTrustedMarketingSource(article))
    .map((article: any) => {
      const item = {
        id: article.id,
        title: article.title,
        summary: article.snippet || article.summary || '',
        source: article.source,
        sourceUrl: article.url || article.sourceUrl || null,
        region: article.region || 'global',
        topic: article.topic || article.category || 'global',
        riskLevel: riskByRegion.get(article.region) || 'medium',
        timestamp: article.published_at || article.timestamp || article.created_at || STABLE_FALLBACK_TIMESTAMP,
      }
      const agentApproval = getMarketingApproval(item)

      return {
        ...item,
        postText: buildMarketingPost(item, { variantSeed: `${requestVariantSeed}:${item.id}` }),
        variantSeed: `${requestVariantSeed}:${item.id}`,
        liveMapUrl: 'https://www.vesselsurge.com/map-dashboard',
        approval: agentApproval,
      }
    })
    .sort((a: any, b: any) => {
      if (a.approval.approved !== b.approval.approved) return a.approval.approved ? -1 : 1
      if (a.approval.score !== b.approval.score) return b.approval.score - a.approval.score
      const timestampDiff = Date.parse(b.timestamp) - Date.parse(a.timestamp)
      if (timestampDiff !== 0) return timestampDiff
      const sourceDiff = `${a.source}`.localeCompare(`${b.source}`)
      if (sourceDiff !== 0) return sourceDiff
      const titleDiff = `${a.title}`.localeCompare(`${b.title}`)
      if (titleDiff !== 0) return titleDiff
      return `${a.id}`.localeCompare(`${b.id}`)
    })
}

function selectFeedItems(reviewedItems: any[], approval: string, outputLimit: number) {
  return (approval === 'all' ? reviewedItems : reviewedItems.filter((item: any) => item.approval.approved)).slice(
    0,
    outputLimit,
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const region = url.searchParams.get('region')
  const approval = url.searchParams.get('approval') || 'approved'
  const outputLimit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
  const requestVariantSeed = url.searchParams.get('variant') || DEFAULT_VARIANT_SEED
  const settledBefore = new Date(Date.now() - FEED_SETTLE_MS).toISOString()

  try {
    const supabase = await createClient()

    const { data: hotspotsData, error: hotspotsError } = await withTimeout(
      supabase
        .from('hotspot_stats')
        .select('hotspot, risk_level'),
      HOTSPOT_QUERY_TIMEOUT_MS,
      'x-feed hotspot query',
    )

    if (hotspotsError) {
      console.warn('[x-feed] Hotspot fetch fallback:', hotspotsError)
    }

    const riskByRegion = new Map(
      (hotspotsData || []).map((hotspot: any) => [hotspot.hotspot, hotspot.risk_level || 'medium']),
    )

    let query = supabase
      .from('news_articles')
      .select('id, title, snippet, url, source, topic, region, published_at, created_at')
      .eq('is_active', true)
      .neq('region', 'global')
      .lte('published_at', settledBefore)
      .order('published_at', { ascending: false })
      .order('source', { ascending: true })
      .order('title', { ascending: true })
      .order('id', { ascending: true })
      .limit(100)

    if (region && region !== 'all') {
      query = query.eq('region', region)
    }

    const { data, error } = await withTimeout(query, ARTICLE_QUERY_TIMEOUT_MS, 'x-feed article query')

    if (error) {
      throw new Error(error.message)
    }

    const reviewedItems = buildReviewedItems(data || [], riskByRegion, requestVariantSeed)
    const items = selectFeedItems(reviewedItems, approval, outputLimit)

    if (shouldReturnRss(request)) {
      const feedUrl = absoluteUrl(request, '/api/social/x-feed?format=rss')
      const lastBuildDate = items[0]?.timestamp ? new Date(items[0].timestamp).toUTCString() : new Date(STABLE_FALLBACK_TIMESTAMP).toUTCString()
      const rssItems = items
        .map((item) => {
          const guid = item.sourceUrl || `${feedUrl}#${item.id}`
          return `
    <item>
      <title>${escapeXml(item.region)}: ${escapeXml(item.title)}</title>
      <description>${escapeXml(item.postText)}</description>
      <link>${escapeXml(item.liveMapUrl)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${new Date(item.timestamp).toUTCString()}</pubDate>
      <source>${escapeXml(item.source)}</source>
    </item>`
        })
        .join('')

      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>VesselSurge Agent-Approved X Post Feed</title>
    <link>https://www.vesselsurge.com/map-dashboard</link>
    <description>Agent-approved maritime intelligence posts prepared for X automation.</description>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>${rssItems}
  </channel>
</rss>`

      return new Response(rss, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          ...FEED_CACHE_HEADERS,
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        items,
        count: items.length,
        review: {
          mode: approval,
          approved: reviewedItems.filter((item: any) => item.approval.approved).length,
          rejected: reviewedItems.filter((item: any) => !item.approval.approved).length,
          approvedBy: 'VesselSurge marketing approval agent',
        },
        usage: {
          zapierMakeN8nRss: absoluteUrl(request, '/api/social/x-feed?format=rss'),
          reviewAllJson: absoluteUrl(request, '/api/social/x-feed?approval=all'),
          json: absoluteUrl(request, '/api/social/x-feed'),
        },
      },
      {
        headers: {
          ...FEED_CACHE_HEADERS,
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch (err: any) {
    if (!isExpectedFallbackReason(err)) console.warn('[x-feed] Serving offline fallback:', err?.message || err)
    const fallback = buildOfflineMaritimeDashboardSnapshot('x-feed database unavailable; serving bundled source-reviewed marketing queue')
    const riskByRegion = new Map(fallback.data.hotspots.map((hotspot: any) => [hotspot.hotspot, hotspot.riskLevel || 'medium']))
    const reviewedItems = buildReviewedItems(
      region && region !== 'all'
        ? fallback.data.articles.filter((article: any) => article.region === region)
        : fallback.data.articles,
      riskByRegion,
      requestVariantSeed,
    )
    const items = selectFeedItems(reviewedItems, approval, outputLimit)

    return NextResponse.json(
      {
        success: true,
        fallback: true,
        fallbackReason: err?.message || 'x-feed database unavailable',
        items,
        count: items.length,
        review: {
          mode: approval,
          approved: reviewedItems.filter((item: any) => item.approval.approved).length,
          rejected: reviewedItems.filter((item: any) => !item.approval.approved).length,
          approvedBy: 'VesselSurge marketing approval agent',
        },
        usage: {
          zapierMakeN8nRss: absoluteUrl(request, '/api/social/x-feed?format=rss'),
          reviewAllJson: absoluteUrl(request, '/api/social/x-feed?approval=all'),
          json: absoluteUrl(request, '/api/social/x-feed'),
        },
      },
      {
        headers: {
          ...FEED_CACHE_HEADERS,
          'X-Content-Type-Options': 'nosniff',
          'X-VesselSurge-Fallback': 'offline-social-feed',
        },
      },
    )
  }
}
