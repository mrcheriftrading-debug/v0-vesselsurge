import Link from "next/link"
import { Zap, Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselSurge</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
            
            <p className="mt-4 text-muted-foreground">
              We've sent you a confirmation email. Please click the link in the email to verify your account and complete your registration.
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary p-4 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>A confirmation email has been sent</span>
            </div>

            <div className="mt-8 space-y-3">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
