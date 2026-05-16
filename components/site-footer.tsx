import Link from "next/link"
import { Linkedin, Zap } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">VesselSurge</span>
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <Link href="/intelligence" className="transition-colors hover:text-foreground">News & Risk</Link>
            <Link href="/map-dashboard" className="transition-colors hover:text-foreground">Live Map</Link>
            <Link href="/network" className="transition-colors hover:text-foreground">Join Network</Link>
            <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          &copy; 2026 VesselSurge. Maritime intelligence and B2B shipping network.
        </div>
      </div>
    </footer>
  )
}
