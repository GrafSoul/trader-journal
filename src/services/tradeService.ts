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
