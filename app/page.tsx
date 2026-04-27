"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Zap, Target, Shield, Rocket, ArrowRight, Users, Globe, CheckCircle2, Linkedin, ChevronRight, Menu, X } from "lucide-react"
import { PartnershipForm } from "@/components/partnership-form"
import { FeatureCard } from "@/components/ui/feature-card"
import { SectionHeader } from "@/components/ui/section-header"
import { StatCard } from "@/components/ui/stat-card"
import { cn } from "@/lib/utils"

// Hook for scroll-triggered animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

export default function VesselSurgePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroAnimation = useScrollAnimation()
  const intelligenceAnimation = useScrollAnimation()
  const aboutAnimation = useScrollAnimation()
  const partnersAnimation = useScrollAnimation()

  // Smooth scroll handler
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary neon-blue transition-transform duration-300 hover:scale-105">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">VesselSurge</span>
          </div>
          
          <div className="hidden items-center gap-8 md:flex">
            <a 
              href="#about" 
              onClick={(e) => handleSmoothScroll(e, "about")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-md px-2 py-1"
            >
              About
            </a>
            <a 
              href="#partners" 
              onClick={(e) => handleSmoothScroll(e, "partners")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-md px-2 py-1"
            >
              Benefits
            </a>
            <Link 
              href="/map-dashboard" 
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-md px-2 py-1"
            >
              Live Map
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login" 
              className="hidden sm:block text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-md px-2 py-1"
            >
              Log In
            </Link>
            <a 
              href="#surge-form" 
              onClick={(e) => handleSmoothScroll(e, "surge-form")}
              className="hidden sm:block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 btn-glow"
            >
              Join Network
            </a>
            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground focus-ring rounded-lg"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={cn(
          "md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="px-4 py-4 space-y-3">
            <a 
              href="#about" 
              onClick={(e) => handleSmoothScroll(e, "about")}
              className="block text-sm text-muted-foreground hover:text-foreground py-2"
            >
              About
            </a>
            <a 
              href="#partners" 
              onClick={(e) => handleSmoothScroll(e, "partners")}
              className="block text-sm text-muted-foreground hover:text-foreground py-2"
            >
              Benefits
            </a>
            <Link href="/map-dashboard" className="block text-sm text-muted-foreground hover:text-foreground py-2">
              Live Map
            </Link>
            <Link href="/auth/login" className="block text-sm text-muted-foreground hover:text-foreground py-2">
              Log In
            </Link>
            <a 
              href="#surge-form" 
              onClick={(e) => handleSmoothScroll(e, "surge-form")}
              className="block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground text-center mt-2"
            >
              Join Network
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section ref={heroAnimation.ref} className="relative min-h-screen overflow-hidden pt-16">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
          <div className="absolute inset-0 gradient-radial-blue" />
          
          {/* Animated dot pattern */}
          <div className="absolute inset-0 dot-pattern-animated opacity-40" />

          <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 text-center lg:px-8">
            {/* Technical Label */}
            <div className={cn(
              "mb-8 font-mono text-xs tracking-[0.3em] text-accent transition-all duration-700",
              heroAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              // MARITIME B2B NETWORK
            </div>

            {/* Main Headline */}
            <h1 className={cn(
              "max-w-5xl text-5xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl text-balance transition-all duration-700 delay-100",
              heroAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              Match Cargo or{" "}
              <span className="text-primary text-glow-blue">Find Vessels</span>
              {" "}with a Trusted Partner.
            </h1>

            {/* Sub-headline */}
            <p className={cn(
              "mt-8 max-w-3xl text-lg text-muted-foreground md:text-xl text-balance transition-all duration-700 delay-200",
              heroAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              Direct connections between vessel owners and cargo charterers. Get live insights into global maritime hotspots, reduce risks, and unlock strategic advantages with real-time market intelligence.
            </p>

            {/* CTAs - Three Button Hierarchy */}
            <div className={cn(
              "mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap items-center justify-center transition-all duration-700 delay-300",
              heroAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <a 
                href="#surge-form"
                onClick={(e) => handleSmoothScroll(e, "surge-form")}
                className="group flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all btn-glow"
              >
                FIND CARGO
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="#surge-form"
                onClick={(e) => handleSmoothScroll(e, "surge-form")}
                className="group flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all btn-glow"
              >
                FIND A VESSEL
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
              <Link 
                href="/map-dashboard"
                className="flex items-center gap-2 rounded-lg border border-accent/50 bg-accent/10 px-8 py-4 text-base font-semibold text-accent transition-all hover:bg-accent/20 hover:border-accent"
              >
                VIEW LIVE MAP & TRAFFIC
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className={cn(
              "absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500",
              heroAnimation.isVisible ? "opacity-100" : "opacity-0"
            )}>
              <div className="flex flex-col items-center gap-2 text-muted-foreground animate-float">
                <span className="text-xs uppercase tracking-wider">Scroll</span>
                <div className="h-12 w-px bg-gradient-to-b from-primary to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Hub Section */}
        <section ref={intelligenceAnimation.ref} className="border-t border-border bg-background py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className={cn(
              "text-center mb-16 transition-all duration-700",
              intelligenceAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <SectionHeader
                label="// INTELLIGENCE HUB"
                title="Navigate Global Maritime Risks with"
                highlight="Real-Time Intelligence"
                description="Monitor critical maritime chokepoints live. Track Hormuz, Red Sea, Malacca, and Suez Canal risks in real-time to make data-driven routing decisions and mitigate exposure."
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <FeatureCard
                icon={Shield}
                title="Safety & Risk Mitigation"
                description="Avoid pirate hotspots, conflict zones, and geopolitical tensions. Our live alerts help you reroute cargo before disruptions hit your bottom line."
                features={[
                  "Real-time threat alerts",
                  "Alternative route recommendations",
                  "Insurance cost optimization"
                ]}
                accentColor="primary"
                className="p-8"
                animationDelay={intelligenceAnimation.isVisible ? 100 : 0}
              />

              <FeatureCard
                icon={Zap}
                title="Strategic Advantage"
                description="Stay ahead of market moves. Access proprietary intelligence on vessel availability, capacity, and pricing across all major routes."
                features={[
                  "Market capacity forecasts",
                  "Rate intelligence reports",
                  "Demand trend analysis"
                ]}
                accentColor="accent"
                className="p-8"
                animationDelay={intelligenceAnimation.isVisible ? 200 : 0}
              />

              <FeatureCard
                icon={Globe}
                title="Live Maritime News"
                description="Stay informed with curated news from global maritime sources. Filter by region, vessel type, and risk category."
                features={[
                  "20+ news sources aggregated",
                  "Region-specific alerts",
                  "Real-time incident tracking"
                ]}
                accentColor="success"
                className="p-8"
                animationDelay={intelligenceAnimation.isVisible ? 300 : 0}
              />
            </div>

            {/* CTA for Live Map */}
            <div className={cn(
              "mt-16 text-center transition-all duration-700 delay-500",
              intelligenceAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Link 
                href="/map-dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all btn-glow"
              >
                EXPLORE LIVE MAP
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
        <section ref={aboutAnimation.ref} id="about" className="border-t border-border bg-card py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              {/* Content */}
              <div className={cn(
                "transition-all duration-700",
                aboutAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}>
                <SectionHeader
                  label="// STRATEGIC NARRATIVE"
                  title="The Nexus of Maritime"
                  highlight="Collaboration"
                  description="VesselSurge bridges the gap between ambition and execution. We connect forward-thinking vessel owners with cutting-edge technology providers, sustainable solutions, and global logistics networks."
                  centered={false}
                />

                {/* Three Pillars */}
                <div className="mt-12 space-y-6">
                  {[
                    { icon: Target, title: "Precision Matching", desc: "AI-powered algorithms connect you with partners that align perfectly with your operational needs and growth objectives.", color: "primary" as const },
                    { icon: Shield, title: "Verified Network", desc: "Every partner undergoes rigorous vetting. Work with confidence knowing you are dealing with industry-verified professionals.", color: "accent" as const },
                    { icon: Rocket, title: "Innovation First", desc: "Access the latest in maritime technology, from digital transformation to green vessel solutions and autonomous systems.", color: "success" as const },
                  ].map((pillar, index) => (
                    <div 
                      key={pillar.title}
                      className={cn(
                        "flex items-start gap-4 group transition-all duration-500",
                        aboutAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      )}
                      style={{ transitionDelay: `${(index + 1) * 150}ms` }}
                    >
                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110",
                        pillar.color === "primary" && "bg-primary/10 border-primary/20",
                        pillar.color === "accent" && "bg-accent/10 border-accent/20",
                        pillar.color === "success" && "bg-[#00E676]/10 border-[#00E676]/20"
                      )}>
                        <pillar.icon className={cn(
                          "h-6 w-6",
                          pillar.color === "primary" && "text-primary",
                          pillar.color === "accent" && "text-accent",
                          pillar.color === "success" && "text-[#00E676]"
                        )} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{pillar.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{pillar.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual */}
              <div className={cn(
                "relative transition-all duration-700 delay-200",
                aboutAnimation.isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              )}>
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-card to-accent/20 p-1">
                  <div className="glass-premium h-full w-full rounded-3xl p-8 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard value="500+" label="Active Partners" color="primary" />
                      <StatCard value="45+" label="Countries" color="accent" />
                      <StatCard value="2.5B" label="Deals Facilitated" color="success" animateNumber={false} />
                      <StatCard value="98%" label="Satisfaction" color="warning" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Join Section */}
        <section ref={partnersAnimation.ref} id="partners" className="border-t border-border bg-background py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className={cn(
              "text-center transition-all duration-700",
              partnersAnimation.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              <SectionHeader
                label="// WHY CHOOSE US"
                title="Why Join VesselSurge?"
                description="Be among the first to access the maritime industry's most powerful B2B network. Early members receive exclusive benefits and priority matching."
              />
            </div>

            {/* Benefits Grid */}
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Rocket}
                title="Early Adopter Advantage"
                description="Get priority placement and exclusive features as a founding member of the network."
                accentColor="primary"
                animationDelay={partnersAnimation.isVisible ? 100 : 0}
              />
              <FeatureCard
                icon={Target}
                title="Smart Matching"
                description="Our AI connects you with partners that perfectly match your business needs and goals."
                accentColor="accent"
                animationDelay={partnersAnimation.isVisible ? 150 : 0}
              />
              <FeatureCard
                icon={Globe}
                title="Global Reach"
                description="Expand your operations internationally with our worldwide network of verified partners."
                accentColor="success"
                animationDelay={partnersAnimation.isVisible ? 200 : 0}
              />
              <FeatureCard
                icon={Shield}
                title="Verified Network"
                description="Every member is vetted. Work confidently with trusted industry professionals."
                accentColor="warning"
                animationDelay={partnersAnimation.isVisible ? 250 : 0}
              />
              <FeatureCard
                icon={Zap}
                title="Real-Time Intelligence"
                description="Access live maritime data, market insights, and operational analytics in one platform."
                accentColor="primary"
                animationDelay={partnersAnimation.isVisible ? 300 : 0}
              />
              <FeatureCard
                icon={Users}
                title="Zero Platform Fees"
                description="For early adopters: no subscription fees during our launch phase. Join now and lock in benefits."
                accentColor="accent"
                animationDelay={partnersAnimation.isVisible ? 350 : 0}
              />
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
        <footer className="border-t border-border bg-card py-12">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">VesselSurge</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  <Linkedin className="h-5 w-5" />
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
