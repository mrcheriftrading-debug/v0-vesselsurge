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
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

export function NewsFeed() {
  const { articles, loading, error, refresh, lastUpdated } = useMaritimeData()

  // Get 25 latest articles
  const latestArticles = articles.slice(0, 25)

  return (
    <div className="glass flex h-full flex-col rounded-lg border border-border">
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
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {article.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          {article.source}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(article.timestamp)}
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

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <p className="text-center text-xs text-muted-foreground">
          Real-time maritime news from Supabase
        </p>
      </div>
    </div>
  )
}
