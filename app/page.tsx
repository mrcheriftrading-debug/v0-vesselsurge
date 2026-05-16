"use client"

import Link from "next/link"
import type { MouseEvent as ReactMouseEvent } from "react"
import { useState } from "react"
import { ArrowRight, BarChart3, Map, Network, Radio, ShieldCheck, Ship } from "lucide-react"
import { LiveMapVoyageTransition } from "@/components/live-map-voyage-transition"
import { Button3DEffect, CommandStrip, FloatingIntelSignals } from "@/components/maritime-motion-effects"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { HeroOceanScene } from "@/components/three/maritime-3d-scenes"

const productCards = [
  {
    href: "/intelligence",
    title: "Maritime Intelligence",
    text: "Follow risk, reports, sources, and hotspot updates without digging through the whole site.",
    icon: BarChart3,
    accent: "text-primary",
  },
  {
    href: "/map-dashboard",
    title: "Live Map",
    text: "Open the operational map for Hormuz, Bab el-Mandeb, Malacca and Suez.",
    icon: Map,
    accent: "text-accent",
  },
  {
    href: "/network",
    title: "B2B Network",
    text: "Join the vessel and cargo matching network from a focused onboarding page.",
    icon: Network,
    accent: "text-emerald-300",
  },
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

          <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-12 text-center lg:px-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.22em] text-accent sm:mb-8 sm:text-xs sm:tracking-[0.3em]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" />
              Maritime Intelligence Platform
            </div>

            <h1 className="max-w-5xl text-[2.55rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Live shipping intelligence,{" "}
              <span className="text-primary text-glow-blue">built for action.</span>
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:mt-8 sm:text-lg md:text-xl">
              VesselSurge separates live map monitoring, maritime intelligence, and B2B vessel matching into simple focused pages, so teams can move faster on mobile and desktop.
            </p>

            <div className="mt-6 grid w-full max-w-3xl grid-cols-3 gap-2 rounded-xl border border-cyan-300/10 bg-slate-950/30 p-2 backdrop-blur sm:mt-8 sm:gap-3 sm:p-3">
              {[
                { label: "Hotspots", value: "4", icon: Radio },
                { label: "Map", value: "Live", icon: Map },
                { label: "Network", value: "B2B", icon: Ship },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-3 text-center sm:px-4">
                  <Icon className="mx-auto mb-1.5 h-4 w-4 text-cyan-200" />
                  <div className="text-lg font-black text-foreground sm:text-2xl">{value}</div>
                  <div className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
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
                Intelligence
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-background py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Product Areas</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything has its own place.</h2>
              <p className="mt-3 text-muted-foreground">Use the menu to move between the main areas. The homepage stays clean, while deeper workflows live on dedicated pages.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {productCards.map(({ href, title, text, icon: Icon, accent }) => (
                <Link key={href} href={href} className="group rounded-xl border border-border bg-card/50 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.045]">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] ${accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    Open page <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
