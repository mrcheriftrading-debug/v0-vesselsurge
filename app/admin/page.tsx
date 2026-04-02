"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { Radio, Users, Anchor, Package, CheckCircle, XCircle, RefreshCw, Lock, Loader2, MapPin, AlertTriangle, Edit2, Save, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
)

interface Hotspot {
  id: string
  name: string
  region: string
  center_lat: number
  center_lng: number
  risk_level: string
  active_vessels: number
  daily_transits: number
  avg_wait_time: string
  market_volume: number
  note: string
}

interface Alert {
  id: number
  hotspot_id: string
  severity: string
  message: string
  source: string
  is_active: boolean
}

type Tab = "hotspots" | "alerts" | "users"

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminSecret, setAdminSecret] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("hotspots")
  
  // Data
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [editingHotspot, setEditingHotspot] = useState<string | null>(null)
  const [editingAlert, setEditingAlert] = useState<number | null>(null)

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simple admin check - in production use proper auth
    if (adminSecret === process.env.NEXT_PUBLIC_ADMIN_SECRET || adminSecret === "vesselsurge2026") {
      setIsAuthenticated(true)
      await loadData()
    } else {
      setError("Invalid admin secret")
    }
    setIsLoading(false)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load hotspots
      const { data: hotspotsData, error: hotspotsError } = await supabase
        .from("maritime_hotspots")
        .select("*")
        .order("name")
      
      if (hotspotsError) throw hotspotsError
      setHotspots(hotspotsData || [])

      // Load alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("maritime_alerts")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (alertsError) throw alertsError
      setAlerts(alertsData || [])
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Failed to load data from database")
    }
    setIsLoading(false)
  }

  const updateHotspot = async (hotspot: Hotspot) => {
    try {
      const { error } = await supabase
        .from("maritime_hotspots")
        .update({
          name: hotspot.name,
          risk_level: hotspot.risk_level,
          active_vessels: hotspot.active_vessels,
          daily_transits: hotspot.daily_transits,
          avg_wait_time: hotspot.avg_wait_time,
          market_volume: hotspot.market_volume,
          note: hotspot.note,
          updated_at: new Date().toISOString(),
        })
        .eq("id", hotspot.id)
      
      if (error) throw error
      setEditingHotspot(null)
      await loadData()
    } catch (err) {
      console.error("Error updating hotspot:", err)
      setError("Failed to update hotspot")
    }
  }

  const updateAlert = async (alert: Alert) => {
    try {
      const { error } = await supabase
        .from("maritime_alerts")
        .update({
          severity: alert.severity,
          message: alert.message,
          source: alert.source,
          is_active: alert.is_active,
        })
        .eq("id", alert.id)
      
      if (error) throw error
      setEditingAlert(null)
      await loadData()
    } catch (err) {
      console.error("Error updating alert:", err)
      setError("Failed to update alert")
    }
  }

  const deleteAlert = async (id: number) => {
    if (!confirm("Are you sure you want to delete this alert?")) return
    try {
      const { error } = await supabase
        .from("maritime_alerts")
        .delete()
        .eq("id", id)
      
      if (error) throw error
      await loadData()
    } catch (err) {
      console.error("Error deleting alert:", err)
      setError("Failed to delete alert")
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-500 bg-red-500/10"
      case "high": return "text-orange-500 bg-orange-500/10"
      case "medium": return "text-yellow-500 bg-yellow-500/10"
      default: return "text-green-500 bg-green-500/10"
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">VesselSurge</span>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-lg border border-border bg-card p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter the admin secret to manage live map data
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
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">VesselSurge</span>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/map-dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              View Live Map
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setIsAuthenticated(false)}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Live Map Admin</h1>
              <p className="mt-1 text-muted-foreground">
                Manage hotspot data and alerts - changes appear instantly on the live map
              </p>
            </div>
            <Button onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("hotspots")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "hotspots"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="mr-2 inline h-4 w-4" />
              Hotspots ({hotspots.length})
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "alerts"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              Alerts ({alerts.length})
            </button>
          </div>

          {/* Hotspots Tab */}
          {activeTab === "hotspots" && (
            <div className="space-y-4">
              {hotspots.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                  No hotspots found. Run the database migration first.
                </div>
              ) : (
                hotspots.map((hotspot) => (
                  <div key={hotspot.id} className="rounded-lg border border-border bg-card p-6">
                    {editingHotspot === hotspot.id ? (
                      <HotspotEditForm
                        hotspot={hotspot}
                        onSave={updateHotspot}
                        onCancel={() => setEditingHotspot(null)}
                      />
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">{hotspot.name}</h3>
                            <span className={`rounded px-2 py-0.5 text-xs font-medium uppercase ${getRiskColor(hotspot.risk_level)}`}>
                              {hotspot.risk_level}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <div>
                              <span className="text-muted-foreground">Daily Transits:</span>
                              <span className="ml-2 font-semibold">{hotspot.daily_transits}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Active Vessels:</span>
                              <span className="ml-2 font-semibold">{hotspot.active_vessels}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Wait Time:</span>
                              <span className="ml-2 font-semibold">{hotspot.avg_wait_time}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Volume:</span>
                              <span className="ml-2 font-semibold">${(hotspot.market_volume / 1000000).toFixed(1)}M</span>
                            </div>
                          </div>
                          {hotspot.note && (
                            <p className="text-sm text-muted-foreground">{hotspot.note}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setEditingHotspot(hotspot.id)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                  No alerts found.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-border bg-card p-4">
                    {editingAlert === alert.id ? (
                      <AlertEditForm
                        alert={alert}
                        hotspots={hotspots}
                        onSave={updateAlert}
                        onCancel={() => setEditingAlert(null)}
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`rounded px-2 py-0.5 text-xs font-medium uppercase ${getRiskColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-muted-foreground">{alert.hotspot_id}</span>
                            {!alert.is_active && (
                              <span className="rounded bg-gray-500/10 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">Source: {alert.source}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditingAlert(alert.id)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function HotspotEditForm({ 
  hotspot, 
  onSave, 
  onCancel 
}: { 
  hotspot: Hotspot
  onSave: (h: Hotspot) => void
  onCancel: () => void 
}) {
  const [data, setData] = useState(hotspot)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className="text-xs text-muted-foreground">Risk Level</label>
          <select
            value={data.risk_level}
            onChange={(e) => setData({ ...data, risk_level: e.target.value })}
            className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Daily Transits</label>
          <Input
            type="number"
            value={data.daily_transits}
            onChange={(e) => setData({ ...data, daily_transits: parseInt(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Active Vessels</label>
          <Input
            type="number"
            value={data.active_vessels}
            onChange={(e) => setData({ ...data, active_vessels: parseInt(e.target.value) || 0 })}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Wait Time</label>
          <Input
            value={data.avg_wait_time}
            onChange={(e) => setData({ ...data, avg_wait_time: e.target.value })}
            className="mt-1"
            placeholder="e.g. 48h+"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Note / Intelligence</label>
        <textarea
          value={data.note || ""}
          onChange={(e) => setData({ ...data, note: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(data)}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

function AlertEditForm({ 
  alert, 
  hotspots,
  onSave, 
  onCancel 
}: { 
  alert: Alert
  hotspots: Hotspot[]
  onSave: (a: Alert) => void
  onCancel: () => void 
}) {
  const [data, setData] = useState(alert)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs text-muted-foreground">Hotspot</label>
          <select
            value={data.hotspot_id}
            onChange={(e) => setData({ ...data, hotspot_id: e.target.value })}
            className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          >
            {hotspots.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Severity</label>
          <select
            value={data.severity}
            onChange={(e) => setData({ ...data, severity: e.target.value })}
            className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Active</label>
          <select
            value={data.is_active ? "true" : "false"}
            onChange={(e) => setData({ ...data, is_active: e.target.value === "true" })}
            className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Message</label>
        <textarea
          value={data.message}
          onChange={(e) => setData({ ...data, message: e.target.value })}
          className="mt-1 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
          rows={2}
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Source</label>
        <Input
          value={data.source || ""}
          onChange={(e) => setData({ ...data, source: e.target.value })}
          className="mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(data)}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
