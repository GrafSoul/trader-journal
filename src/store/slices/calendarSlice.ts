import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Statuses } from "@/store/statuses/statuses";
import type { CalendarEvent, CalendarState } from "@/types/calendar";
import { fetchCalendarEvents } from "@/services/calendarService";

const initialState: CalendarState = {
  items: [],
  status: Statuses.IDLE,
  error: null,
  lastFetchedAt: null,
};

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarEvents.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(
        fetchCalendarEvents.fulfilled,
        (state, action: PayloadAction<CalendarEvent[]>) => {
          state.status = Statuses.SUCCEEDED;
          state.items = action.payload;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchCalendarEvents.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) ?? "Failed to fetch calendar";
      });
  },
});

export default calendarSlice.reducer;
