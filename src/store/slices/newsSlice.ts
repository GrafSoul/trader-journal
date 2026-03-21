import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Statuses } from "@/store/statuses/statuses";
import type { NewsState, NewsFilters, NewsItem, NewsFeed } from "@/types/news";
import { fetchAllNews } from "@/services/newsService";
import { fetchFeeds, addFeed, deleteFeed, updateFeed, toggleFeedEnabled } from "@/services/feedService";

// ==================== INITIAL STATE ====================
const initialFilters: NewsFilters = {
  search: "",
  sources: [],
};

const initialState: NewsState = {
  items: [],
  filters: initialFilters,
  feeds: [],
  feedsStatus: Statuses.IDLE,
  status: Statuses.IDLE,
  error: null,
  lastFetchedAt: null,
};

// ==================== SLICE ====================
const newsSlice = createSlice({
  name: "news",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<NewsFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialFilters;
    },
  },
  extraReducers: (builder) => {
    // ==================== FETCH FEEDS ====================
    builder
      .addCase(fetchFeeds.pending, (state) => {
        state.feedsStatus = Statuses.LOADING;
      })
      .addCase(fetchFeeds.fulfilled, (state, action: PayloadAction<NewsFeed[]>) => {
        state.feedsStatus = Statuses.SUCCEEDED;
        state.feeds = action.payload;
      })
      .addCase(fetchFeeds.rejected, (state, action) => {
        state.feedsStatus = Statuses.FAILED;
        state.error = action.error.message ?? "Failed to load feeds";
      });

    // ==================== ADD FEED ====================
    builder.addCase(addFeed.fulfilled, (state, action: PayloadAction<NewsFeed>) => {
      state.feeds.push(action.payload);
    });

    // ==================== DELETE FEED ====================
    builder.addCase(deleteFeed.fulfilled, (state, action: PayloadAction<string>) => {
      state.feeds = state.feeds.filter((f) => f.id !== action.payload);
    });

    // ==================== UPDATE FEED ====================
    builder.addCase(updateFeed.fulfilled, (state, action: PayloadAction<NewsFeed>) => {
      const idx = state.feeds.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) state.feeds[idx] = action.payload;
    });

    // ==================== TOGGLE FEED ====================
    builder.addCase(
      toggleFeedEnabled.fulfilled,
      (state, action: PayloadAction<{ id: string; enabled: boolean }>) => {
        const feed = state.feeds.find((f) => f.id === action.payload.id);
        if (feed) feed.enabled = action.payload.enabled;
      }
    );

    // ==================== FETCH ALL NEWS ====================
    builder
      .addCase(fetchAllNews.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(fetchAllNews.fulfilled, (state, action: PayloadAction<NewsItem[]>) => {
        state.status = Statuses.SUCCEEDED;
        state.items = action.payload;
        state.lastFetchedAt = new Date().toISOString();
      })
      .addCase(fetchAllNews.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.error.message ?? "Unknown error";
      });
  },
});

// ==================== EXPORTS ====================
export const { setFilters, clearFilters } = newsSlice.actions;

export default newsSlice.reducer;
