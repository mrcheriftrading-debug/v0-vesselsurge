import Link from "next/link"
import { ArrowRight, BarChart3, Map, Network, Newspaper, ShieldCheck, Ship, Zap } from "lucide-react"
import { HomeLiveMapLink } from "@/components/home-live-map-link"
import { HomeOceanScene } from "@/components/home-ocean-scene"
import { CommandStrip, FloatingIntelSignals } from "@/components/maritime-motion-effects"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { trafficTopicPages } from "@/lib/seo"

const productCards = [
  {
    href: "/map-dashboard",
    title: "See risk on the map",
    text: "Live chokepoint view with risk labels, source evidence and AIS context.",
    icon: Map,
    accent: "text-primary",
    action: "Open Live Map",
  },
  {
    href: "/latest",
    title: "Read News & Risk",
    text: "Fresh maritime headlines, verified sources and route-specific risk signals.",
    icon: Newspaper,
    accent: "text-accent",
    action: "Open News & Risk",
  },
  {
    href: "/pro-market",
    title: "Analyze market impact",
    text: "Translate maritime disruption into investor and trading context.",
    icon: BarChart3,
    accent: "text-amber-300",
    action: "View Market Pro",
  },
  {
    href: "/network",
    title: "Find cargo or vessels",
    text: "Submit cargo needs or vessel capacity through a focused B2B flow.",
    icon: Network,
    accent: "text-emerald-300",
    action: "Join Network",
  },
]

const chokepointLinks = [
  { href: "/regions/hormuz", title: "Strait of Hormuz", text: "Oil tanker traffic, Iran tension and Persian Gulf maritime risk." },
  { href: "/regions/bab", title: "Bab el-Mandeb", text: "Red Sea security, Gulf of Aden routing and Houthi risk signals." },
  { href: "/regions/suez", title: "Suez Canal", text: "Transit flow, queue signals and Europe-Asia disruption context." },
  { href: "/regions/malacca", title: "Strait of Malacca", text: "Singapore Strait traffic, congestion and piracy alert context." },
]

const maritimeFaq = [
  {
    question: "How can I monitor Strait of Hormuz vessel traffic?",
    answer: "Open the live map or Hormuz region page for vessel context, oil route risk and Iran-related maritime signals.",
  },
  {
    question: "Where can I track Red Sea and Bab el-Mandeb shipping risk?",
    answer: "Use the intelligence hub and Bab el-Mandeb page for source-reviewed Red Sea security and Gulf of Aden route context.",
  },
  {
    question: "How do I check Suez Canal and Malacca Strait disruptions?",
    answer: "Dedicated region pages organize traffic, congestion, piracy and transit risk signals before you open the operational map.",
  },
  {
    question: "Can VesselSurge help with cargo and vessel matching?",
    answer: "The network page lets cargo teams and vessel operators submit route, cargo, timing and capacity requirements.",
  },
]

const siteUrl = "https://www.vesselsurge.com"

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: maritimeFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
}

const chokepointItemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "VesselSurge maritime chokepoint intelligence pages",
  itemListElement: chokepointLinks.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.title,
    url: `${siteUrl}${item.href}`,
    description: item.text,
  })),
}

const topicItemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "VesselSurge maritime intelligence topic pages",
  itemListElement: trafficTopicPages.map((topic, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: topic.name,
    url: `${siteUrl}/topics/${topic.slug}`,
    description: topic.description,
  })),
}

export default function VesselSurgePage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(chokepointItemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(topicItemListJsonLd) }}
      />
      <SiteNavigation />

      <main>
        <section className="relative min-h-[100svh] overflow-hidden pt-16">
          <div className="absolute inset-0 bg-gradient-to-b from-[#071020] via-background to-card" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,119,255,0.13),transparent_36%,rgba(0,255,255,0.08)_72%,transparent)]" />
          <div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
          <div className="absolute inset-x-[-20%] bottom-0 top-[62%] opacity-55 sm:inset-x-0 sm:opacity-65 md:top-[54%]">
            <HomeOceanScene />
          </div>
          <FloatingIntelSignals />
          <CommandStrip />
          <div
            className="absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage: "linear-gradient(rgba(0,119,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,119,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col items-center justify-center px-4 pb-28 pt-14 text-center md:pb-14 lg:px-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.22em] text-accent sm:mb-7 sm:text-xs sm:tracking-[0.3em]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
              Maritime intelligence for critical routes
            </div>

            <h1 className="max-w-5xl text-[2.25rem] font-extrabold leading-[1.04] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Maritime risk, live maps and cargo connections{" "}
              <span className="text-primary text-glow-blue">in one clean workspace.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-lg md:text-xl">
              Track critical shipping routes, read the latest maritime signals, and move quickly between live intelligence and vessel matching.
            </p>

            <div className="mt-7 grid w-full max-w-md gap-3 sm:max-w-4xl sm:grid-cols-4">
              <HomeLiveMapLink />
              <Link
                href="/latest"
                className="relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-md border border-accent/45 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent shadow-[0_0_22px_rgba(0,255,255,0.08)] transition-all hover:-translate-y-1 hover:bg-accent/20 sm:min-h-14 sm:px-5 sm:py-4"
              >
                News & Risk
              </Link>
              <Link
                href="/pro-market"
                className="relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-md border border-amber-300/35 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-200 transition-all hover:-translate-y-1 hover:bg-amber-300/15 sm:min-h-14 sm:px-5 sm:py-4"
              >
                Market Pro
              </Link>
              <Link
                href="/network"
                className="relative flex min-h-12 items-center justify-center gap-2 overflow-hidden rounded-md border border-border bg-card/70 px-5 py-3 text-sm font-semibold text-foreground transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-card sm:min-h-14 sm:px-5 sm:py-4"
              >
                Join Network
              </Link>
            </div>

            <div className="mt-8 grid w-full max-w-3xl grid-cols-3 gap-2 rounded-xl border border-white/10 bg-slate-950/25 p-2 backdrop-blur sm:gap-3 sm:p-3">
              <div className="rounded-lg bg-white/[0.03] px-3 py-3">
                <div className="text-lg font-black text-foreground sm:text-2xl">4</div>
                <div className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">Hotspots</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] px-3 py-3">
                <div className="text-lg font-black text-foreground sm:text-2xl">24h</div>
                <div className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">Intel</div>
              </div>
              <div className="rounded-lg bg-white/[0.03] px-3 py-3">
                <div className="text-lg font-black text-foreground sm:text-2xl">B2B</div>
                <div className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">Network</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Start here</div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Choose the job. Open the right tool.</h2>
                <p className="mt-3 text-muted-foreground">
                  VesselSurge now has four clear paths: map, news/risk, market impact and cargo-vessel matching.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {productCards.map(({ href, title, text, icon: Icon, accent, action }) => (
                <Link key={href} href={href} className="group rounded-xl border border-border bg-card/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] ${accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 md:grid-cols-3 lg:px-8">
            {[
              { label: "See risk clearly", text: "Critical routes, source signals, and live map context stay easy to scan.", icon: ShieldCheck },
              { label: "Act faster", text: "Move from news to map to decision without digging through a long page.", icon: Zap },
              { label: "Find capacity", text: "Connect cargo needs with vessel operators through a focused network flow.", icon: Ship },
            ].map(({ label, text, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-background/50 p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-base font-bold text-foreground">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-2xl">
              <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Critical chokepoints</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Dedicated pages for the routes people search first.</h2>
              <p className="mt-3 text-muted-foreground">
                Stable, crawlable intelligence pages help search engines and AI assistants understand what VesselSurge monitors before users open the live map.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {chokepointLinks.map((region) => (
                <Link key={region.href} href={region.href} className="group rounded-xl border border-border bg-card/50 p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]">
                  <h3 className="text-lg font-bold text-foreground">{region.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{region.text}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Open route page <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Maritime search answers</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Built for the chokepoint questions people ask first.</h2>
              <p className="mt-3 text-muted-foreground">
                VesselSurge gives researchers, operators and market watchers a faster way to move from shipping headlines to live route context.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {maritimeFaq.map(({ question, answer }) => (
                <div key={question} className="rounded-xl border border-border bg-background/55 p-5">
                  <h3 className="text-base font-bold text-foreground">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-3xl">
              <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Traffic topics</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">High-intent pages for the maritime searches that matter.</h2>
              <p className="mt-3 text-muted-foreground">
                These topic guides connect search demand directly to VesselSurge tools, from Hormuz oil risk to cargo-vessel matching.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trafficTopicPages.map((topic) => (
                <Link key={topic.slug} href={`/topics/${topic.slug}`} className="group rounded-xl border border-border bg-card/50 p-5 transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]">
                  <h3 className="text-lg font-bold text-foreground">{topic.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{topic.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Open topic <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
