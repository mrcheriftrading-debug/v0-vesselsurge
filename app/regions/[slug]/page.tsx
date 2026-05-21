import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Clock, Globe2, Map, Newspaper, ShieldAlert, Ship } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"

const BASE_URL = "https://www.vesselsurge.com"

const regions = {
  hormuz: {
    name: "Strait of Hormuz",
    title: "Strait of Hormuz Live Vessel Traffic, Risk Alerts and Maritime Intelligence",
    description:
      "Track Strait of Hormuz vessel traffic, tanker movements, Iran maritime risk signals, oil shipping disruption reports and live security alerts with VesselSurge.",
    eyebrow: "Persian Gulf chokepoint",
    statusFocus: "oil tanker traffic, Iran tension, Gulf of Oman shipping, naval advisories",
    riskDrivers: ["Iran and Persian Gulf security tension", "oil tanker route concentration", "naval activity and sanctions news", "Gulf of Oman disruption signals"],
    searchQuestions: [
      "What is happening in the Strait of Hormuz today?",
      "How many vessels are active near Hormuz?",
      "Is Hormuz shipping traffic disrupted?",
      "Where can I track oil tanker movement in the Persian Gulf?",
    ],
    summary:
      "The Strait of Hormuz is the most watched oil chokepoint in the world. VesselSurge organizes live map context, recent reports, source counts and risk labels so operators can separate verified maritime signals from noise.",
    coordinates: "26.5667 N, 56.2500 E",
    latitude: 26.5667,
    longitude: 56.25,
    mapHref: "/map-dashboard?hotspot=hormuz",
    priorityKeyword: "Strait of Hormuz live vessel tracking",
  },
  bab: {
    name: "Bab el-Mandeb",
    title: "Bab el-Mandeb and Red Sea Shipping Risk, Vessel Traffic and Security Alerts",
    description:
      "Monitor Bab el-Mandeb, Red Sea and Gulf of Aden maritime risk with live vessel context, Houthi disruption signals, security alerts and source-reviewed news.",
    eyebrow: "Red Sea gateway",
    statusFocus: "Red Sea traffic, Gulf of Aden advisories, Houthi attack risk, rerouting signals",
    riskDrivers: ["Red Sea security advisories", "Houthi maritime incident reports", "Gulf of Aden routing changes", "commercial vessel attack risk"],
    searchQuestions: [
      "Is Bab el-Mandeb safe for shipping today?",
      "Are vessels rerouting around the Red Sea?",
      "What are the latest Houthi maritime alerts?",
      "Where can I monitor Gulf of Aden shipping risk?",
    ],
    summary:
      "Bab el-Mandeb links the Red Sea with the Gulf of Aden and is central to Europe-Asia shipping exposure. VesselSurge keeps the latest risk reports tied to map context and traffic indicators.",
    coordinates: "12.5833 N, 43.3333 E",
    latitude: 12.5833,
    longitude: 43.3333,
    mapHref: "/map-dashboard?hotspot=bab",
    priorityKeyword: "Bab el-Mandeb shipping risk tracker",
  },
  suez: {
    name: "Suez Canal",
    title: "Suez Canal Live Traffic, Transit Risk and Maritime Intelligence",
    description:
      "Follow Suez Canal traffic, transit risk, maritime reports, vessel queues and shipping disruption context with VesselSurge live intelligence.",
    eyebrow: "Europe-Asia transit corridor",
    statusFocus: "canal transit flow, queue signals, Egypt shipping news, Red Sea knock-on effects",
    riskDrivers: ["canal congestion and vessel queue changes", "Egypt maritime authority updates", "weather and grounding risk", "Red Sea route disruption spillover"],
    searchQuestions: [
      "Is the Suez Canal delayed today?",
      "How can I monitor Suez Canal traffic?",
      "Are there vessel queues near Suez?",
      "What maritime news affects Suez transits?",
    ],
    summary:
      "The Suez Canal is a key shortcut between Europe and Asia. VesselSurge combines transit-related news, risk notes and live map context to help users understand disruptions before they become delays.",
    coordinates: "30.5852 N, 32.2654 E",
    latitude: 30.5852,
    longitude: 32.2654,
    mapHref: "/map-dashboard?hotspot=suez",
    priorityKeyword: "Suez Canal live traffic tracker",
  },
  malacca: {
    name: "Strait of Malacca",
    title: "Strait of Malacca Vessel Traffic, Piracy Alerts and Maritime Intelligence",
    description:
      "Track Strait of Malacca and Singapore Strait vessel traffic, congestion signals, piracy alerts, ReCAAP-style incident context and live maritime risk.",
    eyebrow: "Southeast Asia shipping lane",
    statusFocus: "Singapore Strait traffic, piracy alerts, congestion, Malaysia and Indonesia route exposure",
    riskDrivers: ["Singapore Strait vessel density", "piracy and armed robbery alerts", "port congestion signals", "Malaysia-Indonesia traffic concentration"],
    searchQuestions: [
      "How busy is the Strait of Malacca today?",
      "Are there piracy alerts in the Singapore Strait?",
      "Where can I track Malacca Strait vessel traffic?",
      "What is the latest maritime risk near Malaysia and Singapore?",
    ],
    summary:
      "The Strait of Malacca is one of the busiest commercial shipping lanes. VesselSurge tracks active vessel context, piracy-related reports and congestion signals for clearer maritime monitoring.",
    coordinates: "2.5000 N, 101.0000 E",
    latitude: 2.5,
    longitude: 101,
    mapHref: "/map-dashboard?hotspot=malacca",
    priorityKeyword: "Strait of Malacca vessel traffic tracker",
  },
  panama: {
    name: "Panama Canal",
    title: "Panama Canal Shipping Risk, Queue Pressure and Transit Intelligence",
    description:
      "Monitor Panama Canal transit risk, queue pressure, water constraint reports, draft limits, container flow exposure and live maritime route intelligence with VesselSurge.",
    eyebrow: "Atlantic-Pacific canal route",
    statusFocus: "canal transits, water constraints, reservation slots, vessel queues and container route exposure",
    riskDrivers: ["water level and draft constraints", "reservation slot and transit queue pressure", "container and LNG route exposure", "Atlantic-Pacific route alternatives"],
    searchQuestions: [
      "How can I monitor Panama Canal shipping risk today?",
      "Are Panama Canal queues or draft limits affecting vessels?",
      "What signals matter for Panama Canal transit pressure?",
      "Where can I compare Panama Canal risk with other chokepoints?",
    ],
    summary:
      "The Panama Canal is a key Atlantic-Pacific shortcut. VesselSurge tracks source-reviewed transit context, queue pressure and water-constraint signals so operators can understand route risk without relying on scattered headlines.",
    coordinates: "9.0800 N, 79.6800 W",
    latitude: 9.08,
    longitude: -79.68,
    mapHref: "/map-dashboard?hotspot=panama",
    priorityKeyword: "Panama Canal shipping risk tracker",
  },
  taiwan: {
    name: "Taiwan Strait",
    title: "Taiwan Strait Shipping Risk, Asia Trade Lane Exposure and Maritime Alerts",
    description:
      "Track Taiwan Strait shipping risk, Asia trade lane exposure, port continuity, naval alert context and live maritime intelligence with VesselSurge.",
    eyebrow: "Asia trade lane exposure",
    statusFocus: "Asia cargo continuity, maritime alerts, port exposure, naval activity and rerouting context",
    riskDrivers: ["Asia trade lane continuity", "naval exercise and maritime alert language", "Taiwan port exposure", "container and electronics supply-chain sensitivity"],
    searchQuestions: [
      "How can I monitor Taiwan Strait shipping risk?",
      "What maritime signals matter around Taiwan trade lanes?",
      "Are Asia cargo routes exposed to Taiwan Strait disruption?",
      "Where can I compare Taiwan Strait risk with other routes?",
    ],
    summary:
      "The Taiwan Strait matters for Asia cargo continuity and market-sensitive supply chains. VesselSurge keeps source-reviewed maritime signals separate from broad political noise and shows when no fresh source-backed disruption is found.",
    coordinates: "24.4000 N, 120.8000 E",
    latitude: 24.4,
    longitude: 120.8,
    mapHref: "/map-dashboard?hotspot=taiwan",
    priorityKeyword: "Taiwan Strait shipping risk tracker",
  },
  turkish: {
    name: "Turkish Straits",
    title: "Turkish Straits Shipping Risk, Bosporus Transit and Black Sea Route Context",
    description:
      "Monitor Turkish Straits, Bosporus and Dardanelles shipping risk, tanker transit constraints, Black Sea route exposure and live maritime intelligence.",
    eyebrow: "Black Sea transit gateway",
    statusFocus: "Bosporus transit flow, Dardanelles traffic, tanker constraints, weather delays and Black Sea route exposure",
    riskDrivers: ["Bosporus and Dardanelles transit constraints", "Black Sea tanker route exposure", "weather-related closures or delays", "grain, oil and cargo flow sensitivity"],
    searchQuestions: [
      "Where can I monitor Turkish Straits shipping risk?",
      "Are Bosporus or Dardanelles transits delayed today?",
      "How do Turkish Straits constraints affect tanker routes?",
      "What signals matter for Black Sea shipping exposure?",
    ],
    summary:
      "The Turkish Straits connect the Black Sea with global maritime markets. VesselSurge tracks transit, traffic and source-reviewed route context for teams watching tanker, grain and cargo exposure.",
    coordinates: "41.0800 N, 29.0500 E",
    latitude: 41.08,
    longitude: 29.05,
    mapHref: "/map-dashboard?hotspot=turkish",
    priorityKeyword: "Turkish Straits shipping risk tracker",
  },
  gibraltar: {
    name: "Strait of Gibraltar",
    title: "Strait of Gibraltar Vessel Traffic, Port Flow and Shipping Risk Intelligence",
    description:
      "Track Strait of Gibraltar vessel traffic, Atlantic-Mediterranean flow, port context, congestion signals, security exposure and live maritime intelligence.",
    eyebrow: "Atlantic-Mediterranean gateway",
    statusFocus: "vessel density, Atlantic-Mediterranean flow, Gibraltar and Algeciras port context, congestion and security signals",
    riskDrivers: ["Atlantic-Mediterranean vessel flow", "Gibraltar and Algeciras port exposure", "bunker and port congestion context", "security or traffic incident signals"],
    searchQuestions: [
      "Where can I track Strait of Gibraltar vessel traffic?",
      "What signals matter for Atlantic-Mediterranean shipping flow?",
      "Is Gibraltar vessel flow congested today?",
      "How can I compare Gibraltar with other maritime chokepoints?",
    ],
    summary:
      "The Strait of Gibraltar is a dense gateway between the Atlantic and Mediterranean. VesselSurge organizes vessel-flow context, port exposure and source-reviewed maritime risk for fast operational scanning.",
    coordinates: "35.9600 N, 5.6000 W",
    latitude: 35.96,
    longitude: -5.6,
    mapHref: "/map-dashboard?hotspot=gibraltar",
    priorityKeyword: "Strait of Gibraltar vessel traffic tracker",
  },
  cape: {
    name: "Cape of Good Hope",
    title: "Cape of Good Hope Rerouting, Red Sea Bypass Pressure and Maritime Intelligence",
    description:
      "Monitor Cape of Good Hope rerouting pressure, Red Sea bypass decisions, voyage time impact, fuel cost exposure and live maritime risk intelligence.",
    eyebrow: "Red Sea bypass route",
    statusFocus: "rerouting pressure, longer voyage times, fuel exposure, container and tanker route alternatives",
    riskDrivers: ["Red Sea bypass and rerouting pressure", "longer voyage time and bunker cost exposure", "container and tanker route alternatives", "Cape weather and sailing context"],
    searchQuestions: [
      "When do ships reroute around the Cape of Good Hope?",
      "How does Red Sea risk affect voyage time and fuel costs?",
      "Where can I monitor Cape of Good Hope rerouting pressure?",
      "How can I compare Cape rerouting with Suez and Bab el-Mandeb risk?",
    ],
    summary:
      "The Cape of Good Hope becomes more important when Red Sea or Suez risk pushes vessels onto longer routes. VesselSurge tracks rerouting pressure, source-reviewed news and live map context for the bypass lane.",
    coordinates: "34.3600 S, 18.4700 E",
    latitude: -34.36,
    longitude: 18.47,
    mapHref: "/map-dashboard?hotspot=cape",
    priorityKeyword: "Cape of Good Hope rerouting tracker",
  },
} as const

type RegionSlug = keyof typeof regions

export function generateStaticParams() {
  return Object.keys(regions).map((slug) => ({ slug }))
}

type RegionPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { slug } = await params
  const region = regions[slug as RegionSlug]
  if (!region) return {}

  const url = `${BASE_URL}/regions/${slug}`

  return {
    title: region.title,
    description: region.description,
    alternates: { canonical: url },
    keywords: [
      region.priorityKeyword,
      `${region.name} live map`,
      `${region.name} vessel traffic`,
      `${region.name} shipping risk`,
      "maritime intelligence",
      "live vessel tracking",
    ],
    openGraph: {
      type: "article",
      url,
      siteName: "VesselSurge",
      title: region.title,
      description: region.description,
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: `${region.name} maritime intelligence from VesselSurge` }],
    },
    twitter: {
      card: "summary_large_image",
      title: region.title,
      description: region.description,
      images: [`${BASE_URL}/og-image.jpg`],
    },
  }
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { slug } = await params
  const region = regions[slug as RegionSlug]
  if (!region) notFound()

  const regionUrl = `${BASE_URL}/regions/${slug}`
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${regionUrl}#webpage`,
        url: regionUrl,
        name: region.title,
        description: region.description,
        isPartOf: { "@id": `${BASE_URL}/#website` },
        about: [
          {
            "@type": "Place",
            name: region.name,
            geo: {
              "@type": "GeoCoordinates",
              latitude: region.latitude,
              longitude: region.longitude,
            },
          },
          { "@type": "Thing", name: "Maritime intelligence" },
          { "@type": "Thing", name: "Vessel tracking" },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${regionUrl}#faq`,
        mainEntity: region.searchQuestions.map((question) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Use VesselSurge to monitor ${region.name}. The platform combines live map context, current risk labels, vessel indicators and recent maritime reports for ${region.statusFocus}.`,
          },
        })),
      },
      {
        "@type": "Dataset",
        "@id": `${regionUrl}#dataset`,
        name: `${region.name} maritime intelligence feed`,
        description: `Source-reviewed maritime reports and live vessel context for ${region.name}.`,
        creator: { "@type": "Organization", name: "VesselSurge", url: BASE_URL },
        license: `${BASE_URL}/about`,
        spatialCoverage: {
          "@type": "Place",
          name: region.name,
          geo: {
            "@type": "GeoCoordinates",
            latitude: region.latitude,
            longitude: region.longitude,
          },
        },
        isAccessibleForFree: true,
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">
                <Globe2 className="h-3.5 w-3.5" />
                {region.eyebrow}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {region.name} live maritime intelligence
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {region.summary}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={region.mapHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Open live map <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/latest" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.04]">
                  Read latest intelligence
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/55 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Primary query", value: region.priorityKeyword, icon: Map },
                  { label: "Coordinates", value: region.coordinates, icon: Globe2 },
                  { label: "Update pattern", value: "Live map and latest reports", icon: Clock },
                  { label: "Signal focus", value: region.statusFocus, icon: ShieldAlert },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-lg border border-border bg-background/55 p-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
                    <div className="mt-1 text-sm font-semibold leading-6 text-foreground">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Risk drivers</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">What VesselSurge watches for {region.name}</h2>
              <p className="mt-3 text-muted-foreground">
                These are the signals our live map and intelligence feed organize for faster research and operational awareness.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {region.riskDrivers.map((driver) => (
                <div key={driver} className="rounded-lg border border-border bg-card/50 p-4">
                  <ShieldAlert className="h-5 w-5 text-accent" />
                  <h3 className="mt-3 text-base font-bold text-foreground">{driver}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Questions this page answers</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {region.searchQuestions.map((question) => (
                <div key={question} className="rounded-lg border border-border bg-background/50 p-4 text-sm font-semibold text-foreground">
                  {question}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-xl border border-primary/20 bg-primary/10 p-6 sm:p-8">
            <Ship className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-foreground">Use the live map for current vessel context.</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              This landing page gives search engines and AI assistants a stable explanation of {region.name}. For current traffic, alerts and selected reports, open the live map.
            </p>
            <Link href={region.mapHref} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
              View {region.name} on VesselSurge <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteFooter />
    </div>
  )
}
