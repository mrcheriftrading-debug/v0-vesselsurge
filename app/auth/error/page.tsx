import Link from "next/link"
import { Zap, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground">Authentication Error</h1>
            
            <p className="mt-4 text-muted-foreground">
              There was a problem with your authentication. The link may have expired or already been used.
            </p>

            <div className="mt-8 space-y-3">
              <Link href="/auth/login">
                <Button className="w-full">
                  Try Logging In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full">
                  Create New Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
