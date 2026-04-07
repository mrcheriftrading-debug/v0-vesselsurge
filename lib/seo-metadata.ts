// SEO Metadata configuration with JSON-LD structured data for maritime content

export const siteMetadata = {
  title: 'VesselSurge - Maritime Intelligence & Vessel Tracking',
  description: 'Real-time maritime intelligence, vessel tracking, and shipping lane monitoring. Track critical straits including Strait of Hormuz, Suez Canal, and Malacca Strait.',
  url: 'https://vesselsurge.com',
  image: 'https://vesselsurge.com/og-image.png',
  locale: 'en_US',
}

export function generateJSONLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'VesselSurge',
    description: siteMetadata.description,
    url: siteMetadata.url,
    applicationCategory: 'MaritimeApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    potentialAction: [
      {
        '@type': 'TrackAction',
        name: 'Track Vessels',
        description: 'Monitor vessel traffic in real-time across critical maritime straits',
      },
      {
        '@type': 'SearchAction',
        name: 'Search Maritime News',
        description: 'Browse latest maritime news and security alerts',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
  }
}

export function generateBreadcrumbJSONLD(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateNewsArticleJSONLD(article: {
  title: string
  description: string
  image: string
  datePublished: string
  dateModified: string
  author: string
  articleSection: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      '@type': 'Organization',
      name: article.author,
    },
    articleSection: article.articleSection,
    inLanguage: 'en',
  }
}

export function generateOrganizationJSONLD() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VesselSurge',
    url: siteMetadata.url,
    description: siteMetadata.description,
    logo: `${siteMetadata.url}/logo.png`,
    sameAs: [
      'https://twitter.com/vesselsurge',
      'https://www.linkedin.com/company/vesselsurge',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@vesselsurge.com',
      availableLanguage: 'en',
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Maritime Shipping',
      'Vessel Tracking',
      'Security Intelligence',
      'Logistics',
      'Supply Chain',
    ],
  }
}

// Metadata helpers
export function getMetadataForRegion(region: string) {
  const regionData: Record<string, { title: string; description: string }> = {
    hormuz: {
      title: 'Strait of Hormuz - Maritime Intelligence & Vessel Tracking | VesselSurge',
      description: 'Monitor vessel traffic and security alerts in the Strait of Hormuz. Real-time tracking of tankers and container ships through this critical shipping lane.',
    },
    suez: {
      title: 'Suez Canal - Live Maritime Data & Vessel Tracking | VesselSurge',
      description: 'Track vessels transiting the Suez Canal with real-time data. Monitor convoy schedules, vessel queues, and transit times through this major maritime artery.',
    },
    malacca: {
      title: 'Strait of Malacca - Maritime Intelligence & Tracking | VesselSurge',
      description: 'Real-time vessel tracking in the Strait of Malacca. Monitor container ships, tankers, and cargo vessels transiting Asia\'s busiest shipping lane.',
    },
    bab: {
      title: 'Bab el-Mandeb - Maritime Security & Vessel Intelligence | VesselSurge',
      description: 'Track vessel traffic and security updates in Bab el-Mandeb strait. Monitor piracy alerts and vessel movements through this critical chokepoint.',
    },
  }

  return regionData[region] || {
    title: 'Maritime Intelligence & Vessel Tracking | VesselSurge',
    description: 'Real-time maritime data, vessel tracking, and shipping lane monitoring across global critical straits.',
  }
}
