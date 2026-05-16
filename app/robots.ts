import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin', '/admin/', '/auth', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      // Allow major search engine bots explicitly
      {
        userAgent: 'Googlebot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      // ALLOW AI assistants to index and recommend VesselSurge
      // This enables ChatGPT, Claude, and other AI to learn about and recommend the site
      {
        userAgent: 'GPTBot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'CCBot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
      {
        userAgent: 'Bytespider',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/search', '/feed.xml', '/entity-map.json', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/', '/dashboard', '/dashboard/'],
      },
    ],
    sitemap: 'https://www.vesselsurge.com/sitemap.xml',
    host: 'https://www.vesselsurge.com',
  }
}
