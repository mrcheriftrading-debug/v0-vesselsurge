const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://your_supabase_url';
const supabaseKey = 'your_supabase_key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchNews() {
    const response = await fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=your_news_api_key');
    const data = await response.json();
    return data.articles;
}

async function updateHotspots(articles) {
    for (const article of articles) {
        const { title, description, url } = article;
        await supabase.from('hotspots').upsert({
            title,
            description,
            url,
            updated_at: new Date()
        });
    }
}

async function main() {
    try {
        const articles = await fetchNews();
        await updateHotspots(articles);
        console.log('Hotspots updated successfully!');
    } catch (error) {
        console.error('Error updating hotspots:', error);
    }
}

main();