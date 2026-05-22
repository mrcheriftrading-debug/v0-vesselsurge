import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildMaritimeDashboardPayload,
  getFreshMaritimeDashboardCache,
  getLastMaritimeDashboardCache,
  LIVE_MAP_NEWS_MAX_AGE_HOURS,
  type MaritimeDashboardResponse,
} from '@/lib/maritime-dashboard-cache'
import { buildOfflineMaritimeDashboardSnapshot } from '@/lib/maritime-offline-snapshot'
import { MARKET_PRO_NEWS_MAX_AGE_HOURS, MARKET_PRO_SIGNAL_MAX_AGE_HOURS } from '@/lib/market-impact'
import { maritimeSourceQualityTier } from '@/lib/maritime-source-quality'

type ReviewGate = {
  approved: number
  watch: number
  blocked: number
  visible: number
}

type SourceMix = {
  official: number
  tierOne: number
  trade: number
  search: number
  general: number
  watch: number
}

type SourceTrustStatus = 'autonomous' | 'watch' | 'degraded'

export type SourceTrustReport = {
  generatedAt: string
  status: SourceTrustStatus
  trustScore: number
  statusLabel: string
  statusReason: string
  liveMap: {
    articleCount: number
    signalCount: number
    hotspotCount: number
    maxArticleAgeHours: number
    oldestVisibleArticleAgeHours: number | null
    latestEvidenceAt: string | null
    blockedVisible: number
    reviewGate: ReviewGate
  }
  marketPro: {
    newsMaxAgeHours: number
    signalMaxAgeHours: number
    rule: string
  }
  sourceMix: SourceMix
  sourceQuality: {
    trustedCount: number
    trustedShare: number
    watchCount: number
    uniqueSources: number
  }
  coverageGaps: Array<{
    hotspot: string
    score: number
    status: 'strong' | 'good' | 'watch'
    missing: string[]
    sourceCount: number
    latestNewsAt: string | null
    latestSignalAt: string | null
  }>
  guardrails: Array<{
    title: string
    state: 'active' | 'watch' | 'blocked'
    detail: string
  }>
  recommendations: string[]
  cache: {
    cached: boolean
    stale: boolean
    generatedAt: string | null
    source: string
    version: string
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  })
}

function ageHours(value?: string | null) {
  if (!value) return null
  const time = Date.parse(value)
  if (!Number.isFinite(time)) return null
  return Math.max(0, (Date.now() - time) / 36e5)
}

function latestIso(values: Array<string | null | undefined>) {
  const latest = values.reduce((max, value) => {
    if (!value) return max
    const time = Date.parse(value)
    if (!Number.isFinite(time)) return max
    return Math.max(max, time)
  }, 0)

  return latest > 0 ? new Date(latest).toISOString() : null
}

function deriveSourceMix(
  articles: MaritimeDashboardResponse['data']['articles'],
  signals: MaritimeDashboardResponse['data']['signals'] = [],
): SourceMix {
  return [...new Set([
    ...articles.map((article) => article.source),
    ...signals.map((signal) => signal.source),
  ].filter(Boolean))].reduce<SourceMix>(
    (mix, article) => {
      const tier = maritimeSourceQualityTier(article)
      if (tier === 'official') mix.official += 1
      else if (tier === 'tierOne') mix.tierOne += 1
      else if (tier === 'trade') mix.trade += 1
      else if (tier === 'search') mix.search += 1
      else if (tier === 'watch') mix.watch += 1
      else mix.general += 1
      return mix
    },
    { official: 0, tierOne: 0, trade: 0, search: 0, general: 0, watch: 0 },
  )
}

function deriveReviewGate(articles: MaritimeDashboardResponse['data']['articles']): ReviewGate {
  return articles.reduce<ReviewGate>(
    (gate, article) => {
      const status = article.reviewStatus || 'watch'
      if (status === 'approved') gate.approved += 1
      else if (status === 'blocked') gate.blocked += 1
      else gate.watch += 1
      if (status !== 'blocked') gate.visible += 1
      return gate
    },
    { approved: 0, watch: 0, blocked: 0, visible: 0 },
  )
}

function buildStatus(params: {
  score: number
  blockedVisible: number
  staleVisible: boolean
  trustedShare: number
  hasPayload: boolean
}): { status: SourceTrustStatus; label: string; reason: string } {
  if (!params.hasPayload) {
    return {
      status: 'degraded',
      label: 'No live cache',
      reason: 'The source trust monitor cannot find a recent or fallback maritime cache.',
    }
  }

  if (params.blockedVisible > 0 || params.staleVisible || params.score < 78) {
    return {
      status: 'degraded',
      label: 'Degraded',
      reason: 'The guardrail found stale or blocked data that should not be treated as live.',
    }
  }

  if (params.score < 92 || params.trustedShare < 45) {
    return {
      status: 'watch',
      label: 'Autonomous watch',
      reason: 'The site can run, but source mix or review balance should be watched by the operator loop.',
    }
  }

  return {
    status: 'autonomous',
    label: 'Autonomous',
    reason: 'Freshness, review gate and source mix are inside the operating limits.',
  }
}

export function buildSourceTrustReport(payload: MaritimeDashboardResponse | null): SourceTrustReport {
  const articles = payload?.data.articles || []
  const signals = payload?.data.signals || []
  const hotspots = payload?.data.hotspots || []
  const qualityAudit = payload?.data.qualityAudit
  const reviewGate = qualityAudit?.reviewGate || deriveReviewGate(articles)
  const sourceMix = qualityAudit?.sourceMix || deriveSourceMix(articles, signals)
  const blockedVisible = articles.filter((article) => article.reviewStatus === 'blocked').length
  const visibleArticles = articles.filter((article) => article.reviewStatus !== 'blocked')
  const oldestVisibleArticleAgeHours = visibleArticles.reduce<number | null>((oldest, article) => {
    const current = ageHours(article.timestamp)
    if (current === null) return oldest
    return oldest === null ? current : Math.max(oldest, current)
  }, null)
  const latestEvidenceAt = latestIso([
    ...articles.map((article) => article.timestamp),
    ...signals.map((signal) => signal.observedAt),
    ...hotspots.map((hotspot) => hotspot.updatedAt),
  ])
  const staleVisible = oldestVisibleArticleAgeHours !== null && oldestVisibleArticleAgeHours > LIVE_MAP_NEWS_MAX_AGE_HOURS
  const trustedCount = sourceMix.official + sourceMix.tierOne + sourceMix.trade
  const visibleCount = Math.max(1, reviewGate.visible || visibleArticles.length)
  const trustedShare = Math.round((trustedCount / visibleCount) * 100)
  const uniqueSources = new Set([
    ...articles.map((article) => article.source),
    ...signals.map((signal) => signal.source),
  ].filter(Boolean)).size
  const watchShare = Math.round((reviewGate.watch / visibleCount) * 100)

  let trustScore = 100
  if (!payload) trustScore = 0
  if (payload?.meta.stale) trustScore -= 10
  if (blockedVisible > 0) trustScore -= 45
  if (staleVisible) trustScore -= 28
  if (watchShare > 55) trustScore -= 10
  if (trustedShare < 35) trustScore -= 10
  if (qualityAudit?.status === 'watch') trustScore -= 5
  if (qualityAudit?.status === 'degraded') trustScore -= 18
  trustScore = clamp(Math.round(trustScore), 0, 100)

  const status = buildStatus({
    score: trustScore,
    blockedVisible,
    staleVisible,
    trustedShare,
    hasPayload: Boolean(payload),
  })

  const recommendations = [
    ...(qualityAudit?.recommendations || []),
    ...(staleVisible ? ['Live map has stale visible items; rerun maritime update before promoting this view.'] : []),
    ...(blockedVisible > 0 ? ['Blocked items are visible; investigate review filtering immediately.'] : []),
    ...(trustedShare < 45 ? ['Increase official, tier-one or trade-source coverage before raising confidence labels.'] : []),
  ]

  return {
    generatedAt: new Date().toISOString(),
    status: status.status,
    trustScore,
    statusLabel: status.label,
    statusReason: status.reason,
    liveMap: {
      articleCount: articles.length,
      signalCount: signals.length,
      hotspotCount: hotspots.length,
      maxArticleAgeHours: LIVE_MAP_NEWS_MAX_AGE_HOURS,
      oldestVisibleArticleAgeHours,
      latestEvidenceAt,
      blockedVisible,
      reviewGate,
    },
    marketPro: {
      newsMaxAgeHours: MARKET_PRO_NEWS_MAX_AGE_HOURS,
      signalMaxAgeHours: MARKET_PRO_SIGNAL_MAX_AGE_HOURS,
      rule: 'Market Pro only scores fresh reviewed news and fresh maritime signals before it creates an AI market view.',
    },
    sourceMix,
    sourceQuality: {
      trustedCount,
      trustedShare,
      watchCount: sourceMix.watch + reviewGate.watch,
      uniqueSources,
    },
    coverageGaps: qualityAudit?.coverageGaps || [],
    guardrails: [
      {
        title: 'AI is not the source',
        state: 'active',
        detail: 'AI can summarize and rank events, but every live-map or Market Pro item must point back to source evidence.',
      },
      {
        title: 'No stale live claims',
        state: staleVisible ? 'blocked' : 'active',
        detail: `Live map news expires after ${LIVE_MAP_NEWS_MAX_AGE_HOURS} hours, Market Pro news after ${MARKET_PRO_NEWS_MAX_AGE_HOURS} hours and signals after ${MARKET_PRO_SIGNAL_MAX_AGE_HOURS} hours.`,
      },
      {
        title: 'Review gate before publish',
        state: blockedVisible > 0 ? 'blocked' : reviewGate.watch > reviewGate.approved ? 'watch' : 'active',
        detail: 'Weak or uncorroborated items stay in watch or blocked state instead of being promoted as hard risk.',
      },
      {
        title: 'Explain market calls',
        state: 'active',
        detail: 'Market Pro must show the asset, direction, buy/hold/sell view, confidence, sell signal and source-backed reason.',
      },
    ],
    recommendations: Array.from(new Set(recommendations)).slice(0, 6),
    cache: {
      cached: Boolean(payload?.meta.cached),
      stale: Boolean(payload?.meta.stale),
      generatedAt: payload?.meta.generatedAt || payload?.data.timestamp || null,
      source: payload?.meta.source || 'Unavailable',
      version: payload?.meta.version || 'Unavailable',
    },
  }
}

export async function loadSourceTrustReport(supabase: SupabaseClient): Promise<SourceTrustReport> {
  const payload =
    (await getFreshMaritimeDashboardCache(supabase).catch(() => null)) ||
    (await withTimeout(buildMaritimeDashboardPayload(supabase), 4500, 'source trust live maritime payload').catch(() => null)) ||
    (await getLastMaritimeDashboardCache(supabase, 'source trust monitor using last saved maritime cache').catch(() => null)) ||
    buildOfflineMaritimeDashboardSnapshot('source trust monitor using bundled archive because live data was unavailable')

  return buildSourceTrustReport(payload)
}
