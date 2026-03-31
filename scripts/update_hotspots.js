const Parser = require('rss-parser');
const { createClient } = require('@supabase/supabase-js');

const RSS_FEEDS = {
    straitOfHormuz: 'https://example.com/rss/strait-of-hormuz',
    babElMandeb: 'https://example.com/rss/bab-el-mandeb',
    straitOfMalacca: 'https://example.com/rss/strait-of-malacca',
    suezCanal: 'https://example.com/rss/suez-canal'
};

const supabaseUrl = 'https://YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const ALERT_KEYWORDS = ['attack', 'piracy', 'incident', 'suspicious'];

const checkForAlerts = (item) => {
    return ALERT_KEYWORDS.some(keyword => item.title.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword));
};

const upsertHotspot = async (alert) => {
    const { error } = await supabase
        .from('hotspots')
        .upsert([alert]);
    if (error) console.error('Error upserting hotspot:', error);
};

const fetchNews = async () => {
    const parser = new Parser();
    for (const [location, feed] of Object.entries(RSS_FEEDS)) {
        const rss = await parser.parseURL(feed);
        for (const item of rss.items) {
            if (checkForAlerts(item)) {
                const alert = {
                    title: item.title,
                    description: item.description,
                    link: item.link,
                    location: location,
                    date: new Date(item.pubDate).toISOString(),
                };
                await upsertHotspot(alert);
            }
        }
    }
};

fetchNews().catch(console.error);