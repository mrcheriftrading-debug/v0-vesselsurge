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
  description: 'Real-time maritime intelligence for the 2026 Hormuz crisis. Track vessel traffic, security alerts, and chokepoint risk at Hormuz, Bab el-Mandeb, Malacca and Suez. Free live data.',
  keywords: ['maritime intelligence','strait of hormuz','hormuz crisis 2026','bab el-mandeb','suez canal','malacca','vessel tracking','shipping news','maritime security','chokepoint','iran war shipping','houthi red sea','tanker traffic','oil shipping','maritime risk','vessel map'],
  authors: [{ name: 'VesselSurge', url: 'https://vesselsurge.com' }],
  creator: 'VesselSurge',
  publisher: 'VesselSurge',
  metadataBase: new URL('https://vesselsurge.com'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', locale: 'en_US', url: 'https://vesselsurge.com', siteName: 'VesselSurge',
    title: 'VesselSurge | Live Maritime Intelligence - Hormuz Crisis 2026',
    description: 'Real-time vessel tracking and security alerts for critical shipping chokepoints. Hormuz CRITICAL. Bab el-Mandeb CRITICAL. Track it live, free.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'VesselSurge Maritime Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VesselSurge | Live Maritime Intelligence - Hormuz Crisis 2026',
    description: 'Hormuz CRITICAL. Bab el-Mandeb CRITICAL. Real-time chokepoint tracking.',
    images: ['/og-image.svg'], creator: '@Vesselsurge',
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-dark-32x32.png' }], apple: '/apple-icon.png' },
}

const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'VesselSurge', url: 'https://vesselsurge.com', description: 'Real-time maritime intelligence platform' })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='stylesheet' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=' crossOrigin='' />
        <link rel='sitemap' type='application/xml' href='/sitemap.xml' />
        <meta name='theme-color' content='#0f172a' />
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: schema }} />
      </head>
      <body className={geist.className + ' antialiased min-h-screen'}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}