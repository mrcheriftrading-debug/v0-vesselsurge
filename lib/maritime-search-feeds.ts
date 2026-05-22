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
  { source: 'Container News', url: 'https://container-news.com/feed/', credibility: 7 },
  { source: 'Ship Technology', url: 'https://www.ship-technology.com/feed/', credibility: 7 },
  { source: 'WorldCargo News', url: 'https://www.worldcargonews.com/rss', credibility: 7 },
  { source: 'Journal of Commerce Maritime', url: 'https://www.joc.com/api/rssfeed/8876', credibility: 8 },
  { source: 'Journal of Commerce Container Shipping', url: 'https://www.joc.com/api/rssfeed/24515', credibility: 8 },
  { source: 'Hapag-Lloyd Liner Services', url: 'https://www.hapag-lloyd.com/feeds/en/news/liner_services.rss', credibility: 7 },
  { source: 'Hapag-Lloyd Ports and Inland', url: 'https://www.hapag-lloyd.com/feeds/en/news/ports_inland.rss', credibility: 7 },
  { source: 'Hapag-Lloyd Rules and Restrictions', url: 'https://www.hapag-lloyd.com/feeds/en/news/rules_regulations_restrictions.rss', credibility: 7 },
] as const

const TIER_ONE_SOURCE_SITES = '(site:bloomberg.com OR site:nytimes.com OR site:aljazeera.com OR site:reuters.com OR site:apnews.com OR site:bbc.com OR site:ft.com OR site:theguardian.com OR site:cnbc.com)'
const MARITIME_TRADE_SOURCE_SITES = '(site:gcaptain.com OR site:marinelink.com OR site:hellenicshippingnews.com OR site:splash247.com OR site:offshore-energy.biz OR site:safety4sea.com OR site:marinelog.com OR site:container-news.com OR site:ship-technology.com OR site:worldcargonews.com OR site:joc.com OR site:hapag-lloyd.com)'

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
    label: 'Suez official notice sweep',
    region: 'suez',
    query: '(site:suezcanal.gov.eg OR "Suez Canal Authority") (navigation OR transit OR convoy OR "canal traffic" OR vessel OR ship)',
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
    label: 'Panama Canal operational advisories',
    region: 'panama',
    query: '("Panama Canal" OR "Panama Canal Authority" OR pancanal) ("advisory to shipping" OR "notice to shipping" OR booking OR reservation OR draught OR draft OR "Gatun Lake" OR transit)',
  },
  {
    label: 'Panama Canal trade-source sweep',
    region: 'panama',
    query: `("Panama Canal" OR pancanal OR "Gatun Lake" OR Neopanamax) (shipping OR vessel OR transit OR queue OR draft OR water OR delay OR slots OR booking) ${MARITIME_TRADE_SOURCE_SITES}`,
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
    label: 'Taiwan Strait port and naval watch',
    region: 'taiwan',
    query: '("Taiwan Strait" OR "Kaohsiung" OR "Keelung" OR "Taipei Port") (vessel OR shipping OR cargo OR port OR maritime OR naval OR exercise OR warning OR traffic)',
  },
  {
    label: 'Taiwan official maritime notice sweep',
    region: 'taiwan',
    query: '(site:motcmpb.gov.tw OR "Taiwan Maritime and Port Bureau" OR MOTCMPB) (navigation OR maritime OR port OR vessel OR warning OR traffic)',
  },
  {
    label: 'Taiwan Strait trade-source sweep',
    region: 'taiwan',
    query: `("Taiwan Strait" OR "Taiwan ports" OR Kaohsiung OR Keelung) (shipping OR vessel OR cargo OR container OR port OR naval OR maritime OR disruption) ${MARITIME_TRADE_SOURCE_SITES}`,
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
    label: 'Bosporus vessel traffic suspension',
    region: 'turkish',
    query: '(Bosporus OR Bosphorus OR Dardanelles OR "Turkish Straits" OR "Istanbul Strait" OR "Canakkale Strait") ("traffic suspended" OR closure OR fog OR malfunction OR tanker OR transit OR "vessel traffic")',
  },
  {
    label: 'Turkish official traffic notice sweep',
    region: 'turkish',
    query: '(site:kiyiemniyeti.gov.tr OR "Directorate General of Coastal Safety" OR "Turkish Coastal Safety") (Bosporus OR Bosphorus OR "Istanbul Strait" OR Dardanelles OR "vessel traffic" OR suspension OR fog)',
  },
  {
    label: 'Turkish Straits trade-source sweep',
    region: 'turkish',
    query: `(Bosporus OR Bosphorus OR Dardanelles OR "Turkish Straits" OR "Istanbul Strait" OR "Canakkale Strait") (shipping OR tanker OR vessel OR transit OR traffic OR closure OR delay OR Black Sea) ${MARITIME_TRADE_SOURCE_SITES}`,
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
    label: 'Gibraltar port and bunkering watch',
    region: 'gibraltar',
    query: '("Strait of Gibraltar" OR "Gibraltar Port" OR Algeciras OR "Algeciras Bay") (vessel OR tanker OR bunkering OR port OR traffic OR congestion OR weather OR warning OR maritime)',
  },
  {
    label: 'Gibraltar official port notice sweep',
    region: 'gibraltar',
    query: '(site:gibraltarport.com OR "Gibraltar Port Authority") ("vessel traffic" OR "port notice" OR bunkering OR incident OR weather OR maritime)',
  },
  {
    label: 'Gibraltar trade-source sweep',
    region: 'gibraltar',
    query: `("Strait of Gibraltar" OR "Gibraltar Port" OR Algeciras OR "Algeciras Bay") (shipping OR vessel OR tanker OR port OR bunkering OR congestion OR incident) ${MARITIME_TRADE_SOURCE_SITES}`,
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
    label: 'Cape route freight and bunker pressure',
    region: 'cape',
    query: '("Cape of Good Hope" OR "Cape route" OR "around Africa" OR "Red Sea bypass") (container shipping OR tanker OR freight OR bunker OR fuel cost OR voyage time OR rerouting)',
  },
  {
    label: 'Cape official maritime safety sweep',
    region: 'cape',
    query: '(site:samsa.org.za OR "South African Maritime Safety Authority" OR SAMSA OR "Cape of Good Hope") (shipping OR maritime safety OR navigation warning OR weather OR vessel OR rerouting)',
  },
  {
    label: 'Cape route trade-source sweep',
    region: 'cape',
    query: `("Cape of Good Hope" OR "Cape route" OR "around Africa" OR "Red Sea bypass") (shipping OR vessel OR container OR tanker OR freight OR rerouting OR voyage OR fuel) ${MARITIME_TRADE_SOURCE_SITES}`,
  },
  {
    label: 'Tier-1 Cape of Good Hope newsroom sweep',
    region: 'cape',
    query: `("Cape of Good Hope" OR "Cape route" OR "Red Sea rerouting") (shipping OR vessel OR container OR tanker OR freight OR rerouting OR delay OR fuel OR voyage) ${TIER_ONE_SOURCE_SITES}`,
  },
]

const RECENT_FALLBACK_SEARCH_DEFINITIONS: MaritimeSearchDefinition[] = [
  {
    label: 'Suez 48h route evidence sweep',
    region: 'suez',
    query: '("Suez Canal" OR "Suez Canal Authority" OR "Port Said" OR "canal convoy") (shipping OR vessel OR transit OR queue OR delay OR advisory OR navigation OR freight OR rerouting OR "Red Sea route")',
  },
  {
    label: 'Taiwan Strait 48h route evidence sweep',
    region: 'taiwan',
    query: '("Taiwan Strait" OR "Kaohsiung port" OR "Keelung port" OR "Taiwan ports") (shipping OR vessel OR cargo OR container OR maritime OR "port operations" OR "naval exercise" OR warning OR disruption)',
  },
  {
    label: 'Turkish Straits 48h route evidence sweep',
    region: 'turkish',
    query: '("Bosporus" OR "Bosphorus" OR "Dardanelles" OR "Turkish Straits" OR "Istanbul Strait") ("vessel traffic" OR shipping OR tanker OR transit OR fog OR closure OR suspension OR delay)',
  },
  {
    label: 'Gibraltar 48h route evidence sweep',
    region: 'gibraltar',
    query: '("Strait of Gibraltar" OR "Gibraltar Port" OR Algeciras OR "Algeciras Bay") (shipping OR vessel OR tanker OR bunkering OR "port traffic" OR congestion OR incident OR weather)',
  },
  {
    label: 'Cape of Good Hope 48h route evidence sweep',
    region: 'cape',
    query: '("Cape of Good Hope" OR "Cape route" OR "around Africa" OR "South Africa shipping") (shipping OR vessel OR tanker OR container OR freight OR rerouting OR bunker OR "voyage delay")',
  },
]

function googleNewsSearchUrl(query: string, days = 1) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${days}d`)}&hl=en-US&gl=US&ceid=US:en`
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
]).concat(
  RECENT_FALLBACK_SEARCH_DEFINITIONS.map((definition) => ({
    source: `Google News 48h Search: ${definition.label}`,
    url: googleNewsSearchUrl(definition.query, 2),
    credibility: 7,
    regionHint: definition.region,
  })),
)
