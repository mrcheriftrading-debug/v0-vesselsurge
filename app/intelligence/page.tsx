import Link from "next/link"
import { ArrowRight, Database, FileText, Globe, Radio, Shield, Zap } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"

const intelligenceCards = [
  {
    title: "Risk Monitoring",
    text: "Track security alerts, congestion, disruption signals, and hotspot risk levels from one dedicated page.",
    icon: Shield,
    tone: "text-primary",
  },
  {
    title: "Verified Reports",
    text: "Separate article counts, source counts, and confidence notes from live vessel movement data.",
    icon: FileText,
    tone: "text-accent",
  },
  {
    title: "Source Review",
    text: "Keep the live map cleaner while intelligence pages explain what changed and where it came from.",
    icon: Database,
    tone: "text-emerald-300",
  },
]

export default function IntelligencePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">
                <Radio className="h-3.5 w-3.5" />
                Intelligence Hub
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Understand maritime risk before it becomes a delay.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Track fresh reports, source confidence, and chokepoint signals in one calm view, then jump into the live map when you need operational context.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/map-dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Open Live Map <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/network" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.04]">
                  View Network
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {intelligenceCards.map(({ title, text, icon: Icon, tone }) => (
              <div key={title} className="rounded-xl border border-border bg-card/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className={`flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] ${tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-xl font-bold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Workflow</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">From signal to action in fewer clicks.</h2>
              <p className="mt-3 text-muted-foreground">
                Start with what changed, understand why it matters, then open the map only when you need route and traffic context.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Latest 24h source review",
                "Hotspot-specific news feed",
                "Risk notes and confidence labels",
                "Direct jump into selected map zones",
              ].map((item) => (
                <div key={item} className="rounded-lg border border-border bg-background/50 p-4 text-sm font-semibold text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-xl border border-primary/20 bg-primary/10 p-6 sm:p-8">
            <Globe className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-foreground">Built around the four critical hotspots.</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Strait of Hormuz, Bab el-Mandeb, Strait of Malacca, and Suez Canal each get clearer context before users move into the live operational map.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
