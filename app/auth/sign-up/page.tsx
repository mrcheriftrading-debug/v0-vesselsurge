"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, Ship, Package, Loader2, ShieldCheck, TrendingUp } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    companyName: "",
    serviceType: "ship-owner",
  })

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return

      if (user) {
        router.replace(getNextPath())
        router.refresh()
        return
      }

      setIsCheckingSession(false)
    }).catch(() => {
      if (active) setIsCheckingSession(false)
    })

    return () => {
      active = false
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const signUpResponse = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    if (!signUpResponse.ok) {
      const result = await signUpResponse.json().catch(() => null)
      setError(result?.error || "Could not create your account right now.")
      setIsLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (signInError) {
      setError("Your account was created, but automatic login failed. Please log in with your email and password.")
      setIsLoading(false)
      return
    }

    router.replace(getNextPath(formData.serviceType))
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselSurge</span>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Log In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Create Your Account</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Create access to VesselSurge in under a minute.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">I am a:</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: "ship-owner" })}
                    disabled={isLoading || isCheckingSession}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                      formData.serviceType === "ship-owner"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Ship className="h-6 w-6" />
                    <span className="text-sm font-medium">Vessel Operator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: "cargo-owner" })}
                    disabled={isLoading || isCheckingSession}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                      formData.serviceType === "cargo-owner"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Package className="h-6 w-6" />
                    <span className="text-sm font-medium">Cargo Team</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, serviceType: "trader" })}
                    disabled={isLoading || isCheckingSession}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                      formData.serviceType === "trader"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm font-medium">Trader / Investor</span>
                  </button>
                </div>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium text-foreground">
                  Company Name
                </label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Your company name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  autoComplete="organization"
                  disabled={isLoading || isCheckingSession}
                  className="bg-secondary"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoComplete="email"
                  disabled={isLoading || isCheckingSession}
                  className="bg-secondary"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  disabled={isLoading || isCheckingSession}
                  className="bg-secondary"
                />
              </div>

              <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/70 p-3 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Your account opens immediately and this browser keeps you signed in automatically.</span>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || isCheckingSession}>
                {isCheckingSession ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking session...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function getNextPath(serviceType?: string) {
  if (typeof window === "undefined") return serviceType === "trader" ? "/pro-market" : "/dashboard"
  const nextPath = new URLSearchParams(window.location.search).get("next")
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath
  }

  return serviceType === "trader" ? "/pro-market" : "/dashboard"
}
