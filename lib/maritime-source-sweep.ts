import { officialMaritimeWatchSourceForRegion } from './maritime-official-watch-sources'
import { MARITIME_SEARCH_FEEDS } from './maritime-search-feeds'

export type SourceSweepAuditSource = {
  source: string
  url: string
  layer: 'official' | 'recent-search' | 'trade-search' | 'tier-one-search' | 'search'
}

function uniqueAuditSources(sources: SourceSweepAuditSource[]) {
  const seen = new Set<string>()
  return sources.filter((source) => {
    const key = `${source.source}:${source.url}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function sourceSweepAuditSourcesForRegion(region: string): SourceSweepAuditSource[] {
  const officialSource = officialMaritimeWatchSourceForRegion(region)
  const feeds = MARITIME_SEARCH_FEEDS.filter((feed) => feed.regionHint === region)
  const recentSearch = feeds.find((feed) => feed.source.startsWith('Google News 48h Search:'))
  const tradeSearch = feeds.find((feed) => /trade-source sweep/i.test(feed.source))
  const tierOneSearch = feeds.find((feed) => /Tier-1/i.test(feed.source))
  const generalSearch = feeds.find((feed) => feed.source.startsWith('Bing News Search:'))

  return uniqueAuditSources([
    ...(officialSource ? [{
      source: officialSource.source,
      url: officialSource.url,
      layer: 'official' as const,
    }] : []),
    ...(recentSearch ? [{
      source: recentSearch.source,
      url: recentSearch.url,
      layer: 'recent-search' as const,
    }] : []),
    ...(tradeSearch ? [{
      source: tradeSearch.source,
      url: tradeSearch.url,
      layer: 'trade-search' as const,
    }] : []),
    ...(tierOneSearch ? [{
      source: tierOneSearch.source,
      url: tierOneSearch.url,
      layer: 'tier-one-search' as const,
    }] : []),
    ...(generalSearch ? [{
      source: generalSearch.source,
      url: generalSearch.url,
      layer: 'search' as const,
    }] : []),
  ]).slice(0, 4)
}

export function sourceSweepSummary(routeName: string, auditSources: SourceSweepAuditSource[]) {
  const checked = auditSources.length
    ? auditSources.map((source) => source.source).slice(0, 4).join(', ')
    : 'trusted news and route-watch sources'

  return `The latest VesselSurge source sweep checked ${checked}; no current source-backed disruption is being claimed for ${routeName}.`
}

export function sourceSweepLayerLabel(layer?: SourceSweepAuditSource['layer'] | string | null) {
  switch (layer) {
    case 'official':
      return 'official source'
    case 'recent-search':
      return 'recent news sweep'
    case 'trade-search':
      return 'trade-source sweep'
    case 'tier-one-search':
      return 'tier-1 newsroom sweep'
    case 'search':
      return 'general search sweep'
    default:
      return 'trusted source sweep'
  }
}

export function sourceSweepAuditCount(signal: {
  signalType?: string | null
  signal_type?: string | null
  sourceAuditCount?: number | null
  metadata?: Record<string, unknown> | null
}) {
  const signalType = signal.signalType || signal.signal_type
  if (signalType !== 'source_sweep') return 0
  if (typeof signal.sourceAuditCount === 'number') return signal.sourceAuditCount

  const checkedSources = signal.metadata?.checkedSources
  if (Array.isArray(checkedSources)) return checkedSources.length

  const checkedSourceCount = signal.metadata?.checkedSourceCount
  return typeof checkedSourceCount === 'number' ? checkedSourceCount : 0
}
