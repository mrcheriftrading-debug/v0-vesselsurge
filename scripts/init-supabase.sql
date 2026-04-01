-- VesselSurge Supabase Schema - March 30, 2026
-- Tables for maritime intelligence, user data, and real-time tracking

-- Maritime News Articles Table
CREATE TABLE IF NOT EXISTS maritime_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  snippet TEXT,
  full_content TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  hotspot_id TEXT, -- 'hormuz', 'bab', 'malacca', 'suez'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maritime_news_hotspot ON maritime_news(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_maritime_news_published ON maritime_news(published_at DESC);

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE,
  username TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watched_hotspots TEXT[] DEFAULT ARRAY['hormuz', 'bab', 'malacca', 'suez'],
  alert_threshold TEXT DEFAULT 'high',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vessel Tracking Real-time Data
CREATE TABLE IF NOT EXISTS vessels_realtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mmsi TEXT UNIQUE,
  name TEXT,
  type TEXT,
  flag_country TEXT,
  latitude FLOAT8,
  longitude FLOAT8,
  speed_knots FLOAT8,
  heading INT,
  destination TEXT,
  eta TIMESTAMP WITH TIME ZONE,
  status TEXT, -- 'sailing', 'anchored', 'moored', 'in_transit'
  hotspot_id TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vessels_hotspot ON vessels_realtime(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_vessels_updated ON vessels_realtime(last_updated DESC);

-- Maritime Incidents/Alerts
CREATE TABLE IF NOT EXISTS maritime_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id TEXT NOT NULL,
  alert_type TEXT, -- 'attack', 'piracy', 'accident', 'disruption', 'war'
  severity TEXT, -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  affected_vessels INT,
  source TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_hotspot ON maritime_alerts(hotspot_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON maritime_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON maritime_alerts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE maritime_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE vessels_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE maritime_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access to news and alerts
CREATE POLICY "Allow public read maritime_news" ON maritime_news
  FOR SELECT USING (true);

CREATE POLICY "Allow public read maritime_alerts" ON maritime_alerts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read vessels_realtime" ON vessels_realtime
  FOR SELECT USING (true);

-- RLS Policies - User preferences (personal access only)
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample data for March 30, 2026
INSERT INTO maritime_news (title, url, source, snippet, hotspot_id, published_at) VALUES
  ('Iran war impact: Hormuz oil tanker traffic down 94 percent', 'https://www.aljazeera.com/news/2026/3/28/iran-war-hormuz', 'aljazeera.com', 'Unprecedented collapse in tanker traffic through Hormuz since Iran conflict began Feb 28', 'hormuz', NOW() - INTERVAL '2 hours'),
  ('Houthis target ship near Bab el-Mandeb as Red Sea tensions escalate', 'https://www.aljazeera.com/news/2026/3/28/red-sea-houthi', 'aljazeera.com', 'Houthi forces intensified attacks on commercial shipping following ceasefire collapse', 'bab', NOW() - INTERVAL '4 hours'),
  ('Malacca Strait becomes world''s busiest as ships flee Red Sea', 'https://www.france24.com/en/business/20260328-malacca', 'france24.com', 'Record traffic through Strait of Malacca as alternative to Red Sea routes', 'malacca', NOW() - INTERVAL '6 hours'),
  ('Suez Canal daily transits fall to decade low of 39 ships', 'https://www.hellenicshippingnews.com/suez-canal-transits', 'hellenicshippingnews.com', 'Suez Canal Authority confirms only 39 vessels transited on March 25', 'suez', NOW() - INTERVAL '1 day')
ON CONFLICT (url) DO NOTHING;

INSERT INTO maritime_alerts (hotspot_id, alert_type, severity, title, description, affected_vessels, source) VALUES
  ('hormuz', 'war', 'critical', 'Iran War - Strait of Hormuz Critical', 'Iran conflict has reduced tanker traffic by 94%. 21M barrels/day at risk.', 7, 'BBC Verify'),
  ('bab', 'attack', 'critical', 'Houthi Attacks - Red Sea Route', 'Houthi forces resumed attacks on shipping March 28. $280M daily volume at risk.', 24, 'Reuters'),
  ('malacca', 'disruption', 'high', 'Malacca Strait Congestion', 'Record surge in vessel traffic (+89%) due to diversions from Hormuz and Red Sea.', 471, 'ShipTracker'),
  ('suez', 'disruption', 'high', 'Suez Canal Crisis', 'Transit numbers fallen to decade lows. 68% decrease in daily traffic.', 39, 'Suez Canal Authority')
ON CONFLICT DO NOTHING;
