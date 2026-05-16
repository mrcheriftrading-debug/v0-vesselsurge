"use client"

import { useEffect, useState } from "react"
import { Activity, Anchor, Radio, Satellite, Ship, Waves } from "lucide-react"

export function FloatingIntelSignals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="hero-hud left-4 top-[18%] w-[13rem] md:left-[5%] md:top-[22%]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-cyan-100">
            <Satellite className="h-4 w-4 text-cyan-300" />
            LIVE INTEL
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.95)]" />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cyan-950">
          <div className="h-full w-3/4 animate-[hud-load_2.6s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[0.58rem] text-cyan-100/70">
          <span>31 reports</span>
          <span>18 src</span>
          <span>4 zones</span>
        </div>
      </div>
      <div className="hero-hud right-4 top-[20%] w-[12rem] md:right-[5%] md:top-[24%]">
        <div className="flex items-center gap-2 text-red-100">
          <Activity className="h-4 w-4 text-red-300" />
          HORMUZ CRITICAL
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span key={bar} className="risk-bar" style={{ animationDelay: `${bar * 0.12}s` }} />
          ))}
        </div>
      </div>
      <div className="intel-chip left-3 top-[58%] flex md:left-[7%] md:top-[28%]">
        <Radio className="h-3.5 w-3.5 text-cyan-300" />
        AIS TRACKING
      </div>
      <div className="intel-chip right-3 top-[58%] flex md:right-[8%] md:top-[33%]">
        <Satellite className="h-3.5 w-3.5 text-emerald-300" />
        SATELLITE LOCK
      </div>
      <div className="intel-chip bottom-[17%] left-4 flex md:bottom-[22%] md:left-[12%]">
        <Activity className="h-3.5 w-3.5 text-red-300" />
        RISK PULSE
      </div>
      <div className="intel-chip bottom-[17%] right-4 flex md:bottom-[18%] md:right-[13%]">
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
          border: 1px solid rgba(103, 232, 249, 0.42);
          background: rgba(2, 8, 23, 0.84);
          box-shadow: 0 0 44px rgba(14, 165, 233, 0.24), inset 0 0 22px rgba(14, 165, 233, 0.08);
          backdrop-filter: blur(14px);
          color: rgba(224, 242, 254, 0.96);
          border-radius: 999px;
          padding: 0.48rem 0.72rem;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          animation: intel-float 6s ease-in-out infinite;
        }

        .hero-hud {
          position: absolute;
          border: 1px solid rgba(103, 232, 249, 0.36);
          border-radius: 1rem;
          background: linear-gradient(135deg, rgba(2, 8, 23, 0.92), rgba(8, 47, 73, 0.72));
          box-shadow: 0 0 54px rgba(14, 165, 233, 0.22), inset 0 0 32px rgba(14, 165, 233, 0.08);
          backdrop-filter: blur(18px);
          padding: 0.9rem;
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          animation: hud-pop 4.8s ease-in-out infinite;
        }

        .risk-bar {
          height: 2rem;
          border-radius: 999px;
          background: linear-gradient(180deg, #fecaca, #ef4444);
          box-shadow: 0 0 18px rgba(239, 68, 68, 0.45);
          animation: risk-eq 0.9s ease-in-out infinite alternate;
        }

        @keyframes hud-load {
          0%,
          100% {
            transform: translateX(-38%);
          }
          50% {
            transform: translateX(38%);
          }
        }

        @keyframes hud-pop {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-0.55rem) scale(1.02);
          }
        }

        @keyframes risk-eq {
          from {
            transform: scaleY(0.35);
            opacity: 0.62;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
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
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 overflow-hidden border-t border-cyan-300/20 bg-gradient-to-t from-slate-950/85 to-transparent" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80" />
      <div className="absolute left-0 top-7 flex animate-[command-drift_18s_linear_infinite] gap-12 whitespace-nowrap text-[0.65rem] font-black uppercase tracking-[0.24em] text-cyan-100/80">
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
