const MAP_URL = 'https://www.vesselsurge.com/map-dashboard'
const MAX_POST_LENGTH = 280

const HOTSPOT_NAMES = {
  hormuz: 'Strait of Hormuz',
  bab: 'Bab el-Mandeb',
  malacca: 'Strait of Malacca',
  suez: 'Suez Canal',
}

const HOOKS = {
  critical: [
    'One chokepoint can shake global trade.',
    'This is why shipping desks watch chokepoints.',
    'A critical trade route is back in focus.',
  ],
  high: [
    'Supply chain risk rarely rings a bell first.',
    'Shipping teams should have this on radar.',
    'A route signal worth watching before it spreads.',
  ],
  medium: [
    'Small maritime signals can become big delays.',
    'Another chokepoint signal just surfaced.',
    'A quiet route update can still move decisions.',
  ],
  low: [
    'The best risk signals are caught early.',
    'Quiet routes still deserve live monitoring.',
    'A new verified maritime update is live.',
  ],
}

const IMPACT_LINES = {
  critical: [
    'Follow the source trail before the market narrative catches up.',
    'Useful for routing, cargo exposure, and trade risk monitoring.',
  ],
  high: [
    'Track the signal before it becomes a wider supply chain story.',
    'Useful for routing, cargo exposure, and trade risk monitoring.',
  ],
  medium: [
    'Verified context beats rumors when routes start moving.',
    'Track the signal before it becomes a wider supply chain story.',
  ],
  low: [
    'Early context is how maritime risk stays manageable.',
    'Verified context beats rumors when routes start moving.',
  ],
}

const IRAN_TRUMP_HOOKS = [
  'Trump, Iran, oil, and shipping risk are colliding again.',
  'The Trump-Iran risk premium is back on the maritime map.',
  "When Iran risk rises, Hormuz becomes everyone's problem.",
  'Oil markets watch headlines. Shipping watches Hormuz.',
  'Hormuz is where geopolitics turns into freight risk.',
  'Iran headlines matter most when ships have to move.',
]

const IRAN_TRUMP_IMPACT_LINES = [
  'VesselSurge tracks the verified maritime signals behind the geopolitics.',
  'Follow the chokepoint data behind the Trump-Iran headlines.',
  'Track the route risk before it turns into a broader oil and freight story.',
  'Verified source signals beat market noise when Hormuz is in play.',
]

const CTA_LABELS = [
  'Live map',
  'Track it live',
  'Watch the map',
  'VesselSurge map',
]

function truncate(value, max) {
  if (max <= 1) return ''
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}

function compact(value) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim()
}

function seedFrom(value) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function pickFrom(list, seedText, variantSeed = '', offset = 0) {
  const seed = seedFrom(`${seedText}:${variantSeed}:${offset}`)
  return list[seed % list.length]
}

function hasIranTrumpAngle(article) {
  const haystack = compact(`${article.region} ${article.title} ${article.summary} ${article.source}`).toLowerCase()
  return (
    article.region === 'hormuz' ||
    /\b(trump|iran|iranian|tehran|hormuz|sanction|sanctions|oil|crude|tanker|u\.s\.|us navy|pentagon)\b/.test(
      haystack,
    )
  )
}

export function getMarketingApproval(article) {
  const title = compact(article.title)
  const summary = compact(article.summary)
  const source = compact(article.source)
  const risk = article.riskLevel || article.risk || 'medium'
  const text = `${title} ${summary}`.toLowerCase()
  const reasons = []
  let score = 30

  if (!title || title.length < 24) {
    reasons.push('title too weak')
    score -= 35
  } else if (title.length >= 55) {
    reasons.push('strong headline length')
    score += 12
  }

  if (!source) {
    reasons.push('missing source')
    score -= 25
  } else {
    reasons.push('trusted source')
  }

  if (article.sourceUrl) {
    reasons.push('source URL present')
    score += 8
  }

  if (hasIranTrumpAngle(article)) {
    reasons.push('Trump/Iran/Hormuz angle')
    score += 30
  }

  if (risk === 'critical') {
    reasons.push('critical risk')
    score += 20
  } else if (risk === 'high') {
    reasons.push('high risk')
    score += 15
  } else if (risk === 'medium') {
    score += 8
  }

  if (/\b(registersod|_layouts|javascript|undefined|null)\b/.test(text)) {
    reasons.push('scrape noise detected')
    score -= 45
  }

  if (/[.…]{3,}$/.test(title) || title.includes('...')) {
    reasons.push('headline appears truncated')
    score -= 25
  }

  const approved = score >= 60

  return {
    approved,
    approvedBy: approved ? 'VesselSurge marketing approval agent' : null,
    status: approved ? 'approved' : 'rejected',
    score,
    reasons,
  }
}

function pickHook(article, variantSeed = '') {
  if (hasIranTrumpAngle(article)) {
    return pickFrom(IRAN_TRUMP_HOOKS, `${article.title}${article.region}`, variantSeed, 1)
  }

  const risk = article.riskLevel || article.risk || 'medium'
  const hooks = HOOKS[risk] || HOOKS.medium
  return pickFrom(hooks, `${article.title}${article.region}`, variantSeed, 2)
}

function pickImpactLine(article, variantSeed = '') {
  if (hasIranTrumpAngle(article)) {
    return pickFrom(IRAN_TRUMP_IMPACT_LINES, `${article.source}${article.title}`, variantSeed, 3)
  }

  const risk = article.riskLevel || article.risk || 'medium'
  const lines = IMPACT_LINES[risk] || IMPACT_LINES.medium
  return pickFrom(lines, `${article.source}${article.title}`, variantSeed, 4)
}

export function buildMarketingPost(article, options = {}) {
  const variantSeed = options.variantSeed || ''
  const hotspot = HOTSPOT_NAMES[article.region] || article.region
  const source = truncate(compact(article.source || 'verified source'), 32)
  const hook = pickHook(article, variantSeed)
  const impactLine = pickImpactLine(article, variantSeed)
  const ctaLabel = pickFrom(CTA_LABELS, `${article.title}${article.source}`, variantSeed, 5)
  const template = seedFrom(`${article.title}${variantSeed}`) % 3
  const footer = `\n\n${impactLine}\n\n${ctaLabel}: ${MAP_URL}\nSource: ${source}`
  const prefix =
    template === 0
      ? `${hook}\n\n${hotspot}: `
      : template === 1
        ? `${hook}\n\nWhy it matters: `
        : `${hook}\n\n${hotspot} watch: `
  const titleBudget = Math.max(48, MAX_POST_LENGTH - prefix.length - footer.length)
  const title = truncate(compact(article.title || 'New maritime intelligence update'), titleBudget)

  return `${prefix}${title}${footer}`
}
