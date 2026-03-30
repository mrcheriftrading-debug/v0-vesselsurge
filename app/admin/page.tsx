"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Radio, Users, Ship, Package, CheckCircle, XCircle, RefreshCw, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface User {
  id: string
  email: string
  companyName: string
  serviceType: string
  createdAt: string
  lastSignIn: string | null
  emailConfirmed: boolean
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminSecret, setAdminSecret] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${adminSecret}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid admin secret")
          setIsAuthenticated(false)
        } else {
          setError("Failed to fetch users")
        }
        return
      }

      const data = await response.json()
      setUsers(data.users)
      setIsAuthenticated(true)
    } catch {
      setError("Failed to connect to server")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  // Stats
  const totalUsers = users.length
  const shipOwners = users.filter((u) => u.serviceType === "ship-owner").length
  const cargoOwners = users.filter((u) => u.serviceType === "cargo-owner").length
  const confirmedUsers = users.filter((u) => u.emailConfirmed).length

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">VesselPro</span>
            </Link>
          </div>
        </header>

        {/* Admin Login */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-border bg-card p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the admin secret to view all user accounts
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="adminSecret" className="text-sm font-medium text-foreground">
                    Admin Secret
                  </label>
                  <Input
                    id="adminSecret"
                    type="password"
                    placeholder="Enter admin secret"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
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
                      Authenticating...
                    </>
                  ) : (
                    "Access Admin Panel"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselPro</span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Admin
            </span>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setIsAuthenticated(false)}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Accounts</h1>
              <p className="mt-1 text-muted-foreground">
                View and manage all registered VesselPro users
              </p>
            </div>
            <Button onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Ship className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{shipOwners}</p>
                  <p className="text-sm text-muted-foreground">Ship Owners</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Package className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{cargoOwners}</p>
                  <p className="text-sm text-muted-foreground">Cargo Owners</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{confirmedUsers}</p>
                  <p className="text-sm text-muted-foreground">Verified</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Verified
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Last Sign In
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {user.companyName}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              user.serviceType === "ship-owner"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {user.serviceType === "ship-owner" ? (
                              <Ship className="h-3 w-3" />
                            ) : (
                              <Package className="h-3 w-3" />
                            )}
                            {user.serviceType === "ship-owner" ? "Ship" : "Cargo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.emailConfirmed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {user.lastSignIn
                            ? new Date(user.lastSignIn).toLocaleDateString()
                            : "Never"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
