import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, BarChart3, Map, Network, Newspaper, ShieldCheck, Ship, Zap, Activity, Globe, TrendingUp } from "lucide-react"
import { HomeLiveMapLink } from "@/components/home-live-map-link"
import { HomeOceanScene } from "@/components/home-ocean-scene"
import { CommandStrip, FloatingIntelSignals } from "@/components/maritime-motion-effects"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { trafficTopicPages } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Live Maritime Intelligence Platform, Vessel Tracking and Shipping Risk",
  description:
    "Track live maritime intelligence, vessel context, shipping disruption, tanker routes, freight risk, war-risk insurance signals and cargo-vessel matching across Hormuz, Red Sea, Suez and Malacca.",
  alternates: { canonical: "https://www.vesselsurge.com/" },
  openGraph: {
    title: "VesselSurge, Live Maritime Intelligence Platform",
    description:
      "Live shipping chokepoint intelligence for operators, analysts, traders, cargo teams and vessel owners.",
    url: "https://www.vesselsurge.com/",
    siteName: "VesselSurge",
    images: [{ url: "https://www.vesselsurge.com/og-image.jpg", width: 1200, height: 630, alt: "VesselSurge maritime intelligence live map" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VesselSurge, Live Maritime Intelligence Platform",
    description: "Track vessel context, chokepoint risk, shipping disruption and cargo-vessel matching from one live workspace.",
    images: ["https://www.vesselsurge.com/og-image.jpg"],
  },
}

const productCards = [
  {
    href: "/map-dashboard",
    title: "Live Map",
    text: "Real-time chokepoint view with risk labels, AIS vessel context and source evidence.",
    icon: Map,
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/25 hover:border-blue-400/50",
    iconBg: "bg-blue-500/15 text-blue-400",
    glow: "hover:shadow-[0_0_40px_rgba(59,130,246,0.12)]",
    action: "Open Live Map",
    badge: "LIVE",
  },
  {
    href: "/latest",
    title: "News & Risk",
    text: "Fresh maritime headlines, verified sources and route-specific risk signals updated continuously.",
    icon: Newspaper,
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/25 hover:border-cyan-400/50",
    iconBg: "bg-cyan-500/15 text-cyan-400",
    glow: "hover:shadow-[0_0_40px_rgba(0,255,255,0.10)]",
    action: "Read Intel",
    badge: "24H",
  },
  {
    href: "/pro-market",
    title: "Market Pro",
    text: "Translate maritime disruption into investor-grade market context and trading signals.",
    icon: BarChart3,
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/25 hover:border-amber-400/50",
    iconBg: "bg-amber-500/15 text-amber-400",
    glow: "hover:shadow-[0_0_40px_rgba(245,158,11,0.10)]",
    action: "View Pro",
    badge: "PRO",
  },
  {
    href: "/network",
    title: "B2B Network",
    text: "Submit cargo needs or vessel capacity. Connect with operators through a focused matching flow.",
    icon: Network,
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/25 hover:border-emerald-400/50",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    glow: "hover:shadow-[0_0_40px_rgba(16,185,129,0.10)]",
    action: "Join Network",
    badge: "FREE",
  },
]

const chokepointLinks = [
  {
    href: "/regions/hormuz",
    title: "Strait of Hormuz",
    short: "HORMUZ",
    text: "Oil tanker traffic, Iran tension and Persian Gulf maritime risk.",
    risk: "HIGH",
    riskColor: "text-red-400",
    riskBg: "bg-red-400/10 border-red-400/20",
    dot: "bg-red-400",
    flag: "🟥",
  },
  {
    href: "/regions/bab",
    title: "Bab el-Mandeb",
    short: "BAB",
    text: "Red Sea security, Gulf of Aden routing and Houthi risk signals.",
    risk: "MEDIUM",
    riskColor: "text-amber-400",
    riskBg: "bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
    flag: "🟨",
  },
  {
    href: "/regions/suez",
    title: "Suez Canal",
    short: "SUEZ",
    text: "Transit flow, vessel queue signals and Europe-Asia disruption context.",
    risk: "MEDIUM",
    riskColor: "text-amber-400",
    riskBg: "bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
    flag: "🟨",
  },
  {
    href: "/regions/malacca",
    title: "Strait of Malacca",
    short: "MALACCA",
    text: "Singapore Strait traffic, congestion signals and piracy alert context.",
    risk: "MEDIUM",
    riskColor: "text-amber-400",
    riskBg: "bg-amber-400/10 border-amber-400/20",
    dot: "bg-amber-400",
    flag: "🟨",
  },
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
    acceptedAnswer: { "@type": "Answer", text: item.answer },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(chokepointItemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(topicItemListJsonLd) }} />
      <SiteNavigation />

      <main>
      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#040d1e] via-[#071020] to-background" />
        <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,119,255,0.18) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 80% 30%, rgba(0,255,255,0.08) 0%, transparent 50%)"}} />
        <div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
        <div className="absolute inset-x-[-20%] bottom-0 top-[60%] opacity-50 sm:inset-x-0 sm:opacity-60 md:top-[52%]">
          <HomeOceanScene />
        </div>
        <FloatingIntelSignals />
        <CommandStrip />
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:"linear-gradient(rgba(0,119,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,119,255,0.15) 1px, transparent 1px)", backgroundSize:"72px 72px"}} />

        <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col items-center justify-center px-4 pb-28 pt-16 text-center md:pb-16 lg:px-8">

          {/* Status pill */}
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.25em] text-emerald-300">Live maritime intelligence</span>
            <span className="h-3 w-px bg-white/10" />
            <span className="font-mono text-[0.6rem] text-muted-foreground">4 chokepoints monitored</span>
          </div>

          <h1 className="max-w-4xl text-[2.4rem] font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.5rem]">
            Shipping intelligence<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">before the market moves.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Track vessel traffic, maritime risk signals and cargo opportunities across Hormuz, Red Sea, Suez and Malacca — in one workspace.
          </p>

          <p className="mt-3 max-w-2xl text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Built for operators, charterers, insurers, analysts, freight desks and energy-market watchers.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <HomeLiveMapLink />
            <Link href="/latest" className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.07] hover:text-cyan-300">
              <Newspaper className="h-4 w-4" /> News & Risk
            </Link>
            <Link href="/pro-market" className="inline-flex h-12 items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-5 text-sm font-semibold text-amber-300 transition-all hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-400/10">
              <TrendingUp className="h-4 w-4" /> Market Pro
            </Link>
          </div>

          {/* Live stats strip */}
          <div className="mt-10 flex items-center gap-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-md overflow-hidden">
            {[
              { val: "4", label: "Chokepoints", icon: Globe },
              { val: "24h", label: "Intel refresh", icon: Activity },
              { val: "AIS", label: "Vessel data", icon: Ship },
              { val: "B2B", label: "Cargo network", icon: Network },
            ].map(({ val, label, icon: Icon }, i) => (
              <div key={val} className={`flex items-center gap-3 px-5 py-4 ${i < 3 ? "border-r border-white/[0.06]" : ""}`}>
                <Icon className="h-4 w-4 text-blue-400/60 shrink-0" />
                <div>
                  <div className="text-base font-black text-white leading-none">{val}</div>
                  <div className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT CARDS ── */}
      <section className="border-t border-white/[0.06] bg-[#070e1f] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10">
            <div className="mb-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.25em] text-blue-400">What you can do</div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Four tools. One maritime edge.</h2>
            <p className="mt-2 text-slate-400 max-w-xl">Map, news, market signals and cargo matching — each with a distinct job, all in one platform.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productCards.map(({ href, title, text, icon: Icon, color, border, iconBg, glow, action, badge }) => (
              <Link key={href} href={href} className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b ${color} ${border} ${glow} p-6 transition-all duration-300 hover:-translate-y-1.5`}>
                <div className="absolute top-4 right-4">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 font-mono text-[0.55rem] font-bold tracking-widest text-slate-400">{badge}</span>
                </div>
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 ${iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  {action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHOKEPOINTS ── */}
      <section className="border-t border-white/[0.06] bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10">
            <div className="mb-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.25em] text-cyan-400">Critical routes</div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Four chokepoints. One platform.</h2>
            <p className="mt-2 text-slate-400 max-w-xl">Dedicated intelligence pages for the routes that move global trade — updated continuously.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {chokepointLinks.map((region) => (
              <Link key={region.href} href={region.href} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.04]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-[0.55rem] font-bold tracking-[0.2em] text-slate-500">{region.short}</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.55rem] font-bold tracking-wider ${region.riskBg} ${region.riskColor}`}>
                    <span className={`h-1 w-1 rounded-full ${region.dot}`} />
                    {region.risk}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{region.title}</h3>
                <p className="mt-2 text-sm leading-5 text-slate-400">{region.text}</p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">
                  Open intelligence <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ── */}
      <section className="border-t border-white/[0.06] bg-[#070e1f] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { label: "See risk clearly", text: "Critical routes, source signals, and live map context stay easy to scan across all four chokepoints.", icon: ShieldCheck, color: "text-blue-400" },
              { label: "Act before the market", text: "Move from news to map to decision without digging — maritime disruption translates directly into context.", icon: Zap, color: "text-cyan-400" },
              { label: "Find capacity fast", text: "Connect cargo needs with vessel operators through a focused, direct B2B network intake flow.", icon: Ship, color: "text-emerald-400" },
            ].map(({ label, text, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className={`mb-4 h-10 w-10 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-white/[0.06] bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.25em] text-blue-400">Quick answers</div>
            <h2 className="mb-8 text-3xl font-black tracking-tight text-white sm:text-4xl">What people ask first.</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {maritimeFaq.map(({ question, answer }) => (
                <div key={question} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-bold text-white">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOPIC PAGES ── */}
      <section className="border-t border-white/[0.06] bg-[#070e1f] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10">
            <div className="mb-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.25em] text-slate-500">Intelligence library</div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Deep-dive topic pages.</h2>
            <p className="mt-2 text-slate-400 max-w-xl">From Hormuz oil risk to freight rate signals — structured intelligence for every angle.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {trafficTopicPages.map((topic) => (
              <Link key={topic.slug} href={`/topics/${topic.slug}`} className="group flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3.5 transition-all hover:border-white/10 hover:bg-white/[0.03]">
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{topic.name}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-slate-400" />
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
