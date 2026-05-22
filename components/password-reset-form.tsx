"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Loader2, Zap } from "lucide-react"
import type { EmailOtpType } from "@supabase/supabase-js"

const OTP_TYPES = new Set<EmailOtpType>(["signup", "invite", "magiclink", "recovery", "email_change", "email"])

type PasswordResetFormProps = {
  cleanPath?: string
}

export function PasswordResetForm({ cleanPath = "/auth/reset-password" }: PasswordResetFormProps) {
  const router = useRouter()
  const isAccountPasswordPage = cleanPath === "/auth/update-password"
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true
    const markInvalid = (message = "This reset link is invalid or expired. Request a new password reset link.") => {
      if (!active) return
      setIsCheckingSession(false)
      setError(message)
    }

    const cleanRecoveryUrl = () => {
      window.history.replaceState({}, document.title, cleanPath)
    }

    const prepareResetSession = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
      const accessToken = hash.get("access_token")
      const refreshToken = hash.get("refresh_token")
      const recoveryType = (hash.get("type") || params.get("type")) as EmailOtpType | null
      const tokenHash = params.get("token_hash")
      const fallbackRecoveryEmail = params.get("fallback") === "1"
        ? params.get("email")?.trim().toLowerCase()
        : null

      if (fallbackRecoveryEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fallbackRecoveryEmail)) {
        setFallbackEmail(fallbackRecoveryEmail)
        setIsCheckingSession(false)
        return
      }

      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (!active) return

        if (exchangeError || !data.session) {
          markInvalid()
          return
        }

        cleanRecoveryUrl()
        setIsCheckingSession(false)
        return
      }

      if (tokenHash && recoveryType && OTP_TYPES.has(recoveryType)) {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: recoveryType,
        })
        if (!active) return

        if (verifyError || !data.session) {
          markInvalid()
          return
        }

        cleanRecoveryUrl()
        setIsCheckingSession(false)
        return
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!active) return

        if (sessionError || recoveryType !== "recovery") {
          markInvalid()
          return
        }

        cleanRecoveryUrl()
        setIsCheckingSession(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return

      if (!user) {
        if (isAccountPasswordPage) {
          markInvalid("Log in again before changing your password.")
          return
        }

        markInvalid()
        return
      }

      setIsCheckingSession(false)
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && active) {
        setError(null)
        setIsCheckingSession(false)
      }
    })

    prepareResetSession().catch(() => {
      markInvalid()
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [cleanPath, isAccountPasswordPage])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    if (fallbackEmail) {
      const response = await fetch("/api/auth/fallback-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fallbackEmail, password }),
      }).catch(() => null)

      if (!response?.ok) {
        setError("Password reset is temporarily unavailable. Try again shortly.")
        setIsLoading(false)
        return
      }

      const result = await response.json().catch(() => null)
      if (!result?.success || !result?.available) {
        setError("This reset link is invalid or expired. Request a new password reset link.")
        setIsLoading(false)
        return
      }

      router.replace("/dashboard")
      router.refresh()
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Your session expired. Log in again before changing your password.")
      setIsLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(getFriendlyPasswordError(updateError.message))
      setIsLoading(false)
      return
    }

    await supabase.auth.refreshSession().catch(() => null)
    router.replace("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselSurge</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Reset Your Password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAccountPasswordPage
                  ? "Set a new password for this signed-in VesselSurge account."
                  : "Enter a new password for your VesselSurge account."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                  disabled={isLoading || isCheckingSession}
                  className="bg-secondary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={6}
                  required
                  autoComplete="new-password"
                  disabled={isLoading || isCheckingSession}
                  className="bg-secondary"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || isCheckingSession || isFatalResetError(error)}>
                {isCheckingSession ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking reset link...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Save New Password"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Need a new link?{" "}
              <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
                Reset again
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function isFatalResetError(error: string | null) {
  if (!error) return false
  return error.includes("expired") || error.includes("Log in again")
}

function getFriendlyPasswordError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("auth session missing") || lower.includes("jwt") || lower.includes("session")) {
    return "Your session expired. Log in again before changing your password."
  }
  if (lower.includes("weak") || lower.includes("password")) {
    return message
  }
  if (lower.includes("rate limit")) {
    return "Too many password attempts. Wait a minute and try again."
  }
  return message
}
