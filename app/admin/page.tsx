'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Plus, Trash2, Edit2, Toggle2 } from 'lucide-react'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

type Tab = 'news' | 'alerts' | 'stats'

interface NewsArticle {
  id: string
  title: string
  url: string
  source: string
  snippet: string
  topic: string
  is_active: boolean
  published_at: string
}

interface Alert {
  id: string
  hotspot_id: string
  severity: string
  message: string
  source: string
  is_active: boolean
  created_at: string
}

interface Stat {
  id: string
  hotspot_id: string
  daily_transits: number
  avg_wait_time_hours: number
  market_volume_usd: number
  risk_level: string
  updated_at: string
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('news')
  const [loading, setLoading] = useState(false)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<Stat[]>([])

  useEffect(() => {
    loadData()
  }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'news') {
        const { data } = await supabase.from('news_articles').select('*').order('published_at', { ascending: false })
        setNews(data || [])
      } else if (tab === 'alerts') {
        const { data } = await supabase.from('hotspot_alerts').select('*').order('created_at', { ascending: false })
        setAlerts(data || [])
      } else if (tab === 'stats') {
        const { data } = await supabase.from('hotspot_stats').select('*')
        setStats(data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  async function toggleActive(table: string, id: string, currentActive: boolean) {
    try {
      await supabase.from(table).update({ is_active: !currentActive }).eq('id', id)
      loadData()
    } catch (error) {
      console.error('Error updating:', error)
    }
  }

  async function deleteItem(table: string, id: string) {
    try {
      await supabase.from(table).delete().eq('id', id)
      loadData()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage maritime intelligence content</p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {(['news', 'alerts', 'stats'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium transition-colors capitalize ${
                tab === t
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass rounded-2xl border border-border p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : tab === 'news' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">News Articles ({news.length})</h2>
                <button className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Article
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {news.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{article.title}</p>
                      <p className="text-xs text-muted-foreground">{article.source} • {article.topic}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive('news_articles', article.id, article.is_active)} className="p-2 hover:bg-muted rounded">
                        <Toggle2 className={`h-4 w-4 ${article.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                      </button>
                      <button className="p-2 hover:bg-muted rounded">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteItem('news_articles', article.id)} className="p-2 hover:bg-red-500/10 rounded">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : tab === 'alerts' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Security Alerts ({alerts.length})</h2>
                <button className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Alert
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.source} • {alert.hotspot_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        alert.severity === 'critical' ? 'bg-red-500/20 text-red-700' :
                        alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-700' :
                        'bg-blue-500/20 text-blue-700'
                      }`}>
                        {alert.severity}
                      </span>
                      <button onClick={() => toggleActive('hotspot_alerts', alert.id, alert.is_active)} className="p-2 hover:bg-muted rounded">
                        <Toggle2 className={`h-4 w-4 ${alert.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                      </button>
                      <button onClick={() => deleteItem('hotspot_alerts', alert.id)} className="p-2 hover:bg-red-500/10 rounded">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Hotspot Statistics ({stats.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {stats.map((stat) => (
                  <div key={stat.id} className="p-4 border border-border rounded-lg">
                    <h3 className="font-bold capitalize mb-3">{stat.hotspot_id}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily Transits:</span>
                        <span className="font-semibold">{stat.daily_transits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wait Time (hrs):</span>
                        <span className="font-semibold">{stat.avg_wait_time_hours.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volume (USD):</span>
                        <span className="font-semibold">${(stat.market_volume_usd / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <span className={`font-semibold capitalize ${
                          stat.risk_level === 'critical' ? 'text-red-600' :
                          stat.risk_level === 'high' ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {stat.risk_level}
                        </span>
                      </div>
                    </div>
                    <button className="w-full mt-4 py-2 rounded border border-border hover:bg-muted transition-colors flex items-center justify-center gap-2">
                      <Edit2 className="h-4 w-4" />
                      Update
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground">
            <strong>Note:</strong> Changes are live immediately. The site caches data for 1 hour, so updates may take a few minutes to appear to visitors.
          </p>
        </div>
      </div>
    </div>
  )
}
