import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock, ExternalLink, Map, Newspaper, Radar, ShieldAlert } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache, type MaritimeDashboardResponse } from "@/lib/maritime-dashboard-cache"
import { buildOfflineMaritimeDashboardSnapshot } from "@/lib/maritime-offline-snapshot"
import { BASE_URL } from "@/lib/seo"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const revalidate = 300

type LatestArticle = MaritimeDashboardResponse["data"]["articles"][number]

export const metadata: Metadata = {
  title: "Latest Maritime News, Chokepoint Signals and Shipping Risk Updates",
  description:
    "Read latest source-reviewed maritime news and route-risk signals for Hormuz, Red Sea, Suez, Malacca, tanker tracking, freight pressure and shipping disruption.",
  alternates: { canonical: `${BASE_URL}/latest` },
  keywords: [
    "latest maritime news",
    "shipping news today",
    "chokepoint news",
    "Red Sea shipping risk",
    "Strait of Hormuz news",
    "Suez Canal traffic",
    "Malacca piracy alerts",
  ],
  openGraph: {
    type: "website",
    url: `${BASE_URL}/latest`,
    siteName: "VesselSurge",
    title: "Latest Maritime News and Chokepoint Signals | VesselSurge",
    description:
      "Fresh source-reviewed maritime news connected to VesselSurge live map context for critical shipping routes.",
    images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "VesselSurge latest maritime news" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest Maritime News and Chokepoint Signals | VesselSurge",
    description: "Fresh maritime news, shipping risk signals and live map context.",
    images: [`${BASE_URL}/og-image.jpg`],
  },
}

function formatTime(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "Time unavailable"

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)
}

function regionName(region: string) {
  return {
    hormuz: "Strait of Hormuz",
    bab: "Bab el-Mandeb",
    suez: "Suez Canal",
    malacca: "Strait of Malacca",
  }[region] || "Global"
}

function mapHref(region: string) {
  return region && region !== "global" ? `/map-dashboard?hotspot=${region}` : "/map-dashboard"
}

function dedupeArticles(articles: LatestArticle[]) {
  const seen = new Set<string>()
  return articles.filter((article) => {
    const key = (article.sourceUrl || `${article.source}:${article.title}`).toLowerCase().trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function loadLatestData() {
  const admin = createAdminClient()
  const cached = await getFreshMaritimeDashboardCache(admin)
    .catch(() => getLastMaritimeDashboardCache(admin, "fresh latest-news cache unavailable; serving last known source-reviewed maritime news"))
    .catch(() => null)

  return cached || buildOfflineMaritimeDashboardSnapshot("latest-news cache unavailable; serving bundled source-reviewed route context")
}

export default async function LatestMaritimeNewsPage() {
  const payload = await loadLatestData()
  const articles = dedupeArticles(payload.data.articles)
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 36)
  const byRegion = ["hormuz", "bab", "suez", "malacca"].map((region) => ({
    region,
    count: articles.filter((article) => article.region === region).length,
    hotspot: payload.data.hotspots.find((hotspot) => hotspot.hotspot === region),
  }))
  const generatedAt = payload.meta.generatedAt || payload.data.timestamp

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${BASE_URL}/latest#webpage`,
        url: `${BASE_URL}/latest`,
        name: "Latest Maritime News and Chokepoint Signals",
        description:
          "Latest source-reviewed maritime news and VesselSurge route-risk context for critical chokepoints.",
        isPartOf: { "@id": `${BASE_URL}/#website` },
        dateModified: generatedAt,
      },
      {
        "@type": "ItemList",
        "@id": `${BASE_URL}/latest#latest-items`,
        name: "Latest VesselSurge maritime news items",
        itemListElement: articles.slice(0, 20).map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: article.sourceUrl || `${BASE_URL}${mapHref(article.region)}`,
          name: article.title,
          description: article.summary,
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">
                <Newspaper className="h-3.5 w-3.5" />
                Latest maritime news
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Fresh maritime news tied to the live map.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                Source-reviewed shipping headlines, chokepoint signals and live route context for Hormuz, Red Sea, Suez and Malacca.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/map-dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Open live map <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/feed.xml" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.04]">
                  RSS feed <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Feed refreshed
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{formatTime(generatedAt)}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {byRegion.map(({ region, count, hotspot }) => (
                  <Link key={region} href={mapHref(region)} className="rounded-lg border border-border bg-background/55 p-4 transition-colors hover:border-primary/30">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{regionName(region)}</div>
                    <div className="mt-2 text-2xl font-black text-foreground">{count}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{hotspot?.riskLevel || "watch"} risk context</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.72fr_1.28fr]">
            <aside className="space-y-4">
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <Radar className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-bold text-foreground">Why this page exists</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Search visitors want fresh shipping news first. VesselSurge turns that intent into live map usage, route pages and network leads.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <ShieldAlert className="h-6 w-6 text-accent" />
                <h2 className="mt-4 text-xl font-bold text-foreground">No fake breaking claims</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Items are source-linked or clearly marked as saved context when live feeds are unavailable.
                </p>
              </div>
            </aside>

            <div className="grid gap-3">
              {articles.map((article) => (
                <article key={`${article.id}-${article.sourceUrl}`} className="rounded-xl border border-border bg-card/50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <span className="rounded-md border border-border bg-background/60 px-2 py-1">{regionName(article.region)}</span>
                        <span>{article.source}</span>
                        <span>{formatTime(article.timestamp)}</span>
                      </div>
                      <h2 className="mt-3 text-lg font-bold leading-snug text-foreground">{article.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{article.summary}</p>
                    </div>
                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <Link href={mapHref(article.region)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary/30 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10">
                        <Map className="h-4 w-4" />
                        Map
                      </Link>
                      {article.sourceUrl ? (
                        <a href={article.sourceUrl} rel="nofollow noreferrer" target="_blank" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-xs font-bold text-foreground transition-colors hover:bg-white/[0.04]">
                          Source <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteFooter />
    </div>
  )
}
