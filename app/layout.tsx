import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'VesselSurge | Live Maritime Intelligence & Chokepoint Tracking',
    template: '%s | VesselSurge',
  },
  description: 'Real-time maritime intelligence for the 2026 Hormuz crisis. Track vessel traffic, security alerts, and chokepoint risk at Strait of Hormuz, Bab el-Mandeb, Malacca and Suez Canal. Free live data updated hourly.',
  keywords: ['maritime intelligence','strait of hormuz','hormuz crisis 2026','bab el-mandeb','suez canal','strait of malacca','vessel tracking','shipping news','maritime security','chokepoint tracking','iran war shipping','houthi red sea attacks','tanker traffic live','oil shipping','maritime risk','live vessel map','maritime B2B','vessel brokerage','cargo charter','freight matching','VesselSurge'],
  authors: [{ name: 'VesselSurge', url: 'https://vesselsurge.com' }],
  creator: 'VesselSurge',
  publisher: 'VesselSurge',
  metadataBase: new URL('https://www.vesselsurge.com'),
  alternates: { canonical: 'https://www.vesselsurge.com/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.vesselsurge.com',
    siteName: 'VesselSurge',
    title: 'VesselSurge | Live Maritime Intelligence - Hormuz Crisis 2026',
    description: 'Real-time vessel tracking and security alerts for the world critical shipping chokepoints. Hormuz CRITICAL 94% traffic drop. Bab el-Mandeb CRITICAL. Track it live free.',
    images: [{ url: 'https://www.vesselsurge.com/og-image.jpg', width: 1200, height: 630, alt: 'VesselSurge - Live Maritime Intelligence Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Vesselsurge',
    creator: '@Vesselsurge',
    title: 'VesselSurge | Live Maritime Intelligence - Hormuz Crisis 2026',
    description: 'Real-time chokepoint tracking. Hormuz CRITICAL. Bab el-Mandeb CRITICAL. Free live data updated hourly.',
    images: ['https://www.vesselsurge.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
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
  verification: {},
  category: 'Maritime Intelligence',
}

const schemaOrg = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'VesselSurge',
  alternateName: 'VesselSurge.com',
  url: 'https://www.vesselsurge.com',
  description: 'Real-time maritime intelligence platform tracking global shipping chokepoints including Strait of Hormuz, Bab el-Mandeb, Malacca Strait and Suez Canal',
  logo: 'https://www.vesselsurge.com/logo.png',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://www.vesselsurge.com/search?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="geo.region" content="Global" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaOrg }} />
      </head>
      <body className={geist.className + ' antialiased min-h-screen bg-background text-foreground'}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
