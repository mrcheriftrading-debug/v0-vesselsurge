import { MetadataRoute } from 'next'
import { BASE_URL, trafficTopicPages } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // Main pages
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/map-dashboard`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
      images: [`${BASE_URL}/og-image.jpg`],
    },
    {
      url: `${BASE_URL}/latest`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.92,
      images: [`${BASE_URL}/og-image.jpg`],
    },
    {
      url: `${BASE_URL}/pro-market`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.88,
      images: [`${BASE_URL}/og-image.jpg`],
    },
    {
      url: `${BASE_URL}/network`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    // Chokepoint landing pages
    {
      url: `${BASE_URL}/regions/hormuz`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/regions/bab`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/regions/suez`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/regions/malacca`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...trafficTopicPages.map((topic) => ({
      url: `${BASE_URL}/topics/${topic.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: topic.slug.includes('hormuz') || topic.slug.includes('red-sea') ? 0.82 : 0.75,
      images: [`${BASE_URL}/og-image.jpg`],
    })),
    // LLMs.txt for AI assistants
    {
      url: `${BASE_URL}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/llms-full.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/feed.xml`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.55,
    },
    {
      url: `${BASE_URL}/entity-map.json`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]
}
