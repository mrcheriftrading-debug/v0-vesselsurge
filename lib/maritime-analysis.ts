export type HotspotAnalysisBrief = {
  headline: string
  impact: string
  why: string
  watch: string
  sourceBasis: string
  confidence: 'Strong' | 'Moderate' | 'Thin'
}

type AnalysisArticle = {
  title?: string | null
  summary?: string | null
  source?: string | null
  timestamp?: string | null
}

type AnalysisSignal = {
  title?: string | null
  summary?: string | null
  source?: string | null
  signalType?: string | null
  signal_type?: string | null
  severity?: string | null
  confidence?: number | null
  observedAt?: string | null
  observed_at?: string | null
}

type AnalysisInput = {
  hotspot: string
  riskLevel: string
  verifiedReports: number
  sourceCount: number
  latestSource?: string | null
  riskSummary?: string | null
  riskDrivers?: string[] | null
  articles?: AnalysisArticle[]
  signals?: AnalysisSignal[]
}

const ROUTE_NAMES: Record<string, string> = {
  hormuz: 'Strait of Hormuz',
  bab: 'Bab el-Mandeb',
  suez: 'Suez Canal',
  malacca: 'Strait of Malacca',
  panama: 'Panama Canal',
  taiwan: 'Taiwan Strait',
  turkish: 'Turkish Straits',
  gibraltar: 'Strait of Gibraltar',
  cape: 'Cape of Good Hope',
}

const ROUTE_IMPACT: Record<string, string> = {
  hormuz: 'Oil, LNG and Gulf tanker routes can face delays, rerouting pressure and higher war-risk costs.',
  bab: 'Red Sea and Gulf of Aden cargo can face rerouting, insurance pressure and longer Asia-Europe voyages.',
  suez: 'Canal delays can affect Asia-Europe schedules, container flow and feeder connections.',
  malacca: 'Dense tanker, container and bunker traffic can be affected by incidents around Malacca and Singapore Strait.',
  panama: 'Canal limits can affect Atlantic-Pacific schedules, queues, draught limits and booking capacity.',
  taiwan: 'Asia cargo continuity can be affected by maritime alerts, port constraints or naval activity.',
  turkish: 'Black Sea tanker and dry-bulk flow can be affected by weather holds, traffic stops and transit restrictions.',
  gibraltar: 'Atlantic-Mediterranean entry flow can be affected by congestion, port constraints and security signals.',
  cape: 'Cape routing pressure can add voyage time, fuel cost and schedule risk when Red Sea routes are avoided.',
}

const ROUTE_WATCH: Record<string, string> = {
  hormuz: 'Watch for official navigation warnings, confirmed transit flow, tanker diversions and independent closure or reopening reports.',
  bab: 'Watch UKMTO/MARAD/MSCIO alerts, confirmed vessel incidents, rerouting data and insurance changes.',
  suez: 'Watch canal authority updates, convoy changes, queue growth and Red Sea spillover into Suez schedules.',
  malacca: 'Watch ReCAAP alerts, Singapore Strait incidents, port congestion and tanker-density changes.',
  panama: 'Watch Panama Canal advisories, water-level limits, booking slots, draught changes and queue pressure.',
  taiwan: 'Watch maritime notices, port status, naval exercises and confirmed disruption to cargo routes.',
  turkish: 'Watch Bosporus and Dardanelles traffic notices, weather stops, tanker delays and Black Sea restrictions.',
  gibraltar: 'Watch Gibraltar/Algeciras port flow, weather, bunkering constraints and confirmed vessel incidents.',
  cape: 'Watch Red Sea rerouting volume, bunker pressure, weather windows and longer voyage-time reports.',
}

function routeName(hotspot: string) {
  return ROUTE_NAMES[hotspot] || hotspot
}

function cleanText(value?: string | null) {
  return (value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function evidenceTitle(value?: string | null) {
  const text = cleanText(value)
  return text.length > 120 ? `${text.slice(0, 117)}...` : text
}

function uniqueEvidence(input: AnalysisInput) {
  const rows = [
    ...(input.articles || []).map((article) => ({
      source: article.source || 'source report',
      title: article.title || article.summary || '',
    })),
    ...(input.signals || []).map((signal) => ({
      source: signal.source || 'operational signal',
      title: signal.title || signal.summary || '',
    })),
    ...(input.riskDrivers || []).map((driver) => {
      const [source, ...rest] = driver.split(':')
      return {
        source: rest.length ? source : 'risk driver',
        title: rest.length ? rest.join(':') : driver,
      }
    }),
  ]

  const seen = new Set<string>()
  return rows
    .map((row) => ({
      source: cleanText(row.source),
      title: evidenceTitle(row.title),
    }))
    .filter((row) => row.source && row.title)
    .filter((row) => {
      const key = `${row.source}:${row.title}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 3)
}

function confidence(input: AnalysisInput): HotspotAnalysisBrief['confidence'] {
  if (input.sourceCount >= 6 || (input.verifiedReports >= 4 && input.sourceCount >= 4)) return 'Strong'
  if (input.sourceCount >= 2 || input.verifiedReports >= 2) return 'Moderate'
  return 'Thin'
}

export function buildHotspotAnalysisBrief(input: AnalysisInput): HotspotAnalysisBrief {
  const name = routeName(input.hotspot)
  const risk = (input.riskLevel || 'low').toLowerCase()
  const reports = input.verifiedReports || 0
  const sources = input.sourceCount || 0
  const evidence = uniqueEvidence(input)
  const noFreshDisruption = reports === 0 || /no fresh source-backed disruption/i.test(input.riskSummary || '')
  const sourceBasis = `${reports} current source-linked report${reports === 1 ? '' : 's'}, ${sources} source${sources === 1 ? '' : 's'} and ${(input.signals || []).length} operational signal${(input.signals || []).length === 1 ? '' : 's'}. Risk cannot move on one weak article alone; it needs corroboration or official/strong operational evidence.`

  let headline = `${name}: no fresh verified disruption found`
  if (risk === 'critical') headline = `${name}: severe source-backed route disruption`
  else if (risk === 'high') headline = `${name}: active disruption signals`
  else if (risk === 'medium') headline = `${name}: route pressure is present`
  else if (!noFreshDisruption) headline = `${name}: reports are being watched`

  const impact = risk === 'low' && noFreshDisruption
    ? `${ROUTE_IMPACT[input.hotspot] || 'Route impact is monitored.'} No fresh verified disruption is being claimed right now.`
    : ROUTE_IMPACT[input.hotspot] || 'Route impact is monitored from source-backed reports and operational signals.'

  const why = evidence.length > 0
    ? `Based on ${reports} report${reports === 1 ? '' : 's'} across ${sources} source${sources === 1 ? '' : 's'}. Main evidence: ${evidence.map((row) => `${row.source}: ${row.title}`).join(' | ')}.`
    : `The latest source sweep did not find a fresh verified disruption report for ${name}; the route stays in watch mode until stronger evidence appears.`

  return {
    headline,
    impact,
    why,
    watch: ROUTE_WATCH[input.hotspot] || 'Watch for official notices, verified incidents and fresh independent source confirmation.',
    sourceBasis,
    confidence: confidence(input),
  }
}
