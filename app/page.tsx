"use client"

import Link from "next/link"
import type { MouseEvent as ReactMouseEvent } from "react"
import { useState } from "react"
import { AlertTriangle, ArrowRight, BarChart3, Clock, Map, Network, Newspaper, Radio, Route, Search, ShieldCheck, Ship, TrendingUp } from "lucide-react"
import { LiveMapVoyageTransition } from "@/components/live-map-voyage-transition"
import { Button3DEffect, CommandStrip, FloatingIntelSignals } from "@/components/maritime-motion-effects"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { HeroOceanScene } from "@/components/three/maritime-3d-scenes"

const productCards = [
  {
    href: "/map-dashboard",
    title: "I want the live map",
    text: "See hotspots, vessel traffic, risk level, and selected maritime feed.",
    icon: Map,
    accent: "text-primary",
    action: "Open map",
  },
  {
    href: "/intelligence",
    title: "I want news and risk",
    text: "Read maritime reports, latest sources, and what changed in the last 24 hours.",
    icon: Newspaper,
    accent: "text-accent",
    action: "Read news",
  },
  {
    href: "/network",
    title: "I want cargo or vessels",
    text: "Join the network, list vessel capacity, or request shipping partners.",
    icon: Network,
    accent: "text-emerald-300",
    action: "Join network",
  },
]

const quickActions = [
  { href: "/map-dashboard", label: "Live Map", text: "Track hotspots", icon: Map },
  { href: "/intelligence", label: "News & Risk", text: "Latest reports", icon: Newspaper },
  { href: "/network#surge-form", label: "Join", text: "Cargo or vessels", icon: Network },
  { href: "/search", label: "Search", text: "Find anything", icon: Search },
]

const hotspotPreview = [
  { name: "Strait of Hormuz", risk: "Critical", reports: "Live review", tone: "text-red-300", bg: "bg-red-500/10" },
  { name: "Bab el-Mandeb", risk: "Watch", reports: "Red Sea feed", tone: "text-amber-300", bg: "bg-amber-500/10" },
  { name: "Suez Canal", risk: "Tracking", reports: "Transit signals", tone: "text-cyan-200", bg: "bg-cyan-500/10" },
]

const heroStats = [
  { label: "Hotspots", value: "4", icon: Radio },
  { label: "Intel window", value: "24h", icon: Clock },
  { label: "Routing view", value: "Live", icon: Route },
]

export default function VesselSurgePage() {
  const [voyageActive, setVoyageActive] = useState(false)

  const launchLiveMapVoyage = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!voyageActive) setVoyageActive(true)
  }

  const captureLiveMapVoyage = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const liveMapLink = target.closest('a[href="/map-dashboard"]')
    if (!liveMapLink) return
    launchLiveMapVoyage(event)
  }

  return (
    <div className="min-h-screen bg-background" onClickCapture={captureLiveMapVoyage}>
      <LiveMapVoyageTransition active={voyageActive} />
      <SiteNavigation />

      <main>
        <section className="relative min-h-[100svh] overflow-hidden pt-16">
          <div className="absolute inset-0 bg-gradient-to-b from-[#071020] via-background to-card" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,119,255,0.13),transparent_36%,rgba(0,255,255,0.08)_72%,transparent)]" />
          <div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
          <div className="absolute inset-x-[-20%] bottom-0 top-[62%] opacity-55 sm:inset-x-0 sm:opacity-65 md:top-[54%]">
            <HeroOceanScene />
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

          <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-12">
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.22em] text-accent sm:mb-7 sm:text-xs sm:tracking-[0.3em]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
                Maritime intelligence for critical routes
              </div>

              <h1 className="mx-auto max-w-5xl text-[2.45rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:mx-0 lg:text-7xl">
                Know what is happening at sea{" "}
                <span className="text-primary text-glow-blue">before it hits your cargo.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-7 sm:text-lg md:text-xl lg:mx-0">
                VesselSurge gives shipping teams a faster way to monitor chokepoint risk, read the latest maritime signals, and connect cargo with vessel capacity.
              </p>

              <div className="mt-7 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center lg:justify-start">
                <Link
                  href="/map-dashboard"
                  onClick={launchLiveMapVoyage}
                  className="relative flex min-h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_28px_rgba(0,119,255,0.26)] transition-all hover:-translate-y-1 hover:bg-primary/90 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                >
                  <span className="relative z-10">Open Live Map</span>
                  <ArrowRight className="relative z-10 h-5 w-5" />
                  <Button3DEffect variant="map" compact />
                </Link>
                <Link
                  href="/intelligence"
                  className="relative flex min-h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-md border border-accent/45 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent shadow-[0_0_22px_rgba(0,255,255,0.08)] transition-all hover:-translate-y-1 hover:bg-accent/20 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                >
                  News & Risk
                </Link>
              </div>

              <div className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-2 rounded-xl border border-cyan-300/10 bg-slate-950/30 p-2 backdrop-blur sm:mt-8 sm:gap-3 sm:p-3">
                {heroStats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-3 text-center sm:px-4">
                    <Icon className="mx-auto mb-1.5 h-4 w-4 text-cyan-200" />
                    <div className="text-lg font-black text-foreground sm:text-2xl">{value}</div>
                    <div className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full">
              <div className="rounded-xl border border-cyan-300/15 bg-slate-950/50 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur sm:p-4">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-3 py-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Live Desk</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">Critical route overview</div>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Online
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  {hotspotPreview.map(({ name, risk, reports, tone, bg }) => (
                    <Link key={name} href="/map-dashboard" onClick={launchLiveMapVoyage} className="group flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-3 transition-all hover:border-primary/30 hover:bg-white/[0.055]">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${bg}`}>
                          <AlertTriangle className={`h-5 w-5 ${tone}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{name}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{reports}</div>
                        </div>
                      </div>
                      <div className={`rounded-md border border-white/10 px-2 py-1 text-xs font-black uppercase ${tone}`}>{risk}</div>
                    </Link>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <div className="mt-2 text-xl font-black text-foreground">24h</div>
                    <div className="text-xs text-muted-foreground">Fresh intelligence window</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
                    <Ship className="h-4 w-4 text-accent" />
                    <div className="mt-2 text-xl font-black text-foreground">B2B</div>
                    <div className="text-xs text-muted-foreground">Cargo and vessel matching</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Start here</div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">What do you need right now?</h2>
                <p className="mt-3 text-muted-foreground">The homepage is built around the three actions most maritime teams care about first.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:w-[30rem]">
                {quickActions.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-xs font-bold text-foreground transition-colors hover:border-primary/30 hover:bg-white/[0.04]">
                    <Icon className="h-4 w-4 text-primary" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
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
              { label: "Fast navigation", text: "One clear menu across desktop and mobile.", icon: ShieldCheck },
              { label: "Focused workflows", text: "Map, intelligence, and onboarding do not compete for attention.", icon: BarChart3 },
              { label: "Mobile ready", text: "Pages are lighter, shorter, and easier to tap through.", icon: Network },
            ].map(({ label, text, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-border bg-background/50 p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-base font-bold text-foreground">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
