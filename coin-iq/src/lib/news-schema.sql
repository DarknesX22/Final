-- News articles table — stores every fetched news item
-- Deduplication is handled via UNIQUE constraint on (source, url)
CREATE TABLE IF NOT EXISTS news_articles (
  id            SERIAL PRIMARY KEY,
  article_id    VARCHAR(512) NOT NULL,              -- client-side id from RSS feed
  title         TEXT NOT NULL,
  source        VARCHAR(100) NOT NULL,              -- CoinDesk | CoinTelegraph | Decrypt
  published_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  description   TEXT,
  body          TEXT,
  url           TEXT NOT NULL,
  image_url     TEXT,
  fetched_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (source, url)                              -- prevent duplicate articles
);

CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source       ON news_articles (source);
