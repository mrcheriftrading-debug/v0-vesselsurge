"use client"

import Link from "next/link"
import type { MouseEvent as ReactMouseEvent } from "react"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { LiveMapVoyageTransition } from "@/components/live-map-voyage-transition"

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
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-white sm:px-6"
      >
        <span>Open Live Map</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </>
  )
}
