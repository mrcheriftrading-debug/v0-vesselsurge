import type { Metadata } from 'next'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  Radio,
  ShieldCheck,
} from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { SiteNavigation } from '@/components/site-navigation'
import { BASE_URL } from '@/lib/seo'
import { loadSourceTrustReport, type SourceTrustReport } from '@/lib/source-trust'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Source Trust Dashboard, AI Source Review and Maritime Data Quality',
  description:
    'See how VesselSurge keeps AI maritime intelligence fresh, source-reviewed and safe before it reaches the live map or Market Pro analysis.',
  alternates: { canonical: `${BASE_URL}/source-trust` },
  keywords: [
    'source reviewed maritime news',
    'maritime data quality',
    'AI maritime intelligence',
    'shipping risk source trust',
    'fresh maritime intelligence',
  ],
  openGraph: {
    type: 'website',
    url: `${BASE_URL}/source-trust`,
    siteName: 'VesselSurge',
    title: 'Source Trust Dashboard | VesselSurge',
    description:
      'Freshness gates, source review, data quality and AI guardrails for VesselSurge live maritime intelligence.',
    images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: 'VesselSurge Source Trust Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Source Trust Dashboard | VesselSurge',
    description: 'Source review and freshness guardrails for VesselSurge maritime intelligence.',
    images: [`${BASE_URL}/og-image.jpg`],
  },
}

function formatTime(value?: string | null) {
  if (!value) return 'Unavailable'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Unavailable'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

function formatAge(hours: number | null) {
  if (hours === null) return 'No visible items'
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`
  if (hours < 24) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`
}

function statusTone(status: SourceTrustReport['status']) {
  if (status === 'autonomous') return 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
  if (status === 'watch') return 'border-amber-300/25 bg-amber-300/10 text-amber-200'
  return 'border-red-300/25 bg-red-300/10 text-red-200'
}

function guardrailTone(state: SourceTrustReport['guardrails'][number]['state']) {
  if (state === 'active') return 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
  if (state === 'watch') return 'border-amber-300/20 bg-amber-300/10 text-amber-200'
  return 'border-red-300/20 bg-red-300/10 text-red-200'
}

function sourceMixRows(report: SourceTrustReport) {
  return [
    { label: 'Official', value: report.sourceMix.official, tone: 'bg-emerald-300' },
    { label: 'Tier 1', value: report.sourceMix.tierOne, tone: 'bg-cyan-300' },
    { label: 'Trade', value: report.sourceMix.trade, tone: 'bg-sky-300' },
    { label: 'Search', value: report.sourceMix.search, tone: 'bg-violet-300' },
    { label: 'General', value: report.sourceMix.general, tone: 'bg-slate-300' },
    { label: 'Watch', value: report.sourceMix.watch, tone: 'bg-amber-300' },
  ]
}

async function getReport() {
  return loadSourceTrustReport(createAdminClient())
}

export default async function SourceTrustPage() {
  const report = await getReport()
  const sourceRows = sourceMixRows(report)
  const totalSources = Math.max(1, sourceRows.reduce((sum, row) => sum + row.value, 0))
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${BASE_URL}/source-trust#webpage`,
    url: `${BASE_URL}/source-trust`,
    name: 'VesselSurge Source Trust Dashboard',
    description:
      'Public data quality dashboard for VesselSurge source review, freshness gates and AI maritime intelligence guardrails.',
    dateModified: report.generatedAt,
    isPartOf: { '@id': `${BASE_URL}/#website` },
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />
                Source Trust
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Source-reviewed maritime intelligence, with weak data stopped before publication.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                VesselSurge checks freshness, source quality and review status before live map and Market Pro outputs are shown. AI explains and ranks signals only after source evidence, freshness and review gates pass.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/map-dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Open live map <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/api/source-trust" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.04]">
                  Source trust API <Database className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/55 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Operating mode</div>
                  <div className="mt-2 text-3xl font-black text-foreground">{report.statusLabel}</div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${statusTone(report.status)}`}>
                  {report.trustScore}/100
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{report.statusReason}</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: pct(report.trustScore) }} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/[0.08] bg-background/55 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Latest evidence</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{formatTime(report.liveMap.latestEvidenceAt)}</div>
                </div>
                <div className="rounded-lg border border-white/[0.08] bg-background/55 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Cache state</div>
                  <div className="mt-2 text-sm font-semibold text-foreground">{report.cache.stale ? 'Fallback cache' : 'Fresh cache'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <Radio className="h-5 w-5 text-cyan-300" />
              <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Live map items</div>
              <div className="mt-2 text-3xl font-black text-foreground">{report.liveMap.articleCount}</div>
              <p className="mt-2 text-sm text-muted-foreground">{report.liveMap.signalCount} signals across {report.liveMap.hotspotCount} hotspots.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <Clock3 className="h-5 w-5 text-emerald-300" />
              <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Oldest visible news</div>
              <div className="mt-2 text-3xl font-black text-foreground">{formatAge(report.liveMap.oldestVisibleArticleAgeHours)}</div>
              <p className="mt-2 text-sm text-muted-foreground">Hard gate: {report.liveMap.maxArticleAgeHours}h max.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <FileSearch className="h-5 w-5 text-sky-300" />
              <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Review gate</div>
              <div className="mt-2 text-3xl font-black text-foreground">{report.liveMap.reviewGate.approved}</div>
              <p className="mt-2 text-sm text-muted-foreground">{report.liveMap.reviewGate.watch} watch, {report.liveMap.reviewGate.blocked} blocked before promotion.</p>
            </div>
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <BrainCircuit className="h-5 w-5 text-violet-300" />
              <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Market Pro gate</div>
              <div className="mt-2 text-3xl font-black text-foreground">{report.marketPro.newsMaxAgeHours}h</div>
              <p className="mt-2 text-sm text-muted-foreground">Signals expire after {report.marketPro.signalMaxAgeHours}h before AI scoring.</p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-black text-foreground">Source mix</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{report.sourceQuality.uniqueSources} unique sources, {report.sourceQuality.trustedShare}% trusted share.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-4">
                {sourceRows.map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-foreground">{row.label}</span>
                      <span className="font-mono text-muted-foreground">{row.value}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className={`h-full rounded-full ${row.tone}`} style={{ width: pct((row.value / totalSources) * 100) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card/55 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-black text-foreground">AI guardrails</h2>
                  <p className="mt-1 text-sm text-muted-foreground">These rules let the system run without manual approval while still blocking weak claims.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {report.guardrails.map((rule) => (
                  <div key={rule.title} className="rounded-lg border border-white/[0.08] bg-background/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-foreground">{rule.title}</h3>
                      <span className={`rounded-full border px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] ${guardrailTone(rule.state)}`}>
                        {rule.state}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{rule.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-[#071020]/60 px-4 py-12 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                <h2 className="text-2xl font-black text-foreground">Coverage and operator follow-up</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {report.coverageGaps.map((gap) => (
                  <div key={gap.hotspot} className="rounded-lg border border-white/[0.08] bg-background/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-black capitalize text-foreground">{gap.hotspot}</div>
                      <div className="font-mono text-sm text-muted-foreground">{gap.score}/100</div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className="h-full rounded-full bg-cyan-300" style={{ width: pct(gap.score) }} />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {gap.sourceCount} sources. News {formatTime(gap.latestNewsAt)}. Signals {formatTime(gap.latestSignalAt)}.
                    </p>
                    {gap.missing.length > 0 && (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">Missing: {gap.missing.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <h2 className="text-xl font-black text-foreground">Autonomous checklist</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {(report.recommendations.length ? report.recommendations : ['No operator action needed right now. Continue normal autonomous update cycle.']).map((item) => (
                  <div key={item} className="rounded-lg border border-white/[0.08] bg-background/55 p-4 text-sm leading-6 text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Report generated {formatTime(report.generatedAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            <Link href="/latest" className="rounded-xl border border-border bg-card/55 p-5 transition-colors hover:border-primary/35">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Next</div>
              <h2 className="mt-3 text-lg font-black text-foreground">Read reviewed news</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Open the source-reviewed maritime feed that drives map context.</p>
            </Link>
            <Link href="/pro-market" className="rounded-xl border border-border bg-card/55 p-5 transition-colors hover:border-primary/35">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Market Pro</div>
              <h2 className="mt-3 text-lg font-black text-foreground">See market impact</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Review how fresh maritime signals are translated into market scenarios.</p>
            </Link>
            <Link href="/network" className="rounded-xl border border-border bg-card/55 p-5 transition-colors hover:border-primary/35">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">B2B</div>
              <h2 className="mt-3 text-lg font-black text-foreground">Join the network</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use trusted route context for cargo, vessel and partner matching.</p>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </div>
  )
}
