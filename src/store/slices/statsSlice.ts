import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Statuses } from "@/store/statuses/statuses";
import type { StatsState, DashboardStats } from "@/types/stats";
import { fetchDashboardStats } from "@/services/statsService";

const initialState: StatsState = {
  dashboard: null,
  status: Statuses.IDLE,
  error: null,
};

const statsSlice = createSlice({
  name: "stats",
  initialState,
  reducers: {
    resetStatsStatus: (state) => {
      state.status = Statuses.IDLE;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action: PayloadAction<DashboardStats>) => {
        state.status = Statuses.SUCCEEDED;
        state.dashboard = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });
  },
});

export const { resetStatsStatus } = statsSlice.actions;
export default statsSlice.reducer;
