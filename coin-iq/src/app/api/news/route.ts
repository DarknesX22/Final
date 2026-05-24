import { NextRequest, NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

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

const FALLBACK_IMAGES: Record<string, string> = {
  'CoinDesk':      'https://www.coindesk.com/resizer/v2/https%3A%2F%2Fstatic.coindesk.com%2Fwp-content%2Fuploads%2F2021%2F04%2Fcoindesk-default-og.png',
  'CoinTelegraph': 'https://cointelegraph.com/assets/img/ct-logo.svg',
  'Decrypt':       'https://cdn.decrypt.co/wp-content/themes/decrypt-media/assets/images/metatag.png',
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

async function fetchFeed(source: string, url: string): Promise<NewsArticle[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoinIQ/1.0)' },
      next: { revalidate: 300 }, // cache 5 min
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });
    const items: any[] = parsed?.rss?.channel?.item ?? [];
    const itemArr = Array.isArray(items) ? items : [items];

    return itemArr.map((item: any, i: number) => {
      // Extract image from various RSS formats
      let imageUrl = FALLBACK_IMAGES[source] ?? '';

      // media:content
      const mediaContent = item['media:content'];
      if (mediaContent) {
        const mc = Array.isArray(mediaContent) ? mediaContent[0] : mediaContent;
        imageUrl = mc?.$ ?.url ?? mc?.url ?? imageUrl;
      }

      // media:thumbnail
      const mediaThumbnail = item['media:thumbnail'];
      if (mediaThumbnail && !imageUrl) {
        const mt = Array.isArray(mediaThumbnail) ? mediaThumbnail[0] : mediaThumbnail;
        imageUrl = mt?.$ ?.url ?? mt?.url ?? imageUrl;
      }

      // enclosure
      const enclosure = item['enclosure'];
      if (enclosure && !imageUrl) {
        const enc = Array.isArray(enclosure) ? enclosure[0] : enclosure;
        const encUrl = enc?.$ ?.url ?? enc?.url ?? '';
        if (encUrl && (encUrl.includes('.jpg') || encUrl.includes('.png') || encUrl.includes('.webp'))) {
          imageUrl = encUrl;
        }
      }

      // Raw description / content for body
      const rawDesc   = item['description'] ?? '';
      const rawContent = item['content:encoded'] ?? item['content'] ?? '';
      const bodyHtml  = rawContent || rawDesc;
      const descText  = stripHtml(rawDesc).slice(0, 300);
      const bodyText  = stripHtml(bodyHtml);

      const link = typeof item.link === 'string' ? item.link : item.link?._ ?? item.link?.['#text'] ?? '';
      const title = stripHtml(typeof item.title === 'string' ? item.title : item.title?._ ?? '');
      const pubDate = item.pubDate ?? item['dc:date'] ?? new Date().toISOString();

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

    const total      = all.length;
    const totalPages = Math.ceil(total / pageSize);
    const start      = (page - 1) * pageSize;
    const articles   = all.slice(start, start + pageSize);

    return NextResponse.json({
      articles,
      pagination: { page, pageSize, total, totalPages },
    }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch news', message: error.message }, { status: 500 });
  }
}
