-- Prebuilt payload cache for the VesselSurge live map.
-- Cron writes one compact JSON payload here so public page loads do not need
-- to join news, hotspot stats, signals, and vessel counts on every request.

CREATE TABLE IF NOT EXISTS public.maritime_dashboard_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maritime_dashboard_cache_generated
  ON public.maritime_dashboard_cache(generated_at DESC);

ALTER TABLE public.maritime_dashboard_cache ENABLE ROW LEVEL SECURITY;
