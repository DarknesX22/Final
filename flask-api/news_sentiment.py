"""
Fetches crypto news from RSS feeds and computes VADER sentiment scores.
Maps article sentiment to each coin based on keyword matching.
"""

import re
import time
import threading
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from typing import Optional

import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# ── RSS feeds ─────────────────────────────────────────────────────────────────

RSS_FEEDS = [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
]

# ── Coin keyword map ──────────────────────────────────────────────────────────
# Maps each trading symbol to keywords that identify it in news text

COIN_KEYWORDS: dict[str, list[str]] = {
    "BTCUSDT":  ["bitcoin", "btc"],
    "ETHUSDT":  ["ethereum", "eth", "ether"],
    "BNBUSDT":  ["bnb", "binance coin", "binance smart chain", "bsc"],
    "XRPUSDT":  ["xrp", "ripple"],
    "ADAUSDT":  ["cardano", "ada"],
    "DOGEUSDT": ["dogecoin", "doge"],
    "LTCUSDT":  ["litecoin", "ltc"],
    "BCHUSDT":  ["bitcoin cash", "bch"],
    "ETCUSDT":  ["ethereum classic", "etc"],
    "TRXUSDT":  ["tron", "trx"],
    "XLMUSDT":  ["stellar", "xlm"],
    "XMRUSDT":  ["monero", "xmr"],
    "NEOUSDT":  ["neo"],
    "EOSUSDT":  ["eos"],
    "DASHUSDT": ["dash"],
    "ZECUSDT":  ["zcash", "zec"],
    "IOTAUSDT": ["iota", "miota"],
    "QTUMUSDT": ["qtum"],
    "OMGUSDT":  ["omg", "omisego"],
    "ZRXUSDT":  ["0x", "zrx"],
}

# General crypto keywords — articles matching these contribute to all coins
GENERAL_CRYPTO_KEYWORDS = [
    "crypto", "cryptocurrency", "blockchain", "defi", "altcoin",
    "bull", "bear", "market", "token", "exchange", "trading",
]

# ── Cache ─────────────────────────────────────────────────────────────────────

_cache_lock = threading.Lock()
_cache: dict = {
    "scores": {},       # coin -> sentiment dict
    "fetched_at": None, # datetime
    "ttl_seconds": 300, # 5-minute cache
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _strip_html(text: str) -> str:
    text = re.sub(r"<!\[CDATA\[|\]\]>", "", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&quot;", '"', text)
    text = re.sub(r"&#039;", "'", text)
    text = re.sub(r"&nbsp;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _fetch_rss(url: str, timeout: int = 8) -> list[dict]:
    """Fetch and parse a single RSS feed. Returns list of {title, description}."""
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; CoinIQ/1.0)"},
            timeout=timeout,
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        ns = {"media": "http://search.yahoo.com/mrss/"}

        articles = []
        for item in root.iter("item"):
            title_el = item.find("title")
            desc_el  = item.find("description")
            title = _strip_html(title_el.text or "") if title_el is not None else ""
            desc  = _strip_html(desc_el.text  or "") if desc_el  is not None else ""
            if title:
                articles.append({"title": title, "description": desc})
        return articles
    except Exception:
        return []


def _fetch_all_articles() -> list[dict]:
    """Fetch all RSS feeds and return merged article list."""
    all_articles = []
    for url in RSS_FEEDS:
        all_articles.extend(_fetch_rss(url))
    return all_articles


def _article_text(article: dict) -> str:
    return f"{article['title']} {article['description']}".lower()


def _is_relevant(text: str, keywords: list[str]) -> bool:
    return any(kw in text for kw in keywords)


def _compute_sentiment_scores(articles: list[dict]) -> dict[str, dict]:
    """
    For each coin, find relevant articles and compute aggregate VADER scores.
    Falls back to general crypto sentiment if no coin-specific articles found.
    Returns a dict: coin -> {vader_compound, vader_pos, vader_neg, vader_neu,
                              sentiment_label, finbert_score, finbert_label,
                              article_count}
    """
    analyzer = SentimentIntensityAnalyzer()

    # Score every article once
    scored = []
    for art in articles:
        text = f"{art['title']}. {art['description']}"
        vs = analyzer.polarity_scores(text)
        scored.append({
            "text":     _article_text(art),
            "compound": vs["compound"],
            "pos":      vs["pos"],
            "neg":      vs["neg"],
            "neu":      vs["neu"],
        })

    # General crypto articles (fallback pool)
    general = [s for s in scored if _is_relevant(s["text"], GENERAL_CRYPTO_KEYWORDS)]

    def _aggregate(pool: list[dict]) -> dict:
        if not pool:
            return {
                "vader_compound": 0.0, "vader_pos": 0.0,
                "vader_neg": 0.0,      "vader_neu": 1.0,
                "sentiment_label": 0,  "finbert_score": 0.0,
                "finbert_label": 0,    "article_count": 0,
            }
        compound = sum(a["compound"] for a in pool) / len(pool)
        pos      = sum(a["pos"]      for a in pool) / len(pool)
        neg      = sum(a["neg"]      for a in pool) / len(pool)
        neu      = sum(a["neu"]      for a in pool) / len(pool)

        # sentiment_label: 1=positive, -1=negative, 0=neutral (matches training)
        if compound >= 0.05:
            label = 1
        elif compound <= -0.05:
            label = -1
        else:
            label = 0

        # finbert_score: map compound [-1,1] → [0,1] for compatibility
        finbert_score = (compound + 1) / 2
        finbert_label = 1 if compound >= 0.05 else (0 if compound > -0.05 else -1)

        return {
            "vader_compound":  round(compound, 4),
            "vader_pos":       round(pos, 4),
            "vader_neg":       round(neg, 4),
            "vader_neu":       round(neu, 4),
            "sentiment_label": label,
            "finbert_score":   round(finbert_score, 4),
            "finbert_label":   finbert_label,
            "article_count":   len(pool),
        }

    result = {}
    for coin, keywords in COIN_KEYWORDS.items():
        coin_articles = [s for s in scored if _is_relevant(s["text"], keywords)]
        if coin_articles:
            result[coin] = _aggregate(coin_articles)
            result[coin]["source"] = "coin_specific"
        elif general:
            result[coin] = _aggregate(general)
            result[coin]["source"] = "general_crypto"
        else:
            result[coin] = _aggregate([])
            result[coin]["source"] = "neutral_fallback"

    return result


# ── Public API ────────────────────────────────────────────────────────────────

def get_sentiment(coin: str) -> dict:
    """
    Returns VADER sentiment scores for a coin.
    Uses a 5-minute in-memory cache to avoid hammering RSS feeds.

    Returns dict with keys:
        vader_compound, vader_pos, vader_neg, vader_neu,
        sentiment_label, finbert_score, finbert_label,
        article_count, source, fetched_at
    """
    coin = coin.upper()

    with _cache_lock:
        now = datetime.now(timezone.utc)
        expired = (
            _cache["fetched_at"] is None
            or (now - _cache["fetched_at"]).total_seconds() > _cache["ttl_seconds"]
        )

        if expired:
            print(f"[Sentiment] Fetching news from RSS feeds...")
            try:
                articles = _fetch_all_articles()
                scores   = _compute_sentiment_scores(articles)
                _cache["scores"]     = scores
                _cache["fetched_at"] = now
                print(f"[Sentiment] Fetched {len(articles)} articles, scored {len(scores)} coins.")
            except Exception as e:
                print(f"[Sentiment] Error fetching news: {e}. Using neutral fallback.")
                # Keep stale cache if available, else return neutral
                if not _cache["scores"]:
                    _cache["scores"] = {}
                _cache["fetched_at"] = now  # reset timer to avoid hammering on error

        scores = _cache["scores"]
        fetched_at = _cache["fetched_at"]

    default = {
        "vader_compound": 0.0, "vader_pos": 0.0,
        "vader_neg": 0.0,      "vader_neu": 1.0,
        "sentiment_label": 0,  "finbert_score": 0.0,
        "finbert_label": 0,    "article_count": 0,
        "source": "neutral_fallback",
    }

    result = scores.get(coin, default).copy()
    result["fetched_at"] = fetched_at.isoformat() if fetched_at else None
    return result


def get_all_sentiments() -> dict[str, dict]:
    """Returns sentiment scores for all 20 coins (triggers cache refresh if needed)."""
    # Trigger a fetch for any coin to warm the cache
    get_sentiment("BTCUSDT")
    with _cache_lock:
        return dict(_cache["scores"])
