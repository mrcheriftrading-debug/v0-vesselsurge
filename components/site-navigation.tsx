"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { BarChart3, Home, Info, LogIn, Map, Menu, Network, Newspaper, UserPlus, X, Zap } from "lucide-react"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map-dashboard", label: "Live Map", icon: Map },
  { href: "/intelligence", label: "News & Risk", icon: Newspaper },
  { href: "/network", label: "Join Network", icon: Network },
  { href: "/about", label: "About", icon: Info },
]

const mobilePrimaryItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map-dashboard", label: "Map", icon: Map },
  { href: "/intelligence", label: "News", icon: BarChart3 },
  { href: "/auth/sign-up", label: "Account", icon: UserPlus },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname.startsWith(href)
}

export function SiteNavigation() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-cyan-300/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary shadow-[0_0_24px_rgba(0,119,255,0.35)]">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">VesselSurge</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <Link href="/auth/login" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
            <Link href="/auth/sign-up" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,119,255,0.24)] transition-all hover:-translate-y-0.5 hover:bg-primary/90">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 pt-16 backdrop-blur-md md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="border-b border-border bg-card px-4 py-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Where do you want to go?</p>
            <div className="grid gap-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-12 items-center gap-3 rounded-md border px-3 text-sm font-semibold ${
                      active
                        ? "border-primary/30 bg-primary/12 text-primary"
                        : "border-border bg-background/60 text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border text-sm font-semibold text-foreground">
                Log In
              </Link>
              <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/92 px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {mobilePrimaryItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[0.68rem] font-bold ${
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
