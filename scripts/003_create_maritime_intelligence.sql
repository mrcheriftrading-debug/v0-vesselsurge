CREATE TABLE IF NOT EXISTS maritime_hotspots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  center_lat DECIMAL(10, 6) NOT NULL,
  center_lng DECIMAL(10, 6) NOT NULL,
  zoom INTEGER DEFAULT 8,
  risk_level TEXT DEFAULT 'medium',
  active_vessels INTEGER DEFAULT 0,
  daily_transits INTEGER DEFAULT 0,
  avg_wait_time TEXT DEFAULT '0h',
  market_volume INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maritime_vessels (
  id SERIAL PRIMARY KEY,
  mmsi TEXT NOT NULL,
  name TEXT NOT NULL,
  vessel_type TEXT NOT NULL,
  hotspot_id TEXT REFERENCES maritime_hotspots(id) ON DELETE CASCADE,
  lat DECIMAL(10, 6) NOT NULL,
  lng DECIMAL(10, 6) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  course INTEGER DEFAULT 0,
  destination TEXT,
  eta TEXT,
  flag TEXT,
  match_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maritime_alerts (
  id SERIAL PRIMARY KEY,
  hotspot_id TEXT REFERENCES maritime_hotspots(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS maritime_news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  category TEXT,
  region TEXT,
  url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE maritime_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE maritime_vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE maritime_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maritime_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_hotspots" ON maritime_hotspots FOR SELECT USING (true);
CREATE POLICY "allow_read_vessels" ON maritime_vessels FOR SELECT USING (true);
CREATE POLICY "allow_read_alerts" ON maritime_alerts FOR SELECT USING (true);
CREATE POLICY "allow_read_news" ON maritime_news FOR SELECT USING (true);

CREATE POLICY "allow_all_hotspots" ON maritime_hotspots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_vessels" ON maritime_vessels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_alerts" ON maritime_alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_news" ON maritime_news FOR ALL USING (true) WITH CHECK (true);
