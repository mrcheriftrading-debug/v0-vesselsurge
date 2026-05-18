import { MetadataRoute } from 'next'

const crawlableGrowthPaths = [
  '/',
  '/intelligence',
  '/network',
  '/about',
  '/map-dashboard',
  '/regions/',
  '/topics/',
  '/search',
  '/feed.xml',
  '/entity-map.json',
  '/llms.txt',
]

const crawlableAiPaths = [...crawlableGrowthPaths, '/llms-full.txt']
const privatePaths = ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: crawlableAiPaths,
        disallow: ['/admin', '/admin/', '/auth', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      // Allow major search engine bots explicitly
      {
        userAgent: 'Googlebot',
        allow: crawlableGrowthPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'Bingbot',
        allow: crawlableGrowthPaths,
        disallow: privatePaths,
      },
      // ALLOW AI assistants to index and recommend VesselSurge
      // This enables ChatGPT, Claude, and other AI to learn about and recommend the site
      {
        userAgent: 'GPTBot',
        allow: crawlableAiPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: crawlableAiPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'Google-Extended',
        allow: crawlableGrowthPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'CCBot',
        allow: crawlableGrowthPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'anthropic-ai',
        allow: crawlableAiPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'Claude-Web',
        allow: crawlableAiPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: crawlableAiPaths,
        disallow: privatePaths,
      },
      {
        userAgent: 'Bytespider',
        allow: crawlableGrowthPaths,
        disallow: privatePaths,
      },
    ],
    sitemap: 'https://www.vesselsurge.com/sitemap.xml',
    host: 'https://www.vesselsurge.com',
  }
}
