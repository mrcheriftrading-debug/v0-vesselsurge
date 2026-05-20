"use client"

import { useEffect, useState } from "react"
import { Activity, Anchor, Radio, Satellite } from "lucide-react"

export function FloatingIntelSignals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hero-hud left-3 top-[10%] hidden w-[12rem] sm:block md:left-[5%] md:top-[12%]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-cyan-100">
            <Satellite className="h-4 w-4 text-cyan-300" />
            LIVE INTEL
          </span>
          <span className="h-2 w-2 bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.75)]" />
        </div>
        <div className="mt-3 h-1 bg-cyan-950">
          <div className="h-full w-3/4 bg-cyan-300/80" />
        </div>
      </div>

      <div className="hero-hud right-3 top-[16%] hidden w-[12rem] sm:block md:right-[5%] md:top-[13%]">
        <div className="flex items-center gap-2 text-slate-100">
          <Activity className="h-4 w-4 text-amber-200" />
          ROUTE WATCH
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span key={bar} className="risk-bar" style={{ opacity: 0.42 + bar * 0.11 }} />
          ))}
        </div>
      </div>

      <div className="intel-chip left-3 top-[44%] hidden sm:flex md:left-[7%] md:top-[31%]">
        <Radio className="h-3.5 w-3.5 text-cyan-300" />
        SOURCE CHECKED
      </div>
      <div className="intel-chip bottom-[9%] left-4 hidden sm:flex md:bottom-[11%] md:left-[7%]">
        <Activity className="h-3.5 w-3.5 text-amber-200" />
        RISK PULSE
      </div>
      <div className="intel-chip bottom-[9%] right-4 hidden sm:flex md:bottom-[11%] md:right-[7%]">
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
          border: 1px solid rgba(103, 232, 249, 0.34);
          background: rgba(2, 8, 23, 0.78);
          box-shadow: 0 0 28px rgba(14, 165, 233, 0.16), inset 0 0 18px rgba(14, 165, 233, 0.06);
          backdrop-filter: blur(14px);
          color: rgba(224, 242, 254, 0.92);
          padding: 0.48rem 0.72rem;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.18em;
        }

        .hero-hud {
          position: absolute;
          border: 1px solid rgba(103, 232, 249, 0.28);
          background: linear-gradient(135deg, rgba(2, 8, 23, 0.9), rgba(8, 47, 73, 0.58));
          box-shadow: 0 0 36px rgba(14, 165, 233, 0.16), inset 0 0 24px rgba(14, 165, 233, 0.06);
          backdrop-filter: blur(18px);
          padding: 0.9rem;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .risk-bar {
          display: block;
          height: 1rem;
          background: linear-gradient(180deg, rgba(253, 230, 138, 0.9), rgba(245, 158, 11, 0.42));
        }

        .signal-dot {
          position: absolute;
          height: 0.42rem;
          width: 0.42rem;
          background: #67e8f9;
          box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.48), 0 0 20px rgba(103, 232, 249, 0.72);
          animation: signal-ping 2.8s ease-out infinite;
        }

        @keyframes signal-ping {
          0% {
            box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.48), 0 0 20px rgba(103, 232, 249, 0.72);
            transform: scale(0.9);
          }
          80% {
            box-shadow: 0 0 0 22px rgba(103, 232, 249, 0), 0 0 20px rgba(103, 232, 249, 0.72);
            transform: scale(1.08);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(103, 232, 249, 0), 0 0 20px rgba(103, 232, 249, 0.72);
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
    const timeout = window.setTimeout(() => setVisible(false), 1400)
    return () => window.clearTimeout(timeout)
  }, [])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(14,165,233,0.18),transparent_38%)]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 border border-cyan-300/20 animate-[arrival-ring_1.4s_ease-out_forwards]">
        <div className="absolute inset-10 border border-cyan-300/15" />
        <div className="absolute left-1/2 top-1/2 h-36 w-px origin-bottom -translate-x-1/2 -translate-y-full bg-gradient-to-t from-cyan-300 to-transparent animate-[arrival-sweep_1.1s_linear_infinite]" />
      </div>
      <div className="absolute left-1/2 top-[58%] flex -translate-x-1/2 items-center gap-3 border border-cyan-300/25 bg-slate-950/70 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-[0_0_32px_rgba(34,211,238,0.16)]">
        <Satellite className="h-4 w-4" />
        Map context loading
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
            transform: translate(-50%, -50%) scale(1.35);
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
