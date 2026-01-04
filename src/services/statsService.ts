import { createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabase";
import * as types from "@/store/constants/actionTypes";
import type { DashboardStats } from "@/types/stats";

export const fetchDashboardStats = createAsyncThunk<DashboardStats>(
  types.STATS_FETCH_DASHBOARD,
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.rpc("get_dashboard_stats");

      if (error) {
        console.warn("❌ Error fetching dashboard stats:", error);
        throw new Error(error.message);
      }

      return data as DashboardStats;
    } catch (error) {
      console.warn("❌ fetchDashboardStats failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);
