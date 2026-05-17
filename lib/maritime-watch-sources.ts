import { MARITIME_SEARCH_FEEDS } from './maritime-search-feeds'

export type MaritimeWatchSource = {
  source: string
  url: string
  kind: 'rss' | 'html'
  regionHint?: 'hormuz' | 'bab' | 'suez' | 'malacca'
}

export const MARITIME_WATCH_SOURCES: MaritimeWatchSource[] = [
  ...MARITIME_SEARCH_FEEDS.map((feed) => ({
    source: feed.source,
    url: feed.url,
    kind: 'rss' as const,
    regionHint: feed.regionHint,
  })),
  { source: 'UKMTO Products', url: 'https://www.ukmto.org/ukmto-products', kind: 'html', regionHint: 'bab' },
  { source: 'MSCIO Alerts', url: 'https://www.mscio.eu/alerts/', kind: 'html', regionHint: 'bab' },
  { source: 'ReCAAP ISC Alerts', url: 'https://www.recaap.org/alerts', kind: 'html', regionHint: 'malacca' },
  { source: 'ReCAAP ISC Reports', url: 'https://www.recaap.org/reports', kind: 'html', regionHint: 'malacca' },
  {
    source: 'Suez Canal Authority',
    url: 'https://www.suezcanal.gov.eg/English/MediaCenter/News/Pages/default.aspx',
    kind: 'html',
    regionHint: 'suez',
  },
]
