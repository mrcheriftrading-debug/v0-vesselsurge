import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Live Maritime Map — Real-Time Vessel Tracking at Strait of Hormuz, Red Sea & Suez',
  description:
    'Free live maritime map for critical shipping chokepoints. Monitor Strait of Hormuz, Bab el-Mandeb, Suez Canal and Malacca Strait with vessel context, risk labels and source-reviewed security reports.',
  keywords: [
    'strait of hormuz live map',
    'hormuz strait vessel tracking',
    'red sea ship tracker',
    'suez canal live traffic',
    'bab el-mandeb tracking',
    'malacca strait vessels',
    'live vessel map',
    'real-time ship tracking',
    'maritime chokepoint monitor',
    'free vessel tracker',
  ],
  alternates: {
    canonical: `${BASE_URL}/map-dashboard`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/map-dashboard`,
    title: 'VesselSurge Live Map — Track Vessels at Hormuz, Red Sea & Suez in Real-Time',
    description:
      'Free live satellite map of global shipping chokepoints. Track vessel context at Strait of Hormuz, Bab el-Mandeb, Suez Canal and Malacca with risk labels and source-reviewed reports.',
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'VesselSurge Live Maritime Map — Real-time vessel tracking at Strait of Hormuz and global chokepoints',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Vessel Tracking: Hormuz, Red Sea, Suez | VesselSurge',
    description:
      'Free live maritime map for Hormuz, Red Sea, Suez Canal and Malacca. Risk labels, vessel context and source-reviewed reports.',
    images: [`${BASE_URL}/og-image.jpg`],
  },
  other: {
    'revisit-after': '1 hour',
    'last-modified': new Date().toUTCString(),
  },
}

// Map-specific structured data for live tracking
const schemaMapPage = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${BASE_URL}/map-dashboard#webpage`,
  name: 'VesselSurge Live Maritime Map',
  description: 'Live maritime map context for Strait of Hormuz, Bab el-Mandeb, Suez Canal, and Malacca Strait with risk assessments and source-reviewed reports.',
  url: `${BASE_URL}/map-dashboard`,
  isPartOf: {
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'VesselSurge',
  },
  about: [
    {
      '@type': 'Place',
      name: 'Strait of Hormuz',
      description: 'Critical maritime chokepoint between the Persian Gulf and Gulf of Oman.',
      geo: { '@type': 'GeoCoordinates', latitude: 26.5, longitude: 56.3 },
    },
    {
      '@type': 'Place',
      name: 'Bab el-Mandeb',
      description: 'Strait connecting Red Sea to Gulf of Aden. Gateway to Suez Canal route.',
      geo: { '@type': 'GeoCoordinates', latitude: 12.6, longitude: 43.3 },
    },
    {
      '@type': 'Place',
      name: 'Suez Canal',
      description: 'Egyptian canal connecting the Mediterranean Sea to the Red Sea.',
      geo: { '@type': 'GeoCoordinates', latitude: 30.5, longitude: 32.3 },
    },
    {
      '@type': 'Place',
      name: 'Strait of Malacca',
      description: 'Strait between Malaysia and Indonesia. Asia\'s busiest shipping lane.',
      geo: { '@type': 'GeoCoordinates', latitude: 2.5, longitude: 101.0 },
    },
  ],
  mainEntity: {
    '@type': 'Map',
    name: 'Live Maritime Chokepoint Map',
    description: 'Interactive maritime map showing chokepoint vessel context, risk labels and source-reviewed route reports',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Live Maritime Map', item: `${BASE_URL}/map-dashboard` },
    ],
  },
}

export default function MapDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMapPage) }}
      />
      {children}
    </>
  )
}
