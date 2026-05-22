import type { MaritimeSearchRegion } from './maritime-search-feeds'

export type OfficialMaritimeWatchSource = {
  source: string
  url: string
  kind: 'rss' | 'html'
  regionHint: MaritimeSearchRegion
}

export const OFFICIAL_MARITIME_WATCH_SOURCES: OfficialMaritimeWatchSource[] = [
  {
    source: 'MARAD Hormuz Security Advisory',
    url: 'https://www.maritime.dot.gov/msci/2024-009-strait-hormuz-and-gulf-oman-iranian-illegal-boarding-detention-seizure',
    kind: 'html',
    regionHint: 'hormuz',
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
  {
    source: 'Panama Canal Authority',
    url: 'https://pancanal.com/en/maritime-services/advisory-to-shipping/',
    kind: 'html',
    regionHint: 'panama',
  },
  {
    source: 'Taiwan Maritime and Port Bureau',
    url: 'https://www.motcmpb.gov.tw/RSS',
    kind: 'html',
    regionHint: 'taiwan',
  },
  {
    source: 'Turkish Directorate General of Coastal Safety',
    url: 'https://www.kiyiemniyeti.gov.tr/strait_traffic?lang=2',
    kind: 'html',
    regionHint: 'turkish',
  },
  {
    source: 'Gibraltar Port Authority',
    url: 'https://www.gibraltarport.com/port-information/vessel-traffic-services',
    kind: 'html',
    regionHint: 'gibraltar',
  },
  {
    source: 'South African Maritime Safety Authority',
    url: 'https://www.samsa.org.za/Pages/Notices.aspx',
    kind: 'html',
    regionHint: 'cape',
  },
]

export function officialMaritimeWatchSourceForRegion(region: string) {
  return OFFICIAL_MARITIME_WATCH_SOURCES.find((source) => source.regionHint === region) || null
}
