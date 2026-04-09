import type { Metadata } from 'next'

const BASE_URL = 'https://www.vesselsurge.com'

export const metadata: Metadata = {
  title: 'Live Maritime Map — Real-Time Vessel Tracking at Strait of Hormuz, Red Sea & Suez',
  description:
    'Free live vessel tracking at critical shipping chokepoints. Monitor Strait of Hormuz, Bab el-Mandeb (Red Sea), Suez Canal & Malacca Strait in real-time. Hourly updates on vessel counts, risk levels, and security alerts.',
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
      'Free live satellite map of global shipping chokepoints. Track vessel traffic at Strait of Hormuz, Bab el-Mandeb, Suez Canal & Malacca. Real-time risk alerts updated hourly.',
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
      'Free real-time vessel tracking. Monitor Strait of Hormuz, Red Sea, Suez Canal & Malacca. Live risk levels, vessel counts, security alerts.',
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
  '@id': `${BASE_URL}/map-dashboard`,
  name: 'VesselSurge Live Maritime Map',
  description: 'Real-time vessel tracking at Strait of Hormuz, Bab el-Mandeb, Suez Canal, and Malacca Strait with live risk assessments.',
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
      description: 'Critical maritime chokepoint between Persian Gulf and Gulf of Oman. 20-25% of global oil transits daily.',
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
      description: 'Egyptian canal connecting Mediterranean Sea to Red Sea. 12-15% of global trade.',
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
    description: 'Interactive satellite map showing real-time vessel positions and risk levels',
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
