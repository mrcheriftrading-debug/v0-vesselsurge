import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Globe2, ShieldCheck, Target, Zap } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"

const BASE_URL = "https://www.vesselsurge.com"

export const metadata: Metadata = {
  title: "About VesselSurge | Live Maritime Intelligence and Chokepoint Monitoring",
  description:
    "Learn how VesselSurge combines live maritime intelligence, critical chokepoint monitoring, source-reviewed shipping risk and B2B vessel-cargo matching.",
  alternates: { canonical: `${BASE_URL}/about` },
  keywords: [
    "about VesselSurge",
    "maritime intelligence platform",
    "shipping chokepoint monitoring",
    "vessel tracking platform",
    "maritime risk intelligence",
    "cargo vessel network",
  ],
  openGraph: {
    type: "website",
    url: `${BASE_URL}/about`,
    siteName: "VesselSurge",
    title: "About VesselSurge | Maritime Intelligence for Critical Routes",
    description:
      "VesselSurge organizes maritime risk, live map context and cargo-vessel network flows for faster shipping decisions.",
    images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "About VesselSurge maritime intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About VesselSurge",
    description: "Live maritime intelligence, chokepoint monitoring and cargo-vessel network flows.",
    images: [`${BASE_URL}/og-image.jpg`],
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <div className="mb-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">About VesselSurge</div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                A cleaner operating layer for maritime decisions.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                VesselSurge combines live maritime intelligence, chokepoint monitoring, and B2B vessel matching into a simple product structure that teams can understand quickly.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/intelligence" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Explore Intelligence <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/network" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.04]">
                  Join Network
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Live", text: "Designed around changing maritime risk.", icon: Zap },
              { title: "Global", text: "Focused on critical routes and chokepoints.", icon: Globe2 },
              { title: "Trusted", text: "Source review and confidence matter.", icon: ShieldCheck },
              { title: "Practical", text: "Built for decisions, not noise.", icon: Target },
            ].map(({ title, text, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-border bg-card/50 p-5">
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="mt-5 text-xl font-bold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Why the site is now split into pages.</h2>
              <p className="mt-3 text-muted-foreground">
                A professional maritime product should let visitors choose their intent immediately: monitor the map, read intelligence, join the network, or learn about the company.
              </p>
            </div>
            <div className="grid gap-3">
              {["Home introduces the product.", "Intelligence explains reports and risk.", "Live Map handles operational monitoring.", "Network handles onboarding and matching."].map((item) => (
                <div key={item} className="rounded-lg border border-border bg-background/50 p-4 text-sm font-semibold text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
