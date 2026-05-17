-- VesselSurge live watcher state for source fingerprints and ingestion locks.

CREATE TABLE IF NOT EXISTS public.ingestion_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ingestion_state ENABLE ROW LEVEL SECURITY;
