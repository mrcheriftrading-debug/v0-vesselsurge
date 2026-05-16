import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/dashboard', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin', '/admin/', '/auth', '/auth/', '/api/'],
      },
      // Allow major search engine bots explicitly
      {
        userAgent: 'Googlebot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      // ALLOW AI assistants to index and recommend VesselSurge
      // This enables ChatGPT, Claude, and other AI to learn about and recommend the site
      {
        userAgent: 'GPTBot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'CCBot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
      {
        userAgent: 'Bytespider',
        allow: ['/', '/intelligence', '/network', '/about', '/map-dashboard', '/regions/', '/llms.txt'],
        disallow: ['/admin/', '/auth/', '/api/'],
      },
    ],
    sitemap: 'https://www.vesselsurge.com/sitemap.xml',
    host: 'https://www.vesselsurge.com',
  }
}
