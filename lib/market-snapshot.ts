import 'server-only'

type MarketInstrument = {
  symbol: string
  label: string
  group: 'Equities' | 'Energy' | 'Rates' | 'FX' | 'Safe haven' | 'Transport'
  valueType?: 'price' | 'yield'
}

export type MarketQuote = MarketInstrument & {
  price: number
  previousClose: number
  change: number
  changePercent: number
  currency: string
  exchangeName: string
  marketTime: string | null
}

export type MarketDriver = {
  label: string
  tone: 'risk-on' | 'risk-off' | 'watch' | 'neutral'
  detail: string
}

export type MarketSnapshot = {
  generatedAt: string
  source: string
  sourceUrl: string
  quotes: MarketQuote[]
  drivers: MarketDriver[]
  regime: string
  riskTone: 'risk-on' | 'risk-off' | 'mixed'
  summary: string
}

const MARKET_INSTRUMENTS: MarketInstrument[] = [
  { symbol: '^GSPC', label: 'S&P 500', group: 'Equities' },
  { symbol: '^IXIC', label: 'Nasdaq Composite', group: 'Equities' },
  { symbol: '^DJI', label: 'Dow Jones', group: 'Equities' },
  { symbol: '^OMX', label: 'OMXS30', group: 'Equities' },
  { symbol: 'BZ=F', label: 'Brent crude', group: 'Energy' },
  { symbol: 'CL=F', label: 'WTI crude', group: 'Energy' },
  { symbol: '^TNX', label: 'US 10Y yield', group: 'Rates', valueType: 'yield' },
  { symbol: 'DX-Y.NYB', label: 'US Dollar Index', group: 'FX' },
  { symbol: 'GC=F', label: 'Gold', group: 'Safe haven' },
  { symbol: 'IYT', label: 'US transports ETF', group: 'Transport' },
]

function quoteUrl(symbol: string) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`
}

function pct(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function bps(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)} bps`
}

function average(values: Array<number | null | undefined>) {
  const clean = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (!clean.length) return 0
  return clean.reduce((sum, value) => sum + value, 0) / clean.length
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

async function fetchQuote(instrument: MarketInstrument): Promise<MarketQuote | null> {
  try {
    const response = await fetch(quoteUrl(instrument.symbol), {
      headers: { 'user-agent': 'VesselSurge Market Pro/1.0' },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3500),
    })

    if (!response.ok) return null

    const payload = await response.json()
    const result = payload?.chart?.result?.[0]
    const meta = result?.meta
    const price = Number(meta?.regularMarketPrice)
    const previousClose = Number(meta?.previousClose || meta?.chartPreviousClose)
    const regularMarketTime = Number(meta?.regularMarketTime)

    if (!Number.isFinite(price) || !Number.isFinite(previousClose) || previousClose <= 0) {
      return null
    }

    const change = price - previousClose
    return {
      ...instrument,
      valueType: instrument.valueType || 'price',
      price,
      previousClose,
      change,
      changePercent: (change / previousClose) * 100,
      currency: meta?.currency || '',
      exchangeName: meta?.exchangeName || '',
      marketTime: Number.isFinite(regularMarketTime) ? new Date(regularMarketTime * 1000).toISOString() : null,
    }
  } catch (error) {
    console.warn('[market-snapshot] quote unavailable:', instrument.symbol, error)
    return null
  }
}

function quoteMap(quotes: MarketQuote[]) {
  return new Map(quotes.map((quote) => [quote.symbol, quote]))
}

function buildDrivers(quotes: MarketQuote[]) {
  const map = quoteMap(quotes)
  const equityMove = average(['^GSPC', '^IXIC', '^DJI', '^OMX'].map((symbol) => map.get(symbol)?.changePercent))
  const oilMove = average(['BZ=F', 'CL=F'].map((symbol) => map.get(symbol)?.changePercent))
  const tenYear = map.get('^TNX')
  const dollar = map.get('DX-Y.NYB')
  const gold = map.get('GC=F')
  const transports = map.get('IYT')
  const tenYearBps = tenYear ? tenYear.change * 100 : 0

  const drivers: MarketDriver[] = [
    {
      label: 'Equity tape',
      tone: equityMove >= 0.4 ? 'risk-on' : equityMove <= -0.4 ? 'risk-off' : 'neutral',
      detail: `Major equity benchmarks average ${pct(equityMove)} today, with OMXS30 and US indices in the same live tape.`,
    },
    {
      label: 'Oil route pressure',
      tone: oilMove >= 1.2 ? 'risk-off' : oilMove <= -1.2 ? 'risk-on' : 'watch',
      detail: `Brent/WTI average ${pct(oilMove)}; higher crude strengthens the maritime-to-inflation channel.`,
    },
    {
      label: 'Rates and dollar',
      tone: tenYearBps >= 4 || (dollar?.changePercent || 0) >= 0.35 ? 'risk-off' : tenYearBps <= -4 ? 'risk-on' : 'watch',
      detail: `US 10Y is ${tenYear ? bps(tenYearBps) : 'not available'} and the dollar is ${dollar ? pct(dollar.changePercent) : 'not available'}.`,
    },
    {
      label: 'Safe-haven / transport read-through',
      tone: (gold?.changePercent || 0) > 0.7 && (transports?.changePercent || 0) < 0 ? 'risk-off' : 'watch',
      detail: `Gold is ${gold ? pct(gold.changePercent) : 'not available'} while US transports are ${transports ? pct(transports.changePercent) : 'not available'}.`,
    },
  ]

  return drivers
}

export function quoteFor(snapshot: MarketSnapshot | null | undefined, symbol: string) {
  return snapshot?.quotes.find((quote) => quote.symbol === symbol) || null
}

export function formatQuoteMove(quote: MarketQuote | null | undefined) {
  if (!quote) return 'market quote unavailable'
  if (quote.valueType === 'yield') return `${quote.label} ${quote.price.toFixed(2)} (${bps(quote.change * 100)})`
  return `${quote.label} ${quote.price.toFixed(2)} ${quote.currency} (${pct(quote.changePercent)})`
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const quotes = (await Promise.all(MARKET_INSTRUMENTS.map(fetchQuote)))
    .filter((quote): quote is MarketQuote => Boolean(quote))

  if (quotes.length < 5) {
    throw new Error(`Only ${quotes.length} market quotes loaded`)
  }

  const map = quoteMap(quotes)
  const drivers = buildDrivers(quotes)
  const equityMove = average(['^GSPC', '^IXIC', '^DJI', '^OMX'].map((symbol) => map.get(symbol)?.changePercent))
  const oilMove = average(['BZ=F', 'CL=F'].map((symbol) => map.get(symbol)?.changePercent))
  const tenYearBps = (map.get('^TNX')?.change || 0) * 100
  const dollarMove = map.get('DX-Y.NYB')?.changePercent || 0
  const riskScore = clamp(50 + equityMove * 8 - oilMove * 4 - tenYearBps * 0.8 - dollarMove * 3)
  const riskTone = riskScore >= 58 ? 'risk-on' : riskScore <= 42 ? 'risk-off' : 'mixed'
  const regime = riskTone === 'risk-on'
    ? 'Equities are absorbing the maritime macro risk for now'
    : riskTone === 'risk-off'
      ? 'Macro pressure is outweighing equity risk appetite'
      : 'Markets are mixed between equity appetite and oil/rate pressure'

  return {
    generatedAt: new Date().toISOString(),
    source: 'Yahoo Finance chart data',
    sourceUrl: 'https://finance.yahoo.com/',
    quotes,
    drivers,
    regime,
    riskTone,
    summary: `${regime}. Equity tape ${pct(equityMove)}, Brent/WTI ${pct(oilMove)}, US 10Y ${bps(tenYearBps)}, dollar ${pct(dollarMove)}.`,
  }
}
