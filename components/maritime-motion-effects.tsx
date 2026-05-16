"use client"

import { useEffect, useState } from "react"
import { Activity, Anchor, Radio, Satellite, Ship, Waves } from "lucide-react"

type Button3DEffectVariant = "cargo" | "vessel" | "map" | "dashboard"

export function Button3DEffect({ variant }: { variant: Button3DEffectVariant }) {
  return (
    <span className={`button-3d-fx button-3d-${variant}`} aria-hidden="true">
      <span className="button-3d-shine" />
      <span className="button-3d-depth" />
      {variant === "cargo" && (
        <span className="cargo-stack">
          <span />
          <span />
          <span />
        </span>
      )}
      {variant === "vessel" && (
        <span className="vessel-scene">
          <span className="vessel-hull" />
          <span className="vessel-bridge" />
          <span className="vessel-wake" />
        </span>
      )}
      {variant === "map" && (
        <span className="radar-scene">
          <span className="radar-ring" />
          <span className="radar-ring radar-ring-two" />
          <span className="radar-sweep" />
          <span className="radar-dot" />
        </span>
      )}
      {variant === "dashboard" && (
        <span className="dashboard-scene">
          <span className="dash-panel dash-panel-one" />
          <span className="dash-panel dash-panel-two" />
          <span className="dash-panel dash-panel-three" />
        </span>
      )}
      <style jsx>{`
        .button-3d-fx {
          pointer-events: none;
          position: relative;
          z-index: 30;
          display: inline-block;
          flex: 0 0 auto;
          height: 2.25rem;
          width: 4.8rem;
          margin-left: 0.35rem;
          overflow: hidden;
          border-radius: 0.55rem;
          border: 1px solid rgba(255, 255, 255, 0.28);
          perspective: 420px;
          transform-style: preserve-3d;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(8, 47, 73, 0.78));
          box-shadow: inset 0 0 16px rgba(255, 255, 255, 0.16), 0 0 18px rgba(34, 211, 238, 0.28);
        }

        .button-3d-cargo {
          border-color: rgba(250, 204, 21, 0.72);
          box-shadow: inset 0 0 16px rgba(250, 204, 21, 0.22), 0 0 22px rgba(245, 158, 11, 0.5);
        }

        .button-3d-vessel {
          border-color: rgba(125, 211, 252, 0.78);
          box-shadow: inset 0 0 16px rgba(125, 211, 252, 0.22), 0 0 22px rgba(56, 189, 248, 0.5);
        }

        .button-3d-map {
          border-color: rgba(45, 212, 191, 0.82);
          box-shadow: inset 0 0 16px rgba(45, 212, 191, 0.22), 0 0 24px rgba(20, 184, 166, 0.52);
        }

        .button-3d-dashboard {
          border-color: rgba(147, 197, 253, 0.82);
          box-shadow: inset 0 0 16px rgba(147, 197, 253, 0.24), 0 0 24px rgba(59, 130, 246, 0.55);
        }

        .button-3d-shine {
          position: absolute;
          inset: -45% -25%;
          background: linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.34), transparent 58%);
          opacity: 0;
          transform: translateX(-55%) rotate(8deg);
          transition: opacity 0.25s ease;
        }

        :global(a:hover) .button-3d-shine,
        :global(button:hover) .button-3d-shine {
          animation: button-shine 0.85s ease forwards;
          opacity: 1;
        }

        .button-3d-depth {
          position: absolute;
          inset: 0.18rem;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: inherit;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -12px 22px rgba(0, 0, 0, 0.2);
          transform: translateZ(18px);
        }

        .cargo-stack {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(2, 1.28rem);
          gap: 0.18rem;
          transform: translateY(-50%) rotateZ(-10deg) translateZ(28px);
          transform-origin: center;
          animation: cargo-lift 2.7s ease-in-out infinite;
        }

        .cargo-stack span {
          height: 0.82rem;
          border-radius: 0.12rem;
          background: linear-gradient(135deg, #fde68a, #f59e0b);
          box-shadow: 0 0 18px rgba(245, 158, 11, 0.62);
        }

        .cargo-stack span:nth-child(3) {
          grid-column: 1 / 3;
          width: 1.78rem;
          justify-self: center;
          background: linear-gradient(135deg, #bbf7d0, #10b981);
          box-shadow: 0 0 18px rgba(16, 185, 129, 0.62);
        }

        .vessel-scene {
          position: absolute;
          right: 0.58rem;
          top: 50%;
          z-index: 2;
          height: 1.82rem;
          width: 3.95rem;
          transform: translateY(-50%) rotateZ(-5deg) translateZ(30px);
          animation: vessel-drive 2.4s ease-in-out infinite;
        }

        .vessel-hull {
          position: absolute;
          bottom: 0.2rem;
          left: 0.25rem;
          height: 0.64rem;
          width: 3.15rem;
          border-radius: 0.18rem 0.65rem 0.65rem 0.18rem;
          background: linear-gradient(90deg, #f8fafc, #38bdf8 52%, #0f172a);
          box-shadow: 0 0 22px rgba(56, 189, 248, 0.72);
        }

        .vessel-bridge {
          position: absolute;
          bottom: 0.62rem;
          left: 0.62rem;
          height: 0.62rem;
          width: 1.12rem;
          border-radius: 0.12rem;
          background: linear-gradient(135deg, #ffffff, #bae6fd);
          box-shadow: 0 0 12px rgba(186, 230, 253, 0.7);
        }

        .vessel-wake {
          position: absolute;
          bottom: 0.05rem;
          left: -0.2rem;
          height: 0.28rem;
          width: 2.2rem;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(224, 242, 254, 0.95), transparent);
          filter: blur(1px);
          animation: wake-stream 1.1s linear infinite;
        }

        .radar-scene {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          z-index: 2;
          height: 2.65rem;
          width: 2.65rem;
          transform: translateY(-50%) translateZ(30px);
          transform-style: preserve-3d;
        }

        .radar-ring {
          position: absolute;
          inset: 0.18rem;
          border: 2px solid rgba(103, 232, 249, 0.9);
          border-radius: 999px;
          box-shadow: 0 0 24px rgba(34, 211, 238, 0.55);
          animation: radar-pulse 1.8s ease-out infinite;
        }

        .radar-ring-two {
          inset: 0.52rem;
          animation-delay: -0.7s;
        }

        .radar-sweep {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 1rem;
          width: 1px;
          transform-origin: bottom;
          background: linear-gradient(to top, #67e8f9, transparent);
          animation: radar-spin 1.45s linear infinite;
        }

        .radar-dot {
          position: absolute;
          right: 0.42rem;
          top: 0.7rem;
          height: 0.42rem;
          width: 0.42rem;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.9);
        }

        .dashboard-scene {
          position: absolute;
          right: 0.9rem;
          top: 50%;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 0.78rem);
          align-items: end;
          gap: 0.2rem;
          transform: translateY(-50%) rotateZ(-8deg) translateZ(30px);
        }

        .dash-panel {
          display: block;
          width: 0.78rem;
          border-radius: 0.12rem 0.12rem 0 0;
          background: linear-gradient(180deg, #bae6fd, #2563eb);
          box-shadow: 0 0 18px rgba(59, 130, 246, 0.75);
          animation: dash-eq 0.9s ease-in-out infinite alternate;
        }

        .dash-panel-one {
          height: 0.7rem;
        }

        .dash-panel-two {
          height: 1.25rem;
          animation-delay: -0.24s;
        }

        .dash-panel-three {
          height: 0.95rem;
          animation-delay: -0.48s;
        }

        @keyframes button-shine {
          to {
            transform: translateX(55%) rotate(8deg);
          }
        }

        @keyframes cargo-lift {
          50% {
            transform: translateY(-50%) rotateZ(-10deg) translate3d(-0.12rem, -0.16rem, 38px);
          }
        }

        @keyframes vessel-drive {
          50% {
            transform: translateY(-50%) rotateZ(-5deg) translate3d(-0.22rem, -0.08rem, 38px);
          }
        }

        @keyframes wake-stream {
          to {
            transform: translateX(-0.5rem);
            opacity: 0.2;
          }
        }

        @keyframes radar-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes radar-pulse {
          0% {
            opacity: 1;
            transform: scale(0.78);
          }
          100% {
            opacity: 0.22;
            transform: scale(1.18);
          }
        }

        @keyframes dash-eq {
          to {
            transform: scaleY(0.45);
            opacity: 0.72;
          }
        }
      `}</style>
    </span>
  )
}

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
