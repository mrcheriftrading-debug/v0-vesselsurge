import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock, ExternalLink, Globe2, Map, Newspaper, Radar, ShieldAlert, TrendingUp } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache, type MaritimeDashboardResponse } from "@/lib/maritime-dashboard-cache"
import { buildOfflineMaritimeDashboardSnapshot } from "@/lib/maritime-offline-snapshot"
import { BASE_URL } from "@/lib/seo"
import { isTierOneNewsSource, maritimeArticleIntelligenceScore, maritimeSourceQualityLabel } from "@/lib/maritime-source-quality"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const revalidate = 300

type LatestArticle = MaritimeDashboardResponse["data"]["articles"][number]

export const metadata: Metadata = {
  title: "News & Risk, Latest Maritime News and Chokepoint Signals",
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
    title: "News & Risk, Latest Maritime News and Chokepoint Signals | VesselSurge",
    description:
      "Fresh source-reviewed maritime news connected to VesselSurge live map context for critical shipping routes.",
    images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "VesselSurge latest maritime news" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "News & Risk, Latest Maritime News and Chokepoint Signals | VesselSurge",
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

const globalRiskLinks = [
  { href: "/topics/global-shipping-route-risk", label: "Global route risk", text: "Compare chokepoint exposure and disruption pressure." },
  { href: "/topics/port-congestion-tracker", label: "Port congestion", text: "Track vessel queues, canal flow and delay signals." },
  { href: "/topics/maritime-security-alerts", label: "Security alerts", text: "Review vessel threat, piracy and route-risk context." },
  { href: "/topics/ocean-freight-intelligence", label: "Ocean freight", text: "Connect maritime disruption with cost pressure." },
]

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
  const tierOneCount = articles.filter((article) => isTierOneNewsSource(article.source)).length
  const articleIntelScore = (article: LatestArticle) => article.intelligenceScore ?? maritimeArticleIntelligenceScore({
    source: article.source,
    timestamp: article.timestamp,
    title: article.title,
    summary: article.summary,
    region: article.region,
  })
  const averageIntelligenceScore = articles.length
    ? Math.round(articles.reduce((sum, article) => sum + articleIntelScore(article), 0) / articles.length)
    : 0
  const qualityAudit = payload.data.qualityAudit
  const sourceQualityRows = Array.from(new Set(articles.map((article) => article.source).filter(Boolean)))
    .map((source) => ({
      source,
      count: articles.filter((article) => article.source === source).length,
      label: maritimeSourceQualityLabel(source),
      averageScore: Math.round(
        articles
          .filter((article) => article.source === source)
          .reduce((sum, article) => sum + articleIntelScore(article), 0) /
          Math.max(1, articles.filter((article) => article.source === source).length),
      ),
    }))
    .sort((a, b) => Number(isTierOneNewsSource(b.source)) - Number(isTierOneNewsSource(a.source)) || b.averageScore - a.averageScore || b.count - a.count)
    .slice(0, 8)
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
                News & Risk
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Global maritime news tied to live route risk.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                Source-reviewed shipping headlines, chokepoint signals and global route context for operators, freight desks, insurers and market watchers.
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
            <div className="rounded-xl border border-border bg-card/55 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between lg:flex-col">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Feed refreshed
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{formatTime(generatedAt)}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Reviewed items</div>
                  <div className="mt-1 text-2xl font-black text-foreground">{articles.length}</div>
                </div>
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Tier-1 hits</div>
                  <div className="mt-1 text-2xl font-black text-foreground">{tierOneCount}</div>
                </div>
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Intel score</div>
                  <div className="mt-1 text-2xl font-black text-foreground">{averageIntelligenceScore}</div>
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
            <aside className="min-w-0 space-y-4">
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <Globe2 className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-bold text-foreground">Global risk desk</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Fresh maritime news is grouped by route exposure so visitors can move from headline to map, region page or market context without hunting.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <ShieldAlert className="h-6 w-6 text-accent" />
                <h2 className="mt-4 text-xl font-bold text-foreground">Source discipline</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Items stay source-linked or clearly marked as saved context. Tier-1 source sweeps now include Bloomberg, Al Jazeera, New York Times, Reuters/AP via news search, BBC, Financial Times, Guardian and CNBC.
                </p>
                {qualityAudit ? (
                  <div className="mt-4 rounded-lg border border-border bg-background/55 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Automated review</p>
                      <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] font-black uppercase text-foreground">
                        {qualityAudit.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{qualityAudit.recommendations[0]}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                      <span className="rounded-md border border-border bg-card px-2 py-1">Official {qualityAudit.sourceMix.official}</span>
                      <span className="rounded-md border border-border bg-card px-2 py-1">Tier-1 {qualityAudit.sourceMix.tierOne}</span>
                      <span className="rounded-md border border-border bg-card px-2 py-1">Trade {qualityAudit.sourceMix.trade}</span>
                    </div>
                  </div>
                ) : null}
                <div className="mt-4 grid gap-2">
                  {sourceQualityRows.length > 0 ? sourceQualityRows.map((item) => (
                    <div key={item.source} className="flex min-w-0 max-w-full items-center justify-between gap-3 overflow-hidden rounded-lg border border-border bg-background/55 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{item.source}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.label}</p>
                      </div>
                      <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] font-black text-muted-foreground">
                        {item.count} · {item.averageScore}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">Source watch activates when live articles are available.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card/50 p-5">
                <Radar className="h-6 w-6 text-cyan-300" />
                <h2 className="mt-4 text-xl font-bold text-foreground">Coverage paths</h2>
                <div className="mt-4 grid gap-2">
                  {globalRiskLinks.map((item) => (
                    <Link key={item.href} href={item.href} className="group rounded-lg border border-border bg-background/55 p-3 transition-colors hover:border-primary/30">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-foreground">{item.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/pro-market" className="block rounded-xl border border-primary/30 bg-primary/10 p-5 transition-colors hover:border-primary/60">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-xl font-bold text-foreground">Market impact report</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Turn these shipping headlines into research context for oil, freight, tanker stocks, logistics equities and insurance pressure.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  View Market Pro <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </aside>

            <div className="min-w-0">
              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-foreground">Latest reviewed signals</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Published times, source links and live-map routes stay visible on every item.</p>
                </div>
                <Link href="/map-dashboard" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary/30 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10">
                  Open map <Map className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-3">
              {articles.map((article) => (
                <article key={`${article.id}-${article.sourceUrl}`} className="rounded-xl border border-border bg-card/50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <span className="rounded-md border border-border bg-background/60 px-2 py-1">{regionName(article.region)}</span>
                        <span>{article.source}</span>
                        <span className={`rounded-md border px-2 py-1 ${
                          isTierOneNewsSource(article.source)
                            ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-200"
                            : "border-border bg-background/60 text-muted-foreground"
                        }`}>
                          {maritimeSourceQualityLabel(article.source)}
                        </span>
                        <span>{formatTime(article.timestamp)}</span>
                        {typeof articleIntelScore(article) === "number" ? (
                          <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-emerald-200">
                            Intel {articleIntelScore(article)}
                          </span>
                        ) : null}
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
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteFooter />
    </div>
  )
}
