const TASKS_BY_CRON = {
  '*/15 * * * *': 'smart',
}

function smartModes(date = new Date()) {
  const minute = date.getUTCMinutes()
  const hour = date.getUTCHours()
  if (minute < 15) return hour % 3 === 0 ? ['all'] : ['hourly']
  return ['news']
}

function endpointPlan(baseUrl, mode) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  const plans = {
    news: [{ name: 'news-refresh', url: `${cleanBaseUrl}/api/cron/update?scope=news`, timeoutMs: 55000 }],
    market: [{ name: 'market-pro-refresh', url: `${cleanBaseUrl}/api/cron/market-pro`, timeoutMs: 55000 }],
    hourly: [
      { name: 'news-refresh', url: `${cleanBaseUrl}/api/cron/update?scope=news`, timeoutMs: 55000 },
      { name: 'market-pro-refresh', url: `${cleanBaseUrl}/api/cron/market-pro`, timeoutMs: 55000 },
    ],
    full: [{ name: 'full-maritime-refresh', url: `${cleanBaseUrl}/api/cron/update`, timeoutMs: 70000 }],
    all: [
      { name: 'market-pro-refresh', url: `${cleanBaseUrl}/api/cron/market-pro`, timeoutMs: 55000 },
      { name: 'full-maritime-refresh', url: `${cleanBaseUrl}/api/cron/update`, timeoutMs: 70000 },
    ],
  }
  return plans[mode] || plans.news
}

async function runTask(task, env) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), task.timeoutMs)
  const started = Date.now()

  try {
    const response = await fetch(task.url, {
      headers: {
        authorization: `Bearer ${env.CRON_SECRET}`,
        accept: 'application/json',
        'user-agent': 'vesselsurge-cloudflare-scheduler/1.0',
      },
      signal: controller.signal,
    })
    const body = await response.text()
    return {
      name: task.name,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - started,
      body: body.slice(0, 1200),
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function runModes(modes, env) {
  if (!env.VESSELSURGE_CRON_BASE_URL) throw new Error('VESSELSURGE_CRON_BASE_URL is missing')
  if (!env.CRON_SECRET) throw new Error('CRON_SECRET is missing')

  const tasks = modes.flatMap((mode) => endpointPlan(env.VESSELSURGE_CRON_BASE_URL, mode))
  const results = []
  for (const task of tasks) {
    results.push(await runTask(task, env))
  }
  const failed = results.filter((result) => !result.ok)
  if (failed.length) throw new Error(`VesselSurge scheduler failed: ${failed.map((result) => `${result.name}:${result.status}`).join(', ')}`)
  return results
}

export default {
  async scheduled(event, env, ctx) {
    const scheduledMode = TASKS_BY_CRON[event.cron] || 'smart'
    const modes = scheduledMode === 'smart' ? smartModes() : [scheduledMode]
    ctx.waitUntil(runModes(modes, env))
  },

  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/health') return new Response('Not found', { status: 404 })

    return Response.json({
      status: env.VESSELSURGE_CRON_BASE_URL && env.CRON_SECRET ? 'ok' : 'needs_configuration',
      baseUrlConfigured: Boolean(env.VESSELSURGE_CRON_BASE_URL),
      cronSecretConfigured: Boolean(env.CRON_SECRET),
      schedules: TASKS_BY_CRON,
    })
  },
}
