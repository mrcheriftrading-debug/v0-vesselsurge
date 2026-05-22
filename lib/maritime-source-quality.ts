export const TIER_ONE_NEWS_SOURCE_NAMES = [
  'Al Jazeera',
  'Bloomberg Markets',
  'Bloomberg Politics',
  'Bloomberg Economics',
  'Bloomberg Business',
  'New York Times World',
  'New York Times Business',
  'BBC World',
  'The Guardian World',
  'Financial Times World',
  'Financial Times Markets',
  'CNBC World News',
]

const TIER_ONE_SOURCE_PATTERNS = [
  /\bal jazeera\b|\baljazeera\.com\b/i,
  /\bbloomberg\b|\bbloomberg\.com\b/i,
  /\bnew york times\b|\bnytimes\b|\bnyt\b|\bnytimes\.com\b/i,
  /\breuters\b|\breuters\.com\b/i,
  /\bassociated press\b|\bap news\b|\bapnews\.com\b/i,
  /\bbbc\b|\bbbc\.com\b|\bbbc\.co\.uk\b/i,
  /\bfinancial times\b|\bft\.com\b/i,
  /\bthe guardian\b|\bguardian\b|\btheguardian\.com\b/i,
  /\bcnbc\b|\bcnbc\.com\b/i,
]

const OFFICIAL_SOURCE_PATTERNS = [
  /\bukmto\b/i,
  /\bmarad\b/i,
  /\bmscio\b/i,
  /\brecaap\b/i,
  /\bsuez canal authority\b/i,
  /\bpanama canal authority\b|\bpancanal\b/i,
  /\btaiwan maritime and port bureau\b|\bmotcmpb\b/i,
  /\bgibraltar port authority\b/i,
  /\bdirectorate general of coastal safety\b|\bturkish coastal safety\b/i,
  /\bsouth african maritime safety authority\b|\bsamsa\b/i,
  /\bnorwegian maritime authority\b/i,
]

const MARITIME_TRADE_SOURCE_PATTERNS = [
  /\bgcaptain\b/i,
  /\blloyd'?s list\b/i,
  /\btradewinds\b/i,
  /\bseatrade\b/i,
  /\bsplash247\b/i,
  /\bmarine insight\b/i,
  /\bmarinelink\b/i,
  /\bsafety4sea\b/i,
  /\busni news\b/i,
  /\bhellenic shipping\b/i,
  /\bworld oil\b/i,
  /\boilprice\b/i,
  /\binsurance journal\b/i,
  /\bcontainer news\b/i,
  /\bship technology\b/i,
  /\bworldcargo\b|\bworld cargo\b/i,
  /\bjournal of commerce\b|\bjoc\.com\b/i,
  /\bhapag[-\s]?lloyd\b/i,
  /\bportnews\b|\bportnews iaa\b|\bportnews\.ru\b/i,
  /\bport technology\b|\bporttechnology\.org\b/i,
  /\bthe loadstar\b|\btheloadstar\.com\b/i,
  /\briviera maritime\b|\brivieramm\.com\b/i,
  /\bbaird maritime\b|\bbairdmaritime\.com\b/i,
]

const SEARCH_LAYER_PATTERN = /\b(google news|bing news)\b/i

export function isTierOneNewsSource(source?: string | null) {
  if (!source) return false
  return TIER_ONE_SOURCE_PATTERNS.some((pattern) => pattern.test(source))
}

export function isOfficialMaritimeSource(source?: string | null) {
  if (!source) return false
  return OFFICIAL_SOURCE_PATTERNS.some((pattern) => pattern.test(source))
}

export function isMaritimeTradeSource(source?: string | null) {
  if (!source) return false
  return MARITIME_TRADE_SOURCE_PATTERNS.some((pattern) => pattern.test(source))
}

export function maritimeSourceQualityLabel(source?: string | null) {
  if (!source) return 'Source watch'
  if (isOfficialMaritimeSource(source)) return 'Official source'
  if (isTierOneNewsSource(source)) return 'Tier-1 newsroom'
  if (isMaritimeTradeSource(source)) return 'Maritime trade source'
  if (SEARCH_LAYER_PATTERN.test(source)) return 'Search-surfaced source'
  return 'Maritime source'
}

export function maritimeSourceQualityScore(source?: string | null) {
  if (!source) return 35
  if (isOfficialMaritimeSource(source)) return 100
  if (isTierOneNewsSource(source)) return 92
  if (isMaritimeTradeSource(source)) return 78
  if (SEARCH_LAYER_PATTERN.test(source)) return 62
  return 55
}

export function maritimeSourceQualityTier(source?: string | null) {
  if (!source) return 'watch'
  if (isOfficialMaritimeSource(source)) return 'official'
  if (isTierOneNewsSource(source)) return 'tierOne'
  if (isMaritimeTradeSource(source)) return 'trade'
  if (SEARCH_LAYER_PATTERN.test(source)) return 'search'
  return 'general'
}

export function maritimeFreshnessScore(timestamp?: string | null) {
  if (!timestamp) return 0
  const parsed = Date.parse(timestamp)
  if (!Number.isFinite(parsed)) return 0

  const ageHours = Math.max(0, (Date.now() - parsed) / 36e5)
  if (ageHours <= 1) return 100
  if (ageHours <= 6) return 88
  if (ageHours <= 12) return 78
  if (ageHours <= 24) return 66
  if (ageHours <= 72) return 45
  if (ageHours <= 168) return 28
  return 12
}

export function maritimeArticleIntelligenceScore(input: {
  source?: string | null
  timestamp?: string | null
  title?: string | null
  summary?: string | null
  region?: string | null
}) {
  const text = `${input.title || ''} ${input.summary || ''} ${input.region || ''}`
  const sourceScore = maritimeSourceQualityScore(input.source)
  const freshnessScore = maritimeFreshnessScore(input.timestamp)
  const marketRelevance =
    /\b(hormuz|red sea|bab el|suez|malacca|panama canal|taiwan strait|turkish straits|bosporus|bosphorus|dardanelles|gibraltar|cape of good hope|tanker|oil|crude|lng|freight|rerout|war[-\s]?risk|insurance|ais|chokepoint|shipping|vessel|port|canal)\b/i
      .test(text)
      ? 100
      : 45

  return Math.round((sourceScore * 0.46) + (freshnessScore * 0.34) + (marketRelevance * 0.2))
}
