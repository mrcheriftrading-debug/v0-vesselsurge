import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'VesselSurge – Real-time Vessel Tracking & Maritime Data',
    template: '%s | VesselSurge'
  },
  description: 'Follow real-time ship movements, maritime data, and vessel tracking with VesselSurge. The premier B2B ecosystem where vessel owners, technical innovators, and global logistics leaders unite.',
  generator: 'v0.app',
  applicationName: 'VesselSurge',
  keywords: ['vessel tracking', 'maritime data', 'ship movements', 'real-time tracking', 'B2B maritime', 'logistics', 'shipping', 'vessel owners', 'cargo shipping'],
  authors: [{ name: 'VesselSurge' }],
  creator: 'VesselSurge',
  publisher: 'VesselSurge',
  metadataBase: new URL('https://vesselsurge.com'),
  alternates: {
    canonical: '/',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://vesselsurge.com/',
    siteName: 'VesselSurge',
    title: 'VesselSurge – Real-time Vessel Tracking & Maritime Data',
    description: 'Track vessels in real-time and access maritime data with VesselSurge. The premier B2B ecosystem for maritime professionals.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'VesselSurge - Real-time Vessel Tracking Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vesselsurge',
    creator: '@vesselsurge',
    title: 'VesselSurge – Real-time Vessel Tracking',
    description: 'Track vessels in real-time and access maritime data with VesselSurge.',
    images: ['/logo.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Performance: Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for analytics */}
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg">
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
