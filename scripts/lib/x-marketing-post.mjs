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

function truncate(value, max) {
  if (max <= 1) return ''
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}

function compact(value) {
  return `${value || ''}`.replace(/\s+/g, ' ').trim()
}

function pickHook(article) {
  const risk = article.riskLevel || article.risk || 'medium'
  const hooks = HOOKS[risk] || HOOKS.medium
  const seed = [...`${article.title}${article.region}`].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return hooks[seed % hooks.length]
}

function pickImpactLine(article) {
  const risk = article.riskLevel || article.risk || 'medium'
  const lines = IMPACT_LINES[risk] || IMPACT_LINES.medium
  const seed = [...`${article.source}${article.title}`].reduce((sum, char) => sum + char.charCodeAt(0), 0)
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
