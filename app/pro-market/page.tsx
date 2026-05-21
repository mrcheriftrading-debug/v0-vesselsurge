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
type OutlookTone = 'positive' | 'caution' | 'wait' | 'neutral'
type InstrumentOutlook = {
  symbol: string
  label: string
  view: string
  reason: string
  score: number
  tone: OutlookTone
}

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
                    <Link href={proMarketLoginHref(selectedCategory)}>
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
            <h2 className="mt-1 text-2xl font-black text-slate-950">AI watchlist recommendation</h2>
          </div>
          <Radar className="h-5 w-5 text-sky-700" />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The AI checks VesselSurge news and says what looks most worth researching in the selected market. Research only, not personal financial advice.
        </p>
      </div>

      <div className="p-5">
        <div className="rounded-md border border-slate-200 bg-slate-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">AI says to research</p>
          <h3 className="mt-3 text-3xl font-black leading-tight">{outlook.recommendation}</h3>
          <p className="mt-4 text-base leading-7 text-slate-200">{outlook.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
            <span className="rounded-md bg-white/10 px-3 py-2">{categoryLabel(selectedCategory)}</span>
            <span className="rounded-md bg-white/10 px-3 py-2">{outlook.score}/100 impact</span>
            <span className="rounded-md bg-white/10 px-3 py-2">{outlook.confidence} confidence</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {outlook.instruments.slice(0, 4).map((instrument) => (
            <OutlookTile key={instrument.symbol} instrument={instrument} />
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1fr_0.7fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            <span>Instrument</span>
            <span className="text-right">AI view</span>
            <span className="text-right">Score</span>
          </div>
          {outlook.instruments.map((instrument) => (
            <div key={instrument.symbol} className="grid grid-cols-[1fr_0.7fr_0.7fr] border-t border-slate-200 px-4 py-3 text-sm">
              <div>
                <p className="font-black text-slate-950">{instrument.label}</p>
                <p className="text-xs font-semibold text-slate-500">{instrument.reason}</p>
              </div>
              <p className={`self-center text-right font-black ${outlookToneClass(instrument.tone)}`}>{instrument.view}</p>
              <p className="self-center text-right font-black text-slate-950">{instrument.score}/100</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
          AI watchlist is source-backed research context. It is not personal financial advice or an instruction to buy.
        </p>
      </div>
    </section>
  )
}

function OutlookTile({ instrument }: { instrument: InstrumentOutlook }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{instrument.symbol}</p>
      <h3 className="mt-1 font-black text-slate-950">{instrument.label}</h3>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`font-black ${outlookToneClass(instrument.tone)}`}>{instrument.view}</p>
        <p className="text-sm font-black text-slate-700">{instrument.score}/100</p>
      </div>
    </div>
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
            <h2 className="mt-1 text-2xl font-black text-slate-950">AI watchlist locked</h2>
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-slate-600">
              Paid accounts see what the AI thinks is most worth researching in {categoryLabel(selectedCategory).toLowerCase()}, based on live VesselSurge news.
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

function proMarketLoginHref(category: AssetCategory) {
  return `/auth/login?next=${encodeURIComponent(`/pro-market?asset=${category}`)}`
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
  const instruments = buildInstrumentOutlooks(report, category, score)

  let direction = 'No clear signal yet'
  let summary = 'Prices and shipping news do not point in one clear direction yet. The safer read is to wait for stronger confirmation.'
  const recommendation = instruments[0]
    ? `${instruments[0].label}: ${instruments[0].view}`
    : 'No clear investment watchlist yet'

  if (category === 'stocks') {
    if (score >= 65 && quoteMove < 0) {
      direction = 'Stocks look under pressure'
      summary = 'Stock prices are already weak while shipping-risk pressure is elevated. That means bad route or oil news could matter more than usual.'
    } else if (score >= 65) {
      direction = 'Stocks can rise, but risk headlines may cap the move'
      summary = 'Stocks are not breaking down, but shipping news is strong enough that oil, freight or insurance headlines could slow the upside.'
    } else if (quoteMove > 0.4) {
      direction = 'Stocks look positive, but watch the headlines'
      summary = 'The stock tape is positive. The main risk is whether fresh shipping disruption news hurts confidence.'
    }
  } else if (category === 'crypto') {
    if (score >= 62) {
      direction = 'Crypto risk appetite looks fragile'
      summary = 'Crypto often reacts when investors reduce risk. If shipping news lifts oil, the dollar or rates pressure, crypto can weaken quickly.'
    } else if (quoteMove > 1) {
      direction = 'Crypto is holding up for now'
      summary = 'Crypto momentum is positive. The AI is watching whether dollar, rates or escalation news starts to overpower that strength.'
    } else {
      direction = 'Crypto is in watch mode'
      summary = 'There is no clean shipping-to-crypto signal yet. The important thing to watch is broader risk appetite.'
    }
  } else {
    const dollar = report.marketSnapshot?.quotes.find((quote) => quote.symbol === 'DX-Y.NYB')
    if ((dollar?.changePercent || 0) > 0.25 || score >= 62) {
      direction = 'Dollar pressure is the main FX risk'
      summary = 'If energy or route risk rises, the first currency move to watch is often USD strength and SEK sensitivity.'
    } else if (quoteMove < -0.25) {
      direction = 'Dollar pressure is easing'
      summary = 'The currency tape looks less defensive. The AI needs fresh escalation news before raising the FX risk view.'
    } else {
      direction = 'Currencies are balanced'
      summary = 'Currencies are mixed. The next clear signal would likely come from oil, rates or the dollar.'
    }
  }

  return {
    direction,
    recommendation,
    score,
    confidence: report.confidence,
    summary,
    instruments,
  }
}

function buildInstrumentOutlooks(report: Report, category: AssetCategory, categoryScore: number): InstrumentOutlook[] {
  const quotes = categoryMarketQuotes(report.marketSnapshot, category)
  const sourceSignal = report.topStories[0]?.title || report.analysisBrief.signal

  if (!quotes.length) {
    return fallbackInstrumentOutlooks(category, categoryScore, sourceSignal)
  }

  return quotes
    .map((quote) => {
      const momentum = quote.changePercent
      const score = Math.max(0, Math.min(100, Math.round(categoryScore + Math.abs(momentum) * 4 + instrumentScoreAdjustment(quote, category, report))))
      const { view, tone, reason } = instrumentViewForQuote(quote, category, report, momentum)

      return {
        symbol: quote.symbol,
        label: quote.label,
        view,
        reason: reason || sourceSignal,
        score,
        tone,
      }
    })
    .sort((a, b) => b.score - a.score)
}

function instrumentScoreAdjustment(quote: MarketQuoteReport, category: AssetCategory, report: Report) {
  if (category === 'stocks' && quote.group === 'Transport') return report.marketPressureScore >= 60 ? 8 : 3
  if (category === 'crypto' && report.marketPressureScore >= 62) return -4
  if (category === 'fx' && /USD|DX-Y/.test(quote.symbol)) return report.marketPressureScore >= 60 ? 7 : 2
  return 0
}

function instrumentViewForQuote(quote: MarketQuoteReport, category: AssetCategory, report: Report, momentum: number): {
  view: string
  tone: OutlookTone
  reason: string
} {
  const pressure = report.marketPressureScore

  if (category === 'stocks') {
    if (quote.group === 'Transport' && pressure >= 60) {
      return { view: 'Research first', tone: 'positive', reason: 'Shipping disruption can lift freight and tanker exposure.' }
    }
    if (quote.group === 'Transport') {
      return { view: 'Watch closely', tone: 'neutral', reason: 'Transport names react directly to route and freight changes.' }
    }
    if (pressure >= 65) {
      return { view: 'Be careful', tone: 'caution', reason: 'High shipping risk can cap broad equity upside.' }
    }
    if (momentum > 0.3) {
      return { view: 'Bullish watch', tone: 'positive', reason: 'Live price action is positive and risk pressure is controlled.' }
    }
  }

  if (category === 'crypto') {
    if (pressure >= 62) {
      return { view: 'Wait', tone: 'wait', reason: 'Shipping stress can reduce risk appetite and hurt crypto.' }
    }
    if (momentum > 0.8) {
      return { view: 'Research first', tone: 'positive', reason: 'Crypto momentum is positive while shipping pressure is manageable.' }
    }
    return { view: 'Watch only', tone: 'neutral', reason: 'No strong news-to-crypto signal is confirmed yet.' }
  }

  if (/USDSEK|DX-Y|USDJPY/.test(quote.symbol) && pressure >= 60) {
    return { view: 'Research first', tone: 'positive', reason: 'Shipping stress often supports USD demand.' }
  }
  if (/EURUSD|GBPUSD/.test(quote.symbol) && pressure >= 60) {
    return { view: 'Be careful', tone: 'caution', reason: 'Dollar strength can pressure non-USD pairs.' }
  }
  if (momentum > 0.2) {
    return { view: 'Bullish watch', tone: 'positive', reason: 'Currency momentum is positive on the live tape.' }
  }

  return { view: 'Watch only', tone: 'neutral', reason: 'The AI needs a clearer news and price signal.' }
}

function fallbackInstrumentOutlooks(category: AssetCategory, score: number, reason: string): InstrumentOutlook[] {
  if (category === 'crypto') {
    return [
      { symbol: 'BTC', label: 'Bitcoin', view: 'Watch only', reason, score, tone: 'neutral' },
      { symbol: 'ETH', label: 'Ethereum', view: 'Watch only', reason, score: Math.max(0, score - 4), tone: 'neutral' },
    ]
  }

  if (category === 'fx') {
    return [
      { symbol: 'USD/SEK', label: 'USD/SEK', view: 'Watch only', reason, score, tone: 'neutral' },
      { symbol: 'EUR/USD', label: 'EUR/USD', view: 'Watch only', reason, score: Math.max(0, score - 4), tone: 'neutral' },
    ]
  }

  return [
    { symbol: 'FRO', label: 'Frontline', view: 'Watch only', reason, score, tone: 'neutral' },
    { symbol: 'IYT', label: 'US transports ETF', view: 'Watch only', reason, score: Math.max(0, score - 4), tone: 'neutral' },
  ]
}

function outlookToneClass(tone: OutlookTone) {
  if (tone === 'positive') return 'text-emerald-700'
  if (tone === 'caution') return 'text-amber-700'
  if (tone === 'wait') return 'text-red-700'
  return 'text-slate-700'
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
