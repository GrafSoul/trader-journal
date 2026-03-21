// ==================== NEWS TYPES ====================

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  categories: string[];
}

export interface NewsFeed {
  id: string;
  user_id: string;
  name: string;
  url: string;
  enabled: boolean;
  created_at: string;
}

export interface NewsFilters {
  search: string;
  sources: string[];
}

export interface NewsState {
  items: NewsItem[];
  filters: NewsFilters;
  feeds: NewsFeed[];
  feedsStatus: "idle" | "loading" | "succeeded" | "failed";
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetchedAt: string | null;
}
