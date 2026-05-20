import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  BarChart3,
  Building2,
  Clock3,
  Database,
  FileCheck2,
  Globe,
  Layers,
  Map,
  Network,
  Newspaper,
  RadioTower,
  ShieldCheck,
  Ship,
  TrendingUp,
} from "lucide-react"
import { HomeLiveMapLink } from "@/components/home-live-map-link"
import { HomeOceanScene } from "@/components/home-ocean-scene"
import { FloatingIntelSignals } from "@/components/maritime-motion-effects"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { trafficTopicPages } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Global Live Maritime Intelligence Platform, Vessel Tracking and Shipping Risk",
  description:
    "Track global maritime intelligence, vessel context, shipping disruption, tanker routes, freight risk, war-risk insurance signals and cargo-vessel matching across critical routes.",
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
    text: "Operational chokepoint view with risk labels, vessel context and source evidence in one place.",
    icon: Map,
    action: "Open map",
    badge: "Operations",
  },
  {
    href: "/latest",
    title: "News & Risk",
    text: "Source-reviewed maritime news, published times and route-specific risk signals for rapid scanning.",
    icon: Newspaper,
    action: "Review news",
    badge: "Sources",
  },
  {
    href: "/pro-market",
    title: "Market Pro",
    text: "Translate maritime disruption into structured market context for oil, freight and listed exposure.",
    icon: BarChart3,
    action: "View pro",
    badge: "Research",
  },
  {
    href: "/network",
    title: "B2B Network",
    text: "Submit cargo needs or vessel capacity through a focused intake built for maritime counterparties.",
    icon: Network,
    action: "Join network",
    badge: "B2B",
  },
]

const searchIntentLinks = [
  {
    href: "/map-dashboard",
    eyebrow: "Live vessel tracking",
    title: "Open the live maritime map",
    text: "Use this when you need vessel context and route risk across Hormuz, Red Sea, Suez and Malacca.",
    icon: Map,
  },
  {
    href: "/latest",
    eyebrow: "Shipping disruption tracker",
    title: "Read latest maritime news",
    text: "Use this when you want source-reviewed headlines, published times and chokepoint evidence in one feed.",
    icon: Newspaper,
  },
  {
    href: "/pro-market",
    eyebrow: "Market impact",
    title: "Translate risk into market context",
    text: "Use this when maritime events may affect oil, freight, tanker equities, logistics stocks or insurance.",
    icon: TrendingUp,
  },
  {
    href: "/network",
    eyebrow: "Cargo vessel matching",
    title: "Find cargo or vessel capacity",
    text: "Use this when you need a cleaner route, cargo, timing and capacity intake for maritime B2B matching.",
    icon: Ship,
  },
]

const operatingStandards = [
  {
    title: "Source governance",
    text: "News, signals and route context are presented with source trails, published times and confidence-aware language.",
    icon: FileCheck2,
  },
  {
    title: "Continuity by design",
    text: "Public feeds and dashboards are backed by cached snapshots so core intelligence remains available during upstream delays.",
    icon: Database,
  },
  {
    title: "Decision-ready layout",
    text: "Chokepoint pages, live map, Market Pro and B2B intake are separated by job so teams do not hunt through one crowded view.",
    icon: Layers,
  },
]

const companySignals = [
  { value: "4", label: "Primary chokepoints", detail: "Hormuz, Bab el-Mandeb, Suez, Malacca", icon: Globe },
  { value: "5m", label: "Public feed cache", detail: "RSS and news surfaces revalidate regularly", icon: Clock3 },
  { value: "24/7", label: "Route watch", detail: "Health checks track cache, coverage and signals", icon: RadioTower },
  { value: "B2B", label: "Network intake", detail: "Cargo and vessel counterparties routed separately", icon: Building2 },
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

const searchIntentItemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "VesselSurge search intent paths",
  itemListElement: searchIntentLinks.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.eyebrow,
    url: `${siteUrl}${item.href}`,
    description: item.text,
  })),
}

export default function VesselSurgePage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(chokepointItemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(topicItemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchIntentItemListJsonLd) }} />
      <SiteNavigation />

      <main>
      {/* ── HERO ── */}
      <section className="relative min-h-[88svh] overflow-hidden border-b border-white/[0.08] bg-[#071020] pt-16">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#06101f_0%,#081327_54%,#0a1128_100%)]" />
        <div className="absolute inset-x-0 top-16 h-px bg-white/10" />
        <div className="absolute inset-x-[-20%] bottom-0 top-[62%] opacity-40 sm:inset-x-0 sm:opacity-45 md:top-[54%]">
          <HomeOceanScene />
        </div>
        <div className="absolute inset-0 opacity-[0.045]" style={{backgroundImage:"linear-gradient(rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.18) 1px, transparent 1px)", backgroundSize:"72px 72px"}} />
        <div className="opacity-55">
          <FloatingIntelSignals />
        </div>

        <div className="relative mx-auto grid min-h-[calc(88svh-4rem)] max-w-7xl gap-10 px-4 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              <span className="h-2 w-2 bg-emerald-400" />
              Operational maritime intelligence
            </div>

            <h1 className="text-[2.35rem] font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.45rem]">
              Maritime risk intelligence for serious shipping decisions.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              VesselSurge turns source-reviewed news, chokepoint signals, vessel context and market pressure into a structured operating view for teams that cannot wait for yesterday's report.
            </p>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
              Built for operators, charterers, insurers, analysts, freight desks and energy-market watchers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <HomeLiveMapLink />
              <Link href="/latest" className="inline-flex h-12 items-center gap-2 rounded-md border border-white/[0.12] bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/[0.07] hover:text-cyan-200">
                <Newspaper className="h-4 w-4" /> Review latest risk
              </Link>
              <Link href="/pro-market" className="inline-flex h-12 items-center gap-2 rounded-md border border-amber-300/20 bg-amber-300/[0.06] px-5 text-sm font-semibold text-amber-200 transition-colors hover:border-amber-300/40 hover:bg-amber-300/10">
                <TrendingUp className="h-4 w-4" /> Market Pro
              </Link>
            </div>
          </div>

          <div className="border border-white/[0.08] bg-[#0b1528]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Operating picture</p>
                <h2 className="mt-2 text-2xl font-black text-white">Coverage with accountable context.</h2>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {companySignals.map(({ value, label, detail, icon: Icon }) => (
                <div key={label} className="border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-black text-white">{value}</div>
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300">{label}</div>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-sm leading-6 text-emerald-50/85">
              No black-box risk score. VesselSurge separates route status, source evidence, signal freshness and commercial intake so each workflow has a clear job.
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.06] bg-[#0b1424] py-5">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 text-sm text-slate-400 sm:grid-cols-3 lg:px-8">
          {operatingStandards.map(({ title, text, icon: Icon }) => (
            <div key={title} className="flex items-start gap-3 border-white/[0.08] py-3 sm:border-r sm:pr-4 last:border-r-0">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
              <div>
                <p className="font-bold text-slate-100">{title}</p>
                <p className="mt-1 leading-6">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT CARDS ── */}
      <section className="bg-[#071020] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Platform modules</div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">One operating layer, separated by workflow.</h2>
            <p className="mt-3 text-base leading-7 text-slate-400">Live map users, analysts and commercial teams need different paths. VesselSurge keeps each task direct, with clear handoffs between risk, market context and commercial intake.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {productCards.map(({ href, title, text, icon: Icon, action, badge }) => (
              <Link key={href} href={href} className="group border border-white/[0.08] bg-[#0b1528] p-6 transition-colors hover:border-cyan-200/25 hover:bg-[#0e1a30]">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.035] text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="border border-white/10 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-500">{badge}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-100 transition-colors group-hover:text-white">
                  {action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEARCH INTENT PATHS ── */}
      <section className="border-t border-white/[0.06] bg-[#0a1128] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Choose your route</div>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Find the right maritime workspace fast.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                VesselSurge is organized around high-intent maritime searches: live vessel tracking, shipping disruption, market impact and cargo-vessel matching.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {searchIntentLinks.map(({ href, eyebrow, title, text, icon: Icon }) => (
                <Link key={href} href={href} className="group border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-cyan-300/25 hover:bg-white/[0.04]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 bg-cyan-300/10 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-500">{eyebrow}</div>
                      <h3 className="mt-1 text-base font-bold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                        Continue <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHOKEPOINTS ── */}
      <section className="border-t border-white/[0.06] bg-[#071020] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Critical routes</div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Route coverage with a clear operating status.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">Dedicated intelligence pages keep route risk, traffic context and source evidence separated from generic summaries.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {chokepointLinks.map((region) => (
              <Link key={region.href} href={region.href} className="group relative border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-slate-500">{region.short}</span>
                  <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider ${region.riskBg} ${region.riskColor}`}>
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
      <section className="border-t border-white/[0.06] bg-[#0b1424] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { label: "See risk clearly", text: "Critical routes, source signals and live map context stay easy to scan across all four chokepoints.", icon: ShieldCheck, color: "text-blue-300" },
              { label: "Work from evidence", text: "Move from headline to source trail to map context with a clean path from signal to decision.", icon: FileCheck2, color: "text-cyan-200" },
              { label: "Route commercial intent", text: "Connect cargo needs with vessel operators through a focused, direct B2B network intake flow.", icon: Ship, color: "text-emerald-300" },
            ].map(({ label, text, icon: Icon, color }) => (
              <div key={label} className="border border-white/[0.07] bg-white/[0.02] p-6">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] ${color}`}>
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
      <section className="border-t border-white/[0.06] bg-[#071020] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Quick answers</div>
            <h2 className="mb-8 text-3xl font-black tracking-tight text-white sm:text-4xl">Clear answers before the dashboard.</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {maritimeFaq.map(({ question, answer }) => (
                <div key={question} className="border border-white/[0.07] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-bold text-white">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOPIC PAGES ── */}
      <section className="border-t border-white/[0.06] bg-[#0b1424] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10">
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Intelligence library</div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Searchable maritime intelligence pages.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">From Hormuz oil risk to freight-rate signals, topic pages are built to route serious visitors into the live map and commercial intake.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {trafficTopicPages.map((topic) => (
              <Link key={topic.slug} href={`/topics/${topic.slug}`} className="group flex items-center justify-between border border-white/[0.06] bg-white/[0.015] px-4 py-3.5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]">
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
