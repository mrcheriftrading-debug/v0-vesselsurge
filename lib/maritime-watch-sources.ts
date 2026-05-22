import { MARITIME_SEARCH_FEEDS } from './maritime-search-feeds'
import type { MaritimeSearchRegion } from './maritime-search-feeds'
import { OFFICIAL_MARITIME_WATCH_SOURCES } from './maritime-official-watch-sources'

export type MaritimeWatchSource = {
  source: string
  url: string
  kind: 'rss' | 'html'
  regionHint?: MaritimeSearchRegion
}

export const MARITIME_WATCH_SOURCES: MaritimeWatchSource[] = [
  ...MARITIME_SEARCH_FEEDS.map((feed) => ({
    source: feed.source,
    url: feed.url,
    kind: 'rss' as const,
    regionHint: feed.regionHint,
  })),
  ...OFFICIAL_MARITIME_WATCH_SOURCES,
]
