#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DEFAULT_OUT_DIR = path.join(ROOT, 'emergency-pages')
const REDIS_CACHE_KEY = 'vesselsurge:maritime-dashboard-cache:live-map'
const HOTSPOT_NAMES = {
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
const RISK_ORDER = { critical: 4, high: 3, medium: 2, low: 1 }

function readLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        return [
          line.slice(0, index).trim(),
          line.slice(index + 1).trim().replace(/^['"]|['"]$/g, ''),
        ]
      }),
  )
}

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? null : process.argv[index + 1] || null
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatTime(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'time unavailable'
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function riskClass(riskLevel) {
  const risk = String(riskLevel || 'low').toLowerCase()
  if (risk === 'critical') return 'risk-critical'
  if (risk === 'high') return 'risk-high'
  if (risk === 'medium') return 'risk-medium'
  return 'risk-low'
}

function sortHotspots(hotspots) {
  return [...hotspots].sort((a, b) => {
    const rankDiff = (RISK_ORDER[String(b.riskLevel || '').toLowerCase()] || 0) - (RISK_ORDER[String(a.riskLevel || '').toLowerCase()] || 0)
    if (rankDiff) return rankDiff
    return String(a.hotspot || '').localeCompare(String(b.hotspot || ''))
  })
}

async function fetchDashboardCache() {
  const localEnv = readLocalEnv(path.join(ROOT, '.env.local'))
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SECRET_KEY
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || localEnv.KV_REST_API_URL || localEnv.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || localEnv.KV_REST_API_TOKEN || localEnv.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    const redisResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${redisToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(['GET', REDIS_CACHE_KEY]),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null)

    if (redisResponse?.ok) {
      const body = await redisResponse.json().catch(() => null)
      const cached = body?.result
      const row = typeof cached === 'string' ? JSON.parse(cached) : cached
      if (row?.payload?.data && row?.generated_at) return { ...row, cache_source: 'redis-kv' }
    }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/maritime_dashboard_cache?cache_key=eq.live-map&select=payload,generated_at&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    },
  )

  if (!response.ok) {
    throw new Error(`Supabase dashboard cache returned ${response.status}`)
  }

  const rows = await response.json()
  const row = Array.isArray(rows) ? rows[0] : null
  if (!row?.payload?.data) throw new Error('Supabase dashboard cache is empty')
  return { ...row, cache_source: 'supabase-rest' }
}

function renderHotspotCard(hotspot, articles, signals) {
  const id = hotspot.hotspot || hotspot.id
  const relatedArticles = articles.filter((article) => article.region === id).slice(0, 4)
  const relatedSignals = signals.filter((signal) => signal.region === id).slice(0, 3)
  const sources = unique(relatedArticles.map((article) => article.source))
  const analysis = hotspot.analysisBrief || {}

  return `
    <article class="hotspot-card">
      <div class="hotspot-head">
        <div>
          <p class="eyebrow">${escapeHtml(id || 'hotspot')}</p>
          <h2>${escapeHtml(hotspot.name || HOTSPOT_NAMES[id] || id)}</h2>
        </div>
        <span class="risk ${riskClass(hotspot.riskLevel)}">${escapeHtml(String(hotspot.riskLevel || 'low').toUpperCase())}</span>
      </div>
      <div class="metrics">
        <span>${Number(hotspot.verifiedReports || 0)} reports</span>
        <span>${Number(hotspot.sourceCount || sources.length || 0)} sources</span>
        <span>${Number(hotspot.signalCount || relatedSignals.length || 0)} signals</span>
        <span>${escapeHtml(hotspot.confidenceLabel || 'confidence reviewed')}</span>
      </div>
      ${analysis.headline ? `<p class="analysis-headline">${escapeHtml(analysis.headline)}</p>` : ''}
      ${analysis.why ? `<p>${escapeHtml(analysis.why)}</p>` : hotspot.riskSummary ? `<p>${escapeHtml(hotspot.riskSummary)}</p>` : ''}
      ${analysis.impact ? `<p class="muted">${escapeHtml(analysis.impact)}</p>` : ''}
      ${relatedArticles.length ? `
        <div class="list-block">
          <h3>Current source trail</h3>
          ${relatedArticles.map((article) => `
            <a class="source-row" href="${escapeHtml(article.sourceUrl || '#')}" rel="noopener noreferrer" target="_blank">
              <span>${escapeHtml(article.title)}</span>
              <small>${escapeHtml(article.source)} · ${formatTime(article.timestamp)}</small>
            </a>
          `).join('')}
        </div>
      ` : '<p class="muted">No current article trail in the cache for this hotspot.</p>'}
    </article>
  `
}

function renderArticle(article) {
  return `
    <a class="news-row" href="${escapeHtml(article.sourceUrl || '#')}" rel="noopener noreferrer" target="_blank">
      <span class="region">${escapeHtml(HOTSPOT_NAMES[article.region] || article.region || 'global')}</span>
      <strong>${escapeHtml(article.title)}</strong>
      <small>${escapeHtml(article.source || 'source unavailable')} · ${formatTime(article.timestamp)}</small>
    </a>
  `
}

function renderHtml(row) {
  const payload = row.payload
  const data = payload.data
  const articles = Array.isArray(data.articles) ? data.articles : []
  const hotspots = sortHotspots(Array.isArray(data.hotspots) ? data.hotspots : [])
  const signals = Array.isArray(data.signals) ? data.signals : []
  const generatedAt = payload.meta?.generatedAt || data.timestamp || row.generated_at
  const buildTime = new Date().toISOString()
  const sources = unique(articles.map((article) => article.source))
  const topRisk = hotspots[0]?.riskLevel || 'low'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VesselSurge Emergency Maritime Cache</title>
  <meta name="description" content="Read-only VesselSurge maritime intelligence mirror generated from the Supabase live-map cache while the primary Vercel deployment is unavailable." />
  <meta name="robots" content="noindex, follow" />
  <link rel="icon" href="./favicon.ico" />
  <style>
    :root {
      color-scheme: dark;
      --bg: #07111f;
      --panel: #0d1a2d;
      --panel-soft: #101f35;
      --line: rgba(148, 163, 184, .22);
      --text: #edf5ff;
      --muted: #93a4bb;
      --green: #22c55e;
      --amber: #facc15;
      --orange: #fb923c;
      --red: #ef4444;
      --cyan: #38bdf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top left, rgba(56, 189, 248, .14), transparent 32rem), var(--bg);
      color: var(--text);
      font: 15px/1.55 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    a { color: inherit; text-decoration: none; }
    .shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
    header { padding: 28px 0 18px; border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand img { width: 44px; height: 44px; border-radius: 8px; background: #0b1728; }
    .brand strong { font-size: 22px; letter-spacing: 0; }
    .hero { padding: 34px 0 28px; display: grid; grid-template-columns: 1.35fr .65fr; gap: 28px; align-items: end; }
    h1 { font-size: clamp(32px, 5vw, 64px); line-height: 1; margin: 0 0 18px; letter-spacing: 0; }
    h2 { margin: 0; font-size: 20px; letter-spacing: 0; }
    h3 { margin: 0 0 10px; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
    p { color: #c8d3e3; margin: 0 0 14px; }
    .notice {
      border: 1px solid rgba(250, 204, 21, .3);
      background: rgba(250, 204, 21, .08);
      padding: 14px 16px;
      border-radius: 8px;
      color: #fde68a;
      margin-top: 18px;
    }
    .status-panel {
      background: rgba(13, 26, 45, .88);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
    }
    .stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
    .stat { background: var(--panel-soft); border: 1px solid var(--line); border-radius: 8px; padding: 13px; }
    .stat strong { display: block; font-size: 24px; line-height: 1; }
    .stat small, small, .muted { color: var(--muted); }
    .toolbar { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 20px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
    .button { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--line); background: #13233a; color: var(--text); font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; padding: 24px 0; }
    .hotspot-card, .news-panel {
      background: rgba(13, 26, 45, .92);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
      min-width: 0;
    }
    .hotspot-head { display: flex; align-items: start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
    .eyebrow { margin: 0 0 3px; font-size: 12px; color: var(--cyan); text-transform: uppercase; letter-spacing: .08em; }
    .risk { flex: 0 0 auto; padding: 7px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; border: 1px solid currentColor; }
    .risk-critical, .risk-high { color: var(--red); background: rgba(239, 68, 68, .11); }
    .risk-medium { color: var(--amber); background: rgba(250, 204, 21, .1); }
    .risk-low { color: var(--green); background: rgba(34, 197, 94, .1); }
    .metrics { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
    .metrics span { border: 1px solid var(--line); border-radius: 999px; padding: 5px 8px; color: #dbeafe; font-size: 12px; }
    .analysis-headline { color: var(--text); font-weight: 800; font-size: 16px; }
    .list-block { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line); }
    .source-row, .news-row { display: grid; gap: 4px; padding: 10px 0; border-top: 1px solid rgba(148, 163, 184, .14); }
    .source-row:first-of-type, .news-row:first-of-type { border-top: 0; }
    .source-row span, .news-row strong { color: #f8fbff; }
    .news-section { display: grid; grid-template-columns: 1fr; gap: 16px; padding: 0 0 34px; }
    .region { color: var(--cyan); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
    footer { padding: 28px 0 42px; border-top: 1px solid var(--line); color: var(--muted); }
    @media (max-width: 820px) {
      .hero, .grid { grid-template-columns: 1fr; }
      .toolbar { align-items: stretch; flex-direction: column; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <header>
    <div class="shell brand">
      <img src="./logo.png" alt="VesselSurge" />
      <strong>VesselSurge</strong>
    </div>
  </header>
  <main class="shell">
    <section class="hero">
      <div>
        <p class="eyebrow">Emergency read-only mirror</p>
        <h1>Maritime intelligence cache remains available.</h1>
        <p>This mirror is generated directly from the VesselSurge Supabase live-map cache while the primary Vercel deployment is unavailable. It preserves source links, hotspot risk labels and analysis text from the last available cache.</p>
        <div class="notice">Primary app status: Vercel deployment disabled. This page is a continuity surface, not a replacement for the interactive logged-in product.</div>
      </div>
      <aside class="status-panel">
        <h3>Cache Status</h3>
        <p>Top current risk: <strong>${escapeHtml(String(topRisk).toUpperCase())}</strong></p>
        <p>Cache generated: <strong>${formatTime(generatedAt)}</strong></p>
        <p>Mirror built: <strong>${formatTime(buildTime)}</strong></p>
        <div class="stats">
          <div class="stat"><strong>${Number(data.count?.hotspots || hotspots.length)}</strong><small>hotspots</small></div>
          <div class="stat"><strong>${Number(data.count?.articles || articles.length)}</strong><small>articles</small></div>
          <div class="stat"><strong>${Number(data.count?.signals || signals.length)}</strong><small>signals</small></div>
          <div class="stat"><strong>${sources.length}</strong><small>sources</small></div>
        </div>
      </aside>
    </section>
    <section class="toolbar">
      <div>
        <strong>Read-only operational view</strong>
        <p class="muted">Use original source links for verification before operational or commercial decisions.</p>
      </div>
      <a class="button" href="https://www.vesselsurge.com">Try primary app</a>
    </section>
    <section class="grid">
      ${hotspots.map((hotspot) => renderHotspotCard(hotspot, articles, signals)).join('')}
    </section>
    <section class="news-section">
      <div class="news-panel">
        <h2>Latest cached source trail</h2>
        ${articles.slice(0, 30).map(renderArticle).join('') || '<p class="muted">No articles available in current cache.</p>'}
      </div>
    </section>
  </main>
  <footer>
    <div class="shell">VesselSurge emergency cache. No investment advice. No invented maritime events. Verify sources before acting.</div>
  </footer>
</body>
</html>`
}

function writeAssets(outDir, row) {
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'index.html'), renderHtml(row))
  fs.writeFileSync(path.join(outDir, '404.html'), renderHtml(row))
  fs.writeFileSync(path.join(outDir, 'data.json'), JSON.stringify({
    generatedAt: row.generated_at,
    cacheSource: row.cache_source || 'unknown',
    payload: row.payload,
  }, null, 2))

  for (const asset of ['logo.png', 'favicon.ico', 'og-image.jpg']) {
    const source = path.join(ROOT, 'public', asset)
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outDir, asset))
  }
}

const outDir = path.resolve(argValue('--out') || process.env.EMERGENCY_PAGES_OUT_DIR || DEFAULT_OUT_DIR)
const row = await fetchDashboardCache()
writeAssets(outDir, row)
console.log(JSON.stringify({
  status: 'ok',
  outDir,
  generatedAt: row.generated_at,
  cacheSource: row.cache_source || 'unknown',
  count: row.payload?.data?.count || null,
}, null, 2))
