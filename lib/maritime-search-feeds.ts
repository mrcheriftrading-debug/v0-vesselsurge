export type MaritimeSearchRegion =
  | 'hormuz'
  | 'bab'
  | 'suez'
  | 'malacca'
  | 'panama'
  | 'taiwan'
  | 'turkish'
  | 'gibraltar'
  | 'cape'

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

export const ADDITIONAL_TRUSTED_NEWS_FEEDS = [
  { source: 'New York Times World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', credibility: 8 },
  { source: 'New York Times Business', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', credibility: 7 },
  { source: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', credibility: 8 },
  { source: 'The Guardian World', url: 'https://www.theguardian.com/world/rss', credibility: 7 },
  { source: 'Financial Times World', url: 'https://www.ft.com/world?format=rss', credibility: 8 },
  { source: 'Financial Times Markets', url: 'https://www.ft.com/markets?format=rss', credibility: 8 },
  { source: 'CNBC World News', url: 'https://www.cnbc.com/id/100727362/device/rss/rss.html', credibility: 7 },
  { source: 'OilPrice', url: 'https://oilprice.com/rss/main', credibility: 6 },
] as const

const TIER_ONE_SOURCE_SITES = '(site:bloomberg.com OR site:nytimes.com OR site:aljazeera.com OR site:reuters.com OR site:apnews.com OR site:bbc.com OR site:ft.com OR site:theguardian.com OR site:cnbc.com)'

const SEARCH_DEFINITIONS: MaritimeSearchDefinition[] = [
  {
    label: 'Global maritime chokepoint disruption',
    region: 'hormuz',
    query: '("shipping chokepoint" OR "maritime chokepoint" OR "oil route" OR "tanker route") (disruption OR risk OR warning OR incident OR delay OR insurance OR freight)',
  },
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
    label: 'Tier-1 Hormuz newsroom sweep',
    region: 'hormuz',
    query: `("Strait of Hormuz" OR Hormuz OR "Persian Gulf" OR "Gulf of Oman" OR Iran) (shipping OR tanker OR maritime OR vessel OR oil OR crude OR insurance OR freight OR sanctions) ${TIER_ONE_SOURCE_SITES}`,
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
    label: 'Global Red Sea shipping coverage',
    region: 'bab',
    query: '("Red Sea shipping" OR "Red Sea route" OR "Gulf of Aden shipping") (vessel OR cargo OR tanker OR container OR freight OR insurance OR disruption)',
  },
  {
    label: 'Tier-1 Red Sea newsroom sweep',
    region: 'bab',
    query: `("Red Sea" OR "Bab el-Mandeb" OR "Bab el Mandeb" OR "Gulf of Aden" OR Yemen OR Houthi) (shipping OR vessel OR tanker OR maritime OR cargo OR route OR rerouting OR insurance OR freight OR attack OR advisory) ${TIER_ONE_SOURCE_SITES}`,
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
    label: 'Global canal and port disruption',
    region: 'suez',
    query: '("Suez Canal" OR "canal transit" OR "Port Said") (shipping news OR vessel traffic OR congestion OR disruption OR convoy OR maritime)',
  },
  {
    label: 'Tier-1 Suez newsroom sweep',
    region: 'suez',
    query: `("Suez Canal" OR Suez OR "Port Said" OR "Red Sea route" OR "Cape of Good Hope") (shipping OR vessel OR maritime OR canal OR convoy OR transit OR queue OR delay OR freight OR rerouting) ${TIER_ONE_SOURCE_SITES}`,
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
  {
    label: 'Southeast Asia shipping risk',
    region: 'malacca',
    query: '("Southeast Asia shipping" OR "Singapore Strait" OR "Port of Singapore") (vessel OR tanker OR cargo OR piracy OR congestion OR maritime risk)',
  },
  {
    label: 'Tier-1 Malacca newsroom sweep',
    region: 'malacca',
    query: `("Strait of Malacca" OR "Singapore Strait" OR "Port of Singapore" OR ReCAAP) (shipping OR vessel OR tanker OR maritime OR cargo OR congestion OR piracy OR "armed robbery" OR port) ${TIER_ONE_SOURCE_SITES}`,
  },
  {
    label: 'Panama Canal transit pressure',
    region: 'panama',
    query: '("Panama Canal" OR "Panama Canal Authority") (ship OR vessel OR shipping OR maritime OR transit OR queue OR draft OR water OR drought OR delay OR maintenance)',
  },
  {
    label: 'Tier-1 Panama Canal newsroom sweep',
    region: 'panama',
    query: `("Panama Canal" OR "Panama Canal Authority") (shipping OR vessel OR transit OR queue OR water OR drought OR canal OR maintenance OR delay) ${TIER_ONE_SOURCE_SITES}`,
  },
  {
    label: 'Taiwan Strait trade lane risk',
    region: 'taiwan',
    query: '("Taiwan Strait" OR "Taiwan shipping" OR "Taiwan trade lane") (shipping OR vessel OR maritime OR cargo OR port OR naval OR alert OR exercise OR disruption OR risk)',
  },
  {
    label: 'Tier-1 Taiwan Strait newsroom sweep',
    region: 'taiwan',
    query: `("Taiwan Strait" OR Taiwan) (shipping OR vessel OR maritime OR cargo OR port OR naval OR trade lane OR alert OR disruption OR risk) ${TIER_ONE_SOURCE_SITES}`,
  },
  {
    label: 'Turkish Straits transit flow',
    region: 'turkish',
    query: '("Turkish Straits" OR Bosporus OR Bosphorus OR Dardanelles) (shipping OR vessel OR tanker OR maritime OR transit OR Black Sea OR delay OR closure OR traffic OR weather)',
  },
  {
    label: 'Tier-1 Turkish Straits newsroom sweep',
    region: 'turkish',
    query: `("Turkish Straits" OR Bosporus OR Bosphorus OR Dardanelles) (shipping OR vessel OR tanker OR maritime OR transit OR Black Sea OR delay OR closure OR traffic) ${TIER_ONE_SOURCE_SITES}`,
  },
  {
    label: 'Strait of Gibraltar vessel flow',
    region: 'gibraltar',
    query: '("Strait of Gibraltar" OR Gibraltar) (shipping OR vessel traffic OR tanker OR maritime OR port OR congestion OR security OR flow OR incident)',
  },
  {
    label: 'Tier-1 Gibraltar newsroom sweep',
    region: 'gibraltar',
    query: `("Strait of Gibraltar" OR Gibraltar) (shipping OR vessel OR tanker OR maritime OR port OR congestion OR security OR traffic OR incident) ${TIER_ONE_SOURCE_SITES}`,
  },
  {
    label: 'Cape of Good Hope rerouting pressure',
    region: 'cape',
    query: '("Cape of Good Hope" OR "Cape route" OR "Red Sea rerouting") (shipping OR vessel OR container OR tanker OR freight OR rerouting OR delay OR fuel OR voyage)',
  },
  {
    label: 'Tier-1 Cape of Good Hope newsroom sweep',
    region: 'cape',
    query: `("Cape of Good Hope" OR "Cape route" OR "Red Sea rerouting") (shipping OR vessel OR container OR tanker OR freight OR rerouting OR delay OR fuel OR voyage) ${TIER_ONE_SOURCE_SITES}`,
  },
]

function googleNewsSearchUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:7d`)}&hl=en-US&gl=US&ceid=US:en`
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
  ...(definition.label.startsWith('Tier-1') ? [] : [{
    source: `Bing News Search: ${definition.label}`,
    url: bingNewsSearchUrl(definition.query),
    credibility: 6,
    regionHint: definition.region,
  }]),
])
