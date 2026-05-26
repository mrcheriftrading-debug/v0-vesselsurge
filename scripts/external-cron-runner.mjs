#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DEFAULT_BASE_URL = 'https://www.vesselsurge.com'

function readLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        if (separator === -1) return [line, '']
        const key = line.slice(0, separator).trim()
        const rawValue = line.slice(separator + 1).trim()
        const value = rawValue.replace(/^['"]|['"]$/g, '')
        return [key, value]
      }),
  )
}

function normaliseBaseUrl(value) {
  return (value || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function pickMode(args) {
  return args.find((arg) => !arg.startsWith('--')) || process.env.VESSELSURGE_CRON_MODE || 'news'
}

function endpointPlan(baseUrl, mode) {
  const plans = {
    news: [
      { name: 'news-refresh', url: `${baseUrl}/api/cron/update?scope=news`, timeoutMs: 55000 },
    ],
    market: [
      { name: 'market-pro-refresh', url: `${baseUrl}/api/cron/market-pro`, timeoutMs: 55000 },
    ],
    hourly: [
      { name: 'news-refresh', url: `${baseUrl}/api/cron/update?scope=news`, timeoutMs: 55000 },
      { name: 'market-pro-refresh', url: `${baseUrl}/api/cron/market-pro`, timeoutMs: 55000 },
    ],
    full: [
      { name: 'full-maritime-refresh', url: `${baseUrl}/api/cron/update`, timeoutMs: 70000 },
    ],
    all: [
      { name: 'market-pro-refresh', url: `${baseUrl}/api/cron/market-pro`, timeoutMs: 55000 },
      { name: 'full-maritime-refresh', url: `${baseUrl}/api/cron/update`, timeoutMs: 70000 },
    ],
  }

  return plans[mode] || plans.news
}

async function fetchWithTimeout(task, cronSecret) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), task.timeoutMs)
  const started = Date.now()

  try {
    const response = await fetch(task.url, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${cronSecret}`,
        accept: 'application/json',
        'user-agent': 'vesselsurge-external-scheduler/1.0',
      },
      signal: controller.signal,
      cache: 'no-store',
    })

    const text = await response.text()
    let body
    try {
      body = JSON.parse(text)
    } catch {
      body = { raw: text.slice(0, 1200) }
    }

    return {
      name: task.name,
      ok: response.ok && body?.success !== false,
      status: response.status,
      ms: Date.now() - started,
      body,
    }
  } finally {
    clearTimeout(timeout)
  }
}

const localEnv = readLocalEnv(path.join(ROOT, '.env.local'))
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const mode = pickMode(args)
const baseUrl = normaliseBaseUrl(
  process.env.VESSELSURGE_CRON_BASE_URL ||
    localEnv.VESSELSURGE_CRON_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    localEnv.NEXT_PUBLIC_SITE_URL,
)
const cronSecret = process.env.CRON_SECRET || localEnv.CRON_SECRET
const tasks = endpointPlan(baseUrl, mode)

console.log(JSON.stringify({
  scheduler: 'vesselsurge-external-cron',
  mode,
  dryRun,
  baseUrl,
  tasks: tasks.map((task) => ({ name: task.name, url: task.url, timeoutMs: task.timeoutMs })),
}, null, 2))

if (dryRun) process.exit(0)

if (!cronSecret) {
  console.error('[external-cron] Missing CRON_SECRET. Set CRON_SECRET in the runner environment or .env.local.')
  process.exit(1)
}

const results = []
for (const task of tasks) {
  try {
    results.push(await fetchWithTimeout(task, cronSecret))
  } catch (error) {
    results.push({
      name: task.name,
      ok: false,
      status: 0,
      ms: 0,
      body: { error: error instanceof Error ? error.message : String(error) },
    })
  }
}

const failed = results.filter((result) => !result.ok)
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2))

if (failed.length) process.exit(1)
