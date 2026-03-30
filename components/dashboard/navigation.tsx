"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Zap, Menu, X, MapPin, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationProps {
  isConnected?: boolean
  isDemo?: boolean
}

export function Navigation({ isConnected = false, isDemo = true }: NavigationProps) {
  const [time, setTime] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-US", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">VesselSurge</span>
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:block font-mono">// B2B NETWORK</span>
            <Link href="/map-dashboard" className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground md:flex">
              <MapPin className="h-4 w-4" />
              <span>Live Map</span>
            </Link>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-2 rounded border border-border bg-secondary px-2 py-1">
              <span className="font-mono text-xs text-muted-foreground">{time} UTC</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                <LogIn className="mr-1.5 h-4 w-4" />
                <span>Log In</span>
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                <span>Sign Up</span>
              </Button>
            </Link>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded p-2 text-muted-foreground hover:bg-secondary md:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="fixed bottom-0 left-0 right-0 rounded-t-xl border-t border-border bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border"></div>
            <div className="space-y-2">
              <Link href="/map-dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Live Map</span>
              </Link>
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Home</span>
              </Link>
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/auth/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Log In</Button>
              </Link>
              <Link href="/auth/sign-up" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
