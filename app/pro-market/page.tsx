'use client';

import Link from 'next/link'
import type { Metadata } from 'next'
import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Activity,
  CheckCircle2,
  LockKeyhole,
  Radar,
} from 'lucide-react'
import { SiteNavigation } from '@/components/site-navigation'
import { Button } from '@/components/ui/button'
import { isAdminEmail } from '@/lib/admin-access'
import { getFallbackUser } from '@/lib/fallback-auth'
import { buildMarketImpactReport, MARKET_PRO_NEWS_MAX_AGE_HOURS, MARKET_PRO_SIGNAL_MAX_AGE_HOURS } from '@/lib/market-impact'
import { getFreshMarketProAnalysisCache, getLastMarketProAnalysisCache, upsertMarketProAnalysisCache } from '@/lib/market-pro-cache'
import { getMarketSnapshot } from '@/lib/market-snapshot'
import { getFreshMaritimeDashboardCache, getLastMaritimeDashboardCache, type MaritimeDashboardResponse } from '@/lib/maritime-dashboard-cache'
import { getUserProSubscription, isActiveProSubscription } from '@/lib/pro-subscription'

export const dynamic = 'force-dynamic'

const BASE_URL = 'https://www.vesselsurge.com'
const FALLBACK_SESSION_COOKIE = 'vesselsurge_fallback_session'

export const metadata: Metadata = {
  title: 'Market Impact Research From Shipping News, Market Pro',
  description: 'Choose stocks, crypto or currencies and compare live prices with source-backed AI market impact views from VesselSurge news and market signals.',
  keywords: [
    'AI market impact research',
    'source-backed market analysis',
    'maritime market impact',
    'AI stock market analysis',
    'crypto market news analysis',
    'currency market outlook',
    'shipping risk stock market impact',
    'maritime market intelligence',
    'oil market shipping risk',
    'tanker stock market analysis',
    'freight rate signals',
    'war-risk insurance shipping',
    'Strait of Hormuz oil risk',
    'Red Sea shipping risk',
    'Suez Canal market impact',
    'Malacca Strait maritime risk',
  ],
  alternates: {
    canonical: 'https://www.vesselsurge.com/pro-market',
  },
  robots: { index: true, follow: true },
}

type Report = ReturnType<typeof buildMarketImpactReport>
type MarketSnapshotReport = NonNullable<Report['marketSnapshot']>
type MarketQuoteReport = MarketSnapshotReport['quotes'][number]
type AssetCategory = 'stocks' | 'crypto' | 'fx'
type OutlookTone = 'positive' | 'caution' | 'wait' | 'neutral'
type InstrumentOutlook = {
  symbol: string
  label: string
  view: string
  reason: string
  expectedMoveLabel: string
  sellString: string
  sellReason: string
  catalyst: string
  facts: Array<{
    label: string
    source: string
    sourceUrl: string | null
    publishedAt: string | null
    region: string
  }>
  // Note: In a real app, we would get this from auth context or API
  // For now, we'll simulate it with a simple check
  authStatus: { 
    user: any | null; 
    hasAccess: boolean 
  }
}

const assetCategories: Array<{ id: AssetCategory; label: string; description: string }> = [
  {
    id: 'stocks',
    label: 'Stocks',
    description: 'Stock indices and shipping stocks',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    description: 'Bitcoin, Ethereum and Solana price moves',
  },
  {
    id: 'fx',
    label: 'Currencies',
    description: 'US dollar and major currency pairs',
  },
]

export default function ProMarketPage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string; asset?: string }>
}) {
  const [params, setParams] = useState<{ checkout?: string; asset?: string }>({})
  const [authStatus, setAuthStatus] = useState<{ user: any | null; hasAccess: boolean }>({ user: null, hasAccess: false })
  const [demoMode, setDemoMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<any>(null)
  
  // Hämta sökparams och auth-status när komponenten monteras
  useEffect(() => {
    const loadData = async () => {
      // Hämta sökparams
      const searchParamsResolved = await searchParams
      setParams(searchParamsResolved)
      
      // I en riktig applikation skulle vi hämta auth-status från en API eller auth-kontext
      // För nu simulerar vi detta
      try {
        const authStatus = await getClientAuthStatus()
        setAuthStatus(authStatus)
      } catch (error) {
        console.error('Failed to load auth status:', error)
        setAuthStatus({ user: null, hasAccess: false })
      }
    }
    
    loadData()
  }, [searchParams])
  
  const selectedCategory = (await (await searchParams)).asset ?? 'stocks'
  
  const handleDemoModeToggle = () => {
    setDemoMode(!demoMode)
  }
  
  // Ladda rapport när auth-status eller demoMode ändras
  useEffect(() => {
    const loadReportIfAllowed = async () => {
      if ((authStatus.hasAccess || demoMode) && authStatus.user) {
        setIsLoading(true)
        try {
          const reportData = await loadReport({ allowDirectDatabaseFallback: true })
          setReport(reportData)
        } catch (error) {
          console.error('Failed to load report:', error)
          setReport(null)
        } finally {
          setIsLoading(false)
        }
      } else {
        setReport(null)
        setIsLoading(false)
      }
    }
    
    loadReportIfAllowed()
  }, [authStatus.hasAccess, demoMode, authStatus.user])

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <SiteNavigation />
      <ProductJsonLd />

      <section className="border-b border-slate-200 bg-white px-4 pb-10 pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                <Radar className="h-4 w-4 text-sky-700" />
                VesselSurge Market Impact Pro
              </div>

              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Live markets beside AI analysis of what maritime news may move next.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Pick stocks, crypto or currencies. The left panel shows live prices; the right panel gives a simple AI market view, expected scenario move, and which VesselSurge news drives the view. No invented breaking news.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {authStatus.hasAccess ? (
                  <span className="inline-flex min-h-11 items-center rounded-md bg-emerald-600 px-4 text-sm font-bold text-white">
                    Pro access active
                  </span>
                ) : authStatus.user ? (
                  <>
                    <form action="/api/stripe/checkout" method="post">
                      <Button type="submit" className="min-h-11 bg-slate-950 text-white hover:bg-slate-800">
                        Unlock full report
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                    <button 
                      onClick={handleDemoModeToggle}
                      className="min-h-11 flex items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-bold text-slate-950 hover:bg-slate-100"
                    >
                      Try free demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link href={proMarketSignUpHref(selectedCategory)}>
                      <Button className="min-h-11 bg-slate-950 text-white hover:bg-slate-800">
                        Create account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={proMarketLoginHref(selectedCategory)}>
                      <Button variant="outline" className="min-h-11 border-slate-300 bg-white text-slate-950">
                        Log in
                      </Button>
                    </Link>
                  </>
                )}
              </div>

            </div>

            <div>
              <PricingCard hasAccess={authStatus.hasAccess} isLoggedIn={Boolean(authStatus.user)} selectedCategory={selectedCategory} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        {isLoading ? (
          <LoadingSkeleton />
        ) : report ? (
          <UnlockedReport report={report} selectedCategory={selectedCategory} />
        ) : (
          <LockedAnalysisSection 
            isLoggedIn={Boolean(authStatus.user)} 
            selectedCategory={selectedCategory} 
            demoMode={demoMode} 
          />
        )}
      </section>
    </main>
  )
}

// Hjälpfunktion för att simulera klient-sidig auth-status
// I en riktig applikation skulle detta komma från ett auth-bibliotek eller API
async function getClientAuthStatus() {
  // Detta är en förenklad implementation
  // I verkligheten skulle detta troligen vara ett anrop till ett auth-API
  // eller använda kontext från ett auth-bibliotek som NextAuth.js
  
  // För demo-syfte, låt oss anta att vi inte har någon autentiserad användare
  // och att användaren måste logga in eller registrera sig
  return {
    user: null,
    hasAccess: false
  }
}

// Rest of the file remains unchanged...