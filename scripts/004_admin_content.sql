-- 004_admin_content.sql
-- Admin-manageable tables for VesselSurge maritime intelligence

-- News Articles Table
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  snippet TEXT,
  topic TEXT NOT NULL DEFAULT 'global',
  published_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hotspot Alerts Table
CREATE TABLE IF NOT EXISTS public.hotspot_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id TEXT NOT NULL, -- hormuz, bab, malacca, suez
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Hotspot Stats Table
CREATE TABLE IF NOT EXISTS public.hotspot_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotspot_id TEXT NOT NULL UNIQUE, -- hormuz, bab, malacca, suez
  daily_transits INTEGER DEFAULT 0,
  avg_wait_time TEXT DEFAULT '0h',
  risk_level TEXT DEFAULT 'Medium',
  market_volume INTEGER DEFAULT 0,
  active_vessels INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspot_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspot_stats ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can read active content)
CREATE POLICY "news_articles_public_read" ON public.news_articles 
  FOR SELECT USING (is_active = true);

CREATE POLICY "hotspot_alerts_public_read" ON public.hotspot_alerts 
  FOR SELECT USING (is_active = true);

CREATE POLICY "hotspot_stats_public_read" ON public.hotspot_stats 
  FOR SELECT USING (true);

-- Admin write policies (only admins can modify)
CREATE POLICY "news_articles_admin_all" ON public.news_articles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "hotspot_alerts_admin_all" ON public.hotspot_alerts 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "hotspot_stats_admin_all" ON public.hotspot_stats 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND raw_user_meta_data->>'is_admin' = 'true'
    )
  );

-- Insert initial hotspot stats
INSERT INTO public.hotspot_stats (hotspot_id, daily_transits, avg_wait_time, risk_level, market_volume, active_vessels, notes)
VALUES 
  ('hormuz', 7, '48h+', 'CRITICAL', 85, 7, 'Iran War (Feb 28) - 94% traffic drop. 21M bbl/day at risk.'),
  ('bab', 24, '6.5h', 'CRITICAL', 280, 18, 'Houthi attacks resumed (Mar 28). $280M daily volume.'),
  ('malacca', 471, '2.8h', 'HIGH', 2450, 471, 'Elevated due to Hormuz/Suez diversions. 3,298 ships/week.'),
  ('suez', 39, '6.2h', 'HIGH', 620, 39, 'Mar 25 SCA data. Red Sea diversions ongoing.')
ON CONFLICT (hotspot_id) DO NOTHING;

-- Insert initial news articles
INSERT INTO public.news_articles (title, url, source, snippet, topic, is_active)
VALUES 
  ('Houthis target ship near Bab el-Mandeb as Red Sea tensions escalate', 
   'https://www.aljazeera.com/news/longform/2026/3/28/red-sea-houthi-attacks-shipping-march', 
   'aljazeera.com', 
   'Al Jazeera reports that Houthi forces have intensified attacks on commercial shipping following the collapse of ceasefire negotiations...', 
   'bab', true),
  ('Iran war impact: Hormuz oil tanker traffic down 94 percent', 
   'https://www.aljazeera.com/news/2026/3/28/iran-war-hormuz-strait-oil-tanker-shipping', 
   'aljazeera.com', 
   'Al Jazeera analysis shows unprecedented collapse in tanker traffic through the Strait of Hormuz since Iran conflict began February 28...', 
   'hormuz', true),
  ('Global supply chains face biggest disruption since pandemic', 
   'https://www.aljazeera.com/economy/2026/3/27/supply-chain-disruption-middle-east-shipping', 
   'aljazeera.com', 
   'Al Jazeera economics correspondent reports on cascading effects of Red Sea attacks and Hormuz crisis affecting global trade...', 
   'global', true),
  ('Strait of Hormuz oil traffic collapses amid Iran war fears', 
   'https://www.reuters.com/business/energy/hormuz-shipping-iran-war-2026/', 
   'reuters.com', 
   'Tanker traffic through the Strait of Hormuz has fallen by 94% since the outbreak of hostilities with Iran on February 28...', 
   'hormuz', true),
  ('BBC: How Middle East shipping crisis impacts your grocery prices', 
   'https://www.bbc.com/news/business/shipping-crisis-inflation-2026', 
   'bbc.com', 
   'BBC explains how disruptions to maritime trade routes are driving up costs for consumers worldwide...', 
   'global', true),
  ('Suez Canal daily transits fall to decade low of 39 ships', 
   'https://www.hellenicshippingnews.com/suez-canal-transits-march-2026/', 
   'hellenicshippingnews.com', 
   'The Suez Canal Authority confirmed only 39 vessels transited on March 25, the lowest daily count in over a decade...', 
   'suez', true),
  ('Malacca Strait traffic surges 89% as ships divert from Red Sea', 
   'https://splash247.com/malacca-strait-surge-diversions-2026/', 
   'splash247.com', 
   'Over 3,298 vessels passed through the Strait of Malacca last week, up 89% year-on-year as shipping lines reroute away from the Red Sea...', 
   'malacca', true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_news_articles_updated_at ON public.news_articles;
CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON public.news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hotspot_alerts_updated_at ON public.hotspot_alerts;
CREATE TRIGGER update_hotspot_alerts_updated_at
  BEFORE UPDATE ON public.hotspot_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hotspot_stats_updated_at ON public.hotspot_stats;
CREATE TRIGGER update_hotspot_stats_updated_at
  BEFORE UPDATE ON public.hotspot_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
