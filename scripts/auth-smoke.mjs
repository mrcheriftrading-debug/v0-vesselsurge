#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const BASE_URL = (process.env.VESSELSURGE_AUTH_SMOKE_URL || 'https://www.vesselsurge.com').replace(/\/$/, '')
const CHROME_CANDIDATES = [
  process.env.VESSELSURGE_CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const IGNORED_BROWSER_LOG = /favicon|preload|apple-mobile-web-app-capable|third-party cookie|privacy sandbox|_vercel\/(speed-)?insights\/script\.js|MIME type \('text\/html'\)/i
const SIGNUP_SETTLE_MS = 18000
const LOGIN_SETTLE_MS = 14000

function loadLocalEnv(file = '.env.local') {
  if (!existsSync(file)) return

  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[match[1]] ||= value
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function findChrome() {
  const found = CHROME_CANDIDATES.find((candidate) => candidate && existsSync(candidate))
  if (found) return found
  return process.env.VESSELSURGE_CHROME_PATH || null
}

async function waitForPageTarget(port) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      const targets = await response.json()
      const page = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl)
      if (page) return page.webSocketDebuggerUrl
    } catch {
      // Chrome is still booting.
    }

    await sleep(250)
  }

  throw new Error('Chrome DevTools Protocol page target did not start')
}

function createCdpClient(wsUrl) {
  const socket = new WebSocket(wsUrl)
  let commandId = 0
  const pending = new Map()
  const events = []

  socket.on('message', (data) => {
    const message = JSON.parse(data.toString())
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(JSON.stringify(message.error)))
      else resolve(message.result)
      return
    }

    if (message.method === 'Runtime.exceptionThrown') {
      events.push({
        type: 'exception',
        text: message.params?.exceptionDetails?.exception?.description || message.params?.exceptionDetails?.text || 'runtime exception',
      })
    }

    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'assert'].includes(message.params?.type)) {
      const text = (message.params.args || []).map((arg) => arg.value || arg.description || '').join(' ')
      if (!IGNORED_BROWSER_LOG.test(text)) events.push({ type: 'console', text })
    }

    if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params?.entry?.level)) {
      const text = message.params.entry.text || ''
      const url = message.params.entry.url || ''
      if (!IGNORED_BROWSER_LOG.test(text) && !IGNORED_BROWSER_LOG.test(url)) {
        events.push({ type: 'log', text, url })
      }
    }
  })

  const opened = new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++commandId
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }

  return {
    events,
    opened,
    send,
    close: () => socket.close(),
  }
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed')
  }

  return result.result.value
}

async function navigate(client, route) {
  client.events.length = 0
  await client.send('Page.navigate', { url: `${BASE_URL}${route}` })
  await sleep(5000)
  return getPageState(client)
}

function assertNoBrowserErrors(client, step) {
  const events = client.events.filter((event) => !IGNORED_BROWSER_LOG.test(event.text || event.url || ''))
  if (events.length > 0) {
    throw new Error(`${step} browser errors: ${JSON.stringify(events)}`)
  }
}

async function getPageState(client) {
  return evaluate(client, `(() => ({
    href: location.href,
    path: location.pathname,
    title: document.title,
    body: document.body.innerText.slice(0, 1200)
  }))()`)
}

async function fillInput(client, selector, value) {
  await evaluate(client, `(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) throw new Error('Missing input ${selector}');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
}

async function click(client, selector) {
  await evaluate(client, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) throw new Error('Missing clickable ${selector}');
    element.click();
    return true;
  })()`)
}

function createSupabaseAdmin() {
  loadLocalEnv()
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !anonKey || !adminKey) {
    throw new Error('Auth smoke requires local Supabase URL, anon key and admin key so the temporary user can be deleted.')
  }

  return {
    userClient: createSupabaseClient(supabaseUrl, anonKey),
    adminClient: createSupabaseClient(supabaseUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  }
}

async function deleteSmokeUser(email, password) {
  loadLocalEnv()
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/smoke-cleanup`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${cronSecret}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) return true
      console.warn('[auth-smoke] App cleanup endpoint skipped:', response.status, (await response.text()).slice(0, 240))
    } catch (error) {
      console.warn('[auth-smoke] App cleanup endpoint failed:', error instanceof Error ? error.message : String(error))
    }
  }

  const { userClient, adminClient } = createSupabaseAdmin()
  const { data, error } = await userClient.auth.signInWithPassword({ email, password })
  if (error || !data.user) return false

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(data.user.id)
  if (deleteError) throw deleteError
  return true
}

async function main() {
  createSupabaseAdmin()

  const chrome = findChrome()
  if (!chrome) {
    throw new Error('Chrome executable not found. Set VESSELSURGE_CHROME_PATH to run auth smoke checks.')
  }

  const stamp = Date.now()
  const reuseSmokeUser = process.env.VESSELSURGE_AUTH_SMOKE_REUSE !== '0'
  const email = process.env.VESSELSURGE_AUTH_SMOKE_EMAIL || (reuseSmokeUser ? 'codex-auth-smoke@example.com' : `codex-auth-smoke-${stamp}@example.com`)
  const password = process.env.VESSELSURGE_AUTH_SMOKE_PASSWORD || (reuseSmokeUser ? 'VesselSurgeSmoke2026!' : `Smoke${stamp}!`)
  const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'vesselsurge-auth-smoke-'))
  const port = 9600 + Math.floor(Math.random() * 3000)
  const chromeProcess = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: 'ignore' })

  let createdUser = false

  try {
    const wsUrl = await waitForPageTarget(port)
    const client = createCdpClient(wsUrl)
    await client.opened
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Log.enable')

    let state = await navigate(client, '/auth/sign-up?next=/dashboard')
    if (!state.body.includes('Create Your Account')) throw new Error('Sign-up page did not render')

    await fillInput(client, '#companyName', 'Codex Smoke Test')
    await fillInput(client, '#email', email)
    await fillInput(client, '#password', password)
    await click(client, 'form button[type="submit"]')
    await sleep(SIGNUP_SETTLE_MS)
    state = await getPageState(client)
    if (state.path !== '/dashboard' || !state.body.includes('Welcome, Codex Smoke Test')) {
      if (reuseSmokeUser && state.body.includes('An account already exists')) {
        await navigate(client, '/auth/login?next=/dashboard')
        await fillInput(client, '#email', email)
        await fillInput(client, '#password', password)
        await click(client, 'form button[type="submit"]')
        await sleep(LOGIN_SETTLE_MS)
        state = await getPageState(client)
      } else {
        throw new Error(`Sign-up did not reach dashboard: ${state.href}`)
      }
    } else {
      createdUser = !reuseSmokeUser
    }

    if (state.path !== '/dashboard' || !state.body.includes('Welcome, Codex Smoke Test')) {
      throw new Error(`Reusable smoke login did not reach dashboard: ${state.href}`)
    }
    assertNoBrowserErrors(client, 'sign-up')

    await click(client, 'form[action="/auth/sign-out"] button')
    await sleep(4000)
    state = await getPageState(client)
    if (state.path !== '/auth/login' || !state.body.includes('Welcome Back')) {
      throw new Error(`Sign-out did not reach login: ${state.href}`)
    }

    await navigate(client, '/auth/login?next=/dashboard')
    await fillInput(client, '#email', email)
    await fillInput(client, '#password', password)
    await click(client, 'form button[type="submit"]')
    await sleep(LOGIN_SETTLE_MS)
    state = await getPageState(client)
    if (state.path !== '/dashboard' || !state.body.includes('Welcome, Codex Smoke Test')) {
      throw new Error(`Login did not reach dashboard: ${state.href}`)
    }
    assertNoBrowserErrors(client, 'login')

    client.close()
    console.log(JSON.stringify({ ok: true, baseUrl: BASE_URL, steps: ['sign-up', 'sign-out', 'login'] }, null, 2))
  } finally {
    chromeProcess.kill('SIGTERM')
    await sleep(750)
    rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 150 })

    if (createdUser) {
      const deleted = await deleteSmokeUser(email, password)
      if (!deleted) throw new Error('Auth smoke user was created but could not be deleted.')
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
