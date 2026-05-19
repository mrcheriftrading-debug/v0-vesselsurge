import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
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
import { buildMarketImpactReport } from '@/lib/market-impact'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache } from '@/lib/maritime-dashboard-cache'
import { getUserProSubscription, isActiveProSubscription } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'

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

export default async function ProMarketPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const subscription = user ? await getUserProSubscription(user.id) : null
  const hasAccess = isActiveProSubscription(subscription)
  const report = await loadReport({ allowDirectDatabaseFallback: hasAccess })

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

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <TrustItem icon={ShieldCheck} title="1. Real evidence" body="The report is built from current VesselSurge news, AIS context and maritime signals." />
                <TrustItem icon={BarChart3} title="2. Market channel" body="It maps route risk into oil, freight, tankers, logistics equities and insurance." />
                <TrustItem icon={FileText} title="3. Research only" body="Clear market context and watch triggers, never financial advice." />
              </div>
            </div>

            <ReportPreview report={report} hasAccess={hasAccess} />
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

      {!hasAccess && (
        <section className="border-b border-slate-200 bg-slate-950 px-4 py-5 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Subscription</p>
              <h2 className="mt-1 text-xl font-black">Create an account, then unlock the live analyst report for 199 kr every 14 days.</h2>
              <p className="mt-1 text-sm text-slate-300">Full source links, ranked events, asset pressure, chokepoint heat and watch triggers.</p>
            </div>
            {user ? (
              <form action="/api/stripe/checkout" method="post">
                <Button type="submit" className="min-h-11 bg-white text-slate-950 hover:bg-slate-100">
                  Start subscription
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Link href="/auth/sign-up?next=/pro-market">
                <Button className="min-h-11 bg-white text-slate-950 hover:bg-slate-100">
                  Create account first
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      )}

      <section className="border-b border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Read it in 30 seconds</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">How this page works</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricGuide
              label="Pressure score"
              value="0-100"
              body="A higher score means maritime disruption has a clearer route into markets."
            />
            <MetricGuide
              label="Asset impact"
              value="Who feels it"
              body="Shows the market channel most exposed: oil, tankers, freight, logistics or insurance."
            />
            <MetricGuide
              label="Chokepoint heat"
              value="Where risk sits"
              body="Ranks Hormuz, Bab el-Mandeb, Suez and Malacca by current evidence."
            />
            <MetricGuide
              label="Watch triggers"
              value="What changes next"
              body="Clear events that would raise or lower the report score."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f8fafc] px-4 py-9">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">What Pro unlocks</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">A market briefing you can read before the market reacts.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The free preview uses the same live VesselSurge data layer. Pro unlocks the evidence trail, ranked source links and full market-impact context.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <UnlockItem title="Live source trail" body="Open the ranked news or maritime signal behind each score." />
            <UnlockItem title="Asset pressure table" body="See which market channel is most exposed and why." />
            <UnlockItem title="Chokepoint comparison" body="Compare Hormuz, Bab el-Mandeb, Suez and Malacca in one scan." />
            <UnlockItem title="Watch triggers" body="Know what would raise, lower or confirm the market-pressure score." />
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

function TrustItem({ icon: Icon, title, body }: { icon: ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-sky-700" />
      <p className="mt-3 font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  )
}

function MetricGuide({ label, value, body }: { label: string; value: string; body: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  )
}

function UnlockItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        <ClipboardCheck className="h-4 w-4" />
      </div>
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
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
    return buildMarketImpactReport(
      cached.data.articles.map((article) => ({
        id: article.id,
        title: article.title,
        snippet: article.summary,
        source: article.source,
        url: article.sourceUrl,
        topic: article.category,
        region: article.region,
        published_at: article.timestamp,
      })),
      cached.data.signals.map((signal) => ({
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
