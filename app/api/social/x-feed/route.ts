import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TIER_ONE_NEWS_SOURCE_NAMES } from '@/lib/maritime-source-quality'
import { buildMarketingPost, getMarketingApproval } from '@/scripts/lib/x-marketing-post.mjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const FEED_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300'
const DEFAULT_VARIANT_SEED = 'vesselsurge-stable-social-feed-v1'

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

const TRUSTED_SOURCE_PREFIXES = ['Google News:']

function isTrustedSource(source: string) {
  return TRUSTED_SOURCES.includes(source) || TRUSTED_SOURCE_PREFIXES.some((prefix) => source.startsWith(prefix))
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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const region = url.searchParams.get('region')
  const approval = url.searchParams.get('approval') || 'approved'
  const outputLimit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
  const requestVariantSeed = url.searchParams.get('variant') || DEFAULT_VARIANT_SEED

  try {
    const supabase = await createClient()

    const { data: hotspotsData, error: hotspotsError } = await supabase
      .from('hotspot_stats')
      .select('hotspot, risk_level')

    if (hotspotsError) {
      console.error('[x-feed] Hotspot fetch error:', hotspotsError)
    }

    const riskByRegion = new Map(
      (hotspotsData || []).map((hotspot: any) => [hotspot.hotspot, hotspot.risk_level || 'medium']),
    )

    let query = supabase
      .from('news_articles')
      .select('id, title, snippet, url, source, topic, region, published_at, created_at')
      .eq('is_active', true)
      .neq('region', 'global')
      .order('published_at', { ascending: false })
      .limit(100)

    if (region && region !== 'all') {
      query = query.eq('region', region)
    }

    const { data, error } = await query

    if (error) {
      console.error('[x-feed] Article fetch error:', error)
      return NextResponse.json({ success: false, error: error.message, items: [] }, { status: 500 })
    }

    const reviewedItems = (data || []).filter((article: any) => isTrustedSource(article.source || '')).map((article: any) => {
        const item = {
          id: article.id,
          title: article.title,
          summary: article.snippet || '',
          source: article.source,
          sourceUrl: article.url || null,
          region: article.region || 'global',
          topic: article.topic || 'global',
          riskLevel: riskByRegion.get(article.region) || 'medium',
          timestamp: article.published_at || article.created_at || new Date().toISOString(),
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

    const items = (approval === 'all' ? reviewedItems : reviewedItems.filter((item: any) => item.approval.approved)).slice(
      0,
      outputLimit,
    )

    if (shouldReturnRss(request)) {
      const feedUrl = absoluteUrl(request, '/api/social/x-feed?format=rss')
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
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${rssItems}
  </channel>
</rss>`

      return new Response(rss, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': FEED_CACHE_CONTROL,
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
          'Cache-Control': FEED_CACHE_CONTROL,
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch (err: any) {
    console.error('[x-feed] Unexpected error:', err)
    return NextResponse.json({ success: false, error: err.message, items: [] }, { status: 500 })
  }
}
