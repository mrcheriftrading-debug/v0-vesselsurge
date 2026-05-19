'use client'

import { Newspaper, ExternalLink, Clock, AlertCircle, TrendingUp, Globe, RefreshCw } from 'lucide-react'
import { useMaritimeData } from '@/lib/use-maritime-data'

const categoryStyles: Record<string, { icon: typeof Newspaper; color: string; bg: string }> = {
  shipping: { icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  geopolitical: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  security: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  industry: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  port: { icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  regulatory: { icon: AlertCircle, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
}

function formatTimeAgo(date: string): string {
  const publishedAt = new Date(date)
  if (Number.isNaN(publishedAt.getTime())) return 'Publication time unavailable'

  const now = new Date()
  const diffMs = now.getTime() - publishedAt.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

function formatPublishedTime(date: string): string {
  const publishedAt = new Date(date)
  if (Number.isNaN(publishedAt.getTime())) return 'Published time unavailable'

  return publishedAt.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLastUpdated(date: Date | null) {
  if (!date) return 'Not updated yet'
  return `Updated ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export function NewsFeed() {
  const { articles, meta, loading, error, refresh, lastUpdated } = useMaritimeData()
  const latestArticles = articles.slice(0, 25)
  const isStale = Boolean(meta?.stale)

  return (
    <div className="glass flex h-full flex-col rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Maritime Intelligence Feed</h3>
            <p className="text-xs text-muted-foreground">{isStale ? 'Last known source-reviewed feed' : formatLastUpdated(lastUpdated)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          aria-label="Refresh maritime news"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && latestArticles.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            Loading maritime intelligence...
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-destructive">{error}</div>
        ) : latestArticles.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            No maritime intelligence reports are available yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {latestArticles.map((article) => {
              const style = categoryStyles[article.category] ?? categoryStyles.industry
              const Icon = style.icon

              return (
                <a
                  key={article.id}
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <article className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-md border p-1.5 ${style.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {article.title}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {article.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {article.source}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground" title={`Published ${formatPublishedTime(article.timestamp)}`}>
                          <Clock className="h-3 w-3" />
                          Published {formatTimeAgo(article.timestamp)} · {formatPublishedTime(article.timestamp)}
                        </span>
                        {article.isBreaking && (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            BREAKING
                          </span>
                        )}
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

      <div className="border-t border-border px-4 py-2">
        <p className="text-center text-xs text-muted-foreground">
          {isStale ? 'Offline-safe: serving last known source-reviewed maritime news' : 'Real-time maritime news from Supabase'}
        </p>
      </div>
    </div>
  )
}
