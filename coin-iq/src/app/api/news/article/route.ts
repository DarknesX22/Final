/**
 * GET /api/news/article?url=<encoded_url>&source=<source>
 *
 * Fetches the full article HTML from the given URL, extracts the main
 * article body using source-specific CSS selectors, and returns clean text.
 * This runs server-side to avoid CORS issues.
 */
import { NextRequest, NextResponse } from 'next/server';

// Source-specific article body selectors (most reliable → least)
const SELECTORS: Record<string, string[]> = {
  CoinDesk: [
    'div[data-module-name="article-body"]',
    '.article-body-content',
    'article .body',
    'article',
  ],
  CoinTelegraph: [
    '.post-content',
    'article .article__body',
    '.article__body',
    'article',
  ],
  Decrypt: [
    '.article-content',
    '.post-content',
    'article .entry-content',
    'article',
  ],
};

function extractText(html: string, source: string): string {
  // Remove script/style/nav/header/footer/aside blocks
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Try to find article body using source selectors
  const selectors = SELECTORS[source] ?? ['article', 'main'];
  let articleHtml = '';

  for (const sel of selectors) {
    // Simple tag match (e.g. "article", "main")
    const simpleTag = sel.match(/^(\w+)$/);
    if (simpleTag) {
      const match = cleaned.match(new RegExp(`<${simpleTag[1]}[^>]*>([\\s\\S]*?)<\\/${simpleTag[1]}>`, 'i'));
      if (match?.[1]) { articleHtml = match[1]; break; }
    }
    // Class selector (e.g. ".post-content")
    const classMatch = sel.match(/^\.(.+)$/);
    if (classMatch) {
      const cls = classMatch[1].replace(/-/g, '[\\-]');
      const match = cleaned.match(new RegExp(`<[^>]+class="[^"]*${cls}[^"]*"[^>]*>([\\s\\S]*?)<\\/[a-z]+>`, 'i'));
      if (match?.[1] && match[1].length > 200) { articleHtml = match[1]; break; }
    }
  }

  // Fallback: use full cleaned HTML
  if (!articleHtml || articleHtml.length < 200) articleHtml = cleaned;

  // Convert <p>, <h2>, <h3>, <li>, <br> to text with spacing
  const text = articleHtml
    .replace(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi, '\n\n## $1\n\n')
    .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n\n### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n"$1"\n')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1')
    .replace(/<[^>]+>/g, '')   // strip remaining tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url    = searchParams.get('url');
  const source = searchParams.get('source') ?? '';

  if (!url) {
    return NextResponse.json({ error: 'url param required' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Source returned ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    const text = extractText(html, source);

    return NextResponse.json(
      { content: text },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to fetch article', message: e.message }, { status: 500 });
  }
}
