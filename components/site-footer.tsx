import Link from "next/link"
import { Linkedin, Ship } from "lucide-react"
import { trafficTopicPages } from "@/lib/seo"

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#071020] pb-24 pt-12 md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[1.15fr_1.85fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
              <Ship className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">VesselSurge</span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
            Maritime intelligence for source-reviewed chokepoint risk, live map context, market impact research and cargo-vessel network intake.
          </p>
          <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Operational status: monitored</span>
            <a href="https://www.linkedin.com/company/vesselsurge" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Platform</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <Link href="/map-dashboard" className="transition-colors hover:text-foreground">Live map</Link>
              <Link href="/latest" className="transition-colors hover:text-foreground">News & Risk</Link>
              <Link href="/source-trust" className="transition-colors hover:text-foreground">Source trust</Link>
              <Link href="/pro-market" className="transition-colors hover:text-foreground">Market Pro</Link>
              <Link href="/network" className="transition-colors hover:text-foreground">Network intake</Link>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Coverage</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <Link href="/regions/hormuz" className="transition-colors hover:text-foreground">Strait of Hormuz</Link>
              <Link href="/regions/bab" className="transition-colors hover:text-foreground">Bab el-Mandeb</Link>
              <Link href="/regions/suez" className="transition-colors hover:text-foreground">Suez Canal</Link>
              <Link href="/regions/malacca" className="transition-colors hover:text-foreground">Strait of Malacca</Link>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Company</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
              <Link href="/auth/login" className="transition-colors hover:text-foreground">Client sign in</Link>
              <Link href="/auth/sign-up" className="transition-colors hover:text-foreground">Create account</Link>
              <Link href="/feed.xml" className="transition-colors hover:text-foreground">RSS feed</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/[0.08] px-4 pt-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trafficTopicPages.slice(0, 12).map((topic) => (
            <Link key={topic.slug} href={`/topics/${topic.slug}`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {topic.name}
            </Link>
          ))}
        </div>
        <div className="mt-8 text-sm text-muted-foreground">
          &copy; 2026 VesselSurge. Maritime intelligence and B2B shipping network.
        </div>
      </div>
    </footer>
  )
}
