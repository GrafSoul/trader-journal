import type { NewsItem } from "@/types/news";

interface FeedMeta {
  id: string;
  name: string;
  url: string;
}

// ==================== HTML STRIPPER ====================
export function stripHtml(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body?.textContent ?? "";
    // Normalize whitespace and trim to 500 chars
    return text.replace(/\s+/g, " ").trim().slice(0, 500);
  } catch {
    // Fallback: regex-based strip
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  }
}

// ==================== ID GENERATOR ====================
export function generateNewsId(link: string, pubDate: string): string {
  const raw = `${link}|${pubDate}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit int
  }
  return `news_${Math.abs(hash).toString(36)}`;
}

// ==================== IMAGE EXTRACTOR ====================
function extractImageUrl(item: Element, description: string): string | null {
  // 1. media:content
  const mediaContent = item.querySelector("content");
  if (mediaContent) {
    const url = mediaContent.getAttribute("url");
    if (url) return url;
  }

  // 2. media:thumbnail
  const mediaThumbnail = item.querySelector("thumbnail");
  if (mediaThumbnail) {
    const url = mediaThumbnail.getAttribute("url");
    if (url) return url;
  }

  // 3. enclosure
  const enclosure = item.querySelector("enclosure");
  if (enclosure) {
    const type = enclosure.getAttribute("type") ?? "";
    if (type.startsWith("image/")) {
      const url = enclosure.getAttribute("url");
      if (url) return url;
    }
  }

  // 4. img tag in description HTML
  const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(description);
  if (imgMatch?.[1]) {
    return imgMatch[1];
  }

  return null;
}

// ==================== RSS 2.0 PARSER ====================
function parseRssItems(doc: Document, feed: FeedMeta): NewsItem[] {
  const items = Array.from(doc.querySelectorAll("item"));
  const results: NewsItem[] = [];

  for (const item of items.slice(0, 50)) {
    const title = item.querySelector("title")?.textContent?.trim() ?? "";
    const rawDescription =
      item.querySelector("description")?.textContent?.trim() ?? "";
    const link =
      item.querySelector("link")?.textContent?.trim() ??
      item.querySelector("guid")?.textContent?.trim() ??
      "";
    const pubDate =
      item.querySelector("pubDate")?.textContent?.trim() ??
      item.querySelector("dc\\:date")?.textContent?.trim() ??
      new Date().toISOString();

    const imageUrl = extractImageUrl(item, rawDescription);
    const description = stripHtml(rawDescription);

    const categories = Array.from(item.querySelectorAll("category")).map(
      (c) => c.textContent?.trim() ?? ""
    );

    results.push({
      id: generateNewsId(link || title, pubDate),
      title: stripHtml(title),
      description,
      link,
      pubDate,
      source: feed.name,
      sourceUrl: feed.url,
      imageUrl,
      categories,
    });
  }

  return results;
}

// ==================== ATOM PARSER ====================
function parseAtomEntries(doc: Document, feed: FeedMeta): NewsItem[] {
  const entries = Array.from(doc.querySelectorAll("entry"));
  const results: NewsItem[] = [];

  for (const entry of entries.slice(0, 50)) {
    const title = entry.querySelector("title")?.textContent?.trim() ?? "";
    const rawSummary =
      entry.querySelector("summary")?.textContent?.trim() ??
      entry.querySelector("content")?.textContent?.trim() ??
      "";
    const link =
      entry.querySelector("link[rel='alternate']")?.getAttribute("href") ??
      entry.querySelector("link")?.getAttribute("href") ??
      entry.querySelector("id")?.textContent?.trim() ??
      "";
    const pubDate =
      entry.querySelector("published")?.textContent?.trim() ??
      entry.querySelector("updated")?.textContent?.trim() ??
      new Date().toISOString();

    const imageUrl = extractImageUrl(entry, rawSummary);
    const description = stripHtml(rawSummary);

    const categories = Array.from(entry.querySelectorAll("category")).map(
      (c) => c.getAttribute("term") ?? c.textContent?.trim() ?? ""
    );

    results.push({
      id: generateNewsId(link || title, pubDate),
      title: stripHtml(title),
      description,
      link,
      pubDate,
      source: feed.name,
      sourceUrl: feed.url,
      imageUrl,
      categories,
    });
  }

  return results;
}

// ==================== MAIN PARSER ====================
export function parseRssXml(xml: string, feedMeta: FeedMeta): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");

    // Check for parse errors
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      console.warn(`[RSS] Parse error for ${feedMeta.name}:`, parseError.textContent);
      return [];
    }

    const rootTag = doc.documentElement?.tagName?.toLowerCase() ?? "";

    // Atom feed
    if (rootTag === "feed") {
      return parseAtomEntries(doc, feedMeta);
    }

    // RSS 2.0 or RSS 1.0
    const items = doc.querySelectorAll("item");
    if (items.length > 0) {
      return parseRssItems(doc, feedMeta);
    }

    // Try Atom entries as fallback
    const entries = doc.querySelectorAll("entry");
    if (entries.length > 0) {
      return parseAtomEntries(doc, feedMeta);
    }

    console.warn(`[RSS] No items found for ${feedMeta.name}`);
    return [];
  } catch (error) {
    console.warn(`[RSS] Failed to parse ${feedMeta.name}:`, error);
    return [];
  }
}
