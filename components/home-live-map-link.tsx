"use client"

import Link from "next/link"
import type { MouseEvent as ReactMouseEvent } from "react"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { LiveMapVoyageTransition } from "@/components/live-map-voyage-transition"
import { Button3DEffect } from "@/components/maritime-motion-effects"

export function HomeLiveMapLink() {
  const [voyageActive, setVoyageActive] = useState(false)

  const launchLiveMapVoyage = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    if (!voyageActive) setVoyageActive(true)
  }

  return (
    <>
      <LiveMapVoyageTransition active={voyageActive} />
      <Link
        href="/map-dashboard"
        onClick={launchLiveMapVoyage}
        className="relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_28px_rgba(0,119,255,0.26)] transition-all hover:-translate-y-1 hover:bg-primary/90 sm:min-h-14 sm:px-5 sm:py-4"
      >
        <span className="relative z-10">Open Live Map</span>
        <ArrowRight className="relative z-10 h-5 w-5" />
        <Button3DEffect variant="map" compact />
      </Link>
    </>
  )
}
