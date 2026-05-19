import { NextResponse } from 'next/server'
import { getMaritimeArticles } from '@/lib/maritime-data'
import { BASE_URL } from '@/lib/seo'

export const dynamic = 'force-dynamic'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function itemXml(article: Awaited<ReturnType<typeof getMaritimeArticles>>[number]) {
  const link = article.sourceUrl || `${BASE_URL}/latest`
  const pubDate = article.timestamp ? new Date(article.timestamp).toUTCString() : new Date().toUTCString()

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

export async function GET() {
  const articles = await getMaritimeArticles(30)
  const now = new Date().toUTCString()
  const fallbackItems = [
    {
      id: 'vesselsurge-live-map',
      title: 'VesselSurge Live Maritime Map',
      summary: 'Live maritime map context for Hormuz, Bab el-Mandeb, Suez Canal and Strait of Malacca.',
      source: 'VesselSurge',
      sourceUrl: `${BASE_URL}/map-dashboard`,
      category: 'platform',
      region: 'global',
      timestamp: new Date().toISOString(),
      isBreaking: false,
    },
  ]

  const items = (articles.length ? articles : fallbackItems).map(itemXml).join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VesselSurge Maritime Intelligence Feed</title>
    <link>${BASE_URL}/latest</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Source-reviewed maritime intelligence, shipping risk reports and chokepoint signals for Hormuz, Bab el-Mandeb, Suez and Malacca.</description>
    <language>en-US</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>30</ttl>
    ${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=900, s-maxage=1800',
      'X-Robots-Tag': 'index, follow',
    },
  })
}
