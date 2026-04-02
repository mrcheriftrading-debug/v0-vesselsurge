
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { 
  Radio, Users, Anchor, Package, CheckCircle, XCircle, 
  RefreshCw, Lock, Loader2, MapPin, AlertTriangle, 
  Edit2, Save, X, Plus, Trash2 
} from "lucide-react"
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

    if (adminSecret === process.env.NEXT_PUBLIC_ADMIN_SECRET || adminSecret === "vesselsurge2026") {
      setIsAuthenticated(true)
      await loadData()
    } else {
      setError("Ogiltig administratörskod")
    }
    setIsLoading(false)
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const { data: hData, error: hErr } = await supabase
        .from("maritime_hotspots")
        .select("*")
        .order("name")
      
      if (hErr) throw hErr
      setHotspots(hData || [])

      const { data: aData, error: aErr } = await supabase
        .from("maritime_alerts")
        .select("*")
        .order("id", { ascending: false })
      
      if (aErr) throw aErr
      setAlerts(aData || [])
    } catch (err) {
      console.error("Error loading data:", err)
      setError("Kunde inte hämta data från databasen")
    }
    setIsLoading(false)
  }

  const updateHotspot = async (hotspot: Hotspot) => {
    setIsLoading(true)
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
        })
        .eq("id", hotspot.id)
      
      if (error) throw error
      setEditingHotspot(null)
      await loadData()
    } catch (err) {
      setError("Kunde inte uppdatera hotspot")
    }
    setIsLoading(false)
  }

  const updateAlert = async (alert: Alert) => {
    setIsLoading(true)
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
      setError("Kunde inte uppdatera alert")
    }
    setIsLoading(false)
  }

  const deleteAlert = async (id: number) => {
    if (!confirm("Är du säker på att du vill ta bort denna varning?")) return
    try {
      const { error } = await supabase.from("maritime_alerts").delete().eq("id", id)
      if (error) throw error
      await loadData()
    } catch (err) {
      setError("Kunde inte radera varning")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
          <div className="mb-6 text-center">
            <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
            <h1 className="text-2xl font-bold">Admin Access</h1>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="bg-secondary"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Logga in"}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Uppdatera data
          </Button>
        </div>

        <div className="flex gap-4 mb-6 border-b border-border pb-4">
          <Button 
            variant={activeTab === "hotspots" ? "default" : "ghost"} 
            onClick={() => setActiveTab("hotspots")}
          >
            Hotspots
          </Button>
          <Button 
            variant={activeTab === "alerts" ? "default" : "ghost"} 
            onClick={() => setActiveTab("alerts")}
          >
            Alerts
          </Button>
        </div>

        {activeTab === "hotspots" && (
          <div className="grid gap-4">
            {hotspots.map((h) => (
              <div key={h.id} className="p-4 border rounded bg-card flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{h.name}</h3>
                  <p className="text-sm text-muted-foreground">{h.region}</p>
                </div>
                <Button variant="ghost" onClick={() => setEditingHotspot(h.id)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="grid gap-4">
            {alerts.map((a) => (
              <div key={a.id} className="p-4 border rounded bg-card flex justify-between items-center">
                <p className="text-sm">{a.message}</p>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => deleteAlert(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
