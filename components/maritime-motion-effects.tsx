"use client"

import { useEffect, useState } from "react"
import { Activity, Anchor, Radio, Satellite, Ship, Waves } from "lucide-react"

export function FloatingIntelSignals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="intel-chip left-[7%] top-[28%] hidden md:flex">
        <Radio className="h-3.5 w-3.5 text-cyan-300" />
        AIS TRACKING
      </div>
      <div className="intel-chip right-[8%] top-[33%] hidden lg:flex">
        <Satellite className="h-3.5 w-3.5 text-emerald-300" />
        SATELLITE LOCK
      </div>
      <div className="intel-chip bottom-[22%] left-[12%] hidden lg:flex">
        <Activity className="h-3.5 w-3.5 text-red-300" />
        RISK PULSE
      </div>
      <div className="intel-chip bottom-[18%] right-[13%] hidden md:flex">
        <Anchor className="h-3.5 w-3.5 text-blue-200" />
        ROUTE READY
      </div>
      <span className="signal-dot left-[20%] top-[58%]" />
      <span className="signal-dot right-[24%] top-[55%]" />
      <span className="signal-dot left-[44%] bottom-[24%]" />

      <style jsx>{`
        .intel-chip {
          position: absolute;
          align-items: center;
          gap: 0.45rem;
          border: 1px solid rgba(103, 232, 249, 0.22);
          background: rgba(2, 8, 23, 0.64);
          box-shadow: 0 0 34px rgba(14, 165, 233, 0.12);
          backdrop-filter: blur(14px);
          color: rgba(224, 242, 254, 0.84);
          border-radius: 999px;
          padding: 0.48rem 0.72rem;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          animation: intel-float 6s ease-in-out infinite;
        }

        .intel-chip:nth-child(2) {
          animation-delay: -1.4s;
        }

        .intel-chip:nth-child(3) {
          animation-delay: -2.8s;
        }

        .intel-chip:nth-child(4) {
          animation-delay: -4s;
        }

        .signal-dot {
          position: absolute;
          height: 0.42rem;
          width: 0.42rem;
          border-radius: 999px;
          background: #67e8f9;
          box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.55), 0 0 24px rgba(103, 232, 249, 0.9);
          animation: signal-ping 2.4s ease-out infinite;
        }

        @keyframes intel-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.62;
          }
          50% {
            transform: translate3d(0.5rem, -0.75rem, 0);
            opacity: 1;
          }
        }

        @keyframes signal-ping {
          0% {
            box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.55), 0 0 24px rgba(103, 232, 249, 0.9);
            transform: scale(0.9);
          }
          80% {
            box-shadow: 0 0 0 22px rgba(103, 232, 249, 0), 0 0 24px rgba(103, 232, 249, 0.9);
            transform: scale(1.08);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(103, 232, 249, 0), 0 0 24px rgba(103, 232, 249, 0.9);
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  )
}

export function MapArrivalScan() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 1850)
    return () => window.clearTimeout(timeout)
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-slate-950/72 backdrop-blur-sm" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(14,165,233,0.24),transparent_38%)]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 animate-[arrival-ring_1.8s_ease-out_forwards]">
        <div className="absolute inset-10 rounded-full border border-cyan-300/15" />
        <div className="absolute inset-20 rounded-full border border-cyan-300/10" />
        <div className="absolute left-1/2 top-1/2 h-36 w-px origin-bottom -translate-x-1/2 -translate-y-full bg-gradient-to-t from-cyan-300 to-transparent animate-[arrival-sweep_1.2s_linear_infinite]" />
      </div>
      <div className="absolute left-1/2 top-[58%] flex -translate-x-1/2 items-center gap-3 rounded-full border border-cyan-300/25 bg-slate-950/70 px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-cyan-100 shadow-[0_0_44px_rgba(34,211,238,0.2)]">
        <Satellite className="h-4 w-4 animate-pulse" />
        Satellite map locked
      </div>
      <style jsx>{`
        @keyframes arrival-ring {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.45);
          }
          35% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.55);
          }
        }

        @keyframes arrival-sweep {
          to {
            transform: translate(-50%, -100%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export function CommandStrip() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-20 overflow-hidden border-t border-cyan-300/10 bg-gradient-to-t from-slate-950/70 to-transparent md:block" aria-hidden="true">
      <div className="absolute left-0 top-7 flex animate-[command-drift_18s_linear_infinite] gap-12 whitespace-nowrap text-[0.65rem] font-black uppercase tracking-[0.24em] text-cyan-100/50">
        <span className="flex items-center gap-2"><Ship className="h-3.5 w-3.5" /> Vessel route calculated</span>
        <span className="flex items-center gap-2"><Waves className="h-3.5 w-3.5" /> Weather corridor nominal</span>
        <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> Risk scan active</span>
        <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> OpenClaw feed online</span>
      </div>
      <style jsx>{`
        @keyframes command-drift {
          from {
            transform: translateX(100vw);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  )
}
