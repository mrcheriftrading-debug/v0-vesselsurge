import type { Metadata } from "next"
import { CheckCircle2, Globe, Target, Users } from "lucide-react"
import { PartnershipForm } from "@/components/partnership-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"

const BASE_URL = "https://www.vesselsurge.com"

export const metadata: Metadata = {
  title: "Maritime B2B Network for Cargo, Vessel Capacity and Shipping Partners",
  description:
    "Join VesselSurge's maritime B2B network to submit cargo requirements, vessel capacity, routes and timing for cleaner cargo-vessel matching and partner introductions.",
  alternates: { canonical: `${BASE_URL}/network` },
  keywords: [
    "maritime B2B network",
    "find cargo for vessel",
    "find vessel for cargo",
    "cargo vessel matching",
    "shipping partners",
    "vessel capacity",
    "cargo charter matching",
    "maritime marketplace",
  ],
  openGraph: {
    type: "website",
    url: `${BASE_URL}/network`,
    siteName: "VesselSurge",
    title: "VesselSurge Network | Cargo and Vessel Capacity Matching",
    description:
      "Submit cargo requirements or vessel capacity and build cleaner maritime partner introductions.",
    images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "VesselSurge maritime network" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maritime B2B Network | VesselSurge",
    description: "Cargo-vessel matching, route intake and partner introductions for maritime teams.",
    images: [`${BASE_URL}/og-image.jpg`],
  },
}

export default function NetworkPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}/network#service`,
    name: "VesselSurge Maritime B2B Network",
    url: `${BASE_URL}/network`,
    provider: { "@id": `${BASE_URL}/#organization` },
    serviceType: "Cargo and vessel capacity matching intake",
    areaServed: "Worldwide",
    description:
      "A maritime B2B intake service for cargo teams and vessel operators to submit route, cargo, timing and capacity requirements for cleaner partner introductions.",
    audience: [
      { "@type": "BusinessAudience", audienceType: "Vessel owners" },
      { "@type": "BusinessAudience", audienceType: "Cargo teams" },
      { "@type": "BusinessAudience", audienceType: "Charterers" },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="mb-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">B2B Network</div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Find cargo or vessel capacity without cold outreach.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                VesselSurge helps cargo teams and vessel operators create clearer introductions around route, cargo type, timing, and available capacity.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Vessel companies", text: "List available capacity and routes.", icon: Users },
                { title: "Cargo companies", text: "Request shipping capacity and matches.", icon: Globe },
                { title: "Verified partners", text: "Cleaner onboarding and review flow.", icon: CheckCircle2 },
                { title: "Smart matching", text: "Route, cargo type, and availability fit.", icon: Target },
              ].map(({ title, text, icon: Icon }) => (
                <div key={title} className="rounded-xl border border-border bg-card/60 p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="mt-4 font-bold text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-6 sm:p-8">
              <div className="mb-5 inline-flex rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">For vessel companies</div>
              <h2 className="text-2xl font-bold text-foreground">Looking for customers?</h2>
              <p className="mt-3 text-muted-foreground">Submit vessel details, active routes, and preferred cargo types. VesselSurge helps connect you with cargo owners looking for capacity.</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Add vessel and route information</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Receive relevant cargo introductions</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> Build repeat relationships faster</li>
              </ul>
            </div>
            <div className="rounded-xl border border-accent/25 bg-accent/10 p-6 sm:p-8">
              <div className="mb-5 inline-flex rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent">For cargo companies</div>
              <h2 className="text-2xl font-bold text-foreground">Need shipping capacity?</h2>
              <p className="mt-3 text-muted-foreground">Share cargo requirements, ports, dates, and constraints. VesselSurge helps narrow down vessel options and introduces relevant operators.</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> Submit cargo requirements</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> Compare matched vessel options</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> Move from search to contact faster</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="surge-form" className="border-t border-border bg-card px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <div className="mb-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Join The Network</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Start your partnership journey</h2>
              <p className="mt-3 text-muted-foreground">A focused form for companies that want cargo, vessels, partners, or market access.</p>
            </div>
            <PartnershipForm />
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteFooter />
    </div>
  )
}
