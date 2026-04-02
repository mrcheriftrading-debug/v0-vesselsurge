-- Add note column to maritime_hotspots if it doesn't exist
ALTER TABLE maritime_hotspots ADD COLUMN IF NOT EXISTS note TEXT;

-- Insert default hotspots if they don't exist
INSERT INTO maritime_hotspots (id, name, region, center_lat, center_lng, risk_level, active_vessels, daily_transits, avg_wait_time, market_volume, note)
VALUES 
  ('hormuz', 'Strait of Hormuz', 'Middle East', 26.34, 56.47, 'critical', 7, 7, '48h+', 21000000, 'Iran War (Feb 28) — 94% traffic drop. 21M bbl/day at risk. Avg wait: 48h+.'),
  ('bab', 'Bab el-Mandeb', 'Red Sea', 12.65, 43.32, 'critical', 24, 24, '6.5h', 280000000, 'Houthi attacks resumed (Mar 28). $280M daily volume. Avg wait: 6.5h.'),
  ('malacca', 'Strait of Malacca', 'Southeast Asia', 2.45, 102.15, 'high', 471, 471, '2h', 500000000, 'World''s busiest strait. +89% traffic from diversions. 3,298 vessels/week.'),
  ('suez', 'Suez Canal', 'Egypt', 29.95, 32.58, 'high', 39, 39, '12h', 150000000, 'Mar 25 SCA data. Decade-low transits. Red Sea diversions ongoing.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  region = EXCLUDED.region,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng;
