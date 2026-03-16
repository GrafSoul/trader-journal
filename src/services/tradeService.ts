import { createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabase";
import * as types from "@/store/constants/actionTypes";
import type { Trade, CreateTradeDto, UpdateTradeDto, TradeFilters } from "@/types/trade";

// ==================== FETCH TRADES ====================
export const fetchTrades = createAsyncThunk<Trade[], TradeFilters | undefined>(
  types.TRADES_FETCH,
  async (filters, { rejectWithValue }) => {
    try {
      let query = supabase
        .from("trades")
        .select("*")
        .order("open_time", { ascending: false, nullsFirst: false });

      if (filters?.market) {
        query = query.eq("market", filters.market);
      }
      if (filters?.symbol) {
        query = query.ilike("symbol", `%${filters.symbol}%`);
      }
      if (filters?.side) {
        query = query.eq("side", filters.side);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.startDate) {
        query = query.gte("open_time", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("open_time", filters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("❌ Error fetching trades:", error);
        throw new Error(error.message);
      }

      return data as Trade[];
    } catch (error) {
      console.warn("❌ fetchTrades failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ==================== FETCH SINGLE TRADE ====================
export const fetchTrade = createAsyncThunk<Trade, string>(
  types.TRADES_FETCH_ONE,
  async (id, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.warn("❌ Error fetching trade:", error);
        throw new Error(error.message);
      }

      return data as Trade;
    } catch (error) {
      console.warn("❌ fetchTrade failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ==================== CREATE TRADE ====================
export const createTrade = createAsyncThunk<Trade, CreateTradeDto>(
  types.TRADES_CREATE,
  async (tradeData, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("trades")
        .insert({
          ...tradeData,
          user_id: user.id,
        } as never)
        .select()
        .single();

      if (error) {
        console.warn("❌ Error creating trade:", error);
        throw new Error(error.message);
      }

      return data as Trade;
    } catch (error) {
      console.warn("❌ createTrade failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ==================== UPDATE TRADE ====================
export const updateTrade = createAsyncThunk<Trade, UpdateTradeDto>(
  types.TRADES_UPDATE,
  async ({ id, ...tradeData }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .update(tradeData as never)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.warn("❌ Error updating trade:", error);
        throw new Error(error.message);
      }

      return data as Trade;
    } catch (error) {
      console.warn("❌ updateTrade failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ==================== DELETE TRADE ====================
export const deleteTrade = createAsyncThunk<string, string>(
  types.TRADES_DELETE,
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from("trades")
        .delete()
        .eq("id", id);

      if (error) {
        console.warn("❌ Error deleting trade:", error);
        throw new Error(error.message);
      }

      return id;
    } catch (error) {
      console.warn("❌ deleteTrade failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ==================== DELETE ALL TRADES ====================
export const deleteAllTrades = createAsyncThunk<void, void>(
  types.TRADES_DELETE_ALL,
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("trades")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.warn("❌ Error deleting all trades:", error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.warn("❌ deleteAllTrades failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ==================== BULK IMPORT TRADES ====================
export interface ImportResult {
  imported: Trade[];
  skipped: number;
}

export const bulkImportTrades = createAsyncThunk<ImportResult, CreateTradeDto[]>(
  types.TRADES_BULK_IMPORT,
  async (tradesData, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetch existing trades for deduplication
      interface ExistingTradeRow {
        external_id: string | null;
        symbol: string;
        open_time: string;
        close_time: string | null;
        volume: number;
      }

      const { data: rawExisting, error: fetchError } = await supabase
        .from("trades")
        .select("external_id, symbol, open_time, close_time, volume")
        .eq("user_id", user.id);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const existingTrades = (rawExisting ?? []) as unknown as ExistingTradeRow[];

      // Build set of existing external_ids for fast lookup
      const existingExternalIds = new Set<string>();
      for (const t of existingTrades) {
        if (t.external_id) {
          existingExternalIds.add(t.external_id);
        }
      }

      // Filter out duplicates - prefer external_id, fallback to field comparison
      const uniqueTrades = tradesData.filter(newTrade => {
        // Primary: check by external_id (Position ID)
        if (newTrade.external_id) {
          return !existingExternalIds.has(newTrade.external_id);
        }
        // Fallback: check by field comparison
        return !existingTrades.some(existing =>
          isDuplicate(newTrade, existing)
        );
      });

      const skippedCount = tradesData.length - uniqueTrades.length;

      if (uniqueTrades.length === 0) {
        return { imported: [], skipped: skippedCount };
      }

      // Insert in batches of 500 to avoid Supabase limits
      const BATCH_SIZE = 500;
      const allImported: Trade[] = [];

      for (let i = 0; i < uniqueTrades.length; i += BATCH_SIZE) {
        const batch = uniqueTrades.slice(i, i + BATCH_SIZE).map(trade => ({
          ...trade,
          user_id: user.id,
        }));

        const { data, error } = await supabase
          .from("trades")
          .insert(batch as never[])
          .select();

        if (error) {
          console.warn("❌ Error importing batch:", error);
          throw new Error(error.message);
        }

        if (data) {
          allImported.push(...(data as Trade[]));
        }
      }

      return { imported: allImported, skipped: skippedCount };
    } catch (error) {
      console.warn("❌ bulkImportTrades failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

function isDuplicate(
  newTrade: CreateTradeDto,
  existing: { symbol: string; open_time: string; close_time: string | null; volume: number }
): boolean {
  const normalizeTime = (t: string | null | undefined): string => {
    if (!t) return "";
    return t.slice(0, 19).replace(/\s/, "T");
  };

  const sameSymbol = (newTrade.symbol || "").toLowerCase() === (existing.symbol || "").toLowerCase();
  const sameOpenTime = normalizeTime(newTrade.open_time) === normalizeTime(existing.open_time);
  const sameCloseTime = normalizeTime(newTrade.close_time) === normalizeTime(existing.close_time);
  const sameVolume = Math.abs((newTrade.volume || 0) - (existing.volume || 0)) < 0.0001;

  return sameSymbol && sameOpenTime && sameCloseTime && sameVolume;
}
