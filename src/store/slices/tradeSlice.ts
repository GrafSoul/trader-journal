import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Statuses } from "@/store/statuses/statuses";
import type { TradeState, Trade, TradeFilters } from "@/types/trade";
import {
  fetchTrades,
  fetchTrade,
  createTrade,
  updateTrade,
  deleteTrade,
  bulkImportTrades,
  type ImportResult,
} from "@/services/tradeService";

// ==================== INITIAL STATE ====================
const initialState: TradeState = {
  trades: [],
  selectedTrade: null,
  filters: {},
  status: Statuses.IDLE,
  error: null,
};

// ==================== SLICE ====================
const tradeSlice = createSlice({
  name: "trades",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TradeFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearSelectedTrade: (state) => {
      state.selectedTrade = null;
    },
    clearTradeError: (state) => {
      state.error = null;
    },
    resetTradeStatus: (state) => {
      state.status = Statuses.IDLE;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ==================== FETCH TRADES ====================
    builder
      .addCase(fetchTrades.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(fetchTrades.fulfilled, (state, action: PayloadAction<Trade[]>) => {
        state.status = Statuses.SUCCEEDED;
        state.trades = action.payload;
      })
      .addCase(fetchTrades.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });

    // ==================== FETCH SINGLE TRADE ====================
    builder
      .addCase(fetchTrade.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(fetchTrade.fulfilled, (state, action: PayloadAction<Trade>) => {
        state.status = Statuses.SUCCEEDED;
        state.selectedTrade = action.payload;
      })
      .addCase(fetchTrade.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });

    // ==================== CREATE TRADE ====================
    builder
      .addCase(createTrade.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(createTrade.fulfilled, (state, action: PayloadAction<Trade>) => {
        state.status = Statuses.SUCCEEDED;
        state.trades.unshift(action.payload);
      })
      .addCase(createTrade.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });

    // ==================== UPDATE TRADE ====================
    builder
      .addCase(updateTrade.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(updateTrade.fulfilled, (state, action: PayloadAction<Trade>) => {
        state.status = Statuses.SUCCEEDED;
        const index = state.trades.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.trades[index] = action.payload;
        }
        if (state.selectedTrade?.id === action.payload.id) {
          state.selectedTrade = action.payload;
        }
      })
      .addCase(updateTrade.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });

    // ==================== DELETE TRADE ====================
    builder
      .addCase(deleteTrade.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(deleteTrade.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = Statuses.SUCCEEDED;
        state.trades = state.trades.filter((t) => t.id !== action.payload);
        if (state.selectedTrade?.id === action.payload) {
          state.selectedTrade = null;
        }
      })
      .addCase(deleteTrade.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });

    // ==================== BULK IMPORT TRADES ====================
    builder
      .addCase(bulkImportTrades.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(bulkImportTrades.fulfilled, (state, action: PayloadAction<ImportResult>) => {
        state.status = Statuses.SUCCEEDED;
        state.trades = [...action.payload.imported, ...state.trades];
      })
      .addCase(bulkImportTrades.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });
  },
});

// ==================== EXPORTS ====================
export const {
  setFilters,
  clearFilters,
  clearSelectedTrade,
  clearTradeError,
  resetTradeStatus,
} = tradeSlice.actions;

export default tradeSlice.reducer;
