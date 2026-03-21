import { createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabase";
import type { NewsFeed } from "@/types/news";
import { DEFAULT_FEED_SEEDS } from "@/constants/newsFeeds";
import * as types from "@/store/constants/actionTypes";

// ==================== FETCH FEEDS ====================
export const fetchFeeds = createAsyncThunk<NewsFeed[]>(
  types.FEEDS_FETCH,
  async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("news_feeds")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[FeedService] DB error, using defaults:", error.message);
      return DEFAULT_FEED_SEEDS.map((s, i) => ({
        id: `default-${i}`,
        user_id: user.id,
        name: s.name,
        url: s.url,
        enabled: true,
        created_at: new Date().toISOString(),
      }));
    }

    // Seed default feeds for new users
    if (!data || data.length === 0) {
      const seeds = DEFAULT_FEED_SEEDS.map((s) => ({
        user_id: user.id,
        name: s.name,
        url: s.url,
        enabled: true,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from("news_feeds")
        .insert(seeds as never[])
        .select("*");

      if (insertError) {
        console.warn("[FeedService] Seed error, using defaults:", insertError.message);
        return DEFAULT_FEED_SEEDS.map((s, i) => ({
          id: `default-${i}`,
          user_id: user.id,
          name: s.name,
          url: s.url,
          enabled: true,
          created_at: new Date().toISOString(),
        }));
      }
      return inserted as NewsFeed[];
    }

    return data as NewsFeed[];
  }
);

// ==================== ADD FEED ====================
export const addFeed = createAsyncThunk<
  NewsFeed,
  { name: string; url: string }
>(types.FEEDS_ADD, async ({ name, url }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("news_feeds")
    .insert({ user_id: user.id, name, url, enabled: true } as never)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as NewsFeed;
});

// ==================== DELETE FEED ====================
export const deleteFeed = createAsyncThunk<string, string>(
  types.FEEDS_DELETE,
  async (feedId) => {
    const { error } = await supabase
      .from("news_feeds")
      .delete()
      .eq("id", feedId);

    if (error) throw new Error(error.message);
    return feedId;
  }
);

// ==================== UPDATE FEED ====================
export const updateFeed = createAsyncThunk<
  NewsFeed,
  { id: string; name: string; url: string }
>(types.FEEDS_UPDATE, async ({ id, name, url }) => {
  const { data, error } = await supabase
    .from("news_feeds")
    .update({ name, url } as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as NewsFeed;
});

// ==================== TOGGLE FEED ENABLED ====================
export const toggleFeedEnabled = createAsyncThunk<
  { id: string; enabled: boolean },
  { id: string; enabled: boolean }
>(types.FEEDS_TOGGLE, async ({ id, enabled }) => {
  const { error } = await supabase
    .from("news_feeds")
    .update({ enabled } as never)
    .eq("id", id);

  if (error) throw new Error(error.message);
  return { id, enabled };
});
