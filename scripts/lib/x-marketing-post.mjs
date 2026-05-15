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
    'Maritime risk is moving fast.',
    'Routing decisions need verified context.',
    'A critical chokepoint just moved back into focus.',
  ],
  high: [
    'Shipping teams are watching this route closely.',
    'Another maritime signal worth tracking.',
    'Global trade risk rarely gives much warning.',
  ],
  medium: [
    'A fresh maritime signal just hit our watchlist.',
    'A route update worth keeping on the radar.',
    'VesselSurge is tracking another chokepoint signal.',
  ],
  low: [
    'Even quiet routes deserve verified monitoring.',
    'A new verified update is live on VesselSurge.',
    'The live map has a fresh source update.',
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

export function buildMarketingPost(article) {
  const hotspot = HOTSPOT_NAMES[article.region] || article.region
  const source = truncate(compact(article.source || 'verified source'), 32)
  const hook = pickHook(article)
  const valueLine = 'Verified chokepoint intelligence for faster routing and risk decisions.'
  const footer = `\n\n${valueLine}\n\nSource: ${source}\n${MAP_URL}`
  const prefix = `${hook}\n\n${hotspot}: `
  const titleBudget = Math.max(48, MAX_POST_LENGTH - prefix.length - footer.length)
  const title = truncate(compact(article.title || 'New maritime intelligence update'), titleBudget)

  return `${prefix}${title}${footer}`
}
