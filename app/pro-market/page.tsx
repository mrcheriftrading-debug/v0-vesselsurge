import Link from 'next/link'
import type { Metadata } from 'next'
import {
  AlertTriangle,
  ArrowRight,
  Activity,
  CheckCircle2,
  LockKeyhole,
  Radar,
} from 'lucide-react'
import { SiteNavigation } from '@/components/site-navigation'
import { Button } from '@/components/ui/button'
import { isAdminEmail } from '@/lib/admin-access'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFallbackUser } from '@/lib/fallback-auth'
import { buildMarketImpactReport } from '@/lib/market-impact'
import { getFreshMarketProAnalysisCache, getLastMarketProAnalysisCache, upsertMarketProAnalysisCache } from '@/lib/market-pro-cache'
import { getMarketSnapshot } from '@/lib/market-snapshot'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache, type MaritimeDashboardResponse } from '@/lib/maritime-dashboard-cache'
import { getUserProSubscription, isActiveProSubscription } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.vesselsurge.com'

export const metadata: Metadata = {
  title: 'Live Markets and AI Shipping Risk Analysis | VesselSurge Market Pro',
  description: 'Choose stocks, crypto or currencies and compare the live market tape with AI analysis of how maritime news may move markets.',
  keywords: [
    'shipping risk stock market impact',
    'maritime market intelligence',
    'oil market shipping risk',
    'tanker stock market analysis',
    'freight rate signals',
    'war-risk insurance shipping',
    'Strait of Hormuz oil risk',
    'Red Sea shipping risk',
    'Suez Canal market impact',
    'Malacca Strait maritime risk',
  ],
  alternates: {
    canonical: 'https://www.vesselsurge.com/pro-market',
  },
  robots: { index: true, follow: true },
}

type Report = ReturnType<typeof buildMarketImpactReport>
type MarketSnapshotReport = NonNullable<Report['marketSnapshot']>
type MarketQuoteReport = MarketSnapshotReport['quotes'][number]
type AssetCategory = 'stocks' | 'crypto' | 'fx'

const assetCategories: Array<{ id: AssetCategory; label: string; description: string }> = [
  {
    id: 'stocks',
    label: 'Stocks',
    description: 'Indices, transports and listed shipping exposure',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    description: 'Bitcoin, Ethereum and high-beta risk appetite',
  },
  {
    id: 'fx',
    label: 'Currencies',
    description: 'Dollar, SEK and major FX stress channels',
  },
]

export default async function ProMarketPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string; asset?: string }>
}) {
  const paramsPromise: Promise<{ checkout?: string; asset?: string }> = searchParams ?? Promise.resolve({})
  const [params, authState] = await Promise.all([
    paramsPromise,
    loadAuthState(),
  ])
  const { user, hasAccess } = authState
  const selectedCategory = normalizeAssetCategory(params?.asset)
  const report = hasAccess ? await loadReport({ allowDirectDatabaseFallback: true }) : null

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <SiteNavigation />
      <ProductJsonLd />

      <section className="border-b border-slate-200 bg-white px-4 pb-10 pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                <Radar className="h-4 w-4 text-sky-700" />
                VesselSurge Market Impact Pro
              </div>

              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Live markets beside AI analysis of what maritime news may move next.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Pick stocks, crypto or currencies. The left panel shows the live market tape; the right panel explains what the AI expects, why it expects it, and which VesselSurge news is driving the view. No invented breaking news. No buy or sell calls.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {hasAccess ? (
                  <span className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-4 text-sm font-bold text-white">
                    Pro access active
                  </span>
                ) : user ? (
                  <form action="/api/stripe/checkout" method="post">
                    <Button type="submit" className="min-h-11 bg-slate-950 text-white hover:bg-slate-800">
                      Unlock full report
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <>
                    <Link href={proMarketSignUpHref(selectedCategory)}>
                      <Button className="min-h-11 bg-slate-950 text-white hover:bg-slate-800">
                        Create account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/auth/login?next=/pro-market">
                      <Button variant="outline" className="min-h-11 border-slate-300 bg-white text-slate-950">
                        Log in
                      </Button>
                    </Link>
                  </>
                )}
              </div>

            </div>

            <div>
              <PricingCard hasAccess={hasAccess} isLoggedIn={Boolean(user)} selectedCategory={selectedCategory} />
            </div>
          </div>
        </div>
      </section>

      <CheckoutStatus status={params?.checkout} />

      <section className="px-4 py-10">
        {report ? (
          <UnlockedReport report={report} selectedCategory={selectedCategory} />
        ) : (
          <LockedAnalysisSection isLoggedIn={Boolean(user)} selectedCategory={selectedCategory} />
        )}
      </section>
    </main>
  )
}

function ProductJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'VesselSurge Market Impact Pro',
          description: 'Live stocks, crypto and currency market tape paired with source-backed AI analysis of maritime news and shipping-risk market impact.',
          brand: { '@type': 'Brand', name: 'VesselSurge' },
          offers: {
            '@type': 'Offer',
            price: '199',
            priceCurrency: 'SEK',
            availability: 'https://schema.org/InStock',
            url: 'https://www.vesselsurge.com/pro-market',
          },
        }),
      }}
    />
  )
}

function PricingCard({
  hasAccess,
  isLoggedIn,
  selectedCategory,
}: {
  hasAccess: boolean;
  isLoggedIn: boolean;
  selectedCategory: AssetCategory;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Market Pro</p>
          <h2 className="mt-2 text-2xl font-black">199 kr / 14 days</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Unlock one focused workspace: live market tape on the left and AI market reasoning with source news on the right.
          </p>
        </div>
        <div className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-black uppercase text-slate-100">
          {hasAccess ? 'Active' : 'Pro'}
        </div>
      </div>

      <div className="mt-5">
        {hasAccess ? (
          <div className="flex min-h-11 items-center justify-center rounded-md bg-emerald-500 px-4 text-sm font-black text-emerald-950">
            Pro access active
          </div>
        ) : isLoggedIn ? (
          <form action="/api/stripe/checkout" method="post">
            <input type="hidden" name="asset" value={selectedCategory} />
            <Button type="submit" className="min-h-11 w-full bg-white text-slate-950 hover:bg-slate-100">
              Start subscription
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <Link href={proMarketSignUpHref(selectedCategory)}>
            <Button className="min-h-11 w-full bg-white text-slate-950 hover:bg-slate-100">
              Create account to unlock
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Stripe subscription checkout
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Stocks, crypto and currency categories
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          Source-backed news trail, no trade calls
        </div>
      </div>
    </div>
  )
}

function UnlockedReport({ report, selectedCategory }: { report: Report; selectedCategory: AssetCategory }) {
  return (
    <div className="mx-auto max-w-7xl">
      <MarketCategorySelector selectedCategory={selectedCategory} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.96fr_1.04fr]">
        <LiveMarketWorkspace report={report} selectedCategory={selectedCategory} />
        <AiMarketWorkspace report={report} selectedCategory={selectedCategory} />
      </div>

      <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        {report.disclaimer}
      </div>
    </div>
  )
}

function MarketCategorySelector({ selectedCategory }: { selectedCategory: AssetCategory }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Choose market category</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Live market plus AI outlook</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {assetCategories.map((category) => {
            const active = category.id === selectedCategory
            return (
              <Link
                key={category.id}
                href={`/pro-market?asset=${category.id}`}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md border px-4 py-3 text-sm transition ${
                  active
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                }`}
              >
                <span className="block font-black">{category.label}</span>
                <span className={`mt-1 block text-xs leading-5 ${active ? 'text-slate-200' : 'text-slate-500'}`}>{category.description}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LiveMarketWorkspace({ report, selectedCategory }: { report: Report; selectedCategory: AssetCategory }) {
  const snapshot = report.marketSnapshot
  const quotes = categoryMarketQuotes(snapshot, selectedCategory)

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">1. Live market</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{categoryLabel(selectedCategory)} tape</h2>
          </div>
          <Activity className="h-5 w-5 text-sky-700" />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select a category and scan the instruments in that market. These quotes feed the AI outlook beside it.
        </p>
      </div>

      {!snapshot ? (
        <div className="p-5">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-950">
            Live market quotes are temporarily unavailable. VesselSurge still keeps the maritime AI analysis active from the news and signal layer.
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {quotes.slice(0, 4).map((quote) => (
              <QuoteTile key={quote.symbol} quote={quote} />
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
            <div className="grid grid-cols-[1fr_0.7fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              <span>Instrument</span>
              <span className="text-right">Price</span>
              <span className="text-right">Move</span>
            </div>
            {(quotes.length ? quotes : snapshot.quotes.slice(0, 8)).map((quote) => (
              <div key={quote.symbol} className="grid grid-cols-[1fr_0.7fr_0.7fr] border-t border-slate-200 px-4 py-3 text-sm">
                <div>
                  <p className="font-black text-slate-950">{quote.label}</p>
                  <p className="text-xs font-semibold text-slate-500">{quote.symbol}</p>
                </div>
                <p className="self-center text-right font-black text-slate-950">{formatMarketPrice(quote)}</p>
                <p className={`self-center text-right font-black ${quote.change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatMarketMove(quote)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-500">
            Source: <Link href={snapshot.sourceUrl} target="_blank" className="text-sky-700 hover:underline">{snapshot.source}</Link>. Updated {formatDateTime(snapshot.generatedAt)}.
          </p>
        </div>
      )}
    </section>
  )
}

function AiMarketWorkspace({ report, selectedCategory }: { report: Report; selectedCategory: AssetCategory }) {
  const outlook = buildCategoryOutlook(report, selectedCategory)

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">2. AI market view</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">What the AI expects next</h2>
          </div>
          <Radar className="h-5 w-5 text-sky-700" />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is a source-backed research outlook, not a buy/sell signal. It explains direction, confidence and the exact news behind the view.
        </p>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-4 lg:grid-cols-[0.44fr_0.56fr]">
          <div className="rounded-md border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">AI outlook</p>
            <h3 className="mt-3 text-2xl font-black leading-tight">{outlook.direction}</h3>
            <div className="mt-5 flex items-end gap-3">
              <p className="text-6xl font-black">{outlook.score}</p>
              <p className="pb-2 text-xs font-bold uppercase text-slate-300">{outlook.confidence}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{outlook.summary}</p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Why the AI thinks this</p>
            <div className="mt-4 grid gap-3">
              {outlook.why.map((reason) => (
                <div key={reason} className="flex gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1fr_7rem] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            <span>News behind the analysis</span>
            <span className="text-right">Score</span>
          </div>
          {outlook.news.length ? (
            outlook.news.map((story) => (
              <div key={`${story.kind}-${story.id}`} className="grid grid-cols-[1fr_7rem] gap-4 border-t border-slate-200 px-4 py-4 text-sm">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{story.source}</span>
                    <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-bold text-sky-800">{story.sourceQualityLabel}</span>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{formatDateTime(story.timestamp || report.generatedAt)}</span>
                  </div>
                  <h3 className="font-black leading-snug text-slate-950">{story.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{story.summary}</p>
                  {story.sourceUrl && (
                    <Link href={story.sourceUrl} target="_blank" className="mt-2 inline-flex text-sm font-bold text-sky-700 hover:underline">
                      Open source
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-black ${scorePillClass(story.score)}`}>{story.score}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="border-t border-slate-200 px-4 py-6 text-sm font-semibold text-slate-600">
              The AI is waiting for stronger source-backed maritime news before raising a directional market view.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <BriefPoint label="Market tape" body={outlook.marketTape} />
          <BriefPoint label="Maritime trigger" body={outlook.trigger} />
          <BriefPoint label="Watch next" body={outlook.watchNext} />
        </div>
      </div>
    </section>
  )
}

function QuoteTile({ quote }: { quote: MarketQuoteReport }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{quote.symbol}</p>
      <h3 className="mt-1 font-black text-slate-950">{quote.label}</h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-xl font-black text-slate-950">{formatMarketPrice(quote)}</p>
        <p className={`font-black ${quote.change >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatMarketMove(quote)}</p>
      </div>
    </div>
  )
}

function BriefPoint({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{body}</p>
    </div>
  )
}

function LockedAnalysisSection({ isLoggedIn, selectedCategory }: { isLoggedIn: boolean; selectedCategory: AssetCategory }) {
  const signUpHref = proMarketSignUpHref(selectedCategory)

  return (
    <div className="mx-auto max-w-7xl">
      <MarketCategorySelector selectedCategory={selectedCategory} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.96fr_1.04fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">1. Live market</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{categoryLabel(selectedCategory)} tape</h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {['Live quotes', 'Price move', 'Market time', 'Category table'].map((item) => (
              <div key={item} className="flex min-h-24 flex-col justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
                <LockKeyhole className="h-5 w-5 text-slate-500" />
                <p className="text-sm font-black text-slate-950">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">2. AI market view</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">AI outlook locked</h2>
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-slate-600">
              Paid accounts see the live quote tape beside the AI explanation of how source-backed maritime news may move {categoryLabel(selectedCategory).toLowerCase()}.
            </p>
            <div className="mt-5">
              {isLoggedIn ? (
                <form action="/api/stripe/checkout" method="post">
                  <input type="hidden" name="asset" value={selectedCategory} />
                  <Button type="submit" className="min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800">
                    Unlock Market Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Link href={signUpHref}>
                  <Button className="min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800">
                    Create account to unlock
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function normalizeAssetCategory(value: string | null | undefined): AssetCategory {
  if (value === 'crypto' || value === 'fx' || value === 'stocks') return value
  return 'stocks'
}

function proMarketSignUpHref(category: AssetCategory) {
  return `/auth/sign-up?next=${encodeURIComponent(`/pro-market?asset=${category}`)}`
}

function categoryLabel(category: AssetCategory) {
  if (category === 'crypto') return 'Crypto'
  if (category === 'fx') return 'Currencies'
  return 'Stocks'
}

function categoryMarketQuotes(snapshot: MarketSnapshotReport | null | undefined, category: AssetCategory) {
  if (!snapshot) return []

  return snapshot.quotes.filter((quote) => {
    if (category === 'stocks') return quote.group === 'Equities' || quote.group === 'Transport'
    if (category === 'crypto') return quote.group === 'Crypto'
    return quote.group === 'FX' || quote.group === 'Currencies'
  })
}

function averageQuoteMove(quotes: MarketQuoteReport[]) {
  const clean = quotes
    .map((quote) => quote.changePercent)
    .filter((value) => Number.isFinite(value))

  if (!clean.length) return 0
  return clean.reduce((sum, value) => sum + value, 0) / clean.length
}

function categoryAssetImpacts(report: Report, category: AssetCategory) {
  return report.assetImpacts.filter((asset) => {
    if (category === 'stocks') {
      return /equity|tanker|container|logistics|airlines|industrial/i.test(asset.asset)
    }

    if (category === 'crypto') {
      return /equity|dollar|rates|oil|fuel/i.test(`${asset.asset} ${asset.bias} ${asset.drivers.join(' ')}`)
    }

    return /equity|oil|fuel|insurance/i.test(`${asset.asset} ${asset.bias} ${asset.drivers.join(' ')}`)
  })
}

function categoryAverageAssetScore(report: Report, category: AssetCategory) {
  const impacts = categoryAssetImpacts(report, category)
  if (!impacts.length) return report.marketPressureScore
  return Math.round(impacts.reduce((sum, impact) => sum + impact.score, 0) / impacts.length)
}

function buildCategoryOutlook(report: Report, category: AssetCategory) {
  const quotes = categoryMarketQuotes(report.marketSnapshot, category)
  const quoteMove = averageQuoteMove(quotes)
  const categoryScore = categoryAverageAssetScore(report, category)
  const score = Math.max(0, Math.min(100, Math.round(categoryScore * 0.72 + report.marketTapeScore * 0.28)))
  const leadStory = report.topStories[0]
  const leadAsset = categoryAssetImpacts(report, category)[0] || report.assetImpacts[0]
  const moveText = `${quoteMove >= 0 ? '+' : ''}${formatNumber(quoteMove, 2)}%`
  const pressureText = `${report.marketPressureScore}/100 Market Pro pressure`
  const leadSourceText = leadStory
    ? `${leadStory.source} is driving the top source signal: ${leadStory.title}`
    : 'No single source-backed maritime story is dominating the model right now'
  const assetText = leadAsset
    ? `${leadAsset.asset}: ${leadAsset.bias.toLowerCase()} (${leadAsset.score}/100)`
    : 'No strong asset-channel pressure is confirmed yet'

  let direction = 'Mixed / wait for confirmation'
  let summary = 'The live tape and maritime news are not aligned strongly enough for a high-conviction market-impact view yet.'

  if (category === 'stocks') {
    if (score >= 65 && quoteMove < 0) {
      direction = 'Downside pressure is active'
      summary = 'Stocks are already trading defensively while VesselSurge maritime pressure is elevated.'
    } else if (score >= 65) {
      direction = 'Upside may be capped by headline risk'
      summary = 'Stocks can still rise, but the model expects maritime headlines to matter if oil, freight or insurance pressure accelerates.'
    } else if (quoteMove > 0.4) {
      direction = 'Constructive but headline-sensitive'
      summary = 'The equity tape is positive, so the AI is watching whether shipping-risk headlines interrupt risk appetite.'
    }
  } else if (category === 'crypto') {
    if (score >= 62) {
      direction = 'Crypto risk appetite looks fragile'
      summary = 'Crypto is treated as a high-beta risk asset here; elevated oil, dollar or rates pressure can reduce appetite quickly.'
    } else if (quoteMove > 1) {
      direction = 'Crypto bid is absorbing macro risk'
      summary = 'Crypto momentum is positive, but the AI keeps the signal conditional on dollar, rates and escalation news.'
    } else {
      direction = 'Crypto is in watch mode'
      summary = 'The model does not see a clean maritime-to-crypto signal yet, so it watches broader risk appetite first.'
    }
  } else {
    const dollar = report.marketSnapshot?.quotes.find((quote) => quote.symbol === 'DX-Y.NYB')
    if ((dollar?.changePercent || 0) > 0.25 || score >= 62) {
      direction = 'Dollar pressure is the main FX risk'
      summary = 'The AI expects FX impact to show first through USD strength and SEK sensitivity if energy or route-risk pressure rises.'
    } else if (quoteMove < -0.25) {
      direction = 'Dollar pressure is easing'
      summary = 'The selected currency tape is less defensive, so the AI needs fresh escalation news before raising the FX risk view.'
    } else {
      direction = 'FX read is balanced'
      summary = 'Currencies are mixed; the AI is waiting for a clearer oil, rates or dollar impulse.'
    }
  }

  return {
    direction,
    score,
    confidence: report.confidence,
    summary,
    marketTape: report.marketSnapshot
      ? `${categoryLabel(category)} basket average ${moveText}. ${report.marketSnapshot.summary}`
      : 'Live market tape unavailable on this refresh.',
    trigger: leadSourceText,
    watchNext: report.watchTriggers[0],
    why: [
      `${categoryLabel(category)} basket average is ${moveText} on the live tape.`,
      `${pressureText}; AI confidence is ${report.confidence}.`,
      leadSourceText,
      assetText,
    ],
    news: report.topStories.slice(0, 4),
  }
}

function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

function formatMarketPrice(quote: MarketQuoteReport) {
  if (quote.valueType === 'yield') return `${formatNumber(quote.price, 2)}%`
  return `${formatNumber(quote.price, quote.price >= 1000 ? 1 : 2)} ${quote.currency}`.trim()
}

function formatMarketMove(quote: MarketQuoteReport) {
  if (quote.valueType === 'yield') {
    const move = quote.change * 100
    return `${move >= 0 ? '+' : ''}${formatNumber(move, 1)} bps`
  }

  return `${quote.changePercent >= 0 ? '+' : ''}${formatNumber(quote.changePercent, 2)}%`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Stockholm',
  }).format(new Date(value))
}

async function loadAuthState() {
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await withTimeout(
    supabase.auth.getUser(),
    2500,
    'market auth',
  ).catch(() => ({ data: { user: null } }))
  const user = supabaseUser || await getFallbackUser()
  const hasAdminAccess = isAdminEmail(supabaseUser?.email)
  const subscription = supabaseUser && !hasAdminAccess ? await getUserProSubscription(supabaseUser.id) : null

  return {
    user,
    hasAccess: hasAdminAccess || isActiveProSubscription(subscription),
  }
}

function CheckoutStatus({ status }: { status?: string }) {
  if (status !== 'success' && status !== 'cancelled') return null

  const success = status === 'success'
  return (
    <section className={`border-b px-4 py-4 ${success ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        {success ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        )}
        <div>
          <p className="font-bold text-slate-950">{success ? 'Payment received or processing' : 'Checkout was not completed'}</p>
          <p className="mt-1 text-sm text-slate-600">
            {success
              ? 'If access is not open yet, Stripe may still be confirming the subscription webhook. Refresh this page in a moment.'
              : 'Your account is still safe. You can restart checkout whenever you are ready.'}
          </p>
        </div>
      </div>
    </section>
  )
}

async function loadReport({ allowDirectDatabaseFallback }: { allowDirectDatabaseFallback: boolean }): Promise<Report> {
  const admin = createAdminClient()
  const cachedMarketPro = await withTimeout(getFreshMarketProAnalysisCache(admin), 1000, 'market pro cache').catch(() => null)
  if (cachedMarketPro?.report) return cachedMarketPro.report

  const [marketSnapshot, cached] = await Promise.all([
    withTimeout(getMarketSnapshot(), 4200, 'live market quotes').catch((error) => {
      console.warn('[pro-market] live market quotes fallback:', error)
      return null
    }),
    withTimeout(getFreshMaritimeDashboardCache(admin), 1500, 'market cache')
      .catch(() => withTimeout(getLastMaritimeDashboardCache(admin, 'fresh market cache unavailable; serving last known source-backed market context'), 1500, 'stale market cache').catch(() => null)),
  ])

  if (cached?.data) {
    const report = buildReportFromDashboardData(cached.data, marketSnapshot)
    await upsertMarketProAnalysisCache(admin, report, 'live-fallback').catch((error) => {
      console.warn('[pro-market] market pro cache write skipped:', error)
    })
    return report
  }

  const publicLiveReport = await loadPublicLiveMarketReport(marketSnapshot)
  if (!isEmptyReport(publicLiveReport)) {
    await upsertMarketProAnalysisCache(admin, publicLiveReport, 'live-fallback').catch((error) => {
      console.warn('[pro-market] market pro public fallback cache write skipped:', error)
    })
    return publicLiveReport
  }

  if (!allowDirectDatabaseFallback) {
    const stale = await getLastMarketProAnalysisCache(admin, 'fresh Market Pro sources unavailable; serving last saved analysis').catch(() => null)
    return stale?.report || buildMarketImpactReport([], [], marketSnapshot)
  }

  let news = null
  let signals = null
  let newsError = null
  let signalsError = null

  try {
    const [newsResult, signalsResult] = await withTimeout(
      Promise.all([
        admin
          .from('news_articles')
          .select('id, title, snippet, source, url, topic, region, published_at, created_at')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(90),
        admin
          .from('maritime_signals')
          .select('signal_key, title, summary, source, source_url, region, signal_type, observed_at, confidence')
          .order('observed_at', { ascending: false })
          .limit(70),
      ]),
      3000,
      'market report data',
    )

    news = newsResult.data
    signals = signalsResult.data
    newsError = newsResult.error
    signalsError = signalsResult.error
  } catch (error) {
    console.warn('[pro-market] market report data fallback:', error)
  }

  if (newsError || signalsError) {
    console.warn('[pro-market] failed to load live report data; using stale cache if available:', newsError || signalsError)
    const stale = await getLastMarketProAnalysisCache(admin, 'fresh Market Pro database query failed; serving last saved analysis').catch(() => null)
    if (stale?.report) return stale.report
  }

  const report = buildMarketImpactReport(news || [], signals || [], marketSnapshot)
  await upsertMarketProAnalysisCache(admin, report, 'live-fallback').catch((error) => {
    console.warn('[pro-market] market pro direct cache write skipped:', error)
  })
  return report
}

async function loadPublicLiveMarketReport(marketSnapshot: Report['marketSnapshot']) {
  try {
    const response = await fetch(`${BASE_URL}/api/maritime-data`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6500),
    })

    if (!response.ok) return buildMarketImpactReport([], [], marketSnapshot)
    const dashboard = (await response.json()) as MaritimeDashboardResponse
    if (!dashboard?.data) return buildMarketImpactReport([], [], marketSnapshot)
    return buildReportFromDashboardData(dashboard.data, marketSnapshot)
  } catch (error) {
    console.warn('[pro-market] public live report fallback failed:', error)
    return buildMarketImpactReport([], [], marketSnapshot)
  }
}

function buildReportFromDashboardData(data: MaritimeDashboardResponse['data'], marketSnapshot: Report['marketSnapshot']) {
  return buildMarketImpactReport(
    data.articles.map((article) => ({
      id: article.id,
      title: article.title,
      snippet: article.summary,
      source: article.source,
      url: article.sourceUrl,
      topic: article.category,
      region: article.region,
      published_at: article.timestamp,
    })),
    data.signals.map((signal) => ({
      signal_key: signal.signalKey,
      title: signal.title,
      summary: signal.summary,
      source: signal.source,
      source_url: signal.sourceUrl,
      region: signal.region,
      signal_type: signal.signalType,
      observed_at: signal.observedAt,
      confidence: signal.confidence,
    })),
    marketSnapshot,
  )
}

function isEmptyReport(report: Report) {
  return report.topStories.length === 0
}

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

function scorePillClass(score: number) {
  if (score >= 70) return 'bg-red-50 text-red-800'
  if (score >= 45) return 'bg-amber-50 text-amber-800'
  if (score > 0) return 'bg-sky-50 text-sky-800'
  return 'bg-slate-100 text-slate-600'
}
