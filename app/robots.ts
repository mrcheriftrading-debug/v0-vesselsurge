import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/map-dashboard', '/regions/', '/dashboard'],
        disallow: ['/admin', '/admin/', '/auth', '/auth/', '/api/', '/search'],
      },
      // Allow major search engine bots explicitly
      {
        userAgent: 'Googlebot',
        allow: ['/', '/map-dashboard', '/regions/'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/map-dashboard', '/regions/'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      // Block AI scrapers from full content
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
    ],
    sitemap: 'https://www.vesselsurge.com/sitemap.xml',
    host: 'https://www.vesselsurge.com',
  }
}
