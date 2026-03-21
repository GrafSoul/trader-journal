export type CalendarImpact = "High" | "Medium" | "Low" | "Holiday" | "Unknown";

export type CalendarRangeKey =
  | "today"
  | "tomorrow"
  | "thisWeek"
  | "nextWeek";

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  impact: CalendarImpact;
  timestamp: string;
  dateLabel: string;
  timeLabel: string;
  actual: string;
  forecast: string;
  previous: string;
  source: "forexFactory";
  week: "this" | "next";
  isAllDay: boolean;
  isTentative: boolean;
  country?: string | null;
  url?: string | null;
}

export interface CalendarState {
  items: CalendarEvent[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetchedAt: string | null;
}
