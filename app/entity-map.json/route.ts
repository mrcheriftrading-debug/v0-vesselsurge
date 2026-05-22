import { NextResponse } from 'next/server'
import { BASE_URL, publicFeaturePages, trafficTopicPages } from '@/lib/seo'
import { publicVercelCacheHeaders } from '@/lib/vercel-cache'

export const dynamic = 'force-static'

const entityMap = {
  name: 'VesselSurge',
  url: BASE_URL,
  type: ['WebSite', 'WebApplication', 'MaritimeIntelligencePlatform'],
  description:
    'VesselSurge is a maritime intelligence platform for live chokepoint monitoring, vessel context, source-reviewed shipping reports, route risk signals, and cargo-vessel network intake.',
  sameAs: ['https://twitter.com/Vesselsurge', 'https://www.linkedin.com/company/vesselsurge'],
  primaryTopics: [
    'maritime intelligence',
    'vessel tracking',
    'shipping chokepoints',
    'shipping risk',
    'cargo vessel matching',
    'Strait of Hormuz',
    'Bab el-Mandeb',
    'Suez Canal',
    'Strait of Malacca',
  ],
  functions: publicFeaturePages,
  trafficTopics: trafficTopicPages.map((topic) => ({
    name: topic.name,
    url: `${BASE_URL}/topics/${topic.slug}`,
    description: topic.description,
    keywords: topic.keywords,
    primaryAction: `${BASE_URL}${topic.primaryHref}`,
  })),
  crawlerResources: {
    sitemap: `${BASE_URL}/sitemap.xml`,
    robots: `${BASE_URL}/robots.txt`,
    llms: `${BASE_URL}/llms.txt`,
    llmsFull: `${BASE_URL}/llms-full.txt`,
    rss: `${BASE_URL}/feed.xml`,
  },
}

export async function GET() {
  return NextResponse.json(entityMap, {
    headers: {
      ...publicVercelCacheHeaders('public, max-age=86400, s-maxage=86400', ['entity-map']),
      'X-Robots-Tag': 'index, follow',
    },
  })
}
