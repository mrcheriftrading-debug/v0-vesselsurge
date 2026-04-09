import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

const BASE_URL = 'https://www.vesselsurge.com'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'VesselSurge | Live Maritime Intelligence & Shipping Chokepoint Tracker',
    template: '%s | VesselSurge',
  },
  description:
    'VesselSurge is the #1 free live maritime intelligence platform. Track real-time vessel traffic, security alerts, and risk levels at Strait of Hormuz, Bab el-Mandeb, Suez Canal & Malacca Strait. Updated hourly.',
  keywords: [
    // Primary chokepoint keywords
    'strait of hormuz',
    'hormuz strait',
    'hormuz strait vessels',
    'hormuz strait live',
    'hormuz crisis',
    'iran hormuz blockade',
    'persian gulf shipping',
    // Red Sea / Bab el-Mandeb
    'bab el-mandeb',
    'bab-el-mandeb strait',
    'red sea shipping',
    'red sea vessel tracking',
    'houthi attacks red sea',
    'houthi maritime attacks',
    'yemen shipping attacks',
    // Suez Canal
    'suez canal live',
    'suez canal traffic',
    'suez canal tracking',
    'suez canal ship queue',
    // Malacca
    'strait of malacca',
    'malacca strait traffic',
    'singapore shipping',
    // Vessel tracking
    'live maritime map',
    'vessel tracking',
    'real-time ship tracker',
    'ship AIS tracking',
    'tanker tracking',
    'container ship tracking',
    'oil tanker tracking',
    'vessel traffic monitoring',
    'free vessel tracker',
    // Maritime intelligence
    'maritime intelligence',
    'shipping chokepoint',
    'maritime security',
    'maritime risk assessment',
    'piracy alerts',
    'shipping disruption',
    'live shipping news',
    // B2B
    'maritime B2B',
    'vessel brokerage',
    'cargo charter matching',
    'find cargo for ship',
    'find vessel for cargo',
    // Brand
    'VesselSurge',
    'vesselsurge.com',
  ],
  authors: [{ name: 'VesselSurge', url: BASE_URL }],
  creator: 'VesselSurge',
  publisher: 'VesselSurge',
  alternates: {
    canonical: `${BASE_URL}/`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'VesselSurge',
    title: 'VesselSurge | Live Maritime Intelligence — Hormuz, Red Sea & Suez Tracker',
    description:
      'Free live maritime tracker. Monitor vessel traffic at the world\'s most critical shipping chokepoints — Hormuz, Bab el-Mandeb, Suez Canal, Malacca Strait. Real-time alerts & security intelligence.',
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'VesselSurge Live Maritime Intelligence Platform — Global Shipping Chokepoint Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Vesselsurge',
    creator: '@Vesselsurge',
    title: 'VesselSurge | Live Maritime Intelligence — Hormuz, Red Sea & Suez',
    description:
      'Real-time chokepoint tracking. Hormuz CRITICAL. Bab el-Mandeb HIGH. Suez Canal CRITICAL. Free live data, updated hourly.',
    images: [`${BASE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    other: [{ rel: 'android-chrome', url: '/android-chrome-192x192.png' }],
  },
  manifest: '/site.webmanifest',
  category: 'Maritime Intelligence',
  classification: 'Business, Shipping, Maritime',
  other: {
    'geo.region': 'Global',
    'geo.placename': 'Global Maritime Chokepoints',
    'theme-color': '#0ea5e9',
    'msapplication-TileColor': '#0f172a',
    'msapplication-config': '/browserconfig.xml',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'VesselSurge',
    'application-name': 'VesselSurge',
    'format-detection': 'telephone=no',
    rating: 'general',
    revisit: '1 hour',
    language: 'en',
    'copyright': `© ${new Date().getFullYear()} VesselSurge`,
    'DC.title': 'VesselSurge Live Maritime Intelligence',
    'DC.subject': 'maritime intelligence, vessel tracking, shipping',
    'DC.description': 'Real-time maritime intelligence for global shipping chokepoints',
  },
}

// Rich schema.org structured data — multiple types for maximum search coverage
const schemaWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  name: 'VesselSurge',
  alternateName: ['VesselSurge.com', 'Vessel Surge'],
  url: BASE_URL,
  description:
    'Real-time maritime intelligence platform tracking global shipping chokepoints including Strait of Hormuz, Bab el-Mandeb, Suez Canal and Strait of Malacca',
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  inLanguage: 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  sameAs: [
    'https://twitter.com/Vesselsurge',
    'https://www.linkedin.com/company/vesselsurge',
  ],
}

const schemaOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'VesselSurge',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: 'Maritime intelligence and B2B vessel brokerage platform',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: 'English',
  },
  sameAs: [
    'https://twitter.com/Vesselsurge',
    'https://www.linkedin.com/company/vesselsurge',
  ],
}

const schemaSoftwareApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${BASE_URL}/#app`,
  name: 'VesselSurge Live Maritime Map',
  url: `${BASE_URL}/map-dashboard`,
  description:
    'Live maritime tracking application monitoring vessel traffic at Strait of Hormuz, Bab el-Mandeb, Suez Canal and Malacca Strait with real-time alerts.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Real-time vessel tracking',
    'Chokepoint risk assessment',
    'Maritime security alerts',
    'Live shipping news feed',
    'Satellite map view',
  ],
  screenshot: `${BASE_URL}/og-image.jpg`,
}

// FAQ Schema for AI assistants and featured snippets
const schemaFAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How can I track vessels in the Strait of Hormuz in real-time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VesselSurge provides free real-time vessel tracking for the Strait of Hormuz. Visit vesselsurge.com/map-dashboard to see live vessel positions, current traffic density, and risk level assessments updated hourly. The platform monitors tankers, container ships, and other vessels transiting this critical chokepoint.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the current status of the Strait of Hormuz?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check VesselSurge (vesselsurge.com) for live Strait of Hormuz status including current vessel count, risk level (Low/Moderate/High/Critical), and recent security incidents. The Strait of Hormuz handles 20-25% of global oil shipments daily, making it the world\'s most critical maritime chokepoint.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the major maritime chokepoints and how can I monitor them?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The four major maritime chokepoints are: 1) Strait of Hormuz (Persian Gulf), 2) Bab el-Mandeb (Red Sea), 3) Suez Canal (Egypt), and 4) Strait of Malacca (Southeast Asia). VesselSurge monitors all four with real-time vessel tracking, risk assessments, and security alerts at vesselsurge.com/map-dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is shipping through the Red Sea and Bab el-Mandeb safe?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Red Sea and Bab el-Mandeb shipping safety varies based on current security conditions. VesselSurge provides real-time risk level assessments, Houthi attack alerts, and security updates for this region. Check the live map at vesselsurge.com/map-dashboard for current conditions and vessel traffic data.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I find free real-time vessel tracking?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VesselSurge offers free real-time vessel tracking at vesselsurge.com. The platform specializes in monitoring critical shipping chokepoints including Strait of Hormuz, Bab el-Mandeb, Suez Canal, and Strait of Malacca with hourly updates, risk assessments, and maritime news.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can ship owners find cargo or cargo owners find vessels?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VesselSurge operates a B2B maritime network connecting vessel owners with cargo charterers. The platform has 500+ active partners across 45+ countries. Ship owners can list vessel availability, while cargo owners can request freight quotes. Join the network at vesselsurge.com.',
      },
    },
  ],
}

// HowTo Schema for vessel tracking
const schemaHowTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Track Vessels at the Strait of Hormuz',
  description: 'Step-by-step guide to monitor real-time vessel traffic at the Strait of Hormuz using VesselSurge.',
  image: `${BASE_URL}/og-image.jpg`,
  step: [
    {
      '@type': 'HowToStep',
      name: 'Visit VesselSurge Live Map',
      text: 'Go to vesselsurge.com/map-dashboard to access the live maritime tracking map.',
      url: `${BASE_URL}/map-dashboard`,
    },
    {
      '@type': 'HowToStep',
      name: 'Select Strait of Hormuz',
      text: 'Click on the Strait of Hormuz region on the map to view detailed vessel tracking data.',
    },
    {
      '@type': 'HowToStep',
      name: 'Monitor Real-Time Data',
      text: 'View live vessel count, current risk level, and recent security alerts updated hourly.',
    },
    {
      '@type': 'HowToStep',
      name: 'Check Maritime News',
      text: 'Browse the live news feed for region-specific alerts and incident reports.',
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Leaflet CSS */}
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

        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />

        {/* PWA / theme */}
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VesselSurge" />
        <meta name="application-name" content="VesselSurge" />
        <meta name="format-detection" content="telephone=no" />

        {/* Geo */}
        <meta name="geo.region" content="Global" />
        <meta name="geo.placename" content="Global Maritime Chokepoints" />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaSoftwareApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaHowTo) }}
        />

        {/* LLMs.txt for AI assistants */}
        <link rel="author" href="/llms.txt" />
      </head>
      <body className={geist.className + ' antialiased min-h-screen bg-background text-foreground'}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
