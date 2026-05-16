"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Mail, Zap } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/update-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message)
      setIsLoading(false)
      return
    }

    setSent(true)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
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

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter your account email and we will send a secure reset link.
              </p>
            </div>

            {sent ? (
              <div className="space-y-4">
                <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  If an account exists for that email, a reset link has been sent. Open the email and set a new password.
                </div>
                <Link href="/auth/login">
                  <Button className="w-full">Back to Login</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    className="bg-secondary"
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}

            <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
