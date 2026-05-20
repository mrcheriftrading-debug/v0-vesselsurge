#!/usr/bin/env node

const BASE_URL = (process.env.VESSELSURGE_LINK_SMOKE_URL || 'https://www.vesselsurge.com').replace(/\/$/, '')
const MAX_PAGES = Number.parseInt(process.env.VESSELSURGE_LINK_SMOKE_MAX_PAGES || '160', 10)
const SEED_PATHS = ['/', '/map-dashboard', '/latest', '/pro-market', '/search', '/network', '/about']
const SKIP_PREFIXES = ['/api/', '/_next/']
const SKIP_EXTENSIONS = /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|webmanifest|woff2?)$/i
const HREF_PATTERN = /\bhref=["']([^"'#]+(?:#[^"']*)?)/g

const seen = new Set()
const checked = []

function normalizeInternalHref(href) {
  if (!href || /^(?:mailto:|tel:|javascript:)/i.test(href)) return null

  try {
    const url = new URL(href, BASE_URL)
    if (url.origin !== BASE_URL) return null
    url.hash = ''
    const path = `${url.pathname}${url.search}`
    if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) return null
    if (SKIP_EXTENSIONS.test(url.pathname)) return null
    return path
  } catch {
    return null
  }
}

async function fetchText(path) {
  const started = Date.now()
  try {
    const response = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
    const contentType = response.headers.get('content-type') || ''
    const text = contentType.includes('text/html') || contentType.includes('xml') ? await response.text() : ''
    return {
      path,
      status: response.status,
      ms: Date.now() - started,
      type: contentType.split(';')[0] || 'unknown',
      text,
    }
  } catch (error) {
    return {
      path,
      status: 'ERR',
      ms: Date.now() - started,
      type: error instanceof Error ? error.message : 'request failed',
      text: '',
    }
  }
}

async function discoverSitemapPaths() {
  const sitemap = await fetchText('/sitemap.xml')
  checked.push({ ...sitemap, text: undefined })
  if (sitemap.status !== 200 || !sitemap.text) return []

  return [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => normalizeInternalHref(match[1]))
    .filter(Boolean)
}

async function crawl(path) {
  if (!path || seen.has(path) || seen.size >= MAX_PAGES) return
  seen.add(path)

  const result = await fetchText(path)
  checked.push({ ...result, text: undefined })
  if (result.status !== 200 || !result.text || !result.type.includes('text/html')) return

  for (const match of result.text.matchAll(HREF_PATTERN)) {
    const next = normalizeInternalHref(match[1])
    if (next && !seen.has(next) && seen.size < MAX_PAGES) {
      await crawl(next)
    }
  }
}

async function main() {
  const sitemapPaths = await discoverSitemapPaths()
  const queue = [...new Set([...SEED_PATHS, ...sitemapPaths])]

  for (const path of queue) {
    await crawl(path)
  }

  const deduped = [...new Map(checked.map((row) => [row.path, row])).values()]
  const bad = deduped.filter((row) => !(typeof row.status === 'number' && row.status >= 200 && row.status < 400))
  const slow = deduped
    .filter((row) => typeof row.status === 'number')
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 8)

  console.table(deduped.sort((a, b) => a.path.localeCompare(b.path)).map(({ path, status, ms, type }) => ({ path, status, ms, type })))
  console.log(JSON.stringify({ checked: deduped.length, bad, slow }, null, 2))

  if (bad.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
