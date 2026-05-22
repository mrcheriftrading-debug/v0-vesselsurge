-- Keep Supabase aligned with the current VesselSurge nine-hotspot contract.
-- This migration is intentionally additive and idempotent.

DO $$
BEGIN
  IF to_regclass('public.news_articles') IS NOT NULL THEN
    UPDATE public.news_articles
    SET region = 'global'
    WHERE region IS NOT NULL
      AND region NOT IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape', 'global');
  END IF;
END $$;

ALTER TABLE IF EXISTS public.news_articles
  DROP CONSTRAINT IF EXISTS news_articles_region_check;

ALTER TABLE IF EXISTS public.news_articles
  ADD CONSTRAINT news_articles_region_check
  CHECK (region IS NULL OR region IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape', 'global'));

DO $$
BEGIN
  IF to_regclass('public.maritime_news') IS NOT NULL THEN
    UPDATE public.maritime_news
    SET hotspot_id = NULL
    WHERE hotspot_id IS NOT NULL
      AND hotspot_id NOT IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape');
  END IF;
END $$;

ALTER TABLE IF EXISTS public.maritime_news
  DROP CONSTRAINT IF EXISTS maritime_news_hotspot_id_check;

ALTER TABLE IF EXISTS public.maritime_news
  ADD CONSTRAINT maritime_news_hotspot_id_check
  CHECK (hotspot_id IS NULL OR hotspot_id IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'));

DO $$
BEGIN
  IF to_regclass('public.maritime_alerts') IS NOT NULL THEN
    DELETE FROM public.maritime_alerts
    WHERE hotspot_id NOT IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape');
  END IF;
END $$;

ALTER TABLE IF EXISTS public.maritime_alerts
  DROP CONSTRAINT IF EXISTS maritime_alerts_hotspot_id_check;

ALTER TABLE IF EXISTS public.maritime_alerts
  ADD CONSTRAINT maritime_alerts_hotspot_id_check
  CHECK (hotspot_id IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'));

DO $$
BEGIN
  IF to_regclass('public.vessels_realtime') IS NOT NULL THEN
    UPDATE public.vessels_realtime
    SET hotspot_id = NULL
    WHERE hotspot_id IS NOT NULL
      AND hotspot_id NOT IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape');
  END IF;
END $$;

ALTER TABLE IF EXISTS public.vessels_realtime
  DROP CONSTRAINT IF EXISTS vessels_realtime_hotspot_id_check;

ALTER TABLE IF EXISTS public.vessels_realtime
  ADD CONSTRAINT vessels_realtime_hotspot_id_check
  CHECK (hotspot_id IS NULL OR hotspot_id IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'));

DO $$
BEGIN
  IF to_regclass('public.user_preferences') IS NOT NULL THEN
    UPDATE public.user_preferences
    SET watched_hotspots = ARRAY['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'],
        updated_at = NOW()
    WHERE watched_hotspots IS NULL
       OR NOT watched_hotspots @> ARRAY['hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape'];
  END IF;

  IF to_regclass('public.hotspot_stats') IS NOT NULL THEN
    INSERT INTO public.hotspot_stats (hotspot, active_vessels, daily_transits, avg_wait_time, market_volume, risk_level, updated_at)
    VALUES
      ('hormuz', 0, 0, 'Source review', 21000000, 'low', NOW()),
      ('bab', 0, 0, 'Source review', 280000000, 'low', NOW()),
      ('suez', 0, 0, 'Source review', 150000000, 'low', NOW()),
      ('malacca', 0, 0, 'Source review', 500000000, 'low', NOW()),
      ('panama', 0, 0, 'Source review', 0, 'low', NOW()),
      ('taiwan', 0, 0, 'Source review', 0, 'low', NOW()),
      ('turkish', 0, 0, 'Source review', 0, 'low', NOW()),
      ('gibraltar', 0, 0, 'Source review', 0, 'low', NOW()),
      ('cape', 0, 0, 'Source review', 0, 'low', NOW())
    ON CONFLICT (hotspot) DO NOTHING;
  END IF;
END $$;
