import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TelegramMessage = {
  chat?: { id?: number | string }
  text?: string
  from?: { id?: number | string; first_name?: string }
}

type TelegramUpdate = {
  message?: TelegramMessage
  edited_message?: TelegramMessage
}

const SITE_URL = 'https://www.vesselsurge.com'
const MAX_TELEGRAM_MESSAGE = 3900

function truncateTelegram(text: string) {
  return text.length > MAX_TELEGRAM_MESSAGE
    ? `${text.slice(0, MAX_TELEGRAM_MESSAGE - 20)}...`
    : text
}

async function telegramSendMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN')

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: truncateTelegram(text),
      disable_web_page_preview: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Telegram send failed: ${response.status} ${await response.text()}`)
  }
}

async function getMaritimeSnapshot() {
  const response = await fetch(`${SITE_URL}/api/maritime-data`, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Maritime data failed: ${response.status}`)
  const payload = await response.json()
  const data = payload.data || {}
  const hotspots = Array.isArray(data.hotspots) ? data.hotspots : []
  const articles = Array.isArray(data.articles) ? data.articles : []
  return { hotspots, articles }
}

async function buildStatusReply() {
  const { hotspots, articles } = await getMaritimeSnapshot()
  const rows = hotspots.map((hotspot: any) => {
    const name = {
      hormuz: 'Strait of Hormuz',
      bab: 'Bab el-Mandeb',
      suez: 'Suez Canal',
      malacca: 'Strait of Malacca',
    }[hotspot.hotspot as string] || hotspot.hotspot

    return [
      `${name}: ${(hotspot.riskLevel || 'unknown').toUpperCase()}`,
      `${hotspot.verifiedReports || 0} reports`,
      `${hotspot.sourceCount || 0} sources`,
      `${hotspot.activeVessels || 0} AIS vessels`,
    ].join(' | ')
  })

  return [
    'VesselSurge live status',
    '',
    ...rows,
    '',
    `Latest source-reviewed reports: ${articles.length}`,
    `${SITE_URL}/map-dashboard`,
  ].join('\n')
}

async function buildLatestReply() {
  const { articles } = await getMaritimeSnapshot()
  const latest = articles.slice(0, 5)

  if (latest.length === 0) {
    return `No fresh source-reviewed maritime reports are available right now.\n${SITE_URL}/map-dashboard`
  }

  return [
    'Latest VesselSurge maritime intelligence',
    '',
    ...latest.map((article: any, index: number) => (
      `${index + 1}. ${article.title}\n${article.source || 'Source review'} | ${article.region || 'global'}`
    )),
    '',
    `${SITE_URL}/intelligence`,
  ].join('\n\n')
}

async function generateAiReply(userText: string) {
  const apiKey = process.env.XAI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return [
      'I can help with VesselSurge commands right now:',
      '/status - live chokepoint status',
      '/latest - latest maritime intelligence',
      '',
      'AI chat is not enabled because no AI API key is configured.',
    ].join('\n')
  }

  const { hotspots, articles } = await getMaritimeSnapshot()
  const context = {
    hotspots: hotspots.map((h: any) => ({
      hotspot: h.hotspot,
      riskLevel: h.riskLevel,
      verifiedReports: h.verifiedReports,
      sourceCount: h.sourceCount,
      activeVessels: h.activeVessels,
      latestSource: h.latestSource,
    })),
    latestArticles: articles.slice(0, 8).map((a: any) => ({
      title: a.title,
      source: a.source,
      region: a.region,
      timestamp: a.timestamp,
    })),
  }

  const usingXai = Boolean(process.env.XAI_API_KEY)
  const endpoint = usingXai ? 'https://api.x.ai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
  const model = process.env.TELEGRAM_AI_MODEL || (usingXai ? 'grok-3-mini' : 'gpt-4o-mini')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: [
            'You are VesselSurge Telegram assistant.',
            'Answer briefly and practically.',
            'Use the provided VesselSurge live context.',
            'Do not claim unverified breaking facts.',
            'If data is missing, say it is not verified yet.',
            `Always point users to ${SITE_URL}/map-dashboard when relevant.`,
          ].join(' '),
        },
        {
          role: 'user',
          content: `Live context:\n${JSON.stringify(context, null, 2)}\n\nUser message:\n${userText}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 700,
    }),
  })

  if (!response.ok) {
    console.error('[telegram] AI response failed', response.status, await response.text())
    return [
      'I could not generate an AI answer right now.',
      'Use /status or /latest for live VesselSurge data.',
    ].join('\n')
  }

  const payload = await response.json()
  return payload.choices?.[0]?.message?.content?.trim() || 'No answer generated.'
}

function isWebhookAuthorized(request: Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expected) return false
  return request.headers.get('x-telegram-bot-api-secret-token') === expected
}

function isAllowedTelegramUser(message: TelegramMessage) {
  const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID
  if (!allowedUserId) return false
  return String(message.from?.id || '') === allowedUserId
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'VesselSurge Telegram webhook',
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET),
  })
}

export async function POST(request: Request) {
  if (!isWebhookAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null
  const message = update?.message || update?.edited_message
  const chatId = message?.chat?.id
  const text = message?.text?.trim() || ''

  if (!chatId || !text) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  if (!isAllowedTelegramUser(message)) {
    console.warn('[telegram] blocked unauthorized user', message.from?.id || 'unknown')
    return NextResponse.json({ ok: true, blocked: true })
  }

  try {
    const lower = text.toLowerCase()
    let reply: string

    if (lower === '/start' || lower === '/help') {
      reply = [
        `Hi${message.from?.first_name ? ` ${message.from.first_name}` : ''}. I am the VesselSurge assistant.`,
        '',
        '/status - live chokepoint status',
        '/latest - latest source-reviewed reports',
        'Or ask me about Hormuz, Red Sea risk, tanker routes, freight, insurance, Suez, or Malacca.',
        '',
        SITE_URL,
      ].join('\n')
    } else if (lower.startsWith('/status')) {
      reply = await buildStatusReply()
    } else if (lower.startsWith('/latest')) {
      reply = await buildLatestReply()
    } else {
      reply = await generateAiReply(text)
    }

    await telegramSendMessage(chatId, reply)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[telegram] webhook failed', error)
    try {
      await telegramSendMessage(chatId, 'Something went wrong. Try /status or /latest.')
    } catch {}
    return NextResponse.json({ ok: false, error: 'Telegram webhook failed' }, { status: 500 })
  }
}
