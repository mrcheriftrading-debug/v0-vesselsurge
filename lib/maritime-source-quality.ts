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
  /\bal jazeera\b/i,
  /\bbloomberg\b/i,
  /\bnew york times\b|\bnytimes\b|\bnyt\b/i,
  /\breuters\b/i,
  /\bassociated press\b|\bap news\b/i,
  /\bbbc\b/i,
  /\bfinancial times\b|\bft\.com\b/i,
  /\bthe guardian\b|\bguardian\b/i,
  /\bcnbc\b/i,
]

const OFFICIAL_SOURCE_PATTERNS = [
  /\bukmto\b/i,
  /\bmarad\b/i,
  /\bmscio\b/i,
  /\brecaap\b/i,
  /\bsuez canal authority\b/i,
  /\bnorwegian maritime authority\b/i,
]

export function isTierOneNewsSource(source?: string | null) {
  if (!source) return false
  return TIER_ONE_SOURCE_PATTERNS.some((pattern) => pattern.test(source))
}

export function maritimeSourceQualityLabel(source?: string | null) {
  if (!source) return 'Source watch'
  if (OFFICIAL_SOURCE_PATTERNS.some((pattern) => pattern.test(source))) return 'Official source'
  if (isTierOneNewsSource(source)) return 'Tier-1 newsroom'
  return 'Maritime source'
}
