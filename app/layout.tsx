import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'VesselSurge | Maritime B2B Partnership Network & Vessel Brokerage',
    template: '%s | VesselSurge',
  },
  description: 'Connect with 500+ verified vessel owners, cargo companies, and maritime partners. Real-time vessel tracking, AI-powered matching, and expert brokerage services across 45+ countries.',
  keywords: ['maritime B2B', 'vessel brokerage', 'vessel owners', 'cargo charter', 'maritime intelligence', 'vessel tracking', 'freight matching', 'tanker charter', 'bulk carriers', 'container logistics'],
  authors: [{ name: 'VesselSurge', url: 'https://vesselsurge.com' }],
  creator: 'VesselSurge',
  publisher: 'VesselSurge',
  generator: 'v0.app',
  metadataBase: new URL('https://vesselsurge.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vesselsurge.com',
    siteName: 'VesselSurge',
    title: 'VesselSurge | Maritime B2B Partnership Network',
    description: 'The premier B2B ecosystem connecting vessel owners with cargo companies. Real-time maritime intelligence, AI-powered partner matching, and expert brokerage services.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VesselSurge - Maritime B2B Partnership Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VesselSurge | Maritime B2B Partnership Network',
    description: 'Connect with 500+ verified maritime partners. Real-time vessel tracking and AI-powered matching.',
    images: ['/og-image.png'],
    creator: '@vesselsurge',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
