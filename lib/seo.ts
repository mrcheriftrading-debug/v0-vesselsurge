export const BASE_URL = "https://www.vesselsurge.com"

export const publicFeaturePages = [
  {
    name: "Live Maritime Map",
    url: `${BASE_URL}/map-dashboard`,
    description:
      "Live map context, vessel indicators, risk labels and selected reports for critical shipping chokepoints.",
    keywords: ["live maritime map", "vessel tracking", "shipping chokepoint map"],
  },
  {
    name: "News & Risk",
    url: `${BASE_URL}/latest`,
    description:
      "Fresh source-reviewed maritime news, chokepoint risk signals and live map context for shipping risk searches.",
    keywords: ["latest maritime news", "shipping news today", "chokepoint news", "maritime intelligence", "shipping risk reports"],
  },
  {
    name: "Source Trust",
    url: `${BASE_URL}/source-trust`,
    description:
      "Public data quality dashboard showing VesselSurge source review, freshness gates, AI guardrails and maritime intelligence trust status.",
    keywords: ["source reviewed maritime news", "maritime data quality", "AI maritime intelligence", "shipping risk source trust"],
  },
  {
    name: "Market Pro",
    url: `${BASE_URL}/pro-market`,
    description:
      "Source-backed maritime market impact reports for oil, freight, tanker stocks, logistics equities, insurance risk and critical chokepoints.",
    keywords: ["shipping risk stock market impact", "maritime market intelligence", "oil market shipping risk", "freight rate signals"],
  },
  {
    name: "Maritime B2B Network",
    url: `${BASE_URL}/network`,
    description:
      "Cargo and vessel capacity intake for route, timing and partner matching.",
    keywords: ["cargo vessel matching", "maritime B2B network", "vessel capacity"],
  },
  {
    name: "Maritime Search",
    url: `${BASE_URL}/search`,
    description:
      "Search maritime news, security alerts, route context and shipping market updates.",
    keywords: ["maritime news search", "shipping alerts search", "vessel news"],
  },
  {
    name: "Strait of Hormuz Intelligence",
    url: `${BASE_URL}/regions/hormuz`,
    description:
      "Hormuz vessel context, Iran-related maritime risk and oil route signals.",
    keywords: ["Strait of Hormuz live tracking", "Iran shipping risk", "oil tanker tracking"],
  },
  {
    name: "Bab el-Mandeb Intelligence",
    url: `${BASE_URL}/regions/bab`,
    description:
      "Red Sea, Gulf of Aden and Bab el-Mandeb shipping security context.",
    keywords: ["Bab el-Mandeb shipping risk", "Red Sea security", "Houthi maritime alerts"],
  },
  {
    name: "Suez Canal Intelligence",
    url: `${BASE_URL}/regions/suez`,
    description:
      "Suez Canal traffic, transit risk, queue signals and route disruption context.",
    keywords: ["Suez Canal live traffic", "Suez vessel queue", "Suez transit risk"],
  },
  {
    name: "Strait of Malacca Intelligence",
    url: `${BASE_URL}/regions/malacca`,
    description:
      "Malacca and Singapore Strait vessel density, congestion and piracy alert context.",
    keywords: ["Strait of Malacca vessel traffic", "Singapore Strait risk", "Malacca piracy alerts"],
  },
] as const

export const trafficTopicPages = [
  {
    slug: "strait-of-hormuz-oil-risk",
    name: "Strait of Hormuz Oil Risk Tracker",
    title: "Strait of Hormuz Oil Risk Tracker, Iran Tension and Tanker Route Signals",
    description:
      "Monitor Strait of Hormuz oil route risk, Iran-related maritime tension, tanker traffic context, insurance pressure and live chokepoint intelligence.",
    keywords: ["Strait of Hormuz oil risk", "Iran tanker route risk", "Hormuz oil shipping tracker"],
    regionHref: "/regions/hormuz",
    primaryHref: "/map-dashboard?hotspot=hormuz",
    intent: "oil traders, shipping teams and analysts watching Hormuz risk",
    questions: [
      "How can I monitor Strait of Hormuz oil route risk?",
      "Where can I track Iran-related tanker shipping signals?",
      "What maritime data matters when Hormuz tensions rise?",
    ],
  },
  {
    slug: "red-sea-shipping-risk",
    name: "Red Sea Shipping Risk Tracker",
    title: "Red Sea Shipping Risk, Bab el-Mandeb Security and Houthi Maritime Signals",
    description:
      "Track Red Sea shipping risk, Bab el-Mandeb security context, Gulf of Aden route exposure, Houthi-related maritime reports and rerouting signals.",
    keywords: ["Red Sea shipping risk", "Bab el-Mandeb security", "Houthi maritime alerts"],
    regionHref: "/regions/bab",
    primaryHref: "/map-dashboard?hotspot=bab",
    intent: "teams monitoring Red Sea security and route disruption",
    questions: [
      "Where can I monitor Red Sea shipping risk?",
      "How do I track Bab el-Mandeb maritime security signals?",
      "What should operators watch when Red Sea routes tighten?",
    ],
  },
  {
    slug: "suez-canal-traffic-delays",
    name: "Suez Canal Traffic and Delay Tracker",
    title: "Suez Canal Traffic, Vessel Queue Signals and Transit Delay Intelligence",
    description:
      "Follow Suez Canal traffic context, vessel queue signals, transit delay reports, Red Sea spillover risk and Europe-Asia shipping disruption intelligence.",
    keywords: ["Suez Canal traffic", "Suez vessel queue", "Suez transit delays"],
    regionHref: "/regions/suez",
    primaryHref: "/map-dashboard?hotspot=suez",
    intent: "logistics teams tracking Suez delays and route disruption",
    questions: [
      "How can I monitor Suez Canal traffic?",
      "Where can I check Suez vessel queue signals?",
      "What maritime risks affect Suez Canal transits?",
    ],
  },
  {
    slug: "malacca-strait-vessel-traffic",
    name: "Malacca Strait Vessel Traffic Tracker",
    title: "Strait of Malacca Vessel Traffic, Singapore Strait Risk and Piracy Alert Context",
    description:
      "Monitor Strait of Malacca vessel traffic, Singapore Strait congestion context, piracy alert signals and Southeast Asia maritime risk intelligence.",
    keywords: ["Strait of Malacca vessel traffic", "Singapore Strait risk", "Malacca piracy alerts"],
    regionHref: "/regions/malacca",
    primaryHref: "/map-dashboard?hotspot=malacca",
    intent: "operators watching Southeast Asia traffic, congestion and piracy context",
    questions: [
      "Where can I track Strait of Malacca vessel traffic?",
      "How do I monitor Singapore Strait maritime risk?",
      "What signals matter for Malacca congestion and piracy alerts?",
    ],
  },
  {
    slug: "maritime-risk-intelligence",
    name: "Maritime Risk Intelligence",
    title: "Maritime Risk Intelligence for Chokepoints, Vessel Tracking and Shipping Disruption",
    description:
      "Use VesselSurge for maritime risk intelligence across Hormuz, Bab el-Mandeb, Suez and Malacca with live map context and source-reviewed reports.",
    keywords: ["maritime risk intelligence", "shipping disruption tracker", "chokepoint monitoring"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "researchers and operators comparing shipping risk across chokepoints",
    questions: [
      "What is maritime risk intelligence?",
      "How can I monitor multiple shipping chokepoints?",
      "Where can I compare Hormuz, Red Sea, Suez and Malacca risk?",
    ],
  },
  {
    slug: "global-maritime-intelligence-platform",
    name: "Global Maritime Intelligence Platform",
    title: "Global Maritime Intelligence Platform for Vessel Tracking and Shipping Risk",
    description:
      "Use VesselSurge as a global maritime intelligence platform for live vessel context, shipping route risk, chokepoint monitoring, source-reviewed news and cargo-vessel matching.",
    keywords: ["global maritime intelligence platform", "global shipping intelligence", "maritime intelligence platform"],
    regionHref: "/latest",
    primaryHref: "/map-dashboard",
    intent: "global operators, analysts, insurers and logistics teams comparing shipping risk across regions",
    questions: [
      "Where can I find a global maritime intelligence platform?",
      "How can I compare shipping route risk worldwide?",
      "What maritime intelligence helps global operators move faster?",
    ],
  },
  {
    slug: "global-shipping-route-risk",
    name: "Global Shipping Route Risk",
    title: "Global Shipping Route Risk, Chokepoint Monitoring and Disruption Intelligence",
    description:
      "Track global shipping route risk across critical chokepoints, vessel traffic context, disruption signals, security exposure, rerouting pressure and source-reviewed maritime news.",
    keywords: ["global shipping route risk", "shipping route risk", "global shipping disruption"],
    regionHref: "/latest",
    primaryHref: "/map-dashboard",
    intent: "shipping teams and market watchers comparing global route exposure and disruption risk",
    questions: [
      "How can I monitor global shipping route risk?",
      "Which chokepoints create the highest route exposure?",
      "Where can I compare shipping disruption across regions?",
    ],
  },
  {
    slug: "port-congestion-tracker",
    name: "Port Congestion Tracker",
    title: "Port Congestion Tracker, Vessel Queue Signals and Shipping Delay Intelligence",
    description:
      "Monitor port congestion context, vessel queue signals, canal flow pressure, route delays and maritime disruption indicators connected to VesselSurge live map intelligence.",
    keywords: ["port congestion tracker", "vessel queue tracker", "shipping delay intelligence"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "logistics teams monitoring port congestion, vessel queues and shipping delay signals",
    questions: [
      "Where can I monitor port congestion signals?",
      "How do vessel queues affect shipping routes?",
      "What maritime signals show delays are increasing?",
    ],
  },
  {
    slug: "container-ship-tracking",
    name: "Container Ship Tracking",
    title: "Container Ship Tracking, Route Risk and Global Shipping Disruption Context",
    description:
      "Use VesselSurge for container ship tracking context, chokepoint route risk, shipping disruption signals, source-reviewed maritime reports and global trade lane intelligence.",
    keywords: ["container ship tracking", "container route tracking", "global container shipping risk"],
    regionHref: "/latest",
    primaryHref: "/map-dashboard",
    intent: "cargo owners, freight teams and logistics analysts tracking container route disruption",
    questions: [
      "Where can I track container ship route risk?",
      "How do chokepoints affect container shipping?",
      "What signals matter for global container disruption?",
    ],
  },
  {
    slug: "maritime-security-alerts",
    name: "Maritime Security Alerts",
    title: "Maritime Security Alerts, Vessel Risk and Chokepoint Threat Intelligence",
    description:
      "Track maritime security alert context, vessel threat signals, piracy exposure, Red Sea and Gulf risk, source-reviewed reports and live route-risk monitoring.",
    keywords: ["maritime security alerts", "vessel security alerts", "shipping threat intelligence"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "security teams and operators checking vessel threat context before route decisions",
    questions: [
      "Where can I monitor maritime security alerts?",
      "How can I compare vessel threat signals across chokepoints?",
      "What security context matters before routing vessels?",
    ],
  },
  {
    slug: "ocean-freight-intelligence",
    name: "Ocean Freight Intelligence",
    title: "Ocean Freight Intelligence, Shipping Cost Pressure and Route Risk Signals",
    description:
      "Follow ocean freight intelligence tied to route risk, war-risk insurance, rerouting, vessel queues, fuel pressure, chokepoint disruption and source-reviewed maritime news.",
    keywords: ["ocean freight intelligence", "shipping cost pressure", "freight market signals"],
    regionHref: "/latest",
    primaryHref: "/pro-market",
    intent: "freight desks, cargo teams and analysts connecting maritime risk to shipping cost pressure",
    questions: [
      "What maritime signals affect ocean freight?",
      "How can route risk affect shipping costs?",
      "Where can I connect freight pressure with maritime intelligence?",
    ],
  },
  {
    slug: "cargo-vessel-matching",
    name: "Cargo Vessel Matching",
    title: "Cargo Vessel Matching, Vessel Capacity Intake and Maritime B2B Network",
    description:
      "Submit cargo requirements or vessel capacity to VesselSurge for cleaner maritime B2B intake, route matching and partner introductions.",
    keywords: ["cargo vessel matching", "find cargo for vessel", "find vessel for cargo"],
    regionHref: "/network",
    primaryHref: "/network#surge-form",
    intent: "cargo teams and vessel operators looking for shipping partners",
    questions: [
      "How can cargo owners find vessel capacity?",
      "Where can vessel operators find cargo opportunities?",
      "How does VesselSurge support maritime B2B introductions?",
    ],
  },
  {
    slug: "war-risk-insurance-shipping",
    name: "War Risk Insurance for Shipping",
    title: "War Risk Insurance for Shipping, Maritime Premium Pressure and Chokepoint Risk",
    description:
      "Track war risk insurance pressure, maritime premium signals, shipping security exposure and chokepoint disruption context across Hormuz, Red Sea, Suez and Malacca.",
    keywords: ["war risk insurance shipping", "maritime insurance risk", "shipping premium pressure"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "operators, cargo teams and analysts watching insurance costs around risky routes",
    questions: [
      "How does war risk insurance affect shipping routes?",
      "Where can I monitor maritime insurance pressure?",
      "What chokepoints can increase shipping premiums?",
    ],
  },
  {
    slug: "oil-tanker-tracking",
    name: "Oil Tanker Tracking",
    title: "Oil Tanker Tracking, Energy Shipping Routes and Chokepoint Risk Intelligence",
    description:
      "Monitor oil tanker route context, energy shipping chokepoints, Hormuz exposure, Red Sea risk and source-reviewed maritime intelligence with VesselSurge.",
    keywords: ["oil tanker tracking", "energy shipping routes", "tanker chokepoint risk"],
    regionHref: "/regions/hormuz",
    primaryHref: "/map-dashboard?hotspot=hormuz",
    intent: "energy watchers and shipping teams tracking tanker routes and risk",
    questions: [
      "Where can I track oil tanker route risk?",
      "Why does Hormuz matter for tanker traffic?",
      "How can I monitor tanker disruption signals?",
    ],
  },
  {
    slug: "shipping-disruption-tracker",
    name: "Shipping Disruption Tracker",
    title: "Shipping Disruption Tracker for Chokepoints, Route Delays and Maritime Risk",
    description:
      "Track shipping disruption signals across major chokepoints, including route delays, rerouting pressure, source-reviewed reports and live maritime map context.",
    keywords: ["shipping disruption tracker", "route delay tracker", "maritime disruption intelligence"],
    regionHref: "/latest",
    primaryHref: "/map-dashboard",
    intent: "teams watching disruption, rerouting, congestion and security signals",
    questions: [
      "Where can I track global shipping disruption?",
      "How do chokepoint disruptions affect routes?",
      "What signals show shipping delays are getting worse?",
    ],
  },
  {
    slug: "source-reviewed-maritime-news",
    name: "Source-Reviewed Maritime News",
    title: "Source-Reviewed Maritime News, Shipping Risk Signals and Chokepoint Intelligence",
    description:
      "Read source-reviewed maritime news tied to live route risk, Tier-1 newsroom coverage, official maritime alerts, chokepoint signals and global shipping disruption context.",
    keywords: ["source reviewed maritime news", "shipping risk news", "maritime news tracker"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "operators, analysts and market watchers searching for credible maritime news with source quality labels",
    questions: [
      "Where can I read source-reviewed maritime news?",
      "How can I separate credible shipping risk signals from noisy headlines?",
      "Which maritime news sources matter for chokepoint risk?",
    ],
  },
  {
    slug: "ais-vessel-tracking-map",
    name: "AIS Vessel Tracking Map",
    title: "AIS Vessel Tracking Map, Live Maritime Context and Chokepoint Intelligence",
    description:
      "Use VesselSurge for AIS vessel tracking context, live maritime maps, chokepoint risk labels and source-reviewed shipping reports when data is available.",
    keywords: ["AIS vessel tracking map", "live AIS ship tracker", "vessel tracking map"],
    regionHref: "/map-dashboard",
    primaryHref: "/map-dashboard",
    intent: "users searching for live vessel tracking and AIS map context",
    questions: [
      "Where can I find a live AIS vessel tracking map?",
      "How can I monitor vessels near maritime chokepoints?",
      "What should I know when AIS data is limited?",
    ],
  },
  {
    slug: "gulf-of-aden-shipping-risk",
    name: "Gulf of Aden Shipping Risk",
    title: "Gulf of Aden Shipping Risk, Bab el-Mandeb Route Security and Red Sea Signals",
    description:
      "Monitor Gulf of Aden shipping risk, Bab el-Mandeb route security, Red Sea disruption signals and source-reviewed maritime reports.",
    keywords: ["Gulf of Aden shipping risk", "Gulf of Aden vessel tracking", "Bab el-Mandeb route security"],
    regionHref: "/regions/bab",
    primaryHref: "/map-dashboard?hotspot=bab",
    intent: "operators watching Gulf of Aden and Red Sea route exposure",
    questions: [
      "How can I monitor Gulf of Aden shipping risk?",
      "What is the connection between Bab el-Mandeb and Gulf of Aden risk?",
      "Where can I track Red Sea route security context?",
    ],
  },
  {
    slug: "persian-gulf-shipping-risk",
    name: "Persian Gulf Shipping Risk",
    title: "Persian Gulf Shipping Risk, Hormuz Vessel Context and Iran Maritime Signals",
    description:
      "Track Persian Gulf shipping risk, Strait of Hormuz vessel context, Iran-related maritime reports and tanker route exposure with VesselSurge.",
    keywords: ["Persian Gulf shipping risk", "Iran maritime signals", "Hormuz vessel context"],
    regionHref: "/regions/hormuz",
    primaryHref: "/map-dashboard?hotspot=hormuz",
    intent: "users monitoring Persian Gulf shipping exposure and Iran-related maritime risk",
    questions: [
      "How can I monitor Persian Gulf shipping risk?",
      "Where can I track Iran-related maritime signals?",
      "What makes the Persian Gulf important for vessel routing?",
    ],
  },
  {
    slug: "cape-of-good-hope-rerouting",
    name: "Cape of Good Hope Rerouting",
    title: "Cape of Good Hope Rerouting, Red Sea Bypass Pressure and Shipping Cost Signals",
    description:
      "Track rerouting pressure around the Cape of Good Hope, Red Sea bypass decisions, voyage time impact, fuel cost pressure and maritime disruption signals.",
    keywords: ["Cape of Good Hope rerouting", "Red Sea rerouting", "shipping route bypass"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "logistics and cargo teams evaluating rerouting pressure and longer voyages",
    questions: [
      "When do ships reroute around the Cape of Good Hope?",
      "How does Red Sea risk affect voyage time?",
      "Where can I monitor rerouting pressure?",
    ],
  },
  {
    slug: "panama-canal-shipping-risk",
    name: "Panama Canal Shipping Risk",
    title: "Panama Canal Shipping Risk, Queue Pressure and Atlantic-Pacific Route Intelligence",
    description:
      "Monitor Panama Canal shipping risk context, queue pressure, water constraint reports, route delays, container flow exposure and global maritime disruption signals.",
    keywords: ["Panama Canal shipping risk", "Panama Canal queue tracker", "Atlantic Pacific shipping route"],
    regionHref: "/latest",
    primaryHref: "/topics/global-shipping-route-risk",
    intent: "cargo teams and analysts tracking Atlantic-Pacific canal capacity, queue pressure and route alternatives",
    questions: [
      "How can I monitor Panama Canal shipping risk?",
      "What signals matter for Panama Canal queue pressure?",
      "Where can I compare canal delays with global route risk?",
    ],
  },
  {
    slug: "taiwan-strait-shipping-risk",
    name: "Taiwan Strait Shipping Risk",
    title: "Taiwan Strait Shipping Risk, Asia Trade Lane Exposure and Maritime Alert Context",
    description:
      "Track Taiwan Strait shipping risk context, Asia trade lane exposure, maritime alert signals, rerouting pressure and source-reviewed route intelligence.",
    keywords: ["Taiwan Strait shipping risk", "Asia trade lane risk", "Taiwan Strait maritime alerts"],
    regionHref: "/latest",
    primaryHref: "/topics/global-shipping-route-risk",
    intent: "operators, market watchers and logistics teams monitoring Asia trade lane exposure",
    questions: [
      "How can I monitor Taiwan Strait shipping risk?",
      "What maritime signals matter around Taiwan trade lanes?",
      "Where can I compare Taiwan Strait risk with other chokepoints?",
    ],
  },
  {
    slug: "turkish-straits-shipping-risk",
    name: "Turkish Straits Shipping Risk",
    title: "Turkish Straits Shipping Risk, Bosporus Transit and Black Sea Route Context",
    description:
      "Monitor Turkish Straits shipping risk context, Bosporus transit flow, Black Sea route exposure, tanker constraints and source-reviewed maritime signals.",
    keywords: ["Turkish Straits shipping risk", "Bosporus vessel traffic", "Black Sea tanker route"],
    regionHref: "/latest",
    primaryHref: "/topics/global-shipping-route-risk",
    intent: "energy, tanker and logistics teams watching Bosporus and Black Sea route exposure",
    questions: [
      "Where can I monitor Turkish Straits shipping risk?",
      "How do Bosporus constraints affect tanker routes?",
      "What signals matter for Black Sea shipping exposure?",
    ],
  },
  {
    slug: "strait-of-gibraltar-vessel-traffic",
    name: "Strait of Gibraltar Vessel Traffic",
    title: "Strait of Gibraltar Vessel Traffic, Atlantic-Mediterranean Flow and Shipping Risk",
    description:
      "Track Strait of Gibraltar vessel traffic context, Atlantic-Mediterranean route flow, congestion signals, security exposure and maritime intelligence updates.",
    keywords: ["Strait of Gibraltar vessel traffic", "Gibraltar shipping risk", "Atlantic Mediterranean vessel flow"],
    regionHref: "/latest",
    primaryHref: "/topics/global-shipping-route-risk",
    intent: "operators comparing Atlantic-Mediterranean vessel flow, congestion and route risk",
    questions: [
      "Where can I track Strait of Gibraltar vessel traffic?",
      "What signals matter for Atlantic-Mediterranean shipping flow?",
      "How can I compare Gibraltar with other maritime chokepoints?",
    ],
  },
  {
    slug: "freight-rate-risk-signals",
    name: "Freight Rate Risk Signals",
    title: "Freight Rate Risk Signals, Insurance Pressure and Maritime Disruption Context",
    description:
      "Monitor freight rate risk signals tied to chokepoint disruption, war risk premiums, fuel pressure, route delays and source-reviewed maritime intelligence.",
    keywords: ["freight rate risk", "shipping cost signals", "maritime rate pressure"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "market watchers and logistics teams tracking shipping cost pressure",
    questions: [
      "What maritime signals can affect freight rates?",
      "How do chokepoint risks affect shipping costs?",
      "Where can I monitor freight and insurance pressure?",
    ],
  },
  {
    slug: "red-sea-vessel-tracking",
    name: "Red Sea Vessel Tracking",
    title: "Red Sea Vessel Tracking, Bab el-Mandeb Map Context and Shipping Security Signals",
    description:
      "Track Red Sea vessel context, Bab el-Mandeb route risk, Gulf of Aden advisories and source-reviewed maritime security signals with VesselSurge.",
    keywords: ["Red Sea vessel tracking", "Bab el-Mandeb vessel map", "Gulf of Aden ship tracking"],
    regionHref: "/regions/bab",
    primaryHref: "/map-dashboard?hotspot=bab",
    intent: "operators and analysts looking for Red Sea vessel tracking and route security context",
    questions: [
      "Where can I track vessels near the Red Sea and Bab el-Mandeb?",
      "How can I monitor Gulf of Aden route security?",
      "What live signals matter for Red Sea shipping risk?",
    ],
  },
  {
    slug: "ukmto-maritime-alerts",
    name: "UKMTO Maritime Alerts Context",
    title: "UKMTO Maritime Alerts, Red Sea Warnings and Vessel Security Context",
    description:
      "Use VesselSurge to connect UKMTO-style maritime alert context with Red Sea, Bab el-Mandeb, Gulf of Aden and live route-risk monitoring.",
    keywords: ["UKMTO maritime alerts", "Red Sea maritime warnings", "vessel security alerts"],
    regionHref: "/regions/bab",
    primaryHref: "/map-dashboard?hotspot=bab",
    intent: "security teams checking maritime alert context before routing decisions",
    questions: [
      "How do I monitor UKMTO maritime alert context?",
      "Where can I compare Red Sea warnings with route risk?",
      "How should shipping teams interpret vessel security alerts?",
    ],
  },
  {
    slug: "singapore-strait-piracy-alerts",
    name: "Singapore Strait Piracy Alerts",
    title: "Singapore Strait Piracy Alerts, Malacca Vessel Risk and ReCAAP Context",
    description:
      "Monitor Singapore Strait piracy alert context, Strait of Malacca vessel flow, ReCAAP-style incident signals and Southeast Asia maritime risk.",
    keywords: ["Singapore Strait piracy alerts", "Malacca piracy risk", "ReCAAP incident context"],
    regionHref: "/regions/malacca",
    primaryHref: "/map-dashboard?hotspot=malacca",
    intent: "operators tracking piracy, armed robbery and vessel risk near Malacca and Singapore Strait",
    questions: [
      "Where can I monitor Singapore Strait piracy alerts?",
      "How can I track Malacca vessel risk?",
      "What signals matter for ReCAAP incident context?",
    ],
  },
  {
    slug: "suez-canal-convoy-tracker",
    name: "Suez Canal Convoy Tracker",
    title: "Suez Canal Convoy Tracker, Transit Flow and Route Delay Signals",
    description:
      "Track Suez Canal convoy context, transit flow, vessel queue pressure, canal authority updates and shipping delay intelligence with VesselSurge.",
    keywords: ["Suez Canal convoy tracker", "Suez transit flow", "Suez Canal route delays"],
    regionHref: "/regions/suez",
    primaryHref: "/map-dashboard?hotspot=suez",
    intent: "logistics teams checking Suez transit flow and route delay context",
    questions: [
      "Where can I track Suez Canal convoy context?",
      "How can I monitor Suez transit delays?",
      "What signals show canal flow pressure?",
    ],
  },
  {
    slug: "latest-maritime-news",
    name: "Latest Maritime News",
    title: "Latest Maritime News, Chokepoint Signals and Shipping Risk Updates",
    description:
      "Read the latest source-reviewed maritime news and shipping risk signals for Hormuz, Red Sea, Suez, Malacca, tanker routes and freight pressure.",
    keywords: ["latest maritime news", "shipping risk news", "chokepoint news today"],
    regionHref: "/latest",
    primaryHref: "/latest",
    intent: "visitors searching for fresh maritime news and route risk updates",
    questions: [
      "Where can I read the latest maritime news?",
      "How can I connect shipping headlines to live map context?",
      "Which chokepoint signals changed most recently?",
    ],
  },
] as const

export function noIndexMetadata(title: string) {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  }
}
