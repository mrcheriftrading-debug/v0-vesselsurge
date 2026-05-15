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
]

const IRAN_TRUMP_IMPACT_LINES = [
  'VesselSurge tracks the verified maritime signals behind the geopolitics.',
  'Follow the chokepoint data behind the Trump-Iran headlines.',
  'Track the route risk before it turns into a broader oil and freight story.',
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

function hasIranTrumpAngle(article) {
  const haystack = compact(`${article.region} ${article.title} ${article.summary} ${article.source}`).toLowerCase()
  return (
    article.region === 'hormuz' ||
    /\b(trump|iran|iranian|tehran|hormuz|sanction|sanctions|oil|crude|tanker|u\.s\.|us navy|pentagon)\b/.test(
      haystack,
    )
  )
}

function pickHook(article) {
  if (hasIranTrumpAngle(article)) {
    const seed = seedFrom(`${article.title}${article.region}`)
    return IRAN_TRUMP_HOOKS[seed % IRAN_TRUMP_HOOKS.length]
  }

  const risk = article.riskLevel || article.risk || 'medium'
  const hooks = HOOKS[risk] || HOOKS.medium
  const seed = seedFrom(`${article.title}${article.region}`)
  return hooks[seed % hooks.length]
}

function pickImpactLine(article) {
  if (hasIranTrumpAngle(article)) {
    const seed = seedFrom(`${article.source}${article.title}`)
    return IRAN_TRUMP_IMPACT_LINES[seed % IRAN_TRUMP_IMPACT_LINES.length]
  }

  const risk = article.riskLevel || article.risk || 'medium'
  const lines = IMPACT_LINES[risk] || IMPACT_LINES.medium
  const seed = seedFrom(`${article.source}${article.title}`)
  return lines[seed % lines.length]
}

export function buildMarketingPost(article) {
  const hotspot = HOTSPOT_NAMES[article.region] || article.region
  const source = truncate(compact(article.source || 'verified source'), 32)
  const hook = pickHook(article)
  const impactLine = pickImpactLine(article)
  const footer = `\n\n${impactLine}\n\nLive map: ${MAP_URL}\nSource: ${source}`
  const prefix = `${hook}\n\n${hotspot}: `
  const titleBudget = Math.max(48, MAX_POST_LENGTH - prefix.length - footer.length)
  const title = truncate(compact(article.title || 'New maritime intelligence update'), titleBudget)

  return `${prefix}${title}${footer}`
}
