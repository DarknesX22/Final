import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';
import db from '@/lib/db';

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  description: string;
  body: string;
  url: string;
  imageUrl: string;
}

const RSS_FEEDS = [
  { name: 'CoinDesk',      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt',       url: 'https://decrypt.co/feed' },
];

// Source-branded fallback images (reliable CDN URLs)
const FALLBACK_IMAGES: Record<string, string> = {
  CoinDesk:      'https://www.coindesk.com/resizer/v2/https%3A%2F%2Fstatic.coindesk.com%2Fwp-content%2Fuploads%2F2021%2F04%2Fcoindesk-default-og.png',
  CoinTelegraph: 'https://s3.cointelegraph.com/storage/uploads/view/6a32f84765cb1428e40d2c9e1af71c10.png',
  Decrypt:       'https://cdn.decrypt.co/wp-content/themes/decrypt-media/assets/images/metatag.png',
};

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract the best available image URL from an RSS item */
function extractImage(item: any, source: string): string {
  // 1. media:content (most reliable)
  const mc = item['media:content'];
  if (mc) {
    const m = Array.isArray(mc) ? mc[0] : mc;
    const u = m?.$?.url ?? m?.url;
    if (u && typeof u === 'string' && u.startsWith('http')) return u;
  }

  // 2. media:thumbnail
  const mt = item['media:thumbnail'];
  if (mt) {
    const m = Array.isArray(mt) ? mt[0] : mt;
    const u = m?.$?.url ?? m?.url;
    if (u && typeof u === 'string' && u.startsWith('http')) return u;
  }

  // 3. enclosure (podcast/image attachment)
  const enc = item['enclosure'];
  if (enc) {
    const m = Array.isArray(enc) ? enc[0] : enc;
    const u = m?.$?.url ?? m?.url ?? '';
    if (typeof u === 'string' && u.match(/\.(jpe?g|png|webp|gif)/i)) return u;
  }

  // 4. Scan <content:encoded> or <description> for first <img src="...">
  const htmlSources = [
    item['content:encoded'],
    item['content'],
    item['description'],
  ];
  for (const src of htmlSources) {
    const str = typeof src === 'string' ? src : src?._ ?? '';
    const match = str.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]?.startsWith('http')) return match[1];
  }

  // 5. Source-branded fallback
  return FALLBACK_IMAGES[source] ?? '';
}

async function fetchFeed(source: string, url: string): Promise<NewsArticle[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoinIQ/1.0; +https://coin-iq.app)' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];

    const xml    = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });
    const items: any[] = parsed?.rss?.channel?.item ?? [];
    const itemArr = Array.isArray(items) ? items : [items];

    return itemArr.map((item: any, i: number) => {
      const rawDesc    = item['description'] ?? '';
      const rawContent = item['content:encoded'] ?? item['content'] ?? '';
      const bodyHtml   = rawContent || rawDesc;
      const descText   = stripHtml(rawDesc).slice(0, 400);
      const bodyText   = stripHtml(bodyHtml);
      const link       = typeof item.link === 'string' ? item.link : item.link?._ ?? item.link?.['#text'] ?? '';
      const title      = stripHtml(typeof item.title === 'string' ? item.title : item.title?._ ?? '');
      const pubDate    = item.pubDate ?? item['dc:date'] ?? new Date().toISOString();
      const imageUrl   = extractImage(item, source);

      return {
        id:          `${source}-${i}-${Date.now()}`,
        title,
        source,
        publishedAt: new Date(pubDate).toISOString(),
        description: descText || title,
        body:        bodyText || descText || title,
        url:         link,
        imageUrl,
      };
    });
  } catch {
    return [];
  }
}

/** Upsert articles into the news_articles table (no duplicates via UNIQUE constraint) */
async function persistArticles(articles: NewsArticle[]): Promise<void> {
  if (!articles.length) return;
  try {
    // Batch insert — ON CONFLICT DO NOTHING avoids duplicates
    const values = articles
      .filter(a => a.title && a.url)
      .map((_, i) => {
        const base = i * 8;
        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8})`;
      })
      .join(',');

    if (!values) return;

    const flat = articles
      .filter(a => a.title && a.url)
      .flatMap(a => [
        a.id,
        a.title,
        a.source,
        a.publishedAt,
        a.description,
        a.body,
        a.url,
        a.imageUrl || null,
      ]);

    await db.query(
      `INSERT INTO news_articles
         (article_id, title, source, published_at, description, body, url, image_url)
       VALUES ${values}
       ON CONFLICT (source, url) DO NOTHING`,
      flat
    );
  } catch (e) {
    // Non-blocking — log but don't fail the response
    console.error('[News] DB persist error:', e);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = 10;

  try {
    // Fetch all feeds in parallel
    const results = await Promise.all(
      RSS_FEEDS.map(f => fetchFeed(f.name, f.url))
    );

    // Merge and sort by date descending
    const all: NewsArticle[] = results
      .flat()
      .filter(a => a.title && a.url)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Persist to DB in background (fire-and-forget — does not block response)
    persistArticles(all).catch(() => {});

    const total      = all.length;
    const totalPages = Math.ceil(total / pageSize);
    const start      = (page - 1) * pageSize;
    const articles   = all.slice(start, start + pageSize);

    return NextResponse.json(
      { articles, pagination: { page, pageSize, total, totalPages } },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch news', message: error.message },
      { status: 500 }
    );
  }
}
