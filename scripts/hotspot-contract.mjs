import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const EXPECTED_HOTSPOTS = ['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape']

function readText(file) {
  try {
    return fs.readFileSync(path.join(ROOT, file), 'utf8')
  } catch {
    return ''
  }
}

function uniqueMatches(text, pattern) {
  return [...new Set([...text.matchAll(pattern)].map((match) => match[1]))]
}

function missingFrom(values) {
  return EXPECTED_HOTSPOTS.filter((hotspot) => !values.includes(hotspot))
}

function record(checks, name, ok, detail, extra = {}) {
  checks.push({ name, status: ok ? 'ok' : 'fail', detail, ...extra })
}

function checkRegexList(checks, name, file, pattern, detail) {
  const text = readText(file)
  const values = uniqueMatches(text, pattern)
  const missing = missingFrom(values)
  record(checks, name, missing.length === 0, `${detail}: ${EXPECTED_HOTSPOTS.length - missing.length}/${EXPECTED_HOTSPOTS.length}`, { file, missing, found: values })
}

function checkLiteralContract(checks, name, file, detail) {
  const text = readText(file)
  const missing = EXPECTED_HOTSPOTS.filter((hotspot) => !text.includes(hotspot))
  record(checks, name, missing.length === 0, `${detail}: ${EXPECTED_HOTSPOTS.length - missing.length}/${EXPECTED_HOTSPOTS.length}`, { file, missing })
}

function isAggressiveCronSchedule(schedule) {
  const minute = String(schedule || '').trim().split(/\s+/)[0] || ''
  if (minute === '*') return true
  const every = minute.match(/^\*\/(\d+)$/)
  return every ? Number(every[1]) < 15 : false
}

function checkSchedulerContract(checks) {
  const text = readText('vercel.json')
  try {
    const config = JSON.parse(text)
    const crons = Array.isArray(config.crons) ? config.crons : []
    const aggressive = crons.filter((cron) => isAggressiveCronSchedule(cron.schedule))
    record(
      checks,
      'vercel_cron_cost_guard',
      aggressive.length === 0,
      aggressive.length ? `aggressive=${aggressive.map((cron) => `${cron.path}:${cron.schedule}`).join(', ')}` : 'no aggressive Vercel crons',
      { file: 'vercel.json' },
    )
  } catch (error) {
    record(checks, 'vercel_cron_cost_guard', false, `invalid vercel.json: ${error.message}`, { file: 'vercel.json' })
  }

  const workflow = readText('.github/workflows/vesselsurge-free-scheduler.yml')
  const runner = readText('scripts/external-cron-runner.mjs')
  const worker = readText('workers/vesselsurge-scheduler/worker.js')
  record(
    checks,
    'external_scheduler_contract',
    workflow.includes('scripts/external-cron-runner.mjs') &&
      workflow.includes('*/15 * * * *') &&
      runner.includes('/api/cron/update?scope=news') &&
      worker.includes('scheduled(event') &&
      worker.includes('CRON_SECRET'),
    'GitHub Actions runner and Cloudflare Worker scheduler present',
    { file: '.github/workflows/vesselsurge-free-scheduler.yml' },
  )
}

const checks = []

checkRegexList(checks, 'cron_update_live_regions', 'app/api/cron/update/route.ts', /'([^']+)'/g, 'update route hotspot ids')
checkRegexList(checks, 'live_news_regions', 'app/api/live-news/route.ts', /'([^']+)'/g, 'live-news hotspot ids')
checkRegexList(checks, 'maritime_data_regions', 'app/api/maritime-data/route.ts', /'([^']+)'/g, 'maritime-data hotspot ids')
checkRegexList(checks, 'dashboard_cache_regions', 'lib/maritime-dashboard-cache.ts', /'([^']+)'/g, 'dashboard cache hotspot ids')
checkRegexList(checks, 'health_regions', 'app/api/health/route.ts', /'([^']+)'/g, 'health hotspot ids')
checkRegexList(checks, 'marine_condition_points', 'lib/marine-conditions.ts', /id:\s*'([^']+)'/g, 'marine condition points')
checkRegexList(checks, 'search_feed_regions', 'lib/maritime-search-feeds.ts', /region:\s*'([^']+)'/g, 'news search feed regions')
checkRegexList(checks, 'official_watch_regions', 'lib/maritime-official-watch-sources.ts', /regionHint:\s*'([^']+)'/g, 'official watch source regions')
checkLiteralContract(checks, 'supabase_region_constraints', 'scripts/009_expand_maritime_regions.sql', 'expanded Supabase constraints')
checkLiteralContract(checks, 'supabase_signal_schema', 'scripts/006_create_maritime_signals.sql', 'maritime signal schema constraints')
checkLiteralContract(checks, 'supabase_hotspot_defaults', 'scripts/010_hotspot_contract_defaults.sql', 'Supabase hotspot defaults and constraints')
checkLiteralContract(checks, 'openclaw_agent_contract', '.agent.md', 'OpenClaw agent hotspot contract')
checkSchedulerContract(checks)

const failed = checks.filter((check) => check.status !== 'ok')
const summary = {
  status: failed.length ? 'needs_attention' : 'ok',
  failed: failed.length,
  expectedHotspots: EXPECTED_HOTSPOTS,
  checks,
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.table(checks.map(({ name, status, detail }) => ({ name, status, detail })))
  if (failed.length) {
    console.error(JSON.stringify({ failed: failed.map(({ name, file, missing }) => ({ name, file, missing })) }, null, 2))
  }
}

if (failed.length) process.exitCode = 1
