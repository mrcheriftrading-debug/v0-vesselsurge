-- VesselSurge signal layer: official alerts, derived AIS signals, and AIS history.

CREATE TABLE IF NOT EXISTS public.maritime_signals (
  signal_key TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_url TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  region TEXT NOT NULL CHECK (region IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape')),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('official_alert', 'navigation_warning', 'ais_anomaly', 'weather_constraint', 'news_corroboration', 'source_sweep')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence INTEGER NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_maritime_signals_region_observed
  ON public.maritime_signals(region, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_maritime_signals_type_observed
  ON public.maritime_signals(signal_type, observed_at DESC);

CREATE TABLE IF NOT EXISTS public.ais_position_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mmsi BIGINT NOT NULL,
  name TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION NOT NULL DEFAULT 0,
  heading DOUBLE PRECISION NOT NULL DEFAULT 0,
  ship_type INTEGER NOT NULL DEFAULT 0,
  destination TEXT,
  hotspot TEXT NOT NULL CHECK (hotspot IN ('hormuz', 'bab', 'suez', 'malacca', 'panama', 'taiwan', 'turkish', 'gibraltar', 'cape')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ais_position_history_hotspot_captured
  ON public.ais_position_history(hotspot, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_ais_position_history_mmsi_captured
  ON public.ais_position_history(mmsi, captured_at DESC);

ALTER TABLE public.maritime_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ais_position_history ENABLE ROW LEVEL SECURITY;
