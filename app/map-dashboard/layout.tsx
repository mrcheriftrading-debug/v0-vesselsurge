import type { Metadata } from 'next'

const BASE_URL = 'https://www.vesselsurge.com'

export const metadata: Metadata = {
  title: 'Live Maritime Map — Real-Time Vessel Tracking & Chokepoint Intelligence',
  description:
    'Watch live vessel traffic at the world\'s most critical shipping chokepoints — Strait of Hormuz, Bab el-Mandeb, Suez Canal & Malacca Strait. Real-time risk levels, active vessel counts, and maritime security news.',
  alternates: {
    canonical: `${BASE_URL}/map-dashboard`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/map-dashboard`,
    title: 'VesselSurge Live Map — Hormuz, Red Sea & Suez Canal Tracker',
    description:
      'Live satellite map of global maritime chokepoints. Track vessel traffic, risk alerts, and shipping intelligence in real-time. Free & updated hourly.',
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'VesselSurge Live Maritime Map — Real-time shipping chokepoint tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VesselSurge Live Map — Hormuz CRITICAL | Red Sea CRITICAL',
    description:
      'Monitor real-time vessel traffic at Hormuz, Bab el-Mandeb, Suez & Malacca. Live risk levels, ship counts, security alerts. Free.',
    images: [`${BASE_URL}/og-image.jpg`],
  },
  other: {
    'revisit-after': '1 hour',
    'last-modified': new Date().toUTCString(),
  },
}

export default function MapDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
