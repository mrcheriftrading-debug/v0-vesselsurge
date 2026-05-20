#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import WebSocket from 'ws'

const BASE_URL = (process.env.VESSELSURGE_BROWSER_SMOKE_URL || 'https://www.vesselsurge.com').replace(/\/$/, '')
const CHROME_CANDIDATES = [
  process.env.VESSELSURGE_CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

const ROUTES = [
  ['/', 'VesselSurge'],
  ['/map-dashboard', 'Live'],
  ['/latest', 'News'],
  ['/pro-market', 'Market'],
  ['/search', 'Search'],
]

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'mobile', width: 390, height: 900, mobile: true },
]

const IGNORED_BROWSER_LOG = /favicon|preload|apple-mobile-web-app-capable|third-party cookie|privacy sandbox|_vercel\/(speed-)?insights\/script\.js|MIME type \('text\/html'\)/i

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

async function verifyPage(client, route, expectedText, viewport) {
  client.events.length = 0
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  })
  await client.send('Page.navigate', { url: `${BASE_URL}${route}` })
  await sleep(5500)

  const evaluated = await client.send('Runtime.evaluate', {
    expression: `(() => ({
      ready: document.readyState,
      title: document.title,
      textOk: document.body.innerText.includes(${JSON.stringify(expectedText)}),
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyText: document.body.innerText.slice(0, 220)
    }))()`,
    returnByValue: true,
  })

  const value = evaluated.result.value
  const overflow = value.scrollWidth > value.innerWidth + 3
  const ok = value.ready === 'complete' && value.textOk && !overflow && client.events.length === 0

  return {
    route,
    viewport: viewport.name,
    ok,
    title: value.title,
    overflow,
    events: [...client.events],
    bodyText: value.bodyText,
  }
}

async function main() {
  const chrome = findChrome()
  if (!chrome) {
    throw new Error('Chrome executable not found. Set VESSELSURGE_CHROME_PATH to run browser smoke checks.')
  }

  const userDataDir = mkdtempSync(path.join(os.tmpdir(), 'vesselsurge-browser-smoke-'))
  const port = 9300 + Math.floor(Math.random() * 3000)
  const chromeProcess = spawn(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: 'ignore' })

  try {
    const wsUrl = await waitForPageTarget(port)
    const client = createCdpClient(wsUrl)
    await client.opened
    await client.send('Page.enable')
    await client.send('Runtime.enable')
    await client.send('Log.enable')

    const results = []
    for (const [route, expectedText] of ROUTES) {
      for (const viewport of VIEWPORTS) {
        results.push(await verifyPage(client, route, expectedText, viewport))
      }
    }

    client.close()
    console.table(results.map((result) => ({
      route: result.route,
      viewport: result.viewport,
      ok: result.ok,
      overflow: result.overflow,
      events: result.events.length,
      title: result.title,
    })))

    const failed = results.filter((result) => !result.ok)
    if (failed.length > 0) {
      console.error(JSON.stringify(failed, null, 2))
      process.exitCode = 1
    }
  } finally {
    chromeProcess.kill('SIGTERM')
    await sleep(200)
    rmSync(userDataDir, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
