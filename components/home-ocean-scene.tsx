"use client"

import dynamic from "next/dynamic"

const HeroOceanScene = dynamic(
  () => import("@/components/three/maritime-3d-scenes").then((mod) => mod.HeroOceanScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full w-full bg-[radial-gradient(circle_at_50%_38%,rgba(14,165,233,0.20),transparent_34%),linear-gradient(180deg,transparent,rgba(8,47,73,0.36))]"
        aria-hidden="true"
      />
    ),
  },
)

export function HomeOceanScene() {
  return <HeroOceanScene />
}
