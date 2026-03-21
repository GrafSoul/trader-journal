import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { NewsItem } from "@/types/news";
import { parseRssXml } from "@/utils/rssParser";
import * as types from "@/store/constants/actionTypes";

// ==================== RSS FETCHER ====================
async function fetchRssXml(url: string): Promise<string> {
  const isElectron =
    typeof window !== "undefined" && !!window.electronAPI?.fetchRss;

  if (isElectron) {
    const result = await window.electronAPI!.fetchRss(url);
    if (!result.ok || !result.data) {
      throw new Error(result.error ?? "Unknown Electron RSS fetch error");
    }
    return result.data;
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

// ==================== FETCH ALL NEWS THUNK ====================
export const fetchAllNews = createAsyncThunk<
  NewsItem[],
  void,
  { state: RootState }
>(types.NEWS_FETCH, async (_, { getState }) => {
  const state = getState();
  const feeds = state.news.feeds.filter((f) => f.enabled);

  if (feeds.length === 0) return [];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const xml = await fetchRssXml(feed.url);
      return parseRssXml(xml, { id: feed.id, name: feed.name, url: feed.url });
    })
  );

  const allItems: NewsItem[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    } else {
      console.warn(
        `[NewsService] Failed to fetch ${feeds[index].name}:`,
        result.reason
      );
    }
  });

  // Deduplicate by id, then sort by date desc
  const unique = [
    ...new Map(allItems.map((item) => [item.id, item])).values(),
  ];
  unique.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return unique;
});
