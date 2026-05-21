-- Expand VesselSurge live-map region constraints beyond the original four hotspots.

ALTER TABLE public.maritime_signals
  DROP CONSTRAINT IF EXISTS maritime_signals_region_check;

ALTER TABLE public.maritime_signals
  ADD CONSTRAINT maritime_signals_region_check
  CHECK (region IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'));

ALTER TABLE public.maritime_signals
  DROP CONSTRAINT IF EXISTS maritime_signals_signal_type_check;

ALTER TABLE public.maritime_signals
  ADD CONSTRAINT maritime_signals_signal_type_check
  CHECK (signal_type IN ('official_alert', 'navigation_warning', 'ais_anomaly', 'weather_constraint', 'news_corroboration', 'source_sweep'));

ALTER TABLE public.news_articles
  DROP CONSTRAINT IF EXISTS news_articles_topic_check;

ALTER TABLE public.news_articles
  ADD CONSTRAINT news_articles_topic_check
  CHECK (topic IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape', 'global'));

ALTER TABLE public.hotspot_stats
  DROP CONSTRAINT IF EXISTS hotspot_stats_hotspot_check;

ALTER TABLE public.hotspot_stats
  ADD CONSTRAINT hotspot_stats_hotspot_check
  CHECK (hotspot IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'));

WITH duplicate_news AS (
  SELECT
    ctid,
    ROW_NUMBER() OVER (
      PARTITION BY url
      ORDER BY published_at DESC NULLS LAST, updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    ) AS row_number
  FROM public.news_articles
  WHERE url IS NOT NULL
)
DELETE FROM public.news_articles
WHERE ctid IN (SELECT ctid FROM duplicate_news WHERE row_number > 1);

ALTER TABLE public.news_articles
  DROP CONSTRAINT IF EXISTS news_articles_url_key;

ALTER TABLE public.news_articles
  ADD CONSTRAINT news_articles_url_key UNIQUE (url);

ALTER TABLE public.ais_position_history
  DROP CONSTRAINT IF EXISTS ais_position_history_hotspot_check;

ALTER TABLE public.ais_position_history
  ADD CONSTRAINT ais_position_history_hotspot_check
  CHECK (hotspot IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'));
