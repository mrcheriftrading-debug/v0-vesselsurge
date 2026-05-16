"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Anchor, Navigation, Radar, Ship, Waves } from "lucide-react"

interface LiveMapVoyageTransitionProps {
  active: boolean
}

export function LiveMapVoyageTransition({ active }: LiveMapVoyageTransitionProps) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timeout = window.setTimeout(() => {
      router.push("/map-dashboard")
    }, prefersReducedMotion ? 1600 : 2600)

    return () => window.clearTimeout(timeout)
  }, [active, router])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#020817] text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(0,119,255,0.28),transparent_42%),linear-gradient(180deg,rgba(2,8,23,0.75),#020817_74%)]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
        }}
      />

      <div className="absolute left-1/2 top-[18%] flex -translate-x-1/2 flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
          <Radar className="h-4 w-4 animate-pulse" />
          Live Map Transfer
        </div>
        <h2 className="text-3xl font-black tracking-tight md:text-5xl">Entering VesselSurge Live Map</h2>
        <p className="text-sm font-medium text-cyan-100/75">Stand by. Plotting route to the live intelligence dashboard.</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[48%] overflow-hidden">
        <div className="absolute inset-x-[-8%] top-[8%] h-28 animate-[voyage-wave_5s_linear_infinite] rounded-[50%] border-t border-cyan-300/25" />
        <div className="absolute inset-x-[-12%] top-[22%] h-32 animate-[voyage-wave_4.2s_linear_infinite_reverse] rounded-[50%] border-t border-sky-400/20" />
        <div className="absolute inset-x-[-16%] top-[38%] h-40 animate-[voyage-wave_5.8s_linear_infinite] rounded-[50%] border-t border-blue-400/20" />
        <div className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-cyan-950/70 via-blue-950/45 to-transparent" />
      </div>

      <div className="absolute left-1/2 top-[48%] h-px w-[74vw] max-w-5xl -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent">
        <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
        <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_22px_rgba(110,231,183,0.9)]" />
      </div>

      <div className="absolute left-1/2 top-[47%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 animate-[voyage-radar_1.85s_ease-in-out_forwards] rounded-full border border-cyan-300/25">
        <div className="absolute inset-8 rounded-full border border-cyan-300/20" />
        <div className="absolute inset-16 rounded-full border border-cyan-300/15" />
        <div className="absolute left-1/2 top-1/2 h-28 w-px origin-bottom -translate-x-1/2 -translate-y-full bg-gradient-to-t from-cyan-300 to-transparent" />
      </div>

      <div className="absolute left-[-18rem] top-[48%] animate-[voyage-ship_1.85s_cubic-bezier(.2,.8,.2,1)_forwards]">
        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -bottom-8 left-1/2 h-16 w-72 -translate-x-1/2 rounded-[50%] bg-cyan-300/20 blur-xl" />
          <div className="relative flex h-32 w-72 items-center justify-center rounded-[48px_48px_64px_64px] border border-cyan-200/30 bg-gradient-to-br from-slate-100 via-cyan-100 to-slate-400 shadow-[0_0_80px_rgba(34,211,238,0.36)]">
            <Ship className="h-24 w-24 text-slate-950" strokeWidth={1.5} />
            <div className="absolute -top-8 left-12 flex items-center gap-2 rounded-full border border-cyan-200/30 bg-slate-950/80 px-3 py-1 text-xs font-bold text-cyan-100 backdrop-blur">
              <Anchor className="h-3.5 w-3.5" />
              VS-INTEL
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center gap-3 text-cyan-100">
            <Waves className="h-6 w-6 animate-pulse" />
            <Navigation className="h-5 w-5" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes voyage-ship {
          0% {
            transform: translate3d(0, 26px, 0) rotate(-3deg) scale(0.86);
          }
          52% {
            transform: translate3d(52vw, -8px, 0) rotate(1deg) scale(1.08);
          }
          100% {
            transform: translate3d(calc(100vw + 22rem), -22px, 0) rotate(2deg) scale(0.92);
          }
        }

        @keyframes voyage-wave {
          0% {
            transform: translateX(-4%) scaleX(1);
          }
          50% {
            transform: translateX(4%) scaleX(1.05);
          }
          100% {
            transform: translateX(-4%) scaleX(1);
          }
        }

        @keyframes voyage-radar {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.55) rotate(0deg);
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0.15;
            transform: translate(-50%, -50%) scale(1.8) rotate(240deg);
          }
        }
      `}</style>
    </div>
  )
}
