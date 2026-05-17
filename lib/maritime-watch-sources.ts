export type MaritimeWatchSource = {
  source: string
  url: string
  kind: 'rss' | 'html'
  regionHint?: 'hormuz' | 'bab' | 'suez' | 'malacca'
}

export const MARITIME_WATCH_SOURCES: MaritimeWatchSource[] = [
  {
    source: 'Google News Strait of Hormuz',
    url: 'https://news.google.com/rss/search?q=(%22Strait%20of%20Hormuz%22%20OR%20%22Hormuz%22%20OR%20%22Persian%20Gulf%22%20OR%20%22Gulf%20of%20Oman%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20oil%20OR%20crude%20OR%20Iran)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    kind: 'rss',
    regionHint: 'hormuz',
  },
  {
    source: 'Google News Bab el-Mandeb',
    url: 'https://news.google.com/rss/search?q=(%22Bab%20el-Mandeb%22%20OR%20%22Bab%20el%20Mandeb%22%20OR%20%22Red%20Sea%22%20OR%20%22Gulf%20of%20Aden%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20Houthi)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    kind: 'rss',
    regionHint: 'bab',
  },
  {
    source: 'Google News Suez Canal',
    url: 'https://news.google.com/rss/search?q=(%22Suez%20Canal%22%20OR%20%22Port%20Said%22%20OR%20%22Suez%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20transit)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    kind: 'rss',
    regionHint: 'suez',
  },
  {
    source: 'Google News Malacca Strait',
    url: 'https://news.google.com/rss/search?q=(%22Strait%20of%20Malacca%22%20OR%20%22Straits%20of%20Malacca%22%20OR%20%22Singapore%20Strait%22)%20(shipping%20OR%20vessel%20OR%20tanker%20OR%20maritime%20OR%20piracy)%20when%3A1d&hl=en-US&gl=US&ceid=US:en',
    kind: 'rss',
    regionHint: 'malacca',
  },
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
