"use client"
 
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
 
type Article = {
  id?: string
  title: string
  snippet: string
  url: string
  source: string
  topic: string
  is_active: boolean
}
 
type Alert = {
  id?: string
  hotspot: string
  severity: string
  message: string
  source: string
  is_active: boolean
}
 
type HotspotStat = {
  hotspot: string
  active_vessels: number
  daily_transits: number
  avg_wait_time: string
  market_volume: number
  risk_level: string
}
 
const HOTSPOTS = ["hormuz", "bab", "malacca", "suez"]
const HOTSPOT_LABELS: Record<string, string> = {
  hormuz: "Strait of Hormuz",
  bab: "Bab el-Mandeb",
  malacca: "Malacca Strait",
  suez: "Suez Canal",
  global: "Global",
}
 
const EMPTY_ARTICLE: Article = {
  title: "",
  snippet: "",
  url: "",
  source: "",
  topic: "global",
  is_active: true,
}
 
const EMPTY_ALERT: Alert = {
  hotspot: "bab",
  severity: "warning",
  message: "",
  source: "",
  is_active: true,
}
 
export default function AdminPage() {
  const supabase = createClient()
 
  const [tab, setTab] = useState<"news" | "alerts" | "stats">("news")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
 
  const [articles, setArticles] = useState<Article[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<HotspotStat[]>([])
 
  const [editArticle, setEditArticle] = useState<Article | null>(null)
  const [editAlert, setEditAlert] = useState<Alert | null>(null)
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showAlertForm, setShowAlertForm] = useState(false)
 
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }
 
  useEffect(() => {
    fetchAll()
  }, [])
 
  async function fetchAll() {
    setLoading(true)
    const [{ data: a }, { data: al }, { data: s }] = await Promise.all([
      supabase.from("news_articles").select("*").order("updated_at", { ascending: false }),
      supabase.from("hotspot_alerts").select("*").order("created_at", { ascending: false }),
      supabase.from("hotspot_stats").select("*"),
    ])
    setArticles(a || [])
    setAlerts(al || [])
    setStats(
      HOTSPOTS.map((h) => {
        const found = (s || []).find((r: HotspotStat) => r.hotspot === h)
        return found || { hotspot: h, active_vessels: 0, daily_transits: 0, avg_wait_time: "0h", market_volume: 0, risk_level: "medium" }
      })
    )
    setLoading(false)
  }
 
  // ── Articles ──────────────────────────────────────────────
  async function saveArticle(article: Article) {
    setSaving(true)
    if (article.id) {
      const { error } = await supabase.from("news_articles").update({ ...article, updated_at: new Date().toISOString() }).eq("id", article.id)
      if (error) { showToast("Error saving article", "error"); setSaving(false); return }
      setArticles((prev) => prev.map((a) => (a.id === article.id ? article : a)))
    } else {
      const { data, error } = await supabase.from("news_articles").insert([article]).select().single()
      if (error) { showToast("Error adding article", "error"); setSaving(false); return }
      setArticles((prev) => [data, ...prev])
    }
    setSaving(false)
    setShowArticleForm(false)
    setEditArticle(null)
    showToast("Article saved ✓")
  }
 
  async function deleteArticle(id: string) {
    if (!confirm("Delete this article?")) return
    await supabase.from("news_articles").delete().eq("id", id)
    setArticles((prev) => prev.filter((a) => a.id !== id))
    showToast("Article deleted")
  }
 
  async function toggleArticle(id: string, current: boolean) {
    await supabase.from("news_articles").update({ is_active: !current }).eq("id", id)
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a)))
  }
 
  // ── Alerts ──────────────────────────────────────────────
  async function saveAlert(alert: Alert) {
    setSaving(true)
    if (alert.id) {
      const { error } = await supabase.from("hotspot_alerts").update({ ...alert, updated_at: new Date().toISOString() }).eq("id", alert.id)
      if (error) { showToast("Error saving alert", "error"); setSaving(false); return }
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)))
    } else {
      const { data, error } = await supabase.from("hotspot_alerts").insert([alert]).select().single()
      if (error) { showToast("Error adding alert", "error"); setSaving(false); return }
      setAlerts((prev) => [data, ...prev])
    }
    setSaving(false)
    setShowAlertForm(false)
    setEditAlert(null)
    showToast("Alert saved ✓")
  }
 
  async function deleteAlert(id: string) {
    if (!confirm("Delete this alert?")) return
    await supabase.from("hotspot_alerts").delete().eq("id", id)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    showToast("Alert deleted")
  }
 
  async function toggleAlert(id: string, current: boolean) {
    await supabase.from("hotspot_alerts").update({ is_active: !current }).eq("id", id)
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !current } : a)))
  }
 
  // ── Stats ──────────────────────────────────────────────
  async function saveStat(stat: HotspotStat) {
    setSaving(true)
    const { error } = await supabase.from("hotspot_stats").upsert({ ...stat, updated_at: new Date().toISOString() }, { onConflict: "hotspot" })
    if (error) { showToast("Error saving stats", "error"); setSaving(false); return }
    setSaving(false)
    showToast(`${HOTSPOT_LABELS[stat.hotspot]} stats saved ✓`)
  }
 
  const severityColor: Record<string, string> = {
    critical: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  }
 
  const riskColor: Record<string, string> = {
    low: "#22c55e",
    medium: "#f59e0b",
    high: "#ef4444",
    critical: "#dc2626",
  }
 
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0e1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b", fontFamily: "monospace", fontSize: 14 }}>Loading admin panel...</div>
      </div>
    )
  }
 
  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "success" ? "#065f46" : "#7f1d1d",
          border: `1px solid ${toast.type === "success" ? "#10b981" : "#ef4444"}`,
          color: toast.type === "success" ? "#6ee7b7" : "#fca5a5",
          padding: "10px 18px", borderRadius: 6, fontSize: 13,
        }}>
          {toast.msg}
        </div>
      )}
 
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e293b", padding: "18px 32px", display: "flex", alignItems: "center", gap: 16, background: "#0d1220" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
        <span style={{ fontSize: 13, color: "#64748b", letterSpacing: 2, textTransform: "uppercase" }}>VesselSurge</span>
        <span style={{ color: "#1e293b" }}>|</span>
        <span style={{ fontSize: 13, color: "#94a3b8", letterSpacing: 1 }}>Admin Panel</span>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#334155" }}>
          Data refreshes for visitors every 1 hour
        </div>
      </div>
 
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 32, background: "#0d1220", padding: 4, borderRadius: 8, border: "1px solid #1e293b", width: "fit-content" }}>
          {(["news", "alerts", "stats"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 20px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 12, letterSpacing: 1, textTransform: "uppercase",
                background: tab === t ? "#1e40af" : "transparent",
                color: tab === t ? "#93c5fd" : "#475569",
                transition: "all 0.15s",
              }}
            >
              {t === "news" ? `📰 News (${articles.length})` : t === "alerts" ? `🚨 Alerts (${alerts.length})` : "📊 Stats"}
            </button>
          ))}
        </div>
 
        {/* ── NEWS TAB ── */}
        {tab === "news" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, color: "#f1f5f9", marginBottom: 4 }}>News Articles</div>
                <div style={{ fontSize: 12, color: "#475569" }}>These appear in the live news feed. Toggle off to hide without deleting.</div>
              </div>
              <button
                onClick={() => { setEditArticle({ ...EMPTY_ARTICLE }); setShowArticleForm(true) }}
                style={{ padding: "9px 18px", background: "#1e40af", color: "#93c5fd", border: "1px solid #3b82f6", borderRadius: 6, cursor: "pointer", fontSize: 12, letterSpacing: 1 }}
              >
                + ADD ARTICLE
              </button>
            </div>
 
            {/* Article Form */}
            {showArticleForm && editArticle && (
              <ArticleForm
                article={editArticle}
                saving={saving}
                onChange={setEditArticle}
                onSave={() => saveArticle(editArticle)}
                onCancel={() => { setShowArticleForm(false); setEditArticle(null) }}
              />
            )}
 
            {/* Article List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {articles.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", color: "#334155", border: "1px dashed #1e293b", borderRadius: 8, fontSize: 13 }}>
                  No articles yet. Click "+ ADD ARTICLE" to add your first one.
                </div>
              )}
              {articles.map((a) => (
                <div key={a.id} style={{
                  background: "#0d1220", border: `1px solid ${a.is_active ? "#1e3a5f" : "#1e293b"}`,
                  borderRadius: 8, padding: "14px 18px",
                  display: "flex", alignItems: "flex-start", gap: 14,
                  opacity: a.is_active ? 1 : 0.5,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#1e293b", color: "#94a3b8" }}>
                        {HOTSPOT_LABELS[a.topic] || a.topic}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{a.source}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "#e2e8f0", marginBottom: 4, lineHeight: 1.4 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.snippet}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => toggleArticle(a.id!, a.is_active)} style={smallBtn(a.is_active ? "#064e3b" : "#1e293b", a.is_active ? "#10b981" : "#475569")}>
                      {a.is_active ? "ON" : "OFF"}
                    </button>
                    <button onClick={() => { setEditArticle({ ...a }); setShowArticleForm(true) }} style={smallBtn("#1e293b", "#94a3b8")}>EDIT</button>
                    <button onClick={() => deleteArticle(a.id!)} style={smallBtn("#3b0a0a", "#ef4444")}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* ── ALERTS TAB ── */}
        {tab === "alerts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, color: "#f1f5f9", marginBottom: 4 }}>Hotspot Alerts</div>
                <div style={{ fontSize: 12, color: "#475569" }}>Security alerts shown on the map dashboard. Toggle off to hide.</div>
              </div>
              <button
                onClick={() => { setEditAlert({ ...EMPTY_ALERT }); setShowAlertForm(true) }}
                style={{ padding: "9px 18px", background: "#7f1d1d", color: "#fca5a5", border: "1px solid #ef4444", borderRadius: 6, cursor: "pointer", fontSize: 12, letterSpacing: 1 }}
              >
                + ADD ALERT
              </button>
            </div>
 
            {showAlertForm && editAlert && (
              <AlertForm
                alert={editAlert}
                saving={saving}
                onChange={setEditAlert}
                onSave={() => saveAlert(editAlert)}
                onCancel={() => { setShowAlertForm(false); setEditAlert(null) }}
              />
            )}
 
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.length === 0 && (
                <div style={{ padding: 32, textAlign: "center", color: "#334155", border: "1px dashed #1e293b", borderRadius: 8, fontSize: 13 }}>
                  No alerts yet. Click "+ ADD ALERT" to add your first one.
                </div>
              )}
              {alerts.map((a) => (
                <div key={a.id} style={{
                  background: "#0d1220", border: `1px solid ${a.is_active ? "#2d1b1b" : "#1e293b"}`,
                  borderRadius: 8, padding: "14px 18px",
                  display: "flex", alignItems: "flex-start", gap: 14,
                  opacity: a.is_active ? 1 : 0.5,
                  borderLeft: `3px solid ${severityColor[a.severity] || "#64748b"}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#1e293b", color: severityColor[a.severity] }}>
                        {a.severity.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#1e293b", color: "#94a3b8" }}>
                        {HOTSPOT_LABELS[a.hotspot]}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{a.source}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{a.message}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => toggleAlert(a.id!, a.is_active)} style={smallBtn(a.is_active ? "#064e3b" : "#1e293b", a.is_active ? "#10b981" : "#475569")}>
                      {a.is_active ? "ON" : "OFF"}
                    </button>
                    <button onClick={() => { setEditAlert({ ...a }); setShowAlertForm(true) }} style={smallBtn("#1e293b", "#94a3b8")}>EDIT</button>
                    <button onClick={() => deleteAlert(a.id!)} style={smallBtn("#3b0a0a", "#ef4444")}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, color: "#f1f5f9", marginBottom: 4 }}>Hotspot Statistics</div>
              <div style={{ fontSize: 12, color: "#475569" }}>Update vessel counts, transit numbers and risk levels for each chokepoint.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 16 }}>
              {stats.map((s, i) => (
                <StatCard
                  key={s.hotspot}
                  stat={s}
                  saving={saving}
                  onChange={(updated) => setStats((prev) => prev.map((st, idx) => idx === i ? updated : st))}
                  onSave={() => saveStat(s)}
                  riskColor={riskColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 
// ── Sub-components ──────────────────────────────────────────
 
function ArticleForm({ article, saving, onChange, onSave, onCancel }: {
  article: Article; saving: boolean
  onChange: (a: Article) => void; onSave: () => void; onCancel: () => void
}) {
  return (
    <div style={{ background: "#0d1220", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: "#93c5fd", marginBottom: 16, letterSpacing: 1 }}>{article.id ? "EDIT ARTICLE" : "NEW ARTICLE"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label>Title</Label>
          <Input value={article.title} onChange={(v) => onChange({ ...article, title: v })} placeholder="Article headline..." />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label>Snippet</Label>
          <Textarea value={article.snippet} onChange={(v) => onChange({ ...article, snippet: v })} placeholder="Short summary (1-2 sentences)..." />
        </div>
        <div>
          <Label>URL</Label>
          <Input value={article.url} onChange={(v) => onChange({ ...article, url: v })} placeholder="https://..." />
        </div>
        <div>
          <Label>Source</Label>
          <Input value={article.source} onChange={(v) => onChange({ ...article, source: v })} placeholder="reuters.com" />
        </div>
        <div>
          <Label>Topic</Label>
          <Select value={article.topic} onChange={(v) => onChange({ ...article, topic: v })}>
            <option value="global">Global</option>
            <option value="hormuz">Strait of Hormuz</option>
            <option value="bab">Bab el-Mandeb</option>
            <option value="malacca">Malacca Strait</option>
            <option value="suez">Suez Canal</option>
          </Select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onSave} disabled={saving} style={{ padding: "9px 20px", background: "#1e40af", color: "#93c5fd", border: "1px solid #3b82f6", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
          {saving ? "Saving..." : "Save Article"}
        </button>
        <button onClick={onCancel} style={{ padding: "9px 20px", background: "transparent", color: "#64748b", border: "1px solid #1e293b", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
 
function AlertForm({ alert, saving, onChange, onSave, onCancel }: {
  alert: Alert; saving: boolean
  onChange: (a: Alert) => void; onSave: () => void; onCancel: () => void
}) {
  return (
    <div style={{ background: "#0d1220", border: "1px solid #3b1818", borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: "#fca5a5", marginBottom: 16, letterSpacing: 1 }}>{alert.id ? "EDIT ALERT" : "NEW ALERT"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>Hotspot</Label>
          <Select value={alert.hotspot} onChange={(v) => onChange({ ...alert, hotspot: v })}>
            <option value="hormuz">Strait of Hormuz</option>
            <option value="bab">Bab el-Mandeb</option>
            <option value="malacca">Malacca Strait</option>
            <option value="suez">Suez Canal</option>
          </Select>
        </div>
        <div>
          <Label>Severity</Label>
          <Select value={alert.severity} onChange={(v) => onChange({ ...alert, severity: v })}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label>Message</Label>
          <Textarea value={alert.message} onChange={(v) => onChange({ ...alert, message: v })} placeholder="Alert message for mariners..." />
        </div>
        <div>
          <Label>Source</Label>
          <Input value={alert.source} onChange={(v) => onChange({ ...alert, source: v })} placeholder="UKMTO, US CENTCOM..." />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={onSave} disabled={saving} style={{ padding: "9px 20px", background: "#7f1d1d", color: "#fca5a5", border: "1px solid #ef4444", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
          {saving ? "Saving..." : "Save Alert"}
        </button>
        <button onClick={onCancel} style={{ padding: "9px 20px", background: "transparent", color: "#64748b", border: "1px solid #1e293b", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
 
function StatCard({ stat, saving, onChange, onSave, riskColor }: {
  stat: HotspotStat; saving: boolean
  onChange: (s: HotspotStat) => void; onSave: () => void
  riskColor: Record<string, string>
}) {
  return (
    <div style={{ background: "#0d1220", border: "1px solid #1e293b", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskColor[stat.risk_level] || "#64748b" }} />
        <span style={{ fontSize: 14, color: "#f1f5f9" }}>{HOTSPOT_LABELS[stat.hotspot]}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Active Vessels</Label>
          <Input
            type="number"
            value={String(stat.active_vessels)}
            onChange={(v) => onChange({ ...stat, active_vessels: parseInt(v) || 0 })}
          />
        </div>
        <div>
          <Label>Daily Transits</Label>
          <Input
            type="number"
            value={String(stat.daily_transits)}
            onChange={(v) => onChange({ ...stat, daily_transits: parseInt(v) || 0 })}
          />
        </div>
        <div>
          <Label>Avg Wait Time</Label>
          <Input
            value={stat.avg_wait_time}
            onChange={(v) => onChange({ ...stat, avg_wait_time: v })}
            placeholder="e.g. 2.5h"
          />
        </div>
        <div>
          <Label>Market Volume (MT)</Label>
          <Input
            type="number"
            value={String(stat.market_volume)}
            onChange={(v) => onChange({ ...stat, market_volume: parseInt(v) || 0 })}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label>Risk Level</Label>
          <Select value={stat.risk_level} onChange={(v) => onChange({ ...stat, risk_level: v })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ marginTop: 14, width: "100%", padding: "9px", background: "#064e3b", color: "#10b981", border: "1px solid #10b981", borderRadius: 6, cursor: "pointer", fontSize: 12, letterSpacing: 1 }}
      >
        {saving ? "Saving..." : "SAVE STATS"}
      </button>
    </div>
  )
}
 
// ── Primitive UI helpers ──────────────────────────────────
 
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: "#475569", marginBottom: 5, letterSpacing: 1, textTransform: "uppercase" }}>{children}</div>
}
 
function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "8px 10px", background: "#0a0e1a",
        border: "1px solid #1e293b", borderRadius: 6, color: "#e2e8f0",
        fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
        outline: "none",
      }}
    />
  )
}
 
function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      style={{
        width: "100%", padding: "8px 10px", background: "#0a0e1a",
        border: "1px solid #1e293b", borderRadius: 6, color: "#e2e8f0",
        fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
        outline: "none", resize: "vertical",
      }}
    />
  )
}
 
function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", background: "#0a0e1a",
        border: "1px solid #1e293b", borderRadius: 6, color: "#e2e8f0",
        fontSize: 13, fontFamily: "inherit", boxSizing: "border-box",
        outline: "none",
      }}
    >
      {children}
    </select>
  )
}
 
function smallBtn(bg: string, color: string) {
  return {
    padding: "5px 10px", background: bg, color, border: `1px solid ${color}22`,
    borderRadius: 4, cursor: "pointer", fontSize: 10, letterSpacing: 1, fontFamily: "inherit",
  } as React.CSSProperties
}
 
