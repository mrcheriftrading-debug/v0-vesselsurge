import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Radar,
  ShieldCheck,
  Signal,
  Sparkles,
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
  description: 'Professional market-impact radar for maritime news, chokepoints, tanker routes, freight, oil and insurance risk.',
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
  const leadAsset = report.assetImpacts[0]

  return (
    <main className="min-h-screen bg-[#05080f] text-slate-100">
      <SiteNavigation />
      <ProductJsonLd />

      <section className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(7,13,24,0.98),rgba(5,8,15,0.96))] px-4 pb-8 pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <div>
                <div className="mb-5 flex flex-wrap gap-2">
                  <Badge icon={Radar}>Market Impact Pro</Badge>
                  <Badge icon={Sparkles}>{hasAccess ? 'Live pro access' : user ? 'Locked preview' : 'Public preview'}</Badge>
                </div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Maritime news turned into market pressure.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                  A professional analyst desk for chokepoints, tankers, oil routes, freight pressure and war-risk insurance. Built to show what changed, which market channel matters, and what to watch next.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Metric label="Price" value="199 kr" detail="every 14 days" />
                <Metric label="Access" value={hasAccess ? 'Open' : 'Locked'} detail={hasAccess ? 'live report' : 'preview only'} />
                <Metric label="Disclaimer" value="Research" detail="not financial advice" />
              </div>

              {!hasAccess && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {user ? (
                    <form action="/api/stripe/checkout" method="post">
                      <Button type="submit" className="min-h-11">
                        Unlock Pro report
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <Link href="/auth/sign-up?next=/pro-market">
                        <Button className="min-h-11">
                          Create account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/auth/login?next=/pro-market">
                        <Button variant="outline" className="min-h-11 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]">
                          Log in
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-cyan-300/15 bg-[#07111f] p-5 shadow-2xl shadow-cyan-950/30">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Analyst terminal</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Current market pressure</h2>
                </div>
                <div className={`rounded-md border px-3 py-2 text-sm font-black uppercase ${pressureClass(report.marketPressureScore)}`}>
                  {report.confidence}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.62fr_1fr]">
                <div className="rounded-md border border-white/10 bg-black/20 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Pressure score</p>
                  <p className="mt-3 text-6xl font-black text-white">{report.marketPressureScore}</p>
                  <div className="mt-4 h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500" style={{ width: `${report.marketPressureScore}%` }} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{report.narrative}</p>
                </div>

                <div className="grid gap-3">
                  <TerminalRow label="Lead asset" value={leadAsset?.asset || 'No signal'} tone={leadAsset?.bias || 'Waiting for confirmation'} />
                  <TerminalRow label="Strongest channel" value={leadAsset?.drivers?.[0] || 'No confirmed driver'} tone={leadAsset ? `${leadAsset.score}/100 pressure` : 'Preview'} />
                  <TerminalRow label="Next trigger" value={report.watchTriggers[0]} tone="Raises score if confirmed by trusted sources" />
                  <TerminalRow label="Access state" value={hasAccess ? 'Full analyst report unlocked' : 'Preview report, full data locked'} tone={hasAccess ? 'Active subscription' : 'Requires account and payment'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CheckoutStatus status={params?.checkout} />

      <section className="border-b border-white/10 bg-[#070b13] px-4 py-6">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2">
          <AnalystCard
            title="Pro Investor Agent"
            subtitle="Translates disruption into investor-grade market context."
            bullets={['Oil-route risk premium', 'Freight and tanker rate pressure', 'Insurance repricing and margin risk']}
          />
          <AnalystCard
            title="Pro Market Analyst Agent"
            subtitle="Scores every source event by severity, recency and transmission."
            bullets={['Source-backed evidence only', 'Chokepoint heat by region', 'Clear watch triggers and confidence']}
          />
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Asset pressure matrix" subtitle="How maritime events transmit into market channels." icon={BarChart3}>
            <div className="overflow-hidden rounded-md border border-white/10">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.5fr] bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                <span>Asset channel</span>
                <span>Bias</span>
                <span className="text-right">Score</span>
              </div>
              {report.assetImpacts.map((asset) => (
                <div key={asset.asset} className="grid grid-cols-[1.2fr_0.8fr_0.5fr] border-t border-white/10 px-4 py-4 text-sm">
                  <div>
                    <p className="font-bold text-white">{asset.asset}</p>
                    <p className="mt-1 text-xs text-slate-500">{asset.evidenceCount} evidence links</p>
                  </div>
                  <div>
                    <p className="text-slate-300">{asset.bias}</p>
                    <p className="mt-1 text-xs text-cyan-200">{asset.drivers[0] || 'No confirmed driver'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex min-w-14 justify-center rounded-md border px-2 py-1 font-black ${pressureClass(asset.score)}`}>{asset.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Chokepoint heat" subtitle="Fast scan by region." icon={Activity}>
            <div className="grid gap-3">
              {report.regions.map((region) => (
                <div key={region.region} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black capitalize text-white">{regionLabel(region.region)}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{region.severity}</p>
                    </div>
                    <span className={`rounded-md border px-2 py-1 text-sm font-black ${pressureClass(region.score)}`}>{region.score}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${region.score}%` }} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                    {region.headlines[0] || 'No strong source-backed market signal yet.'}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Top source-backed events" subtitle={hasAccess ? 'Live feed ranked by market transmission.' : 'Preview examples. Subscribe for the live ranked feed.'} icon={AlertTriangle} wide>
            <div className="grid gap-3 lg:grid-cols-3">
              {report.topStories.slice(0, 6).map((story) => (
                <article key={`${story.kind}-${story.id}`} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className={`rounded-md border px-2 py-1 text-xs font-black uppercase ${pressureClass(story.score)}`}>{story.severity}</span>
                    <span className="text-xs font-bold text-slate-500">{story.score}/100</span>
                  </div>
                  <h3 className="line-clamp-3 min-h-[4.5rem] font-bold leading-snug text-white">{story.title}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{story.summary}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="truncate">{story.source}</span>
                    {hasAccess && story.sourceUrl ? (
                      <Link href={story.sourceUrl} className="font-bold text-cyan-200" target="_blank">Source</Link>
                    ) : (
                      <span className="font-bold text-slate-500">Locked</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Methodology" subtitle="Clear enough for customers, strict enough for operators." icon={ShieldCheck} wide>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ['1', 'Collect', 'Trusted news, official alerts and VesselSurge maritime signals enter one evidence layer.'],
                ['2', 'Classify', 'The analyst agent detects route, asset class, severity, recency and source quality.'],
                ['3', 'Transmit', 'Signals map into oil, tankers, freight, insurance and fuel-sensitive equities.'],
                ['4', 'Explain', 'Customers see a pressure score, drivers, watch triggers and source trail.'],
              ].map(([step, title, body]) => (
                <div key={step} className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-cyan-400/10 text-sm font-black text-cyan-200">{step}</div>
                  <h3 className="font-black text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-50">
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
          description: 'Market-impact radar for maritime news, chokepoints, tanker routes, freight, oil and insurance risk.',
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

function Badge({ icon: Icon, children }: { icon: typeof Radar; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
      <Icon className="h-4 w-4 text-cyan-200" />
      {children}
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  )
}

function TerminalRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-cyan-100">{tone}</p>
    </div>
  )
}

function AnalystCard({ title, subtitle, bullets }: { title: string; subtitle: string; bullets: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyan-400/10 text-cyan-200">
          <Signal className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            {bullet}
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
  icon: typeof BarChart3
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-[#07111f] p-5 ${wide ? 'xl:col-span-2' : ''}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-cyan-200" />
      </div>
      {children}
    </section>
  )
}

function CheckoutStatus({ status }: { status?: string }) {
  if (status !== 'success' && status !== 'cancelled') return null

  const success = status === 'success'
  return (
    <section className={`border-b px-4 py-4 ${success ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-amber-400/20 bg-amber-500/10'}`}>
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        {success ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
        )}
        <div>
          <p className="font-bold text-white">{success ? 'Payment received or processing' : 'Checkout was not completed'}</p>
          <p className="mt-1 text-sm text-slate-400">
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

function pressureClass(score: number) {
  if (score >= 70) return 'border-red-400/40 bg-red-500/15 text-red-100'
  if (score >= 45) return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
  if (score > 0) return 'border-cyan-400/35 bg-cyan-500/15 text-cyan-100'
  return 'border-white/10 bg-white/[0.04] text-slate-300'
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
