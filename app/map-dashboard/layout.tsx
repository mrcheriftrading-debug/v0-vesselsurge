import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Live Maritime Map — Hormuz, Red Sea, Suez, Panama, Taiwan & Cape Routes',
  description:
    'Free live maritime map for critical shipping chokepoints. Monitor Hormuz, Bab el-Mandeb, Suez, Malacca, Panama Canal, Taiwan Strait, Turkish Straits, Gibraltar and Cape of Good Hope with source-reviewed risk reports.',
  keywords: [
    'strait of hormuz live map',
    'hormuz strait vessel tracking',
    'red sea ship tracker',
    'suez canal live traffic',
    'bab el-mandeb tracking',
    'malacca strait vessels',
    'panama canal shipping risk',
    'taiwan strait shipping risk',
    'turkish straits vessel traffic',
    'strait of gibraltar shipping',
    'cape of good hope rerouting',
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
    title: 'VesselSurge Live Map — Track Global Shipping Chokepoints in Real-Time',
    description:
      'Free live satellite map of global shipping chokepoints. Track Hormuz, Red Sea, Suez, Malacca, Panama Canal, Taiwan Strait, Turkish Straits, Gibraltar and Cape route context with source-reviewed reports.',
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
    title: 'Live Vessel Tracking: Global Chokepoints | VesselSurge',
    description:
      'Free live maritime map for Hormuz, Red Sea, Suez, Malacca, Panama, Taiwan Strait, Turkish Straits, Gibraltar and Cape route context.',
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
  description: 'Live maritime map context for Strait of Hormuz, Bab el-Mandeb, Suez Canal, Malacca Strait, Panama Canal, Taiwan Strait, Turkish Straits, Strait of Gibraltar and Cape of Good Hope with risk assessments and source-reviewed reports.',
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
    {
      '@type': 'Place',
      name: 'Panama Canal',
      description: 'Atlantic-Pacific canal route monitored for queue pressure, water constraints and transit context.',
      geo: { '@type': 'GeoCoordinates', latitude: 9.08, longitude: -79.68 },
    },
    {
      '@type': 'Place',
      name: 'Taiwan Strait',
      description: 'Asia trade-lane corridor monitored for maritime alerts, port context and cargo continuity.',
      geo: { '@type': 'GeoCoordinates', latitude: 24.4, longitude: 120.8 },
    },
    {
      '@type': 'Place',
      name: 'Turkish Straits',
      description: 'Bosporus and Dardanelles route monitored for Black Sea tanker, transit and weather constraints.',
      geo: { '@type': 'GeoCoordinates', latitude: 41.08, longitude: 29.05 },
    },
    {
      '@type': 'Place',
      name: 'Strait of Gibraltar',
      description: 'Atlantic-Mediterranean entry route monitored for vessel flow, congestion and port context.',
      geo: { '@type': 'GeoCoordinates', latitude: 35.96, longitude: -5.6 },
    },
    {
      '@type': 'Place',
      name: 'Cape of Good Hope',
      description: 'Red Sea bypass and Cape route monitored for rerouting pressure, voyage time and freight cost signals.',
      geo: { '@type': 'GeoCoordinates', latitude: -34.36, longitude: 18.47 },
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
      <link
        rel="preload"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        as="style"
        crossOrigin=""
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMapPage) }}
      />
      {children}
    </>
  )
}
