import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthRecoveryRedirect } from '@/components/auth-recovery-redirect'
import { BASE_URL, publicFeaturePages } from '@/lib/seo'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

const authRecoveryRedirectScript = `
(() => {
  try {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(search.replace(/^\\?/, ''));
    const isRecovery =
      hashParams.get('type') === 'recovery' ||
      queryParams.get('type') === 'recovery';
    const hasHashSession = hashParams.get('access_token') && hashParams.get('refresh_token');
    const hasCode = queryParams.get('code');

    if (isRecovery && (hasHashSession || hasCode) && window.location.pathname !== '/auth/reset-password') {
      window.location.replace('/auth/reset-password' + search + hash);
    }
  } catch {}
})();
`

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'VesselSurge | Live Maritime Intelligence & Shipping Chokepoint Tracker',
    template: '%s | VesselSurge',
  },
  description:
    'VesselSurge is a free live maritime intelligence platform for vessel context, source-reviewed reports, and risk labels at Strait of Hormuz, Bab el-Mandeb, Suez Canal & Malacca Strait.',
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
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
      'application/json': `${BASE_URL}/entity-map.json`,
      'text/plain': `${BASE_URL}/llms.txt`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'VesselSurge',
    title: 'VesselSurge | Live Maritime Intelligence — Hormuz, Red Sea & Suez Tracker',
    description:
      'Free live maritime intelligence for critical shipping chokepoints — Hormuz, Bab el-Mandeb, Suez Canal, and Malacca Strait. Source-reviewed reports, risk labels, and vessel context.',
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
      'Live maritime intelligence for critical chokepoints, vessel traffic, shipping risk and source-reviewed route signals.',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0ea5e9',
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
    url: `${BASE_URL}/logo-full.jpg`,
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
  logo: `${BASE_URL}/logo-full.jpg`,
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
    'Live maritime intelligence application monitoring vessel context at Strait of Hormuz, Bab el-Mandeb, Suez Canal and Malacca Strait with source-reviewed alerts.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Live maritime map',
    'Chokepoint risk assessment',
    'Maritime security alerts',
    'Source-reviewed shipping news feed',
    'Regional intelligence pages',
    'Cargo and vessel network onboarding',
  ],
  screenshot: `${BASE_URL}/og-image.jpg`,
}

const schemaItemList = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': `${BASE_URL}/#features`,
  name: 'VesselSurge maritime intelligence features',
  itemListElement: publicFeaturePages.map((feature, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'WebPage',
      name: feature.name,
      url: feature.url,
      description: feature.description,
      keywords: feature.keywords.join(', '),
    },
  })),
}

const schemaDataset = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  '@id': `${BASE_URL}/#maritime-intelligence-dataset`,
  name: 'VesselSurge Maritime Chokepoint Intelligence',
  description:
    'A live maritime intelligence dataset organizing vessel context, source-reviewed reports, risk labels and route signals for critical chokepoints including Strait of Hormuz, Bab el-Mandeb, Suez Canal and Strait of Malacca.',
  url: `${BASE_URL}/map-dashboard`,
  creator: { '@id': `${BASE_URL}/#organization` },
  publisher: { '@id': `${BASE_URL}/#organization` },
  license: `${BASE_URL}/about`,
  spatialCoverage: [
    { '@type': 'Place', name: 'Strait of Hormuz' },
    { '@type': 'Place', name: 'Bab el-Mandeb' },
    { '@type': 'Place', name: 'Suez Canal' },
    { '@type': 'Place', name: 'Strait of Malacca' },
  ],
  keywords: [
    'maritime intelligence',
    'vessel tracking',
    'shipping chokepoints',
    'Strait of Hormuz',
    'Bab el-Mandeb',
    'Suez Canal',
    'Strait of Malacca',
  ],
  isAccessibleForFree: true,
}

// FAQ Schema for AI assistants and featured snippets
const schemaFAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How can I track vessels in the Strait of Hormuz?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VesselSurge provides a free live maritime map for the Strait of Hormuz. Visit vesselsurge.com/map-dashboard to review vessel context, traffic indicators, source-reviewed reports and current risk labels for this critical chokepoint.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the current status of the Strait of Hormuz?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check VesselSurge (vesselsurge.com) for live Strait of Hormuz context including source-reviewed reports, risk level, vessel indicators when verified AIS data is available, and recent maritime security signals.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the major maritime chokepoints and how can I monitor them?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The four major maritime chokepoints tracked by VesselSurge are: 1) Strait of Hormuz (Persian Gulf), 2) Bab el-Mandeb (Red Sea), 3) Suez Canal (Egypt), and 4) Strait of Malacca (Southeast Asia). VesselSurge monitors them with live map context, risk labels, vessel indicators, and source-reviewed alerts at vesselsurge.com/map-dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is shipping through the Red Sea and Bab el-Mandeb safe?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Red Sea and Bab el-Mandeb shipping safety varies based on current security conditions. VesselSurge provides risk labels, Houthi-related maritime reports, source-reviewed security updates, and vessel context when verified data is available. Check vesselsurge.com/map-dashboard for the latest view.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I find free maritime vessel context?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VesselSurge offers free live maritime tracking at vesselsurge.com. The platform specializes in critical shipping chokepoints including Strait of Hormuz, Bab el-Mandeb, Suez Canal and Strait of Malacca with map context, risk assessments and source-reviewed maritime news.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can ship owners find cargo or cargo owners find vessels?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VesselSurge offers a B2B maritime network intake for vessel owners and cargo teams. Ship owners can submit vessel availability, while cargo owners can request capacity and route-matched introductions through vesselsurge.com/network.',
      },
    },
  ],
}

// HowTo Schema for vessel tracking
const schemaHowTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Track Vessels at the Strait of Hormuz',
  description: 'Step-by-step guide to monitor vessel context and source-reviewed maritime reports at the Strait of Hormuz using VesselSurge.',
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
      text: 'Review vessel context, current risk level, traffic indicators and recent source-reviewed maritime reports.',
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaDataset) }}
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
        <script dangerouslySetInnerHTML={{ __html: authRecoveryRedirectScript }} />
      </head>
      <body className={geist.className + ' antialiased min-h-screen bg-background text-foreground'}>
        <AuthRecoveryRedirect />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
