"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { BarChart3, Home, Info, LogIn, Map, Menu, Network, Newspaper, ShieldCheck, Ship, TrendingUp, UserPlus, X } from "lucide-react"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map-dashboard", label: "Live Map", icon: Map },
  { href: "/latest", label: "News & Risk", icon: Newspaper },
  { href: "/source-trust", label: "Trust", icon: ShieldCheck },
  { href: "/pro-market", label: "Market Pro", icon: TrendingUp },
  { href: "/network", label: "Network", icon: Network },
  { href: "/about", label: "Company", icon: Info },
]

const mobilePrimaryItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map-dashboard", label: "Map", icon: Map },
  { href: "/latest", label: "News", icon: Newspaper },
  { href: "/pro-market", label: "Pro", icon: BarChart3 },
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
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.08] bg-[#071020]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" onClick={() => setMobileOpen(false)}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
              <Ship className="h-5 w-5" />
            </div>
            <span className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">VesselSurge</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-cyan-200/10 text-cyan-100"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <Link href="/auth/login" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground">
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-cyan-200 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-white">
              <UserPlus className="h-4 w-4" />
              Client access
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 pt-16 backdrop-blur-md lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="border-b border-border bg-card px-4 py-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">VesselSurge navigation</p>
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
                        ? "border-cyan-200/25 bg-cyan-200/10 text-cyan-100"
                        : "border-white/[0.08] bg-[#071020]/80 text-foreground"
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
                Sign in
              </Link>
              <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-md bg-cyan-200 text-sm font-semibold text-slate-950">
                Client access
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
                  active ? "bg-cyan-200/10 text-cyan-100" : "text-muted-foreground"
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
