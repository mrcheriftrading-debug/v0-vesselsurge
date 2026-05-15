"use client"

import { useEffect, useMemo, useState } from "react"

type SocialItem = {
  id: string
  title: string
  source: string
  sourceUrl: string | null
  region: string
  timestamp: string
  postText: string
  liveMapUrl: string
  approval: {
    status: string
    score: number
    reasons: string[]
  }
}

type SocialFeed = {
  success: boolean
  items: SocialItem[]
  review?: {
    approved: number
    rejected: number
    approvedBy: string
  }
}

const REGION_LABELS: Record<string, string> = {
  hormuz: "Strait of Hormuz",
  bab: "Bab el-Mandeb",
  malacca: "Strait of Malacca",
  suez: "Suez Canal",
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown time"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function SocialQueuePage() {
  const [items, setItems] = useState<SocialItem[]>([])
  const [review, setReview] = useState<SocialFeed["review"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [region, setRegion] = useState("all")

  useEffect(() => {
    async function loadQueue() {
      setLoading(true)
      const params = new URLSearchParams({ limit: "20" })
      if (region !== "all") params.set("region", region)
      const response = await fetch(`/api/social/x-feed?${params.toString()}`, { cache: "no-store" })
      const payload = (await response.json()) as SocialFeed
      setItems(payload.items || [])
      setReview(payload.review || null)
      setLoading(false)
    }

    loadQueue()
  }, [region])

  const nextPost = items[0]
  const composeUrl = useMemo(() => {
    if (!nextPost) return null
    return `https://x.com/intent/tweet?text=${encodeURIComponent(nextPost.postText)}`
  }, [nextPost])

  async function copyPost(item: SocialItem) {
    await navigator.clipboard.writeText(item.postText)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  return (
    <main style={{ minHeight: "100vh", background: "#070b12", color: "#e5eefb", fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid #1f2937", background: "#0b1220", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: 99, background: "#22c55e", boxShadow: "0 0 16px rgba(34,197,94,.75)" }} />
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.6, color: "#7dd3fc", textTransform: "uppercase" }}>VesselSurge</div>
            <h1 style={{ fontSize: 22, lineHeight: 1.2, margin: "2px 0 0" }}>X Approval Queue</h1>
          </div>
          <a href="/admin" style={{ marginLeft: "auto", color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>Admin Panel</a>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 260px", gap: 18, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                style={{ background: "#111827", color: "#dbeafe", border: "1px solid #263244", borderRadius: 6, padding: "9px 10px", fontSize: 13 }}
              >
                <option value="all">All hotspots</option>
                <option value="hormuz">Strait of Hormuz</option>
                <option value="bab">Bab el-Mandeb</option>
                <option value="malacca">Strait of Malacca</option>
                <option value="suez">Suez Canal</option>
              </select>
              {review && (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>
                  {review.approved} approved · {review.rejected} rejected by marketing agent
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ color: "#64748b", padding: 24, border: "1px solid #1f2937", borderRadius: 8 }}>Loading approved posts...</div>
            ) : items.length === 0 ? (
              <div style={{ color: "#94a3b8", padding: 24, border: "1px solid #1f2937", borderRadius: 8 }}>No approved posts for this filter.</div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {items.map((item) => (
                  <article key={item.id} style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 8, padding: 18 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, color: "#94a3b8", fontSize: 12 }}>
                      <span style={{ color: "#38bdf8" }}>{REGION_LABELS[item.region] || item.region}</span>
                      <span>·</span>
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{formatTime(item.timestamp)}</span>
                      <span style={{ marginLeft: "auto", color: "#86efac" }}>Score {item.approval.score}</span>
                    </div>
                    <h2 style={{ fontSize: 17, lineHeight: 1.35, margin: "0 0 14px", color: "#f8fafc" }}>{item.title}</h2>
                    <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: 0, padding: 14, background: "#050914", border: "1px solid #162033", borderRadius: 6, color: "#dbeafe", font: "13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                      {item.postText}
                    </pre>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                      <a
                        href={`https://x.com/intent/tweet?text=${encodeURIComponent(item.postText)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ background: "#2563eb", color: "white", borderRadius: 6, padding: "9px 13px", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
                      >
                        Approve & Open in X
                      </a>
                      <button
                        onClick={() => copyPost(item)}
                        style={{ background: "#111827", color: "#dbeafe", border: "1px solid #263244", borderRadius: 6, padding: "9px 13px", fontSize: 13, cursor: "pointer" }}
                      >
                        {copiedId === item.id ? "Copied" : "Copy"}
                      </button>
                      {item.sourceUrl && (
                        <a href={item.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#93c5fd", padding: "9px 0", fontSize: 13 }}>
                          Source
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside style={{ position: "sticky", top: 16, background: "#0b1220", border: "1px solid #1f2937", borderRadius: 8, padding: 16 }}>
            <div style={{ color: "#7dd3fc", fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>Manual approval</div>
            <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.55, margin: "0 0 14px" }}>
              The agent prepares and filters posts. You approve by opening the post in X and clicking Post.
            </p>
            {composeUrl && (
              <a href={composeUrl} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", background: "#16a34a", color: "white", borderRadius: 6, padding: "10px 12px", textDecoration: "none", fontSize: 13, fontWeight: 800 }}>
                Open Next Approved Post
              </a>
            )}
            <div style={{ marginTop: 14, color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
              Zapier can stay off while you use this page. Nothing is posted unless you click through to X.
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
