import Link from 'next/link'
import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
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
import { getUserProSubscription, isActiveProSubscription } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Market Impact Pro | VesselSurge',
  description: 'Professional market-impact analysis for maritime news, chokepoints, tanker routes, freight, oil and insurance risk.',
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
  const report = hasAccess ? await loadReport() : buildLockedPreview()

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
                Maritime risk analysis for investors who need the market impact, not another news feed.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                VesselSurge converts chokepoint news, tanker context, freight pressure, oil-route exposure and war-risk insurance language into a clear market-impact report.
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
                <TrustItem icon={ShieldCheck} title="Source-backed" body="Every signal is tied to VesselSurge news or maritime signals." />
                <TrustItem icon={BarChart3} title="Market mapped" body="Oil, freight, tankers, insurance and logistics channels." />
                <TrustItem icon={FileText} title="Research only" body="Clear disclaimer. No buy or sell recommendations." />
              </div>
            </div>

            <ReportPreview report={report} hasAccess={hasAccess} />
          </div>
        </div>
      </section>

      <CheckoutStatus status={params?.checkout} />

      {!hasAccess && (
        <section className="border-b border-slate-200 bg-slate-950 px-4 py-5 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">Subscription</p>
              <h2 className="mt-1 text-xl font-black">Unlock the live analyst report for 199 kr every 14 days.</h2>
              <p className="mt-1 text-sm text-slate-300">Full source links, live ranking, asset pressure, chokepoint heat and watch triggers.</p>
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

      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <AgentPanel
            title="Pro Investor Agent"
            subtitle="Explains how maritime disruption can transmit into market pressure."
            points={['Energy-route risk premium', 'Freight and tanker-rate pressure', 'Insurance repricing and margin risk']}
          />
          <AgentPanel
            title="Pro Market Analyst Agent"
            subtitle="Scores news and signals like an analyst desk, not a generic chatbot."
            points={['Severity, recency and corroboration', 'Chokepoint exposure by region', 'Watch triggers that raise or lower conviction']}
          />
        </div>
      </section>

      <section className="px-4 pb-12">
        <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Panel title="Asset impact table" subtitle="The customer sees which market channels are under pressure." icon={TrendingUp}>
            <AssetTable report={report} />
          </Panel>

          <Panel title="Chokepoint heat" subtitle="A clean scan of where the risk is concentrated." icon={Gauge}>
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

          <Panel title="Source-backed events" subtitle={hasAccess ? 'Live events ranked by market transmission.' : 'Preview examples. Live source trail unlocks with Pro.'} icon={AlertTriangle} wide>
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

          <Panel title="Methodology" subtitle="Simple enough for customers, strict enough for a serious analysis product." icon={ShieldCheck} wide>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['1', 'Collect', 'Trusted news, official warnings and VesselSurge maritime signals enter one evidence layer.'],
                ['2', 'Classify', 'The analyst checks route, asset class, severity, recency and source quality.'],
                ['3', 'Transmit', 'Signals map into oil, tankers, freight, insurance and fuel-sensitive equities.'],
                ['4', 'Explain', 'The report shows pressure score, drivers, watch triggers and source trail.'],
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
          description: 'Professional market-impact analysis for maritime news, chokepoints, tanker routes, freight, oil and insurance risk.',
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

async function loadReport(): Promise<Report> {
  const admin = createAdminClient()
  const [{ data: news }, { data: signals }] = await Promise.all([
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
  ])

  return buildMarketImpactReport(news || [], signals || [])
}

function buildLockedPreview(): Report {
  return buildMarketImpactReport([
    {
      title: 'Preview: Hormuz escalation can reprice oil, tankers and war-risk insurance',
      snippet: 'Full Pro access unlocks source-backed calculations from current VesselSurge news and operational signals.',
      source: 'VesselSurge Pro',
      region: 'hormuz',
      published_at: new Date().toISOString(),
    },
    {
      title: 'Preview: Red Sea disruption can spill into Suez freight and rerouting costs',
      snippet: 'The Pro model links maritime incident language to freight, insurance, energy and logistics pressure.',
      source: 'VesselSurge Pro',
      region: 'bab',
      published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Preview: Canal delay and convoy pressure can move Asia-Europe logistics',
      snippet: 'Subscribers see ranked source events, asset impact tables and chokepoint heat by region.',
      source: 'VesselSurge Pro',
      region: 'suez',
      published_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: 'Preview: Malacca density can create hidden port-flow and delay pressure',
      snippet: 'The analyst desk watches Southeast Asia traffic, ReCAAP context and port approach pressure.',
      source: 'VesselSurge Pro',
      region: 'malacca',
      published_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    },
  ], [])
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
