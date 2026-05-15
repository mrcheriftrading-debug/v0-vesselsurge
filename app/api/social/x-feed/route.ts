import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildMarketingPost } from '@/scripts/lib/x-marketing-post.mjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const TRUSTED_SOURCES = [
  'USNI News',
  'gCaptain',
  'Hellenic Shipping News',
  'ReCAAP ISC Alerts',
  'ReCAAP ISC Reports',
  'Norwegian Maritime Authority',
  'MARAD Maritime Security Advisory',
  'Suez Canal Authority',
]

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
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)

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
      .in('source', TRUSTED_SOURCES)
      .neq('region', 'global')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (region && region !== 'all') {
      query = query.eq('region', region)
    }

    const { data, error } = await query

    if (error) {
      console.error('[x-feed] Article fetch error:', error)
      return NextResponse.json({ success: false, error: error.message, items: [] }, { status: 500 })
    }

    const items = (data || []).map((article: any) => {
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

      return {
        ...item,
        postText: buildMarketingPost(item),
        liveMapUrl: 'https://www.vesselsurge.com/map-dashboard',
      }
    })

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
    <title>VesselSurge X Post Feed</title>
    <link>https://www.vesselsurge.com/map-dashboard</link>
    <description>Verified maritime intelligence posts prepared for X automation.</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${rssItems}
  </channel>
</rss>`

      return new Response(rss, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        items,
        count: items.length,
        usage: {
          zapierMakeN8nRss: absoluteUrl(request, '/api/social/x-feed?format=rss'),
          json: absoluteUrl(request, '/api/social/x-feed'),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch (err: any) {
    console.error('[x-feed] Unexpected error:', err)
    return NextResponse.json({ success: false, error: err.message, items: [] }, { status: 500 })
  }
}
