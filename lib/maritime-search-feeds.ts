export type MaritimeSearchRegion = 'hormuz' | 'bab' | 'suez' | 'malacca'

export type MaritimeSearchFeed = {
  source: string
  url: string
  credibility: number
  regionHint: MaritimeSearchRegion
}

type MaritimeSearchDefinition = {
  label: string
  region: MaritimeSearchRegion
  query: string
}

const SEARCH_DEFINITIONS: MaritimeSearchDefinition[] = [
  {
    label: 'Hormuz tanker security',
    region: 'hormuz',
    query: '("Strait of Hormuz" OR Hormuz OR "Gulf of Oman") (tanker OR vessel OR shipping OR maritime) (attack OR seizure OR threat OR warning OR incident OR insurance OR oil)',
  },
  {
    label: 'Hormuz oil route disruption',
    region: 'hormuz',
    query: '("Strait of Hormuz" OR Hormuz OR "Persian Gulf") (oil OR crude OR LNG OR energy) (shipping OR tanker OR route OR disruption OR sanctions OR Iran)',
  },
  {
    label: 'Red Sea vessel security',
    region: 'bab',
    query: '("Red Sea" OR "Bab el-Mandeb" OR "Gulf of Aden") (ship OR vessel OR tanker OR cargo) (attack OR missile OR drone OR Houthi OR warning OR incident)',
  },
  {
    label: 'Bab el-Mandeb route risk',
    region: 'bab',
    query: '("Bab el-Mandeb" OR "Bab el Mandeb" OR "Gulf of Aden") (shipping OR maritime OR reroute OR divert OR war-risk OR insurance OR freight)',
  },
  {
    label: 'Suez traffic and queues',
    region: 'suez',
    query: '("Suez Canal" OR "Port Said" OR Suez) (vessel OR convoy OR transit OR shipping OR queue OR congestion OR delay)',
  },
  {
    label: 'Suez disruption spillover',
    region: 'suez',
    query: '("Suez Canal" OR Suez) ("Red Sea" OR rerouting OR "Cape of Good Hope" OR freight OR container OR tanker)',
  },
  {
    label: 'Malacca piracy and incidents',
    region: 'malacca',
    query: '("Strait of Malacca" OR "Singapore Strait" OR "Straits of Malacca") (piracy OR "armed robbery" OR incident OR ReCAAP OR vessel)',
  },
  {
    label: 'Malacca congestion and tanker flow',
    region: 'malacca',
    query: '("Strait of Malacca" OR "Singapore Strait") (shipping OR tanker OR cargo OR congestion OR port OR transit OR maritime)',
  },
]

function googleNewsSearchUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:1d`)}&hl=en-US&gl=US&ceid=US:en`
}

function bingNewsSearchUrl(query: string) {
  return `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`
}

export const MARITIME_SEARCH_FEEDS: MaritimeSearchFeed[] = SEARCH_DEFINITIONS.flatMap((definition) => [
  {
    source: `Google News Search: ${definition.label}`,
    url: googleNewsSearchUrl(definition.query),
    credibility: 7,
    regionHint: definition.region,
  },
  {
    source: `Bing News Search: ${definition.label}`,
    url: bingNewsSearchUrl(definition.query),
    credibility: 6,
    regionHint: definition.region,
  },
])
