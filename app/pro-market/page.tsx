import Link from 'next/link'
import type { Metadata } from 'next'
import { AlertTriangle, ArrowRight, BarChart3, Lock, Radar, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { SiteNavigation } from '@/components/site-navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildMarketImpactReport } from '@/lib/market-impact'
import { getUserProSubscription, isActiveProSubscription } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Market Impact Pro | VesselSurge',
  description: 'Subscription market-impact radar for maritime news, chokepoints, tanker routes, freight, oil and insurance risk.',
  alternates: {
    canonical: 'https://www.vesselsurge.com/pro-market',
  },
  robots: { index: true, follow: true },
}

export default async function ProMarketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const subscription = user ? await getUserProSubscription(user.id) : null
  const hasAccess = isActiveProSubscription(subscription)
  const report = hasAccess ? await loadReport() : buildLockedPreview()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavigation />
      <section className="border-b border-cyan-300/10 bg-[radial-gradient(circle_at_top_right,rgba(0,119,255,0.18),transparent_36%),linear-gradient(180deg,rgba(3,7,18,0.98),rgba(3,7,18,0.92))] px-4 pb-10 pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
                <Radar className="h-4 w-4" />
                Pro market impact radar
              </div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-300" />
                {hasAccess ? 'Live pro access' : user ? 'Locked preview' : 'Public preview'}
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                See how maritime news can move markets before the headline gets priced.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                VesselSurge reads chokepoint news, official maritime signals, tanker context, freight pressure and war-risk language, then converts it into an investable market-impact map.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">Oil route shock</span>
                <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-100">Freight repricing</span>
                <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100">Insurance pressure</span>
              </div>
            </div>

            <div className="rounded-lg border border-cyan-300/15 bg-slate-950/70 p-5 shadow-2xl shadow-cyan-950/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Current pressure score</p>
                  <p className="mt-2 text-5xl font-black text-white">{report.marketPressureScore}</p>
                </div>
                <div className="rounded-md border border-primary/30 bg-primary/15 px-3 py-2 text-sm font-bold text-primary">
                  {report.confidence.toUpperCase()}
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500" style={{ width: `${report.marketPressureScore}%` }} />
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300">{report.narrative}</p>
            </div>
          </div>
        </div>
      </section>

      {!hasAccess && <PaywallBanner isSignedIn={Boolean(user)} />}

      <section className={`px-4 py-8 ${hasAccess ? '' : 'relative'}`}>
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Asset impact table</h2>
                <p className="text-sm text-muted-foreground">Calculated from current VesselSurge news and signal feed.</p>
              </div>
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-3">
              {report.assetImpacts.map((asset) => (
                <div key={asset.asset} className="rounded-md border border-border bg-background/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{asset.asset}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{asset.bias}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black">{asset.score}</p>
                      <p className="text-xs text-muted-foreground">{asset.evidenceCount} signals</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {asset.drivers.length ? asset.drivers.map((driver) => (
                      <span key={driver} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{driver}</span>
                    )) : <span className="text-xs text-muted-foreground">Waiting for stronger confirmation.</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Chokepoint market heat</h2>
                <p className="text-sm text-muted-foreground">Where the market pressure is forming.</p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="grid gap-3">
              {report.regions.map((region) => (
                <div key={region.region} className="rounded-md border border-border bg-background/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold capitalize">{region.region}</p>
                    <span className="rounded-md border border-border px-2 py-1 text-xs font-bold uppercase">{region.severity}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${region.score}%` }} />
                  </div>
                  <div className="mt-3 space-y-2">
                    {region.headlines.length ? region.headlines.map((headline) => (
                      <p key={headline} className="text-sm text-muted-foreground">{headline}</p>
                    )) : <p className="text-sm text-muted-foreground">No strong market signal yet.</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Top source-backed market events</h2>
                <p className="text-sm text-muted-foreground">Ranked by severity, recency and market transmission.</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {report.topStories.map((story) => (
                <div key={`${story.kind}-${story.id}`} className="rounded-md border border-border bg-background/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold uppercase text-primary">{story.severity}</span>
                    <span className="text-xs text-muted-foreground">{story.score}/100</span>
                  </div>
                  <h3 className="font-bold leading-snug">{story.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{story.summary}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{story.source}</span>
                    {story.sourceUrl ? <Link href={story.sourceUrl} className="font-semibold text-primary" target="_blank">Source</Link> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-5 lg:col-span-2">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-300" />
              <p className="text-sm leading-6 text-amber-50">{report.disclaimer}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

async function loadReport() {
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

function buildLockedPreview() {
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
  ], [])
}

function PaywallBanner({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className="border-b border-primary/20 bg-primary/10 px-4 py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold">Unlock Market Impact Pro</h2>
            <p className="text-sm text-muted-foreground">
              199 kr every 14 days. {isSignedIn ? 'Stripe handles payment securely.' : 'Create an account first, then unlock the full report.'}
            </p>
          </div>
        </div>
        {isSignedIn ? (
          <form action="/api/stripe/checkout" method="post">
            <Button type="submit" className="min-h-11">
              Start Pro access
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link href="/auth/sign-up?next=/pro-market">
              <Button className="min-h-11">
                Create account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login?next=/pro-market">
              <Button type="button" variant="outline" className="min-h-11">
                Log in
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
