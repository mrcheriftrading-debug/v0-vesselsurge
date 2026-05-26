import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vesselsurge.com'
const AUTOMATIONS_DIR = '/Users/vesselsurge/.codex/automations'
const OPENCLAW_DIR = '/Users/vesselsurge/.openclaw'
const LIVE_HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape']

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

function loadLocalEnv() {
  const file = path.join(ROOT, '.env.local')
  const text = readText(file)
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = value
  }
}

function parseTomlString(text, key) {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*\"([^\"]*)\"`, 'm'))
  return match?.[1] || ''
}

function parseTomlArray(text, key) {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*\\[(.*?)\\]`, 'ms'))
  if (!match) return []
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1])
}

async function fetchJson(url, options = {}) {
  const started = Date.now()
  const timeoutMs = options.timeoutMs || 8000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        accept: 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
      cache: 'no-store',
    })
    const text = await response.text()
    let body = null
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text.slice(0, 500) }
    }
    return { ok: response.ok, status: response.status, ms: Date.now() - started, body }
  } finally {
    clearTimeout(timeout)
  }
}

function record(checks, name, ok, detail, extra = {}) {
  checks.push({
    name,
    status: ok ? 'ok' : 'fail',
    detail,
    ...extra,
  })
}

function hasCriticalClosureContext(text) {
  return /\b(effective(?:ly)? closed|closed to (?:most )?(?:commercial|international|foreign)?\s*shipping|shipping (?:is )?at a standstill|traffic (?:is )?at a standstill|standstill|blockade|blocked maritime traffic|traffic collapse|almost completely collapsed|chokehold|reopen(?:ing)? the strait|transit(?:s)? remained impossible|not to use .*strait of hormuz|vessels? .* unable to transit)\b/i.test(text)
}

function hasRoutePressureContext(text) {
  return /\b(advisory|avoid|not to use|rerout|re-rout|divert|disruption|delay|queue|congestion|draft restriction|water level|war[-\s]?risk|insurance|threat|naval activity|military activity|transit restriction)\b/i.test(text)
}

function criticalEvidenceByHotspot(maritimeData) {
  const articles = Array.isArray(maritimeData?.articles) ? maritimeData.articles : []
  return LIVE_HOTSPOTS.map((hotspot) => {
    const regionArticles = articles.filter((article) => article.region === hotspot)
    const sources = new Set(regionArticles.map((article) => article.source).filter(Boolean))
    const closureSources = new Set(regionArticles
      .filter((article) => hasCriticalClosureContext(`${article.title || ''} ${article.summary || ''}`))
      .map((article) => article.source)
      .filter(Boolean))
    const routePressureReports = regionArticles.filter((article) => hasRoutePressureContext(`${article.title || ''} ${article.summary || ''}`)).length
    const hotspotRow = (maritimeData?.hotspots || []).find((item) => item.hotspot === hotspot)
    const shouldBeCritical = closureSources.size >= 2 || (closureSources.size >= 1 && sources.size >= 3 && routePressureReports >= 2)
    return {
      hotspot,
      risk: hotspotRow?.riskLevel || 'missing',
      sources: sources.size,
      reports: regionArticles.length,
      closureSources: closureSources.size,
      routePressureReports,
      shouldBeCritical,
    }
  })
}

function sourceSweepBreadthByHotspot(maritimeData, hotspots) {
  const signals = Array.isArray(maritimeData?.signals) ? maritimeData.signals : []
  return hotspots.map((hotspot) => {
    const sweepSignals = signals.filter((signal) =>
      signal.region === hotspot &&
      (signal.signalType || signal.signal_type) === 'source_sweep'
    )
    const auditCounts = sweepSignals.map((signal) => {
      if (typeof signal.sourceAuditCount === 'number') return signal.sourceAuditCount
      if (typeof signal.source_audit_count === 'number') return signal.source_audit_count
      const metadata = signal.metadata && typeof signal.metadata === 'object' ? signal.metadata : {}
      if (Array.isArray(metadata.checkedSources)) return metadata.checkedSources.length
      return typeof metadata.checkedSourceCount === 'number' ? metadata.checkedSourceCount : 0
    })
    return {
      hotspot,
      sweepSignals: sweepSignals.length,
      sourceLayers: Math.max(0, ...auditCounts),
    }
  })
}

function isAggressiveCronSchedule(schedule) {
  const minute = String(schedule || '').trim().split(/\s+/)[0] || ''
  if (minute === '*') return true
  const every = minute.match(/^\*\/(\d+)$/)
  return every ? Number(every[1]) < 15 : false
}

function automationPath(id) {
  return path.join(AUTOMATIONS_DIR, id, 'automation.toml')
}

function checkAutomations(checks) {
  const operatorText = readText(automationPath('vesselsurge-accountable-operator-every-10-minutes'))
  const publisherText = readText(automationPath('vesselsurge-buffer-x-auto-publisher'))

  const operatorStatus = parseTomlString(operatorText, 'status')
  const operatorRrule = parseTomlString(operatorText, 'rrule')
  const operatorPrompt = parseTomlString(operatorText, 'prompt')
  record(
    checks,
    'operator_heartbeat',
    operatorStatus === 'ACTIVE' && /INTERVAL=(10|15)\b/.test(operatorRrule) && !/COUNT=/.test(operatorRrule) && !/3-hour/i.test(operatorPrompt),
    `status=${operatorStatus || 'missing'} rrule=${operatorRrule || 'missing'}`,
    { owner: 'Operator agent', fix: 'Update the Codex heartbeat to a non-expiring accountable operator loop.' },
  )

  const publisherStatus = parseTomlString(publisherText, 'status')
  const publisherRrule = parseTomlString(publisherText, 'rrule')
  const publisherCwds = parseTomlArray(publisherText, 'cwds')
  record(
    checks,
    'x_publisher_agent',
    publisherStatus === 'ACTIVE' && /INTERVAL=(1|15|30)\b/.test(publisherRrule) && publisherCwds.includes(ROOT),
    `status=${publisherStatus || 'missing'} rrule=${publisherRrule || 'missing'}`,
    { owner: 'Growth agent', fix: 'Keep the guarded X publisher active hourly or every 15-30 minutes with this repo as cwd.' },
  )
}

function checkRepoWiring(checks) {
  const packageJson = JSON.parse(readText(path.join(ROOT, 'package.json')) || '{}')
  const scripts = packageJson.scripts || {}
  record(checks, 'ops_agent_script', Boolean(scripts['ops:agents']), scripts['ops:agents'] || 'missing')
  record(checks, 'ops_smoke_script', Boolean(scripts['ops:smoke']), scripts['ops:smoke'] || 'missing')
  record(checks, 'maritime_update_script', Boolean(scripts['maritime:update'] && scripts['maritime:update:full']), 'maritime update scripts present')
  record(
    checks,
    'external_cron_scripts',
    Boolean(scripts['external:cron'] && scripts['external:cron:dry-run']),
    scripts['external:cron'] || 'missing',
    { owner: 'DevOps agent' },
  )
  record(
    checks,
    'x_guard_scripts',
    Boolean(scripts['x:check'] && scripts['x:post-new-direct'] && scripts['x:compose-new']),
    'X direct and browser fallback scripts present',
  )

  const agentText = readText(path.join(ROOT, '.agent.md'))
  record(
    checks,
    'openclaw_agent_context',
    fs.existsSync(OPENCLAW_DIR) && agentText.includes('/Users/vesselsurge/.openclaw/workspace') && !agentText.includes('/Users/cherif/.openclaw'),
    fs.existsSync(OPENCLAW_DIR) ? 'OpenClaw path present and documented' : 'OpenClaw path missing',
    { owner: 'OpenClaw assistant' },
  )

  const vercelConfig = JSON.parse(readText(path.join(ROOT, 'vercel.json')) || '{}')
  const crons = Array.isArray(vercelConfig.crons) ? vercelConfig.crons : []
  const aggressiveCrons = crons.filter((cron) => isAggressiveCronSchedule(cron.schedule))
  record(
    checks,
    'vercel_cron_cost_guard',
    aggressiveCrons.length === 0,
    aggressiveCrons.length
      ? aggressiveCrons.map((cron) => `${cron.path}:${cron.schedule}`).join(', ')
      : 'no aggressive Vercel crons',
    { owner: 'DevOps agent', fix: 'Keep high-frequency scheduling on GitHub Actions or Cloudflare Workers, not Vercel Cron.' },
  )

  const workflowText = readText(path.join(ROOT, '.github/workflows/vesselsurge-free-scheduler.yml'))
  const workerText = readText(path.join(ROOT, 'workers/vesselsurge-scheduler/worker.js'))
  record(
    checks,
    'external_scheduler_workflow',
    workflowText.includes('scripts/external-cron-runner.mjs') && workflowText.includes('*/15 * * * *'),
    workflowText ? 'GitHub external scheduler workflow present' : 'missing',
    { owner: 'DevOps agent', fix: 'Restore .github/workflows/vesselsurge-free-scheduler.yml.' },
  )
  record(
    checks,
    'external_scheduler_worker',
    workerText.includes('scheduled(event') && workerText.includes('CRON_SECRET') && workerText.includes('/api/cron/update?scope=news'),
    workerText ? 'Cloudflare scheduler worker present' : 'missing',
    { owner: 'DevOps agent', fix: 'Restore workers/vesselsurge-scheduler/worker.js.' },
  )

  try {
    const contract = JSON.parse(execFileSync('node', ['scripts/hotspot-contract.mjs', '--json'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
    record(
      checks,
      'hotspot_contract',
      contract.status === 'ok' && contract.expectedHotspots?.length === 9,
      `status=${contract.status} hotspots=${contract.expectedHotspots?.length || 0} failed=${contract.failed || 0}`,
      { owner: 'Data quality agent' },
    )
  } catch (error) {
    record(checks, 'hotspot_contract', false, error?.message || 'hotspot contract failed', { owner: 'Data quality agent' })
  }
}

async function checkProduction(checks) {
  const health = await fetchJson(`${SITE}/api/health?agent_check=${Date.now()}`, { timeoutMs: 8000 }).catch((error) => ({ ok: false, status: 0, ms: 0, body: { error: error.message } }))
  const components = health.body?.components || {}
  record(checks, 'production_health', health.ok && health.body?.status === 'ok', `status=${health.body?.status || health.status} ${health.ms}ms`)
  record(checks, 'supabase_auth', components.auth?.status === 'ok', components.auth?.note || components.auth?.status || 'missing', { owner: 'Auth/Supabase agent' })
  record(checks, 'dashboard_cache', components.cache?.status === 'ok' && components.database?.status === 'ok', `cache=${components.cache?.status || 'missing'} db=${components.database?.status || 'missing'}`, { owner: 'Supabase/cache agent' })
  record(checks, 'market_pro_health', components.marketPro?.status === 'ok', components.marketPro?.note || components.marketPro?.status || 'missing', { owner: 'Market Pro agent' })

  const maritime = await fetchJson(`${SITE}/api/maritime-data?refresh=1&agent_check=${Date.now()}`, { timeoutMs: 9000 }).catch((error) => ({ ok: false, status: 0, ms: 0, body: { error: error.message } }))
  const maritimeData = maritime.body?.data || maritime.body
  const gaps = maritimeData?.qualityAudit?.coverageGaps || []
  const watchGaps = gaps.filter((gap) => gap.status === 'watch').map((gap) => gap.hotspot)
  const goodNoFresh = gaps
    .filter((gap) => gap.status === 'good' && (gap.missing || []).includes('no fresh source-linked disruption report'))
    .map((gap) => gap.hotspot)
  const auditStatus = maritimeData?.qualityAudit?.status || 'missing'
  record(
    checks,
    'live_map_contract',
    maritime.ok &&
      maritimeData?.count?.hotspots === 9 &&
      (maritimeData?.count?.signals || 0) >= 9 &&
      (maritimeData?.count?.articles || 0) >= 1 &&
      auditStatus !== 'degraded' &&
      watchGaps.length === 0,
    `hotspots=${maritimeData?.count?.hotspots || 0} articles=${maritimeData?.count?.articles || 0} signals=${maritimeData?.count?.signals || 0} audit=${auditStatus}`,
    { owner: 'Live-map data agent', watchGaps, goodNoFresh },
  )
  const analysisRows = (maritimeData?.hotspots || []).map((hotspot) => ({
    hotspot: hotspot.hotspot,
    hasAnalysis: Boolean(
      hotspot.analysisBrief?.headline &&
      hotspot.analysisBrief?.impact &&
      hotspot.analysisBrief?.why &&
      hotspot.analysisBrief?.watch &&
      hotspot.analysisBrief?.sourceBasis,
    ),
    confidence: hotspot.analysisBrief?.confidence || 'missing',
  }))
  const missingAnalysis = analysisRows.filter((row) => !row.hasAnalysis).map((row) => row.hotspot)
  record(
    checks,
    'live_map_analysis_gate',
    maritime.ok && analysisRows.length === LIVE_HOTSPOTS.length && missingAnalysis.length === 0,
    `analysis=${analysisRows.filter((row) => row.hasAnalysis).length}/${LIVE_HOTSPOTS.length} missing=${missingAnalysis.join(', ') || 'none'}`,
    { owner: 'Data quality agent', missingAnalysis },
  )
  const sourceSweepBreadthRows = sourceSweepBreadthByHotspot(maritimeData, goodNoFresh)
  const thinSourceSweeps = sourceSweepBreadthRows.filter((row) => row.sweepSignals < 3 && row.sourceLayers < 3)
  record(
    checks,
    'source_sweep_breadth_gate',
    maritime.ok && thinSourceSweeps.length === 0,
    sourceSweepBreadthRows.length
      ? `sourceSweepBreadth=${sourceSweepBreadthRows.map((row) => `${row.hotspot}:${row.sweepSignals}/${row.sourceLayers}`).join(', ')}`
      : 'no source-sweep-only hotspots',
    { owner: 'Data quality agent', thinSourceSweeps },
  )
  const criticalEvidenceRows = criticalEvidenceByHotspot(maritimeData)
  const criticalEvidenceMismatches = criticalEvidenceRows.filter((row) => row.shouldBeCritical && row.risk !== 'critical')
  const criticalEvidenceActive = criticalEvidenceRows.filter((row) => row.shouldBeCritical).map((row) => `${row.hotspot}:${row.risk}`)
  record(
    checks,
    'critical_risk_evidence_gate',
    maritime.ok && criticalEvidenceMismatches.length === 0,
    criticalEvidenceActive.length
      ? `criticalEvidence=${criticalEvidenceActive.join(', ')}`
      : 'no current closure/blockade evidence requiring critical',
    { owner: 'Data quality agent', mismatches: criticalEvidenceMismatches },
  )

  const liveNews = await fetchJson(`${SITE}/api/live-news?source=direct&limit=80&agent_check=${Date.now()}`, { timeoutMs: 25000 }).catch((error) => ({ ok: false, status: 0, ms: 0, body: { error: error.message } }))
  const articles = Array.isArray(liveNews.body?.articles) ? liveNews.body.articles : []
  const stale = articles.filter((article) => {
    const timestamp = Date.parse(article.timestamp || '')
    return !Number.isFinite(timestamp) || Date.now() - timestamp > 48 * 60 * 60 * 1000
  })
  const noisy = articles.filter((article) => /spca|discoveryalert|op-ed|opinion|administrator/i.test(`${article.title || ''} ${article.source || ''}`))
  const regionCounts = Object.fromEntries(LIVE_HOTSPOTS.map((hotspot) => [
    hotspot,
    articles.filter((article) => article.region === hotspot).length,
  ]))
  const missingRegions = LIVE_HOTSPOTS.filter((hotspot) => (regionCounts[hotspot] || 0) < 4)
  const largestRegionCount = Math.max(0, ...Object.values(regionCounts))
  const largestRegionShare = articles.length ? largestRegionCount / articles.length : 0
  record(
    checks,
    'direct_news_gate',
    liveNews.ok &&
      articles.length > 0 &&
      stale.length === 0 &&
      noisy.length === 0 &&
      missingRegions.length === 0 &&
      largestRegionShare <= 0.55,
    `items=${articles.length} stale=${stale.length} noisy=${noisy.length} sourceSweep=${liveNews.body?.sourceSweepCount || 0} distribution=${Object.entries(regionCounts).map(([hotspot, count]) => `${hotspot}:${count}`).join(', ')}`,
    { owner: 'Data quality agent', missingRegions, largestRegionShare: Number(largestRegionShare.toFixed(2)) },
  )

  const maritimeStats = await fetchJson(`${SITE}/api/maritime-stats?hotspot=gibraltar&agent_check=${Date.now()}`, { timeoutMs: 7000 }).catch((error) => ({ ok: false, status: 0, ms: 0, body: { error: error.message } }))
  const maritimeIntelligence = await fetchJson(`${SITE}/api/maritime-intelligence?agent_check=${Date.now()}`, { timeoutMs: 7000 }).catch((error) => ({ ok: false, status: 0, ms: 0, body: { error: error.message } }))
  const statsText = JSON.stringify(maritimeStats.body || {})
  const intelligenceRows = Object.values(maritimeIntelligence.body?.data || {})
  const allIntelligenceRowsReviewed = intelligenceRows.length === 9 && intelligenceRows.every((row) => row?.dataStatus === 'reviewed_live_map_cache' || row?.dataStatus === 'reviewed_cache_stale')
  const hasGibraltarLandNoise = /airport|runway|road traffic|vehicles?|tunnel|border crossing/i.test(statsText)
  record(
    checks,
    'reviewed_stats_contract',
    maritimeStats.ok &&
      maritimeStats.body?.source === 'reviewed-live-map-cache' &&
      maritimeIntelligence.ok &&
      maritimeIntelligence.body?.source === 'reviewed-live-map-cache' &&
      allIntelligenceRowsReviewed &&
      !hasGibraltarLandNoise,
    `statsSource=${maritimeStats.body?.source || maritimeStats.status} intelligenceSource=${maritimeIntelligence.body?.source || maritimeIntelligence.status} rows=${intelligenceRows.length} noise=${hasGibraltarLandNoise ? 1 : 0}`,
    { owner: 'Data quality agent' },
  )
}

async function checkCronEndpoints(checks) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    record(checks, 'cron_secret_available', false, 'CRON_SECRET missing locally; run vercel env pull before full agent checks')
    return
  }

  record(checks, 'cron_secret_available', true, 'CRON_SECRET loaded locally')

  const market = await fetchJson(`${SITE}/api/cron/market-pro`, {
    timeoutMs: 9000,
    headers: { authorization: `Bearer ${cronSecret}` },
  }).catch((error) => ({ ok: false, status: 0, ms: 0, body: { error: error.message } }))
  record(
    checks,
    'market_pro_cron_endpoint',
    market.ok && (market.body?.success === true || market.body?.fallbackCache === true),
    `status=${market.status} action=${market.body?.action || 'none'} ${market.ms}ms`,
    { owner: 'Market Pro agent' },
  )

  const watch = await fetchJson(`${SITE}/api/cron/watch`, {
    timeoutMs: 9000,
    headers: { authorization: `Bearer ${cronSecret}` },
  }).catch((error) => ({ ok: false, status: 0, ms: 0, body: { error: error.message } }))
  record(
    checks,
    'watch_cron_endpoint',
    watch.ok && watch.body?.success === true,
    `status=${watch.status} action=${watch.body?.action || 'none'} reason=${watch.body?.reason || 'none'} ${watch.ms}ms`,
    { owner: 'OpenClaw/watch agent' },
  )
}

async function main() {
  loadLocalEnv()
  const checks = []
  checkAutomations(checks)
  checkRepoWiring(checks)
  await checkProduction(checks)
  await checkCronEndpoints(checks)

  const failed = checks.filter((check) => check.status !== 'ok')
  const liveMapCheck = checks.find((check) => check.name === 'live_map_contract')
  const goodNoFresh = liveMapCheck?.goodNoFresh || []
  const summary = {
    status: failed.length ? 'needs_attention' : 'ok',
    checkedAt: new Date().toISOString(),
    failed: failed.length,
    checks,
    nextAction: failed[0]?.fix || (failed[0]
      ? `Fix ${failed[0].name}`
      : goodNoFresh.length
        ? `Monitor ${goodNoFresh.join(', ')} source sweeps; replace them only when fresh source-linked disruption reports appear.`
        : 'Find the next measurable speed, data quality, SEO, or conversion improvement.'),
  }

  console.log(JSON.stringify(summary, null, 2))
  if (failed.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'failed',
    checkedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exitCode = 1
})
