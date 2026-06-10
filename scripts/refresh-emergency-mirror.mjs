#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const ROOT = process.cwd()
const DEFAULT_PORT = 4310
const DEFAULT_PUBLIC_DATA_URL = 'https://mrcheriftrading-debug.github.io/v0-vesselsurge/data.json'

function argValue(name, fallback = null) {
  const index = process.argv.indexOf(name)
  return index === -1 ? fallback : process.argv[index + 1] || fallback
}

function hasArg(name) {
  return process.argv.includes(name)
}

function run(command, args = [], options = {}) {
  const result = spawn(command, args, {
    cwd: options.cwd || ROOT,
    env: { ...process.env, ...(options.env || {}) },
    shell: false,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })

  if (!options.capture) {
    return new Promise((resolve, reject) => {
      result.on('error', reject)
      result.on('exit', (code) => {
        if (code === 0) resolve({ stdout: '', stderr: '' })
        else reject(new Error(`${command} ${args.join(' ')} exited ${code}`))
      })
    })
  }

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    result.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    result.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    result.on('error', reject)
    result.on('exit', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(`${command} ${args.join(' ')} exited ${code}\n${stderr || stdout}`))
    })
  })
}

async function runShell(script, options = {}) {
  return run('sh', ['-lc', script], options)
}

async function killPort(port) {
  await runShell(`lsof -ti tcp:${port} | xargs -r kill`, { capture: true }).catch(() => null)
}

async function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now()
  let lastError = null

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(2500) })
      if (response.ok || response.status < 500) return
      lastError = new Error(`server returned ${response.status}`)
    } catch (error) {
      lastError = error
    }
    await delay(400)
  }

  throw new Error(`Local server did not become ready at ${url}: ${lastError?.message || 'timeout'}`)
}

async function startLocalServer(port) {
  await killPort(port)
  const child = spawn('npm', ['run', 'start', '--', '-p', String(port)], {
    cwd: ROOT,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => process.stdout.write(chunk))
  child.stderr.on('data', (chunk) => process.stderr.write(chunk))
  child.on('exit', (code) => {
    if (code && !child.killed) {
      console.error(`[emergency-refresh] local server exited unexpectedly: ${code}`)
    }
  })

  await waitForServer(`http://127.0.0.1:${port}/`)
  return child
}

async function stopLocalServer(child, port) {
  if (child && !child.killed) {
    child.kill('SIGTERM')
    await delay(500)
  }
  await killPort(port)
}

function readEmergencySummary() {
  const dataPath = path.join(ROOT, 'emergency-pages', 'data.json')
  const row = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  const data = row.payload?.data || row.data || row
  const articles = Array.isArray(data.articles) ? data.articles : []
  const hotspots = Array.isArray(data.hotspots) ? data.hotspots : []
  const signals = Array.isArray(data.signals) ? data.signals : []
  const regions = [...new Set(articles.map((article) => article.region).filter(Boolean))]

  return {
    generatedAt: row.generatedAt || row.generated_at || data.timestamp || null,
    cacheSource: row.cacheSource || row.cache_source || 'unknown',
    articles: articles.length,
    hotspots: hotspots.length,
    signals: signals.length,
    regions,
    firstArticle: articles[0]?.title || null,
  }
}

async function publishPages() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vesselsurge-gh-pages-worktree.'))
  let committed = false
  let commit = null

  try {
    await run('git', ['worktree', 'add', tmpDir, 'gh-pages'], { capture: true })
    fs.cpSync(path.join(ROOT, 'emergency-pages'), tmpDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'published-at.txt'), `${new Date().toISOString()}\n`)
    await run('git', ['add', '.'], { cwd: tmpDir, capture: true })

    const diff = await run('git', ['diff', '--cached', '--quiet'], { cwd: tmpDir, capture: true })
      .then(() => false)
      .catch(() => true)

    if (diff) {
      await run('git', ['commit', '-m', 'Refresh VesselSurge emergency mirror'], { cwd: tmpDir })
      commit = (await run('git', ['rev-parse', '--short', 'HEAD'], { cwd: tmpDir, capture: true })).stdout.trim()
      await run('git', ['push', 'origin', 'gh-pages'], { cwd: tmpDir })
      committed = true
    }

    return { committed, commit }
  } finally {
    await run('git', ['worktree', 'remove', tmpDir, '--force'], { capture: true }).catch(() => null)
  }
}

async function verifyPublicData(publicDataUrl) {
  const url = `${publicDataUrl}${publicDataUrl.includes('?') ? '&' : '?'}verify=${Date.now()}`
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Emergency mirror returned ${response.status}`)
  const row = await response.json()
  const data = row.payload?.data || row.data || row
  return {
    generatedAt: row.generatedAt || row.generated_at || data.timestamp || null,
    articles: Array.isArray(data.articles) ? data.articles.length : 0,
    hotspots: Array.isArray(data.hotspots) ? data.hotspots.length : 0,
    signals: Array.isArray(data.signals) ? data.signals.length : 0,
  }
}

async function main() {
  const port = Number(argValue('--port', DEFAULT_PORT))
  const mode = argValue('--mode', 'news')
  const skipRefresh = hasArg('--skip-refresh')
  const skipPublish = hasArg('--skip-publish')
  const skipPublicVerify = hasArg('--skip-public-verify')
  const publicDataUrl = argValue('--public-data-url', DEFAULT_PUBLIC_DATA_URL)
  const baseUrl = `http://127.0.0.1:${port}`
  let server = null

  console.log(JSON.stringify({
    task: 'vesselsurge-emergency-refresh',
    mode,
    port,
    skipRefresh,
    skipPublish,
    skipPublicVerify,
  }, null, 2))

  try {
    if (!skipRefresh) {
      server = await startLocalServer(port)
      await run('node', ['scripts/external-cron-runner.mjs', mode], {
        env: { VESSELSURGE_CRON_BASE_URL: baseUrl },
      })
    }

    await run('node', ['scripts/generate-emergency-pages.mjs'])
    const localSummary = readEmergencySummary()
    let publish = { committed: false, commit: null }
    let publicSummary = null

    if (!skipPublish) {
      publish = await publishPages()
      if (!skipPublicVerify) {
        publicSummary = await verifyPublicData(publicDataUrl)
          .then((summary) => ({
            ...summary,
            matchesLocal: summary.generatedAt === localSummary.generatedAt,
            warning: summary.generatedAt === localSummary.generatedAt
              ? null
              : 'Public GitHub Pages CDN has not caught up to the pushed gh-pages commit yet.',
          }))
          .catch((error) => ({
            warning: error instanceof Error ? error.message : String(error),
          }))
      }
    }

    console.log(JSON.stringify({
      status: 'ok',
      localSummary,
      publish,
      publicSummary,
    }, null, 2))
  } finally {
    await stopLocalServer(server, port)
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    status: 'fail',
    error: error instanceof Error ? error.message : String(error),
  }, null, 2))
  process.exit(1)
})
