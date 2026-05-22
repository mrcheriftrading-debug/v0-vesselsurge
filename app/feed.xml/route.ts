import { NextResponse } from 'next/server'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache, type MaritimeDashboardResponse } from '@/lib/maritime-dashboard-cache'
import { buildOfflineMaritimeDashboardSnapshot } from '@/lib/maritime-offline-snapshot'
import { BASE_URL } from '@/lib/seo'
import { createAdminClient } from '@/lib/supabase/admin'
import { publicVercelCacheHeaders } from '@/lib/vercel-cache'

export const dynamic = 'force-dynamic'
export const revalidate = 300

const FALLBACK_FEED_TIMESTAMP = '2026-05-20T00:00:00.000Z'
type FeedArticle = MaritimeDashboardResponse['data']['articles'][number]

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function itemXml(article: FeedArticle) {
  const link = article.sourceUrl || `${BASE_URL}/latest`
  const pubDate = new Date(article.timestamp || FALLBACK_FEED_TIMESTAMP).toUTCString()

  return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(article.id || link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <source url="${escapeXml(BASE_URL)}">VesselSurge</source>
      <category>${escapeXml(article.region || 'global')}</category>
      <description>${escapeXml(article.summary || 'Source-reviewed maritime intelligence from VesselSurge.')}</description>
    </item>`
}

async function loadFeedArticles() {
  try {
    const admin = createAdminClient()
    const cached = await getFreshMaritimeDashboardCache(admin)
      .catch(() => getLastMaritimeDashboardCache(admin, 'rss feed cache unavailable; serving last known source-reviewed maritime news'))
      .catch(() => null)

    return cached || buildOfflineMaritimeDashboardSnapshot('rss feed cache unavailable; serving bundled maritime route context')
  } catch {
    return buildOfflineMaritimeDashboardSnapshot('rss feed cache unavailable; serving bundled maritime route context')
  }
}

export async function GET() {
  const dashboard = await loadFeedArticles()
  const articles = dashboard.data.articles
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 30)
  const fallbackItems = [
    {
      id: 'vesselsurge-live-map',
      title: 'VesselSurge Live Maritime Map',
      summary: 'Live maritime map context for Hormuz, Bab el-Mandeb, Suez Canal and Strait of Malacca.',
      source: 'VesselSurge',
      sourceUrl: `${BASE_URL}/map-dashboard`,
      category: 'platform',
      region: 'global',
      timestamp: FALLBACK_FEED_TIMESTAMP,
      isBreaking: false,
    },
  ]

  const items = (articles.length ? articles : fallbackItems).map(itemXml).join('')
  const lastBuildDate = new Date(articles[0]?.timestamp || FALLBACK_FEED_TIMESTAMP).toUTCString()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VesselSurge Maritime Intelligence Feed</title>
    <link>${BASE_URL}/latest</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Source-reviewed maritime intelligence, shipping risk reports and chokepoint signals for Hormuz, Bab el-Mandeb, Suez and Malacca.</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>30</ttl>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      ...publicVercelCacheHeaders('public, max-age=300, s-maxage=900, stale-while-revalidate=1800', ['rss-feed', 'live-news']),
      'X-Robots-Tag': 'index, follow',
    },
  })
}
