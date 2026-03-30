import SearchInterface from "@/components/search-interface"
import Link from "next/link"
import { Zap, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Maritime Intelligence Search - VesselSurge",
  description: "Search real-time maritime news, vessel tracking, and shipping market updates powered by VesselSurge",
}

export default function SearchPage() {
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
    </div>
  )
}
