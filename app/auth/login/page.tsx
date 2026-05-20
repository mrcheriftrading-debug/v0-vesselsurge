"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getSafeNextPath } from "@/lib/auth-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, Loader2, ShieldCheck } from "lucide-react"

const SESSION_CHECK_TIMEOUT_MS = 3500

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    const supabase = createClient()
    let active = true
    const nextPath = getNextPath()
    const timeout = window.setTimeout(() => {
      if (active) setIsCheckingSession(false)
    }, SESSION_CHECK_TIMEOUT_MS)

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return
      window.clearTimeout(timeout)

      if (user) {
        router.replace(nextPath)
        router.refresh()
        return
      }

      setIsCheckingSession(false)
    }).catch(() => {
      window.clearTimeout(timeout)
      if (active) setIsCheckingSession(false)
    })

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const email = formData.email.trim().toLowerCase()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: formData.password,
    })

    if (signInError) {
      setError(getFriendlyAuthError(signInError.message))
      setIsLoading(false)
      return
    }

    router.replace(getNextPath())
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
          <Link href={withCurrentNext("/auth/sign-up")}>
            <Button variant="ghost" size="sm">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Log in once and continue from this device without signing in every visit.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  disabled={isLoading || isCheckingSession}
                  className="bg-secondary"
                />
              </div>

              <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/70 p-3 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Your secure session is refreshed automatically while your browser keeps cookies enabled.</span>
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
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href={withCurrentNext("/auth/sign-up")} className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function getNextPath() {
  if (typeof window === "undefined") return "/dashboard"
  const nextPath = new URLSearchParams(window.location.search).get("next")
  return getSafeNextPath(nextPath)
}

function getFriendlyAuthError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect. Please check your details and try again."
  }
  if (lower.includes("email not confirmed")) {
    return "This email still needs confirmation. Check your inbox, or reset your password if you already created the account."
  }
  if (lower.includes("rate limit")) {
    return "Too many login attempts. Wait a minute and try again."
  }

  return message
}

function withCurrentNext(path: string) {
  if (typeof window === "undefined") return path
  const nextPath = new URLSearchParams(window.location.search).get("next")
  const safeNextPath = getSafeNextPath(nextPath, "")
  if (!safeNextPath) return path
  return `${path}?next=${encodeURIComponent(safeNextPath)}`
}
