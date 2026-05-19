import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, FileText, Map, Radar, Search, ShieldAlert } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { SiteNavigation } from "@/components/site-navigation"
import { BASE_URL, trafficTopicPages } from "@/lib/seo"

type TopicSlug = (typeof trafficTopicPages)[number]["slug"]

type TopicPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return trafficTopicPages.map((topic) => ({ slug: topic.slug }))
}

function getTopic(slug: string) {
  return trafficTopicPages.find((topic) => topic.slug === slug)
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopic(slug)
  if (!topic) return {}

  const url = `${BASE_URL}/topics/${topic.slug}`

  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: url },
    keywords: [...topic.keywords, "VesselSurge", "live maritime map", "source-reviewed maritime reports"],
    openGraph: {
      type: "article",
      url,
      siteName: "VesselSurge",
      title: topic.title,
      description: topic.description,
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: `${topic.name} from VesselSurge` }],
    },
    twitter: {
      card: "summary_large_image",
      title: topic.title,
      description: topic.description,
      images: [`${BASE_URL}/og-image.jpg`],
    },
  }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params
  const topic = getTopic(slug as TopicSlug)
  if (!topic) notFound()

  const topicUrl = `${BASE_URL}/topics/${topic.slug}`
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${topicUrl}#webpage`,
        url: topicUrl,
        name: topic.title,
        description: topic.description,
        isPartOf: { "@id": `${BASE_URL}/#website` },
        about: topic.keywords.map((keyword) => ({ "@type": "Thing", name: keyword })),
      },
      {
        "@type": "FAQPage",
        "@id": `${topicUrl}#faq`,
        mainEntity: topic.questions.map((question) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: `VesselSurge helps ${topic.intent} by combining live map context, source-reviewed maritime reports, route risk labels and relevant chokepoint pages.`,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Topics", item: `${BASE_URL}/topics/${topic.slug}` },
          { "@type": "ListItem", position: 3, name: topic.name, item: topicUrl },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNavigation />
      <main className="pt-16">
        <section className="border-b border-border bg-gradient-to-b from-[#071020] to-background px-4 py-14 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">
                <Search className="h-3.5 w-3.5" />
                Maritime topic guide
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {topic.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                {topic.description} This page is built for {topic.intent}, with direct paths into VesselSurge live map, intelligence and regional context.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={topic.primaryHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Open relevant tool <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/latest" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.04]">
                  Read intelligence <FileText className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card/55 p-5">
              <div className="grid gap-3">
                {[
                  { label: "Primary intent", value: topic.intent, icon: Radar },
                  { label: "Live context", value: "Map, source reports and risk labels", icon: Map },
                  { label: "Search focus", value: topic.keywords.join(", "), icon: ShieldAlert },
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
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <div className="mb-3 font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">Questions answered</div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Capture the search before it becomes a decision.</h2>
              <p className="mt-3 text-muted-foreground">
                Each topic page gives Google, AI assistants and human visitors a clear path from query to VesselSurge action.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {topic.questions.map((question) => (
                <div key={question} className="rounded-lg border border-border bg-card/50 p-4">
                  <h3 className="text-base font-bold text-foreground">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Use VesselSurge to connect this question with live map context, maritime reports and operational route risk.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card px-4 py-12 sm:py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            <Link href={topic.primaryHref} className="group rounded-xl border border-border bg-background/50 p-5 transition-all hover:-translate-y-1 hover:border-primary/30">
              <Map className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Live map</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Jump from search intent to the relevant VesselSurge monitoring view.</p>
            </Link>
            <Link href={topic.regionHref} className="group rounded-xl border border-border bg-background/50 p-5 transition-all hover:-translate-y-1 hover:border-primary/30">
              <Radar className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Regional context</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Open the matching region, topic or network page for deeper context.</p>
            </Link>
            <Link href="/search" className="group rounded-xl border border-border bg-background/50 p-5 transition-all hover:-translate-y-1 hover:border-primary/30">
              <Search className="h-6 w-6 text-emerald-300" />
              <h2 className="mt-4 text-xl font-bold text-foreground">Search reports</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Search source-reviewed maritime news and route-specific signals.</p>
            </Link>
          </div>
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SiteFooter />
    </div>
  )
}
