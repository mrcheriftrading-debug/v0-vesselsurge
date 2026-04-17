#!/usr/bin/env python3
"""
vessel_bot.py - VesselSurge Maritime Intelligence Worker
=========================================================
Fetches real maritime news via newsdata.io API (zero-cost).
Writes directly to Supabase with credibility scoring.

NOTE: MarineTraffic/VesselFinder scraping is intentionally NOT used Ñ
both sites have ToS prohibitions and strong anti-bot measures.
Real AIS data is sourced via the aisstream.io WebSocket API (free tier).

Usage:
  python vessel_bot.py              # run once
  python vessel_bot.py --watch      # poll every 15 min

Environment variables (use .env or GitHub Secrets):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  NEWSDATA_API_KEY                  # pub_2f3676c55acc44a1b713d54842697ca5
  AISSTREAM_API_KEY                 # optional Ñ get free key at aisstream.io
"""

import os, sys, json, time, hashlib, asyncio
from datetime import datetime, timezone
from typing import Optional

try:
    import httpx
except ImportError:
    print("Install deps: pip install httpx supabase")
    sys.exit(1)

# ?? Config ??????????????????????????????????????????????????????????????????
SUPABASE_URL      = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY      = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
NEWSDATA_KEY      = os.getenv("NEWSDATA_API_KEY", "pub_2f3676c55acc44a1b713d54842697ca5")
EDGE_FUNCTION_URL = os.getenv("SUPABASE_EDGE_URL", "")

NEWS_QUERIES = [
    {"topic": "hormuz",  "q": "Strait of Hormuz shipping Iran tanker"},
    {"topic": "bab",     "q": "Red Sea Houthi shipping attack maritime"},
    {"topic": "suez",    "q": "Suez Canal shipping traffic Egypt"},
    {"topic": "malacca", "q": "Strait of Malacca shipping Singapore piracy"},
    {"topic": "global",  "q": "maritime shipping freight rates container 2026"},
    {"topic": "global",  "q": "shipping chokepoint geopolitics tanker"},
]

TOPIC_KW = {
    "hormuz":  ["hormuz", "persian gulf", "iran", "irgc", "gulf of oman"],
    "bab":     ["bab el-mandeb", "red sea", "houthi", "aden", "yemen"],
    "suez":    ["suez", "egypt", "suez canal"],
    "malacca": ["malacca", "singapore", "south china sea", "piracy"],
}

CRITICAL_KW = ["attack","missile","strike","seized","blocked","closure",
               "crisis","war","conflict","halt","suspended","closed",
               "bomb","sanction","blockade","explosion","hostage"]
HIGH_KW     = ["disruption","divert","reroute","avoid","danger","tense",
               "escalat","warning","incident","hostile","threat","fire","armed"]
MED_KW      = ["delay","slow","congestion","caution","monitor","surge","spike","concern"]


def classify_topic(text: str) -> str:
    lower = text.lower()
    for topic, kws in TOPIC_KW.items():
        if any(kw in lower for kw in kws):
            return topic
    return "global"


def score_credibility(article: dict, all_articles: list) -> dict:
    """Verified if key terms appear in >= 2 other articles (multi-source check)."""
    text  = (article["title"] + " " + article["snippet"]).lower()
    stopwords = {"that","this","with","from","have","will","been","they","their","were","more","also","than","when","what","which"}
    words     = [w for w in text.split() if len(w) >= 4 and w not in stopwords]
    key_terms = list(dict.fromkeys(words))[:8]

    corroborations = 0
    for other in all_articles:
        if other["url"] == article["url"]:
            continue
        other_text = (other["title"] + " " + other["snippet"]).lower()
        matches = sum(1 for t in key_terms if t in other_text)
        if matches >= 3:
            corroborations += 1

    credibility = min(10, 1 + corroborations * 2)
    return {"verified": corroborations >= 2, "credibility": credibility}


def fetch_news(query: str, topic: str) -> list:
    """Fetch real maritime news from newsdata.io."""
    params = {
        "apikey":   NEWSDATA_KEY,
        "q":        query,
        "language": "en",
        "category": "business,world",
        "size":     "10",
    }
    try:
        r = httpx.get("https://newsdata.io/api/1/news", params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        if data.get("status") != "success":
            print(f"  [news] {topic}: API error Ñ {data.get('message')}")
            return []
        results = data.get("results", [])
        print(f"  [news] {topic}: {len(results)} articles")
        articles = []
        for item in results:
            if not item.get("title") or not item.get("link"):
                continue
            combined      = (item.get("title","") + " " + item.get("description","") + " " + (item.get("content") or ""))
            detected      = classify_topic(combined)
            pub_date      = item.get("pubDate")
            published_at  = pub_date if pub_date else datetime.now(timezone.utc).isoformat()
            articles.append({
                "title":        (item.get("title","") or "").strip()[:200],
                "snippet":      (item.get("description") or item.get("content") or item.get("title","")).strip()[:600],
                "url":          item["link"],
                "source":       item.get("source_id") or item.get("source_name") or "News",
                "topic":        topic if detected == "global" else detected,
                "region":       topic if detected == "global" else detected,
                "published_at": published_at,
            })
        return articles
    except Exception as e:
        print(f"  [news] {topic} error: {e}")
        return []


def push_to_supabase(articles: list) -> int:
    """Upsert articles into Supabase via REST API."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  [db] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set Ñ skipping DB write")
        return 0

    now = datetime.now(timezone.utc).isoformat()
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates",
    }

    # Delete old articles first
    try:
        httpx.delete(
            f"{SUPABASE_URL}/rest/v1/news_articles?created_at=gte.2000-01-01",
            headers=headers, timeout=30
        )
    except Exception as e:
        print(f"  [db] delete warning: {e}")

    # Insert new
    payload = [{
        "title":        a["title"],
        "snippet":      a["snippet"],
        "url":          a["url"],
        "source":       a["source"],
        "topic":        a["topic"],
        "region":       a["region"],
        "is_active":    True,
        "verified":     a.get("verified", False),
        "credibility":  a.get("credibility", 1),
        "published_at": a["published_at"],
        "created_at":   now,
        "updated_at":   now,
    } for a in articles]

    try:
        r = httpx.post(
            f"{SUPABASE_URL}/rest/v1/news_articles",
            headers=headers,
            json=payload,
            timeout=30,
        )
        r.raise_for_status()
        print(f"  [db] inserted {len(payload)} articles")
        return len(payload)
    except Exception as e:
        print(f"  [db] insert error: {e}")
        return 0


def run():
    print(f"\n[vessel_bot] {datetime.now(timezone.utc).isoformat()}")

    # Fetch all news
    all_articles: list = []
    for q in NEWS_QUERIES:
        articles = fetch_news(q["q"], q["topic"])
        all_articles.extend(articles)

    # Dedup by URL
    seen: set = set()
    unique = [a for a in all_articles if not (a["url"] in seen or seen.add(a["url"]))]
    print(f"  [news] {len(unique)} unique articles fetched")

    # Credibility scoring
    scored = [{**a, **score_credibility(a, unique)} for a in unique]
    verified_count = sum(1 for a in scored if a.get("verified"))
    print(f"  [credibility] {verified_count}/{len(scored)} articles verified (multi-source)")

    # Bloomberg / Reuters credibility boost
    trusted_sources = {"bloomberg", "reuters", "al jazeera", "bbc", "ft", "financial times", "gcaptain", "tradewinds", "lloyds"}
    for a in scored:
        if any(t in (a.get("source","") or "").lower() for t in trusted_sources):
            a["credibility"] = min(10, a.get("credibility", 1) + 2)
            a["verified"]    = True

    # Write to Supabase
    inserted = push_to_supabase(scored)

    print(f"  [done] articles_fetched={len(unique)} inserted={inserted} verified={verified_count}")
    return {"fetched": len(unique), "inserted": inserted, "verified": verified_count}


if __name__ == "__main__":
    if "--watch" in sys.argv:
        print("[vessel_bot] Watch mode Ñ running every 15 minutes")
        while True:
            try:
                run()
            except Exception as e:
                print(f"[vessel_bot] Error: {e}")
            print("  sleeping 15 min..."  )
            time.sleep(900)
    else:
        result = run()
        print(json.dumps(result, indent=2))
