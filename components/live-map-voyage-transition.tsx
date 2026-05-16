"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Anchor, Navigation, Radar, Waves } from "lucide-react"

interface LiveMapVoyageTransitionProps {
  active: boolean
}

function RealisticVoyageShip() {
  return (
    <svg viewBox="0 0 720 300" className="h-full w-full drop-shadow-[0_30px_55px_rgba(34,211,238,0.26)]" role="img" aria-label="Container vessel sailing">
      <defs>
        <linearGradient id="shipHull" x1="100" y1="155" x2="620" y2="255" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#172033" />
          <stop offset="0.34" stopColor="#27364d" />
          <stop offset="0.72" stopColor="#111827" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="shipDeck" x1="160" y1="90" x2="590" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="0.58" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="shipWater" x1="0" y1="230" x2="720" y2="275" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0891b2" stopOpacity="0" />
          <stop offset="0.48" stopColor="#67e8f9" stopOpacity="0.72" />
          <stop offset="1" stopColor="#0891b2" stopOpacity="0" />
        </linearGradient>
        <filter id="shipGlow" x="-20%" y="-30%" width="140%" height="170%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.14 0 0 0 0 0.83 0 0 0 0 0.92 0 0 0 0.45 0" />
          <feBlend in="SourceGraphic" />
        </filter>
      </defs>

      <g filter="url(#shipGlow)">
        <path d="M82 198 C130 187 193 182 258 184 L612 190 C585 232 547 255 490 260 L186 252 C137 248 103 229 82 198Z" fill="url(#shipHull)" />
        <path d="M113 202 C160 210 243 214 357 214 C463 214 544 207 596 194 C577 215 546 232 494 237 L193 231 C151 228 125 218 113 202Z" fill="#0f172a" opacity="0.9" />
        <path d="M139 184 L599 190 L616 175 L170 165 C147 166 132 173 139 184Z" fill="url(#shipDeck)" />

        <g>
          <rect x="188" y="121" width="48" height="34" rx="4" fill="#f97316" />
          <rect x="242" y="116" width="48" height="39" rx="4" fill="#0ea5e9" />
          <rect x="296" y="126" width="48" height="29" rx="4" fill="#22c55e" />
          <rect x="350" y="112" width="48" height="43" rx="4" fill="#facc15" />
          <rect x="404" y="123" width="48" height="32" rx="4" fill="#ef4444" />
          <rect x="458" y="116" width="48" height="39" rx="4" fill="#38bdf8" />
          <rect x="215" y="82" width="48" height="32" rx="4" fill="#38bdf8" />
          <rect x="269" y="78" width="48" height="36" rx="4" fill="#fb7185" />
          <rect x="323" y="88" width="48" height="26" rx="4" fill="#a3e635" />
          <rect x="377" y="76" width="48" height="38" rx="4" fill="#f59e0b" />
          <path d="M188 133 H506 M188 145 H506 M236 121 V155 M290 116 V155 M344 126 V155 M398 112 V155 M452 123 V155" stroke="#0f172a" strokeOpacity="0.22" strokeWidth="2" />
        </g>

        <g>
          <path d="M520 88 L599 101 L612 164 L498 158 L506 108 C508 95 512 89 520 88Z" fill="#f8fafc" />
          <path d="M528 103 L585 112 L590 133 L520 128Z" fill="#0f172a" opacity="0.86" />
          <path d="M521 137 L596 141 L599 153 L515 151Z" fill="#0ea5e9" opacity="0.65" />
          <rect x="552" y="53" width="13" height="43" rx="3" fill="#e2e8f0" />
          <path d="M543 51 H574 L581 68 H536Z" fill="#cbd5e1" />
          <path d="M565 58 C588 50 607 53 625 63" stroke="#67e8f9" strokeWidth="5" strokeLinecap="round" opacity="0.42" />
        </g>

        <path d="M96 205 C54 215 28 235 9 260 C61 249 119 244 179 249" fill="none" stroke="url(#shipWater)" strokeWidth="9" strokeLinecap="round" opacity="0.72" />
        <path d="M168 255 C238 275 389 281 520 262 C567 255 614 253 682 265" fill="none" stroke="url(#shipWater)" strokeWidth="8" strokeLinecap="round" opacity="0.64" />
        <path d="M179 270 C275 289 425 293 570 276" fill="none" stroke="#e0faff" strokeWidth="3" strokeLinecap="round" opacity="0.42" />
      </g>
    </svg>
  )
}

export function LiveMapVoyageTransition({ active }: LiveMapVoyageTransitionProps) {
  const router = useRouter()

  useEffect(() => {
    if (!active) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timeout = window.setTimeout(() => {
      router.push("/map-dashboard")
    }, prefersReducedMotion ? 1800 : 3100)

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

      <div className="absolute left-[-32rem] top-[43%] w-[38rem] max-w-[78vw] animate-[voyage-ship_2.8s_linear_forwards] md:w-[46rem]">
        <div className="relative">
          <div className="absolute inset-x-8 bottom-6 h-24 rounded-[50%] bg-cyan-400/20 blur-3xl" />
          <div className="absolute left-[58%] top-8 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-200/30 bg-slate-950/85 px-3 py-1 text-xs font-bold text-cyan-100 backdrop-blur">
            <Anchor className="h-3.5 w-3.5" />
            VS-INTEL
          </div>
          <RealisticVoyageShip />
          <div className="-mt-8 flex items-center justify-center gap-3 text-cyan-100">
            <Waves className="h-6 w-6 animate-pulse" />
            <Navigation className="h-5 w-5" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes voyage-ship {
          0% {
            transform: translate3d(0, 38px, 0) rotate(-3deg) scale(0.82);
          }
          52% {
            transform: translate3d(38vw, -10px, 0) rotate(1deg) scale(1.04);
          }
          100% {
            transform: translate3d(calc(100vw + 44rem), -28px, 0) rotate(2deg) scale(0.9);
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
