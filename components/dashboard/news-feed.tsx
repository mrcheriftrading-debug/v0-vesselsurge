"use client"

import { useState, useEffect } from "react"
import { Newspaper, ExternalLink, Clock, AlertCircle, TrendingUp, Globe, RefreshCw } from "lucide-react"

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  timestamp: Date
  category: "shipping" | "geopolitical" | "oil" | "security"
  url?: string
}

// Simulated news data - In production, this would come from a news API
const generateNews = (): NewsItem[] => {
  const now = new Date()
  
  const newsTemplates: Omit<NewsItem, "id" | "timestamp">[] = [
    {
      title: "Oil tanker traffic through Strait of Hormuz reaches monthly high",
      summary: "Over 21 million barrels of crude oil passed through the strategic waterway yesterday, marking the highest daily volume this month.",
      source: "Reuters",
      category: "oil",
      url: "https://www.reuters.com/business/energy/",
    },
    {
      title: "Iran conducts naval exercises near shipping lanes",
      summary: "Iranian Revolutionary Guard forces began scheduled military drills in the Persian Gulf, though officials say commercial traffic remains unaffected.",
      source: "AP News",
      category: "geopolitical",
      url: "https://apnews.com/hub/iran",
    },
    {
      title: "Lloyd's of London adjusts insurance premiums for Gulf transit",
      summary: "War risk insurance rates for vessels transiting the Strait of Hormuz have been adjusted following recent regional developments.",
      source: "Financial Times",
      category: "shipping",
      url: "https://www.ft.com/shipping",
    },
    {
      title: "U.S. Fifth Fleet increases patrols in Persian Gulf",
      summary: "Additional naval assets deployed to ensure freedom of navigation through critical shipping lanes.",
      source: "Defense News",
      category: "security",
      url: "https://www.defensenews.com/naval/",
    },
    {
      title: "OPEC+ monitoring Hormuz transit volumes amid supply concerns",
      summary: "Energy ministers express confidence in supply chain stability despite regional tensions.",
      source: "Bloomberg",
      category: "oil",
      url: "https://www.bloomberg.com/energy",
    },
    {
      title: "Container shipping lines reroute vessels around Gulf tensions",
      summary: "Major carriers announce temporary diversions adding 2-3 days to Asia-Europe routes.",
      source: "Splash247",
      category: "shipping",
      url: "https://splash247.com/",
    },
    {
      title: "UAE ports report normal operations despite regional alerts",
      summary: "Port of Fujairah and Jebel Ali continue 24/7 operations with enhanced security measures in place.",
      source: "TradeArabia",
      category: "shipping",
      url: "https://www.tradearabia.com/",
    },
    {
      title: "Brent crude rises on Hormuz transit concerns",
      summary: "Oil prices tick up 1.2% as traders monitor developments in the strategic waterway handling 20% of global oil trade.",
      source: "CNBC",
      category: "oil",
      url: "https://www.cnbc.com/oil/",
    },
  ]

  // Shuffle and pick 5-6 news items
  const shuffled = [...newsTemplates].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 5 + Math.floor(Math.random() * 2))

  return selected.map((item, index) => ({
    ...item,
    id: `news-${index}`,
    timestamp: new Date(now.getTime() - index * (15 + Math.random() * 45) * 60 * 1000), // Staggered times
  }))
}

const categoryStyles: Record<NewsItem["category"], { icon: typeof Newspaper; color: string; bg: string }> = {
  shipping: { icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  geopolitical: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  oil: { icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
  security: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

export function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchNews = () => {
    setIsLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      setNews(generateNews())
      setLastRefresh(new Date())
      setIsLoading(false)
    }, 800)
  }

  useEffect(() => {
    fetchNews()
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass flex h-full flex-col rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Regional News</span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Updated {formatTimeAgo(lastRefresh)}
            </span>
          )}
          <button
            onClick={fetchNews}
            disabled={isLoading}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && news.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading news...</span>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {news.map((item) => {
              const style = categoryStyles[item.category]
              const Icon = style.icon
              
              return (
                <a 
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <article className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-md border p-1.5 ${style.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {item.source}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(item.timestamp)}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Read more
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                </a>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <p className="text-center text-xs text-muted-foreground">
          Simulated news for demo purposes
        </p>
      </div>
    </div>
  )
}
