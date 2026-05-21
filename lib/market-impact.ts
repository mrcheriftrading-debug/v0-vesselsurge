import 'server-only'
import { maritimeSourceQualityLabel, maritimeSourceQualityScore } from '@/lib/maritime-source-quality'
import { formatQuoteMove, quoteFor, type MarketSnapshot } from '@/lib/market-snapshot'

type NewsInput = {
  id?: string
  title: string
  snippet?: string | null
  source?: string | null
  url?: string | null
  region?: string | null
  topic?: string | null
  published_at?: string | null
  created_at?: string | null
}

type SignalInput = {
  signal_key?: string
  title: string
  summary?: string | null
  source?: string | null
  source_url?: string | null
  region?: string | null
  signal_type?: string | null
  observed_at?: string | null
  confidence?: number | null
}

type WeightedTerm = {
  pattern: RegExp
  weight: number
  reason: string
}

const PRO_INVESTOR_SKILL = {
  name: 'Pro Investor Impact Skill',
  mandate: 'Translate maritime disruption into tradable macro pressure without making investment advice.',
  outputs: ['oil beta', 'freight pressure', 'insurance pressure', 'equity risk-on/risk-off', 'confidence bands'],
}

const PRO_MARKET_ANALYST_SKILL = {
  name: 'Pro Market Analyst Skill',
  mandate: 'Score each source event by severity, recency, chokepoint exposure, and cross-market transmission.',
  outputs: ['market narrative', 'asset class table', 'watchlist triggers', 'source-backed evidence'],
}

const MARKET_TERMS: WeightedTerm[] = [
  { pattern: /\b(hormuz|persian gulf|gulf of oman|iran)\b/i, weight: 18, reason: 'Gulf energy chokepoint exposure' },
  { pattern: /\b(red sea|bab el[-\s]?mandeb|houthi|yemen|aden)\b/i, weight: 15, reason: 'Red Sea rerouting and war-risk pressure' },
  { pattern: /\b(suez|canal|port said)\b/i, weight: 11, reason: 'Asia-Europe transit and canal delay exposure' },
  { pattern: /\b(malacca|singapore strait|recaap|piracy|armed robbery)\b/i, weight: 8, reason: 'Southeast Asia congestion and security exposure' },
  { pattern: /\b(seized|hijack|attack|missile|drone|explosion|sunk|warning|advisory|war risk)\b/i, weight: 18, reason: 'Security event can reprice insurance and route risk' },
  { pattern: /\b(tanker|oil|crude|lng|bunker fuel|energy)\b/i, weight: 14, reason: 'Energy transport sensitivity' },
  { pattern: /\b(freight|reroute|divert|delay|queue|congestion|transit|shipping rate)\b/i, weight: 12, reason: 'Direct freight-rate and schedule impact' },
  { pattern: /\b(insurance|premium|underwriter|war-risk|war risk)\b/i, weight: 13, reason: 'Insurance repricing signal' },
  { pattern: /\b(us|united states|israel|iran|military|navy|sanction)\b/i, weight: 9, reason: 'Geopolitical escalation channel' },
]

const ASSET_MAP = [
  {
    asset: 'Broad equity indices',
    bias: 'Risk appetite / de-risking signal',
    terms: /\b(hormuz|iran|red sea|suez|malacca|war risk|oil|freight|reroute|insurance|military)\b/i,
  },
  {
    asset: 'Brent / WTI crude',
    bias: 'Upward risk premium',
    terms: /\b(hormuz|iran|oil|crude|tanker|persian gulf|gulf of oman|war risk)\b/i,
  },
  {
    asset: 'Product tankers and crude tankers',
    bias: 'Volatility and route premium',
    terms: /\b(tanker|reroute|freight|hormuz|red sea|bab el|insurance)\b/i,
  },
  {
    asset: 'Container freight and Asia-Europe logistics',
    bias: 'Rate and delay pressure',
    terms: /\b(suez|red sea|bab el|container|freight|reroute|delay|queue)\b/i,
  },
  {
    asset: 'Marine insurers / war-risk premiums',
    bias: 'Premium repricing',
    terms: /\b(insurance|war-risk|war risk|attack|seized|missile|drone|advisory)\b/i,
  },
  {
    asset: 'Airlines and fuel-sensitive industrials',
    bias: 'Margin pressure if energy spikes',
    terms: /\b(oil|crude|bunker fuel|energy|hormuz|iran)\b/i,
  },
]

function recencyBoost(value?: string | null) {
  if (!value) return 0
  const ageHours = Math.max(0, (Date.now() - Date.parse(value)) / 36e5)
  if (!Number.isFinite(ageHours)) return 0
  if (ageHours < 3) return 18
  if (ageHours < 12) return 12
  if (ageHours < 36) return 7
  if (ageHours < 96) return 3
  return 0
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function scoreText(text: string, timestamp?: string | null, source?: string | null) {
  const reasons: string[] = []
  const sourceQualityScore = maritimeSourceQualityScore(source)
  let score = recencyBoost(timestamp) + Math.round(sourceQualityScore * 0.16)

  if (sourceQualityScore >= 90) reasons.push(`${maritimeSourceQualityLabel(source)} confirmation`)
  else if (sourceQualityScore >= 76) reasons.push(`${maritimeSourceQualityLabel(source)} evidence`)

  for (const term of MARKET_TERMS) {
    if (term.pattern.test(text)) {
      score += term.weight
      reasons.push(term.reason)
    }
  }

  return {
    score: clamp(Math.round(score)),
    reasons: [...new Set(reasons)].slice(0, 4),
  }
}

function severityLabel(score: number) {
  if (score >= 78) return 'critical'
  if (score >= 58) return 'high'
  if (score >= 36) return 'watch'
  return 'low'
}

function confidenceLabel(count: number, averageScore: number) {
  if (count >= 10 && averageScore >= 55) return 'high'
  if (count >= 5 && averageScore >= 38) return 'medium'
  return 'developing'
}

function isSignalInput(item: NewsInput | SignalInput): item is SignalInput {
  return 'signal_key' in item || 'signal_type' in item || 'observed_at' in item
}

function itemTime(item: NewsInput | SignalInput) {
  return isSignalInput(item)
    ? item.observed_at || null
    : item.published_at || item.created_at || null
}

function itemUrl(item: NewsInput | SignalInput) {
  return isSignalInput(item) ? item.source_url || null : item.url || null
}

function itemSummary(item: NewsInput | SignalInput) {
  return isSignalInput(item) ? item.summary || '' : item.snippet || ''
}

function quotePct(snapshot: MarketSnapshot | null, symbol: string) {
  return quoteFor(snapshot, symbol)?.changePercent || 0
}

function quoteChange(snapshot: MarketSnapshot | null, symbol: string) {
  return quoteFor(snapshot, symbol)?.change || 0
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value))
  if (!clean.length) return 0
  return clean.reduce((sum, value) => sum + value, 0) / clean.length
}

function marketTapePressureScore(snapshot: MarketSnapshot | null) {
  if (!snapshot) return 0

  const equityMove = average([
    quotePct(snapshot, '^GSPC'),
    quotePct(snapshot, '^IXIC'),
    quotePct(snapshot, '^DJI'),
    quotePct(snapshot, '^OMX'),
  ])
  const oilMove = average([quotePct(snapshot, 'BZ=F'), quotePct(snapshot, 'CL=F')])
  const tenYearBps = quoteChange(snapshot, '^TNX') * 100
  const dollarMove = quotePct(snapshot, 'DX-Y.NYB')

  return clamp(Math.round(
    34 +
    Math.max(0, oilMove) * 9 +
    Math.max(0, tenYearBps) * 1.3 +
    Math.max(0, -equityMove) * 7 +
    Math.max(0, dollarMove) * 4,
  ))
}

function marketDriversForAsset(asset: string, snapshot: MarketSnapshot | null) {
  if (!snapshot) return []

  if (asset === 'Broad equity indices') {
    return [
      `${formatQuoteMove(quoteFor(snapshot, '^GSPC'))}; ${formatQuoteMove(quoteFor(snapshot, '^IXIC'))}`,
      formatQuoteMove(quoteFor(snapshot, '^OMX')),
    ]
  }

  if (asset.includes('Brent') || asset.includes('tankers')) {
    return [
      `${formatQuoteMove(quoteFor(snapshot, 'BZ=F'))}; ${formatQuoteMove(quoteFor(snapshot, 'CL=F'))}`,
    ]
  }

  if (asset.includes('Container') || asset.includes('logistics')) {
    return [
      `${formatQuoteMove(quoteFor(snapshot, 'IYT'))}; ${formatQuoteMove(quoteFor(snapshot, '^OMX'))}`,
    ]
  }

  if (asset.includes('insurers')) {
    return [
      `${formatQuoteMove(quoteFor(snapshot, '^TNX'))}; ${formatQuoteMove(quoteFor(snapshot, 'GC=F'))}`,
    ]
  }

  if (asset.includes('Airlines') || asset.includes('fuel')) {
    return [
      `${formatQuoteMove(quoteFor(snapshot, 'CL=F'))}; ${formatQuoteMove(quoteFor(snapshot, 'DX-Y.NYB'))}`,
    ]
  }

  return []
}

function marketScoreAdjustment(asset: string, snapshot: MarketSnapshot | null) {
  if (!snapshot) return 0

  const oilMove = average([quotePct(snapshot, 'BZ=F'), quotePct(snapshot, 'CL=F')])
  const equityMove = average([
    quotePct(snapshot, '^GSPC'),
    quotePct(snapshot, '^IXIC'),
    quotePct(snapshot, '^DJI'),
    quotePct(snapshot, '^OMX'),
  ])
  const tenYearBps = quoteChange(snapshot, '^TNX') * 100
  const transportMove = quotePct(snapshot, 'IYT')
  const dollarMove = quotePct(snapshot, 'DX-Y.NYB')

  if (asset === 'Broad equity indices') {
    return Math.round(Math.max(0, -equityMove) * 10 + Math.max(0, oilMove) * 3 + Math.max(0, tenYearBps) * 0.8)
  }

  if (asset.includes('Brent') || asset.includes('tankers')) {
    return Math.round(Math.max(0, oilMove) * 8)
  }

  if (asset.includes('Container') || asset.includes('logistics')) {
    return Math.round(Math.max(0, -transportMove) * 8 + Math.max(0, oilMove) * 3)
  }

  if (asset.includes('insurers')) {
    return Math.round(Math.max(0, tenYearBps) * 0.7 + Math.max(0, oilMove) * 3)
  }

  if (asset.includes('Airlines') || asset.includes('fuel')) {
    return Math.round(Math.max(0, oilMove) * 8 + Math.max(0, dollarMove) * 4)
  }

  return 0
}

export function buildMarketImpactReport(news: NewsInput[], signals: SignalInput[], marketSnapshot: MarketSnapshot | null = null) {
  const merged = [
    ...news.map((item) => ({ kind: 'news' as const, item })),
    ...signals.map((item) => ({ kind: 'signal' as const, item })),
  ]

  const scored = merged
    .map(({ kind, item }) => {
      const text = `${item.title || ''} ${itemSummary(item)} ${item.region || ''} ${isSignalInput(item) ? item.signal_type || '' : item.topic || ''}`
      const source = item.source || 'VesselSurge source layer'
      const { score, reasons } = scoreText(text, itemTime(item), source)
      return {
        id: (isSignalInput(item) ? item.signal_key : item.id) || item.title,
        kind,
        title: item.title,
        summary: itemSummary(item),
        source,
        sourceUrl: itemUrl(item),
        sourceQualityLabel: maritimeSourceQualityLabel(source),
        sourceQualityScore: maritimeSourceQualityScore(source),
        region: item.region || 'global',
        timestamp: itemTime(item),
        score,
        severity: severityLabel(score),
        reasons,
      }
    })
    .filter((item) => item.score >= 18)
    .sort((a, b) => b.score - a.score)

  const topStories = scored.slice(0, 12)
  const averageScore = topStories.length
    ? Math.round(topStories.reduce((sum, item) => sum + item.score, 0) / topStories.length)
    : 0

  const assetImpacts = ASSET_MAP.map((asset) => {
    const matching = topStories.filter((story) => asset.terms.test(`${story.title} ${story.summary} ${story.region}`))
    const maritimeScore = Math.round(matching.reduce((sum, story) => sum + story.score, 0) / Math.max(1, matching.length))
    const liveMarketDrivers = marketDriversForAsset(asset.asset, marketSnapshot)
    const score = clamp(maritimeScore + marketScoreAdjustment(asset.asset, marketSnapshot))
    return {
      asset: asset.asset,
      bias: matching.length || liveMarketDrivers.length ? asset.bias : 'No strong signal yet',
      score,
      evidenceCount: matching.length,
      drivers: [...new Set([...liveMarketDrivers, ...matching.flatMap((story) => story.reasons)])].slice(0, 4),
      marketMove: liveMarketDrivers[0] || null,
    }
  }).sort((a, b) => b.score - a.score)

  const regions = ['hormuz', 'bab', 'suez', 'malacca'].map((region) => {
    const regionStories = topStories.filter((story) => story.region === region)
    const score = regionStories.length
      ? Math.round(regionStories.reduce((sum, story) => sum + story.score, 0) / regionStories.length)
      : 0
    return {
      region,
      score,
      severity: severityLabel(score),
      headlines: regionStories.slice(0, 3).map((story) => story.title),
    }
  })

  const leadStory = topStories[0]
  const leadAsset = assetImpacts[0]
  const tapeScore = marketTapePressureScore(marketSnapshot)
  const blendedPressureScore = marketSnapshot
    ? clamp(Math.round((averageScore * 0.68) + (tapeScore * 0.32)))
    : clamp(averageScore)
  const narrative = leadStory
    ? `${leadStory.region.toUpperCase()} is the lead market-impact signal. ${leadStory.sourceQualityLabel} evidence and ${leadStory.reasons[0] || 'fresh maritime context'} point first toward ${leadAsset?.asset || 'energy and freight markets'} through ${leadAsset?.bias?.toLowerCase() || 'route-risk pressure'}. ${marketSnapshot ? `Live market tape: ${marketSnapshot.summary}` : ''}`.trim()
    : marketSnapshot
      ? `No major maritime event is strong enough for a high-conviction alert, but the live market tape still matters: ${marketSnapshot.summary}`
      : 'No major market-impact signal is currently strong enough for a high-conviction alert.'

  return {
    generatedAt: new Date().toISOString(),
    skills: [PRO_INVESTOR_SKILL, PRO_MARKET_ANALYST_SKILL],
    headline: 'VesselSurge Market Impact Radar',
    marketPressureScore: blendedPressureScore,
    marketTapeScore: tapeScore,
    confidence: confidenceLabel(topStories.length + (marketSnapshot ? 4 : 0), blendedPressureScore),
    narrative,
    marketSnapshot,
    marketDrivers: marketSnapshot?.drivers || [],
    assetImpacts,
    regions,
    topStories,
    watchTriggers: [
      'New verified incident near Hormuz, Bab el-Mandeb, Suez or Malacca',
      'Brent/WTI crude moves more than 2% while maritime risk headlines accelerate',
      'US 10Y yield or dollar strength tightens financial conditions during an oil move',
      'Insurance or war-risk premium language appears in trusted sources',
      'Tanker, LNG, crude or container rerouting language accelerates',
      'Multiple independent sources confirm the same maritime disruption',
    ],
    disclaimer: 'Research and market context only. Not financial advice, investment advice, or a recommendation to buy or sell securities.',
  }
}
