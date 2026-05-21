import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Gauge,
  LockKeyhole,
  Radar,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { SiteNavigation } from '@/components/site-navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFallbackUser } from '@/lib/fallback-auth'
import { buildMarketImpactReport } from '@/lib/market-impact'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache, type MaritimeDashboardResponse } from '@/lib/maritime-dashboard-cache'
import { getUserProSubscription, isActiveProSubscription } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.vesselsurge.com'

export const metadata: Metadata = {
  title: 'Stock Market Impact From Shipping Risk | VesselSurge Market Pro',
  description: 'Source-backed maritime market impact analysis for oil, freight, tanker stocks, logistics equities, war-risk insurance, Hormuz, Red Sea, Suez and Malacca.',
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

const customerProfiles = [
  {
    title: 'Traders and investors',
    body: 'See which maritime event could matter to oil, freight, tanker stocks, insurance or logistics equities.',
  },
  {
    title: 'Shipping operators',
    body: 'Understand whether a chokepoint signal is isolated noise or part of a wider cost and delay pattern.',
  },
  {
    title: 'Analysts and founders',
    body: 'Turn messy route news into a source-backed briefing that is faster to scan than raw headlines.',
  },
]

const reportIncludes = [
  'Market pressure score',
  'Lead asset channel',
  'Ranked source events',
  'Chokepoint heat map',
  'Watch triggers',
  'Research-only disclaimer',
]

export default async function ProMarketPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string }>
}) {
  const paramsPromise: Promise<{ checkout?: string }> = searchParams ?? Promise.resolve({})
  const [params, authState, previewReport] = await Promise.all([
    paramsPromise,
    loadAuthState(),
    loadCachedPreviewReport(),
  ])
  const { user, hasAccess } = authState
  const report = hasAccess && isEmptyReport(previewReport)
    ? await loadReport({ allowDirectDatabaseFallback: true })
    : previewReport

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
                Source-backed shipping risk analysis for oil, freight and public markets.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Market Impact Pro turns real VesselSurge news and live-map signals into one plain-English investor report: what happened, which market channels may feel pressure, and what to watch next. No invented breaking news. No buy or sell calls.
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
                    <Link href="/auth/sign-up?next=/pro-market">
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

            <div className="space-y-4">
              <PricingCard hasAccess={hasAccess} isLoggedIn={Boolean(user)} />
              <ReportPreview report={report} hasAccess={hasAccess} />
            </div>
          </div>
        </div>
      </section>

      <CheckoutStatus status={params?.checkout} />

      {!hasAccess && user?.user_metadata?.service_type === 'trader' && (
        <section className="border-b border-sky-200 bg-sky-50 px-4 py-4">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-sky-950">Trader account detected</p>
              <p className="mt-1 text-sm text-sky-900">Your account is ready. Start the subscription to unlock live market-impact analysis and source links.</p>
            </div>
            <form action="/api/stripe/checkout" method="post">
              <Button type="submit" className="min-h-10 bg-sky-900 text-white hover:bg-sky-800">
                Unlock trader report
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      )}

      <section className="border-b border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">What the customer buys</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">A fast market-impact layer on top of maritime intelligence.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-3">
              {customerProfiles.map((profile) => (
                <div key={profile.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-black text-slate-950">{profile.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{profile.body}</p>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Included in Pro</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {reportIncludes.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300">
                Built for fast research context. It explains possible transmission channels; it does not provide financial advice or buy/sell recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <AgentPanel
            title="Pro Investor Agent"
            subtitle="Answers the investor question: why should this shipping event matter to markets?"
            points={['Finds the affected asset channel', 'Explains the cost or supply transmission path', 'Separates watch signals from stronger evidence']}
          />
          <AgentPanel
            title="Pro Market Analyst Agent"
            subtitle="Turns messy maritime information into a ranked, readable report."
            points={['Scores severity, recency and source quality', 'Compares chokepoints side by side', 'Shows the exact triggers to monitor next']}
          />
        </div>
      </section>

      <section className="px-4 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Investor questions</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">The page is built to answer these fast</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <QuestionCard text="Is this maritime event relevant to oil, freight, tanker stocks, insurers, logistics equities or fuel-sensitive companies?" />
            <QuestionCard text="Which chokepoint is driving the risk, and is the pressure spreading?" />
            <QuestionCard text="What exact new information would change the market-impact score?" />
          </div>
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Panel title="Asset impact table" subtitle="Start here to see which part of the market the maritime signal could touch first." icon={TrendingUp}>
            <AssetTable report={report} />
          </Panel>

          <Panel title="Chokepoint heat" subtitle="Use this to understand whether the risk is concentrated in one route or spreading across the map." icon={Gauge}>
            <div className="grid gap-3">
              {report.regions.map((region) => (
                <div key={region.region} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">{regionLabel(region.region)}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{region.severity}</p>
                    </div>
                    <span className={`rounded-md px-2 py-1 text-sm font-black ${scorePillClass(region.score)}`}>{region.score}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-sky-700" style={{ width: `${region.score}%` }} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {region.headlines[0] || 'No strong market signal yet.'}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Ranked source events" subtitle={hasAccess ? 'Live VesselSurge events ranked by likely market transmission.' : 'Live VesselSurge events are visible here. Source links and full trail unlock with Pro.'} icon={AlertTriangle} wide>
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              {report.topStories.slice(0, 6).map((story, index) => (
                <div key={`${story.kind}-${story.id}`} className="grid gap-4 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[3rem_1fr_7rem] md:items-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-sm font-black text-slate-600">{index + 1}</div>
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs font-black uppercase ${scorePillClass(story.score)}`}>{story.severity}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{story.source}</span>
                      <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-bold text-sky-800">{story.sourceQualityLabel}</span>
                    </div>
                    <h3 className="font-black leading-snug text-slate-950">{story.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{story.summary}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-2xl font-black text-slate-950">{story.score}</p>
                    {hasAccess && story.sourceUrl ? (
                      <Link href={story.sourceUrl} className="text-sm font-bold text-sky-700 hover:underline" target="_blank">Open source</Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-500">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Methodology" subtitle="The model stays readable: gather evidence, classify the market channel, then explain the trigger." icon={ShieldCheck} wide>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['1', 'Collect', 'Trusted maritime news, official warnings and VesselSurge live-map signals enter one evidence layer.'],
                ['2', 'Filter', 'Old, vague or unrelated finance noise is reduced so the report stays focused.'],
                ['3', 'Map', 'The signal is mapped to oil, tankers, freight, insurance or logistics exposure.'],
                ['4', 'Explain', 'The customer sees the score, the reason, the source trail and the next watch trigger.'],
              ].map(([step, title, body]) => (
                <div key={step} className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-sky-50 text-sm font-black text-sky-800">{step}</div>
                  <h3 className="font-black text-slate-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              {report.disclaimer}
            </div>
          </Panel>
        </div>
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
          description: 'Source-backed maritime market impact analysis for oil, freight, tanker stocks, logistics equities, insurance risk and global shipping chokepoints.',
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

function PricingCard({ hasAccess, isLoggedIn }: { hasAccess: boolean; isLoggedIn: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Market Pro</p>
          <h2 className="mt-2 text-2xl font-black">199 kr / 14 days</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Unlock the full analyst report, source trail, asset pressure table and watch triggers.
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
            <Button type="submit" className="min-h-11 w-full bg-white text-slate-950 hover:bg-slate-100">
              Start subscription
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <Link href="/auth/sign-up?next=/pro-market">
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
          Source-backed research context
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          No financial advice or trade calls
        </div>
      </div>
    </div>
  )
}

function ReportPreview({ report, hasAccess }: { report: Report; hasAccess: boolean }) {
  const leadAsset = report.assetImpacts[0]

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Report preview</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Market impact report</h2>
          </div>
          <span className={`rounded-md px-2.5 py-1.5 text-xs font-black uppercase ${hasAccess ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            {hasAccess ? 'Live' : 'Preview'}
          </span>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[0.45fr_0.55fr]">
        <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Pressure score</p>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-7xl font-black tracking-tight text-slate-950">{report.marketPressureScore}</p>
            <p className="pb-3 text-sm font-bold uppercase text-slate-500">{report.confidence}</p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-sky-700" style={{ width: `${report.marketPressureScore}%` }} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{report.narrative}</p>
        </div>

        <div className="divide-y divide-slate-200">
          <ReportRow label="Lead asset channel" value={leadAsset?.asset || 'No signal'} detail={leadAsset?.bias || 'Waiting for confirmation'} />
          <ReportRow label="Strongest driver" value={leadAsset?.drivers?.[0] || 'No confirmed driver'} detail={leadAsset ? `${leadAsset.score}/100 pressure` : 'Preview'} />
          <ReportRow label="Evidence quality" value={report.topStories[0]?.sourceQualityLabel || 'No ranked source'} detail={report.topStories[0] ? `${report.topStories[0].sourceQualityScore}/100 source score` : 'Waiting for live evidence'} />
          <ReportRow label="Next watch trigger" value={report.watchTriggers[0]} detail="Raises score if confirmed by trusted sources" />
          <ReportRow label="Customer access" value={hasAccess ? 'Full report unlocked' : 'Preview only'} detail={hasAccess ? 'Live source trail visible' : 'Subscription required'} />
        </div>
      </div>
    </div>
  )
}

function ReportRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  )
}

function QuestionCard({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold leading-6 text-slate-800">{text}</p>
    </div>
  )
}

function AgentPanel({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-800">
          <Radar className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {points.map((point) => (
          <div key={point} className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {point}
          </div>
        ))}
      </div>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  wide = false,
  children,
}: {
  title: string
  subtitle: string
  icon: ComponentType<{ className?: string }>
  wide?: boolean
  children: ReactNode
}) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${wide ? 'xl:col-span-2' : ''}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-sky-700" />
      </div>
      {children}
    </section>
  )
}

function AssetTable({ report }: { report: Report }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="grid grid-cols-[1.15fr_0.85fr_5rem] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        <span>Asset channel</span>
        <span>Market bias</span>
        <span className="text-right">Score</span>
      </div>
      {report.assetImpacts.map((asset) => (
        <div key={asset.asset} className="grid grid-cols-[1.15fr_0.85fr_5rem] border-t border-slate-200 px-4 py-4 text-sm">
          <div>
            <p className="font-black text-slate-950">{asset.asset}</p>
            <p className="mt-1 text-xs text-slate-500">{asset.evidenceCount} evidence links</p>
          </div>
          <div>
            <p className="text-slate-700">{asset.bias}</p>
            <p className="mt-1 text-xs font-semibold text-sky-800">{asset.drivers[0] || 'No confirmed driver'}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 font-black ${scorePillClass(asset.score)}`}>{asset.score}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

async function loadAuthState() {
  const supabase = await createClient()
  const { data: { user: supabaseUser } } = await withTimeout(
    supabase.auth.getUser(),
    2500,
    'market auth',
  ).catch(() => ({ data: { user: null } }))
  const user = supabaseUser || await getFallbackUser()
  const subscription = user ? await getUserProSubscription(user.id) : null

  return {
    user,
    hasAccess: isActiveProSubscription(subscription),
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
  const cached = await withTimeout(getFreshMaritimeDashboardCache(admin), 1500, 'market cache')
    .catch(() => withTimeout(getLastMaritimeDashboardCache(admin, 'fresh market cache unavailable; serving last known source-backed market context'), 1500, 'stale market cache').catch(() => null))
  if (cached?.data) {
    return buildReportFromDashboardData(cached.data)
  }

  const publicLiveReport = await loadPublicLiveMarketReport()
  if (!isEmptyReport(publicLiveReport)) {
    return publicLiveReport
  }

  if (!allowDirectDatabaseFallback) {
    return buildMarketImpactReport([], [])
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
    console.error('[pro-market] market report data timeout:', error)
  }

  if (newsError || signalsError) {
    console.error('[pro-market] failed to load live report data:', newsError || signalsError)
  }

  return buildMarketImpactReport(news || [], signals || [])
}

async function loadPublicLiveMarketReport() {
  try {
    const response = await fetch(`${BASE_URL}/api/maritime-data`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6500),
    })

    if (!response.ok) return buildMarketImpactReport([], [])
    const dashboard = (await response.json()) as MaritimeDashboardResponse
    if (!dashboard?.data) return buildMarketImpactReport([], [])
    return buildReportFromDashboardData(dashboard.data)
  } catch (error) {
    console.error('[pro-market] public live report fallback failed:', error)
    return buildMarketImpactReport([], [])
  }
}

function buildReportFromDashboardData(data: MaritimeDashboardResponse['data']) {
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
  )
}

const loadCachedPreviewReport = unstable_cache(
  async () => loadReport({ allowDirectDatabaseFallback: false }),
  ['vesselsurge-market-pro-preview-report-v2-live-maritime'],
  { revalidate: 60 },
)

function isEmptyReport(report: Report) {
  return report.topStories.length === 0 && report.assetImpacts.every((asset) => asset.score === 0)
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

function regionLabel(region: string) {
  const labels: Record<string, string> = {
    hormuz: 'Strait of Hormuz',
    bab: 'Bab el-Mandeb',
    suez: 'Suez Canal',
    malacca: 'Malacca Strait',
  }

  return labels[region] || region
}
