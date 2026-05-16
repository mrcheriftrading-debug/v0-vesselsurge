import SearchInterface from "@/components/search-interface"
import Link from "next/link"
import { Zap, ArrowLeft } from "lucide-react"

import type { Metadata } from 'next'
import { BASE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Maritime News Search - Real-Time Shipping Intelligence",
  description: "Search maritime news, vessel tracking updates, source-reviewed shipping reports and security alerts for Strait of Hormuz, Red Sea, Suez Canal, Malacca and global chokepoints.",
  keywords: [
    "maritime news search",
    "shipping intelligence search",
    "vessel tracking news",
    "Strait of Hormuz search",
    "Red Sea shipping alerts",
    "Suez Canal news",
    "Malacca Strait alerts",
  ],
  alternates: {
    canonical: `${BASE_URL}/search`,
  },
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/search`,
    title: 'Maritime Intelligence Search | VesselSurge',
    description: 'Search real-time maritime news and shipping intelligence. Get updates on Hormuz, Red Sea, Suez Canal security and vessel traffic.',
    images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maritime Intelligence Search | VesselSurge',
    description: 'Search real-time maritime news and security alerts for global shipping chokepoints.',
    images: [`${BASE_URL}/og-image.jpg`],
  },
}

export default function SearchPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "@id": `${BASE_URL}/search#webpage`,
    url: `${BASE_URL}/search`,
    name: "VesselSurge Maritime Intelligence Search",
    description:
      "Search page for maritime news, security alerts, vessel tracking updates and shipping chokepoint intelligence.",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselSurge</span>
          </Link>
          <Link 
            href="/map-dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Map
          </Link>
        </div>
      </nav>

      {/* Search Interface */}
      <SearchInterface />

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Maritime Intelligence Search powered by VesselSurge &mdash; Real-time vessel tracking and shipping data</p>
        </div>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  )
}
