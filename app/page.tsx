"use client"

import Link from "next/link"
import { useState } from "react"
import { Zap, Target, Shield, Rocket, ArrowRight, Users, Globe, CheckCircle2, Linkedin, ChevronRight } from "lucide-react"
import { PartnershipForm } from "@/components/partnership-form"
import { Logo } from "@/components/logo"

export default function VesselSurgePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" role="navigation" aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Logo width={140} height={45} priority={true} />
          
          <div className="hidden items-center gap-8 md:flex" role="menubar">
            <a href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" role="menuitem">About</a>
            <a href="#partners" className="text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" role="menuitem">Benefits</a>
            <Link href="/map-dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" role="menuitem">Live Map</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Log In</Link>
            <a 
              href="#surge-form" 
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 neon-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Join Network
            </a>
          </div>
        </div>
      </nav>

      <main id="main-content" role="main" aria-label="Main content">
        {/* Hero Section */}
        <section className="relative min-h-screen overflow-hidden pt-16">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,119,255,0.15),transparent_70%)]" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `linear-gradient(rgba(0,119,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,119,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />

          <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 text-center lg:px-8">
            {/* Technical Label */}
            <div className="mb-8 font-mono text-xs tracking-[0.3em] text-accent">
              // MARITIME B2B NETWORK
            </div>

            {/* Main Headline */}
            <h1 className="max-w-5xl text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Accelerate Your{" "}
              <span className="text-primary text-glow-blue">Maritime Edge</span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-8 max-w-3xl text-lg text-muted-foreground md:text-xl">
              Stop searching, start scaling. VesselSurge is the premier B2B ecosystem where vessel owners, technical innovators, and global logistics leaders unite. We drive the next wave of maritime excellence.
            </p>

            {/* CTAs */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <a 
                href="#surge-form"
                className="group flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 neon-blue"
              >
                JOIN THE NETWORK
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="#partners"
                className="flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/10 px-8 py-4 text-base font-semibold text-accent transition-all hover:bg-accent/20"
              >
                WHY JOIN US
              </a>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-xs uppercase tracking-wider">Scroll</span>
                <div className="h-12 w-px bg-gradient-to-b from-primary to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="border-t border-border bg-card py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              {/* Content */}
              <div>
                <div className="mb-4 font-mono text-xs tracking-[0.2em] text-accent">
                  // STRATEGIC NARRATIVE
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
                  The Nexus of Maritime{" "}
                  <span className="text-primary">Collaboration</span>
                </h2>
                <p className="mt-6 text-lg text-muted-foreground">
                  VesselSurge bridges the gap between ambition and execution. We connect forward-thinking vessel owners with cutting-edge technology providers, sustainable solutions, and global logistics networks.
                </p>

                {/* Three Pillars */}
                <div className="mt-12 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Precision Matching</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        AI-powered algorithms connect you with partners that align perfectly with your operational needs and growth objectives.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                      <Shield className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Verified Network</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Every partner undergoes rigorous vetting. Work with confidence knowing you are dealing with industry-verified professionals.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#00E676]/10 border border-[#00E676]/20">
                      <Rocket className="h-6 w-6 text-[#00E676]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Innovation First</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Access the latest in maritime technology, from digital transformation to green shipping solutions and autonomous systems.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual */}
              <div className="relative">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-card to-accent/20 p-1">
                  <div className="glass h-full w-full rounded-3xl p-8 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-background/50 p-6 text-center">
                        <div className="text-4xl font-bold text-primary">500+</div>
                        <div className="mt-2 text-sm text-muted-foreground">Active Partners</div>
                      </div>
                      <div className="rounded-2xl bg-background/50 p-6 text-center">
                        <div className="text-4xl font-bold text-accent">45+</div>
                        <div className="mt-2 text-sm text-muted-foreground">Countries</div>
                      </div>
                      <div className="rounded-2xl bg-background/50 p-6 text-center">
                        <div className="text-4xl font-bold text-[#00E676]">$2.5B</div>
                        <div className="mt-2 text-sm text-muted-foreground">Deals Facilitated</div>
                      </div>
                      <div className="rounded-2xl bg-background/50 p-6 text-center">
                        <div className="text-4xl font-bold text-[#FFB800]">98%</div>
                        <div className="mt-2 text-sm text-muted-foreground">Satisfaction</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Join Section */}
        <section id="partners" className="border-t border-border bg-background py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <div className="mb-4 font-mono text-xs tracking-[0.2em] text-accent">
                // WHY CHOOSE US
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                Why Join VesselSurge?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Be among the first to access the maritime industry&apos;s most powerful B2B network. Early members receive exclusive benefits and priority matching.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Rocket className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Early Adopter Advantage</h3>
                <p className="mt-2 text-sm text-muted-foreground">Get priority placement and exclusive features as a founding member of the network.</p>
              </div>
              <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Smart Matching</h3>
                <p className="mt-2 text-sm text-muted-foreground">Our AI connects you with partners that perfectly match your business needs and goals.</p>
              </div>
              <div className="rounded-2xl border border-[#00E676]/20 bg-gradient-to-br from-[#00E676]/5 to-transparent p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E676]/20 text-[#00E676]">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Global Reach</h3>
                <p className="mt-2 text-sm text-muted-foreground">Expand your operations internationally with our worldwide network of verified partners.</p>
              </div>
              <div className="rounded-2xl border border-[#FFB800]/20 bg-gradient-to-br from-[#FFB800]/5 to-transparent p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB800]/20 text-[#FFB800]">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Verified Network</h3>
                <p className="mt-2 text-sm text-muted-foreground">Every member is vetted. Work confidently with trusted industry professionals.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Real-Time Intelligence</h3>
                <p className="mt-2 text-sm text-muted-foreground">Access live maritime data, market insights, and operational analytics in one platform.</p>
              </div>
              <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Zero Platform Fees</h3>
                <p className="mt-2 text-sm text-muted-foreground">For early adopters: no subscription fees during our launch phase. Join now and lock in benefits.</p>
              </div>
            </div>

            {/* How It Works - Brokerage Model */}
            <div className="mt-20">
              <div className="text-center mb-12">
                <div className="mb-4 font-mono text-xs tracking-[0.2em] text-primary">
                  // HOW IT WORKS
                </div>
                <h3 className="text-2xl font-bold text-foreground lg:text-3xl">
                  We Connect You With The Right Partners
                </h3>
                <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                  Tell us what you need, and we personally match you with verified partners. No algorithms, no waiting - direct human assistance.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* For Vessel Companies */}
                <div className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-transparent p-8 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 text-xs font-medium text-primary mb-6">
                      <Users className="h-3.5 w-3.5" />
                      FOR VESSEL COMPANIES
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Looking for Customers?</h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      You have vessels ready to move cargo. We connect you with verified cargo owners and logistics companies actively looking for shipping capacity. Expand your customer base without the hassle of cold outreach.
                    </p>
                    <ul className="mt-6 space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">Submit your vessel details and routes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">We personally match you with cargo owners</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">Get direct introductions to qualified clients</span>
                      </li>
                    </ul>
                    <a href="#surge-form" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                      List My Vessel
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* For Cargo/Logistics Companies */}
                <div className="group relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-transparent p-8 transition-all hover:border-accent/50 hover:shadow-xl hover:shadow-cyan-500/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/30 px-4 py-1.5 text-xs font-medium text-accent mb-6">
                      <Globe className="h-3.5 w-3.5" />
                      FOR CARGO COMPANIES
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">Need Shipping Capacity?</h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      You have cargo that needs to move. We connect you with reliable vessel operators who have the capacity and routes you need. Skip the search and get matched with verified shipping partners.
                    </p>
                    <ul className="mt-6 space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">Tell us your shipping requirements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">We find vessels matching your routes and cargo type</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">Receive curated vessel options with direct contact</span>
                      </li>
                    </ul>
                    <a href="#surge-form" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90">
                      Find Vessels
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Step Form Section */}
        <section id="surge-form" className="border-t border-border bg-card py-24">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <div className="text-center mb-12">
              <div className="mb-4 font-mono text-xs tracking-[0.2em] text-accent">
                // JOIN THE SURGE
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                Start Your Partnership Journey
              </h2>
              <p className="mt-4 text-muted-foreground">
                Complete this quick form to join our verified network of maritime leaders
              </p>
            </div>

            <PartnershipForm />
          </div>
        </section>

        {/* CTA to Live Map */}
        <section className="border-t border-border bg-background py-16">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="glass rounded-2xl p-8 md:p-12 text-center">
              <h3 className="text-2xl font-bold text-foreground">Real-Time Maritime Intelligence</h3>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Access our live surveillance dashboard to monitor vessel traffic, track movements, and stay informed on regional developments.
              </p>
              <Link 
                href="/map-dashboard"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 neon-blue"
              >
                Open Live Dashboard
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card py-12" role="contentinfo" aria-label="Site footer">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <Logo width={120} height={40} priority={false} />
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Terms</a>
                <a 
                  href="https://x.com/vesselsurge" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label="Follow VesselSurge on X (Twitter)"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com/company/vesselsurge" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  aria-label="Connect with VesselSurge on LinkedIn"
                >
                  <Linkedin className="h-5 w-5" aria-hidden="true" />
                </a>
              </div>

              <div className="text-sm text-muted-foreground">
                &copy; 2026 VesselSurge. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
