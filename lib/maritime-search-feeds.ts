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
    label: 'Red Sea official maritime warnings',
    region: 'bab',
    query: '("UKMTO" OR "MSCIO" OR "MARAD" OR "Red Sea") ("Bab el-Mandeb" OR "Gulf of Aden" OR Yemen) (warning OR advisory OR incident OR vessel OR shipping)',
  },
  {
    label: 'Red Sea merchant vessel incidents',
    region: 'bab',
    query: '("Red Sea" OR "Gulf of Aden" OR "Bab el-Mandeb") ("merchant vessel" OR "commercial ship" OR tanker OR cargo) (incident OR attack OR security OR advisory OR rerouting)',
  },
  {
    label: 'Houthi shipping disruption',
    region: 'bab',
    query: '(Houthi OR Yemen OR "Red Sea") (shipping OR vessel OR maritime OR tanker OR cargo) (disruption OR reroute OR security OR insurance OR freight)',
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
    label: 'Suez authority and convoy operations',
    region: 'suez',
    query: '("Suez Canal Authority" OR "Suez Canal") (navigation OR convoy OR transit OR vessel OR canal traffic OR ship)',
  },
  {
    label: 'Suez rerouting and freight pressure',
    region: 'suez',
    query: '("Suez Canal" OR "Red Sea route" OR "Cape of Good Hope") (freight OR container OR tanker OR rerouting OR delay OR schedule)',
  },
  {
    label: 'Malacca piracy and incidents',
    region: 'malacca',
    query: '("Strait of Malacca" OR "Singapore Strait" OR "Straits of Malacca") (piracy OR "armed robbery" OR incident OR ReCAAP OR vessel)',
  },
  {
    label: 'Singapore Strait security alerts',
    region: 'malacca',
    query: '("Singapore Strait" OR "Strait of Malacca" OR ReCAAP) ("armed robbery" OR piracy OR alert OR incident OR tanker OR vessel)',
  },
  {
    label: 'Singapore Strait port and bunker flow',
    region: 'malacca',
    query: '("Singapore Strait" OR "Port of Singapore" OR "Strait of Malacca") (bunker OR vessel OR tanker OR congestion OR throughput OR shipping)',
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
