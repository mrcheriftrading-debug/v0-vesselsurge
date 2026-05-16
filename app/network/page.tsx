import { CheckCircle2, Globe, Target, Users } from "lucide-react"
import { PartnershipForm } from "@/components/partnership-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="mb-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">B2B Network</div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Vessel and cargo matching on its own focused page.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                Companies should not hunt through the homepage to join. This page explains the network and leads directly into onboarding.
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
      <SiteFooter />
    </div>
  )
}
