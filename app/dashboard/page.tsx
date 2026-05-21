import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getFallbackUser } from "@/lib/fallback-auth"
import { Button } from "@/components/ui/button"
import { Zap, Ship, Package, MapPin, User, LogOut, TrendingUp, KeyRound } from "lucide-react"
import type { Metadata } from 'next'

const BASE_URL = 'https://www.vesselsurge.com'

export const metadata: Metadata = {
  title: 'Dashboard - Manage Your Maritime Business',
  description: 'VesselSurge dashboard for ship owners and cargo charterers. Manage vessel listings, freight requests, and connect with verified maritime partners worldwide.',
  alternates: {
    canonical: `${BASE_URL}/dashboard`,
  },
  robots: {
    index: false, // Dashboard is private
    follow: false,
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user: supabaseUser } } = await withTimeout(
    supabase.auth.getUser(),
    2500,
  ).catch(() => ({ data: { user: null } }))
  const user = supabaseUser || await getFallbackUser()

  if (!user) {
    redirect("/auth/login")
  }

  const companyName = user.user_metadata?.company_name || "Your Company"
  const serviceType = user.user_metadata?.service_type || "ship-owner"
  const isTrader = serviceType === "trader"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselSurge</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/auth/sign-out" method="post">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome, {companyName}</h1>
            <p className="mt-2 text-muted-foreground">
              {isTrader
                ? "Analyze maritime news, chokepoints and market pressure with Market Impact Pro"
                : serviceType === "ship-owner"
                ? "Manage your vessel listings and find cargo opportunities"
                : "Find available vessels and manage your freight requests"
              }
            </p>
          </div>

          {/* Quick Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {isTrader ? (
                    <TrendingUp className="h-5 w-5 text-primary" />
                  ) : serviceType === "ship-owner" ? (
                    <Ship className="h-5 w-5 text-primary" />
                  ) : (
                    <Package className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">
                    {isTrader ? "Saved Watchlists" : serviceType === "ship-owner" ? "Active Listings" : "Freight Requests"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <User className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Connections</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <MapPin className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">0</p>
                  <p className="text-sm text-muted-foreground">Active Routes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {isTrader ? (
                <>
                  <Link href="/pro-market">
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Open Market Impact Pro
                    </Button>
                  </Link>
                  <Link href="/map-dashboard">
                    <Button className="w-full justify-start" variant="outline">
                      <MapPin className="mr-2 h-4 w-4" />
                      View Live Chokepoint Map
                    </Button>
                  </Link>
                  <Link href="/latest">
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Read News & Risk Signals
                    </Button>
                  </Link>
                </>
              ) : serviceType === "ship-owner" ? (
                <>
                  <Link href="/#contact-form">
                    <Button className="w-full justify-start" variant="outline">
                      <Ship className="mr-2 h-4 w-4" />
                      List a New Vessel
                    </Button>
                  </Link>
                  <Link href="/map-dashboard">
                    <Button className="w-full justify-start" variant="outline">
                      <MapPin className="mr-2 h-4 w-4" />
                      View Live Map
                    </Button>
                  </Link>
                  <Link href="/pro-market">
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Market Impact Pro
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/#contact-form">
                    <Button className="w-full justify-start" variant="outline">
                      <Package className="mr-2 h-4 w-4" />
                      Request Freight
                    </Button>
                  </Link>
                  <Link href="/map-dashboard">
                    <Button className="w-full justify-start" variant="outline">
                      <MapPin className="mr-2 h-4 w-4" />
                      Browse Vessels
                    </Button>
                  </Link>
                  <Link href="/pro-market">
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Market Impact Pro
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium text-foreground">{companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-medium text-foreground">
                  {isTrader ? "Trader / Investor" : serviceType === "ship-owner" ? "Ship Owner" : "Cargo Owner"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-medium text-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              {supabaseUser && (
                <div className="pt-2">
                  <Link href="/auth/update-password">
                    <Button className="w-full justify-start" variant="outline">
                      <KeyRound className="mr-2 h-4 w-4" />
                      Change password
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`dashboard auth timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}
